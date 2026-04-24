import { createWorker, OEM, PSM } from 'tesseract.js'

import { parseFrontCard, parseBackCard } from './insuranceParsers.js'
import { createEmptyMedauthForm, mergeMedauthParsed, MEDAUTH_FORM_KEYS } from './medauthForm.js'

export const EMPTY_EXTRACTED_DATA = createEmptyMedauthForm()

export { mergeMedauthParsed as mergeParsedData }

/** Target long edge (px) for OCR; improves small phone photos without huge slowdowns. */
const OCR_TARGET_LONG_EDGE = 2200
const OCR_MAX_SCALE = 3

export function cleanFieldValue(value) {
  return value?.trim().replace(/[|]/g, '').replace(/\s{2,}/g, ' ') ?? ''
}

export function normalizeOcrText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

function getFieldCompletenessScore(parsed) {
  return MEDAUTH_FORM_KEYS.filter((k) => cleanFieldValue(parsed[k]).length > 0).length
}

/**
 * @param {string} rawText
 * @param {'front' | 'back'} side
 */
function scoreOcrCandidate(rawText, side) {
  const text = normalizeOcrText(rawText || '')
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const usefulLines = lines.filter((line) => /[A-Za-z0-9]/.test(line)).length
  const parsed =
    side === 'front'
      ? parseFrontCard(text)
      : parseBackCard(text, { rxAdminFromFront: '' })
  const parsedScore = getFieldCompletenessScore(parsed) * 80
  return {
    text,
    parsed,
    score: text.length + usefulLines * 12 + parsedScore,
  }
}

async function runRecognizePass(worker, blob, psm) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })
  const result = await worker.recognize(blob, {}, { text: true })
  return result?.data?.text ?? ''
}

/**
 * @param {import('tesseract.js').Worker} worker
 * @param {'front' | 'back'} side
 * @param {Blob} primaryBlob
 * @param {Blob | null} fallbackBlob
 */
async function recognizeBestText(worker, side, primaryBlob, fallbackBlob = null) {
  const candidates = []
  const pass1 = await runRecognizePass(worker, primaryBlob, PSM.AUTO)
  candidates.push(scoreOcrCandidate(pass1, side))

  const pass2 = await runRecognizePass(worker, primaryBlob, PSM.SPARSE_TEXT)
  candidates.push(scoreOcrCandidate(pass2, side))

  if (fallbackBlob) {
    const pass3 = await runRecognizePass(worker, fallbackBlob, PSM.AUTO_OSD)
    candidates.push(scoreOcrCandidate(pass3, side))
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

/**
 * Upscale + grayscale + contrast for Tesseract (especially phone photos).
 * @param {Blob} imageBlob
 * @returns {Promise<Blob>}
 */
export function prepareImageForOcrBlob(imageBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageBlob)
    const img = new Image()
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        const longEdge = Math.max(w, h)
        const scale =
          longEdge < OCR_TARGET_LONG_EDGE
            ? Math.min(OCR_MAX_SCALE, OCR_TARGET_LONG_EDGE / longEdge)
            : 1

        const outW = Math.round(w * scale)
        const outH = Math.round(h * scale)

        const canvas = document.createElement('canvas')
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.filter = 'grayscale(1) contrast(1.12)'
        ctx.drawImage(img, 0, 0, outW, outH)

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (!blob) {
              reject(new Error('prepareImageForOcrBlob: empty blob'))
              return
            }
            resolve(blob)
          },
          'image/png',
          1,
        )
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('prepareImageForOcrBlob: image load failed'))
    }
    img.src = url
  })
}

/**
 * Runs OCR on prepared blobs with one worker (loads `eng+spa` once), then terminates.
 * @param {object} opts
 * @param {Blob | null} opts.frontBlob
 * @param {Blob | null} opts.backBlob
 * @param {Blob | null} [opts.frontFallbackBlob]
 * @param {Blob | null} [opts.backFallbackBlob]
 * @param {(n: number) => void} [opts.onProgress] 0–100
 * @param {(msg: object) => void} [opts.logger]
 */
export async function runInsuranceCardOcr({
  frontBlob,
  backBlob,
  frontFallbackBlob = null,
  backFallbackBlob = null,
  onProgress,
  logger,
}) {
  const out = {
    rawFront: '',
    rawBack: '',
    parsedFront: { ...EMPTY_EXTRACTED_DATA },
    parsedBack: { ...EMPTY_EXTRACTED_DATA },
  }

  if (!frontBlob && !backBlob) {
    return out
  }

  const both = Boolean(frontBlob && backBlob)
  let phase = frontBlob ? 'front' : 'back'

  const worker = await createWorker('eng+spa', OEM.LSTM_ONLY, {
    logger: (message) => {
      logger?.(message)
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        const p = message.progress
        if (both) {
          const base = phase === 'front' ? 0 : 0.5
          onProgress?.(Math.round((base + p * 0.5) * 100))
        } else {
          onProgress?.(Math.round(p * 100))
        }
      }
    },
  })

  try {
    if (frontBlob) {
      const bestFront = await recognizeBestText(worker, 'front', frontBlob, frontFallbackBlob)
      out.rawFront = bestFront.text
      phase = 'back'
    }

    if (backBlob) {
      const bestBack = await recognizeBestText(worker, 'back', backBlob, backFallbackBlob)
      out.rawBack = bestBack.text
    }

    onProgress?.(100)

    if (out.rawFront) {
      out.parsedFront = parseFrontCard(normalizeOcrText(out.rawFront))
    }
    if (out.rawBack) {
      out.parsedBack = parseBackCard(normalizeOcrText(out.rawBack), {
        rxAdminFromFront: out.parsedFront?.rxAdmin || '',
      })
    }
  } finally {
    await worker.terminate()
  }

  return out
}

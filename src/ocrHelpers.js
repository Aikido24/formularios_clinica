import { createWorker, OEM, PSM } from 'tesseract.js'

import { parseFrontCard, parseBackCard } from './insuranceParsers.js'
import { createEmptyMedauthForm, mergeMedauthParsed, MEDAUTH_FORM_KEYS } from './medauthForm.js'

export const EMPTY_EXTRACTED_DATA = createEmptyMedauthForm()

export { mergeMedauthParsed as mergeParsedData }

/** Target long edge (px) for OCR; improves small phone photos without huge slowdowns. */
const OCR_TARGET_LONG_EDGE = 2200
const OCR_MAX_SCALE = 3
const SHARPNESS_SAMPLE_EDGE = 640

/** @typedef {'good' | 'fair' | 'poor'} OcrQualityLevel */

/** @typedef {{ level: OcrQualityLevel; sharpness: number; confidence: number; fieldsFound: number; message: string }} OcrReadability */

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
function scoreOcrCandidate(rawText, confidence, side) {
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
    confidence,
    score: text.length + usefulLines * 12 + parsedScore + confidence * 2,
  }
}

async function runRecognizePass(worker, blob, psm) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })
  const result = await worker.recognize(blob, {}, { text: true })
  return {
    text: result?.data?.text ?? '',
    confidence: typeof result?.data?.confidence === 'number' ? result.data.confidence : 0,
  }
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
  candidates.push(scoreOcrCandidate(pass1.text, pass1.confidence, side))

  const pass2 = await runRecognizePass(worker, primaryBlob, PSM.SPARSE_TEXT)
  candidates.push(scoreOcrCandidate(pass2.text, pass2.confidence, side))

  if (fallbackBlob) {
    const pass3 = await runRecognizePass(worker, fallbackBlob, PSM.AUTO_OSD)
    candidates.push(scoreOcrCandidate(pass3.text, pass3.confidence, side))
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

/**
 * Laplacian variance — higher values usually mean a sharper image.
 * @param {ImageData} imageData
 */
function laplacianVariance(imageData) {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const px = i * 4
    gray[i] = data[px] * 0.299 + data[px + 1] * 0.587 + data[px + 2] * 0.114
  }

  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const lap = Math.abs(
        -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - width] + gray[idx + width],
      )
      sum += lap
      sumSq += lap * lap
      count++
    }
  }
  if (!count) return 0
  const mean = sum / count
  return sumSq / count - mean * mean
}

/**
 * Estimates whether a photo is sharp enough for OCR (client-side, no Tesseract).
 * @param {Blob} imageBlob
 * @returns {Promise<number>}
 */
export function assessImageSharpness(imageBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageBlob)
    const img = new Image()
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        const longEdge = Math.max(w, h)
        const scale = longEdge > SHARPNESS_SAMPLE_EDGE ? SHARPNESS_SAMPLE_EDGE / longEdge : 1
        const outW = Math.max(1, Math.round(w * scale))
        const outH = Math.max(1, Math.round(h * scale))

        const canvas = document.createElement('canvas')
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, outW, outH)
        const variance = laplacianVariance(ctx.getImageData(0, 0, outW, outH))
        URL.revokeObjectURL(url)
        resolve(variance)
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('assessImageSharpness: image load failed'))
    }
    img.src = url
  })
}

/**
 * Combines image sharpness + Tesseract confidence + parsed field count.
 * @param {object} opts
 * @param {number} opts.sharpness
 * @param {number} opts.confidence
 * @param {Record<string, string>} opts.parsed
 */
export function evaluateOcrReadability({ sharpness, confidence, parsed }) {
  const fieldsFound = getFieldCompletenessScore(parsed)

  let sharpLevel = /** @type {OcrQualityLevel} */ ('good')
  if (sharpness < 40) sharpLevel = 'poor'
  else if (sharpness < 120) sharpLevel = 'fair'

  let confLevel = /** @type {OcrQualityLevel} */ ('good')
  if (confidence < 60) confLevel = 'poor'
  else if (confidence < 75) confLevel = 'fair'

  let dataLevel = /** @type {OcrQualityLevel} */ ('good')
  if (fieldsFound === 0 && confidence < 60) dataLevel = 'poor'
  else if (fieldsFound < 2 || confidence < 65) dataLevel = 'fair'

  /** @type {OcrQualityLevel} */
  const level = [sharpLevel, confLevel, dataLevel].includes('poor')
    ? 'poor'
    : [sharpLevel, confLevel, dataLevel].includes('fair')
      ? 'fair'
      : 'good'

  const message =
    level === 'good'
      ? 'Data extracted successfully'
      : level === 'fair'
        ? 'Image may be unclear — verify extracted data or retake photo'
        : 'Image is too blurry to read — please retake a clearer photo'

  return { level, sharpness, confidence, fieldsFound, message }
}

/** @param {OcrQualityLevel | '' | null | undefined} level */
export function getOcrQualityLabel(level) {
  if (level === 'good') return 'Good'
  if (level === 'fair') return 'Fair'
  if (level === 'poor') return 'Poor'
  return '—'
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
 * @param {Blob | null} [opts.frontSharpnessBlob] original image for sharpness check
 * @param {Blob | null} [opts.backSharpnessBlob]
 * @param {(n: number) => void} [opts.onProgress] 0–100
 * @param {(msg: object) => void} [opts.logger]
 */
export async function runInsuranceCardOcr({
  frontBlob,
  backBlob,
  frontFallbackBlob = null,
  backFallbackBlob = null,
  frontSharpnessBlob = null,
  backSharpnessBlob = null,
  onProgress,
  logger,
}) {
  const out = {
    rawFront: '',
    rawBack: '',
    parsedFront: { ...EMPTY_EXTRACTED_DATA },
    parsedBack: { ...EMPTY_EXTRACTED_DATA },
    qualityFront: /** @type {OcrReadability | null} */ (null),
    qualityBack: /** @type {OcrReadability | null} */ (null),
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
      const sharpness = frontSharpnessBlob ? await assessImageSharpness(frontSharpnessBlob) : 0
      const bestFront = await recognizeBestText(worker, 'front', frontBlob, frontFallbackBlob)
      out.rawFront = bestFront.text
      out.qualityFront = evaluateOcrReadability({
        sharpness,
        confidence: bestFront.confidence,
        parsed: bestFront.parsed,
      })
      phase = 'back'
    }

    if (backBlob) {
      const sharpness = backSharpnessBlob ? await assessImageSharpness(backSharpnessBlob) : 0
      const bestBack = await recognizeBestText(worker, 'back', backBlob, backFallbackBlob)
      out.rawBack = bestBack.text
      out.qualityBack = evaluateOcrReadability({
        sharpness,
        confidence: bestBack.confidence,
        parsed: bestBack.parsed,
      })
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

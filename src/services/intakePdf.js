import { jsPDF } from 'jspdf'

import { CLINICA_FORM_SECTIONS } from '../components/medauth/clinicaFormFields.js'
import { getIntakeFormRows, formatRowValue } from '../components/medauth/intakeFormRows.js'

const MARGIN = 14
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const LABEL_W = 62
const LINE_H = 5.5

/** @param {string} name */
function slugifyFilename(name) {
  return (
    String(name || 'patient')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'patient'
  )
}

/** @param {string} dataUrl */
function parseDataUrl(dataUrl) {
  const s = String(dataUrl || '').trim()
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(s)
  if (!m) return null
  const mime = m[1].toLowerCase()
  const format = mime.includes('png') ? 'PNG' : 'JPEG'
  return { format, data: m[2] }
}

/**
 * @param {jsPDF} doc
 * @param {number} y
 * @param {number} needed
 */
function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

/**
 * @param {jsPDF} doc
 * @param {number} startY
 * @param {string} title
 */
function sectionTitle(doc, startY, title) {
  let y = ensureSpace(doc, startY, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 58, 95)
  doc.text(title, MARGIN, y)
  y += 7
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  return y + 5
}

/**
 * @param {jsPDF} doc
 * @param {number} startY
 * @param {[string, unknown][]} rows
 */
function drawRows(doc, startY, rows) {
  let y = startY
  doc.setFontSize(9)
  for (const [label, value] of rows) {
    const val = formatRowValue(value)
    const valLines = doc.splitTextToSize(val, CONTENT_W - LABEL_W - 4)
    const blockH = Math.max(LINE_H, valLines.length * LINE_H)
    y = ensureSpace(doc, y, blockH + 2)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(String(label), MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(valLines, MARGIN + LABEL_W, y)
    y += blockH + 2
  }
  return y
}

/** @param {Record<string, unknown>} extracted */
function getOcrRows(extracted) {
  /** @type {[string, string][]} */
  const rows = []
  for (const section of CLINICA_FORM_SECTIONS) {
    for (const field of section.fields) {
      const val = String(extracted[field.key] ?? '').trim()
      if (val) rows.push([field.label, val])
    }
  }
  return rows
}

/**
 * @param {jsPDF} doc
 * @param {number} startY
 * @param {string} title
 * @param {string} dataUrl
 */
async function drawCardImage(doc, startY, title, dataUrl) {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return startY

  let y = sectionTitle(doc, startY, title)
  y = ensureSpace(doc, y, 80)

  const props = doc.getImageProperties(`data:image/${parsed.format === 'PNG' ? 'png' : 'jpeg'};base64,${parsed.data}`)
  const maxW = CONTENT_W
  const maxH = PAGE_H - MARGIN - y - 10
  const scale = Math.min(maxW / props.width, maxH / props.height, 1)
  const w = props.width * scale
  const h = props.height * scale

  if (h > maxH) {
    doc.addPage()
    y = MARGIN + 10
  }

  doc.addImage(parsed.data, parsed.format, MARGIN, y, w, h)
  return y + h + 10
}

/**
 * @param {object} opts
 * @param {Record<string, unknown>} opts.intakeForm
 * @param {Record<string, unknown>} opts.extractedData
 * @param {string} [opts.b64Front]
 * @param {string} [opts.b64Back]
 */
export async function buildIntakePdf({ intakeForm, extractedData, b64Front, b64Back }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const patientName = String(intakeForm?.patientName || '').trim() || 'Patient'
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 95)
  doc.text('The Advanced Bariatric Surgery Center', MARGIN, 18)
  doc.setFontSize(12)
  doc.text('INTAKE FORM', MARGIN, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${dateStr}`, MARGIN, 32)

  let y = sectionTitle(doc, 38, 'Patient intake')
  y = drawRows(doc, y, getIntakeFormRows(intakeForm))

  const ocrRows = getOcrRows(extractedData || {})
  if (ocrRows.length) {
    y = sectionTitle(doc, y + 4, 'Insurance card data (OCR)')
    y = drawRows(doc, y, ocrRows)
  }

  if (b64Front) {
    if (y > PAGE_H - 100) {
      doc.addPage()
      y = MARGIN
    }
    y = await drawCardImage(doc, y + 4, 'Insurance card — front', b64Front)
  }

  if (b64Back) {
    if (y > PAGE_H - 100) {
      doc.addPage()
      y = MARGIN
    }
    y = await drawCardImage(doc, y + 4, 'Insurance card — back', b64Back)
  }

  const arrayBuffer = doc.output('arraybuffer')
  const bytes = new Uint8Array(arrayBuffer)
  const base64 = doc.output('datauristring').split(',')[1] || ''
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `intake-${slugifyFilename(patientName)}-${stamp}.pdf`

  return { bytes, base64, filename }
}

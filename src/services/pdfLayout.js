import { formatRowValue } from '../components/medauth/intakeFormRows.js'

export const MARGIN = 14
export const PAGE_W = 210
export const PAGE_H = 297
export const CONTENT_W = PAGE_W - MARGIN * 2
export const LABEL_W = 62
export const LINE_H = 5.5

/**
 * @param {string} name
 */
export function slugifyFilename(name) {
  return (
    String(name || 'patient')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'patient'
  )
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @param {number} needed
 */
export function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} startY
 * @param {string} title
 */
export function sectionTitle(doc, startY, title) {
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
 * @param {import('jspdf').jsPDF} doc
 * @param {number} startY
 * @param {[string, unknown][]} rows
 */
export function drawRows(doc, startY, rows) {
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


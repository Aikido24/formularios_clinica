import { jsPDF } from 'jspdf'

import { getCallScriptFormRows } from '../components/medauth/callScriptFormRows.js'
import { MARGIN, PAGE_H, slugifyFilename, sectionTitle, drawRows } from './pdfLayout.js'

/**
 * Build a PDF with all fields from the Step 2 questionnaire (call worksheet).
 *
 * @param {object} opts
 * @param {Record<string, unknown>} opts.callForm
 */
export async function buildWorksheetPdf({ callForm }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const patientName = String(callForm?.patientName || '').trim() || 'Patient'
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 95)
  doc.text('The Advanced Bariatric Surgery Center', MARGIN, 18)
  doc.setFontSize(12)
  doc.text('VERIFICATION WORKSHEET', MARGIN, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${dateStr}`, MARGIN, 32)

  let y = sectionTitle(doc, 38, 'Worksheet')
  const sections = getCallScriptFormRows(callForm)

  for (const section of sections) {
    y = sectionTitle(doc, y + 4, section.title)
    y = drawRows(doc, y, section.rows)
    y += 4
    if (y > PAGE_H - 30) {
      doc.addPage()
      y = MARGIN
    }
  }

  const arrayBuffer = doc.output('arraybuffer')
  const bytes = new Uint8Array(arrayBuffer)
  const base64 = doc.output('datauristring').split(',')[1] || ''
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `worksheet-${slugifyFilename(patientName)}-${stamp}.pdf`

  return { bytes, base64, filename }
}


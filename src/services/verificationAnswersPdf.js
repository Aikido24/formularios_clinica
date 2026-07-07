import { jsPDF } from 'jspdf'

import { getVerificationAnswerRows } from '../components/medauth/verificationQuestionsModel.js'
import { MARGIN, PAGE_H, slugifyFilename, sectionTitle, drawRows } from './pdfLayout.js'

/**
 * @param {object} opts
 * @param {Record<string, string>} opts.answers
 * @param {Record<string, unknown>} [opts.intakeForm]
 */
export async function buildVerificationAnswersPdf({ answers, intakeForm }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const patientName = String(intakeForm?.patientName || '').trim() || 'Patient'
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 95)
  doc.text('The Advanced Bariatric Surgery Center', MARGIN, 18)
  doc.setFontSize(12)
  doc.text('INSURANCE VERIFICATION ANSWERS', MARGIN, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${dateStr}`, MARGIN, 32)

  let y = sectionTitle(doc, 38, 'Phone verification checklist')
  y = drawRows(doc, y, getVerificationAnswerRows(answers, intakeForm))

  const arrayBuffer = doc.output('arraybuffer')
  const bytes = new Uint8Array(arrayBuffer)
  const base64 = doc.output('datauristring').split(',')[1] || ''
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `verification-${slugifyFilename(patientName)}-${stamp}.pdf`

  return { bytes, base64, filename }
}

import { submitPdfEmail } from './pdfEmailSubmit.js'

/**
 * @param {object} opts
 * @param {string} opts.pdfBase64
 * @param {string} opts.filename
 * @param {Record<string, unknown>} opts.intakeForm
 */
export async function submitIntakePdfEmail({ pdfBase64, filename, intakeForm }) {
  const patientName = String(intakeForm?.patientName || '').trim() || 'Patient'
  await submitPdfEmail({
    pdfBase64,
    filename,
    subject: `MedAuth Pro — ${patientName} — Intake form`,
    text: `Intake form PDF attached for ${patientName}.`,
  })
}

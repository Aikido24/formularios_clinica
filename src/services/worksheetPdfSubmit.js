import { submitPdfEmail } from './pdfEmailSubmit.js'

/**
 * @param {object} opts
 * @param {string} opts.pdfBase64
 * @param {string} opts.filename
 * @param {Record<string, unknown>} opts.callForm
 */
export async function submitWorksheetPdfEmail({ pdfBase64, filename, callForm }) {
  const patientName = String(callForm?.patientName || '').trim() || 'Patient'
  return submitPdfEmail({
    pdfBase64,
    filename,
    subject: `MedAuth Pro — ${patientName} — Verification worksheet`,
    text: `Verification worksheet PDF attached for ${patientName}.`,
  })
}


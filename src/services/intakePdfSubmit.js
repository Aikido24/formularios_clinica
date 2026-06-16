import { httpsCallable } from 'firebase/functions'

import { auth, ensureCallableAuth, functions } from '../firebase.js'

/**
 * @param {object} opts
 * @param {string} opts.pdfBase64
 * @param {string} opts.filename
 * @param {Record<string, unknown>} opts.intakeForm
 */
export async function submitIntakePdfEmail({ pdfBase64, filename, intakeForm }) {
  await ensureCallableAuth()
  const patientName = String(intakeForm?.patientName || '').trim() || 'Patient'
  const idToken = await auth.currentUser?.getIdToken()
  const submitIntakePdf = httpsCallable(functions, 'submitIntakePdf')
  await submitIntakePdf({
    subject: `MedAuth Pro — ${patientName} — Intake form`,
    text: `Intake form PDF attached for ${patientName}.`,
    pdf_base64: pdfBase64,
    filename,
    _idToken: idToken,
  })
}

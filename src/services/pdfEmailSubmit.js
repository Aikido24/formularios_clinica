import { httpsCallable } from 'firebase/functions'

import { auth, ensureCallableAuth, functions } from '../firebase.js'

/**
 * Sends a generated PDF (base64) as an email attachment using the callable `submitIntakePdf`.
 *
 * @param {object} opts
 * @param {string} opts.pdfBase64
 * @param {string} opts.filename
 * @param {string} opts.subject
 * @param {string} opts.text
 */
export async function submitPdfEmail({ pdfBase64, filename, subject, text }) {
  await ensureCallableAuth()
  const idToken = await auth.currentUser?.getIdToken()
  const submitIntakePdf = httpsCallable(functions, 'submitIntakePdf')
  await submitIntakePdf({
    subject,
    text,
    pdf_base64: pdfBase64,
    filename,
    _idToken: idToken,
  })
}


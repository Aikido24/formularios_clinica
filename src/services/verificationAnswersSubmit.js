import { buildVerificationAnswersEmailText } from '../components/medauth/verificationQuestionsModel.js'
import { submitPdfEmail } from './pdfEmailSubmit.js'

/**
 * @param {object} opts
 * @param {string} opts.pdfBase64
 * @param {string} opts.filename
 * @param {Record<string, string>} opts.answers
 * @param {Record<string, unknown>} [opts.intakeForm]
 */
export async function submitVerificationAnswersEmail({ pdfBase64, filename, answers, intakeForm }) {
  const patientName = String(intakeForm?.patientName || '').trim() || 'Patient'
  const text = buildVerificationAnswersEmailText(answers, intakeForm)
  await submitPdfEmail({
    pdfBase64,
    filename,
    subject: `MedAuth Pro — ${patientName} — Insurance verification answers`,
    text,
  })
}

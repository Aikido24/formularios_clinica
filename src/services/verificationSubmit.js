import { httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

import { auth, ensureCallableAuth, functions, getStorageInstances } from '../firebase.js'
import { DEFAULT_REPORT_EMAIL } from '../medauthForm.js'
import { getIntakeFormRows } from '../components/medauth/intakeFormRows.js'

/**
 * @typedef {ReturnType<import('../medauthForm.js').createEmptyScriptAnswers>} VerificationScriptAnswers
 */

export function getReportDestEmail() {
  return DEFAULT_REPORT_EMAIL
}

/** @param {string} value */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** @param {string} value */
export function escapeHtmlAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** Prefer HTTPS Storage URL for email img src. */
export function pickCardImageSrc(dataUrlB64, storageUrl) {
  const url = String(storageUrl || '').trim()
  if (/^https?:\/\//i.test(url)) return url
  return String(dataUrlB64 || '').trim()
}

/**
 * @param {ReturnType<import('../medauthForm.js').createEmptyMedauthForm>} form
 * @param {VerificationScriptAnswers} script
 * @param {Record<string, unknown> | null} [intakeForm]
 * @param {Record<string, unknown> | null} [callScriptForm]
 */
export function buildVerificationReport(form, script, intakeForm = null, callScriptForm = null) {
  const base = {
    nombre: (form.subscriberName || form.memberName || '').trim(),
    fechaNac: form.dob.trim(),
    telefono: form.phoneCustomerService.trim(),
    aseguradora: form.insuranceCompany.trim(),
    subscriberName: form.subscriberName.trim(),
    memberName: form.memberName.trim(),
    memberId: form.memberId.trim(),
    subscriberId: form.subscriberId.trim(),
    groupNum: form.groupNumber.trim(),
    planName: form.planName.trim(),
    planType: form.planType.trim(),
    effectiveDate: form.effectiveDate.trim(),
    dob: form.dob.trim(),
    network: form.network.trim(),
    coverage: form.coverage.trim(),
    copayPCP: form.copayPCP.trim(),
    copaySpec: form.copaySpecialist.trim(),
    copayER: form.copayEr.trim(),
    copayUrgent: form.copayUrgent.trim(),
    deductible: form.deductible.trim(),
    coinsurance: form.coinsurance.trim(),
    rxBin: form.rxBin.trim(),
    rxPcn: form.rxPcn.trim(),
    rxGrp: form.rxGroup.trim(),
    pcpName: form.pcpName.trim(),
    pcpPhone: form.pcpPhone.trim(),
    phoneSeguro: form.phoneCustomerService.trim(),
    phoneAuth: form.phonePreauth.trim(),
    website: form.website.trim(),
    cobertura: script.cobertura.trim(),
    autorizacion: script.autorizacion.trim(),
    referencia: script.referencia.trim(),
    facilidad: script.facilidad.trim(),
    facilidadDetalle: script.facilidadDetalle.trim(),
    deducibleTotal: script.deducibleTotal.trim(),
    deducibleMet: script.deducibleMet.trim(),
    copago: script.copago.trim(),
    oopMax: script.oopMax.trim(),
    notasRep: script.notasRep.trim(),
    repName: script.repName.trim(),
    refNum: script.refNum.trim(),
    emailDestino: getReportDestEmail(),
    fecha: new Date(),
  }
  const out = { ...base }
  if (intakeForm && typeof intakeForm === 'object') {
    out.intakeForm = { ...intakeForm }
  }
  if (callScriptForm && typeof callScriptForm === 'object') {
    out.callScriptForm = { ...callScriptForm }
  }
  return out
}

/**
 * @param {ReturnType<typeof buildVerificationReport> & { b64Front?: string; b64Back?: string; urlFrente?: string; urlReverso?: string; resultado?: string; expedienteId?: string }} data
 */
export function evaluar(data) {
  const cobOK = ['Yes', 'Partial', 'Si', 'Parcial'].includes(data.cobertura)
  const auth = data.autorizacion || ''
  const authOK =
    auth.includes('Obtained') ||
    auth.includes('Obtenida') ||
    auth.includes('Not required') ||
    auth.includes('No Requerida')
  return cobOK && authOK ? 'ELIGIBLE' : 'NOT ELIGIBLE'
}

function ynLabel(v) {
  if (v === 'yes') return 'Yes'
  if (v === 'no') return 'No'
  return ''
}

/**
 * Maps intake + call worksheet into fields required by firebase-functions submitVerificationReport.
 * @param {Record<string, unknown>} data
 * @param {{ intakeForm?: Record<string, unknown>; callForm?: Record<string, unknown> }} sources
 */
export function enrichReportForCallable(data, { intakeForm, callForm } = {}) {
  const intake = intakeForm && typeof intakeForm === 'object' ? intakeForm : {}
  const cs = callForm && typeof callForm === 'object' ? callForm : {}
  const nombre =
    String(data.nombre || '').trim() ||
    String(cs.patientName || '').trim() ||
    String(intake.patientName || '').trim() ||
    'Patient'
  const memberId =
    String(data.memberId || '').trim() ||
    String(cs.insuranceId || '').trim() ||
    String(intake.primaryId || '').trim() ||
    '—'
  const groupNum =
    String(data.groupNum || '').trim() ||
    String(cs.groupNumber || '').trim() ||
    String(intake.primaryGroup || '').trim() ||
    '—'
  const authParts = []
  if (cs.bariatricsInPtAuthReq) {
    authParts.push(`Bariatric IP auth: ${ynLabel(cs.bariatricsInPtAuthReq) || cs.bariatricsInPtAuthReq}`)
  }
  if (cs.plasticsAuthReq) {
    authParts.push(`Plastics auth: ${ynLabel(cs.plasticsAuthReq) || cs.plasticsAuthReq}`)
  }
  if (cs.definiteExclusion) {
    authParts.push(`Definite exclusion: ${ynLabel(cs.definiteExclusion) || cs.definiteExclusion}`)
  }
  const autorizacionFinal = authParts.join(' · ') || 'Recorded on verification worksheet'
  const resultado = String(data.resultado || '').trim() || 'PENDING'
  return { ...data, nombre, memberId, groupNum, autorizacionFinal, resultado }
}

function emailCardImgTag(src, alt) {
  if (!src) {
    return `<div style="width:100%;height:100px;background:#1e1e2e;border:1px dashed #334155;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#475569;font-size:12px;">No image</div>`
  }
  const safe = escapeHtmlAttr(src)
  return `<img src="${safe}" alt="${escapeHtmlAttr(alt)}" style="width:100%;max-width:280px;border-radius:8px;border:2px solid #2d2d3d;display:block;margin:0 auto;"/>`
}

/** @param {Record<string, unknown>} intake */
function intakeFormEmailSection(intake, fila) {
  const rows = getIntakeFormRows(intake).map(([lab, val]) => [`Intake — ${lab}`, val])
  const body = rows.map(([lab, val]) => fila(lab, val)).join('')
  return `
<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#f59e0b;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Clinic intake form</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${body}
  </table>
</div>`
}

/** @param {Record<string, unknown>} cs */
function callScriptWorksheetEmailSection(cs, fila) {
  const c = cs || {}
  const rows = [
    ['Worksheet — Patient', c.patientName],
    ['Worksheet — DOB', c.patientDob],
    ['Worksheet — Insured', c.insured],
    ['Worksheet — Insurance / Phone', [c.insuranceName, c.insurancePhone].filter(Boolean).join(' · ')],
    ['Worksheet — ID # / Group #', [c.insuranceId, c.groupNumber].filter(Boolean).join(' · ')],
    ['Worksheet — Spoke with / Call ref #', [c.spokeWith, c.callRefNumber].filter(Boolean).join(' · ')],
    ['Worksheet — Plan type / Effective date', [c.planType, c.effectiveDate].filter(Boolean).join(' · ')],
    ['Worksheet — PCP', c.pcpName],
    ['Worksheet — Third-party auth portal', c.thirdPartyAuthPortal],
    ['Worksheet — In-net OV copay / Deductible', [c.inNetOvCopay, c.inNetDeductible].filter(Boolean).join(' · ')],
    ['Worksheet — Out-of-net OV copay / Deductible', [c.outNetOvCopay, c.outNetDeductible].filter(Boolean).join(' · ')],
    ['Worksheet — General notes', c.generalNotes],
    ['Worksheet — Comorbidities (notes)', c.comorbiditiesNotes],
    ['Worksheet — Final note', c.finalNote],
  ]
  const body = rows.map(([lab, val]) => fila(lab, val)).join('')
  return `
<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#22c55e;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Verification call worksheet</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${body}
  </table>
</div>`
}

/**
 * @param {ReturnType<typeof buildVerificationReport> & { b64Front?: string; b64Back?: string; urlFrente?: string; urlReverso?: string; expedienteId?: string }} data
 */
export function generateEmailHTML(data) {
  const morado = '#7c3aed'
  const azul = '#3b82f6'
  const dest = getReportDestEmail()

  const f = (val) => escapeHtml(val || '—')
  const fila = (label, valor, color = '') =>
    `
    <tr>
      <td style="padding:8px 14px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;
                 letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #2d2d3d;">${escapeHtml(label)}</td>
      <td style="padding:8px 14px;font-size:14px;color:${color || '#e2e8f0'};border-bottom:1px solid #2d2d3d;
                 font-weight:${color ? '700' : '400'};">${f(valor)}</td>
    </tr>`

  const imgFront = emailCardImgTag(pickCardImageSrc(data.b64Front, data.urlFrente), 'Front of card')
  const imgBack = emailCardImgTag(pickCardImageSrc(data.b64Back, data.urlReverso), 'Back of card')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MedAuth Pro — Insurance Verification Report</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;min-height:100vh;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:660px;background:#16162a;border:1px solid #2d2d3d;border-radius:16px;overflow:hidden;">

<tr><td style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px 36px;text-align:center;">
  <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,0.7);margin-bottom:8px;">MedAuth Pro</div>
  <div style="font-size:26px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-.02em;">Medical Insurance Verification</div>
  <div style="font-size:13px;color:rgba(255,255,255,0.75);">Bariatric Surgery · Verification report</div>
</td></tr>

<tr><td style="padding:28px 36px;">

<div style="background:#1e1e2e;border:1px solid #2d2d3d;border-radius:12px;padding:20px;margin-bottom:28px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:${azul};margin-bottom:16px;border-bottom:1px solid #2d2d3d;padding-bottom:10px;">
    Insurance Card — Captured Images
  </div>
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" style="padding-right:8px;vertical-align:top;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${morado};letter-spacing:.1em;margin-bottom:8px;">Front</div>
      ${imgFront}
    </td>
    <td width="50%" style="padding-left:8px;vertical-align:top;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#06b6d4;letter-spacing:.1em;margin-bottom:8px;">Back</div>
      ${imgBack}
    </td>
  </tr></table>
</div>

${data.intakeForm ? intakeFormEmailSection(data.intakeForm, fila) : ''}
${data.callScriptForm ? callScriptWorksheetEmailSection(data.callScriptForm, fila) : ''}

<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:${morado};margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Insurance Identification</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${fila('Patient', data.nombre, '#e2e8f0')}
    ${fila('Insurance Company', data.aseguradora, '#c4b5fd')}
    ${fila('Subscriber Name', data.subscriberName)}
    ${fila('Member Name', data.memberName)}
    ${fila('Member ID / ID #', data.memberId, '#93c5fd')}
    ${fila('Subscriber ID', data.subscriberId)}
    ${fila('Group Number', data.groupNum, '#93c5fd')}
    ${fila('Plan Name', data.planName)}
    ${fila('Plan Type', data.planType)}
    ${fila('Effective Date', data.effectiveDate)}
    ${fila('Date of Birth (DOB)', data.dob)}
    ${fila('Network', data.network)}
    ${fila('Type of Coverage', data.coverage)}
  </table>
</div>

<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#06b6d4;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Copays &amp; Medical Costs</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${fila('PCP / Primary Care Copay', data.copayPCP)}
    ${fila('Specialist Copay', data.copaySpec)}
    ${fila('Emergency Room (ER)', data.copayER)}
    ${fila('Urgent Care', data.copayUrgent)}
    ${fila('Deductible (Med/Rx)', data.deductible)}
    ${fila('Coinsurance', data.coinsurance)}
  </table>
</div>

${data.rxBin || data.rxPcn || data.rxGrp
    ? `
<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:${azul};margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Pharmacy Plan</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${fila('RxBIN', data.rxBin)}
    ${fila('RxPCN', data.rxPcn)}
    ${fila('RxGRP', data.rxGrp)}
  </table>
</div>`
    : ''
}

<div style="margin-bottom:24px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#94a3b8;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #2d2d3d;">Contacts &amp; PCP</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #2d2d3d;border-radius:8px;overflow:hidden;">
    ${fila('Member Services Phone', data.phoneSeguro, '#6ee7b7')}
    ${fila('Prior Auth Phone', data.phoneAuth)}
    ${fila('PCP Name', data.pcpName)}
    ${fila('PCP Phone', data.pcpPhone)}
    ${fila('Website', data.website)}
  </table>
</div>

<div style="margin-bottom:24px;background:#1e1e2e;border:1px solid #2d2d3d;border-radius:12px;padding:20px;">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#94a3b8;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #2d2d3d;">Verification Call Results</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${fila('1. Covered?', data.cobertura, '')}
    ${fila('2. Prior Authorization?', data.autorizacion, '')}
    ${fila('3. PCP Referral?', data.referencia)}
    ${fila('4. Specific Facility?', data.facilidad)}
    ${data.facilidadDetalle ? fila('   Facility Detail', data.facilidadDetalle) : ''}
    ${fila('5. Total Deductible (call)', data.deducibleTotal)}
    ${fila('   Deductible Met', data.deducibleMet)}
    ${fila('   Copay/Coinsurance (call)', data.copago)}
    ${fila('   Out-of-Pocket Max.', data.oopMax)}
    ${fila('Insurance Rep.', data.repName)}
    ${fila('Reference Number', data.refNum)}
  </table>
  ${data.notasRep
    ? `
  <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid #2d2d3d;">
    <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Additional Notes</div>
    <div style="font-size:14px;color:#cbd5e1;line-height:1.6;">${escapeHtml(data.notasRep)}</div>
  </div>`
    : ''
}
</div>

<div style="background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.2);border-radius:8px;padding:14px 18px;text-align:center;margin-bottom:16px;">
  <div style="font-size:11px;color:#a78bfa;font-weight:600;">
    Record ID: <code style="font-family:monospace;color:#c4b5fd;">${f(data.expedienteId)}</code>
  </div>
  <div style="font-size:11px;color:#64748b;margin-top:4px;">
    Date: ${escapeHtml(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }))}
  </div>
</div>

</td></tr>

<tr><td style="background:#0d0d1f;padding:20px 36px;text-align:center;border-top:1px solid #2d2d3d;">
  <p style="font-size:12px;color:#475569;margin:0;line-height:1.6;">
    This report was automatically generated by <strong style="color:#7c3aed;">MedAuth Pro</strong><br/>
    Sent to: <a href="mailto:${escapeHtmlAttr(dest)}" style="color:#7c3aed;text-decoration:none;">${escapeHtml(dest)}</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

/**
 * @param {File | null} file
 * @param {'front' | 'back'} side
 * @returns {Promise<string | null>}
 */
export async function uploadCardImage(file, side) {
  if (!file) return null
  const path = `seguros/${Date.now()}_${side}_${file.name.replace(/[^\w.-]/g, '_')}`
  const contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
  let lastErr
  for (const st of getStorageInstances()) {
    try {
      const r = ref(st, path)
      await uploadBytes(r, file, { contentType })
      return await getDownloadURL(r)
    } catch (e) {
      lastErr = e
      console.warn(`Storage upload failed (${path}):`, e?.code || e?.message || e)
    }
  }
  throw lastErr
}

/**
 * @param {object} opts
 * @param {File | null} opts.frontFile
 * @param {File | null} opts.backFile
 * @param {ReturnType<typeof buildVerificationReport> & { b64Front?: string; b64Back?: string }} opts.data
 * @param {(phase: string) => void} [opts.onStatus]
 * @param {Record<string, unknown>} [opts.intakeForm]
 * @param {Record<string, unknown>} [opts.callForm]
 */
export async function submitVerificationFlow({ frontFile, backFile, data, onStatus, intakeForm, callForm }) {
  await ensureCallableAuth()

  onStatus?.('Uploading card images...')
  let urlFront = ''
  let urlBack = ''
  try {
    ;[urlFront, urlBack] = await Promise.all([
      uploadCardImage(frontFile, 'front'),
      uploadCardImage(backFile, 'back'),
    ])
  } catch (uploadErr) {
    console.warn('Storage upload failed (report email still includes embedded images):', uploadErr)
    onStatus?.('Storage unavailable — sending report with embedded images...')
    await new Promise((r) => setTimeout(r, 600))
  }

  const full = enrichReportForCallable(
    {
      ...data,
      urlFrente: urlFront || '',
      urlReverso: urlBack || '',
      resultado: evaluar(data),
    },
    { intakeForm, callForm },
  )

  full.expedienteId = crypto.randomUUID()

  onStatus?.('Sending report by cloud function...')
  const subject = `MedAuth Pro — ${full.nombre || 'Patient'} — Insurance verification`
  const textBody =
    `Patient: ${full.nombre || '—'}\n` +
    `Member ID: ${full.memberId || '—'}\n` +
    `Group #: ${full.groupNum || '—'}\n` +
    `Script summary (automated): ${full.resultado || '—'}`

  const reportForCallable = Object.fromEntries(
    Object.entries(full).filter(([k]) => !k.startsWith('b64')),
  )

  const idToken = await auth.currentUser?.getIdToken()

  const submitVerificationReport = httpsCallable(functions, 'submitVerificationReport')
  await submitVerificationReport({
    subject,
    text: textBody,
    html_report: generateEmailHTML({ ...full, expedienteId: full.expedienteId }),
    report: reportForCallable,
    _idToken: idToken,
  })

  return full
}

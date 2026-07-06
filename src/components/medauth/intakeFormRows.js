/** Shared intake form label/value rows for email HTML and PDF export. */

import { formatIntakeGender, SURGERY_HISTORY_QUESTIONS } from './intakeFormModel.js'

/** @param {Record<string, unknown>} intake */
export function getIntakeFormRows(intake) {
  const i = intake || {}
  const yn = (v) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '—')
  const parts = []
  if (i.comorbidDiabetic) parts.push('Diabetic')
  if (i.comorbidHbp) parts.push('High BP')
  if (i.comorbidChol) parts.push('High Cholesterol')
  if (i.comorbidThyroid) parts.push('Thyroid')
  if (i.comorbidSleepApnea) parts.push('Sleep Apnea')
  const comorb = parts.length ? parts.join(', ') : '—'
  const addr = [i.addressLine1, i.addressLine2].filter(Boolean).join(', ')
  const secondaryRows =
    i.hasSecondaryInsurance === 'yes'
      ? [
          ['Secondary insurance', i.secondaryInsurance],
          ['Secondary ins. phone', i.secondaryInsurancePhone],
          ['Secondary insured', i.secondaryInsuredName],
          ['Secondary ID / Group', [i.secondaryId, i.secondaryGroup].filter(Boolean).join(' / ')],
        ]
      : []
  const surgeryRows = []
  for (const { key, label, hasDetails } of SURGERY_HISTORY_QUESTIONS) {
    surgeryRows.push([label, yn(i[key])])
    if (hasDetails && i[key] === 'yes') {
      surgeryRows.push([
        `${label} — surgeon / date`,
        [i[`${key}SurgeonName`], i[`${key}DateYear`]].filter(Boolean).join(' · '),
      ])
      surgeryRows.push([
        `${label} — start / end weight`,
        [i[`${key}StartWt`], i[`${key}EndWt`]].filter(Boolean).join(' → '),
      ])
      surgeryRows.push([`${label} — comments`, i[`${key}Comments`]])
    }
  }
  return [
    ['Name', i.patientName],
    ['Address', addr],
    ['Phone', i.patientPhone],
    ['Email', i.email],
    ['Gender', formatIntakeGender(i.gender)],
    ['DOB', i.patientDob],
    ['SSN', i.patientSs],
    ['Intake date', i.intakeDate],
    ['HT / WT / BMI', [i.height, i.weight, i.bmi].filter(Boolean).join(' · ')],
    ['Primary care provider', i.primaryCareProvider],
    ['Primary insurance', i.primaryInsurance],
    ['Primary ins. phone', i.primaryInsurancePhone],
    ['Primary insured', i.primaryInsuredName],
    ['Primary ID / Group', [i.primaryId, i.primaryGroup].filter(Boolean).join(' / ')],
    ['Has secondary insurance?', yn(i.hasSecondaryInsurance)],
    ...secondaryRows,
    ['Self pay', yn(i.selfPay)],
    ['Comorbidities', comorb],
    ['Weight-related health', i.healthIssuesWeight],
    ...surgeryRows,
  ]
}

/** @param {unknown} value */
export function formatRowValue(value) {
  if (value === null || value === undefined) return '—'
  const s = String(value).trim()
  return s || '—'
}

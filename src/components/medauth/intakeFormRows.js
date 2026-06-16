/** Shared intake form label/value rows for email HTML and PDF export. */

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
  return [
    ['Name', i.patientName],
    ['Address', addr],
    ['Phone', i.patientPhone],
    ['Email', i.email],
    ['Gender', i.gender === 'male' ? 'Male' : i.gender === 'female' ? 'Female' : '—'],
    ['DOB', i.patientDob],
    ['SS#', i.patientSs],
    ['Intake date', i.intakeDate],
    ['Referred by', i.referredBy],
    ['Staff', i.staffName],
    ['HT / WT / BMI', [i.height, i.weight, i.bmi].filter(Boolean).join(' · ')],
    ['Primary care provider', i.primaryCareProvider],
    ['Primary insurance', i.primaryInsurance],
    ['Primary ins. phone', i.primaryInsurancePhone],
    ['Primary insured', i.primaryInsuredName],
    ['Primary ID / Group', [i.primaryId, i.primaryGroup].filter(Boolean).join(' / ')],
    ['Secondary insurance', i.secondaryInsurance],
    ['Secondary ins. phone', i.secondaryInsurancePhone],
    ['Self pay', yn(i.selfPay)],
    ['Comorbidities', comorb],
    ['Weight-related health', i.healthIssuesWeight],
    ['Previous surgery?', yn(i.prevSurgery)],
    ['Revision interest?', yn(i.interestedRevision)],
    ['Skin removal?', yn(i.interestedSkinRemoval)],
    ['Hernia repair?', yn(i.needHerniaRepair)],
    ['Prior surgeon / date', [i.surgerySurgeonName, i.surgeryDateYear].filter(Boolean).join(' · ')],
    ['Start / end weight', [i.surgeryStartWt, i.surgeryEndWt].filter(Boolean).join(' → ')],
    ['Surgery comments', i.surgeryComments],
  ]
}

/** @param {unknown} value */
export function formatRowValue(value) {
  if (value === null || value === undefined) return '—'
  const s = String(value).trim()
  return s || '—'
}

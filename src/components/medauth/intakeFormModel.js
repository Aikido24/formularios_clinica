/** Patient intake form (paper INTAKE) — serializable for reports. */

/** @returns {string} YYYY-MM-DD for today (clinic timezone). */
export function getTodayIntakeDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

/** @param {unknown} raw */
export function sanitizeFloatInput(raw) {
  const s = String(raw ?? '')
  let out = ''
  let dotSeen = false
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') out += ch
    else if (ch === '.' && !dotSeen) {
      out += ch
      dotSeen = true
    }
  }
  return out
}

/** @param {unknown} heightRaw — height in inches (decimal) */
export function parseHeightToInches(heightRaw) {
  const s = sanitizeFloatInput(heightRaw).trim()
  if (!s || s === '.') return null
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** @param {unknown} weightRaw — weight in lbs (decimal) */
export function parseWeightLbs(weightRaw) {
  const s = sanitizeFloatInput(weightRaw).trim()
  if (!s || s === '.') return null
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** BMI = (Weight × 705) ÷ height in inches ÷ height in inches */
export function calculateBmi(heightRaw, weightRaw) {
  const heightInches = parseHeightToInches(heightRaw)
  const weightLbs = parseWeightLbs(weightRaw)
  if (!heightInches || !weightLbs) return ''
  const bmi = (weightLbs * 705) / (heightInches * heightInches)
  return String(Math.round(bmi * 10) / 10)
}

/**
 * @param {Record<string, unknown>} intake
 * @returns {Record<string, string>}
 */
export function getIntakeRequiredFieldErrors(intake) {
  /** @type {Record<string, string>} */
  const errors = {}
  if (!String(intake?.patientName || '').trim()) errors.patientName = 'Required'
  if (!String(intake?.addressLine1 || '').trim()) errors.addressLine1 = 'Required'
  if (!String(intake?.patientPhone || '').trim()) errors.patientPhone = 'Required'
  if (!['male', 'female', 'other'].includes(String(intake?.gender || ''))) errors.gender = 'Required'
  if (!String(intake?.patientDob || '').trim()) errors.patientDob = 'Required'
  if (!String(intake?.patientSs || '').trim()) errors.patientSs = 'Required'
  if (!['yes', 'no'].includes(String(intake?.hasSecondaryInsurance || ''))) errors.hasSecondaryInsurance = 'Required'

  if (intake?.hasSecondaryInsurance === 'yes') {
    for (const key of [
      'secondaryInsurance',
      'secondaryInsurancePhone',
      'secondaryInsuredName',
      'secondaryInsuredSs',
      'secondaryInsuredDob',
      'secondaryId',
      'secondaryGroup',
    ]) {
      if (!String(intake?.[key] || '').trim()) errors[key] = 'Required'
    }
  }

  return errors
}

/**
 * @param {Record<string, unknown>} intake
 */
export function validateIntakeRequired(intake) {
  const errors = getIntakeRequiredFieldErrors(intake)
  const valid = Object.keys(errors).length === 0
  return {
    valid,
    errors,
    message: valid ? '' : 'Please complete all required fields before continuing.',
  }
}

/** @param {unknown} gender */
export function formatIntakeGender(gender) {
  if (gender === 'male') return 'Male'
  if (gender === 'female') return 'Female'
  if (gender === 'other') return 'Other'
  return '—'
}

export const SURGERY_HISTORY_QUESTIONS = [
  { key: 'prevSurgery', label: 'Have you had Previous Surgery?', hasDetails: true },
  { key: 'interestedRevision', label: 'Are you interested in a Revision?' },
  { key: 'interestedSkinRemoval', label: 'Are you interested in Skin Removal?' },
  { key: 'needHerniaRepair', label: 'Do you need a Hernia repair?' },
]

/** @param {string} questionKey */
export function clearSurgeryQuestionDetails(questionKey) {
  const q = SURGERY_HISTORY_QUESTIONS.find((item) => item.key === questionKey)
  if (!q?.hasDetails) return {}
  return {
    [`${questionKey}SurgeonName`]: '',
    [`${questionKey}DateYear`]: '',
    [`${questionKey}StartWt`]: '',
    [`${questionKey}EndWt`]: '',
    [`${questionKey}Comments`]: '',
  }
}

/** @returns {Record<string, string>} */
function getEmptySurgeryDetailFields() {
  /** @type {Record<string, string>} */
  const fields = {}
  for (const { key } of SURGERY_HISTORY_QUESTIONS) {
    Object.assign(fields, clearSurgeryQuestionDetails(key))
  }
  return fields
}

export function createEmptyIntakeForm() {
  return {
    patientName: '',
    addressLine1: '',
    addressLine2: '',
    patientPhone: '',
    email: '',
    gender: '',
    patientDob: '',
    patientSs: '',
    intakeDate: getTodayIntakeDate(),
    height: '',
    weight: '',
    bmi: '',
    primaryCareProvider: '',
    primaryInsurance: '',
    primaryInsurancePhone: '',
    primaryInsuredName: '',
    primaryInsuredSs: '',
    primaryInsuredDob: '',
    primaryId: '',
    primaryGroup: '',
    hasSecondaryInsurance: '',
    secondaryInsurance: '',
    secondaryInsurancePhone: '',
    secondaryInsuredName: '',
    secondaryInsuredSs: '',
    secondaryInsuredDob: '',
    secondaryId: '',
    secondaryGroup: '',
    selfPay: '',
    comorbidDiabetic: false,
    comorbidHbp: false,
    comorbidChol: false,
    comorbidThyroid: false,
    comorbidSleepApnea: false,
    healthIssuesWeight: '',
    prevSurgery: '',
    interestedRevision: '',
    interestedSkinRemoval: '',
    needHerniaRepair: '',
    ...getEmptySurgeryDetailFields(),
  }
}

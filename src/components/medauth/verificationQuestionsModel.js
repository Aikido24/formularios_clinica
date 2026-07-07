/** Insurance verification call script — one Yes/No question per screen. */

export const VERIFICATION_INTRO = {
  title: 'Insurance Verification',
  body: [
    'Once you get through the automated system to an actual human customer service representative, the representative will ask a series of questions.',
    'Provide provider NPI, name, address, and tax ID number. Provide the patient ID number from the card, patient name, and date of birth.',
    'Answer each step below after your call. Some carriers provide partial benefit information on their portals before the call; this checklist covers the full phone verification workflow.',
  ],
}

/** @typedef {{ id: string; step: number; title: string; prompt: string; detail?: string }} VerificationQuestion */

/** @type {VerificationQuestion[]} */
export const VERIFICATION_QUESTIONS = [
  {
    id: 'liveRep',
    step: 1,
    title: 'Live representative',
    prompt: 'Did you reach a live customer service representative (past the automated system)?',
  },
  {
    id: 'bariatricBenefitsCoe',
    step: 2,
    title: 'Bariatric benefits',
    prompt:
      'Did you request bariatric benefits and confirm whether a Center of Excellence is required to receive them?',
  },
  {
    id: 'surgeryCodes',
    step: 3,
    title: 'Surgery codes',
    prompt: 'Did you confirm CPT 43845, ICD-10 E66.01, and an inpatient place of service with the representative?',
    detail: 'When asked if you have codes, the answer is YES.',
  },
  {
    id: 'bariatricCovered',
    step: 4,
    title: 'Coverage result',
    prompt:
      'Are bariatric services covered (not a Bariatric Exclusion of Coverage)?',
    detail:
      'If excluded, bariatric insurance cannot be filed. If covered, the rep should provide deductible, out-of-pocket maximum, coinsurance %, and whether pre-determination or authorization is required.',
  },
  {
    id: 'specialistCopayReferral',
    step: 5,
    title: 'Specialist visit',
    prompt: 'Did you obtain the specialist office visit copay and whether a referral is required?',
  },
  {
    id: 'outpatientAuth',
    step: 6,
    title: 'Outpatient authorization',
    prompt:
      'Do CPT codes 43235, 93306, 93970, and 76981 require authorization for outpatient place of service?',
  },
  {
    id: 'facilitiesInNetwork',
    step: 7,
    title: 'Facilities in network',
    prompt: 'Are the following facilities in network?',
    detail:
      'Lubbock Heart Hospital — NPI 1922001775, Tax ID 51-0436196. Plains Regional Medical Center — NPI 1629053509, Tax ID 90-0406942.',
  },
  {
    id: 'repReference',
    step: 8,
    title: 'Call documentation',
    prompt: 'Did you obtain the representative name and call reference number for our records?',
  },
]

/** @returns {Record<string, ''>} */
export function createEmptyVerificationAnswers() {
  /** @type {Record<string, string>} */
  const answers = {}
  for (const q of VERIFICATION_QUESTIONS) answers[q.id] = ''
  return answers
}

/** @param {Record<string, string>} answers */
export function getFirstUnansweredVerificationIndex(answers) {
  const idx = VERIFICATION_QUESTIONS.findIndex((q) => answers[q.id] !== 'yes' && answers[q.id] !== 'no')
  return idx === -1 ? VERIFICATION_QUESTIONS.length : idx
}

/** @param {unknown} value */
export function formatVerificationAnswer(value) {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return '—'
}

/**
 * @param {Record<string, string>} answers
 * @param {Record<string, unknown>} [intakeForm]
 */
export function getVerificationAnswerRows(answers, intakeForm = {}) {
  const patient = String(intakeForm?.patientName || '').trim() || 'Patient'
  const rows = [['Patient', patient]]
  for (const q of VERIFICATION_QUESTIONS) {
    rows.push([`${q.step}. ${q.title}`, formatVerificationAnswer(answers[q.id])])
  }
  return rows
}

/**
 * @param {Record<string, string>} answers
 * @param {Record<string, unknown>} [intakeForm]
 */
export function buildVerificationAnswersEmailText(answers, intakeForm = {}) {
  const patient = String(intakeForm?.patientName || '').trim() || 'Patient'
  const lines = [
    `Insurance verification answers for ${patient}.`,
    '',
    ...VERIFICATION_QUESTIONS.map((q) => {
      const ans = formatVerificationAnswer(answers[q.id])
      return `${q.step}. ${q.title}: ${ans}\n   ${q.prompt}`
    }),
  ]
  return lines.join('\n')
}

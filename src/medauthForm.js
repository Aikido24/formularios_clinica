/** MedAuth / clinicausuarios field model (camelCase in React). */

export const DEFAULT_REPORT_EMAIL =
  import.meta.env.VITE_REPORT_EMAIL || 'michaelandresfloreshenao@gmail.com'

export function createEmptyMedauthForm() {
  return {
    insuranceCompany: '',
    subscriberName: '',
    memberName: '',
    memberId: '',
    subscriberId: '',
    groupNumber: '',
    planName: '',
    planType: '',
    benefitPlan: '',
    effectiveDate: '',
    dob: '',
    network: '',
    coverage: '',
    dependents: '',
    copayPCP: '',
    copaySpecialist: '',
    copayEr: '',
    copayUrgent: '',
    deductible: '',
    coinsurance: '',
    rxBin: '',
    rxPcn: '',
    rxGroup: '',
    rxAdmin: '',
    rxGeneric: '',
    rxBrand: '',
    rxNonPref: '',
    rxSpecialty: '',
    pcpName: '',
    pcpPhone: '',
    pcpEffDate: '',
    providerGroup: '',
    providerPhone: '',
    chipNum: '',
    phoneCustomerService: '',
    phonePreauth: '',
    phonePharmacy: '',
    phoneNurse: '',
    phoneBehavioral: '',
    website: '',
    extraInfo: '',
  }
}

const _empty = createEmptyMedauthForm()
export const MEDAUTH_FORM_KEYS = /** @type {(keyof ReturnType<typeof createEmptyMedauthForm>)[]} */ (
  Object.keys(_empty)
)

export function createEmptyScriptAnswers() {
  return {
    cobertura: '',
    autorizacion: '',
    referencia: '',
    facilidad: '',
    facilidadDetalle: '',
    deducibleTotal: '',
    deducibleMet: '',
    copago: '',
    oopMax: '',
    notasRep: '',
    repName: '',
    refNum: '',
  }
}

/**
 * @param {ReturnType<typeof createEmptyMedauthForm>} a
 * @param {ReturnType<typeof createEmptyMedauthForm>} b
 */
export function mergeMedauthParsed(a, b) {
  const merged = { ...createEmptyMedauthForm() }
  const conflicts = {}
  for (const key of MEDAUTH_FORM_KEYS) {
    const fv = String(a[key] ?? '').trim()
    const bv = String(b[key] ?? '').trim()
    if (fv && bv && fv !== bv) {
      merged[key] = fv
      conflicts[key] = { front: fv, back: bv }
    } else {
      merged[key] = fv || bv
    }
  }
  return { merged, conflicts }
}

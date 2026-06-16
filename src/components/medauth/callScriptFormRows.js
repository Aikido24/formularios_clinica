/** Shared call worksheet rows (label/value) for email HTML and PDF export. */

/**
 * @param {Record<string, unknown>} callForm
 * @returns {{title: string; rows: [string, string | number | boolean][]}[]}
 */
export function getCallScriptFormRows(callForm) {
  const c = callForm || {}

  const formatYn = (v) => {
    if (v === 'yes') return 'Yes'
    if (v === 'no') return 'No'
    return v ? String(v) : '—'
  }

  const asStr = (v) => (v === undefined || v === null || String(v).trim() === '' ? '—' : String(v).trim())

  return [
    {
      title: 'Patient',
      rows: [
        ['Date', asStr(c.csDate)],
        ['Initials', asStr(c.csInitials)],
        ['Patient', asStr(c.patientName)],
        ['DOB', asStr(c.patientDob)],
        ['Insured', asStr(c.insured)],
      ],
    },
    {
      title: 'Insurance & call details',
      rows: [
        ['Insurance level', asStr(c.insuranceLevel)],
        ['Insurance', asStr(c.insuranceName)],
        ['Ph #', asStr(c.insurancePhone)],
        ['ID #', asStr(c.insuranceId)],
        ['Group #', asStr(c.groupNumber)],
        ['Spoke with', asStr(c.spokeWith)],
        ['Call ref #', asStr(c.callRefNumber)],
      ],
    },
    {
      title: 'Facility requirements',
      rows: [
        ['COE Facility Required', formatYn(c.coeFacilityRequired)],
        ['Facility IN Network — LHH', formatYn(c.facilityLhhNetwork)],
        ['Facility IN Network — PRMC', formatYn(c.facilityPrmcNetwork)],
        ['Facility note', asStr(c.facilityNote)],
      ],
    },
    {
      title: 'Plan & authorizations',
      rows: [
        ['Effective Date', asStr(c.effectiveDate)],
        ['Plan Type', asStr(c.planType)],
        ['Definite Exclusion (E66.01)', formatYn(c.definiteExclusion)],
        ['PCP Referral Required', formatYn(c.pcpReferralRequired)],
        ['PCP', asStr(c.pcpName)],
        ['Referral Requested', formatYn(c.referralRequested)],
        ['Referral From', asStr(c.referralFrom)],
        ['Referral Rec\'d', formatYn(c.referralReceived)],
        ['EGD Auth Required (43235, 43239)', formatYn(c.egdAuthRequired)],
        ['ECHO Auth Required (93306)', formatYn(c.echoAuthRequired)],
        ['Doppler Auth Required (93970)', formatYn(c.dopplerAuthRequired)],
        ['FibroScan Auth Required (76981)', formatYn(c.fibroscanAuthRequired)],
        ['Third-party auth portal', asStr(c.thirdPartyAuthPortal)],
        ['Bariatrics in-patient auth required', formatYn(c.bariatricsInPtAuthReq)],
        ['Plastics auth required', formatYn(c.plasticsAuthReq)],
      ],
    },
    {
      title: 'Network benefits — In network',
      rows: [
        ['OV Copay', asStr(c.inNetOvCopay)],
        ['Deductible', asStr(c.inNetDeductible)],
        ['Deductible rem', asStr(c.inNetDeductibleRem)],
        ['Co-Ins%', asStr(c.inNetCoins)],
        ['OOP', asStr(c.inNetOop)],
        ['OOP rem', asStr(c.inNetOopRem)],
      ],
    },
    {
      title: 'Network benefits — Out of network',
      rows: [
        ['OV Copay', asStr(c.outNetOvCopay)],
        ['Deductible', asStr(c.outNetDeductible)],
        ['Deductible rem', asStr(c.outNetDeductibleRem)],
        ['Co-Ins%', asStr(c.outNetCoins)],
        ['OOP', asStr(c.outNetOop)],
        ['OOP rem', asStr(c.outNetOopRem)],
      ],
    },
    {
      title: 'Notes',
      rows: [
        ['Requirements for Bariatric Surgery: Weight/BMI', asStr(c.reqsBariatricWeightBmi)],
        ['General notes', asStr(c.generalNotes)],
        ['Comorbidities', asStr(c.comorbiditiesNotes)],
        ['Diet Visits Req', asStr(c.dietVisitsReq)],
        ['Pre-D(RCR) REQ', formatYn(c.preDrcrReq)],
        ['Benefits Printed', formatYn(c.benefitsPrinted)],
        ['Card Printed', formatYn(c.cardPrinted)],
        ['Final note', asStr(c.finalNote)],
      ],
    },
  ]
}


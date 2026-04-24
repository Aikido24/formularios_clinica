/**
 * Insurance card OCR parsers — ported from clinicausuarios/js/app.js (parseFront / parseBack).
 * Pure functions returning field objects (no DOM).
 */
/* eslint-disable no-useless-escape -- legacy regex patterns */

import { createEmptyMedauthForm } from './medauthForm.js'

/** @param {string} d */
export function fmtPhone(d) {
  if (!d) return ''
  const clean = String(d).replace(/\D/g, '').slice(-10)
  if (clean.length < 10) return String(d)
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`
}

/**
 * @param {string} text
 * @returns {ReturnType<typeof createEmptyMedauthForm>}
 */
export function parseFrontCard(text) {
  const out = createEmptyMedauthForm()

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[><|~`@#^*\\]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const collapsed = lines.join(' ')
  const T = collapsed.toUpperCase()

  const tryPat = (patterns) => {
    for (const p of patterns) {
      const m = collapsed.match(p) || text.match(p)
      if (m && m[1] && m[1].trim()) return m[1].trim()
    }
    return ''
  }

  const ph = (s) => {
    if (!s) return ''
    const d = s.replace(/\D/g, '').slice(-10)
    return d.length >= 10 ? fmtPhone(d) : ''
  }

  let aseg = ''
  const insurerMap = [
    ['BLUE CROSS BLUE SHIELD OF TEXAS', 'Blue Cross Blue Shield of Texas'],
    ['BLUECROSS BLUESHIELD OF TEXAS', 'Blue Cross Blue Shield of Texas'],
    ['BCBSTX', 'Blue Cross Blue Shield of Texas'],
    ['BLUE CROSS BLUE SHIELD', 'Blue Cross Blue Shield'],
    ['BLUECROSS BLUESHIELD', 'Blue Cross Blue Shield'],
    ['BLUE CROSS', 'Blue Cross'],
    ['BLUE SHIELD', 'Blue Shield'],
    ['BCBS', 'BCBS'],
    ['AMBETTER', 'Ambetter'],
    ['SUPERIOR HEALTHPLAN', 'Superior Healthplan'],
    ['AMERIGROUP', 'Amerigroup'],
    ['ANTHEM', 'Anthem'],
    ['UNITEDHEALTH', 'UnitedHealth'],
    ['UNITEDHEALTHCARE', 'UnitedHealthcare'],
    ['UNITED HEALTH CARE', 'UnitedHealthcare'],
    ['AETNA', 'Aetna'],
    ['CIGNA', 'Cigna'],
    ['HUMANA', 'Humana'],
    ['MOLINA', 'Molina Healthcare'],
    ['CHRISTUS', 'Christus Health Plan'],
    ['CENTENE', 'Centene'],
    ['OSCAR', 'Oscar'],
    ['MAGELLAN', 'Magellan'],
    ['COVENTRY', 'Coventry'],
    ['WELLCARE', 'WellCare'],
    ['TRICARE', 'Tricare'],
    ['CHIP', 'CHIP / Medicaid'],
    ['MEDICAID', 'Medicaid'],
    ['MEDICARE', 'Medicare'],
    ['TEXAS CHILDREN', "Texas Children's Health Plan"],
    ['COMMUNITY HEALTH', 'Community Health Choice'],
  ]
  for (const [k, n] of insurerMap) {
    if (T.includes(k)) {
      aseg = n
      break
    }
  }

  let subscriberName = tryPat([
    /Subscriber\s*Name\s*[:\-]?\s*([A-Z][A-Za-z\.\s\-']{2,40})/i,
    /Subscriber\s*[:\-]\s*([A-Z][A-Za-z\.\s\-']{2,40})/i,
    /Suscriptor\s*[:\-]?\s*([A-Z][A-Za-z\.\s\-']{2,40})/i,
  ])
  if (!subscriberName) {
    const noisy = T.match(/SUBSCR[\w\s]*[>=\-:]+\s*([A-Z][A-Z\.\s]{4,40})/i)
    if (noisy) subscriberName = noisy[1].trim()
  }

  let memberName = tryPat([
    /Member\s*(?:Name)?\s*[:\-]?\s*([A-Z][A-Za-z\.\s\-']{3,40})/i,
    /Insured\s*[:\-]\s*([A-Z][A-Za-z\.\s\-']{3,40})/i,
  ])
  if (!memberName) {
    for (const ln of lines) {
      if (/^[A-Z]{2,}(?:\s+[A-Z]\.?\s*)?[A-Z]{2,}$/.test(ln.trim())) {
        memberName = ln.trim()
        break
      }
    }
  }
  if (!memberName && subscriberName) memberName = subscriberName
  if (!subscriberName && memberName) subscriberName = memberName

  let memberId = tryPat([
    /Identification\s*Number\s*[:\-]?\s*([A-Z]{0,4}\d{6,14}[A-Z0-9]*)/i,
    /Member\s*ID\s*[:\-#]?\s*([A-Z0-9]{5,20})/i,
    /MBR\s*ID\s*[:\-]?\s*([A-Z0-9]{5,20})/i,
    /Member\s*Number\s*[:\-]?\s*([A-Z0-9]{5,20})/i,
    /ID\s*#\s*[:\-]?\s*([A-Z0-9]{5,20})/i,
    /\b([A-Z]{1,3}\d{7,14})\b/,
    /\b(\d{8,14})\b/,
  ])

  let subscriberId = tryPat([
    /Subscriber\s*(?:ID|#|Number)\s*[:\-]?\s*([A-Z0-9]{5,20})/i,
    /CHIP\s*Perinate\s*(?:Number|#)?\s*[:\-]?\s*([A-Z0-9]{5,20})/i,
  ])
  if (subscriberId === memberId) subscriberId = ''

  let groupNumber = tryPat([
    /Group\s*(?:No\.?|Number|Num|#)\s*[:\-]?\s*([A-Z0-9]{2,14})/i,
    /GRP\s*#?\s*[:\-]?\s*([A-Z0-9]{2,14})/i,
  ])

  let planName = tryPat([/Plan\s*[:\-]\s*(.{4,60})/i])
  if (!planName) {
    for (const ln of lines) {
      if (
        /\b(FAMILY|INDIVIDUAL|BALANCED|CARE|GOLD|SILVER|BRONZE|PLATINUM|CLASSIC|BASIC|SELECT)\b/i.test(ln) &&
        !/\bCALL\b|\bWEB\b|\bPHONE\b|\bFAX\b/.test(ln.toUpperCase())
      ) {
        planName = ln.replace(/^\s*[\-:]\s*/, '').trim().slice(0, 60)
        break
      }
    }
  }
  if (!planName) {
    const bcaPlan = collapsed.match(/\b(BCA\s+\w+(?:\s+\w+)?)\b/i)
    if (bcaPlan) planName = bcaPlan[1].trim()
  }

  let planType = ''
  for (const pt of ['PPO', 'HMO', 'EPO', 'POS', 'HDHP', 'HSA', 'MAPD', 'TDI', 'CHIP', 'HIOPT', 'QHF', 'PCP']) {
    if (new RegExp(`\\b${pt}\\b`).test(T)) {
      planType = pt
      break
    }
  }

  const benefitPlan = tryPat([/Benefit\s*Plan\s+([A-Z0-9]{2,12})/i])

  const effectiveDate = tryPat([
    /Coverage\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Member\s*Effective\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Effective\s*Date\s*(?:of\s*Coverage)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Eff\.?\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ])

  const dob = tryPat([/(?:Date\s*of\s*Birth|DOB)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i])

  let network = ''
  if (T.includes('IN NETWORK COVERAGE ONLY')) network = 'In Network Coverage Only'
  else if (T.includes('IN-NETWORK')) network = 'In Network'
  else if (T.includes('IN NETWORK')) network = 'In Network'
  else if (T.includes('OUT OF NETWORK')) network = 'Out of Network'

  let coverage = tryPat([/Type\s*(?:of)?\s*Coverage\s*[:\-]?\s*(\w[\w\s\-]{0,30})/i])
  if (!coverage) {
    if (T.includes('CHIP')) coverage = 'CHIP'
    else if (T.includes('TDI')) coverage = 'TDI'
  }

  let dependents = ''
  const depLines = collapsed.match(/Dependent\s+(?:One|Two|Three|Four|\d+)|Member\s+\d+/gi)
  if (depLines) dependents = depLines.join(' · ')
  if (!dependents && T.includes('PEDIATRIC DENTAL')) dependents = 'Pediatric Dental (under 19)'

  let copayPCP = ''
  let copaySpecialist = ''
  const ovSpec = collapsed.match(/OV\s*\/\s*Spec\s*\$?(\d+)\s*\/\s*(\d+)/i)
  if (ovSpec) {
    copayPCP = `$${ovSpec[1]}`
    copaySpecialist = `$${ovSpec[2]}`
  }
  if (!copayPCP) {
    copayPCP = tryPat([
      /PCP\s*(?:Office\s*Visit)?\s*[:\-]?\s*(\$[\d,.]+)/i,
      /Primary\s*Care\s*(?:Office\s*Visit)?\s*[:\-]?\s*(\$[\d,.]+)/i,
      /Office\s*Visit\s+(\$[\d,.]+)/i,
    ])
  }
  if (!copaySpecialist) {
    copaySpecialist = tryPat([
      /Specialist\s*(?:Office\s*Visit|Copay)?\s*[:\-]?\s*(\$[\d,.]+)/i,
      /Spec\s*(?:ialist)?\s+(\$[\d,.]+)/i,
    ])
  }
  const copayEr = tryPat([
    /Emergency\s*Room\s*[:\-]?\s*(\$[\d,.]+)/i,
    /\bER\b\s*[:\-]?\s*(\$[\d,.]+)/i,
    /Emergency\s+(\$[\d,.]+)/i,
  ])
  const copayUrgent = tryPat([/Urgent\s*Care\s*[:\-]?\s*(\$[\d,.]+)/i])

  const deductible = tryPat([
    /Deductible\s*(?:\(Med\/?Rx\))?\s*[:\-]?\s*(\$[\d,.]+)/i,
    /Deductible\s+(\$[\d,.]+)/i,
  ])

  const coinsurance = tryPat([
    /Coinsurance\s*(?:\(Med\/?Rx\))?\s*[:\-]?\s*(\d+%)/i,
    /Co[- ]?insurance\s+(\d+%)/i,
  ])

  const rxBin = tryPat([
    /RxBIN\s*[:\-]?\s*(\d{4,10})/i,
    /Rx\s*BIN\s*#?\s*[:\-]?\s*(\d{4,10})/i,
    /BIN\s*[:\-]?\s*(\d{4,10})/i,
  ])

  const rxPcn = tryPat([
    /RxPCN\s*[:\-]?\s*([A-Z0-9]{2,12})/i,
    /Rx\s*PCN\s*[:\-]?\s*([A-Z0-9]{2,12})/i,
    /PCN\s*[:\-]?\s*([A-Z0-9]{2,12})/i,
  ])

  const rxGroup = tryPat([
    /RxGRP\s*[:\-]?\s*([A-Z0-9]{2,14})/i,
    /Rx\s*GR(?:P|OUP)\s*[:\-]?\s*([A-Z0-9]{2,14})/i,
    /Rx\s*Group\s*[:\-]?\s*([A-Z0-9]{2,14})/i,
  ])

  let rxAdmin = tryPat([
    /Pharmacy\s*Benefits?\s*Manager\s*[:\-]?\s*([A-Za-z\s]{2,25})/i,
    /Administered\s*by\s*[:\-]?\s*([A-Za-z\s]{2,25})/i,
  ])
  if (!rxAdmin) {
    for (const adm of [
      'PRIME',
      'Express Scripts',
      'CVS Caremark',
      'OptumRx',
      'Argus',
      'Prime Therapeutics',
      'Navitus',
      'MedImpact',
      'Magellan Rx',
    ]) {
      if (T.includes(adm.toUpperCase())) {
        rxAdmin = adm
        break
      }
    }
  }
  if (rxAdmin) rxAdmin = rxAdmin.trim()

  const rxGeneric = tryPat([
    /Rx\s*Level\s*1\s*(\$[\d]+\/[\d]+\/[\d]+)/i,
    /Generic\s*(?:Drugs?)?\s*[:\-]?\s*(\$[\d,.\/]+)/i,
  ])
  const rxBrand = tryPat([
    /Rx\s*Level\s*2\s*(\$[\d]+\/[\d]+\/[\d]+)/i,
    /Preferred\s*Brand\s*(?:Drugs?)?\s*[:\-]?\s*(\$[\d,.]+)/i,
  ])
  const rxNonPref = tryPat([/Non[\s\-]?Preferred\s*Brand\s*(?:Drugs?)?\s*[:\-]?\s*(\$[\d,.]+)/i])
  const rxSpecialty = tryPat([/Specialty\s*(?:Drugs?)?\s*[:\-]?\s*(\$[\d,.]+)/i])

  const pcpName = tryPat([/PCP\s*(?:Name)?\s*[:\-]\s*(.{3,40})/i])
  const pcpPhone = ph(tryPat([/PCP\s*Phone\s*[:\-]?\s*([\d\s().\-]{10,})/i]))
  const pcpEffDate = tryPat([/PCP\s*Effective\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i])
  const providerGroup = tryPat([/Provider\s*Group\s*[:\-]?\s*(.{3,40})/i])
  const providerPhone = ph(tryPat([/Provider\s*Phone\s*[:\-]?\s*([\d\s().\-]{10,})/i]))
  const chipNum = tryPat([/CHIP\s*Perinate\s*(?:Number)?\s*[:\-]?\s*([A-Z0-9]{3,18})/i])

  out.insuranceCompany = aseg
  out.subscriberName = subscriberName
  out.memberName = memberName
  out.memberId = memberId
  out.subscriberId = subscriberId
  out.groupNumber = groupNumber
  out.planName = planName
  out.planType = planType
  out.benefitPlan = benefitPlan
  out.effectiveDate = effectiveDate
  out.dob = dob
  out.network = network
  out.coverage = coverage
  out.dependents = dependents
  out.copayPCP = copayPCP
  out.copaySpecialist = copaySpecialist
  out.copayEr = copayEr
  out.copayUrgent = copayUrgent
  out.deductible = deductible
  out.coinsurance = coinsurance
  out.rxBin = rxBin
  out.rxPcn = rxPcn
  out.rxGroup = rxGroup
  out.rxAdmin = rxAdmin
  out.rxGeneric = rxGeneric
  out.rxBrand = rxBrand
  out.rxNonPref = rxNonPref
  out.rxSpecialty = rxSpecialty
  out.pcpName = pcpName
  out.pcpPhone = pcpPhone
  out.pcpEffDate = pcpEffDate
  out.providerGroup = providerGroup
  out.providerPhone = providerPhone
  out.chipNum = chipNum

  return out
}

/**
 * @param {string} text
 * @param {{ rxAdminFromFront?: string }} opts
 */
export function parseBackCard(text, opts = {}) {
  const out = createEmptyMedauthForm()
  const extraNotes = []
  const rxAdminFromFront = opts.rxAdminFromFront?.trim() ?? ''

  const norm = text
    .replace(/(\d)\.(\d)/g, '$1-$2')
    .replace(/(\d):(\d)/g, '$1-$2')

  const extractPhone = (src, labelPatterns) => {
    const PNUM = '(1?[\\s\\-]?\\(?\\d{3}\\)?[\\s\\-\\.]\\d{3}[\\s\\-\\.]\\d{4})'
    for (const lbl of labelPatterns) {
      const pat = new RegExp(lbl + '[^\\n]{0,30}?' + PNUM, 'i')
      const m = src.match(pat)
      if (m) {
        const digits = m[1].replace(/\D/g, '').slice(-10)
        if (digits.length >= 10) return fmtPhone(digits)
      }
    }
    return ''
  }

  const allPhones = []
  const normLines = norm.split(/\r?\n/)
  for (const ln of normLines) {
    const m = ln.match(/1?[\s\-]?\(?\d{3}\)?[\s\-.]\d{3}[\s\-.]\d{4}/g)
    if (m) {
      m.forEach((p) => {
        const d = p.replace(/\D/g, '').slice(-10)
        if (d.length >= 10) allPhones.push({ line: ln, phone: fmtPhone(d) })
      })
    }
  }

  let phone = extractPhone(norm, [
    'Customer\\s*Service',
    'Member\\s*Services?',
    'Atenci.n\\s*al',
    'Llamar\\s*a',
    'Call\\s*Us',
    'Questions?',
  ])
  if (!phone && allPhones.length > 0) phone = allPhones[0].phone

  const phoneAuth = extractPhone(norm, [
    'Preauth\\s*(?:Medical)?',
    'Pre\\s*Auth(?:orization)?',
    'Prior\\s*Auth(?:orization)?',
    'Precertification',
    'Authorization',
  ])

  const phonePharmacy = extractPhone(norm, ['Pharmacy', 'Pharmacy'])
  const phoneNurse = extractPhone(norm, ['24.?Hour\\s*Nurse', 'Nurse\\s*(?:Help)?\\s*Line', 'Nurse'])
  const phoneBehavioral = extractPhone(norm, ['Behavioral\\s*Health', 'Mental\\s*Health'])

  const provSvc = extractPhone(norm, ['Provider\\s*Service', 'Provider\\s*Network'])
  const profNet = extractPhone(norm, ['Prof(?:essional)?\\s*Network'])
  const blueCardM = norm.match(/Blue\s*Card\s*Access[^\d]*(1[\d\s\-.]{10,14})/i)
  const blueCard = blueCardM ? fmtPhone(blueCardM[1].replace(/\D/g, '').slice(-10)) : ''
  const multiM = norm.match(/MULTILIFE[^\d]*(1[\d\s\-.]{10,14})/i)
  const multi = multiM ? fmtPhone(multiM[1].replace(/\D/g, '').slice(-10)) : ''

  if (provSvc) extraNotes.push(`Provider Service: ${provSvc}`)
  if (profNet) extraNotes.push(`Prof Network: ${profNet}`)
  if (blueCard) extraNotes.push(`Blue Card Access: ${blueCard}`)
  if (multi) extraNotes.push(`MULTILIFE: ${multi}`)

  let website = ''
  const webM = text.match(/(?:www\.)?([a-zA-Z0-9-]+\.(?:com|net|org)(?:\/[A-Za-z0-9-\/]*)?)/i)
  if (webM) website = webM[0].toLowerCase().startsWith('www.') ? webM[0] : `www.${webM[1]}`

  const rawUp = text.toUpperCase()
  if (!rxAdminFromFront) {
    for (const adm of ['PRIME', 'Express Scripts', 'CVS Caremark', 'OptumRx', 'MedImpact', 'Navitus']) {
      if (rawUp.includes(adm.toUpperCase())) {
        out.rxAdmin = adm
        break
      }
    }
  }

  out.phoneCustomerService = phone
  out.phonePreauth = phoneAuth
  out.phonePharmacy = phonePharmacy
  out.phoneNurse = phoneNurse
  out.phoneBehavioral = phoneBehavioral
  out.website = website

  if (extraNotes.length > 0) {
    out.extraInfo = extraNotes.join('\n')
  }

  return out
}

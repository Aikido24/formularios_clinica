import './CallScriptForm.css'

const PLAN_TYPES = ['HMO', 'PPO', 'POS', 'EPO', 'MCARE', 'MCAID']

function Icon({ name }) {
  return <span className="material-symbols-outlined" style={{ fontSize: '1.05em', verticalAlign: 'middle' }}>{name}</span>
}

function Yn({ group, label, value, onPick }) {
  return (
    <div className="cs-yn-row">
      {label ? <span>{label}</span> : <span />}
      <label>
        <input type="radio" name={group} checked={value === 'yes'} onChange={() => onPick('yes')} />
        Yes
      </label>
      <label>
        <input type="radio" name={group} checked={value === 'no'} onChange={() => onPick('no')} />
        No
      </label>
    </div>
  )
}

/** @param {{ value: Record<string, string>; onChange: (next: Record<string, string>) => void }} props */
export default function CallScriptForm({ value, onChange }) {
  const p = (k, v) => onChange({ ...value, [k]: v })
  const ch = (k) => (e) => p(k, e.target.value)

  return (
    <div className="cs-form" id="call-script-worksheet">
      <h2>
        <Icon name="assignment" /> Insurance verification — call worksheet
      </h2>

      <div className="cs-top-grid">
        <div className="cs-static-ref">
          <strong>Tax ID:</strong> 141857114
          <br />
          <strong>NPI</strong> 1063588804 – Adv Bar
          <br />
          <strong>NPI</strong> 1487730511 – Dr Syn
          <br />
          <strong>NPI</strong> 1164425559 – Dr Howe
          <ul>
            <li>
              <strong>NPI</strong> 1922001775 – LHH
            </li>
            <li>
              <strong>NPI</strong> 1629053509 – PRMC
            </li>
          </ul>
        </div>
        <div>
          <div className="cs-row-2">
            <div className="cs-field">
              <label htmlFor="cs-date">Date</label>
              <input id="cs-date" type="date" value={value.csDate} onChange={ch('csDate')} />
            </div>
            <div className="cs-field">
              <label htmlFor="cs-initials">Initials</label>
              <input id="cs-initials" type="text" value={value.csInitials} onChange={ch('csInitials')} autoComplete="off" />
            </div>
          </div>
          <div className="cs-field">
            <label htmlFor="cs-patient">Patient</label>
            <input id="cs-patient" type="text" value={value.patientName} onChange={ch('patientName')} autoComplete="name" />
          </div>
          <div className="cs-field">
            <label htmlFor="cs-dob">DOB</label>
            <input id="cs-dob" type="text" value={value.patientDob} onChange={ch('patientDob')} placeholder="MM/DD/YYYY" />
          </div>
          <div className="cs-field">
            <label htmlFor="cs-insured">Insured</label>
            <input id="cs-insured" type="text" value={value.insured} onChange={ch('insured')} />
          </div>
        </div>
      </div>

      <div className="cs-ins-level">
        <span className="cs-label" style={{ width: '100%', marginBottom: 4 }}>
          Insurance level
        </span>
        {['primary', 'secondary', 'tertiary'].map((lvl) => (
          <label key={lvl}>
            <input type="radio" name="cs-ins-level" checked={value.insuranceLevel === lvl} onChange={() => p('insuranceLevel', lvl)} />
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </label>
        ))}
      </div>

      <div className="cs-row-2">
        <div className="cs-field">
          <label htmlFor="cs-ins-name">Insurance</label>
          <input id="cs-ins-name" type="text" value={value.insuranceName} onChange={ch('insuranceName')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-ins-ph">Ph #</label>
          <input id="cs-ins-ph" type="tel" value={value.insurancePhone} onChange={ch('insurancePhone')} />
        </div>
      </div>
      <div className="cs-row-2">
        <div className="cs-field">
          <label htmlFor="cs-ins-id">ID#</label>
          <input id="cs-ins-id" type="text" value={value.insuranceId} onChange={ch('insuranceId')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-spoke">Spoke w/</label>
          <input id="cs-spoke" type="text" value={value.spokeWith} onChange={ch('spokeWith')} />
        </div>
      </div>
      <div className="cs-row-2">
        <div className="cs-field">
          <label htmlFor="cs-grp">Group #</label>
          <input id="cs-grp" type="text" value={value.groupNumber} onChange={ch('groupNumber')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-ref">Call Ref #</label>
          <input id="cs-ref" type="text" value={value.callRefNumber} onChange={ch('callRefNumber')} />
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section-title">Facility requirements</div>
        <Yn group="coe" label="COE Facility Required" value={value.coeFacilityRequired} onPick={(v) => p('coeFacilityRequired', v)} />
        <div className="cs-row-2" style={{ marginTop: 8 }}>
          <Yn group="lhh" label="Facility IN Network — LHH" value={value.facilityLhhNetwork} onPick={(v) => p('facilityLhhNetwork', v)} />
          <Yn group="prmc" label="Facility IN Network — PRMC" value={value.facilityPrmcNetwork} onPick={(v) => p('facilityPrmcNetwork', v)} />
        </div>
        <div className="cs-field" style={{ marginTop: 8 }}>
          <label htmlFor="cs-fac-note">Note</label>
          <input id="cs-fac-note" type="text" value={value.facilityNote} onChange={ch('facilityNote')} />
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section-title">Insurance benefit information</div>
        <div className="cs-benefits-grid">
          <div>
            <div className="cs-row-2">
              <div className="cs-field">
                <label htmlFor="cs-eff">Effective Date</label>
                <input id="cs-eff" type="text" value={value.effectiveDate} onChange={ch('effectiveDate')} />
              </div>
              <div className="cs-field">
                <label htmlFor="cs-plan">Plan Type</label>
                <select id="cs-plan" value={value.planType} onChange={ch('planType')}>
                  <option value="">— Select —</option>
                  {PLAN_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Yn
              group="defex"
              label={
                <>
                  Definite Exclusion <span className="cs-codes">(E66.01)</span>
                </>
              }
              value={value.definiteExclusion}
              onPick={(v) => p('definiteExclusion', v)}
            />
            <Yn group="pcpref" label="PCP Referral Required" value={value.pcpReferralRequired} onPick={(v) => p('pcpReferralRequired', v)} />
            <div className="cs-field">
              <label htmlFor="cs-pcp">PCP</label>
              <input id="cs-pcp" type="text" value={value.pcpName} onChange={ch('pcpName')} />
            </div>
            <Yn group="refreq" label="Referral Requested" value={value.referralRequested} onPick={(v) => p('referralRequested', v)} />
            <div className="cs-row-2" style={{ marginTop: 6, alignItems: 'end' }}>
              <div>
                <span className="cs-label">From</span>
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                    <input type="radio" name="cs-ref-from" checked={value.referralFrom === 'PT'} onChange={() => p('referralFrom', 'PT')} />
                    PT
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                    <input type="radio" name="cs-ref-from" checked={value.referralFrom === 'PCP'} onChange={() => p('referralFrom', 'PCP')} />
                    PCP
                  </label>
                </div>
              </div>
              <div>
                <Yn group="refrec" label="Referral Rec'd" value={value.referralReceived} onPick={(v) => p('referralReceived', v)} />
              </div>
            </div>
            <Yn group="egd" label="EGD Auth Required (43235, 43239)" value={value.egdAuthRequired} onPick={(v) => p('egdAuthRequired', v)} />
            <Yn group="echo" label="ECHO Auth Required (93306)" value={value.echoAuthRequired} onPick={(v) => p('echoAuthRequired', v)} />
            <Yn group="dop" label="Doppler Auth Required (93970)" value={value.dopplerAuthRequired} onPick={(v) => p('dopplerAuthRequired', v)} />
            <Yn group="fib" label="FibroScan Auth Required (76981)" value={value.fibroscanAuthRequired} onPick={(v) => p('fibroscanAuthRequired', v)} />
            <div className="cs-field" style={{ marginTop: 8 }}>
              <label htmlFor="cs-tpa">Third Party Authorization Portal</label>
              <input id="cs-tpa" type="text" value={value.thirdPartyAuthPortal} onChange={ch('thirdPartyAuthPortal')} />
            </div>
          </div>
          <div>
            <div className="cs-box">
              <div className="cs-box-title">Bariatrics</div>
              <Yn group="barauth" label="In Pt Auth Req" value={value.bariatricsInPtAuthReq} onPick={(v) => p('bariatricsInPtAuthReq', v)} />
              <p className="cs-codes">
                Codes: LSADS <strong>43659</strong>, RYGB <strong>43644</strong>, LSG <strong>43775</strong>
              </p>
            </div>
            <div className="cs-box">
              <div className="cs-box-title">Plastics</div>
              <Yn group="plast" label="Auth Req" value={value.plasticsAuthReq} onPick={(v) => p('plasticsAuthReq', v)} />
              <p className="cs-codes">
                360 (<strong>15830</strong>, <strong>15847</strong>, <strong>15834</strong>, <strong>15835</strong>), Thighs (<strong>15832</strong>), Arms (
                <strong>15836</strong>)
              </p>
              <p className="cs-codes">
                ICD-10: <strong>L30.4</strong>, <strong>L91.8</strong>, <strong>L98.7</strong>, <strong>L53.9</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section-title">Network benefits</div>
        <div className="cs-benefits-grid">
          <div className="cs-net-block">
            <h4>In Network</h4>
            <div className="cs-field">
              <label>OV Copay</label>
              <input type="text" value={value.inNetOvCopay} onChange={ch('inNetOvCopay')} />
            </div>
            <div className="cs-subgrid">
              <div className="cs-field">
                <label>Deductible</label>
                <input type="text" value={value.inNetDeductible} onChange={ch('inNetDeductible')} />
              </div>
              <div className="cs-field">
                <label>Rem</label>
                <input type="text" value={value.inNetDeductibleRem} onChange={ch('inNetDeductibleRem')} />
              </div>
              <div className="cs-field">
                <label>Co-Ins%</label>
                <input type="text" value={value.inNetCoins} onChange={ch('inNetCoins')} />
              </div>
            </div>
            <div className="cs-row-2" style={{ marginTop: 8 }}>
              <div className="cs-field">
                <label>OOP</label>
                <input type="text" value={value.inNetOop} onChange={ch('inNetOop')} />
              </div>
              <div className="cs-field">
                <label>Rem</label>
                <input type="text" value={value.inNetOopRem} onChange={ch('inNetOopRem')} />
              </div>
            </div>
          </div>
          <div className="cs-net-block">
            <h4>Out of Network</h4>
            <div className="cs-field">
              <label>OV Copay</label>
              <input type="text" value={value.outNetOvCopay} onChange={ch('outNetOvCopay')} />
            </div>
            <div className="cs-subgrid">
              <div className="cs-field">
                <label>Deductible</label>
                <input type="text" value={value.outNetDeductible} onChange={ch('outNetDeductible')} />
              </div>
              <div className="cs-field">
                <label>Rem</label>
                <input type="text" value={value.outNetDeductibleRem} onChange={ch('outNetDeductibleRem')} />
              </div>
              <div className="cs-field">
                <label>Co-Ins%</label>
                <input type="text" value={value.outNetCoins} onChange={ch('outNetCoins')} />
              </div>
            </div>
            <div className="cs-row-2" style={{ marginTop: 8 }}>
              <div className="cs-field">
                <label>OOP</label>
                <input type="text" value={value.outNetOop} onChange={ch('outNetOop')} />
              </div>
              <div className="cs-field">
                <label>Rem</label>
                <input type="text" value={value.outNetOopRem} onChange={ch('outNetOopRem')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section-title">Notes</div>
        <div className="cs-field">
          <label htmlFor="cs-req-bmi">Requirements for Bariatric Surgery: Weight/BMI</label>
          <input id="cs-req-bmi" type="text" value={value.reqsBariatricWeightBmi} onChange={ch('reqsBariatricWeightBmi')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-gen-notes">General notes</label>
          <textarea id="cs-gen-notes" rows={4} value={value.generalNotes} onChange={ch('generalNotes')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-comorb">Comorbidities</label>
          <input id="cs-comorb" type="text" value={value.comorbiditiesNotes} onChange={ch('comorbiditiesNotes')} />
        </div>
        <div className="cs-field">
          <label htmlFor="cs-diet">Diet Visits Req</label>
          <input id="cs-diet" type="text" value={value.dietVisitsReq} onChange={ch('dietVisitsReq')} />
        </div>
        <div className="cs-row-2" style={{ marginTop: 10 }}>
          <Yn group="pred" label="Pre-D(RCR) REQ" value={value.preDrcrReq} onPick={(v) => p('preDrcrReq', v)} />
          <Yn group="benpr" label="Benefits Printed" value={value.benefitsPrinted} onPick={(v) => p('benefitsPrinted', v)} />
        </div>
        <div className="cs-row-2">
          <Yn group="cardp" label="Card Printed" value={value.cardPrinted} onPick={(v) => p('cardPrinted', v)} />
          <div />
        </div>
        <div className="cs-field" style={{ marginTop: 8 }}>
          <label htmlFor="cs-final">Final note</label>
          <input id="cs-final" type="text" value={value.finalNote} onChange={ch('finalNote')} />
        </div>
      </div>
    </div>
  )
}

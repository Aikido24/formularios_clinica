import './IntakeForm.css'

/** @param {{ value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }} props */
export default function IntakeForm({ value, onChange }) {
  const set =
    (key) =>
    (e) => {
      const t = e.target
      const v = t.type === 'checkbox' ? t.checked : t.value
      onChange({ ...value, [key]: v })
    }

  const yn = (name, key) => (
    <div>
      <span>{name}</span>
      <span className="intake-radio-row" style={{ gap: 10 }}>
        <label>
          <input
            type="radio"
            name={`intake-yn-${key}`}
            checked={value[key] === 'yes'}
            onChange={() => onChange({ ...value, [key]: 'yes' })}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            name={`intake-yn-${key}`}
            checked={value[key] === 'no'}
            onChange={() => onChange({ ...value, [key]: 'no' })}
          />
          No
        </label>
      </span>
    </div>
  )

  return (
    <div className="intake-paper" id="intake-form-block">
      <p className="intake-brand">The Advanced Bariatric Surgery Center</p>
      <h2 className="intake-title">INTAKE FORM</h2>

      <div className="intake-meta-row">
        <div className="intake-field">
          <label htmlFor="intake-intakeDate">Intake Date</label>
          <input id="intake-intakeDate" type="date" value={value.intakeDate} onChange={set('intakeDate')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-referredBy">Referred By</label>
          <input id="intake-referredBy" type="text" value={value.referredBy} onChange={set('referredBy')} autoComplete="off" />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-staffName">Staff Name</label>
          <input id="intake-staffName" type="text" value={value.staffName} onChange={set('staffName')} autoComplete="off" />
        </div>
      </div>

      <div className="intake-field">
        <label htmlFor="intake-patientName">Name</label>
        <input id="intake-patientName" type="text" value={value.patientName} onChange={set('patientName')} autoComplete="name" />
      </div>
      <div className="intake-field">
        <label htmlFor="intake-address1">Address</label>
        <input id="intake-address1" type="text" value={value.addressLine1} onChange={set('addressLine1')} autoComplete="street-address" />
      </div>
      <div className="intake-field">
        <label htmlFor="intake-address2">Address (line 2)</label>
        <input id="intake-address2" type="text" value={value.addressLine2} onChange={set('addressLine2')} />
      </div>

      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-phone">Phone #</label>
          <input id="intake-phone" type="tel" value={value.patientPhone} onChange={set('patientPhone')} autoComplete="tel" />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-email">Email Address</label>
          <input id="intake-email" type="email" value={value.email} onChange={set('email')} autoComplete="email" />
        </div>
      </div>

      <div className="intake-grid-2">
        <div className="intake-field">
          <span className="intake-label">Gender</span>
          <div className="intake-radio-row">
            <label>
              <input type="radio" name="intake-gender" checked={value.gender === 'male'} onChange={() => onChange({ ...value, gender: 'male' })} />
              Male
            </label>
            <label>
              <input type="radio" name="intake-gender" checked={value.gender === 'female'} onChange={() => onChange({ ...value, gender: 'female' })} />
              Female
            </label>
          </div>
        </div>
        <div className="intake-field">
          <label htmlFor="intake-patientDob">DOB (Date of Birth)</label>
          <input id="intake-patientDob" type="date" value={value.patientDob} onChange={set('patientDob')} />
        </div>
      </div>

      <div className="intake-field">
        <label htmlFor="intake-ss">SS#</label>
        <input id="intake-ss" type="text" value={value.patientSs} onChange={set('patientSs')} autoComplete="off" inputMode="numeric" />
      </div>
      <div className="intake-grid-3">
        <div className="intake-field">
          <label htmlFor="intake-ht">HT (Height)</label>
          <input id="intake-ht" type="text" value={value.height} onChange={set('height')} placeholder='e.g. 5&apos;8"' />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-wt">WT (Weight)</label>
          <input id="intake-wt" type="text" value={value.weight} onChange={set('weight')} placeholder="lbs" />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-bmi">BMI</label>
          <input id="intake-bmi" type="text" value={value.bmi} onChange={set('bmi')} />
        </div>
      </div>

      <div className="intake-field">
        <label htmlFor="intake-pcp">
          Primary Care Provider <span style={{ color: '#c2410c' }}>*</span>
        </label>
        <input id="intake-pcp" type="text" value={value.primaryCareProvider} onChange={set('primaryCareProvider')} />
      </div>

      <h3 className="intake-section-title">Primary Insurance</h3>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-pri-ins">Primary Insurance</label>
          <input id="intake-pri-ins" type="text" value={value.primaryInsurance} onChange={set('primaryInsurance')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-pri-phone">Phone #</label>
          <input id="intake-pri-phone" type="tel" value={value.primaryInsurancePhone} onChange={set('primaryInsurancePhone')} />
        </div>
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-pri-insured">Insured (Name)</label>
          <input id="intake-pri-insured" type="text" value={value.primaryInsuredName} onChange={set('primaryInsuredName')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-pri-ss">SS#</label>
          <input id="intake-pri-ss" type="text" value={value.primaryInsuredSs} onChange={set('primaryInsuredSs')} />
        </div>
      </div>
      <div className="intake-field" style={{ maxWidth: 320 }}>
        <label htmlFor="intake-pri-dob">DOB</label>
        <input id="intake-pri-dob" type="date" value={value.primaryInsuredDob} onChange={set('primaryInsuredDob')} />
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-pri-id">ID#</label>
          <input id="intake-pri-id" type="text" value={value.primaryId} onChange={set('primaryId')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-pri-grp">Group#</label>
          <input id="intake-pri-grp" type="text" value={value.primaryGroup} onChange={set('primaryGroup')} />
        </div>
      </div>

      <h3 className="intake-section-title">Secondary Insurance</h3>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-ins">Secondary Insurance</label>
          <input id="intake-sec-ins" type="text" value={value.secondaryInsurance} onChange={set('secondaryInsurance')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-phone">Phone #</label>
          <input id="intake-sec-phone" type="tel" value={value.secondaryInsurancePhone} onChange={set('secondaryInsurancePhone')} />
        </div>
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-insured">Insured (Name)</label>
          <input id="intake-sec-insured" type="text" value={value.secondaryInsuredName} onChange={set('secondaryInsuredName')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-ss">SS#</label>
          <input id="intake-sec-ss" type="text" value={value.secondaryInsuredSs} onChange={set('secondaryInsuredSs')} />
        </div>
      </div>
      <div className="intake-field" style={{ maxWidth: 320 }}>
        <label htmlFor="intake-sec-dob">DOB</label>
        <input id="intake-sec-dob" type="date" value={value.secondaryInsuredDob} onChange={set('secondaryInsuredDob')} />
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-id">ID#</label>
          <input id="intake-sec-id" type="text" value={value.secondaryId} onChange={set('secondaryId')} />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-grp">Group#</label>
          <input id="intake-sec-grp" type="text" value={value.secondaryGroup} onChange={set('secondaryGroup')} />
        </div>
      </div>

      <h3 className="intake-section-title">Medical History &amp; Comorbidities</h3>
      <div className="intake-field">
        <span className="intake-label">Self Pay</span>
        <div className="intake-radio-row">
          <label>
            <input type="radio" name="intake-selfpay" checked={value.selfPay === 'yes'} onChange={() => onChange({ ...value, selfPay: 'yes' })} />
            Yes
          </label>
          <label>
            <input type="radio" name="intake-selfpay" checked={value.selfPay === 'no'} onChange={() => onChange({ ...value, selfPay: 'no' })} />
            No
          </label>
        </div>
      </div>
      <div className="intake-field">
        <span className="intake-label">Comorbidities for patient</span>
        <div className="intake-check-row">
          <label>
            <input type="checkbox" checked={value.comorbidDiabetic} onChange={set('comorbidDiabetic')} />
            Diabetic
          </label>
          <label>
            <input type="checkbox" checked={value.comorbidHbp} onChange={set('comorbidHbp')} />
            High Blood Pressure
          </label>
          <label>
            <input type="checkbox" checked={value.comorbidChol} onChange={set('comorbidChol')} />
            High Cholesterol
          </label>
          <label>
            <input type="checkbox" checked={value.comorbidThyroid} onChange={set('comorbidThyroid')} />
            Thyroid
          </label>
          <label>
            <input type="checkbox" checked={value.comorbidSleepApnea} onChange={set('comorbidSleepApnea')} />
            Sleep Apnea
          </label>
        </div>
      </div>
      <div className="intake-field">
        <label htmlFor="intake-health-weight">Health issues pertaining to patient&apos;s weight</label>
        <textarea id="intake-health-weight" rows={3} value={value.healthIssuesWeight} onChange={set('healthIssuesWeight')} />
      </div>

      <h3 className="intake-section-title">Surgery History</h3>
      <div className="intake-surgery-box">
        <div className="intake-surgery-yn">
          {yn('Have you had Previous Surgery?', 'prevSurgery')}
          {yn('Are you interested in a Revision?', 'interestedRevision')}
          {yn('Are you interested in Skin Removal?', 'interestedSkinRemoval')}
          {yn('Do you need a Hernia repair?', 'needHerniaRepair')}
        </div>
        <div className="intake-label">If any above is Yes — detail (surgeon, dates, weights, comments)</div>
        <div className="intake-grid-2">
          <div className="intake-field">
            <label htmlFor="intake-surg-name">Surgeon&apos;s Name</label>
            <input id="intake-surg-name" type="text" value={value.surgerySurgeonName} onChange={set('surgerySurgeonName')} />
          </div>
          <div className="intake-field">
            <label htmlFor="intake-surg-date">Date / Year</label>
            <input id="intake-surg-date" type="text" value={value.surgeryDateYear} onChange={set('surgeryDateYear')} />
          </div>
        </div>
        <div className="intake-grid-2">
          <div className="intake-field">
            <label htmlFor="intake-surg-start">Start Wt</label>
            <input id="intake-surg-start" type="text" value={value.surgeryStartWt} onChange={set('surgeryStartWt')} />
          </div>
          <div className="intake-field">
            <label htmlFor="intake-surg-end">End Wt</label>
            <input id="intake-surg-end" type="text" value={value.surgeryEndWt} onChange={set('surgeryEndWt')} />
          </div>
        </div>
        <div className="intake-field">
          <label htmlFor="intake-surg-comments">Comments</label>
          <textarea id="intake-surg-comments" rows={4} value={value.surgeryComments} onChange={set('surgeryComments')} />
        </div>
      </div>

      <p className="intake-footnote">
        Complete this intake before uploading insurance card images. Information is stored with your verification record.
      </p>
    </div>
  )
}

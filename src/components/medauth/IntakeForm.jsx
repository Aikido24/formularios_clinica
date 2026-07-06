import './IntakeForm.css'

import { getTodayIntakeDate, SURGERY_HISTORY_QUESTIONS, clearSurgeryQuestionDetails, calculateBmi, sanitizeFloatInput } from './intakeFormModel.js'

/** @param {{ value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void; fieldErrors?: Record<string, string> }} props */
export default function IntakeForm({ value, onChange, fieldErrors = {} }) {
  const set =
    (key) =>
    (e) => {
      const t = e.target
      const v = t.type === 'checkbox' ? t.checked : t.value
      onChange({ ...value, [key]: v })
    }

  const err = (key) => fieldErrors[key]
  const inputClass = (key) => (err(key) ? 'intake-input-error' : undefined)

  const setWithBmi =
    (key) =>
    (e) => {
      const v = sanitizeFloatInput(e.target.value)
      const next = { ...value, [key]: v }
      next.bmi = calculateBmi(next.height, next.weight)
      onChange(next)
    }

  const setHasSecondaryInsurance = (answer) => {
    if (answer === 'no') {
      onChange({
        ...value,
        hasSecondaryInsurance: 'no',
        secondaryInsurance: '',
        secondaryInsurancePhone: '',
        secondaryInsuredName: '',
        secondaryInsuredSs: '',
        secondaryInsuredDob: '',
        secondaryId: '',
        secondaryGroup: '',
      })
      return
    }
    onChange({ ...value, hasSecondaryInsurance: 'yes' })
  }

  const setSurgeryAnswer = (questionKey, answer) => {
    if (answer === 'no') {
      onChange({ ...value, [questionKey]: 'no', ...clearSurgeryQuestionDetails(questionKey) })
      return
    }
    onChange({ ...value, [questionKey]: 'yes' })
  }

  const surgeryDetails = (questionKey, idPrefix) => (
    <div className="intake-surgery-details">
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor={`${idPrefix}-name`}>Surgeon&apos;s Name</label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            value={value[`${questionKey}SurgeonName`]}
            onChange={set(`${questionKey}SurgeonName`)}
          />
        </div>
        <div className="intake-field">
          <label htmlFor={`${idPrefix}-date`}>Date / Year</label>
          <input
            id={`${idPrefix}-date`}
            type="text"
            value={value[`${questionKey}DateYear`]}
            onChange={set(`${questionKey}DateYear`)}
          />
        </div>
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor={`${idPrefix}-start`}>Start Wt</label>
          <input
            id={`${idPrefix}-start`}
            type="text"
            value={value[`${questionKey}StartWt`]}
            onChange={set(`${questionKey}StartWt`)}
          />
        </div>
        <div className="intake-field">
          <label htmlFor={`${idPrefix}-end`}>End Wt</label>
          <input
            id={`${idPrefix}-end`}
            type="text"
            value={value[`${questionKey}EndWt`]}
            onChange={set(`${questionKey}EndWt`)}
          />
        </div>
      </div>
      <div className="intake-field">
        <label htmlFor={`${idPrefix}-comments`}>Comments</label>
        <textarea
          id={`${idPrefix}-comments`}
          rows={3}
          value={value[`${questionKey}Comments`]}
          onChange={set(`${questionKey}Comments`)}
        />
      </div>
    </div>
  )

  return (
    <div className="intake-paper" id="intake-form-block">
      <p className="intake-brand">The Advanced Bariatric Surgery Center</p>
      <h2 className="intake-title">INTAKE FORM</h2>

      <div className="intake-meta-row">
        <div className="intake-field">
          <label htmlFor="intake-intakeDate">Intake Date</label>
          <input
            id="intake-intakeDate"
            type="date"
            className="intake-date-readonly"
            value={value.intakeDate || getTodayIntakeDate()}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
        </div>
      </div>

      <div className="intake-field">
        <label htmlFor="intake-patientName">
          Name <span className="intake-required">*</span>
        </label>
        <input
          id="intake-patientName"
          type="text"
          className={inputClass('patientName')}
          value={value.patientName}
          onChange={set('patientName')}
          autoComplete="name"
          required
          aria-invalid={err('patientName') ? 'true' : undefined}
        />
      </div>
      <div className="intake-field">
        <label htmlFor="intake-address1">
          Address <span className="intake-required">*</span>
        </label>
        <input
          id="intake-address1"
          type="text"
          className={inputClass('addressLine1')}
          value={value.addressLine1}
          onChange={set('addressLine1')}
          autoComplete="street-address"
          required
          aria-invalid={err('addressLine1') ? 'true' : undefined}
        />
      </div>
      <div className="intake-field">
        <label htmlFor="intake-address2">Address (line 2)</label>
        <input id="intake-address2" type="text" value={value.addressLine2} onChange={set('addressLine2')} />
      </div>

      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-phone">
            Phone # <span className="intake-required">*</span>
          </label>
          <input
            id="intake-phone"
            type="tel"
            className={inputClass('patientPhone')}
            value={value.patientPhone}
            onChange={set('patientPhone')}
            autoComplete="tel"
            required
            aria-invalid={err('patientPhone') ? 'true' : undefined}
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-email">Email Address</label>
          <input id="intake-email" type="email" value={value.email} onChange={set('email')} autoComplete="email" />
        </div>
      </div>

      <div className="intake-grid-2">
        <div className="intake-field">
          <span className="intake-label">
            Gender <span className="intake-required">*</span>
          </span>
          <div className={`intake-radio-row${err('gender') ? ' intake-input-error' : ''}`} role="radiogroup" aria-invalid={err('gender') ? 'true' : undefined}>
            <label>
              <input type="radio" name="intake-gender" checked={value.gender === 'male'} onChange={() => onChange({ ...value, gender: 'male' })} />
              Male
            </label>
            <label>
              <input type="radio" name="intake-gender" checked={value.gender === 'female'} onChange={() => onChange({ ...value, gender: 'female' })} />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="intake-gender"
                checked={value.gender === 'other'}
                onChange={() => onChange({ ...value, gender: 'other' })}
              />
              Other
            </label>
          </div>
        </div>
        <div className="intake-field">
          <label htmlFor="intake-patientDob">
            DOB (Date of Birth) <span className="intake-required">*</span>
          </label>
          <input
            id="intake-patientDob"
            type="date"
            className={inputClass('patientDob')}
            value={value.patientDob}
            onChange={set('patientDob')}
            required
            aria-invalid={err('patientDob') ? 'true' : undefined}
          />
        </div>
      </div>

      <div className="intake-field">
        <label htmlFor="intake-ss">
          SSN <span className="intake-required">*</span>
        </label>
        <input
          id="intake-ss"
          type="text"
          className={inputClass('patientSs')}
          value={value.patientSs}
          onChange={set('patientSs')}
          autoComplete="off"
          inputMode="numeric"
          required
          aria-invalid={err('patientSs') ? 'true' : undefined}
        />
      </div>
      <div className="intake-grid-3">
        <div className="intake-field">
          <label htmlFor="intake-ht">HT (Height)</label>
          <input
            id="intake-ht"
            type="text"
            inputMode="decimal"
            value={value.height}
            onChange={setWithBmi('height')}
            placeholder="inches"
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-wt">WT (Weight)</label>
          <input
            id="intake-wt"
            type="text"
            inputMode="decimal"
            value={value.weight}
            onChange={setWithBmi('weight')}
            placeholder="lbs"
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-bmi">BMI</label>
          <input
            id="intake-bmi"
            type="text"
            className="intake-date-readonly"
            value={value.bmi}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
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
          <label htmlFor="intake-pri-ss">SSN</label>
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

      <div className="intake-field">
        <span className="intake-label">
          Do you have secondary insurance? <span className="intake-required">*</span>
        </span>
        <div
          className={`intake-radio-row${err('hasSecondaryInsurance') ? ' intake-input-error' : ''}`}
          role="radiogroup"
          aria-invalid={err('hasSecondaryInsurance') ? 'true' : undefined}
        >
          <label>
            <input
              type="radio"
              name="intake-hasSecondaryInsurance"
              checked={value.hasSecondaryInsurance === 'yes'}
              onChange={() => setHasSecondaryInsurance('yes')}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="intake-hasSecondaryInsurance"
              checked={value.hasSecondaryInsurance === 'no'}
              onChange={() => setHasSecondaryInsurance('no')}
            />
            No
          </label>
        </div>
        <p className="intake-field-hint">
          If you answer <strong>Yes</strong>, you must provide complete Secondary Insurance information below. All fields in that
          section are required.
        </p>
      </div>

      {value.hasSecondaryInsurance === 'yes' ? (
        <>
      <h3 className="intake-section-title">Secondary Insurance</h3>
      <p className="intake-field-hint intake-field-hint--active">Required — please complete every field in this section.</p>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-ins">
            Secondary Insurance <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-ins"
            type="text"
            className={inputClass('secondaryInsurance')}
            value={value.secondaryInsurance}
            onChange={set('secondaryInsurance')}
            aria-invalid={err('secondaryInsurance') ? 'true' : undefined}
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-phone">
            Phone # <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-phone"
            type="tel"
            className={inputClass('secondaryInsurancePhone')}
            value={value.secondaryInsurancePhone}
            onChange={set('secondaryInsurancePhone')}
            aria-invalid={err('secondaryInsurancePhone') ? 'true' : undefined}
          />
        </div>
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-insured">
            Insured (Name) <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-insured"
            type="text"
            className={inputClass('secondaryInsuredName')}
            value={value.secondaryInsuredName}
            onChange={set('secondaryInsuredName')}
            aria-invalid={err('secondaryInsuredName') ? 'true' : undefined}
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-ss">
            SSN <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-ss"
            type="text"
            className={inputClass('secondaryInsuredSs')}
            value={value.secondaryInsuredSs}
            onChange={set('secondaryInsuredSs')}
            aria-invalid={err('secondaryInsuredSs') ? 'true' : undefined}
          />
        </div>
      </div>
      <div className="intake-field" style={{ maxWidth: 320 }}>
        <label htmlFor="intake-sec-dob">
          DOB <span className="intake-required">*</span>
        </label>
        <input
          id="intake-sec-dob"
          type="date"
          className={inputClass('secondaryInsuredDob')}
          value={value.secondaryInsuredDob}
          onChange={set('secondaryInsuredDob')}
          aria-invalid={err('secondaryInsuredDob') ? 'true' : undefined}
        />
      </div>
      <div className="intake-grid-2">
        <div className="intake-field">
          <label htmlFor="intake-sec-id">
            ID# <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-id"
            type="text"
            className={inputClass('secondaryId')}
            value={value.secondaryId}
            onChange={set('secondaryId')}
            aria-invalid={err('secondaryId') ? 'true' : undefined}
          />
        </div>
        <div className="intake-field">
          <label htmlFor="intake-sec-grp">
            Group# <span className="intake-required">*</span>
          </label>
          <input
            id="intake-sec-grp"
            type="text"
            className={inputClass('secondaryGroup')}
            value={value.secondaryGroup}
            onChange={set('secondaryGroup')}
            aria-invalid={err('secondaryGroup') ? 'true' : undefined}
          />
        </div>
      </div>
        </>
      ) : null}

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
        <div className="intake-surgery-stack">
          {SURGERY_HISTORY_QUESTIONS.map(({ key, label, hasDetails }) => (
            <div key={key} className="intake-surgery-question">
              <div className="intake-surgery-question-head">
                <span className="intake-surgery-question-label">{label}</span>
                <div className="intake-radio-row">
                  <label>
                    <input
                      type="radio"
                      name={`intake-yn-${key}`}
                      checked={value[key] === 'yes'}
                      onChange={() => setSurgeryAnswer(key, 'yes')}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`intake-yn-${key}`}
                      checked={value[key] === 'no'}
                      onChange={() => setSurgeryAnswer(key, 'no')}
                    />
                    No
                  </label>
                </div>
              </div>
              {hasDetails && value[key] === 'yes' ? surgeryDetails(key, `intake-surg-${key}`) : null}
            </div>
          ))}
        </div>
      </div>

      <p className="intake-footnote">
        Complete this intake before uploading insurance card images. Information is stored with your verification record.
      </p>
    </div>
  )
}

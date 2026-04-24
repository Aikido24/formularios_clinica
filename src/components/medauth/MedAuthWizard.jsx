import { useState, useCallback, useRef, useEffect } from 'react'

import {
  EMPTY_EXTRACTED_DATA,
  prepareImageForOcrBlob,
  runInsuranceCardOcr,
  mergeParsedData,
} from '../../ocrHelpers.js'
import { createEmptyScriptAnswers } from '../../medauthForm.js'
import {
  buildVerificationReport,
  submitVerificationFlow,
} from '../../services/verificationSubmit.js'
import { FRONT_OCR_CLEAR_KEYS, BACK_OCR_CLEAR_KEYS } from './clinicaFormFields.js'
import { ClinicaResultCard } from './ClinicaResultCard.jsx'
import IntakeForm from './IntakeForm.jsx'
import { createEmptyIntakeForm } from './intakeFormModel.js'
import CallScriptForm from './CallScriptForm.jsx'
import { createEmptyCallScriptForm } from './callScriptFormModel.js'

const STEP_LABELS = [
  { label: 'Patient data & insurance card', pct: 33 },
  { label: 'Verification worksheet', pct: 66 },
  { label: 'Final result', pct: 100 },
]

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{name}</span>
}

function OcrSideLabelContent({ visible, fill, label }) {
  if (visible && fill >= 100 && label === 'Data extracted successfully') {
    return (
      <>
        <Icon name="check_circle" /> {label}
      </>
    )
  }
  if (label.includes('Read error')) {
    return (
      <>
        <Icon name="warning" /> {label}
      </>
    )
  }
  return label
}

export default function MedAuthWizard() {
  const [step, setStep] = useState(1)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontUrl, setFrontUrl] = useState('')
  const [backUrl, setBackUrl] = useState('')
  const [b64Front, setB64Front] = useState('')
  const [b64Back, setB64Back] = useState('')
  const [showFrontDrop, setShowFrontDrop] = useState(true)
  const [showBackDrop, setShowBackDrop] = useState(true)
  const [ocrFrontVisible, setOcrFrontVisible] = useState(false)
  const [ocrBackVisible, setOcrBackVisible] = useState(false)
  const [ocrFrontFill, setOcrFrontFill] = useState(0)
  const [ocrBackFill, setOcrBackFill] = useState(0)
  const [ocrFrontLabel, setOcrFrontLabel] = useState('Reading front of card...')
  const [ocrBackLabel, setOcrBackLabel] = useState('Reading back of card...')
  const [extractedData, setExtractedData] = useState(() => ({ ...EMPTY_EXTRACTED_DATA }))
  const [formError, setFormError] = useState(false)
  const [scriptAnswers] = useState(() => createEmptyScriptAnswers())
  const [callForm, setCallForm] = useState(() => createEmptyCallScriptForm())
  const [submitting, setSubmitting] = useState(false)
  const [statusSending, setStatusSending] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(false)
  const [statusError, setStatusError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultData, setResultData] = useState(null)
  const [intakeData, setIntakeData] = useState(() => createEmptyIntakeForm())

  const frontCamRef = useRef(null)
  const backCamRef = useRef(null)
  const callStepPrefillRef = useRef(0)

  useEffect(() => {
    if (step !== 2) {
      callStepPrefillRef.current = 0
      return
    }
    if (callStepPrefillRef.current === 2) return
    callStepPrefillRef.current = 2
    setCallForm((prev) => ({
      ...prev,
      patientName: prev.patientName || intakeData.patientName || '',
      insured: prev.insured || intakeData.primaryInsuredName || '',
      insuranceName:
        prev.insuranceName || extractedData.insuranceCompany || intakeData.primaryInsurance || '',
      insurancePhone:
        prev.insurancePhone ||
        extractedData.phoneCustomerService ||
        intakeData.primaryInsurancePhone ||
        '',
      insuranceId: prev.insuranceId || extractedData.memberId || '',
      groupNumber: prev.groupNumber || extractedData.groupNumber || '',
    }))
  }, [step, intakeData, extractedData])

  const resetAll = useCallback(() => {
    if (frontUrl) URL.revokeObjectURL(frontUrl)
    if (backUrl) URL.revokeObjectURL(backUrl)
    setStep(1)
    setFrontFile(null)
    setBackFile(null)
    setFrontUrl('')
    setBackUrl('')
    setB64Front('')
    setB64Back('')
    setShowFrontDrop(true)
    setShowBackDrop(true)
    setOcrFrontVisible(false)
    setOcrBackVisible(false)
    setExtractedData({ ...EMPTY_EXTRACTED_DATA })
    setFormError(false)
    setCallForm(createEmptyCallScriptForm())
    setStatusSending(false)
    setStatusSuccess(false)
    setStatusError(false)
    setResultData(null)
    setOcrFrontFill(0)
    setOcrBackFill(0)
    setOcrFrontLabel('Reading front of card...')
    setOcrBackLabel('Reading back of card...')
    setIntakeData(createEmptyIntakeForm())
  }, [frontUrl, backUrl])

  const runOcrForSide = async (side, file) => {
    const setFill = side === 'front' ? setOcrFrontFill : setOcrBackFill
    const setLabel = side === 'front' ? setOcrFrontLabel : setOcrBackLabel
    const setPanel = side === 'front' ? setOcrFrontVisible : setOcrBackVisible
    setPanel(true)
    setFill(5)
    setLabel(side === 'front' ? 'Reading front of card...' : 'Reading back of card...')
    try {
      const prep = await prepareImageForOcrBlob(file)
      const out = await runInsuranceCardOcr({
        frontBlob: side === 'front' ? prep : null,
        backBlob: side === 'back' ? prep : null,
        frontFallbackBlob: side === 'front' ? file : null,
        backFallbackBlob: side === 'back' ? file : null,
        onProgress: (p) => setFill(p),
        logger: () => {},
      })
      setFill(100)
      setLabel('Data extracted successfully')

      if (side === 'front') {
        const { merged } = mergeParsedData({ ...EMPTY_EXTRACTED_DATA }, out.parsedFront)
        setExtractedData(merged)
      } else {
        setExtractedData((prev) => mergeParsedData(prev, out.parsedBack).merged)
      }
    } catch (err) {
      console.error(err)
      setLabel('Read error — please enter the details manually')
    }
  }

  useEffect(() => {
    if (!frontFile && !backFile) {
      setOcrFrontVisible(false)
      setOcrBackVisible(false)
      setOcrFrontFill(0)
      setOcrBackFill(0)
      setOcrFrontLabel('Reading front of card...')
      setOcrBackLabel('Reading back of card...')
    }
  }, [frontFile, backFile])

  const handleCard = async (side, event) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      window.alert('Only image files are allowed (JPG, PNG, WEBP, HEIC).')
      return
    }
    const dataUrl = await readFileAsDataURL(file)
    if (side === 'front') {
      if (frontUrl) URL.revokeObjectURL(frontUrl)
      const url = URL.createObjectURL(file)
      setFrontFile(file)
      setFrontUrl(url)
      setB64Front(dataUrl)
      setShowFrontDrop(false)
    } else {
      if (backUrl) URL.revokeObjectURL(backUrl)
      const url = URL.createObjectURL(file)
      setBackFile(file)
      setBackUrl(url)
      setB64Back(dataUrl)
      setShowBackDrop(false)
    }
    await runOcrForSide(side, file)
    event.target.value = ''
  }

  const removeCard = (side) => {
    if (side === 'front') {
      if (frontUrl) URL.revokeObjectURL(frontUrl)
      setFrontFile(null)
      setFrontUrl('')
      setB64Front('')
      setShowFrontDrop(true)
      setOcrFrontVisible(false)
      setOcrFrontFill(0)
      setOcrFrontLabel('Reading front of card...')
      setExtractedData((prev) => {
        const next = { ...prev }
        for (const k of FRONT_OCR_CLEAR_KEYS) next[k] = ''
        return next
      })
    } else {
      if (backUrl) URL.revokeObjectURL(backUrl)
      setBackFile(null)
      setBackUrl('')
      setB64Back('')
      setShowBackDrop(true)
      setOcrBackVisible(false)
      setOcrBackFill(0)
      setOcrBackLabel('Reading back of card...')
      setExtractedData((prev) => {
        const next = { ...prev }
        for (const k of BACK_OCR_CLEAR_KEYS) next[k] = ''
        return next
      })
    }
  }

  const goToScript = () => {
    setFormError(false)
    if (!frontFile || !backFile) {
      setFormError(true)
      return
    }
    setStep(2)
  }

  const submitForm = async () => {
    setStatusError(false)
    setStatusSuccess(false)
    setSubmitting(true)
    setStatusSending(true)
    try {
      const script = {
        ...scriptAnswers,
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
        repName: callForm.spokeWith.trim(),
        refNum: callForm.callRefNumber.trim(),
      }
      const reportBase = buildVerificationReport(extractedData, script, intakeData, callForm)
      const data = { ...reportBase, b64Front, b64Back }
      const full = await submitVerificationFlow({
        frontFile: frontFile,
        backFile: backFile,
        data,
        onStatus: () => {},
      })
      setStatusSending(false)
      setStatusSuccess(true)
      setTimeout(() => {
        setResultData(full)
        setStep(3)
        setStatusSuccess(false)
      }, 1500)
    } catch (err) {
      console.error(err)
      setStatusSending(false)
      setStatusError(true)
      setErrorMsg(`Error: ${err?.message || 'Please try again.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const pct = STEP_LABELS[Math.min(step, 3) - 1]?.pct ?? 100
  const showProgress = step < 3

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">
            <img
              className="logo-img"
              src="/logo-bariatric-center.png"
              alt="The Advanced Bariatric Surgery Center"
              width={560}
              height={280}
              decoding="async"
            />
          </div>
        </div>
        <div className="header-badge">System Active</div>
      </header>

      <main className="main-container">
        {showProgress && (
          <div className="progress-wrapper" id="progressWrapper">
            <div className="progress-info">
              <span className="progress-label" id="progressLabel">
                Step {step} of 3
              </span>
              <span className="progress-count" id="progressCount">
                {STEP_LABELS[step - 1]?.label}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" id="progressFill" style={{ width: `${pct}%` }} />
            </div>
            <div className="steps-dots">
              <div className={`step-dot ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} id="dot-1">
                <div className="step-dot-circle">1</div>
                <span className="step-dot-label">Patient &amp; Card</span>
              </div>
              <div className={`step-dot ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`} id="dot-2">
                <div className="step-dot-circle">
                  <Icon name="call" />
                </div>
                <span className="step-dot-label">Worksheet</span>
              </div>
              <div className={`step-dot ${step === 3 ? 'active' : ''}`} id="dot-3">
                <div className="step-dot-circle">3</div>
                <span className="step-dot-label">Result</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        <div className={`form-section ${step === 1 ? 'active' : ''}`} id="step-1">
          <div className="section-card">
            <IntakeForm value={intakeData} onChange={setIntakeData} />

            <div className="section-header" style={{ marginBottom: 6 }}>
              <div
                className="section-icon"
                style={{ background: 'linear-gradient(135deg,var(--primary),var(--link))' }}
              >
                <Icon name="credit_card" />
              </div>
              <div>
                <div className="section-title" style={{ fontSize: 18 }}>
                  Insurance Card
                </div>
                <p className="section-subtitle">
                  Upload the <strong>front</strong> (Member ID, Group) and the <strong>back</strong> (Member Services
                  phone numbers)
                </p>
              </div>
            </div>

            <div className="card-sides">
              <div>
                <div className="card-side-label front-label">
                  <Icon name="badge" /> Front of Card
                </div>
                <div className={`card-drop front-drop ${showFrontDrop ? '' : 'is-hidden'}`} style={{ display: showFrontDrop ? 'flex' : 'none' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleCard('front', e)} />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="cam-input-hidden"
                    ref={frontCamRef}
                    onChange={(e) => handleCard('front', e)}
                  />
                  <Icon name="image" className="card-drop-icon" />
                  <span className="card-drop-title">Front photo</span>
                  <span className="card-drop-sub">Member ID · Group # · Plan · Copays</span>
                  <span className="card-drop-badge front-badge">
                    <Icon name="document_scanner" /> Full OCR
                  </span>
                  <button
                    type="button"
                    className="cam-btn mobile-only"
                    onClick={(e) => {
                      e.stopPropagation()
                      frontCamRef.current?.click()
                    }}
                  >
                    <Icon name="photo_camera" /> Take photo
                  </button>
                </div>
                <div className={`captured-card ${!showFrontDrop ? 'visible' : ''}`} id="capFront">
                  {frontUrl ? <img src={frontUrl} alt="Front of card" /> : null}
                  <div className="captured-card-actions">
                    <button type="button" className="cap-btn danger" onClick={() => removeCard('front')}>
                      <Icon name="close" /> Remove
                    </button>
                  </div>
                </div>
                <div className={`ocr-side-panel ${ocrFrontVisible ? 'visible' : ''}`} id="ocrFrontPanel">
                  <div className="ocr-side-header">
                    <div className="ocr-spinner" />
                    <span className="ocr-side-label" id="ocrFrontLabel">
                      <OcrSideLabelContent visible={ocrFrontVisible} fill={ocrFrontFill} label={ocrFrontLabel} />
                    </span>
                  </div>
                  <div className="ocr-side-bar">
                    <div className="ocr-side-fill" id="ocrFrontFill" style={{ width: `${ocrFrontFill}%` }} />
                  </div>
                </div>
              </div>

              <div>
                <div className="card-side-label back-label">
                  <Icon name="sync" /> Back of Card
                </div>
                <div className={`card-drop back-drop ${showBackDrop ? '' : 'is-hidden'}`} style={{ display: showBackDrop ? 'flex' : 'none' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleCard('back', e)} />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="cam-input-hidden"
                    ref={backCamRef}
                    onChange={(e) => handleCard('back', e)}
                  />
                  <Icon name="fact_check" className="card-drop-icon" />
                  <span className="card-drop-title">Back photo</span>
                  <span className="card-drop-sub">Member Services Phone · Authorization · Website</span>
                  <span className="card-drop-badge back-badge">
                    <Icon name="call" /> Extract phones
                  </span>
                  <button
                    type="button"
                    className="cam-btn mobile-only"
                    onClick={(e) => {
                      e.stopPropagation()
                      backCamRef.current?.click()
                    }}
                  >
                    <Icon name="photo_camera" /> Take photo
                  </button>
                </div>
                <div className={`captured-card ${!showBackDrop ? 'visible' : ''}`} id="capBack">
                  {backUrl ? <img src={backUrl} alt="Back of card" /> : null}
                  <div className="captured-card-actions">
                    <button type="button" className="cap-btn danger" onClick={() => removeCard('back')}>
                      <Icon name="close" /> Remove
                    </button>
                  </div>
                </div>
                <div className={`ocr-side-panel ${ocrBackVisible ? 'visible' : ''}`} id="ocrBackPanel">
                  <div className="ocr-side-header">
                    <div className="ocr-spinner" />
                    <span className="ocr-side-label" id="ocrBackLabel">
                      <OcrSideLabelContent visible={ocrBackVisible} fill={ocrBackFill} label={ocrBackLabel} />
                    </span>
                  </div>
                  <div className="ocr-side-bar">
                    <div className="ocr-side-fill" id="ocrBackFill" style={{ width: `${ocrBackFill}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              id="formErrorBanner"
              style={{
                display: formError ? 'flex' : 'none',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 10,
                padding: '12px 18px',
                color: '#fca5a5',
                fontSize: 14,
                marginTop: 20,
                marginBottom: 14,
              }}
            >
              <Icon name="warning" /> Please upload both the front and back of your insurance card before continuing.
            </div>

            <div className="nav-buttons">
              <span />
              <button type="button" className="btn btn-primary" onClick={goToScript}>
                Continue to worksheet <Icon name="assignment" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 2 — verification worksheet */}
        <div className={`form-section ${step === 2 ? 'active' : ''}`} id="step-2">
          <div className="section-card">
            <CallScriptForm value={callForm} onChange={setCallForm} />

            <div
              id="statusSending"
              style={{
                display: statusSending ? 'block' : 'none',
                textAlign: 'center',
                padding: 18,
                background: 'var(--tint-link-10)',
                border: '1px solid var(--tint-link-25)',
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <div className="ocr-spinner" style={{ margin: '0 auto 10px' }} />
              <span style={{ fontSize: 14, color: 'var(--primary-light)' }}>Processing...</span>
            </div>
            <div
              id="statusSuccess"
              style={{
                display: statusSuccess ? 'block' : 'none',
                textAlign: 'center',
                padding: 16,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--apto)', margin: 0 }}>
                <Icon name="check_circle" /> Report submitted! Calculating result...
              </p>
            </div>
            <div
              id="statusError"
              style={{
                display: statusError ? 'block' : 'none',
                padding: 16,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--no-apto)', margin: 0 }} id="errorMsg">
                {errorMsg}
              </p>
            </div>

            <div className="nav-buttons">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" id="btnSubmit" disabled={submitting} onClick={submitForm}>
                <Icon name="send" /> Evaluate &amp; Send Report
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className={`form-section ${step === 3 ? 'active' : ''}`} id="step-3">
          <div id="resultCard">
            {resultData ? <ClinicaResultCard data={resultData} onReset={resetAll} /> : null}
          </div>
        </div>
      </main>
    </div>
  )
}

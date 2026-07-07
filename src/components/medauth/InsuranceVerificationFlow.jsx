import { useState } from 'react'

import './InsuranceVerificationFlow.css'

import {
  VERIFICATION_INTRO,
  VERIFICATION_QUESTIONS,
  getFirstUnansweredVerificationIndex,
} from './verificationQuestionsModel.js'

function Icon({ name }) {
  return <span className="material-symbols-outlined iv-icon">{name}</span>
}

/**
 * @param {object} props
 * @param {Record<string, string>} props.answers
 * @param {(next: Record<string, string>) => void} props.onChange
 * @param {() => void | Promise<void>} props.onSubmit
 * @param {boolean} props.submitting
 * @param {() => void} [props.onBackToIntake]
 */
export default function InsuranceVerificationFlow({ answers, onChange, onSubmit, submitting, onBackToIntake }) {
  const [view, setView] = useState(0)
  const totalSteps = VERIFICATION_QUESTIONS.length
  const question = view > 0 ? VERIFICATION_QUESTIONS[view - 1] : null
  const currentAnswer = question ? answers[question.id] : ''
  const answered = currentAnswer === 'yes' || currentAnswer === 'no'
  const allAnswered = getFirstUnansweredVerificationIndex(answers) >= totalSteps

  const pick = (value) => {
    if (!question) return
    onChange({ ...answers, [question.id]: value })
  }

  const goNext = () => {
    if (view === 0) {
      setView(1)
      return
    }
    if (!answered) return
    if (view < totalSteps) setView(view + 1)
  }

  const goBack = () => {
    if (view > 0) setView(view - 1)
    else onBackToIntake?.()
  }

  const progressPct = view === 0 ? 0 : Math.round((view / totalSteps) * 100)

  return (
    <div className="iv-flow" id="insurance-verification-flow">
      <div className="iv-progress">
        <div className="iv-progress-meta">
          <span>{view === 0 ? 'Overview' : `Question ${view} of ${totalSteps}`}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="iv-progress-track">
          <div className="iv-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {view === 0 ? (
        <div className="iv-card iv-intro">
          <h2>
            <Icon name="verified_user" /> {VERIFICATION_INTRO.title}
          </h2>
          {VERIFICATION_INTRO.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <div className="iv-card">
          <p className="iv-step-tag">Step {question.step}</p>
          <h2 className="iv-question-title">{question.title}</h2>
          <p className="iv-question-prompt">{question.prompt}</p>
          {question.detail ? <p className="iv-question-detail">{question.detail}</p> : null}

          <div className="iv-yn-row" role="radiogroup" aria-label={question.title}>
            <button
              type="button"
              className={`iv-yn-btn${currentAnswer === 'yes' ? ' is-selected-yes' : ''}`}
              onClick={() => pick('yes')}
              disabled={submitting}
            >
              Yes
            </button>
            <button
              type="button"
              className={`iv-yn-btn${currentAnswer === 'no' ? ' is-selected-no' : ''}`}
              onClick={() => pick('no')}
              disabled={submitting}
            >
              No
            </button>
          </div>

          {!answered ? <p className="iv-hint">Select Yes or No to continue.</p> : null}
        </div>
      )}

      <div className="nav-buttons iv-nav">
        <button type="button" className="btn btn-secondary" onClick={goBack} disabled={submitting}>
          ← {view === 0 ? 'Back to intake' : 'Previous'}
        </button>

        {view === 0 ? (
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={submitting}>
            Begin verification <Icon name="arrow_forward" />
          </button>
        ) : view < totalSteps ? (
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={!answered || submitting}>
            Next <Icon name="arrow_forward" />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? (
              <>
                <span className="btn-inline-spinner" aria-hidden="true" />
                Sending the information…
              </>
            ) : (
              <>
                Send answers <Icon name="send" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

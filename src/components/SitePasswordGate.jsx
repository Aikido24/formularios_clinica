import { useEffect, useState } from 'react'

import { fetchSitePassword } from '../services/siteAccess.js'
import './SitePasswordGate.css'

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export default function SitePasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (unlocked) return
    document.body.classList.add('site-locked')
    return () => document.body.classList.remove('site-locked')
  }, [unlocked])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const expected = await fetchSitePassword()
      if (!expected) {
        setError('Access configuration not found. Contact the administrator.')
        return
      }
      if (password !== expected) {
        setError('Incorrect password.')
        return
      }
      setUnlocked(true)
    } catch (err) {
      console.error('Site access check failed:', err)
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
      if (code.includes('permission-denied')) {
        setError('Permission denied reading the password from Firestore. Deploy firestore.rules with: firebase deploy --only firestore:rules')
      } else {
        setError('Could not verify access. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (unlocked) return children

  return (
    <div className="site-gate">
      <div className="site-gate-card section-card">
        <div className="site-gate-icon">
          <span className="material-symbols-outlined">lock</span>
        </div>
        <h1 className="site-gate-title">MedAuth Pro</h1>
        <p className="site-gate-subtitle">Private testing access — enter the site password to continue.</p>

        <form className="site-gate-form" onSubmit={handleSubmit}>
          <label htmlFor="site-password">Password</label>
          <div className="site-gate-password-wrap">
            <input
              id="site-password"
              className="form-input site-gate-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              disabled={submitting}
            />
            <button
              type="button"
              className="site-gate-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={submitting}
            >
              <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {error ? <p className="site-gate-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary site-gate-btn" disabled={submitting || !password.trim()}>
            {submitting ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

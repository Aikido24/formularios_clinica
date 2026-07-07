import { pickCardImageSrc, getReportDestEmail } from '../../services/verificationSubmit.js'

function row(label, val, accent = false) {
  return (
    <div className="summary-row" key={label}>
      <span className="summary-key">{label}</span>
      <span className={`summary-val${accent ? ' summary-accent' : ''}`}>{val || '—'}</span>
    </div>
  )
}

function chip(val, good) {
  return (
    <span className={`chip ${good ? 'chip-si' : 'chip-no'}`}>
      <span className="material-symbols-outlined">{good ? 'check_circle' : 'cancel'}</span> {val || '—'}
    </span>
  )
}

/**
 * @param {object} props
 * @param {Record<string, unknown>} props.data
 * @param {() => void} props.onReset
 */
export function ClinicaResultCard({ data, onReset }) {
  const auth = data.autorizacion || ''
  const authChipOk =
    auth &&
    (auth.includes('Obtained') ||
      auth.includes('Obtenida') ||
      auth.includes('Not required') ||
      auth.includes('No Requerida'))
  const worksheetMode = Boolean(data.worksheetPdfSent)
  const verificationMode = Boolean(data.verificationAnswersSent)
  const emailLabel = verificationMode
    ? 'Verification answers sent'
    : worksheetMode
      ? 'Worksheet PDF sent'
      : 'Report sent'

  return (
    <div className="section-card result-card result-apto">
      <div className="result-icon-wrapper">
        <span className="material-symbols-outlined">mark_email_read</span>
      </div>
      <div className="result-badge">
        <span className="material-symbols-outlined">check_circle</span> {emailLabel}
      </div>
      <p className="result-message">
        {verificationMode ? 'Insurance verification answers for ' : worksheetMode ? 'Worksheet PDF for ' : 'Verification report for '}
        <strong>{data.nombre || 'Patient'}</strong> was emailed to <strong>{getReportDestEmail()}</strong>.
      </p>

      {(pickCardImageSrc(data.b64Front, data.urlFrente) || pickCardImageSrc(data.b64Back, data.urlReverso)) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
          {pickCardImageSrc(data.b64Front, data.urlFrente) ? (
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  margin: '0 0 6px',
                }}
              >
                Front
              </p>
              <img
                src={pickCardImageSrc(data.b64Front, data.urlFrente)}
                alt="Card front"
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
          ) : (
            <div />
          )}
          {pickCardImageSrc(data.b64Back, data.urlReverso) ? (
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  margin: '0 0 6px',
                }}
              >
                Back
              </p>
              <img
                src={pickCardImageSrc(data.b64Back, data.urlReverso)}
                alt="Card back"
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      <div className="summary-table">
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--primary-light)',
            margin: '0 0 8px',
          }}
        >
          Insurance identification
        </p>
        {row('Insurance Company', data.aseguradora)}
        {row('Subscriber Name', data.subscriberName)}
        {row('Member Name', data.memberName)}
        {row('Member ID', data.memberId, true)}
        {row('Subscriber ID', data.subscriberId)}
        {row('Group Number', data.groupNum, true)}
        {row('Plan', data.planName)}
        {row('Plan Type', data.planType)}
        {row('Effective Date', data.effectiveDate)}
        {row('Network', data.network)}

        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
            margin: '14px 0 8px',
          }}
        >
          Copays and Costs
        </p>
        {row('PCP Copay', data.copayPCP)}
        {row('Specialist Copay', data.copaySpec)}
        {row('ER Copay', data.copayER)}
        {row('Urgent Care', data.copayUrgent)}
        {row('Deductible', data.deductible)}
        {row('Coinsurance', data.coinsurance)}

        {(data.rxBin || data.rxPcn) && (
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--secondary)',
              margin: '14px 0 8px',
            }}
          >
            Pharmacy
          </p>
        )}
        {row('RxBIN', data.rxBin)}
        {row('RxPCN', data.rxPcn)}
        {row('RxGroup', data.rxGrp)}

        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            margin: '14px 0 8px',
          }}
        >
          {!worksheetMode ? 'Verification call results' : 'Worksheet summary'}
        </p>

        {worksheetMode ? (
          <>
            {row('Insurance Rep', data.repName)}
            {row('Reference #', data.refNum)}
            {row('Record ID', data.expedienteId || '—')}
          </>
        ) : (
          <>
            <div className="summary-row">
              <span className="summary-key">Covered?</span>
              {chip(data.cobertura, ['Yes', 'Partial', 'Si', 'Parcial'].includes(data.cobertura))}
            </div>
            <div className="summary-row">
              <span className="summary-key">Prior authorization</span>
              {chip(data.autorizacion, authChipOk)}
            </div>
            {row('Deductible (call)', data.deducibleTotal)}
            {row('Deductible met', data.deducibleMet)}
            {row('Copay/Coinsurance (call)', data.copago)}
            {row('Out-of-pocket max.', data.oopMax)}
            {row('Insurance Rep', data.repName)}
            {row('Reference #', data.refNum)}
            {data.notasRep ? (
              <div className="summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span className="summary-key">Additional notes</span>
                <span className="summary-val" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.notasRep}
                </span>
              </div>
            ) : null}
            {row('Record ID', data.expedienteId || '—')}
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: '14px 18px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: '#34d399', margin: 0 }}>
          {worksheetMode ? 'Worksheet PDF emailed automatically to ' : 'Report sent automatically to '}
          <strong>{getReportDestEmail()}</strong>
        </p>
      </div>
      <button type="button" className="btn btn-secondary" style={{ marginTop: 18 }} onClick={onReset}>
        + Evaluate New Patient
      </button>
    </div>
  )
}

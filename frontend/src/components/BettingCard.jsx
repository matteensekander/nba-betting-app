export default function BettingCard({ prediction }) {
  if (!prediction) {
    return (
      <div className="betting-card">
        <div className="section-label">AI Prediction</div>
        <div className="section-title" style={{ marginBottom: 0 }}>Betting Analysis</div>
        <p className="no-prediction">
          Not enough active game data for a prediction — need at least 3 games with meaningful minutes played.
        </p>
      </div>
    );
  }

  const { recommendation, confidence, factors } = prediction;

  const badgeClass = {
    BET: 'badge-green',
    FADE: 'badge-red',
    NEUTRAL: 'badge-yellow',
  }[recommendation];

  const barColor = {
    BET: 'var(--green)',
    FADE: 'var(--red)',
    NEUTRAL: 'var(--yellow)',
  }[recommendation];

  return (
    <div className="betting-card">
      <div className="betting-header">
        <div>
          <div className="section-label">AI Prediction</div>
          <div className="section-title" style={{ marginBottom: 0 }}>Betting Analysis</div>
        </div>
        <div className={`recommendation-badge ${badgeClass}`}>{recommendation}</div>
      </div>

      <div className="confidence-section">
        <div className="confidence-label">
          <span>Confidence Score</span>
          <span className="confidence-value">{confidence}%</span>
        </div>
        <div className="confidence-bar-track">
          <div className="confidence-bar-fill" style={{ width: `${confidence}%`, background: barColor }} />
        </div>
      </div>

      <div className="factors-title">Key Factors</div>
      <ul className="factors-list">
        {factors.map((factor, i) => (
          <li key={i} className={`factor-item factor-${factor.type}`}>
            <span className="factor-dot" aria-hidden="true" />
            {factor.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

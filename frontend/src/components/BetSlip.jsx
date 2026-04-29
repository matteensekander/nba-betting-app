import { useState } from 'react';
import { useBetSlip } from '../context/BetSlipContext';

export default function BetSlip() {
  const { picks, removePick, clearAll, parlayOdds, flexOdds } = useBetSlip();
  const [expanded, setExpanded] = useState(false);

  const count = picks.length;

  if (count === 0) {
    return (
      <div className="betslip betslip--minimized">
        <div className="betslip-empty">
          <span className="betslip-empty-icon">🎯</span>
          <span>Add picks to build your parlay</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`betslip ${expanded ? 'betslip--expanded' : 'betslip--collapsed'}`}>
      {/* Header / toggle */}
      <button
        className="betslip-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="betslip-header-left">
          <span className="betslip-badge">{count}</span>
          <span className="betslip-title">
            {count === 1 ? '1 Pick' : `${count} Picks`}
          </span>
        </div>
        <div className="betslip-header-right">
          <span className="betslip-parlay-preview">
            {parlayOdds > 0 ? `${parlayOdds.toFixed(2)}x` : '—'}
          </span>
          <span className="betslip-chevron">{expanded ? '▼' : '▲'}</span>
        </div>
      </button>

      {expanded && (
        <div className="betslip-body">
          {/* Picks list */}
          <div className="betslip-picks">
            {picks.map(pick => (
              <div key={`${pick.id}-${pick.stat}`} className="betslip-pick">
                <img
                  className="betslip-pick-img"
                  src={pick.headshot}
                  alt={pick.playerName}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="betslip-pick-info">
                  <p className="betslip-pick-name">{pick.playerName}</p>
                  <p className="betslip-pick-detail">
                    {pick.dir === 'over' ? '▲' : '▼'} {pick.line > 0 ? `${pick.line} ` : ''}{pick.stat}
                    <span className="betslip-pick-mult"> · {pick.multiplier.toFixed(2)}x</span>
                  </p>
                </div>
                <button
                  className="betslip-pick-remove"
                  onClick={() => removePick(pick.id, pick.stat)}
                  aria-label="Remove pick"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Odds cards */}
          <div className="betslip-odds-row">
            <div className="betslip-odds-card">
              <p className="betslip-odds-label">PARLAY</p>
              <p className="betslip-odds-value">{parlayOdds.toFixed(2)}x</p>
              <p className="betslip-odds-sub">All legs must hit</p>
            </div>
            <div className="betslip-odds-card">
              <p className="betslip-odds-label">FLEX</p>
              <p className="betslip-odds-value">{flexOdds.toFixed(2)}x</p>
              <p className="betslip-odds-sub">{count > 1 ? `${count - 1} of ${count} legs` : 'Any leg'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="betslip-actions">
            <button className="betslip-clear-btn" onClick={clearAll}>
              Clear All
            </button>
            <button
              className="betslip-place-btn"
              onClick={() => alert('Bet placed! (Entertainment only)')}
            >
              Place Bet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

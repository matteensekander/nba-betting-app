import { useState } from 'react';
import { useBetSlip } from '../context/BetSlipContext';

function calcMultipliers(seasonAvg, recent5Avg, line) {
  if (line <= 0) return { overMult: 1.87, underMult: 1.87, recommend: null };
  const diff = recent5Avg > 0 ? (recent5Avg - line) / line : 0;

  if (diff > 0.20) return { overMult: 1.73, underMult: 2.07, recommend: 'over' };
  if (diff > 0.10) return { overMult: 1.77, underMult: 2.00, recommend: 'over' };
  if (diff > 0.05) return { overMult: 1.82, underMult: 1.93, recommend: null };
  if (diff < -0.20) return { overMult: 2.07, underMult: 1.73, recommend: 'under' };
  if (diff < -0.10) return { overMult: 2.00, underMult: 1.77, recommend: 'under' };
  if (diff < -0.05) return { overMult: 1.93, underMult: 1.82, recommend: null };
  return { overMult: 1.87, underMult: 1.87, recommend: null };
}

function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

export default function PropCard({ player, statKey, statLabel, propData, gameId }) {
  const { picks, addOrTogglePick } = useBetSlip();

  const [lineDelta, setLineDelta] = useState(0);

  if (!propData || !player) return null;

  const baseLine = propData.line;
  const adjustedLine = roundHalf(baseLine + lineDelta * 0.5);

  const { overMult, underMult, recommend } = calcMultipliers(
    propData.seasonAvg,
    propData.recent5Avg,
    adjustedLine
  );

  const pickKey = `${player.id}-${statKey}`;
  const currentPick = picks.find(p => `${p.id}-${p.stat}` === pickKey);
  const selectedDir = currentPick?.dir || null;

  function handlePick(dir) {
    const mult = dir === 'over' ? overMult : underMult;
    addOrTogglePick({
      id: player.id,
      playerName: player.name,
      teamAbbr: player.teamAbbr,
      stat: statKey,
      line: adjustedLine,
      dir,
      multiplier: mult,
      headshot: player.headshot,
    });
  }

  function adjustLine(delta) {
    setLineDelta(prev => prev + delta);
  }

  const isOverSelected = selectedDir === 'over';
  const isUnderSelected = selectedDir === 'under';

  return (
    <div className="prop-card">
      {/* Left: headshot */}
      <div className="prop-card-avatar-wrap">
        <img
          className="prop-card-avatar"
          src={player.headshot}
          alt={player.name}
          onError={e => {
            e.target.src = `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`;
          }}
        />
        <span className="prop-card-team-badge">{player.teamAbbr}</span>
      </div>

      {/* Center: info + line adjuster */}
      <div className="prop-card-center">
        <p className="prop-card-name">{player.name}</p>
        <p className="prop-card-line-label">
          {adjustedLine} {statLabel}
        </p>
        <div className="prop-card-adjuster">
          <button
            className="prop-card-adj-btn"
            onClick={() => adjustLine(-1)}
            title="Decrease line"
          >
            ▼
          </button>
          <button
            className="prop-card-adj-btn"
            onClick={() => adjustLine(1)}
            title="Increase line"
          >
            ▲
          </button>
        </div>
        {propData.recent5Avg > 0 && (
          <p className="prop-card-avg">
            L5 avg: {propData.recent5Avg.toFixed(1)}
          </p>
        )}
      </div>

      {/* Right: over/under buttons */}
      <div className="prop-card-buttons">
        <button
          className={[
            'prop-pick-btn',
            recommend === 'over' && !isOverSelected ? 'prop-pick-btn--recommend' : '',
            isOverSelected ? 'prop-pick-btn--selected' : '',
          ].join(' ')}
          onClick={() => handlePick('over')}
        >
          <span className="prop-pick-arrow">▲</span>
          {overMult.toFixed(2)}x
        </button>
        <button
          className={[
            'prop-pick-btn',
            recommend === 'under' && !isUnderSelected ? 'prop-pick-btn--recommend' : '',
            isUnderSelected ? 'prop-pick-btn--selected' : '',
          ].join(' ')}
          onClick={() => handlePick('under')}
        >
          <span className="prop-pick-arrow">▼</span>
          {underMult.toFixed(2)}x
        </button>
      </div>
    </div>
  );
}

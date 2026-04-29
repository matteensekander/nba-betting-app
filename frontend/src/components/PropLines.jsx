import { useState, useEffect } from 'react';
import { getPropLines } from '../utils/api';

function fmtOdds(p) {
  if (p == null) return '';
  return p > 0 ? `+${p}` : `${p}`;
}

function getLean(line, recentAvg) {
  if (recentAvg == null || line == null) return null;
  const diff = recentAvg - line;
  const pct = Math.abs(diff / line) * 100;
  if (pct < 3) return { label: 'PUSH', dir: 'neutral', diff };
  return diff > 0
    ? { label: 'LEAN OVER', dir: 'over', diff }
    : { label: 'LEAN UNDER', dir: 'under', diff };
}

const STAT_TO_AVG_KEY = {
  PTS: 'pts', REB: 'reb', AST: 'ast',
  '3PM': 'fg3m', BLK: 'blk', STL: 'stl',
  PRA: null, // computed below
};

export default function PropLines({ playerName, teamAbbr, averages, recentGameLog }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerName) return;
    setLoading(true);
    getPropLines(playerName, teamAbbr || '')
      .then(setData)
      .catch(() => setData({ available: false, lines: [] }))
      .finally(() => setLoading(false));
  }, [playerName, teamAbbr]);

  // Compute recent averages (last 5 games) for each stat
  const recent5 = recentGameLog?.slice(0, 5) || [];
  function recentAvg(key) {
    if (!recent5.length) return averages?.[key] ?? null;
    const vals = recent5.map(g => Number(g[key]) || 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  function getAvg(stat) {
    const k = STAT_TO_AVG_KEY[stat];
    if (stat === 'PRA') {
      const pts = recentAvg('pts') ?? 0;
      const reb = recentAvg('reb') ?? 0;
      const ast = recentAvg('ast') ?? 0;
      return pts + reb + ast;
    }
    return k ? recentAvg(k) : null;
  }

  if (loading) {
    return (
      <div className="proplines-section">
        <div className="section-label">Pick Lines</div>
        <div className="section-title" style={{ marginBottom: 8 }}>Today's Player Props</div>
        <div className="proplines-loading">Checking today's lines...</div>
      </div>
    );
  }

  if (!data?.available) {
    const reason = data?.reason === 'no_game_today' ? 'No game scheduled today.' : 'Add ODDS_API_KEY to enable pick lines.';
    return (
      <div className="proplines-section">
        <div className="section-label">Pick Lines · Fliff / Underdog Style</div>
        <div className="section-title" style={{ marginBottom: 8 }}>Today's Player Props</div>
        <p className="no-data">{reason}</p>
      </div>
    );
  }

  const { lines, game } = data;
  if (!lines?.length) return null;

  return (
    <div className="proplines-section">
      <div className="proplines-header">
        <div>
          <div className="section-label">Pick Lines · DraftKings / FanDuel / Underdog</div>
          <div className="section-title" style={{ marginBottom: 0 }}>Today's Player Props</div>
        </div>
        {game && (
          <div className="proplines-game-badge">
            {game.away} @ {game.home}
          </div>
        )}
      </div>

      <div className="proplines-grid">
        {lines.map(l => {
          const avg = getAvg(l.stat);
          const lean = getLean(l.line, avg);
          return (
            <div key={l.stat} className={`propline-card propline-${lean?.dir || 'neutral'}`}>
              <div className="propline-stat">{l.stat}</div>
              <div className="propline-line">{l.line}</div>
              {avg != null && (
                <div className="propline-avg">
                  Avg: <strong>{avg.toFixed(1)}</strong>
                </div>
              )}
              {lean && (
                <div className={`propline-lean propline-lean-${lean.dir}`}>
                  {lean.label}
                  {lean.diff != null && (
                    <span className="propline-diff">
                      {lean.diff > 0 ? '+' : ''}{lean.diff.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
              <div className="propline-odds">
                {fmtOdds(l.overPrice)} / {fmtOdds(l.underPrice)}
              </div>
              <div className="propline-book">{l.book}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

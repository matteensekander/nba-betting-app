function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPct(v) {
  if (v == null || v === 0 || v === '') return '-';
  return `${Number(v).toFixed(1)}%`;
}

// A game is "bet worthy" if pts + reb + ast are all at or above season averages
function isBetWorthy(g, averages) {
  if (!averages) return false;
  const pts = Number(g.pts) || 0;
  const reb = Number(g.reb) || 0;
  const ast = Number(g.ast) || 0;
  const meetspts = !averages.pts || pts >= averages.pts * 0.95;
  const meetsreb = !averages.reb || reb >= averages.reb * 0.9;
  const meetsast = !averages.ast || ast >= averages.ast * 0.9;
  return meetspts && meetsreb && meetsast && pts > 0;
}

export default function GameLog({ gameLog, seasonPPG, averages, prediction }) {
  const games = gameLog.slice(0, 10);

  if (!games.length) {
    return (
      <div className="gamelog-section">
        <div className="section-label">Performance</div>
        <div className="section-title" style={{ marginBottom: 0 }}>Recent Games</div>
        <p className="no-data" style={{ marginTop: 16 }}>No recent game data available.</p>
      </div>
    );
  }

  const isBet = prediction?.recommendation === 'BET';

  function ptsClass(pts) {
    if (!seasonPPG || seasonPPG === 0) return 'pts-normal';
    const n = Number(pts);
    if (n >= seasonPPG * 1.2) return 'pts-hot';
    if (n <= seasonPPG * 0.8) return 'pts-cold';
    return 'pts-normal';
  }

  return (
    <div className="gamelog-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="section-label">Performance</div>
          <div className="section-title" style={{ marginBottom: 0 }}>Last {games.length} Games</div>
        </div>
        {isBet && (
          <span className="bet-highlight-legend">🟢 = Strong Game</span>
        )}
      </div>

      <div className="gamelog-wrapper">
        <table className="gamelog-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>H/A</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>Min</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>FG%</th>
              <th>3P%</th>
              {isBet && <th></th>}
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => {
              const won = g.result === 'W';
              const hasScore = g.teamScore != null && g.oppScore != null;
              const betWorthy = isBet && isBetWorthy(g, averages);

              return (
                <tr key={g.id} className={`${i === 0 ? 'latest-game' : ''} ${betWorthy ? 'game-row-bet' : ''}`}>
                  <td className="date-cell">{fmtDate(g.date)}</td>
                  <td>
                    <span className={`ha-badge ${g.isHome ? 'ha-home' : 'ha-away'}`}>
                      {g.isHome ? 'HOME' : 'AWAY'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{g.opponent}</td>
                  <td>
                    {hasScore ? (
                      <span className={`result-score ${won ? 'result-w' : 'result-l'}`}>
                        {won ? 'W' : 'L'} {g.teamScore}–{g.oppScore}
                      </span>
                    ) : '–'}
                  </td>
                  <td>{g.min || '-'}</td>
                  <td className={ptsClass(g.pts)}>{g.pts}</td>
                  <td>{g.reb}</td>
                  <td>{g.ast}</td>
                  <td>{fmtPct(g.fg_pct)}</td>
                  <td>{fmtPct(g.fg3_pct)}</td>
                  {isBet && (
                    <td>
                      {betWorthy && <span className="game-bet-tag">BET</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

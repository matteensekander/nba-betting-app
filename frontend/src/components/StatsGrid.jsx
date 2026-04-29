import Sparkline from './Sparkline';

const STATS = [
  { key: 'pts',     label: 'PPG',  fmt: v => v?.toFixed(1) ?? '-' },
  { key: 'reb',     label: 'RPG',  fmt: v => v?.toFixed(1) ?? '-' },
  { key: 'ast',     label: 'APG',  fmt: v => v?.toFixed(1) ?? '-' },
  { key: 'fg_pct',  label: 'FG%',  fmt: v => v != null ? `${v.toFixed(1)}%` : '-' },
  { key: 'fg3_pct', label: '3P%',  fmt: v => v != null ? `${v.toFixed(1)}%` : '-' },
  { key: 'ft_pct',  label: 'FT%',  fmt: v => v != null ? `${v.toFixed(1)}%` : '-' },
  { key: 'min',     label: 'MIN',  fmt: v => v != null ? v.toFixed(0) : '-' },
  { key: 'stl',     label: 'SPG',  fmt: v => v?.toFixed(1) ?? '-' },
  { key: 'blk',     label: 'BPG',  fmt: v => v?.toFixed(1) ?? '-' },
];

function getSparkData(gameLog, key) {
  return gameLog
    .slice(0, 10)
    .reverse()
    .map(g => Number(g[key]) || 0);
}

// Determine which stat is "hot" based on recent trend vs season avg
function getHotStats(averages, gameLog) {
  if (!averages || !gameLog?.length) return new Set();
  const recent = gameLog.slice(0, 5);
  const hot = new Set();

  for (const { key } of STATS) {
    const seasonVal = averages[key];
    if (!seasonVal || seasonVal === 0) continue;
    const recentAvg = recent.reduce((s, g) => s + (Number(g[key]) || 0), 0) / recent.length;
    if (recentAvg >= seasonVal * 1.15) hot.add(key);
  }
  return hot;
}

export default function StatsGrid({ averages, gameLog, prediction }) {
  if (!averages) {
    return (
      <div className="stats-section">
        <div className="section-label">Season Averages</div>
        <div className="section-title" style={{ marginBottom: 0 }}>Statistics</div>
        <p className="no-data" style={{ marginTop: 16 }}>No season average data available for this player.</p>
      </div>
    );
  }

  const hasSparkData = gameLog && gameLog.length >= 3;
  const seasonLabel = averages.season_year
    ? `${averages.season_year - 1}–${String(averages.season_year).slice(-2)}`
    : '2024–25';

  const isBet = prediction?.recommendation === 'BET';
  const hotStats = isBet ? getHotStats(averages, gameLog) : new Set();

  return (
    <div className="stats-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="section-label">Season Averages</div>
          <div className="section-title" style={{ marginBottom: 0 }}>Statistics</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isBet && hotStats.size > 0 && (
            <span className="bet-highlight-legend">🟢 = Trending Up</span>
          )}
          <span className="season-tag">
            {seasonLabel}
            {averages.games_played > 0 ? ` · ${averages.games_played} GP` : ''}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        {STATS.map(({ key, label, fmt }) => {
          const isHot = hotStats.has(key);
          return (
            <div key={key} className={`stat-card ${isHot ? 'stat-card-hot' : ''}`}>
              <div className="stat-label">
                {label}
                {isHot && <span className="stat-hot-dot" title="Trending above season avg" />}
              </div>
              <div className={`stat-value ${isHot ? 'stat-value-hot' : ''}`}>{fmt(averages[key])}</div>
              {hasSparkData && (
                <div className="stat-sparkline">
                  <Sparkline
                    data={getSparkData(gameLog, key)}
                    id={key}
                    width={80}
                    height={28}
                    color={isHot ? 'var(--green)' : 'var(--blue)'}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

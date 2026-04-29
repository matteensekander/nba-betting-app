import { useState, useEffect } from 'react';
import { getScoreboard } from '../utils/api';

function formatGameTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

function StatusBadge({ state, text }) {
  if (state === 'in') return <span className="sb-status sb-status-live">● LIVE · {text}</span>;
  if (state === 'post') return <span className="sb-status sb-status-final">FINAL</span>;
  return <span className="sb-status sb-status-pre">{text}</span>;
}

export default function LiveScoreboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getScoreboard()
        .then(d => { if (!cancelled) setData(d); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    load();
    // Refresh live scores every 30 seconds
    const t = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (loading) return null; // don't show placeholder — just wait
  if (!data?.games?.length) return null;

  const isPlayoff = data.games.some(g => g.series);
  const label = isPlayoff ? '🏆 2025–26 NBA Playoffs · Live' : '2025–26 NBA · Today';

  return (
    <div className="scoreboard-panel">
      <div className="scoreboard-header">
        <div className="section-label">ESPN Live</div>
        <h2 className="section-title">{label}</h2>
      </div>

      <div className="scoreboard-games">
        {data.games.map(game => (
          <div key={game.id} className={`sb-game ${game.state === 'in' ? 'sb-game-live' : ''}`}>
            <StatusBadge state={game.state} text={game.statusText} />

            <div className="sb-matchup">
              {/* Away team */}
              <div className={`sb-team ${game.away.winner ? 'sb-team-winner' : ''}`}>
                <img src={game.away.logo} alt={game.away.abbr} className="sb-logo"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span className="sb-team-abbr">{game.away.abbr}</span>
                <span className="sb-score">{game.state !== 'pre' ? game.away.score : ''}</span>
              </div>

              <span className="sb-at">@</span>

              {/* Home team */}
              <div className={`sb-team ${game.home.winner ? 'sb-team-winner' : ''}`}>
                <img src={game.home.logo} alt={game.home.abbr} className="sb-logo"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span className="sb-team-abbr">{game.home.abbr}</span>
                <span className="sb-score">{game.state !== 'pre' ? game.home.score : ''}</span>
              </div>
            </div>

            {game.series && (
              <div className="sb-series">{game.series}</div>
            )}
            {game.state === 'pre' && (
              <div className="sb-series">{formatGameTime(game.date)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

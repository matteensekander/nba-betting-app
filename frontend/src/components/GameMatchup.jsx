import { useBetSlip } from '../context/BetSlipContext';

function calcMoneyline(game) {
  if (!game) return { home: 1.9, away: 1.9 };

  const series = game.series;
  if (series) {
    // Parse "GSW leads 3-1" or "Tied 2-2"
    const leadMatch = series.match(/(\w+)\s+leads?\s+(\d+)-(\d+)/i);
    if (leadMatch) {
      const leader = leadMatch[1].toUpperCase();
      const w = parseInt(leadMatch[2]);
      const l = parseInt(leadMatch[3]);
      const diff = w - l;
      const leaderMult = diff >= 3 ? 1.20 : diff === 2 ? 1.28 : 1.35;
      const trailerMult = diff >= 3 ? 5.0 : diff === 2 ? 4.0 : 3.5;

      const homeAbbr = (game.home?.abbr || '').toUpperCase();
      const awayAbbr = (game.away?.abbr || '').toUpperCase();
      if (leader === homeAbbr) return { home: leaderMult, away: trailerMult };
      if (leader === awayAbbr) return { home: trailerMult, away: leaderMult };
    }
  }
  return { home: 1.9, away: 1.9 };
}

function formatMult(n) {
  return n.toFixed(2) + 'x';
}

function formatGameTime(game) {
  if (!game) return '';
  if (game.state === 'in') {
    return `Q${game.period} ${game.clock}`;
  }
  if (game.state === 'post') return 'Final';
  if (game.date) {
    const d = new Date(game.date);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return '';
}

export default function GameMatchup({ game, onTeamPick }) {
  const { addOrTogglePick } = useBetSlip();

  if (!game) return null;

  const odds = calcMoneyline(game);
  const timeStr = formatGameTime(game);
  const isLive = game.state === 'in';
  const isFinal = game.state === 'post';

  function handleTeamPick(side) {
    const team = side === 'home' ? game.home : game.away;
    const mult = side === 'home' ? odds.home : odds.away;
    const pick = {
      id: `${game.id}-${side}`,
      playerName: team.name || team.abbr,
      teamAbbr: team.abbr,
      stat: 'ML',
      line: 0,
      dir: 'over',
      multiplier: mult,
      headshot: team.logo,
    };
    addOrTogglePick(pick);
    if (onTeamPick) onTeamPick(pick);
  }

  return (
    <div className="matchup-card">
      <div className="matchup-status-row">
        {isLive && <span className="matchup-live-badge">LIVE</span>}
        {isFinal && <span className="matchup-status-text">Final</span>}
        {!isLive && !isFinal && <span className="matchup-status-text">{timeStr}</span>}
        {game.series && <span className="matchup-series">{game.series}</span>}
      </div>

      <div className="matchup-teams">
        {/* Away team */}
        <div className="matchup-team">
          <div className="matchup-logo-stack">
            <img
              className="matchup-logo matchup-logo-3"
              src={game.away.logo}
              alt={game.away.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <img
              className="matchup-logo matchup-logo-2"
              src={game.away.logo}
              alt={game.away.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <img
              className="matchup-logo matchup-logo-1"
              src={game.away.logo}
              alt={game.away.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="matchup-team-info">
            <span className="matchup-team-abbr">{game.away.abbr}</span>
            {(isLive || isFinal) && (
              <span className={`matchup-score ${game.away.winner ? 'matchup-score-winner' : ''}`}>
                {game.away.score}
              </span>
            )}
          </div>
          <button
            className="matchup-ml-btn"
            onClick={() => handleTeamPick('away')}
          >
            {formatMult(odds.away)}
          </button>
        </div>

        <div className="matchup-vs">
          {isLive || isFinal ? (
            <span className="matchup-at">VS</span>
          ) : (
            <span className="matchup-at">@</span>
          )}
        </div>

        {/* Home team */}
        <div className="matchup-team">
          <div className="matchup-logo-stack">
            <img
              className="matchup-logo matchup-logo-3"
              src={game.home.logo}
              alt={game.home.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <img
              className="matchup-logo matchup-logo-2"
              src={game.home.logo}
              alt={game.home.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <img
              className="matchup-logo matchup-logo-1"
              src={game.home.logo}
              alt={game.home.abbr}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="matchup-team-info">
            <span className="matchup-team-abbr">{game.home.abbr}</span>
            {(isLive || isFinal) && (
              <span className={`matchup-score ${game.home.winner ? 'matchup-score-winner' : ''}`}>
                {game.home.score}
              </span>
            )}
          </div>
          <button
            className="matchup-ml-btn"
            onClick={() => handleTeamPick('home')}
          >
            {formatMult(odds.home)}
          </button>
        </div>
      </div>
    </div>
  );
}

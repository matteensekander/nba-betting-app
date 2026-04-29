import BettingCard from './BettingCard';
import StatsGrid from './StatsGrid';
import GameLog from './GameLog';

function initials(name = '') {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function PlayerCard({ player, profile, averages, gameLog, prediction }) {
  const displayName = profile?.name || player?.name || '';
  const teamName    = profile?.team || player?.team || '';
  const position    = profile?.position;
  const headshot    = profile?.headshot;
  const seasonPPG   = averages?.pts || 0;

  return (
    <div className="player-card">
      {/* Identity header */}
      <div className="player-header">
        {headshot ? (
          <img
            src={headshot}
            alt={displayName}
            className="player-avatar"
            style={{ objectFit: 'cover', background: 'var(--bg-2)' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="player-avatar">{initials(displayName)}</div>
        )}

        <div className="player-info">
          <div className="player-name">{displayName}</div>
          <div className="player-meta">
            <span className="player-team">{teamName}</span>
            {position && <span className="player-pos">{position}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>2024–25 Season</div>
          {averages?.games_played > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {averages.games_played} games
            </div>
          )}
        </div>
      </div>

      <BettingCard prediction={prediction} />
      <StatsGrid averages={averages} gameLog={gameLog} prediction={prediction} />
      <GameLog gameLog={gameLog} seasonPPG={seasonPPG} averages={averages} prediction={prediction} />
    </div>
  );
}

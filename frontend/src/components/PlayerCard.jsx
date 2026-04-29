import { useState } from 'react';
import BettingCard from './BettingCard';
import StatsGrid from './StatsGrid';
import GameLog from './GameLog';
import PropLines from './PropLines';

function initials(name = '') {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function PlayerCard({ player, profile, averages, gameLog, prediction, playoffAverages, playoffGameLog }) {
  const [seasonView, setSeasonView] = useState('regular'); // 'regular' | 'playoffs'

  const displayName  = profile?.name || player?.name || '';
  const teamName     = profile?.team || player?.team || '';
  const teamAbbr     = profile?.teamAbbr || '';
  const position     = profile?.position;
  const headshot     = profile?.headshot;

  const hasPlayoffs  = playoffAverages || (playoffGameLog && playoffGameLog.length > 0);
  const activeAvg    = seasonView === 'playoffs' ? playoffAverages : averages;
  const activeLog    = seasonView === 'playoffs' ? playoffGameLog : gameLog;
  const seasonPPG    = activeAvg?.pts || 0;

  return (
    <div className="player-card">
      {/* Identity header */}
      <div className="player-header">
        {headshot ? (
          <img src={headshot} alt={displayName} className="player-avatar"
            style={{ objectFit: 'cover', background: 'var(--bg-2)' }}
            onError={e => { e.target.style.display = 'none'; }} />
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

        {/* Season toggle */}
        <div className="season-toggle">
          <button
            className={`season-toggle-btn ${seasonView === 'regular' ? 'active' : ''}`}
            onClick={() => setSeasonView('regular')}
          >
            Regular Season
          </button>
          <button
            className={`season-toggle-btn ${seasonView === 'playoffs' ? 'active' : ''} ${!hasPlayoffs ? 'disabled' : ''}`}
            onClick={() => hasPlayoffs && setSeasonView('playoffs')}
            title={!hasPlayoffs ? 'No playoff data yet' : ''}
          >
            🏆 Playoffs
          </button>
        </div>
      </div>

      {/* Player prop pick lines (like Fliff / Underdog) */}
      <PropLines
        playerName={displayName}
        teamAbbr={teamAbbr}
        averages={averages}
        recentGameLog={gameLog}
      />

      {/* Betting prediction (regular season only) */}
      {seasonView === 'regular' && <BettingCard prediction={prediction} />}

      {/* Playoff badge if viewing playoffs */}
      {seasonView === 'playoffs' && (
        <div className="playoff-banner">
          🏆 2025–26 NBA Playoffs Stats
          {playoffGameLog?.length > 0 && (
            <span className="playoff-gp"> · {playoffGameLog.length} games played</span>
          )}
        </div>
      )}

      {/* Stats + game log */}
      {activeAvg || activeLog?.length > 0 ? (
        <>
          <StatsGrid averages={activeAvg} gameLog={activeLog} prediction={seasonView === 'regular' ? prediction : null} />
          <GameLog gameLog={activeLog || []} seasonPPG={seasonPPG} averages={activeAvg} prediction={seasonView === 'regular' ? prediction : null} />
        </>
      ) : (
        <div className="no-data" style={{ padding: '32px 0', textAlign: 'center' }}>
          {seasonView === 'playoffs' ? 'No playoff games yet this postseason.' : 'No season data available.'}
        </div>
      )}
    </div>
  );
}

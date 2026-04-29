import { useState, useEffect } from 'react';
import { getTeamRoster } from '../utils/api';

function initials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function RosterList({ team, onSelectPlayer, onBack }) {
  const [roster, setRoster] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTeamRoster(team.id)
      .then(data => {
        setRoster(data.players || []);
        setTeamInfo(data.team || team);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [team.id]);

  return (
    <div className="roster-section">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          ← All Teams
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{team.name}</span>
      </div>

      {/* Team header */}
      <div className="roster-header">
        <div className="roster-team-logo-wrap">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="roster-team-logo" />
          ) : (
            <div className="roster-team-abbr">{team.abbreviation}</div>
          )}
        </div>
        <div>
          <div className="section-label">Roster</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{team.name}</h2>
          <p className="roster-subtitle">Click a player to see betting analysis</p>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading roster...</p>
        </div>
      )}

      {error && <div className="error-card"><p>{error}</p></div>}

      {!loading && !error && (
        <div className="roster-grid">
          {roster.map(player => (
            <button
              key={player.id}
              className="roster-player-card"
              onClick={() => onSelectPlayer(player)}
            >
              <div className="roster-avatar">
                {player.headshot ? (
                  <img
                    src={player.headshot}
                    alt={player.name}
                    className="roster-headshot"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div
                  className="roster-initials"
                  style={{ display: player.headshot ? 'none' : 'flex' }}
                >
                  {initials(player.name)}
                </div>
              </div>
              <div className="roster-player-info">
                <span className="roster-player-name">{player.name}</span>
                <div className="roster-player-meta">
                  {player.jersey && <span className="roster-jersey">#{player.jersey}</span>}
                  {player.position && <span className="roster-pos">{player.position}</span>}
                </div>
              </div>
              <span className="roster-arrow">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

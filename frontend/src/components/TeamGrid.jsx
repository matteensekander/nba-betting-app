import { useState, useEffect } from 'react';
import { getTeams } from '../utils/api';

export default function TeamGrid({ onSelectTeam }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading all 30 NBA teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-card">
        <p>Failed to load teams: {error}</p>
      </div>
    );
  }

  return (
    <div className="team-grid-section">
      <div className="team-grid-header">
        <div className="section-label">Select a Team</div>
        <h2 className="section-title">All 30 NBA Teams</h2>
      </div>
      <div className="team-grid">
        {teams.map(team => (
          <button
            key={team.id}
            className="team-card"
            onClick={() => onSelectTeam(team)}
            title={team.name}
          >
            <div className="team-logo-wrap">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="team-logo"
                  loading="lazy"
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="team-logo-fallback" style={{ display: team.logo ? 'none' : 'flex' }}>
                {team.abbreviation}
              </div>
            </div>
            <span className="team-card-name">{team.shortName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

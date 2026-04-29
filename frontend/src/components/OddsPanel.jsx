import { useState, useEffect } from 'react';
import { getOdds } from '../utils/api';

function formatOdds(price) {
  if (price === undefined || price === null) return '—';
  return price > 0 ? `+${price}` : `${price}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function OddsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOdds()
      .then(setData)
      .catch(() => setData({ available: false, games: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="odds-panel">
        <div className="section-label">Live Odds</div>
        <h2 className="section-title">Today's Games</h2>
        <div className="loading-container" style={{ padding: '24px 0' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="odds-panel">
        <div className="odds-panel-header">
          <div>
            <div className="section-label">Live Odds</div>
            <h2 className="section-title">Today's Games</h2>
          </div>
        </div>
        <div className="odds-unavailable">
          <div className="odds-unavailable-icon">📊</div>
          <p>Live odds require a free API key from <strong>the-odds-api.com</strong></p>
          <p className="odds-unavailable-sub">Add <code>ODDS_API_KEY=your_key</code> to <code>backend/.env</code> — 500 free requests/month</p>
        </div>
      </div>
    );
  }

  if (!data.games?.length) {
    return (
      <div className="odds-panel">
        <div className="section-label">Live Odds</div>
        <h2 className="section-title">Today's Games</h2>
        <p className="no-data">No upcoming NBA games found.</p>
      </div>
    );
  }

  return (
    <div className="odds-panel">
      <div className="odds-panel-header">
        <div>
          <div className="section-label">Live Odds · Best Lines</div>
          <h2 className="section-title">Today's Games</h2>
        </div>
        <div className="odds-live-badge">LIVE</div>
      </div>

      <div className="odds-games-list">
        {data.games.map(game => (
          <div key={game.id} className="odds-game-card">
            {/* Game time */}
            <div className="odds-game-time">{formatTime(game.startTime)}</div>

            {/* Teams + Moneyline */}
            <div className="odds-matchup">
              {game.moneyline.map(side => {
                const isRecommended = side.name === game.recommendedBet;
                const isFavorite = side.price < 0;
                return (
                  <div
                    key={side.name}
                    className={`odds-side ${isRecommended ? 'odds-side-recommended' : ''}`}
                  >
                    <div className="odds-team-row">
                      <span className="odds-team-name">{side.name}</span>
                      {isRecommended && <span className="odds-best-badge">BEST BET</span>}
                    </div>
                    <div className="odds-numbers">
                      <div className={`odds-moneyline ${isFavorite ? 'odds-fav' : 'odds-dog'}`}>
                        {formatOdds(side.price)}
                        <span className="odds-type-label">ML</span>
                      </div>
                      {/* Spread for this team */}
                      {game.spreads.find(s => s.name === side.name) && (
                        <div className="odds-spread">
                          {game.spreads.find(s => s.name === side.name).point > 0 ? '+' : ''}
                          {game.spreads.find(s => s.name === side.name).point}
                          <span className="odds-type-label">SPD</span>
                        </div>
                      )}
                      <div className="odds-implied">{side.implied}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            {game.totals.length > 0 && (
              <div className="odds-totals">
                <span className="odds-totals-label">O/U</span>
                {game.totals.map(t => (
                  <span key={`${t.name}_${t.point}`} className="odds-total-item">
                    <span className="odds-total-side">{t.name === 'Over' ? '↑' : '↓'}</span>
                    {t.point} ({formatOdds(t.price)})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="odds-disclaimer">Odds are best available lines across major sportsbooks. Implied % shown.</p>
    </div>
  );
}

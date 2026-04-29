import { useState, useCallback } from 'react';
import TeamGrid from './components/TeamGrid';
import RosterList from './components/RosterList';
import PlayerCard from './components/PlayerCard';
import OddsPanel from './components/OddsPanel';
import SearchBar from './components/SearchBar';
import { searchPlayers, getPlayerProfile, getPlayerGameLog } from './utils/api';
import { parseEspnGameLog } from './utils/espnParser';
import { generatePrediction } from './utils/predictionEngine';

// view: 'home' | 'roster' | 'player'
export default function App() {
  const [view, setView] = useState('home');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const loadPlayer = useCallback(async (player) => {
    setSelectedPlayer(player);
    setPlayerData(null);
    setError(null);
    setLoading(true);
    setView('player');

    try {
      const [profile, rawGameLog] = await Promise.all([
        getPlayerProfile(player.id).catch(() => null),
        getPlayerGameLog(player.id, 2025).catch(() => null),
      ]);

      let parsed = rawGameLog ? parseEspnGameLog(rawGameLog) : null;

      if (!parsed?.seasonAverages && !parsed?.gameLog?.length) {
        const rawPrev = await getPlayerGameLog(player.id, 2024).catch(() => null);
        parsed = rawPrev ? parseEspnGameLog(rawPrev) : null;
      }

      const { seasonAverages = null, gameLog = [] } = parsed || {};
      const prediction = generatePrediction(seasonAverages, gameLog);

      setPlayerData({ profile, averages: seasonAverages, gameLog, prediction });
    } catch (err) {
      setError(err.message || 'Failed to load player data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTeamSelect = useCallback((team) => {
    setSelectedTeam(team);
    setView('roster');
    setShowSearch(false);
  }, []);

  const handlePlayerFromRoster = useCallback((player) => {
    loadPlayer(player);
  }, [loadPlayer]);

  const handleSearchSelect = useCallback((player) => {
    setShowSearch(false);
    loadPlayer(player);
  }, [loadPlayer]);

  const goHome = useCallback(() => {
    setView('home');
    setSelectedTeam(null);
    setSelectedPlayer(null);
    setPlayerData(null);
    setError(null);
    setShowSearch(false);
  }, []);

  const goToRoster = useCallback(() => {
    setView('roster');
    setSelectedPlayer(null);
    setPlayerData(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <button className="logo logo-btn" onClick={goHome} title="Home">
            <span className="logo-icon">◆</span>
            <span className="logo-text">NBA<span className="logo-accent">Edge</span></span>
          </button>
          <p className="header-subtitle">AI-Powered Player Betting Analysis</p>
        </div>

        {/* Search toggle in header */}
        <button
          className="header-search-btn"
          onClick={() => setShowSearch(s => !s)}
          title="Search players"
        >
          🔍 Search Player
        </button>
      </header>

      {/* Search overlay */}
      {showSearch && (
        <div className="search-overlay">
          <div className="container">
            <SearchBar onSearch={searchPlayers} onSelect={handleSearchSelect} autoFocus />
          </div>
        </div>
      )}

      <main className="main">
        <div className="container">

          {/* ── HOME: Team Grid + Odds ── */}
          {view === 'home' && (
            <>
              <OddsPanel />
              <TeamGrid onSelectTeam={handleTeamSelect} />
            </>
          )}

          {/* ── ROSTER: Players for a team ── */}
          {view === 'roster' && selectedTeam && (
            <RosterList
              team={selectedTeam}
              onSelectPlayer={handlePlayerFromRoster}
              onBack={goHome}
            />
          )}

          {/* ── PLAYER: Stats + Prediction ── */}
          {view === 'player' && (
            <>
              {/* Breadcrumb back navigation */}
              {selectedTeam && (
                <div className="breadcrumb" style={{ marginBottom: 16 }}>
                  <button className="breadcrumb-back" onClick={goHome}>← All Teams</button>
                  <span className="breadcrumb-sep">/</span>
                  <button className="breadcrumb-back" onClick={goToRoster}>{selectedTeam.name}</button>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-current">{selectedPlayer?.name}</span>
                </div>
              )}

              {loading && (
                <div className="loading-container">
                  <div className="spinner" />
                  <p>Fetching live player data...</p>
                </div>
              )}

              {error && !loading && (
                <div className="error-card">
                  <p>{error}</p>
                  <p className="error-hint">Check your connection or try a different player.</p>
                </div>
              )}

              {selectedPlayer && playerData && !loading && (
                <PlayerCard
                  player={selectedPlayer}
                  profile={playerData.profile}
                  averages={playerData.averages}
                  gameLog={playerData.gameLog}
                  prediction={playerData.prediction}
                />
              )}
            </>
          )}

        </div>
      </main>

      <footer className="footer">
        <div className="disclaimer">
          <span className="disclaimer-icon">⚠</span>
          <strong>For entertainment purposes only. Not financial advice.</strong>
          &nbsp;Predictions are based on statistical trends and do not guarantee outcomes.
          Always gamble responsibly.
        </div>
      </footer>
    </div>
  );
}

import { useState, useCallback } from 'react';
import TeamGrid from './components/TeamGrid';
import RosterList from './components/RosterList';
import PlayerCard from './components/PlayerCard';
import OddsPanel from './components/OddsPanel';
import LiveScoreboard from './components/LiveScoreboard';
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
      // 2025-26 season = ESPN year 2026. Fetch regular season + playoffs in parallel.
      const [profile, rawRegular, rawPlayoffs] = await Promise.all([
        getPlayerProfile(player.id).catch(() => null),
        getPlayerGameLog(player.id, 2026, 2).catch(() => null),
        getPlayerGameLog(player.id, 2026, 3).catch(() => null),
      ]);

      let parsedRegular = rawRegular ? parseEspnGameLog(rawRegular) : null;

      // Fall back to 2025 regular season if no 2026 data
      if (!parsedRegular?.seasonAverages && !parsedRegular?.gameLog?.length) {
        const rawPrev = await getPlayerGameLog(player.id, 2025, 2).catch(() => null);
        parsedRegular = rawPrev ? parseEspnGameLog(rawPrev) : null;
      }

      const parsedPlayoffs = rawPlayoffs ? parseEspnGameLog(rawPlayoffs) : null;

      const { seasonAverages = null, gameLog = [] } = parsedRegular || {};
      const playoffAverages = parsedPlayoffs?.seasonAverages || null;
      const playoffGameLog = parsedPlayoffs?.gameLog || [];

      const prediction = generatePrediction(seasonAverages, gameLog);

      setPlayerData({ profile, averages: seasonAverages, gameLog, prediction, playoffAverages, playoffGameLog });
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
          <p className="header-subtitle">2025–26 Season · AI Betting Analysis · Live Playoff Stats</p>
        </div>
        <button className="header-search-btn" onClick={() => setShowSearch(s => !s)} title="Search players">
          🔍 Search Player
        </button>
      </header>

      {showSearch && (
        <div className="search-overlay">
          <div className="container">
            <SearchBar onSearch={searchPlayers} onSelect={handleSearchSelect} autoFocus />
          </div>
        </div>
      )}

      <main className="main">
        <div className="container">

          {view === 'home' && (
            <>
              <LiveScoreboard />
              <OddsPanel />
              <TeamGrid onSelectTeam={handleTeamSelect} />
            </>
          )}

          {view === 'roster' && selectedTeam && (
            <RosterList
              team={selectedTeam}
              onSelectPlayer={handlePlayerFromRoster}
              onBack={goHome}
            />
          )}

          {view === 'player' && (
            <>
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
                  <p>Fetching 2025–26 season data...</p>
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
                  playoffAverages={playerData.playoffAverages}
                  playoffGameLog={playerData.playoffGameLog}
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

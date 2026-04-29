import { useState, useEffect, useCallback } from 'react';
import { BetSlipProvider } from './context/BetSlipContext';
import FliffHeader from './components/FliffHeader';
import GameMatchup from './components/GameMatchup';
import PropTabBar from './components/PropTabBar';
import PropCard from './components/PropCard';
import BetSlip from './components/BetSlip';
import BottomNav from './components/BottomNav';
import { getScoreboard, getTeams, getGameProps } from './utils/api';

const STAT_CONFIG = {
  pts: { label: 'Points', key: 'pts' },
  reb: { label: 'Rebounds', key: 'reb' },
  ast: { label: 'Assists', key: 'ast' },
  '3pm': { label: '3-Pointers', key: 'fg3m' },
};

// "Popular" shows pts first, then reb/ast
const POPULAR_KEYS = ['pts', 'reb', 'ast'];

function getStatKey(activeTab) {
  if (activeTab === 'pts') return 'pts';
  if (activeTab === 'reb') return 'reb';
  if (activeTab === 'ast') return 'ast';
  if (activeTab === '3pm') return 'fg3m';
  return null;
}

function GameSelector({ games, selectedIndex, onSelect }) {
  if (!games || games.length <= 1) return null;
  return (
    <div className="game-selector">
      {games.map((g, i) => (
        <button
          key={g.id}
          className={`game-selector-btn ${selectedIndex === i ? 'game-selector-btn--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span className="game-selector-abbr">{g.away.abbr}</span>
          <span className="game-selector-at">@</span>
          <span className="game-selector-abbr">{g.home.abbr}</span>
          {g.state === 'in' && <span className="game-selector-live-dot" />}
        </button>
      ))}
    </div>
  );
}

function AppInner() {
  const [games, setGames] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedGameProps, setSelectedGameProps] = useState(null);
  const [activeTab, setActiveTab] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [propsLoading, setPropsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);

  const selectedGame = games[selectedIndex] || null;

  // Fetch scoreboard + teams on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const [scoreboardData, teamsData] = await Promise.all([
          getScoreboard().catch(() => ({ games: [] })),
          getTeams().catch(() => []),
        ]);
        setGames(scoreboardData.games || []);
        setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Find team IDs from team list by abbreviation
  function findTeamId(abbr) {
    if (!abbr || !teams.length) return null;
    const match = teams.find(t =>
      (t.abbreviation || t.abbr || '').toUpperCase() === abbr.toUpperCase()
    );
    return match?.id || null;
  }

  // Fetch game props when selected game changes
  const fetchGameProps = useCallback(async (game) => {
    if (!game) return;

    const homeId = findTeamId(game.home?.abbr);
    const awayId = findTeamId(game.away?.abbr);

    if (!homeId || !awayId) return;

    setPropsLoading(true);
    setSelectedGameProps(null);
    try {
      const props = await getGameProps(homeId, awayId);
      setSelectedGameProps(props);
    } catch (err) {
      console.error('Failed to load game props:', err);
    } finally {
      setPropsLoading(false);
    }
  }, [teams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedGame && teams.length > 0) {
      fetchGameProps(selectedGame);
    }
  }, [selectedIndex, teams.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter players for current tab
  const players = selectedGameProps?.players || [];

  function getFilteredCards() {
    if (activeTab === 'popular') {
      // Show one card per player for the most available stat (pts preferred)
      return players.flatMap(player => {
        for (const key of POPULAR_KEYS) {
          const propKey = key === 'pts' ? 'pts' : key === 'reb' ? 'reb' : key === 'ast' ? 'ast' : 'fg3m';
          if (player.props?.[propKey]) {
            return [{ player, statKey: propKey, statLabel: STAT_CONFIG[key]?.label || propKey, propData: player.props[propKey] }];
          }
        }
        return [];
      });
    }
    if (activeTab === 'h2h') {
      // Show pts for all players from both teams interleaved
      return players.filter(p => p.props?.pts).map(player => ({
        player,
        statKey: 'pts',
        statLabel: 'Points',
        propData: player.props.pts,
      }));
    }
    const apiKey = getStatKey(activeTab);
    if (!apiKey) return [];
    return players.filter(p => p.props?.[apiKey]).map(player => ({
      player,
      statKey: apiKey,
      statLabel: STAT_CONFIG[activeTab]?.label || apiKey,
      propData: player.props[apiKey],
    }));
  }

  const cards = getFilteredCards();

  if (loading) {
    return (
      <div className="app">
        <FliffHeader game={null} />
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading today's games...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <FliffHeader game={null} />
        <div className="error-screen">
          <p className="error-screen-msg">{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="app">
        <FliffHeader game={null} />
        <div className="empty-screen">
          <span className="empty-screen-icon">🏀</span>
          <h2>No games today</h2>
          <p>Check back later for today's NBA action.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app">
      <FliffHeader game={selectedGame} />

      <main className="main-scroll">
        <div className="app-container">
          <GameSelector
            games={games}
            selectedIndex={selectedIndex}
            onSelect={i => setSelectedIndex(i)}
          />

          <GameMatchup game={selectedGame} />

          <PropTabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {propsLoading && (
            <div className="props-loading">
              <div className="spinner spinner--sm" />
              <span>Loading player props...</span>
            </div>
          )}

          {!propsLoading && cards.length === 0 && (
            <div className="props-empty">
              <p>No props available for this tab.</p>
            </div>
          )}

          {!propsLoading && cards.length > 0 && (
            <div className="prop-cards-list">
              {cards.map(({ player, statKey, statLabel, propData }) => (
                <PropCard
                  key={`${player.id}-${statKey}`}
                  player={player}
                  statKey={statKey}
                  statLabel={statLabel}
                  propData={propData}
                  gameId={selectedGame?.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BetSlip />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BetSlipProvider>
      <AppInner />
    </BetSlipProvider>
  );
}

const { ESPN_API, ESPN_SITE, espnFetch, cors } = require('./_lib');

// Round to nearest 0.5
function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

function safeFloat(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function calcMultipliers(seasonAvg, recent5Avg, line) {
  if (line <= 0) return { overMult: 1.87, underMult: 1.87, recommend: null };
  const diff = recent5Avg > 0 ? (recent5Avg - line) / line : 0;

  if (diff > 0.20) return { overMult: 1.73, underMult: 2.07, recommend: 'over' };
  if (diff > 0.10) return { overMult: 1.77, underMult: 2.00, recommend: 'over' };
  if (diff > 0.05) return { overMult: 1.82, underMult: 1.93, recommend: null };
  if (diff < -0.20) return { overMult: 2.07, underMult: 1.73, recommend: 'under' };
  if (diff < -0.10) return { overMult: 2.00, underMult: 1.77, recommend: 'under' };
  if (diff < -0.05) return { overMult: 1.93, underMult: 1.82, recommend: null };
  return { overMult: 1.87, underMult: 1.87, recommend: null };
}

function parseGamelogData(rawData) {
  const labels = rawData.labels || [];
  const eventsMap = rawData.events || {};
  const seasonTypes = rawData.seasonTypes || [];

  // Find regular season type
  const regSeason = seasonTypes.find(
    st => st.name?.includes('regular') || st.displayName?.includes('Regular')
  );

  let seasonAvgs = { pts: 0, reb: 0, ast: 0, fg3m: 0, min: 0 };

  if (regSeason) {
    // Try to get averages from categories or summary
    const categories = regSeason.categories || [];
    // Find totals/averages — look for summary stats
    const summary = regSeason.summary;
    if (summary && summary.stats) {
      const avgRow = summary.stats.find(s => s.type === 'avg');
      if (avgRow && avgRow.stats) {
        const zipToDict = (keys, vals) => {
          const obj = {};
          keys.forEach((k, i) => { obj[k] = vals?.[i] ?? '0'; });
          return obj;
        };
        const avg = zipToDict(labels, avgRow.stats);
        seasonAvgs.pts = safeFloat(avg['PTS']);
        seasonAvgs.reb = safeFloat(avg['REB']);
        seasonAvgs.ast = safeFloat(avg['AST']);
        // FG3M might be stored as "3PM" or "FG3M"
        seasonAvgs.fg3m = safeFloat(avg['3PM'] || avg['FG3M'] || avg['3PT'] || 0);
        seasonAvgs.min = safeFloat(avg['MIN']);
      }
    }
  }

  // Parse last 5 games from events
  const allGames = [];
  for (const st of seasonTypes) {
    for (const cat of st.categories || []) {
      for (const evData of cat.events || []) {
        const ev = eventsMap[evData.eventId];
        if (!ev) continue;
        const gameDate = ev.gameDate?.split('T')[0] || '';
        const statsArr = evData.stats || [];
        const zipToDict = (keys, vals) => {
          const obj = {};
          keys.forEach((k, i) => { obj[k] = vals?.[i] ?? '0'; });
          return obj;
        };
        const stats = zipToDict(labels, statsArr);
        allGames.push({
          date: gameDate,
          pts: safeFloat(stats['PTS']),
          reb: safeFloat(stats['REB']),
          ast: safeFloat(stats['AST']),
          fg3m: safeFloat(stats['3PM'] || stats['FG3M'] || stats['3PT'] || 0),
          min: safeFloat(stats['MIN']),
        });
      }
    }
  }

  allGames.sort((a, b) => b.date.localeCompare(a.date));
  const last5 = allGames.slice(0, 5);

  function avg5(key) {
    if (last5.length === 0) return 0;
    return last5.reduce((sum, g) => sum + g[key], 0) / last5.length;
  }

  const recent5Avgs = {
    pts: avg5('pts'),
    reb: avg5('reb'),
    ast: avg5('ast'),
    fg3m: avg5('fg3m'),
  };

  return { seasonAvgs, recent5Avgs };
}

function buildPropData(seasonAvgs, recent5Avgs) {
  const stats = ['pts', 'reb', 'ast', 'fg3m'];
  const props = {};

  for (const stat of stats) {
    const sa = seasonAvgs[stat] || 0;
    const r5 = recent5Avgs[stat] || 0;
    const line = roundHalf(sa);
    if (line <= 0) continue;

    const { overMult, underMult, recommend } = calcMultipliers(sa, r5, line);
    props[stat] = {
      line,
      overMult,
      underMult,
      recommend,
      seasonAvg: Math.round(sa * 10) / 10,
      recent5Avg: Math.round(r5 * 10) / 10,
    };
  }

  return props;
}

async function fetchRoster(teamId) {
  const data = await espnFetch(`${ESPN_SITE}/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
  const raw = data.athletes || [];
  const flat = raw[0]?.items ? raw.flatMap(g => g.items || []) : raw;
  const team = data.team || {};
  return {
    teamInfo: {
      id: teamId,
      name: team.displayName || team.name || '',
      abbr: team.abbreviation || '',
      logo: team.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${(team.abbreviation || '').toLowerCase()}.png`,
    },
    players: flat.slice(0, 6).map(p => ({
      id: p.id,
      name: p.fullName,
      headshot: p.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${p.id}.png`,
    })),
  };
}

async function fetchPlayerGamelog(playerId) {
  // Try 2026 regular season first
  try {
    const url = `${ESPN_API}/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog?season=2026&seasontype=2`;
    return await espnFetch(url);
  } catch {
    try {
      const url = `${ESPN_API}/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog?season=2025&seasontype=2`;
      return await espnFetch(url);
    } catch {
      return null;
    }
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { homeTeamId, awayTeamId } = req.query;
  if (!homeTeamId || !awayTeamId) {
    return res.status(400).json({ error: 'homeTeamId and awayTeamId are required' });
  }

  try {
    // Fetch rosters in parallel
    const [homeRoster, awayRoster] = await Promise.all([
      fetchRoster(homeTeamId),
      fetchRoster(awayTeamId),
    ]);

    const allPlayers = [
      ...homeRoster.players.map(p => ({ ...p, teamAbbr: homeRoster.teamInfo.abbr, teamId: homeTeamId })),
      ...awayRoster.players.map(p => ({ ...p, teamAbbr: awayRoster.teamInfo.abbr, teamId: awayTeamId })),
    ];

    // Fetch gamelogs in parallel
    const gamelogResults = await Promise.allSettled(
      allPlayers.map(p => fetchPlayerGamelog(p.id))
    );

    const players = [];
    for (let i = 0; i < allPlayers.length; i++) {
      const result = gamelogResults[i];
      if (result.status === 'rejected' || !result.value) continue;

      const rawData = result.value;
      let seasonAvgs, recent5Avgs;
      try {
        ({ seasonAvgs, recent5Avgs } = parseGamelogData(rawData));
      } catch {
        continue;
      }

      const props = buildPropData(seasonAvgs, recent5Avgs);
      if (Object.keys(props).length === 0) continue;

      const p = allPlayers[i];
      players.push({
        id: p.id,
        name: p.name,
        teamAbbr: p.teamAbbr,
        teamId: p.teamId,
        headshot: p.headshot,
        props,
      });
    }

    res.json({
      home: homeRoster.teamInfo,
      away: awayRoster.teamInfo,
      players,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

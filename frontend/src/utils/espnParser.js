// Parse the raw ESPN gamelog API response into a normalized shape.

function zipToDict(keys, values) {
  const obj = {};
  keys.forEach((k, i) => { obj[k] = values?.[i] ?? '0'; });
  return obj;
}

function safeFloat(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function parseSeasonAverages(seasonType, labels) {
  const summary = seasonType?.summary;
  if (!summary?.stats) return null;

  const avgRow = summary.stats.find(s => s.type === 'avg');
  const totRow = summary.stats.find(s => s.type === 'total');
  if (!avgRow) return null;

  const avg = zipToDict(labels, avgRow.stats);
  const tot = totRow ? zipToDict(labels, totRow.stats) : {};

  // Derive games played: total PTS ÷ average PTS
  const ptsAvg = safeFloat(avg['PTS']);
  const ptsTot = safeFloat(tot['PTS']);
  const gamesPlayed = ptsAvg > 0 ? Math.round(ptsTot / ptsAvg) : 0;

  return {
    pts: safeFloat(avg['PTS']),
    reb: safeFloat(avg['REB']),
    ast: safeFloat(avg['AST']),
    stl: safeFloat(avg['STL']),
    blk: safeFloat(avg['BLK']),
    min: safeFloat(avg['MIN']),
    fg_pct: safeFloat(avg['FG%']),   // 0–100
    fg3_pct: safeFloat(avg['3P%']), // 0–100
    ft_pct: safeFloat(avg['FT%']),  // 0–100
    fg: avg['FG'] || '',
    fg3: avg['3PT'] || '',
    ft: avg['FT'] || '',
    games_played: gamesPlayed,
  };
}

function parseGameEntry(evData, ev, labels) {
  const stats = zipToDict(labels, evData.stats);
  const playerTeamId = ev.team?.id;
  const isHome = ev.homeTeamId === playerTeamId;
  const teamScore = isHome ? Number(ev.homeTeamScore) : Number(ev.awayTeamScore);
  const oppScore  = isHome ? Number(ev.awayTeamScore) : Number(ev.homeTeamScore);

  return {
    id: evData.eventId,
    date: ev.gameDate?.split('T')[0] || '',
    isHome,
    opponent: ev.opponent?.abbreviation || '?',
    oppFull: ev.opponent?.displayName || '',
    teamScore,
    oppScore,
    result: ev.gameResult || '',
    min: safeFloat(stats['MIN']),
    pts: safeFloat(stats['PTS']),
    reb: safeFloat(stats['REB']),
    ast: safeFloat(stats['AST']),
    stl: safeFloat(stats['STL']),
    blk: safeFloat(stats['BLK']),
    to: safeFloat(stats['TO']),
    fg_pct: safeFloat(stats['FG%']),   // 0–100
    fg3_pct: safeFloat(stats['3P%']), // 0–100
    ft_pct: safeFloat(stats['FT%']),  // 0–100
    fg: stats['FG'] || '',
    fg3: stats['3PT'] || '',
    ft: stats['FT'] || '',
  };
}

export function parseEspnGameLog(rawData) {
  const labels = rawData.labels || [];
  const eventsMap = rawData.events || {};
  const seasonTypes = rawData.seasonTypes || [];

  // "Play In Regular Season" must not match before the main "Regular Season"
  const regSeason = seasonTypes.find(
    st => /Regular Season$/.test(st.displayName) && !st.displayName?.includes('Play In')
  );
  const postSeason = seasonTypes.find(st => st.displayName?.includes('Postseason'));

  const seasonAverages = parseSeasonAverages(regSeason, labels);

  // Collect all games (regular + postseason), sorted newest first
  const allGames = [];
  for (const st of [postSeason, regSeason].filter(Boolean)) {
    for (const cat of st.categories || []) {
      for (const evData of cat.events || []) {
        const ev = eventsMap[evData.eventId];
        if (!ev) continue;
        allGames.push(parseGameEntry(evData, ev, labels));
      }
    }
  }

  allGames.sort((a, b) => b.date.localeCompare(a.date));

  return { seasonAverages, gameLog: allGames };
}

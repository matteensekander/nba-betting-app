const BASE = '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function searchPlayers(query) {
  if (!query || query.trim().length < 2) return Promise.resolve([]);
  return get(`/players/search?q=${encodeURIComponent(query.trim())}`);
}

export function getPlayerProfile(id) {
  return get(`/players/${id}/profile`);
}

// year: ESPN ending year (2026 = 2025-26 season). seasontype: 2=regular, 3=playoffs
export function getPlayerGameLog(id, year = 2026, seasontype = '') {
  const st = seasontype ? `&seasontype=${seasontype}` : '';
  return get(`/players/${id}/gamelog?year=${year}${st}`);
}

export function getTeams() {
  return get('/teams');
}

export function getTeamRoster(teamId) {
  return get(`/teams/${teamId}/roster`);
}

export function getOdds() {
  return get('/odds');
}

export function getScoreboard() {
  return get('/scoreboard');
}

export function getPropLines(playerName, teamAbbr) {
  const params = new URLSearchParams({ playerName, teamAbbr: teamAbbr || '' });
  return get(`/proplines?${params}`);
}

export function getGameProps(homeTeamId, awayTeamId) {
  return get(`/game-props?homeTeamId=${homeTeamId}&awayTeamId=${awayTeamId}`);
}

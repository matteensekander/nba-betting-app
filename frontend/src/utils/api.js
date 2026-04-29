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

export function getPlayerGameLog(id, year = 2025) {
  return get(`/players/${id}/gamelog?year=${year}`);
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

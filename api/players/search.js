const { ESPN_SEARCH, espnFetch, cors, extractAthleteId } = require('../_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  try {
    const url = `${ESPN_SEARCH}?query=${encodeURIComponent(q.trim())}&mode=prefix&limit=15&types=player&leagues=nba`;
    const data = await espnFetch(url);
    const playerGroup = (data.results || []).find(r => r.type === 'player');
    const players = (playerGroup?.contents || [])
      .filter(p => (p.uid || '').includes('l:46') || p.description === 'NBA')
      .map(p => ({ id: extractAthleteId(p.uid), uid: p.uid, name: p.displayName, team: p.subtitle || 'N/A' }))
      .filter(p => p.id);
    res.json(players);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

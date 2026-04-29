const { ESPN_SITE, espnFetch, cors } = require('../../_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { teamId } = req.query;
  try {
    const data = await espnFetch(`${ESPN_SITE}/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
    const raw = data.athletes || [];
    const flat = raw[0]?.items ? raw.flatMap(g => g.items || []) : raw;
    const players = flat.map(p => ({
      id: p.id,
      name: p.fullName,
      position: p.position?.abbreviation || '',
      jersey: p.jersey || '',
      headshot: p.headshot?.href || null,
    })).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ team: data.team || {}, players });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

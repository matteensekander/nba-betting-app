const { ESPN_SITE, espnFetch, cors } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const data = await espnFetch(`${ESPN_SITE}/site/v2/sports/basketball/nba/teams?limit=32`);
    const raw = data.sports?.[0]?.leagues?.[0]?.teams || [];
    const teams = raw.map(({ team }) => ({
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      shortName: team.shortDisplayName,
      logo: team.logos?.[0]?.href || null,
      color: team.color || '1a1a2e',
      alternateColor: team.alternateColor || '5b73ff',
    })).sort((a, b) => a.name.localeCompare(b.name));
    res.json(teams);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

const { ESPN_API, espnFetch, cors } = require('../../_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  try {
    const data = await espnFetch(`${ESPN_API}/common/v3/sports/basketball/nba/athletes/${id}`);
    const a = data.athlete || {};
    res.json({
      id,
      name: a.fullName,
      firstName: a.firstName,
      lastName: a.lastName,
      position: a.position?.abbreviation,
      team: a.team?.displayName,
      teamAbbr: a.team?.abbreviation,
      headshot: a.headshot?.href,
      jersey: a.jersey,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

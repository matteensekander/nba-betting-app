const { ESPN_API, espnFetch, cors } = require('../../_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, year } = req.query;
  const season = Number(year) || 2025;
  try {
    const data = await espnFetch(`${ESPN_API}/common/v3/sports/basketball/nba/athletes/${id}/gamelog?season=${season}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

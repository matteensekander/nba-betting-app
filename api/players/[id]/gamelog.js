const { ESPN_API, espnFetch, cors } = require('../../_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, year, seasontype } = req.query;
  const season = Number(year) || 2026;
  const type = seasontype || '';

  try {
    const url = `${ESPN_API}/common/v3/sports/basketball/nba/athletes/${id}/gamelog?season=${season}${type ? `&seasontype=${type}` : ''}`;
    const data = await espnFetch(url);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

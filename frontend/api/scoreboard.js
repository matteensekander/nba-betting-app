const { cors } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!r.ok) throw new Error(`ESPN ${r.status}`);
    const data = await r.json();

    const games = (data.events || []).map(ev => {
      const comp = ev.competitions?.[0] || {};
      const competitors = comp.competitors || [];
      const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
      const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};
      const status = ev.status || {};
      const statusType = status.type || {};
      const series = comp.series || null;

      return {
        id: ev.id,
        name: ev.name,
        date: ev.date,
        state: statusType.state,           // 'pre' | 'in' | 'post'
        statusText: statusType.detail || statusType.shortDetail || statusType.description || '',
        period: status.period || 0,
        clock: status.displayClock || '',
        home: {
          abbr: home.team?.abbreviation,
          name: home.team?.displayName,
          logo: home.team?.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${home.team?.abbreviation?.toLowerCase()}.png`,
          score: home.score || '0',
          winner: home.winner || false,
        },
        away: {
          abbr: away.team?.abbreviation,
          name: away.team?.displayName,
          logo: away.team?.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${away.team?.abbreviation?.toLowerCase()}.png`,
          score: away.score || '0',
          winner: away.winner || false,
        },
        series: series ? series.summary || null : null,
        playoff: (data.season?.type === 3) || ev.season?.type === 3,
      };
    });

    res.json({ season: data.season || {}, games });
  } catch (err) {
    res.status(500).json({ error: err.message, games: [] });
  }
};

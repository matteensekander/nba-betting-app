const { cors } = require('./_lib');

function toImplied(price) {
  return price > 0 ? 100 / (price + 100) : Math.abs(price) / (Math.abs(price) + 100);
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ODDS_API_KEY;
  if (!key) return res.json({ available: false, games: [] });

  try {
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${key}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&daysFrom=2`;
    const response = await fetch(url);
    if (!response.ok) return res.json({ available: false, games: [] });
    const data = await response.json();

    const games = (Array.isArray(data) ? data : []).map(game => {
      const bestML = {}, bestSpread = {}, bestTotal = {};
      for (const bm of game.bookmakers || []) {
        for (const mkt of bm.markets || []) {
          for (const o of mkt.outcomes) {
            if (mkt.key === 'h2h' && (!bestML[o.name] || o.price > bestML[o.name].price)) bestML[o.name] = o;
            if (mkt.key === 'spreads' && (!bestSpread[o.name] || o.price > bestSpread[o.name].price)) bestSpread[o.name] = o;
            if (mkt.key === 'totals') {
              const k = `${o.name}_${o.point}`;
              if (!bestTotal[k] || o.price > bestTotal[k].price) bestTotal[k] = o;
            }
          }
        }
      }
      const moneylines = Object.values(bestML);
      const totalImpl = moneylines.reduce((s, o) => s + toImplied(o.price), 0);
      const withValue = moneylines.map(o => ({ ...o, implied: Math.round(toImplied(o.price) * 100), value: Math.round((toImplied(o.price) / totalImpl) * 100) }));
      const recommend = withValue.reduce((best, o) => Math.abs(o.implied - 50) < Math.abs(best.implied - 50) ? o : best, withValue[0] || {});
      return { id: game.id, homeTeam: game.home_team, awayTeam: game.away_team, startTime: game.commence_time, moneyline: withValue, spreads: Object.values(bestSpread), totals: Object.values(bestTotal).slice(0, 2), recommendedBet: recommend?.name || null };
    });

    res.json({ available: true, games });
  } catch (err) {
    res.status(500).json({ available: false, games: [] });
  }
};

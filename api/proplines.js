const { cors } = require('./_lib');

const PROP_MARKETS = [
  'player_points',
  'player_rebounds',
  'player_assists',
  'player_threes',
  'player_blocks',
  'player_steals',
  'player_points_rebounds_assists',
].join(',');

const STAT_LABELS = {
  player_points: 'PTS',
  player_rebounds: 'REB',
  player_assists: 'AST',
  player_threes: '3PM',
  player_blocks: 'BLK',
  player_steals: 'STL',
  player_points_rebounds_assists: 'PRA',
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ODDS_API_KEY;
  if (!key) return res.json({ available: false, lines: [] });

  const { playerName, teamAbbr } = req.query;
  if (!playerName) return res.json({ available: false, lines: [] });

  try {
    // Step 1: get today's events
    const eventsRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${key}&dateFormat=iso`,
    );
    if (!eventsRes.ok) return res.json({ available: false, lines: [] });
    const events = await eventsRes.json();
    if (!Array.isArray(events) || !events.length) return res.json({ available: false, lines: [] });

    // Step 2: find event for this player's team (loose match on team abbr or name)
    const norm = s => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    const abbr = norm(teamAbbr);
    const event = events.find(ev =>
      norm(ev.home_team).includes(abbr) || norm(ev.away_team).includes(abbr) ||
      abbr.length > 2 && (norm(ev.home_team).startsWith(abbr.slice(0,4)) || norm(ev.away_team).startsWith(abbr.slice(0,4)))
    );
    if (!event) return res.json({ available: false, lines: [], reason: 'no_game_today' });

    // Step 3: fetch player props for that event
    const propsRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${event.id}/odds?apiKey=${key}&markets=${PROP_MARKETS}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,betonlineag`,
    );
    if (!propsRes.ok) return res.json({ available: false, lines: [] });
    const propsData = await propsRes.json();

    // Step 4: find player's lines
    const pNorm = norm(playerName);
    const lines = [];

    for (const bm of (propsData.bookmakers || []).slice(0, 3)) {
      for (const mkt of (bm.markets || [])) {
        const label = STAT_LABELS[mkt.key];
        if (!label) continue;

        // Find outcomes for this player
        const playerOutcomes = mkt.outcomes.filter(o => {
          const d = norm(o.description || '');
          return d === pNorm || pNorm.includes(d) || d.includes(pNorm.split(' ').pop());
        });
        if (!playerOutcomes.length) continue;

        const over = playerOutcomes.find(o => o.name === 'Over');
        const under = playerOutcomes.find(o => o.name === 'Under');
        if (!over && !under) continue;

        const line = over?.point ?? under?.point;
        if (line == null) continue;

        // Avoid duplicate stat entries (keep best book)
        const existing = lines.find(l => l.stat === label);
        if (!existing) {
          lines.push({
            stat: label,
            key: mkt.key,
            line,
            overPrice: over?.price ?? null,
            underPrice: under?.price ?? null,
            book: bm.title,
          });
        }
      }
    }

    res.json({
      available: true,
      lines,
      game: { home: event.home_team, away: event.away_team, startTime: event.commence_time },
    });
  } catch (err) {
    res.status(500).json({ available: false, lines: [], error: err.message });
  }
};

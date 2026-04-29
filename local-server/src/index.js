const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const ESPN_API    = 'https://site.web.api.espn.com/apis';
const ESPN_SITE   = 'https://site.api.espn.com/apis';
const ESPN_SEARCH = 'https://site.web.api.espn.com/apis/search/v2';

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

async function espnFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  if (res.status === 429) throw Object.assign(new Error('Rate limited — please wait a moment'), { status: 429 });
  if (!res.ok) throw Object.assign(new Error(`ESPN API error: ${res.status}`), { status: res.status });
  return res.json();
}

function extractAthleteId(uid = '') {
  const m = uid.match(/a:(\d+)/);
  return m ? m[1] : null;
}

// ── All NBA teams ────────────────────────────────────────────
app.get('/api/teams', async (req, res) => {
  try {
    const url = `${ESPN_SITE}/site/v2/sports/basketball/nba/teams?limit=32`;
    const data = await espnFetch(url);
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
});

// ── Team roster ──────────────────────────────────────────────
app.get('/api/teams/:teamId/roster', async (req, res) => {
  try {
    const { teamId } = req.params;
    const url = `${ESPN_SITE}/site/v2/sports/basketball/nba/teams/${teamId}/roster`;
    const data = await espnFetch(url);

    const raw = data.athletes || [];
    // ESPN returns either a flat array or grouped array depending on endpoint version
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
});

// ── NBA game odds (The Odds API — free tier 500 req/mo) ──────
// Set ODDS_API_KEY in .env to enable. Get a free key at the-odds-api.com
app.get('/api/odds', async (req, res) => {
  const key = process.env.ODDS_API_KEY;
  if (!key) return res.json({ available: false, games: [] });

  try {
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${key}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&daysFrom=2`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.json({ available: false, games: [], error: text });
    }
    const data = await response.json();

    const games = (Array.isArray(data) ? data : []).map(game => {
      // Find best (lowest vig) moneyline odds across bookmakers
      const allMoneylines = [];
      const allSpreads = [];
      const allTotals = [];

      for (const bm of game.bookmakers || []) {
        for (const mkt of bm.markets || []) {
          if (mkt.key === 'h2h') allMoneylines.push(...mkt.outcomes.map(o => ({ ...o, book: bm.title })));
          if (mkt.key === 'spreads') allSpreads.push(...mkt.outcomes.map(o => ({ ...o, book: bm.title })));
          if (mkt.key === 'totals') allTotals.push(...mkt.outcomes.map(o => ({ ...o, book: bm.title })));
        }
      }

      // Best moneyline: highest price for each team (less negative = better for favorite, more positive = better for dog)
      const bestMoneyline = {};
      for (const o of allMoneylines) {
        if (!bestMoneyline[o.name] || o.price > bestMoneyline[o.name].price) {
          bestMoneyline[o.name] = o;
        }
      }

      // Best spread: highest price (-110 > -115)
      const bestSpread = {};
      for (const o of allSpreads) {
        if (!bestSpread[o.name] || o.price > bestSpread[o.name].price) {
          bestSpread[o.name] = o;
        }
      }

      // Best total over/under
      const bestTotal = {};
      for (const o of allTotals) {
        const key = `${o.name}_${o.point}`;
        if (!bestTotal[key] || o.price > bestTotal[key].price) {
          bestTotal[key] = o;
        }
      }

      // Implied probability to find value
      const toImplied = price => price > 0 ? 100 / (price + 100) : Math.abs(price) / (Math.abs(price) + 100);

      const moneylines = Object.values(bestMoneyline);
      const totalImplied = moneylines.reduce((s, o) => s + toImplied(o.price), 0);
      const withValue = moneylines.map(o => ({
        ...o,
        implied: Math.round(toImplied(o.price) * 100),
        value: Math.round((toImplied(o.price) / totalImplied) * 100),
      }));

      // Recommend the team with implied prob closest to 50% (most value / even match)
      const recommend = withValue.reduce((best, o) => Math.abs(o.implied - 50) < Math.abs(best.implied - 50) ? o : best, withValue[0] || {});

      return {
        id: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        startTime: game.commence_time,
        moneyline: withValue,
        spreads: Object.values(bestSpread),
        totals: Object.values(bestTotal).slice(0, 2),
        recommendedBet: recommend?.name || null,
      };
    });

    res.json({ available: true, games });
  } catch (err) {
    res.status(500).json({ available: false, games: [], error: err.message });
  }
});

// ── Search players by name ───────────────────────────────────
app.get('/api/players/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const url = `${ESPN_SEARCH}?query=${encodeURIComponent(q.trim())}&mode=prefix&limit=15&types=player&leagues=nba`;
    const data = await espnFetch(url);

    const playerGroup = (data.results || []).find(r => r.type === 'player');
    const players = (playerGroup?.contents || [])
      .filter(p => (p.uid || '').includes('l:46') || p.description === 'NBA')
      .map(p => ({
        id: extractAthleteId(p.uid),
        uid: p.uid,
        name: p.displayName,
        team: p.subtitle || 'N/A',
      }))
      .filter(p => p.id);

    res.json(players);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Player profile ───────────────────────────────────────────
app.get('/api/players/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `${ESPN_API}/common/v3/sports/basketball/nba/athletes/${id}`;
    const data = await espnFetch(url);
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
});

// ── Game log + season stats ──────────────────────────────────
app.get('/api/players/:id/gamelog', async (req, res) => {
  try {
    const { id } = req.params;
    const year = Number(req.query.year) || 2025;

    const url = `${ESPN_API}/common/v3/sports/basketball/nba/athletes/${id}/gamelog?season=${year}`;
    const data = await espnFetch(url);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NBA Betting API running on http://localhost:${PORT}`);
  if (!process.env.ODDS_API_KEY) {
    console.log('  ⚠  ODDS_API_KEY not set — game odds disabled. Get a free key at the-odds-api.com');
  }
});

# NBAEdge — Player Betting Analysis

AI-powered NBA player analysis with a dark sports aesthetic. Browse all 30 NBA teams, click any player, and get instant **BET / FADE / NEUTRAL** recommendations driven by recent form, streaks, momentum, and consistency scoring.

**No API key required** for player stats and team data — uses ESPN's public API.

🚀 **Live:** [nba-betting-app-alpha.vercel.app](https://nba-betting-app-alpha.vercel.app)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| API | Vercel Serverless Functions (Node.js) |
| Player/Team Data | ESPN public API (free, no registration) |
| Live Odds | The Odds API (free tier — optional) |

---

## Local Development

**Requirements:** Node.js 18+

### 1. Install

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Run (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173**

---

## Enabling Live Odds (Optional)

Live game odds are powered by [The Odds API](https://the-odds-api.com) — 500 free requests/month, no credit card required.

### Step 1 — Get a free API key

1. Go to [the-odds-api.com](https://the-odds-api.com)
2. Click **Get API Key** — enter your email
3. Copy the key from your dashboard

### Step 2 — Add it to Vercel

1. Open your project at [vercel.com/dashboard](https://vercel.com/dashboard)
2. Go to **Settings → Environment Variables**
3. Add a new variable:
   - **Name:** `ODDS_API_KEY`
   - **Value:** your key from Step 1
   - **Environments:** Production, Preview, Development
4. Click **Save**
5. Redeploy: go to **Deployments → ⋯ → Redeploy**

The odds panel on the home page will activate automatically once the key is present.

### For local dev

Create `backend/.env`:
```env
ODDS_API_KEY=your_key_here
```

---

## Features

### All 30 NBA Teams
Browse every team by logo. Click a team → see the full roster. Click a player → instant analysis.

### Betting Prediction Engine
Every player gets a **BET / FADE / NEUTRAL** badge with a 0–100% confidence score.

| Factor | Effect |
|--------|--------|
| Recent form (last 5 games vs season avg) | ±30 pts |
| Momentum (last 3 vs last 5) | ±15 pts |
| Scoring consistency / variance | ±10 pts |
| Hot / cold streak (last 3 games) | ±8–10 pts |
| Outlier game regression | −5 pts |
| Reduced minutes signal | −8 pts |

Scores ≥ 63 → **BET** (green), ≤ 38 → **FADE** (red), middle → **NEUTRAL** (yellow).

### Green Bet Highlighting
When a player's prediction is **BET**:
- Stat cards trending 15%+ above season average glow green
- Game log rows where pts/reb/ast all meet expectations get a **BET** badge

### Live Game Odds (with API key)
- Best moneyline, spread, and over/under across major sportsbooks
- **BEST BET** badge on the recommended side
- Implied probability shown for each outcome

### Season Averages + Sparklines
PPG, RPG, APG, FG%, 3P%, FT%, MIN, SPG, BPG with mini trend charts.

### Game Log
Last 10 games with color-coded PTS: green = hot, red = cold.

---

## Project Structure

```
nba-betting-app/
├── api/                        # Vercel serverless functions
│   ├── _lib.js                 # Shared ESPN fetch + CORS helpers
│   ├── teams.js                # GET /api/teams
│   ├── teams/[teamId]/roster.js # GET /api/teams/:id/roster
│   ├── players/search.js       # GET /api/players/search
│   ├── players/[id]/profile.js # GET /api/players/:id/profile
│   ├── players/[id]/gamelog.js # GET /api/players/:id/gamelog
│   └── odds.js                 # GET /api/odds (requires ODDS_API_KEY)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TeamGrid.jsx     # 30-team logo grid
│       │   ├── RosterList.jsx   # Team roster browser
│       │   ├── OddsPanel.jsx    # Live game odds
│       │   ├── BettingCard.jsx  # BET/FADE/NEUTRAL badge
│       │   ├── GameLog.jsx      # Per-game table + BET row highlights
│       │   ├── PlayerCard.jsx   # Full player view
│       │   ├── SearchBar.jsx    # Player name search
│       │   ├── Sparkline.jsx    # SVG mini charts
│       │   └── StatsGrid.jsx    # Season averages + green highlights
│       └── utils/
│           ├── api.js           # Fetch helpers
│           ├── espnParser.js    # ESPN response normalizer
│           └── predictionEngine.js # Prediction scoring logic
├── backend/                    # Local dev Express server
└── vercel.json
```

---

> **Disclaimer:** For entertainment purposes only. Not financial advice. Predictions are based on statistical trends and do not guarantee real-world outcomes. Gamble responsibly.

# NBAEdge — Player Betting Analysis

AI-powered NBA player analysis with a dark sports aesthetic. Search any player, get instant BET / FADE / NEUTRAL recommendations driven by recent form, streaks, momentum, and consistency scoring.

**No API key required.** Uses ESPN's public data API — live 2024-25 season stats.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend | Node.js 18+ / Express (API proxy) |
| Data | ESPN public API (free, no registration) |

---

## Quick Start

**Requirements:** Node.js 18 or newer (uses built-in `fetch`).

### 1. Install

```bash
cd nba-betting-app/backend && npm install
cd ../frontend && npm install
```

### 2. Run (two terminals)

**Terminal 1 — Backend:**
```bash
cd nba-betting-app/backend
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd nba-betting-app/frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** and search for any NBA player.

---

## Features

### Player Search
Type any player name — autocomplete results appear with team info. Filters to NBA players only.

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

### Season Averages + Sparklines
PPG, RPG, APG, FG%, 3P%, FT%, MIN, SPG, BPG — each with a mini trend chart from the last 10 games.

### Game Log
Last 10 games: date, home/away, opponent, result/score, and per-game stats.  
PTS cells are color-coded: **green** = 20%+ above season avg, **red** = 20%+ below.

---

## Project Structure

```
nba-betting-app/
├── backend/
│   ├── src/index.js          # Express proxy — 3 ESPN endpoints
│   ├── .env.example          # Optional PORT / FRONTEND_URL overrides
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── BettingCard.jsx   # BET/FADE/NEUTRAL badge + factors
    │   │   ├── GameLog.jsx       # Per-game table
    │   │   ├── PlayerCard.jsx    # Composes all player sections
    │   │   ├── SearchBar.jsx     # Debounced search + keyboard nav
    │   │   ├── Sparkline.jsx     # SVG mini trend charts
    │   │   └── StatsGrid.jsx     # Season averages grid
    │   ├── utils/
    │   │   ├── api.js            # Fetch helpers (search / profile / gamelog)
    │   │   ├── espnParser.js     # Normalizes raw ESPN response
    │   │   └── predictionEngine.js  # Pure prediction logic
    │   ├── App.jsx
    │   ├── index.css            # Dark sports theme (no external CSS lib)
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js           # Proxies /api → backend:3001
    └── package.json
```

---

## Optional Config

Copy `backend/.env.example` to `backend/.env` to change the port or allowed frontend origin:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

> **Disclaimer:** For entertainment purposes only. Not financial advice. Predictions are generated from statistical trends and do not guarantee real-world outcomes. Gamble responsibly.

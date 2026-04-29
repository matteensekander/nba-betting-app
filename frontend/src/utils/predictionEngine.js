function mean(arr) {
  const valid = arr.filter(v => v != null && !isNaN(v) && isFinite(v));
  if (!valid.length) return 0;
  return valid.reduce((s, v) => s + Number(v), 0) / valid.length;
}

function stddev(arr) {
  const m = mean(arr);
  const valid = arr.filter(v => v != null && !isNaN(v) && isFinite(v));
  if (valid.length < 2) return 0;
  return Math.sqrt(valid.reduce((s, v) => s + (Number(v) - m) ** 2, 0) / valid.length);
}

// ESPN game log: min is a number, pts/reb/ast are numbers
function activePlays(games) {
  return games.filter(g => g.min > 5);
}

export function generatePrediction(seasonAverages, recentGames) {
  if (!seasonAverages || !recentGames) return null;

  const active = activePlays(recentGames);
  if (active.length < 3) return null;

  const seasonPPG = Number(seasonAverages.pts) || 0;
  const seasonMPG = Number(seasonAverages.min) || 0;

  const last5 = active.slice(0, 5);
  const last3 = active.slice(0, 3);

  const pts5 = last5.map(g => Number(g.pts) || 0);
  const pts3 = last3.map(g => Number(g.pts) || 0);
  const mins5 = last5.map(g => Number(g.min) || 0);

  const avg5 = mean(pts5);
  const avg3 = mean(pts3);
  const avgMins5 = mean(mins5);

  // ── Scoring components ──────────────────────────────────────

  // 1. Recent form vs season avg (±30)
  const formDelta = seasonPPG > 0 ? (avg5 - seasonPPG) / seasonPPG : 0;
  const formScore = Math.max(-30, Math.min(30, formDelta * 60));

  // 2. Momentum: last 3 vs last 5 (±15)
  const momentumDelta = avg5 > 0 ? (avg3 - avg5) / avg5 : 0;
  const momentumScore = Math.max(-15, Math.min(15, momentumDelta * 30));

  // 3. Consistency: low coefficient of variation is more predictable (±10)
  const cv = avg5 > 0 ? stddev(pts5) / avg5 : 0.5;
  const consistencyScore = Math.max(-10, Math.min(10, (0.4 - cv) * 25));

  // 4. Streak detection
  const isHot = last3.every(g => Number(g.pts) >= seasonPPG * 1.12);
  const isCold = last3.every(g => Number(g.pts) <= seasonPPG * 0.88);
  const streakScore = isHot ? 8 : isCold ? -10 : 0;

  // 5. Outlier regression (blowup game followed by regression)
  const lastPts = Number(active[0]?.pts) || 0;
  const outlierScore = lastPts >= seasonPPG * 1.6 && !isHot ? -5 : 0;

  // 6. Reduced minutes signal
  const minutesScore = seasonMPG > 0 && avgMins5 / seasonMPG < 0.8 ? -8 : 0;

  const raw = 50 + formScore + momentumScore + consistencyScore + streakScore + outlierScore + minutesScore;
  const confidence = Math.max(0, Math.min(100, Math.round(raw)));

  let recommendation;
  if (confidence >= 63) recommendation = 'BET';
  else if (confidence <= 38) recommendation = 'FADE';
  else recommendation = 'NEUTRAL';

  // ── Key factors ─────────────────────────────────────────────
  const factors = [];

  if (Math.abs(formDelta) >= 0.08) {
    const pct = Math.abs(formDelta * 100).toFixed(0);
    const dir = formDelta > 0 ? 'above' : 'below';
    const sign = formDelta > 0 ? '+' : '';
    factors.push({
      type: formDelta > 0 ? 'positive' : 'negative',
      text: `Averaging ${avg5.toFixed(1)} PPG in last ${last5.length} games (${sign}${pct}% ${dir} ${seasonPPG} season avg)`,
    });
  } else {
    factors.push({
      type: 'neutral',
      text: `Recent form on pace with season average (${avg5.toFixed(1)} vs ${seasonPPG} PPG)`,
    });
  }

  if (isHot) {
    factors.push({ type: 'positive', text: 'Hot streak — scored above season avg in each of the last 3 games' });
  } else if (isCold) {
    factors.push({ type: 'negative', text: 'Cold streak — scored below season avg in each of the last 3 games' });
  }

  if (Math.abs(momentumDelta) >= 0.1) {
    const dir = momentumDelta > 0 ? 'upward' : 'downward';
    factors.push({
      type: momentumDelta > 0 ? 'positive' : 'negative',
      text: `Scoring momentum trending ${dir} (last 3 avg: ${avg3.toFixed(1)} vs last 5 avg: ${avg5.toFixed(1)})`,
    });
  }

  if (cv < 0.25) {
    factors.push({ type: 'positive', text: 'Highly consistent scorer — low game-to-game variance' });
  } else if (cv > 0.5) {
    factors.push({ type: 'neutral', text: 'High variance scorer — results can be unpredictable game to game' });
  }

  if (outlierScore < 0) {
    factors.push({
      type: 'negative',
      text: `Possible regression — outlier ${lastPts}-point game most recently`,
    });
  }

  if (minutesScore < 0) {
    factors.push({
      type: 'negative',
      text: `Reduced minutes recently (${avgMins5.toFixed(0)} vs ${seasonMPG.toFixed(0)} season avg) — possible load management`,
    });
  }

  if (factors.length === 0) {
    factors.push({ type: 'neutral', text: 'Performing close to season averages — no strong trend detected' });
  }

  return {
    recommendation,
    confidence,
    factors,
    meta: { avg5: avg5.toFixed(1), avg3: avg3.toFixed(1), seasonPPG },
  };
}

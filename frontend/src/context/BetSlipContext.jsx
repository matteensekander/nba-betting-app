import { createContext, useContext, useState, useMemo } from 'react';

const BetSlipContext = createContext(null);

export function BetSlipProvider({ children }) {
  const [picks, setPicks] = useState([]);

  function addOrTogglePick(pick) {
    setPicks(prev => {
      const key = `${pick.id}-${pick.stat}`;
      const existing = prev.find(p => `${p.id}-${p.stat}` === key);

      if (!existing) {
        return [...prev, pick];
      }
      // Same direction → toggle off
      if (existing.dir === pick.dir) {
        return prev.filter(p => `${p.id}-${p.stat}` !== key);
      }
      // Different direction → switch
      return prev.map(p => (`${p.id}-${p.stat}` === key ? pick : p));
    });
  }

  function removePick(id, stat) {
    setPicks(prev => prev.filter(p => !(p.id === id && p.stat === stat)));
  }

  function clearAll() {
    setPicks([]);
  }

  const parlayOdds = useMemo(() => {
    if (picks.length === 0) return 0;
    const base = picks.reduce((acc, p) => acc * p.multiplier, 1);
    return base * Math.pow(0.92, picks.length - 1);
  }, [picks]);

  const flexOdds = useMemo(() => {
    return parlayOdds * 0.45;
  }, [parlayOdds]);

  const value = {
    picks,
    addOrTogglePick,
    removePick,
    clearAll,
    parlayOdds,
    flexOdds,
  };

  return (
    <BetSlipContext.Provider value={value}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error('useBetSlip must be used within BetSlipProvider');
  return ctx;
}

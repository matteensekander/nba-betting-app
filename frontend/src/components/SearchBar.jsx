import { useState, useEffect, useRef, useCallback } from 'react';

export default function SearchBar({ onSearch, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const players = await onSearch(query);
        setResults(players);
        setOpen(players.length > 0);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, onSearch]);

  const handleSelect = useCallback((player) => {
    setQuery(player.name);
    setOpen(false);
    setResults([]);
    onSelect(player);
  }, [onSelect]);

  function handleKeyDown(e) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) handleSelect(results[activeIdx]);
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-container">
        <div className="search-icon">
          {busy ? <span className="search-spinner" /> : '○'}
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Search NBA player — e.g. LeBron James, Steph Curry..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="search-dropdown" role="listbox">
          {results.map((player, i) => (
            <div
              key={player.id}
              className={`search-result${i === activeIdx ? ' active' : ''}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => handleSelect(player)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="result-name">{player.name}</span>
              <div className="result-meta">
                <span className="result-team">{player.team}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

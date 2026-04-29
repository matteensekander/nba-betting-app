import { useBetSlip } from '../context/BetSlipContext';

export default function FliffHeader({ game }) {
  const { picks } = useBetSlip();

  const gameLabel = game
    ? `${game.away?.abbr || ''} @ ${game.home?.abbr || ''}`
    : 'NBA · Today';

  return (
    <header className="fliff-header">
      <div className="fliff-header-left">
        <div className="fliff-header-jersey">
          {game ? (
            <>
              <img
                className="fliff-header-logo"
                src={game.away?.logo}
                alt={game.away?.abbr}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <img
                className="fliff-header-logo fliff-header-logo--offset"
                src={game.home?.logo}
                alt={game.home?.abbr}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </>
          ) : (
            <span className="fliff-header-ball">🏀</span>
          )}
        </div>
        <span className="fliff-header-game">{gameLabel}</span>
      </div>

      <div className="fliff-header-center">
        <span className="fliff-logo-text">FLIFF</span>
      </div>

      <div className="fliff-header-right">
        {picks.length > 0 && (
          <span className="fliff-pick-count">{picks.length} pick{picks.length !== 1 ? 's' : ''}</span>
        )}
        <span className="fliff-balance">🪙 1,000</span>
      </div>
    </header>
  );
}

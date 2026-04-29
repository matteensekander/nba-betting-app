const NAV_ITEMS = [
  { id: 'sports', icon: '🏀', label: 'Sports' },
  { id: 'picks', icon: '🎯', label: 'My Picks' },
  { id: 'account', icon: '👤', label: 'Account' },
  { id: 'rewards', icon: '🎁', label: 'Rewards' },
  { id: 'cashier', icon: '💰', label: 'Cashier' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${item.id === 'sports' ? 'bottom-nav-item--active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

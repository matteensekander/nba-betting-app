const TABS = [
  { id: 'popular', label: 'Popular' },
  { id: 'h2h', label: 'H2H' },
  { id: 'pts', label: 'Points' },
  { id: 'reb', label: 'Rebounds' },
  { id: 'ast', label: 'Assists' },
  { id: '3pm', label: '3PM' },
];

export default function PropTabBar({ activeTab, onTabChange }) {
  return (
    <div className="prop-tab-bar">
      <div className="prop-tab-scroll">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`prop-tab-btn ${activeTab === tab.id ? 'prop-tab-btn--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

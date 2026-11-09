export type AppTab = 'canvas' | 'generations';

interface IconSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenPricing: () => void;
  onOpenProfile: () => void;
  displayName: string | null;
}

export function IconSidebar({
  activeTab,
  onTabChange,
  onOpenPricing,
  onOpenProfile,
  displayName,
}: IconSidebarProps) {
  return (
    <nav className="icon-sidebar" aria-label="Primary">
      <div className="sidebar-logo-container" style={{ marginBottom: 20 }} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5 9.5 9.75 12 11zm0 2.5l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z" />
        </svg>
      </div>

      <button
        type="button"
        className={`icon-btn ${activeTab === 'canvas' ? 'active' : ''}`}
        onClick={() => onTabChange('canvas')}
        title="Create"
        aria-label="Create"
        aria-current={activeTab === 'canvas' ? 'page' : undefined}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </button>

      <button
        type="button"
        className={`icon-btn ${activeTab === 'generations' ? 'active' : ''}`}
        onClick={() => onTabChange('generations')}
        title="Library"
        aria-label="Library"
        aria-current={activeTab === 'generations' ? 'page' : undefined}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div className="spacer" />

      <button type="button" className="icon-btn" onClick={onOpenPricing} title="Pricing" aria-label="Pricing">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M16 10a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2" />
        </svg>
      </button>

      <button
        type="button"
        className="icon-btn"
        onClick={onOpenProfile}
        title="Profile"
        aria-label={displayName ? `Profile of ${displayName}` : 'Profile'}
      >
        <div
          style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(45deg, #4f46e5, #9333ea)' }}
          aria-hidden="true"
        />
      </button>
    </nav>
  );
}

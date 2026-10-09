import { Link, useLocation } from 'react-router-dom';

const CHEVRON_RIGHT = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={16}
    height={16}
    style={{ marginLeft: 'auto', opacity: 0.6 }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function MainErpSidebar({ filter = '' }: { filter?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const mainErpMenu = [
    {
      section: 'DASHBOARD',
      items: [
        {
          title: 'ERP Dashboard',
          to: '/',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
          active: currentPath === '/' || currentPath === '/dashboard' || currentPath === '/erp-dashboard',
        },
      ],
    },
    {
      section: 'MODULES',
      items: [
        {
          title: 'DLE',
          to: '/dle/dashboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          ),
          hasChevron: true,
          active: currentPath.startsWith('/dle'),
        },
        {
          title: 'Vendor',
          to: '/vendor/dashboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
          hasChevron: true,
          active: currentPath.startsWith('/vendor') || currentPath.startsWith('/assam') || currentPath.startsWith('/jammu') || currentPath.startsWith('/up'),
        },
        {
          title: 'Gallery',
          to: '/apps/gallery',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          ),
          hasChevron: true,
          active: currentPath.startsWith('/apps/gallery') || currentPath.startsWith('/gallery'),
        },
        {
          title: 'Complaints',
          to: '/complaints',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
          hasChevron: true,
          active: currentPath.startsWith('/complaints'),
        },
      ],
    },
    {
      section: 'REPORTS',
      items: [
        {
          title: 'Analytics',
          to: '/reports/analytics',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
          active: currentPath.startsWith('/reports/analytics') || currentPath.startsWith('/dashboards/analytics'),
        },
        {
          title: 'Geo Reports',
          to: '/reports/geo-reports',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          ),
          active: currentPath.startsWith('/reports/geo-reports') || currentPath.startsWith('/maps/leaflet'),
        },
        {
          title: 'Settings',
          to: '/settings',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
          active: currentPath.startsWith('/settings'),
        },
      ],
    },
  ];

  return (
    <>
      {mainErpMenu.map((group) => {
        const visibleItems = group.items.filter((item) =>
          !filter || item.title.toLowerCase().includes(filter.toLowerCase())
        );

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.section} style={{ marginBottom: '12px' }}>
            <p className="ax-sidebar__section" role="presentation">
              {group.section}
            </p>
            {visibleItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className={`ax-nav__item ${item.active ? 'ax-nav__item--active is-active' : ''}`}
                role="treeitem"
                aria-current={item.active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                }}
              >
                <span className="ax-nav__icon">{item.icon}</span>
                <span className="ax-nav__label" style={{ fontWeight: item.active ? 700 : 500 }}>
                  {item.title}
                </span>
                {item.hasChevron && CHEVRON_RIGHT}
              </Link>
            ))}
          </div>
        );
      })}
    </>
  );
}

export default MainErpSidebar;

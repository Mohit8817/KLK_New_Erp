/*
 * KLK Ventures ERP — Universal Dynamic Sidebar
 * Seamlessly switches between Main ERP Navigation and DLE Portal Navigation
 */
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  manifest,
  sections,
  groupsInSection,
  slugFromPath,
  hrefForSlug,
  type NavNode,
} from '../../lib/manifest';
import { Icon } from '../ui/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function Badge({ badge }: { badge: NavNode['badge'] }) {
  if (!badge) return null;
  if (badge.type === 'count')
    return <span className="ax-nav__badge ax-nav__badge--count">{badge.value}</span>;
  if (badge.type === 'Hot') return <span className="ax-nav__badge ax-nav__badge--hot">Hot</span>;
  if (badge.type === 'New') return <span className="ax-nav__badge ax-nav__badge--new">New</span>;
  return null;
}

const CARET = (
  <svg
    className="ax-nav__caret ax-icon--directional"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={20}
    height={20}
    aria-hidden="true"
  >
    <path d="M9 6l6 6l-6 6" />
  </svg>
);

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

interface LeafProps {
  node: NavNode;
  level: number;
  activeSlug: string;
  filter: string;
}

function Leaf({ node, level, activeSlug, filter }: LeafProps) {
  const resolved = manifest.resolve(node)!;
  const isActive = resolved.slug === activeSlug;
  const hidden = filter && !matches(node, filter);
  const cls = ['ax-nav__item'];
  if (level > 1) cls.push('ax-nav__item--child');
  if (isActive) cls.push('ax-nav__item--active', 'is-active');
  if (hidden) cls.push('is-hidden');

  return (
    <Link
      className={cls.join(' ')}
      role="treeitem"
      aria-level={level}
      aria-current={isActive ? 'page' : undefined}
      to={hrefForSlug(resolved.slug)}
      tabIndex={isActive ? 0 : -1}
    >
      {level === 1 ? (
        <Icon name={node.icon} className="ax-nav__icon" />
      ) : (
        <span className="ax-nav__bar" aria-hidden="true"></span>
      )}
      <span className="ax-nav__label">{node.title}</span>
      <Badge badge={node.badge} />
    </Link>
  );
}

interface GroupProps {
  node: NavNode;
  level: number;
  activeSlug: string;
  filter: string;
}

function Group({ node, level, activeSlug, filter }: GroupProps) {
  const children = manifest.childrenOf(node.id).filter((c) => c.inMenu);
  const containsActive = useMemo(
    () => subtreeContainsSlug(node, activeSlug),
    [node, activeSlug],
  );
  const [open, setOpen] = useState(
    containsActive || (level === 1 && (node.section === 'MAIN' || node.section === 'ASSAM' || node.section === 'UP' || node.section?.startsWith('DLE'))),
  );
  const isOpen = filter ? true : open || containsActive;
  const groupHidden = filter && !subtreeMatches(node, filter);

  const parentCls = ['ax-nav__item', 'ax-nav__item--parent'];
  if (level > 1) parentCls.push('ax-nav__item--child');
  if (containsActive) parentCls.push('ax-nav__item--trail');

  return (
    <div
      className={`ax-nav__group${isOpen ? ' is-open' : ''}${groupHidden ? ' is-hidden' : ''}`}
      data-ax-collapse
    >
      <button
        type="button"
        className={parentCls.join(' ')}
        role="treeitem"
        aria-level={level}
        aria-expanded={isOpen}
        data-ax-group={node.id}
        onClick={() => setOpen((o) => !o)}
        tabIndex={containsActive ? 0 : -1}
      >
        {level === 1 && <Icon name={node.icon} className="ax-nav__icon" />}
        <span className="ax-nav__label">{node.title}</span>
        <Badge badge={node.badge} />
        {CARET}
      </button>
      <div
        className="ax-nav__children"
        role="group"
        data-ax-collapse-panel
        hidden={!isOpen}
      >
        {children.map((child) =>
          manifest.childrenOf(child.id).filter((c) => c.inMenu).length > 0 ? (
            <Group
              key={child.id}
              node={child}
              level={level + 1}
              activeSlug={activeSlug}
              filter={filter}
            />
          ) : (
            <Leaf
              key={child.id}
              node={child}
              level={level + 1}
              activeSlug={activeSlug}
              filter={filter}
            />
          ),
        )}
      </div>
    </div>
  );
}

export function Sidebar({ drawerOpen = false }: { drawerOpen?: boolean }) {
  const location = useLocation();
  const activeSlug = slugFromPath(location.pathname);
  const [filter, setFilter] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  useFocusTrap(rootRef, drawerOpen, '.ax-sidebar__filter');

  const isDlePortal = location.pathname.startsWith('/dle');

  // Main ERP menu items matching the screenshot
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
          active: location.pathname === '/' || location.pathname === '/dashboard',
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
          active: location.pathname.startsWith('/dle'),
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
          active: location.pathname.startsWith('/vendor'),
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
          active: location.pathname.startsWith('/apps/gallery') || location.pathname.startsWith('/gallery'),
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
          active: location.pathname.startsWith('/complaints'),
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
          active: location.pathname.startsWith('/reports/analytics') || location.pathname.startsWith('/dashboards/analytics'),
        },
        {
          title: 'Geo Reports',
          to: '/maps/leaflet',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ),
          active: location.pathname.startsWith('/maps'),
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
          active: location.pathname.startsWith('/settings'),
        },
      ],
    },
  ];

  return (
    <aside className="ax-sidebar" role="navigation" aria-label="Primary" ref={rootRef}>
      {/* ===== BRAND ===== */}
      <div className="ax-sidebar__brand">
        <Link className="ax-sidebar__logo" to="/" aria-label="KLK Solar ERP home" style={{ textDecoration: 'none' }}>
          <img
            src="/logo-abbr.png"
            alt="KLK"
            className="ax-sidebar__logo-small"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
          <img
            src="/logo-full.png"
            alt="KLK VENTURES (P) LTD"
            className="ax-sidebar__logo-large"
            style={{ maxHeight: 38, maxWidth: 155, objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* ===== MENU FILTER ===== */}
      <div className="ax-sidebar__search">
        <svg
          className="ax-icon ax-sidebar__search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          width={24}
          height={24}
          aria-hidden="true"
        >
          <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
        </svg>
        <input
          type="search"
          className="ax-sidebar__filter"
          placeholder="Filter menu…"
          aria-label="Filter menu"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setFilter('')}
        />
        {filter && (
          <button
            type="button"
            className="ax-sidebar__filter-clear"
            onClick={() => setFilter('')}
            aria-label="Clear filter"
          >
            <svg
              className="ax-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              width={24}
              height={24}
              aria-hidden="true"
            >
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ===== NAV TREE ===== */}
      <nav className="ax-sidebar__nav" role="tree" aria-label="Main menu">
        {isDlePortal ? (
          <>
            {/* Top Switcher Button to return to Main ERP */}
            <div style={{ padding: '0 8px 12px 8px' }}>
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '12px',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to ERP Dashboard</span>
              </Link>
            </div>

            {/* DLE Manifest Sections */}
            {sections()
              .filter((s) => s.startsWith('DLE'))
              .map((section) => (
                <div key={section}>
                  <p className="ax-sidebar__section" role="presentation">
                    {sectionLabel(section)}
                  </p>
                  {groupsInSection(section)
                    .filter((g) => g.inMenu)
                    .map((g) =>
                      manifest.childrenOf(g.id).some((c) => c.inMenu) ? (
                        <Group
                          key={g.id}
                          node={g}
                          level={1}
                          activeSlug={activeSlug}
                          filter={filter.trim().toLowerCase()}
                        />
                      ) : (
                        <Leaf
                          key={g.id}
                          node={g}
                          level={1}
                          activeSlug={activeSlug}
                          filter={filter.trim().toLowerCase()}
                        />
                      ),
                    )}
                </div>
              ))}
          </>
        ) : (
          /* Main ERP Dashboard Menu */
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
        )}
      </nav>
    </aside>
  );
}

/* ── helpers ── */
function sectionLabel(s: string): string {
  const map: Record<string, string> = {
    MAIN: 'Main',
    ASSAM: 'Assam Operations',
    UP: 'Uttar Pradesh',
    JAMMU: 'Jammu & Kashmir',
    DLE_DASH: 'DLE Dashboard',
    DLE_BIHAR: 'DLE · Bihar',
    DLE_UP: 'DLE · Uttar Pradesh',
    DLE_MGMT: 'DLE Management',
    APPLICATIONS: 'Applications',
    MODULES: 'Modules',
    PAGES: 'Pages',
    'UI & FORMS': 'UI & Forms',
    DOCS: 'Docs',
  };
  return map[s] || s;
}

function matches(node: NavNode, q: string): boolean {
  if (!q) return true;
  return (
    node.title.toLowerCase().includes(q) ||
    (node.keywords || []).some((k) => k.toLowerCase().includes(q))
  );
}
function subtreeMatches(node: NavNode, q: string): boolean {
  if (matches(node, q)) return true;
  return manifest.childrenOf(node.id).some((c) => subtreeMatches(c, q));
}
function subtreeContainsSlug(node: NavNode, slug: string): boolean {
  const kids = manifest.childrenOf(node.id);
  return kids.some((c) => {
    const r = manifest.resolve(c)!;
    if (r.slug === slug) return true;
    return subtreeContainsSlug(c, slug);
  });
}

export default Sidebar;
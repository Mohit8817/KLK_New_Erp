/*
 * Vireo React — Sidebar (manifest-driven nav tree).
 *
 * Renders the reference .ax-sidebar DOM contract from nav-manifest.json:
 * brand → menu filter → role="tree" nav with section headers, L1 parent groups
 * (collapsible) and child leaves. The active leaf (matched against the router
 * path) gets `ax-nav__item--active is-active aria-current="page"`, its ancestor
 * group opens (`is-open`, panel un-hidden), and the parent button gets
 * `ax-nav__item--trail` — exactly as core/nav.js does in the HTML edition.
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
    width={29}
    height={22}
    aria-hidden="true"
  >
    <path d="M9 6l6 6l-6 6" />
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
  if (level > 1) cls.push('ax-nav__item--child'); // level-1 leaf (e.g. DLE Dashboard) looks like a top item
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
    containsActive || (level === 1 && (node.section === 'MAIN' || node.section === 'ASSAM' || node.section === 'UP')),
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
  // While the rail is an open off-canvas drawer it is a modal surface: trap Tab
  // inside it and open on the menu filter (core/sidebar.js openDrawer()).
  useFocusTrap(rootRef, drawerOpen, '.ax-sidebar__filter');

  return (
    <aside className="ax-sidebar" role="navigation" aria-label="Primary" ref={rootRef}>
      {/* ===== BRAND ===== */}
      <div className="ax-sidebar__brand">
        <Link className="ax-sidebar__logo" to="/jammu/dashboard" aria-label="KLK Solar ERP home" style={{ textDecoration: 'none' }}>
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
        {sections().map((section) => (
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
      </nav>
    </aside>
  );
}

/* ── helpers ── */
function sectionLabel(s: string): string {
  // Manifest sections are upper-case; reference renders them title-ish.
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
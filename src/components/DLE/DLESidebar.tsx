import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canAccessSlug } from '../../services/stateAccess';
import './dle-sidebar.css';

interface NavLeaf {
  id: string;
  title: string;
  to: string;
  iconType?: 'assign' | 'view-assign' | 'view-survey' | 'analytics' | 'view-data';
  keywords?: string[];
}

interface NavSubGroup {
  id: string;
  title: string;
  tag?: string;
  children: NavLeaf[];
}

interface NavGroup {
  id: string;
  title: string;
  icon: 'dashboard' | 'amc' | 'installation' | 'management';
  badge?: string;
  children: (NavLeaf | NavSubGroup)[];
}

interface NavSection {
  section: string;
  items: (NavLeaf | NavGroup)[];
}

const DLE_SECTIONS: NavSection[] = [
  {
    section: 'DLE DASHBOARD',
    items: [
      {
        id: 'dle.dashboard',
        title: 'Dashboard',
        to: '/dle/dashboard',
        iconType: 'analytics',
        keywords: ['dle', 'dashboard', 'overview'],
      },
    ],
  },
  {
    section: 'DLE · BIHAR',
    items: [
      {
        id: 'grp.dle.bihar.amc',
        title: 'AMC Maintenance',
        icon: 'amc',
        children: [
          {
            id: 'grp.dle.bihar.amc.ssl',
            title: 'SSL Lights',
            tag: 'SSL',
            children: [
              { id: 'dle.bihar.ssl.amc.assign', title: 'Assign Light', to: '/dle/bihar/ssl/amc/create-assign-light', iconType: 'assign' },
              { id: 'dle.bihar.ssl.amc.view-assign', title: 'View Assign Light', to: '/dle/bihar/ssl/amc/view-assign-light', iconType: 'view-assign' },
              { id: 'dle.bihar.ssl.amc.view-survey', title: 'View Survey Light', to: '/dle/bihar/ssl/amc/view-verify-light', iconType: 'view-survey' },
            ],
          },
        ],
      },
      {
        id: 'grp.dle.bihar.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.dle.bihar.inst.ula',
            title: 'ULA Lights',
            tag: 'ULA',
            children: [
              { id: 'dle.bihar.ula.inst.dashboard', title: 'Dashboard', to: '/dle/bihar/ula/installation/dashboard', iconType: 'analytics' },
              { id: 'dle.bihar.ula.inst.view', title: 'View Data', to: '/dle/bihar/ula/installation/view', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },
  {
    section: 'DLE · UTTAR PRADESH',
    items: [
      {
        id: 'grp.dle.up.amc',
        title: 'AMC Maintenance',
        icon: 'amc',
        children: [
          {
            id: 'grp.dle.up.amc.ssl',
            title: 'SSL Lights',
            tag: 'SSL',
            children: [
              { id: 'dle.up.ssl.amc.assign', title: 'Assign Lights', to: '/dle/up/ssl/amc/create-assign-light', iconType: 'assign' },
              { id: 'dle.up.ssl.amc.view-assign', title: 'View Assign Light', to: '/dle/up/ssl/amc/view-assign-light', iconType: 'view-assign' },
              { id: 'dle.up.ssl.amc.view-survey', title: 'View Survey Light', to: '/dle/up/ssl/amc/view-verify-light', iconType: 'view-survey' },
            ],
          },
        ],
      },
    ],
  },
  {
    section: 'DLE MANAGEMENT',
    items: [
      {
        id: 'grp.dle.mgmt',
        title: 'User Management',
        icon: 'management',
        children: [
          { id: 'dle.users', title: 'View Data', to: '/dle/users', iconType: 'view-data' },
        ],
      },
    ],
  },
];

function GroupIconBox({ icon }: { icon: 'dashboard' | 'amc' | 'installation' | 'management' }) {
  switch (icon) {
    case 'dashboard':
      return (
        <div className="dle-sb__icon-box dle-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
      );
    case 'amc':
      return (
        <div className="dle-sb__icon-box dle-sb__icon-box--amc">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      );
    case 'installation':
      return (
        <div className="dle-sb__icon-box dle-sb__icon-box--installation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      );
    case 'management':
      return (
        <div className="dle-sb__icon-box dle-sb__icon-box--management">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      );
  }
}

function LeafIcon({ type }: { type?: NavLeaf['iconType'] }) {
  switch (type) {
    case 'assign':
      return (
        <svg className="dle-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'view-assign':
      return (
        <svg className="dle-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case 'view-survey':
      return (
        <svg className="dle-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'analytics':
      return (
        <svg className="dle-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'view-data':
    default:
      return (
        <svg className="dle-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

export function DLESidebar({ filter = '' }: { filter?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isLeafActive = (to: string) => currentPath === to;
  const isAllowed = (to: string) => canAccessSlug(to.replace(/^\//, ''));

  return (
    <div className="dle-sidebar">
      {/* ── Top Portal Switcher Card ── */}
      <div className="dle-sb__top-card">
        <div className="dle-sb__portal-info">
          <div className="dle-sb__portal-badge-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M6.34 17.66l-1.41 1.41" />
              <path d="M19.07 4.93l-1.41 1.41" />
            </svg>
          </div>
          <div className="dle-sb__portal-text">
            <span className="dle-sb__portal-title">
              DLE Portal
              <span className="dle-sb__live-dot" title="Live DLE Mode" />
            </span>
            <span className="dle-sb__portal-sub">Solar Street Lights</span>
          </div>
        </div>

        <Link to="/" className="dle-sb__back-btn" title="Back to Main ERP Dashboard">
          <span>← Back to ERP</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Navigation Sections ── */}
      {DLE_SECTIONS.map((sec) => {
        const renderedItems = sec.items
          .map((item) => {
            // 1. Direct Leaf (Dashboard Button with Clean Badge)
            if ('to' in item) {
              if (!isAllowed(item.to)) return null;
              if (filter && !item.title.toLowerCase().includes(filter.toLowerCase())) return null;
              const active = isLeafActive(item.to);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`dle-sb__item-link dle-sb__item-link--dashboard ${active ? 'is-active' : ''}`}
                >
                  <GroupIconBox icon="dashboard" />
                  <span className="dle-sb__label">{item.title}</span>
                  <span className="dle-sb__badge-pill">Overview</span>
                </Link>
              );
            }

            // 2. Group / Nested
            return (
              <DLEGroupItem key={item.id} group={item} currentPath={currentPath} filter={filter} />
            );
          })
          .filter(Boolean);

        if (!renderedItems.length) return null;

        return (
          <div key={sec.section} className="dle-sb__group">
            <div className="dle-sb__section">
              <span className="dle-sb__section-title">{sec.section}</span>
            </div>
            {renderedItems}
          </div>
        );
      })}
    </div>
  );
}

function DLEGroupItem({
  group,
  currentPath,
  filter,
}: {
  group: NavGroup;
  currentPath: string;
  filter: string;
}) {
  const isLeafActive = (to: string) => currentPath === to;
  const isSubGroupActive = (sg: NavSubGroup) =>
    sg.children.some((c) => isLeafActive(c.to));
  const hasActiveChild = group.children.some((c) =>
    'to' in c ? isLeafActive(c.to) : isSubGroupActive(c)
  );

  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open;

  return (
    <div className="dle-sb__group">
      <button
        type="button"
        className={`dle-sb__item-btn dle-sb__item-btn--group ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <GroupIconBox icon={group.icon} />
        <span className="dle-sb__label">{group.title}</span>
        <svg
          className={`dle-sb__caret ${isOpen ? 'is-open' : ''}`}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Smooth CSS Grid Accordion Collapse */}
      <div className={`dle-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="dle-sb__collapse-inner">
          <div className="dle-sb__children-tree">
            {group.children.map((child) => {
              if ('to' in child) {
                if (!canAccessSlug(child.to.replace(/^\//, ''))) return null;
                if (filter && !child.title.toLowerCase().includes(filter.toLowerCase())) return null;
                const cActive = isLeafActive(child.to);
                return (
                  <Link
                    key={child.id}
                    to={child.to}
                    className={`dle-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                  >
                    <LeafIcon type={child.iconType} />
                    <span className="dle-sb__label">{child.title}</span>
                  </Link>
                );
              }

              // SubGroup (e.g. SSL, ULA)
              return (
                <DLESubGroupItem
                  key={child.id}
                  subGroup={child}
                  currentPath={currentPath}
                  filter={filter}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DLESubGroupItem({
  subGroup,
  currentPath,
  filter,
}: {
  subGroup: NavSubGroup;
  currentPath: string;
  filter: string;
}) {
  const isLeafActive = (to: string) => currentPath === to;
  const hasActiveChild = subGroup.children.some((c) => isLeafActive(c.to));

  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open || hasActiveChild;

  const visibleChildren = subGroup.children.filter((c) => {
    if (!canAccessSlug(c.to.replace(/^\//, ''))) return false;
    if (filter && !c.title.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  if (!visibleChildren.length) return null;

  return (
    <div style={{ margin: '2px 0' }}>
      <button
        type="button"
        className={`dle-sb__item-btn dle-sb__subgroup-btn ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dle-sb__label">{subGroup.title}</span>
        {subGroup.tag && <span className="dle-sb__subgroup-tag">{subGroup.tag}</span>}
        <svg
          className={`dle-sb__caret dle-sb__caret-right ${isOpen ? 'is-open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Smooth CSS Grid Accordion Collapse for Subgroup */}
      <div className={`dle-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="dle-sb__collapse-inner">
          <div className="dle-sb__sub-tree">
            {visibleChildren.map((c) => {
              const cActive = isLeafActive(c.to);
              return (
                <Link
                  key={c.id}
                  to={c.to}
                  className={`dle-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                >
                  <LeafIcon type={c.iconType} />
                  <span className="dle-sb__label">{c.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DLESidebar;




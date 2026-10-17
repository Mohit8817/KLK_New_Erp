import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canAccessSlug, canAccessState } from '../../services/stateAccess';
import './v-portal-sidebar.css';

interface VPortalItem {
  title: string;
  to: string;
  iconType?: 'survey' | 'install' | 'amc' | 'expense' | 'complaint' | 'view';
}

interface VPortalSubGroup {
  id: string;
  title: string;
  icon: 'survey' | 'installation' | 'expenses' | 'amc' | 'complaints';
  items: VPortalItem[];
}

interface VPortalSection {
  section: string;
  state?: string;
  groups: VPortalSubGroup[];
}

const V_PORTAL_NAVIGATION: VPortalSection[] = [
  {
    section: 'Assam Operations',
    state: 'assam',
    groups: [
      {
        id: 'assam.installation',
        title: 'Installation (SWP)',
        icon: 'installation',
        items: [
          { title: 'SWP Dashboard', to: '/assam/swp/dashboard', iconType: 'view' },
          { title: 'Installation Request', to: '/assam/swp/installation-request', iconType: 'install' },
          { title: 'Installation Site', to: '/assam/swp/installation-site', iconType: 'install' },
          { title: 'View Installation', to: '/assam/swp/view-installation', iconType: 'view' },
          { title: 'View Payment', to: '/assam/swp/view-payment', iconType: 'expense' },
        ],
      },
    ],
  },
  {
    section: 'Jammu & Kashmir',
    state: 'jammu',
    groups: [
      {
        id: 'jammu.survey',
        title: 'Survey Operations',
        icon: 'survey',
        items: [
          { title: 'Assign Survey (Resco)', to: '/jammu/survey/resco/assign-survey', iconType: 'survey' },
          { title: 'Pending Survey (Resco)', to: '/jammu/survey/resco/pending-survey', iconType: 'survey' },
          { title: 'View Survey (Resco)', to: '/jammu/survey/resco/view-survey', iconType: 'view' },
          { title: 'Add 70MW SRT', to: '/jammu/survey/srt-70mw/add-srt', iconType: 'survey' },
          { title: 'View 70MW SRT', to: '/jammu/survey/srt-70mw/view-data', iconType: 'view' },
        ],
      },
      {
        id: 'jammu.installation',
        title: 'Installation System',
        icon: 'installation',
        items: [
          { title: '70MW SRT Dashboard', to: '/jammu/installation/srt-70mw/dashboard', iconType: 'view' },
          { title: 'Assign Site (70MW)', to: '/jammu/installation/srt-70mw/assign-site', iconType: 'install' },
          { title: 'Install Site (70MW)', to: '/jammu/installation/srt-70mw/install-sites', iconType: 'install' },
          { title: 'Installation Details (70MW)', to: '/jammu/installation/srt-70mw/installation-details', iconType: 'view' },
          { title: 'Claim Request (70MW)', to: '/jammu/installation/srt-70mw/claim-request', iconType: 'expense' },
          { title: 'Resco Dashboard', to: '/jammu/installation/resco/dashboard', iconType: 'view' },
          { title: 'SSL Dashboard', to: '/jammu/installation/ssl/dashboard', iconType: 'view' },
          { title: 'SWP Dashboard', to: '/jammu/installation/swp/dashboard', iconType: 'view' },
        ],
      },
      {
        id: 'jammu.expenses',
        title: 'Installation Expenses',
        icon: 'expenses',
        items: [
          { title: 'Request Expenses (70MW)', to: '/jammu/installation-expenses/srt-70mw/request-expenses', iconType: 'expense' },
          { title: 'View Expenses (70MW)', to: '/jammu/installation-expenses/srt-70mw/view-expenses', iconType: 'view' },
          { title: 'View Payments (70MW)', to: '/jammu/installation-expenses/srt-70mw/view-payments', iconType: 'expense' },
        ],
      },
      {
        id: 'jammu.amc',
        title: 'AMC Maintenance',
        icon: 'amc',
        items: [
          { title: 'Assign Survey (Resco)', to: '/jammu/amc/resco/assign-survey', iconType: 'amc' },
          { title: 'Pending Survey (Resco)', to: '/jammu/amc/resco/pending-survey', iconType: 'amc' },
          { title: 'View Survey (Resco)', to: '/jammu/amc/resco/view-survey', iconType: 'view' },
          { title: 'View Assign Light (SSL)', to: '/jammu/amc/ssl/view-assign-amc', iconType: 'amc' },
        ],
      },
    ],
  },
  {
    section: 'Uttar Pradesh',
    state: 'up',
    groups: [
      {
        id: 'up.survey',
        title: 'Survey Operations',
        icon: 'survey',
        items: [
          { title: 'Assigned Survey (Resco)', to: '/up/survey/resco/assigned-survey', iconType: 'survey' },
          { title: 'Add Resco', to: '/up/survey/resco/add-resco', iconType: 'survey' },
          { title: 'View Resco', to: '/up/survey/resco/view-resco', iconType: 'view' },
          { title: 'Survey (SSL)', to: '/up/survey/ssl/survey', iconType: 'survey' },
          { title: 'View Data (SSL)', to: '/up/survey/ssl/view-data', iconType: 'view' },
        ],
      },
      {
        id: 'up.installation',
        title: 'Installation System',
        icon: 'installation',
        items: [
          { title: 'Resco Dashboard', to: '/up/installation/resco/dashboard', iconType: 'view' },
          { title: 'SSL Dashboard', to: '/up/installation/ssl/dashboard', iconType: 'view' },
          { title: 'Kusum C Dashboard', to: '/up/installation/kusum-c/dashboard', iconType: 'view' },
        ],
      },
      {
        id: 'up.amc',
        title: 'AMC Maintenance',
        icon: 'amc',
        items: [
          { title: 'View Assign Site (Resco)', to: '/up/amc/resco/view-assign-site', iconType: 'amc' },
          { title: 'View Assign AMC (Kusum C)', to: '/up/amc/kusum-c/view-assign-amc', iconType: 'amc' },
          { title: 'View Assign Light (SSL)', to: '/up/amc/ssl/view-assign-light', iconType: 'amc' },
          { title: 'View Assign Light (SSL 18W)', to: '/up/amc/ssl-18w/view-assign-light', iconType: 'amc' },
        ],
      },
      {
        id: 'up.complaint',
        title: 'Complaints & Claims',
        icon: 'complaints',
        items: [
          { title: 'Add Complaint (Resco)', to: '/up/complaint/resco/add-complaint', iconType: 'complaint' },
          { title: 'View Complaint (Resco)', to: '/up/complaint/resco/view-complaint', iconType: 'view' },
          { title: 'Add Complaint (SSL)', to: '/up/complaint/ssl/add-complaint', iconType: 'complaint' },
          { title: 'View Complaint (SSL)', to: '/up/complaint/ssl/view-complaint', iconType: 'view' },
          { title: 'Add Complaint (Kusum C)', to: '/up/complaint/kusum-c/add-complaint', iconType: 'complaint' },
          { title: 'Add Complaint (SRLM SRT)', to: '/up/complaint/srlmsrt/add-complaint', iconType: 'complaint' },
        ],
      },
    ],
  },
];

function VPIconBox({ icon }: { icon: 'survey' | 'installation' | 'expenses' | 'amc' | 'complaints' | 'dashboard' }) {
  switch (icon) {
    case 'dashboard':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
      );
    case 'survey':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--survey">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        </div>
      );
    case 'installation':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--installation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      );
    case 'expenses':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--expenses">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      );
    case 'amc':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--amc">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      );
    case 'complaints':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--complaints">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      );
  }
}

function VPLeafIcon({ type }: { type?: VPortalItem['iconType'] }) {
  switch (type) {
    case 'survey':
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      );
    case 'install':
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'expense':
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'amc':
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'complaint':
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'view':
    default:
      return (
        <svg className="vp-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

export function VPortalSidebar({
  filter = '',
  onNavigate,
}: {
  filter?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isDashboardActive =
    currentPath === '/v-dashboard' ||
    currentPath === '/vendor/dashboard' ||
    currentPath === '/vendor' ||
    currentPath === '/v-portal';

  return (
    <div className="vp-sidebar">
      {/* ── Top Portal Switcher Card ── */}
      {/* <div className="vp-sb__top-card">
        <div className="vp-sb__portal-info">
          <div className="vp-sb__portal-badge-icon" title="V-Portal (Vendor Operations)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="vp-sb__portal-text">
            <span className="vp-sb__portal-title">
              V-Portal
              <span className="vp-sb__live-dot" title="Vendor Mode Active" />
            </span>
            <span className="vp-sb__portal-sub">Vendor Operations</span>
          </div>
        </div>

        <Link
          to="/"
          className="vp-sb__back-btn"
          title="Back to Main ERP Dashboard"
          onClick={onNavigate}
        >
          <span className="vp-sb__back-btn-text">← Back to ERP</span>
          <svg className="vp-sb__back-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div> */}

      {/* ── Primary V-Portal Dashboard Link ── */}
      <div className="vp-sb__item-wrapper" style={{ marginBottom: 8 }}>
        <Link
          to="/v-dashboard"
          className={`vp-sb__item-link vp-sb__item-link--dashboard ${isDashboardActive ? 'is-active' : ''}`}
          onClick={onNavigate}
          title="V-Portal Dashboard"
          data-tooltip="V-Portal Dashboard"
        >
          <VPIconBox icon="dashboard" />
          <span className="vp-sb__label">V-Dashboard</span>
          <span className="vp-sb__badge-pill">Overview</span>
        </Link>
      </div>

      {/* ── State Navigation Sections ── */}
      {V_PORTAL_NAVIGATION.map((sec) => {
        if (sec.state && !canAccessState(sec.state)) {
          return null;
        }

        const renderedGroups = sec.groups
          .map((group) => {
            const matchingItems = group.items.filter(
              (item) =>
                canAccessSlug(item.to.replace(/^\//, '')) &&
                (!filter || item.title.toLowerCase().includes(filter.toLowerCase()))
            );

            if (!matchingItems.length) return null;

            return (
              <VPortalGroupItem
                key={group.id}
                group={{ ...group, items: matchingItems }}
                currentPath={currentPath}
                filter={filter}
                onNavigate={onNavigate}
              />
            );
          })
          .filter(Boolean);

        if (!renderedGroups.length) return null;

        return (
          <div key={sec.section} className="vp-sb__section-group">
            <div className="vp-sb__section">
              <span className="vp-sb__section-title">{sec.section}</span>
            </div>
            {renderedGroups}
          </div>
        );
      })}
    </div>
  );
}

function VPortalGroupItem({
  group,
  currentPath,
  filter,
  onNavigate,
}: {
  group: VPortalSubGroup;
  currentPath: string;
  filter: string;
  onNavigate?: () => void;
}) {
  const isItemActive = (to: string) => currentPath === to;
  const hasActiveChild = group.items.some((item) => isItemActive(item.to));

  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open || hasActiveChild;

  return (
    <div className="vp-sb__group">
      <button
        type="button"
        className={`vp-sb__item-btn vp-sb__item-btn--group ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={group.title}
        data-tooltip={group.title}
      >
        <VPIconBox icon={group.icon} />
        <span className="vp-sb__label">{group.title}</span>
        <svg
          className={`vp-sb__caret ${isOpen ? 'is-open' : ''}`}
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

      {/* ── Collapsed Flyout Popover (Active only when rail is collapsed) ── */}
      <div className="vp-sb__flyout" role="menu" aria-label={group.title}>
        <div className="vp-sb__flyout-header">
          <span className="vp-sb__flyout-title">{group.title}</span>
        </div>
        <div className="vp-sb__flyout-list">
          {group.items.map((item) => {
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`vp-sb__flyout-link ${active ? 'is-active' : ''}`}
                onClick={onNavigate}
              >
                <VPLeafIcon type={item.iconType} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Smooth CSS Grid Accordion Collapse for Expanded/Mobile view ── */}
      <div className={`vp-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vp-sb__collapse-inner">
          <div className="vp-sb__children-tree">
            {group.items.map((item) => {
              const itemActive = isItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`vp-sb__leaf-link ${itemActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <VPLeafIcon type={item.iconType} />
                  <span className="vp-sb__label">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPortalSidebar;

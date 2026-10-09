import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface VPortalItem {
  title: string;
  to: string;
}

interface VPortalSubGroup {
  id: string;
  title: string;
  items: VPortalItem[];
}

interface VPortalSection {
  section: string;
  groups: VPortalSubGroup[];
}

const V_PORTAL_NAVIGATION: VPortalSection[] = [
  {
    section: 'Assam Operations',
    groups: [
      {
        id: 'assam.installation',
        title: 'Installation (SWP)',
        items: [
          { title: 'SWP Dashboard', to: '/assam/swp/dashboard' },
          { title: 'Installation Request', to: '/assam/swp/installation-request' },
          { title: 'Installation Site', to: '/assam/swp/installation-site' },
          { title: 'View Installation', to: '/assam/swp/view-installation' },
          { title: 'View Payment', to: '/assam/swp/view-payment' },
        ],
      },
    ],
  },
  {
    section: 'Jammu & Kashmir',
    groups: [
      {
        id: 'jammu.survey',
        title: 'Survey',
        items: [
          { title: 'Assign Survey (Resco)', to: '/jammu/survey/resco/assign-survey' },
          { title: 'Pending Survey (Resco)', to: '/jammu/survey/resco/pending-survey' },
          { title: 'View Survey (Resco)', to: '/jammu/survey/resco/view-survey' },
          { title: 'Add 70MW SRT', to: '/jammu/survey/srt-70mw/add-srt' },
          { title: 'View 70MW SRT', to: '/jammu/survey/srt-70mw/view-data' },
        ],
      },
      {
        id: 'jammu.installation',
        title: 'Installation',
        items: [
          { title: '70MW SRT Dashboard', to: '/jammu/installation/srt-70mw/dashboard' },
          { title: 'Assign Site (70MW)', to: '/jammu/installation/srt-70mw/assign-site' },
          { title: 'Install Site (70MW)', to: '/jammu/installation/srt-70mw/install-sites' },
          { title: 'Installation Details (70MW)', to: '/jammu/installation/srt-70mw/installation-details' },
          { title: 'Claim Request (70MW)', to: '/jammu/installation/srt-70mw/claim-request' },
          { title: 'Resco Dashboard', to: '/jammu/installation/resco/dashboard' },
          { title: 'SSL Dashboard', to: '/jammu/installation/ssl/dashboard' },
          { title: 'SWP Dashboard', to: '/jammu/installation/swp/dashboard' },
        ],
      },
      {
        id: 'jammu.expenses',
        title: 'Installation Expenses',
        items: [
          { title: 'Request Expenses (70MW)', to: '/jammu/installation-expenses/srt-70mw/request-expenses' },
          { title: 'View Expenses (70MW)', to: '/jammu/installation-expenses/srt-70mw/view-expenses' },
          { title: 'View Payments (70MW)', to: '/jammu/installation-expenses/srt-70mw/view-payments' },
        ],
      },
      {
        id: 'jammu.amc',
        title: 'AMC',
        items: [
          { title: 'Assign Survey (Resco)', to: '/jammu/amc/resco/assign-survey' },
          { title: 'Pending Survey (Resco)', to: '/jammu/amc/resco/pending-survey' },
          { title: 'View Survey (Resco)', to: '/jammu/amc/resco/view-survey' },
          { title: 'View Assign Light (SSL)', to: '/jammu/amc/ssl/view-assign-amc' },
        ],
      },
    ],
  },
  {
    section: 'Uttar Pradesh',
    groups: [
      {
        id: 'up.survey',
        title: 'Survey',
        items: [
          { title: 'Assigned Survey (Resco)', to: '/up/survey/resco/assigned-survey' },
          { title: 'Add Resco', to: '/up/survey/resco/add-resco' },
          { title: 'View Resco', to: '/up/survey/resco/view-resco' },
          { title: 'Survey (SSL)', to: '/up/survey/ssl/survey' },
          { title: 'View Data (SSL)', to: '/up/survey/ssl/view-data' },
        ],
      },
      {
        id: 'up.installation',
        title: 'Installation',
        items: [
          { title: 'Resco Dashboard', to: '/up/installation/resco/dashboard' },
          { title: 'SSL Dashboard', to: '/up/installation/ssl/dashboard' },
          { title: 'Kusum C Dashboard', to: '/up/installation/kusum-c/dashboard' },
        ],
      },
      {
        id: 'up.amc',
        title: 'AMC',
        items: [
          { title: 'View Assign Site (Resco)', to: '/up/amc/resco/view-assign-site' },
          { title: 'View Assign AMC (Kusum C)', to: '/up/amc/kusum-c/view-assign-amc' },
          { title: 'View Assign Light (SSL)', to: '/up/amc/ssl/view-assign-light' },
          { title: 'View Assign Light (SSL 18W)', to: '/up/amc/ssl-18w/view-assign-light' },
        ],
      },
      {
        id: 'up.complaint',
        title: 'Complaints',
        items: [
          { title: 'Add Complaint (Resco)', to: '/up/complaint/resco/add-complaint' },
          { title: 'View Complaint (Resco)', to: '/up/complaint/resco/view-complaint' },
          { title: 'Add Complaint (SSL)', to: '/up/complaint/ssl/add-complaint' },
          { title: 'View Complaint (SSL)', to: '/up/complaint/ssl/view-complaint' },
          { title: 'Add Complaint (Kusum C)', to: '/up/complaint/kusum-c/add-complaint' },
          { title: 'Add Complaint (SRLM SRT)', to: '/up/complaint/srlmsrt/add-complaint' },
        ],
      },
    ],
  },
];

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

export function VPortalSidebar({ filter = '' }: { filter?: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
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

      {/* Main Vendor Dashboard Direct Link */}
      <div style={{ marginBottom: 12 }}>
        <p className="ax-sidebar__section" role="presentation">
          Vendor Portal
        </p>
        <Link
          to="/vendor/dashboard"
          className={`ax-nav__item ${currentPath === '/vendor/dashboard' || currentPath === '/vendor' ? 'ax-nav__item--active is-active' : ''}`}
          role="treeitem"
        >
          <span className="ax-nav__bar" aria-hidden="true" />
          <span className="ax-nav__label" style={{ fontWeight: 600 }}>Vendor Dashboard</span>
        </Link>
      </div>

      {V_PORTAL_NAVIGATION.map((sec) => {
        const renderedGroups = sec.groups.map((group) => {
          const matchingItems = group.items.filter((item) =>
            !filter || item.title.toLowerCase().includes(filter.toLowerCase())
          );

          if (!matchingItems.length) return null;

          return (
            <VPortalGroupItem
              key={group.id}
              group={{ ...group, items: matchingItems }}
              currentPath={currentPath}
              filter={filter}
            />
          );
        }).filter(Boolean);

        if (!renderedGroups.length) return null;

        return (
          <div key={sec.section} style={{ marginBottom: 10 }}>
            <p className="ax-sidebar__section" role="presentation">
              {sec.section}
            </p>
            {renderedGroups}
          </div>
        );
      })}
    </>
  );
}

function VPortalGroupItem({
  group,
  currentPath,
  filter,
}: {
  group: VPortalSubGroup;
  currentPath: string;
  filter: string;
}) {
  const isItemActive = (to: string) => currentPath === to;
  const active = group.items.some((item) => isItemActive(item.to));
  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open;

  return (
    <div className={`ax-nav__group${isOpen ? ' is-open' : ''}`} data-ax-collapse>
      <button
        type="button"
        className={`ax-nav__item ax-nav__item--parent ${active ? 'ax-nav__item--trail' : ''}`}
        role="treeitem"
        aria-expanded={isOpen}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ax-nav__label">{group.title}</span>
        {CARET}
      </button>

      <div className="ax-nav__children" role="group" data-ax-collapse-panel hidden={!isOpen}>
        {group.items.map((item) => {
          const itemActive = isItemActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`ax-nav__item ax-nav__item--child ${itemActive ? 'ax-nav__item--active is-active' : ''}`}
              role="treeitem"
              aria-current={itemActive ? 'page' : undefined}
            >
              <span className="ax-nav__bar" aria-hidden="true" />
              <span className="ax-nav__label">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default VPortalSidebar;

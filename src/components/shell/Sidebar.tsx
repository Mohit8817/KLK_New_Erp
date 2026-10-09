/*
 * KLK Ventures ERP — Universal Dynamic Sidebar Host
 * Delegates to dedicated, isolated sidebars per portal:
 * - DLE Portal: <DLESidebar /> (src/components/DLE/DLESidebar.tsx)
 * - V-Portal: <VPortalSidebar /> (src/components/V-Portal/VPortalSidebar.tsx)
 * - Main ERP: <MainErpSidebar /> (src/components/shell/MainErpSidebar.tsx)
 */
import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { DLESidebar } from '../DLE/DLESidebar';
import { VPortalSidebar } from '../V-Portal/VPortalSidebar';
import { MainErpSidebar } from './MainErpSidebar';

export function Sidebar({ drawerOpen = false }: { drawerOpen?: boolean }) {
  const location = useLocation();
  const [filter, setFilter] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  useFocusTrap(rootRef, drawerOpen, '.ax-sidebar__filter');

  const pathname = location.pathname;
  const isDlePortal = pathname.startsWith('/dle');
  const isVPortal =
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/v-portal') ||
    pathname.startsWith('/assam') ||
    pathname.startsWith('/jammu') ||
    pathname.startsWith('/up');

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
          <DLESidebar filter={filter} />
        ) : isVPortal ? (
          <VPortalSidebar filter={filter} />
        ) : (
          <MainErpSidebar filter={filter} />
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
/*
 * KLK Ventures ERP — Universal Dynamic Sidebar Host
 * Delegates to dedicated, isolated sidebars per portal:
 * - DLE Portal: <DLESidebar /> (src/components/DLE/DLESidebar.tsx)
 * - V-Portal: <VPortalSidebar /> (src/components/V-Portal/VPortalSidebar.tsx)
 * - Main ERP: <MainErpSidebar /> (src/components/shell/MainErpSidebar.tsx)
 */
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../context/AuthContext';
import { DLESidebar } from '../DLE/DLESidebar';
import { VPortalSidebar } from '../V-Portal/VPortalSidebar';
import { MainErpSidebar } from './MainErpSidebar';

export function Sidebar({ drawerOpen = false }: { drawerOpen?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  useFocusTrap(rootRef, drawerOpen, '.ax-sidebar__filter');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

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

      {/* ===== SIDEBAR FOOTER (LOGOUT) ===== */}
      <div
        className="ax-sidebar__footer"
        style={{
          padding: 'var(--ax-space-3) var(--ax-space-4)',
          borderTop: '1px solid var(--ax-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ax-space-2)',
          background: '#fff',
          marginTop: 'auto',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--ax-accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ax-text-strong)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'Administrator'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ax-text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email || user?.role || 'Operations'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of ERP"
          aria-label="Log out"
          style={{
            width: 34,
            height: 34,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--ax-radius-md)',
            border: '1px solid var(--ax-border)',
            background: 'var(--ax-surface)',
            color: 'var(--ax-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--ax-surface-hover, rgba(255, 255, 255, 0.1))';
            e.currentTarget.style.color = 'var(--ax-text-strong)';
            e.currentTarget.style.borderColor = 'var(--ax-border-strong, var(--ax-border))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--ax-surface)';
            e.currentTarget.style.color = 'var(--ax-text-muted)';
            e.currentTarget.style.borderColor = 'var(--ax-border)';
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
            <path d="M9 12h12l-3-3" />
            <path d="M18 15l3-3" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
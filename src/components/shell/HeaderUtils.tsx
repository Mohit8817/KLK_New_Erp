import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../ui/Dropdown';
import { useCustomizer } from '../../context/CustomizerContext';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const ICON = {
  bell: (
    <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
  ),
  cog: (
    <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M6 4v4" /><path d="M6 12v8" /><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12 4v10" /><path d="M12 18v2" /><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M18 4v1" /><path d="M18 9v11" /></svg>
  ),
  check: (
    <svg className="ax-dropdown__check ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
  ),
  dots: (
    <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
  ),
  expandLead: (
    <svg className="ax-icon ax-dropdown__lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>
  ),
  cogLead: (
    <svg className="ax-icon ax-dropdown__lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M6 4v4" /><path d="M6 12v8" /><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12 4v10" /><path d="M12 18v2" /><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M18 4v1" /><path d="M18 9v11" /></svg>
  ),
};

const SHED_LG = ['lang', 'fullscreen'];
const SHED_MD = ['customizer'];

function useShed(): string[] {
  const belowLg = useMediaQuery('(max-width: 991.98px)');
  const belowMd = useMediaQuery('(max-width: 767.98px)');
  return [...(belowLg ? SHED_LG : []), ...(belowMd ? SHED_MD : [])];
}

export function HeaderUtils({ onCustomizer }: { onCustomizer: () => void }) {
  const c = useCustomizer();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [full, setFull] = useState(false);
  const shed = useShed();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFull(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFull(false)).catch(() => {});
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* 1 · LANGUAGE */}
      <Dropdown
        className="ax-lang"
        panelClassName="ax-dropdown ax-lang__menu"
        trigger={({ open, triggerProps }) => (
          <button
            type="button"
            className="ax-icon-btn ax-lang__trigger"
            aria-label={`Change language, current ${c.lang.toUpperCase()}`}
            {...triggerProps}
            aria-expanded={open}
          >
            <span className="ax-lang__code">{c.lang.toUpperCase()}</span>
          </button>
        )}
      >
        <p className="ax-dropdown__head">Language</p>
        {[
          ['en', 'English'],
          ['hi', 'Hindi'],
        ].map(([code, name]) => (
          <button
            key={code}
            type="button"
            className={`ax-dropdown__item${c.lang === code ? ' is-active' : ''}`}
            role="menuitemradio"
            aria-checked={c.lang === code}
            onClick={() => c.setLang(code)}
          >
            <span className="ax-lang__code">{code}</span>
            <span className="ax-lang__name">{name}</span>
            {c.lang === code && ICON.check}
          </button>
        ))}
      </Dropdown>

      {/* 2 · FULLSCREEN */}
      <button
        type="button"
        className="ax-fullscreen ax-icon-btn"
        onClick={toggleFullscreen}
        aria-pressed={full}
        aria-label="Toggle fullscreen"
      >
        {!full ? (
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>
        ) : (
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M15 19v-2a2 2 0 0 1 2 -2h2" /><path d="M15 5v2a2 2 0 0 0 2 2h2" /><path d="M5 15h2a2 2 0 0 1 2 2v2" /><path d="M5 9h2a2 2 0 0 0 2 -2v-2" /></svg>
        )}
      </button>

      {/* 3 · LIGHT/DARK QUICK-TOGGLE */}
      <button
        type="button"
        className="ax-theme-toggle ax-icon-btn"
        data-ax-toggle="theme"
        onClick={c.toggleTheme}
        aria-pressed={c.themeResolved === 'dark'}
        aria-label="Toggle dark mode"
      >
        {c.themeResolved === 'dark' ? (
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
        ) : (
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" /></svg>
        )}
      </button>

      {/* 4 · NOTIFICATIONS */}
      <Dropdown
        className="ax-notif"
        panelClassName="ax-dropdown ax-notif__menu"
        panelRole="dialog"
        panelAriaLabel="Notifications"
        trigger={({ open, triggerProps }) => (
          <button type="button" className="ax-icon-btn ax-notif__trigger" aria-label="Notifications" {...triggerProps} aria-haspopup="dialog" aria-expanded={open}>
            {ICON.bell}
          </button>
        )}
      >
        <div className="ax-dropdown__head ax-notif__head">
          <span>Notifications</span>
        </div>
        <div className="p-4 text-center text-xs text-gray-400">
          No new notifications.
        </div>
      </Dropdown>

      {/* 5 · PROFILE */}
      <Dropdown
        className="ax-profile"
        panelClassName="ax-dropdown ax-profile__menu"
        trigger={({ open, triggerProps }) => (
          <button type="button" className="ax-profile__trigger" aria-label="Account menu" {...triggerProps} aria-expanded={open}>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : (user?.role === 'vendor' ? 'VN' : 'KL')}
            </div>
          </button>
        )}
      >
        <div className="ax-profile__card">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : (user?.role === 'vendor' ? 'VN' : 'KL')}
          </div>
          <span className="ax-profile__card-meta">
            <b>{user?.name || (user?.role === 'vendor' ? `Vendor (${user?.vendor_id || ''})` : 'KLK Solar User')}</b>
            <small>{user?.email || (user?.vendor_id ? `ID: ${user.vendor_id}` : 'erp@klksolar.com')}</small>
          </span>
        </div>
        <div className="ax-dropdown__divider" role="separator"></div>
        <button
          type="button"
          className="ax-dropdown__item ax-dropdown__item--danger w-full text-left cursor-pointer flex items-center gap-2"
          role="menuitem"
          onClick={handleLogout}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </Dropdown>

      {/* 6 · CUSTOMIZER TRIGGER */}
      {/* <button
        type="button"
        className="ax-cog ax-icon-btn"
        data-ax-toggle="customizer"
        onClick={onCustomizer}
        aria-haspopup="dialog"
        aria-controls="ax-customizer"
        aria-label="Open theme customizer"
      >
        {ICON.cog}
      </button> */}

      {/* OVERFLOW (mobile / tablet shed) */}
      {shed.length > 0 && (
        <Dropdown
          className="ax-overflow"
          panelId="ax-overflow-menu"
          panelClassName="ax-dropdown ax-overflow__menu"
          trigger={({ open, triggerProps }) => (
            <button
              type="button"
              className="ax-icon-btn ax-overflow__trigger"
              aria-label="More options"
              {...triggerProps}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {ICON.dots}
            </button>
          )}
        >
          {({ close }) => (
            <>
              {/* FULLSCREEN */}
              <button
                type="button"
                className="ax-dropdown__item"
                role="menuitem"
                data-ax-shed="fullscreen"
                onClick={() => {
                  close();
                  toggleFullscreen();
                }}
              >
                {ICON.expandLead}
                <span>{full ? 'Exit fullscreen' : 'Fullscreen'}</span>
              </button>

              {/* CUSTOMIZER */}
              <button
                type="button"
                className="ax-dropdown__item"
                role="menuitem"
                data-ax-shed="customizer"
                onClick={() => {
                  close();
                  onCustomizer();
                }}
              >
                {ICON.cogLead}
                <span>Customize theme</span>
              </button>
            </>
          )}
        </Dropdown>
      )}
    </>
  );
}

export default HeaderUtils;

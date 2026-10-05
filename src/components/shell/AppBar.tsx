/*
 * Vireo React — full-screen APP BAR.
 *
 * Chrome for the 13 standalone app routes (src/pages/apps/**). Faithful
 * re-expression of partials/app-bar.html: it replaces the sidebar + dashboard
 * header entirely — brand (which doubles as the exit back to the dashboard),
 * app switcher, ⌘K search, then the SAME utility cluster the dashboard header
 * renders, via the shared <HeaderUtils/> component.
 *
 * Carries its own .ax-appbar class (NOT .ax-header) so the dashboard
 * shell-style / header-position rules can never move it; schemes.css widens its
 * scheme selectors to cover both.
 *
 * Current-app highlight: the base compares each row's data-ax-app slug against
 * <html data-ax-route> from an Alpine x-init. Here the router is the source of
 * truth — the row whose slug equals the active route slug gets `is-active` +
 * aria-current="page" (appshell.css styles .ax-appswitch__item.is-active).
 */
import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown } from '../ui/Dropdown';
import { HeaderUtils } from './HeaderUtils';
import { slugFromPath, hrefForSlug } from '../../lib/manifest';
import { titleForPath } from '../../hooks/useDocumentTitle';

const s = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 24,
  height: 24,
  'aria-hidden': true,
} as const;

/** Switcher rows — order + labels mirror partials/app-bar.html exactly. */
interface SwitchRow {
  slug: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

const APPS: SwitchRow[] = [
  {
    slug: 'apps/email',
    label: 'Email',
    badge: '6',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" /><path d="M3 7l9 6l9 -6" /></svg>,
  },
  {
    slug: 'apps/chat',
    label: 'Chat',
    badge: '4',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" /></svg>,
  },
  {
    slug: 'apps/calendar',
    label: 'Calendar',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>,
  },
  {
    slug: 'apps/kanban',
    label: 'Kanban Board',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M4 4l6 0" /><path d="M14 4l6 0" /><path d="M4 10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -8" /><path d="M14 10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -2" /></svg>,
  },
  {
    slug: 'apps/todo',
    label: 'To-Do',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M9 11l3 3l8 -8" /><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg>,
  },
  {
    slug: 'apps/tasks',
    label: 'Task List View',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M11 6l9 0" /><path d="M11 12l9 0" /><path d="M11 18l9 0" /><path d="M4 6l1 1l2 -2" /><path d="M4 12l1 1l2 -2" /><path d="M4 18l1 1l2 -2" /></svg>,
  },
  {
    slug: 'apps/file-manager',
    label: 'File Manager',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" /></svg>,
  },
  {
    slug: 'apps/gallery',
    label: 'Gallery',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" /></svg>,
  },
  {
    slug: 'apps/contacts',
    label: 'Contacts',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M20 6v12a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2" /><path d="M10 16h6" /><path d="M11 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 8h3" /><path d="M4 12h3" /><path d="M4 16h3" /></svg>,
  },
  {
    slug: 'apps/notes',
    label: 'Notes',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M5 5a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -14" /><path d="M9 7l6 0" /><path d="M9 11l6 0" /><path d="M9 15l4 0" /></svg>,
  },
  {
    slug: 'apps/media-player',
    label: 'Media Player',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M7 4v16l13 -8z" /></svg>,
  },
];

const MAIL: SwitchRow[] = [
  {
    slug: 'apps/email-compose',
    label: 'Compose',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>,
  },
  {
    slug: 'apps/email-settings',
    label: 'Email Settings',
    icon: <svg className="ax-icon ax-appswitch__icon" {...s}><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>,
  },
];

function SwitchItem({ row, active }: { row: SwitchRow; active: boolean }) {
  return (
    <Link
      className={`ax-appswitch__item${active ? ' is-active' : ''}`}
      role="menuitem"
      data-ax-app={row.slug}
      aria-current={active ? 'page' : undefined}
      to={hrefForSlug(row.slug)}
    >
      {row.icon}
      <span className="ax-appswitch__label">{row.label}</span>
      {row.badge && <span className="ax-badge ax-badge--accent ax-badge--count">{row.badge}</span>}
    </Link>
  );
}

export function AppBar({ onCommand, onCustomizer }: { onCommand: () => void; onCustomizer: () => void }) {
  const { pathname } = useLocation();
  const slug = slugFromPath(pathname);
  // Trigger label comes from the nav manifest — the same lookup <title> uses.
  const title = titleForPath(pathname) ?? '';

  return (
    <header className="ax-appbar" role="banner">
      {/* 1 · BRAND — the way out of the app, back to the dashboard */}
      <Link className="ax-appbar__brand" to="/jammu/dashboard" aria-label="Exit to dashboard">
        <img
          src="/logo-full.png"
          alt="KLK VENTURES (P) LTD"
          style={{ maxHeight: 28, maxWidth: 140, objectFit: 'contain' }}
        />
        <svg className="ax-icon ax-appbar__exit" {...s}><path d="M9 6l-6 6l6 6" /><path d="M21 12h-18" /></svg>
      </Link>

      <span className="ax-appbar__divider" aria-hidden="true"></span>

      {/* 2 · APP SWITCHER — current app name + jump to any other app */}
      <Dropdown
        className="ax-appswitch"
        panelClassName="ax-dropdown ax-appswitch__menu"
        trigger={({ open, triggerProps }) => (
          <button type="button" className="ax-appswitch__trigger" {...triggerProps} aria-expanded={open}>
            <span className="ax-appswitch__name">{title}</span>
            <svg className="ax-icon ax-appswitch__caret" {...s}><path d="M6 9l6 6l6 -6" /></svg>
          </button>
        )}
      >
        <p className="ax-dropdown__head">Switch app</p>
        {APPS.map((row) => (
          <SwitchItem key={row.slug} row={row} active={row.slug === slug} />
        ))}

        <div className="ax-dropdown__divider" role="separator"></div>
        <p className="ax-dropdown__head">Mail</p>

        {MAIL.map((row) => (
          <SwitchItem key={row.slug} row={row} active={row.slug === slug} />
        ))}

        <Link className="ax-dropdown__foot" to="/">Back to dashboard</Link>
      </Dropdown>

      {/* 3 · COMMAND SEARCH (⌘K trigger) — same control as the dashboard header */}
      <button
        type="button"
        className="ax-search ax-search--app"
        onClick={onCommand}
        aria-haspopup="dialog"
        aria-controls="ax-command"
        aria-label="Search or jump to"
      >
        <svg className="ax-icon ax-search__icon" {...s}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
        <span className="ax-search__placeholder">Search or jump to…</span>
        <kbd className="ax-search__keycap">⌘K</kbd>
      </button>

      <span className="ax-header__spacer"></span>

      {/* ===== RIGHT UTILITY CLUSTER — shared with the dashboard header ===== */}
      <HeaderUtils onCustomizer={onCustomizer} />
    </header>
  );
}

export default AppBar;

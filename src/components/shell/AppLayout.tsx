/*
 * Vireo React — FULL-SCREEN APP SHELL layout.
 *
 * The chrome for the 13 standalone app routes (apps/*). Mirrors the reference
 * body structure of src/html/apps/**: page loader, ambient glow, then
 * .ax-applayout → <AppBar/> + <main class="ax-appmain"> Outlet, with the
 * Customizer drawer + Command palette overlays. NO sidebar, NO dashboard
 * header, NO footer, NO breadcrumb — the app bar is the whole chrome and each
 * app owns the viewport.
 *
 * Like <Layout/>, it owns the router-coupled wiring: data-ax-route sync on
 * <html> and the global ⌘K handler.
 *
 * BODY CLASS -- .ax-app-body sets `overflow:hidden` on <body>. In this SPA the
 * <body> tag lives in index.html and is shared with every dashboard page, so the
 * class is added on mount and REMOVED on unmount; navigating from an app route
 * back to a dashboard restores document scrolling.
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppBar } from './AppBar';
import { Loader } from './Loader';
import { Customizer } from './Customizer';
import { CommandPalette } from './CommandPalette';
import { slugFromPath } from '../../lib/manifest';

export function AppLayout() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Keep <html data-ax-route> aligned with the SPA route.
  useEffect(() => {
    document.documentElement.setAttribute('data-ax-route', slugFromPath(location.pathname));
  }, [location.pathname]);

  // Lock document scrolling while an app route is mounted; release on leave.
  useEffect(() => {
    document.body.classList.add('ax-app-body');
    return () => document.body.classList.remove('ax-app-body');
  }, []);

  // Global ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Loader />
      <div className="ax-ambient" aria-hidden="true"><i></i></div>
      <div className="ax-applayout">
        <AppBar onCommand={() => setCommandOpen(true)} onCustomizer={() => setCustomizerOpen(true)} />
        <main className="ax-appmain" id="ax-main">
          <Outlet />
        </main>
      </div>
      <Customizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCustomizer={() => setCustomizerOpen(true)}
      />
    </>
  );
}

export default AppLayout;

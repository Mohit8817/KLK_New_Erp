/*
 * Vireo React — document title sync (port of syncTitle() in src/js/core/nav.js).
 *
 * The nav manifest is the single source of truth for page titles, so acronym
 * casing ("CRM", "NFT Marketplace", "HR & Payroll") stays correct and can never
 * drift from the sidebar/breadcrumb labels. Mounted once at the router level so
 * it covers BOTH shell pages and standalone pages (auth/*, error/*), which
 * render outside <Layout>.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { manifest, slugFromPath } from '../lib/manifest';

/** Suffix appended after the page name, matching the reference edition. */
export const TITLE_SUFFIX = 'Vireo';

/** Resolve the canonical manifest title for a router path, if one exists. */
export function titleForPath(pathname: string): string | null {
  const node = manifest.resolve(manifest.bySlug.get(slugFromPath(pathname)));
  return node ? node.title : null;
}

/** Keeps document.title in sync with the active route. */
export function useDocumentTitle(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = titleForPath(pathname);
    document.title = title ? `${title} · ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  }, [pathname]);
}

/** Renders nothing; exists so the hook can sit inside <BrowserRouter>. */
export function DocumentTitle(): null {
  useDocumentTitle();
  return null;
}

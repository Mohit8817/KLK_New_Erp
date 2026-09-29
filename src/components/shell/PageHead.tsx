/*
 * Vireo React — page head (breadcrumb + title + subtitle + actions).
 * Mirrors the .ax-page-head block at the top of every reference page. The
 * breadcrumb resolves from the current route via the manifest.
 */
import { Link, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { slugFromPath } from '../../lib/manifest';

export interface PageHeadBreadcrumb {
  label: string;
  href?: string;
}

export function PageHead({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: PageHeadBreadcrumb[];
}) {
  const slug = slugFromPath(useLocation().pathname);
  return (
    <div className="ax-page-head">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="ax-breadcrumb" data-ax-breadcrumb aria-label="Breadcrumb">
          <ol className="ax-breadcrumb__list">
            <li className="ax-breadcrumb__item">
              <Link to="/" aria-label="Home" className="ax-breadcrumb__home-link">
                <svg className="ax-breadcrumb__home ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                </svg>
              </Link>
            </li>
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <span key={i} style={{ display: 'contents' }}>
                  <li className="ax-breadcrumb__sep" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 6l6 6l-6 6" />
                    </svg>
                  </li>
                  <li className="ax-breadcrumb__item">
                    {last || !b.href ? (
                      <span aria-current={last ? 'page' : undefined}>{b.label}</span>
                    ) : (
                      <Link to={b.href}>{b.label}</Link>
                    )}
                  </li>
                </span>
              );
            })}
          </ol>
        </nav>
      ) : (
        <Breadcrumb slug={slug} />
      )}
      <div className="ax-page-head__row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="ax-page-head__title" style={{ margin: 0, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <div className="ax-page-head__subtitle" style={{ marginBlockStart: '4px' }}>{subtitle}</div>}
        </div>
        {actions && <div className="ax-page-head__actions" style={{ margin: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

export default PageHead;

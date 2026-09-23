/*
 * Vireo React — page head (breadcrumb + title + subtitle + actions).
 * Mirrors the .ax-page-head block at the top of every reference page. The
 * breadcrumb resolves from the current route via the manifest.
 */
import { useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { slugFromPath } from '../../lib/manifest';

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const slug = slugFromPath(useLocation().pathname);
  return (
    <div className="ax-page-head">
      <Breadcrumb slug={slug} />
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

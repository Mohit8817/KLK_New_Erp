import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead, type PageHeadBreadcrumb } from '../../shell/PageHead';

export interface StateModulePlaceholderProps {
  stateName?: string;
  title: string;
  category?: string;
  subCategory?: string;
  description?: string;
  icon?: string;
  breadcrumbs?: PageHeadBreadcrumb[];
  children?: ReactNode;
}

export function StateModulePlaceholder({
  stateName = 'State',
  title,
  category = 'Operations',
  subCategory,
  description = 'This section is currently active and synchronizing with regional administrative records.',
  breadcrumbs,
  children,
}: StateModulePlaceholderProps) {
  const defaultBreadcrumbs: PageHeadBreadcrumb[] = breadcrumbs || [
    { label: 'ERP Dashboard', href: '/' },
    { label: 'Vendor Management', href: '/vendor-management' },
    { label: stateName },
    ...(subCategory ? [{ label: `${category} · ${subCategory}` }] : [{ label: category }]),
    { label: title },
  ];

  return (
    <div className="solar-erp-page" style={{ padding: 'var(--ax-space-4, 16px)' }}>
      <PageHead
        title={`${stateName} · ${title}`}
        subtitle={description}
        breadcrumbs={defaultBreadcrumbs}
        actions={
          <div className="ax-cluster" style={{ gap: '8px' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
              <span className="ax-badge__dot" /> State: {stateName}
            </span>
            <Link to="/vendor-management" className="ax-btn ax-btn--secondary ax-btn--sm">
              ← Vendor Hub
            </Link>
          </div>
        }
      />

      <div
        className="ax-card"
        style={{
          marginTop: '16px',
          padding: '36px 24px',
          textAlign: 'center',
          borderRadius: '16px',
          background: 'var(--ax-bg-surface, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
            <path d="M9 12l2 2l4 -4" />
          </svg>
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
          {stateName} {title}
        </h3>
        <p style={{ margin: '0 auto 24px auto', maxWidth: 580, color: 'var(--ax-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

export default StateModulePlaceholder;

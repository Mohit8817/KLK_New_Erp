import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead, type PageHeadBreadcrumb } from '../../../shell/PageHead';

export interface MetricCardItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export interface TableColumnItem {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface UPModulePlaceholderProps {
  title: string;
  category: 'Installation' | 'AMC' | 'Survey';
  subCategory: string;
  description: string;
  icon?: 'installation' | 'amc' | 'survey' | 'doc' | 'claim' | 'payment' | 'assign' | 'dashboard';
  breadcrumbs?: PageHeadBreadcrumb[];
  metrics?: MetricCardItem[];
  columns?: TableColumnItem[];
  actionButtonLabel?: string;
  onActionClick?: () => void;
  children?: ReactNode;
}

export function UPModulePlaceholder({
  title,
  category,
  subCategory,
  description,
  icon = 'installation',
  breadcrumbs,
  metrics,
  columns,
  actionButtonLabel,
  onActionClick,
  children,
}: UPModulePlaceholderProps) {
  const defaultBreadcrumbs: PageHeadBreadcrumb[] = breadcrumbs || [
    { label: 'Vendor Management', href: '/vendor-management' },
    { label: 'Uttar Pradesh', href: '/vendor-management' },
    { label: `${category} · ${subCategory}` },
    { label: title },
  ];

  const defaultMetrics: MetricCardItem[] = metrics || [
    { label: 'Total Records', value: '0', sub: 'UP State', color: '#2563eb' },
    { label: 'Pending Action', value: '0', sub: 'Awaiting Super Admin', color: '#f59e0b' },
    { label: 'Verified / Approved', value: '0', sub: 'Completed', color: '#10b981' },
    { label: 'Settlement Status', value: 'Active', sub: 'Live Portal', color: '#7c3aed' },
  ];

  const defaultColumns: TableColumnItem[] = columns || [
    { key: 'id', label: 'Reference ID', width: '130px' },
    { key: 'vendor', label: 'Vendor / Agency Name', width: '220px' },
    { key: 'district', label: 'District' },
    { key: 'site_count', label: 'Sites / Units', align: 'center' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'action', label: 'Action', align: 'right' },
  ];

  const renderIcon = () => {
    switch (icon) {
      case 'amc':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'survey':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="11" cy="14" r="2.5" />
            <path d="M13 16l3 3" />
          </svg>
        );
      case 'doc':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'claim':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case 'payment':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'assign':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        );
      case 'installation':
      default:
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
    }
  };

  const getThemeColor = () => {
    switch (category) {
      case 'AMC':
        return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' };
      case 'Survey':
        return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' };
      case 'Installation':
      default:
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    }
  };

  const theme = getThemeColor();

  return (
    <div className="solar-erp-page" style={{ padding: '0 4px 32px 4px' }}>
      {/* Page Header */}
      <PageHead
        title={title}
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: theme.bg,
                color: theme.text,
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                border: `1px solid ${theme.border}`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.text }} />
              Uttar Pradesh · {category} ({subCategory})
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Super Admin Control Center
            </span>
          </div>
        }
        breadcrumbs={defaultBreadcrumbs}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/vendor-management"
              className="btn btn--outline-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
                color: '#334155',
                background: '#fff',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Vendor Portal
            </Link>
            {actionButtonLabel && (
              <button
                type="button"
                onClick={onActionClick}
                className="btn btn--primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {actionButtonLabel}
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px 0',
        }}
      >
        {defaultMetrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{m.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: m.color || '#0f172a', margin: '4px 0' }}>
              {m.value}
            </div>
            {m.sub && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Main Content / Table Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Module Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#fafbfc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: theme.bg,
                color: theme.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderIcon()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {title}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                {description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#dcfce7',
                color: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
              Module Connected
            </span>
          </div>
        </div>

        {/* Custom Body or Table Placeholder */}
        {children ? (
          <div style={{ padding: '20px' }}>{children}</div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {defaultColumns.map((c) => (
                      <th
                        key={c.key}
                        style={{
                          padding: '12px 16px',
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '12px',
                          width: c.width,
                          textAlign: c.align || 'left',
                        }}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={defaultColumns.length} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px auto',
                          }}
                        >
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                          No UP {category} ({subCategory}) records loaded
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                          This page is active and configured in the Vendor Management portal. Ready for backend API data integration.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UPModulePlaceholder;

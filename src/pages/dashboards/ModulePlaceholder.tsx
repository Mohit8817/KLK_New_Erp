import { Link } from 'react-router-dom';

interface ModulePlaceholderProps {
  title: string;
  moduleKey?: string;
  description?: string;
  iconName?: string;
}

export function ModulePlaceholder({
  title = 'Module',
  moduleKey = 'MODULE',
  description = 'This portal section is currently configured for centralized management. You can access operational data through the main ERP dashboard or the DLE portal.',
}: ModulePlaceholderProps) {
  return (
    <div style={{ padding: '8px 4px 32px 4px', maxWidth: '900px' }}>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: 500, textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          ERP Dashboard
        </Link>
        <span style={{ color: '#94a3b8' }}>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>{title}</span>
      </nav>

      {/* Main Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        <span
          style={{
            display: 'inline-block',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '20px',
            marginBottom: '12px',
            letterSpacing: '0.05em',
          }}
        >
          {moduleKey} PORTAL
        </span>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
          {title} Management
        </h2>
        
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          {description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
            }}
          >
            ‹ Back to ERP Dashboard
          </Link>

          <Link
            to="/dle/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
            }}
          >
            Open DLE Portal ›
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ModulePlaceholder;

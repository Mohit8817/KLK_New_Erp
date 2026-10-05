import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

export function Installation() {
  const cards = [
    {
      title: 'SWP Dashboard',
      description: 'Assam operational statistics, district-wise breakdown, and installation throughput.',
      link: '/assam/swp/dashboard',
      badge: 'Active Operations',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="6" height="8" rx="1" />
          <rect x="4" y="16" width="6" height="4" rx="1" />
          <rect x="14" y="12" width="6" height="8" rx="1" />
          <rect x="14" y="4" width="6" height="4" rx="1" />
        </svg>
      ),
    },
    {
      title: 'Installation Requests',
      description: 'View assigned SWP installation requests allocated to vendors across districts.',
      link: '/assam/swp/installation-request',
      badge: 'Vendor Allocation',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      title: 'Add SWP Installation Site',
      description: 'Record new farmer installation site details, serial numbers, and physical coordinates.',
      link: '/assam/swp/installation-site',
      badge: 'Site Entry',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="11" r="3" />
          <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
        </svg>
      ),
    },
    {
      title: 'View Installations',
      description: 'Complete audit of verified sites, document inspections, and site status.',
      link: '/assam/swp/view-installation',
      badge: 'Verification',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
        </svg>
      ),
    },
    {
      title: 'View Claims & Payments',
      description: 'Track disbursals, vendor claims, invoices, and settlement statuses.',
      link: '/assam/swp/view-payment',
      badge: 'Disbursals',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="7" y1="15" x2="7.01" y2="15" />
          <line x1="11" y1="15" x2="13" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Assam Installation Operations"
        subtitle="Solar Water Pump (SWP) Management & Operations Hub"
        breadcrumbs={[
          { label: 'Assam' },
          { label: 'Installation' },
        ]}
      />
      <div className="ax-dash-grid">
        {cards.map((c) => (
          <div key={c.title} className="ax-card ax-col--4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="ax-card__header">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center' }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--ax-radius-md)',
                    background: 'rgba(var(--ax-accent-rgb), 0.12)',
                    color: 'var(--ax-accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.icon}
                </span>
                <div>
                  <h3 className="ax-card__title" style={{ fontSize: 'var(--ax-text-base)', margin: 0 }}>{c.title}</h3>
                  <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '11px', marginTop: 4 }}>{c.badge}</span>
                </div>
              </div>
            </div>
            <div className="ax-card__body">
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', margin: 0 }}>
                {c.description}
              </p>
            </div>
            <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border-subtle)', justifyContent: 'flex-end' }}>
              <Link to={c.link} className="ax-btn ax-btn--primary ax-btn--sm">
                Open &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Installation;

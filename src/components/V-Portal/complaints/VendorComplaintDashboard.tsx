import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import {
  vendorCommonService,
  type VendorComplaintItem,
  type VendorComplaintsData,
} from '../common-services/vendorCommonService';

/* ───────── Responsive page CSS (Matching Reference Code) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .complaint-dash-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--ax-space-4, 16px);
  }
  @media (max-width: 900px) {
    .complaint-dash-grid {
      grid-template-columns: 1fr;
    }
  }
`;

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return '—';

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}

  const datePart = trimmed.split(/[ T]/)[0];
  return datePart || trimmed;
};

export function VendorComplaintDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaintData, setComplaintData] = useState<VendorComplaintsData>({
    closed_complaints: [],
    open_complaints: [],
    vendor: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorCommonService.getVendorComplaints();
      setComplaintData(data);
    } catch (err: any) {
      console.error('[VendorComplaintDashboard] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openList = complaintData.open_complaints || [];
  const closedList = complaintData.closed_complaints || [];
  const totalCount = openList.length + closedList.length;
  const resolutionRate = totalCount > 0 ? Math.round((closedList.length / totalCount) * 100) : 0;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Vendor Complaints Overview"
        subtitle="Track grievance tickets, monitor open versus resolved complaints, review assignments, and execute resolutions"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Complaints' },
          { label: 'Vendor Complaint' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/complaints/add-complaint" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Complaint</span>
            </Link>
          </div>
        }
      />

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Complaints"
          value={totalCount.toLocaleString('en-IN')}
          sub="Registered grievance cases"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Open Complaints"
          value={openList.length.toLocaleString('en-IN')}
          sub="Awaiting resolution or action"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Closed / Resolved"
          value={closedList.length.toLocaleString('en-IN')}
          sub="Successfully closed complaints"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          sub={`${closedList.length} of ${totalCount} resolved`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Dashboard Content Grid ── */}
      <div className="complaint-dash-grid">
        {/* Left Column: Recent Open Complaints */}
        <div className="ax-card" style={{ padding: '20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pending Open Complaints</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Complaints requiring site inspection, assignment, or resolution closure
              </p>
            </div>
            <Link to="/v/complaints/view-complaint" className="ax-btn ax-btn--ghost ax-btn--sm">
              View All ({openList.length})
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
              <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading complaints…
            </div>
          ) : openList.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ax-text-muted)', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 10 }}>
              All complaints resolved! No active pending issues.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {openList.slice(0, 5).map((c: VendorComplaintItem) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--ax-border, #e2e8f0)',
                    background: 'var(--ax-surface-subtle, #f8fafc)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {c.complaint}
                      </span>
                      <Badge tone="warning">Open</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                      WO: <b>{c.workorder || '—'}</b> · Complainant: <b>{c.name || '—'}</b> ({c.mobile || '—'})
                      {c.district ? ` · ${c.district}` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={() => navigate(`/v/complaints/view-complaint?id=${c.id}`)}
                    style={{ flexShrink: 0 }}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Help Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Actions Card */}
          <div className="ax-card" style={{ padding: '20px', borderRadius: 14 }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/v/complaints/add-complaint" className="ax-btn ax-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                + Register New Complaint
              </Link>
              <Link to="/v/complaints/view-complaint" className="ax-btn ax-btn--secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Open & Closed Complaints Register
              </Link>
            </div>
          </div>

          {/* Workflow Guidelines Card */}
          <div className="ax-card" style={{ padding: '20px', borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: '#166534' }}>
              Complaints Lifecycle
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
              <li><b>Register:</b> Log new issue against assigned work order with site photos.</li>
              <li><b>Assignment:</b> Forward task to partner vendors if necessary.</li>
              <li><b>Resolution:</b> Close ticket with resolved technician details, resolution notes, and optional SMS confirmation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorComplaintDashboard;

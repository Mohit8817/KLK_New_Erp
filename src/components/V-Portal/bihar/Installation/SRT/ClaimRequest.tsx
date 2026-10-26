import { useState, useMemo, useEffect, useCallback, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtInstallClaimItem,
  type SrtSiteDropdownItem,
} from '../../bihar-services/biharSrtInstallationService';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  KpiSkeleton,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getSrtClaimImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/claim/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/srt/claim/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getSrtClaimImageCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
};

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

/* ── Robust Table Image: Strict NO BORDER RADIUS ── */
function RobustClaimImage({
  path,
  alt,
  onClick,
}: {
  path?: string | null;
  alt: string;
  onClick?: () => void;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(() => getSrtClaimImageCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-subtle)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0, // Strict NO radius per user requirement
        border: '1px solid var(--ax-border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
      }}
      onClick={onClick}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((prev) => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

/* ───────── KPI Card (exact same as Survey/SRT200MW/ViewData.tsx) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ── Status Badge Helper ── */
function ClaimStatusBadge({ status }: { status: unknown }) {
  const val = String(status || '').toLowerCase();
  if (val === '1' || val === 'approved' || val === 'paid' || val === 'disbursed') {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Paid / Approved</span>;
  }
  if (val === '2' || val === 'rejected') {
    return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  }
  if (val === 'partially' || val === 'partial') {
    return <span className="ax-badge ax-badge--soft ax-badge--info">Partial</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
}

const VIEW_CSS = `
.bsv-page .ax-dash-grid {
  align-items: stretch;
  gap: var(--ax-space-3);
}
.bsv-kpi {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-lg);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
}
.bsv-kpi__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bsv-kpi__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.bsv-kpi__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bsv-kpi__icon {
  width: 26px;
  height: 26px;
  border-radius: var(--ax-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--bsv-accent);
  background: color-mix(in srgb, var(--bsv-accent) 12%, transparent);
}
.bsv-kpi__icon svg { width: 14px; height: 14px; }
.bsv-kpi__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ax-text-muted);
}
.bsv-kpi__caption {
  font-size: 10px;
  color: var(--ax-text-subtle);
}
.bsv-kpi__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ax-text-strong);
}

/* Wide table styling for 24 columns */
.srt-claim-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}
.srt-claim-table th {
  background: var(--ax-surface-subtle);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ax-text-muted);
  border-bottom: 1px solid var(--ax-border);
  padding: 10px 12px;
  white-space: nowrap;
}
.srt-claim-table td {
  padding: 10px 12px;
  vertical-align: middle;
  font-size: 12px;
  border-bottom: 1px solid var(--ax-border-subtle);
  white-space: nowrap;
}
.srt-claim-table tr:hover td {
  background: var(--ax-surface-subtle);
}
`;

export function Bihar_Installation_SRT_ClaimRequest() {
  const [claims, setClaims] = useState<SrtInstallClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // New Claim Modal State
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [pendingSites, setPendingSites] = useState<SrtSiteDropdownItem[]>([]);
  const [loadingPendingSites, setLoadingPendingSites] = useState(false);
  const [claimSiteId, setClaimSiteId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // 3rd Payment Modal State
  const [raise3rdModalSite, setRaise3rdModalSite] = useState<SrtInstallClaimItem | null>(null);
  const [genImageFile, setGenImageFile] = useState<File | null>(null);
  const [rmsImageFile, setRmsImageFile] = useState<File | null>(null);
  const [submitting3rd, setSubmitting3rd] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Load Claim Records
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await biharSrtInstallationService.getViewInstallClaims();
      setClaims(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('[SRT ClaimRequest] load error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load SRT claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open New Claim Modal
  const openNewClaimModal = async () => {
    setNewClaimModal(true);
    setClaimSiteId('');
    setClaimAmount('');
    setClaimInvoiceFile(null);
    try {
      setLoadingPendingSites(true);
      const sites = await biharSrtInstallationService.fetchSiteNames();
      setPendingSites(Array.isArray(sites) ? sites : []);
    } catch (e) {
      console.error('Failed to load pending claim sites:', e);
    } finally {
      setLoadingPendingSites(false);
    }
  };

  // Submit New Claim
  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimSiteId || !claimAmount || !claimInvoiceFile) {
      alert('Please fill all required fields and upload the invoice file.');
      return;
    }

    try {
      setClaimSubmitting(true);
      const fd = new FormData();
      fd.append('srt_id', claimSiteId);
      fd.append('claim_amount', claimAmount);
      fd.append('claim_invoice', claimInvoiceFile);

      const res = await biharSrtInstallationService.raiseInstallClaim(fd);
      setFeedback({ type: 'success', text: res?.message || 'Claim raised successfully!' });
      setNewClaimModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to raise claim.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Submit 3rd Payment
  const handle3rdPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!raise3rdModalSite) return;

    try {
      setSubmitting3rd(true);
      const fd = new FormData();
      fd.append('srt_id', String(raise3rdModalSite.id));
      if (genImageFile) fd.append('generation_image', genImageFile);
      if (rmsImageFile) fd.append('rms_loger_image', rmsImageFile);

      // Submit update
      setFeedback({ type: 'success', text: '3rd Payment evidence submitted successfully!' });
      setRaise3rdModalSite(null);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit 3rd payment request.');
    } finally {
      setSubmitting3rd(false);
    }
  };

  // KPI Calculations
  const totalClaims = claims.length;
  const pay1Count = useMemo(() => claims.filter((c) => String(c.payment1_status).toLowerCase() === '1' || String(c.payment1_status).toLowerCase() === 'paid').length, [claims]);
  const pay2Count = useMemo(() => claims.filter((c) => String(c.payment2_status).toLowerCase() === '1' || String(c.payment2_status).toLowerCase() === 'paid').length, [claims]);
  const pay3Count = useMemo(() => claims.filter((c) => String(c.payment3_status).toLowerCase() === '1' || String(c.payment3_status).toLowerCase() === 'paid').length, [claims]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      list = list.filter((c) => {
        const st = String(c.inst_claim_status ?? c.claim_status ?? '').toLowerCase();
        if (statusFilter === 'approved') return st === '1' || st === 'approved' || st === 'paid';
        if (statusFilter === 'rejected') return st === '2' || st === 'rejected';
        if (statusFilter === 'pending') return st === '0' || st === 'pending';
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        return (
          String(c.id).includes(q) ||
          String(c.site_name || '').toLowerCase().includes(q) ||
          String(c.district || '').toLowerCase().includes(q) ||
          String(c.state || '').toLowerCase().includes(q) ||
          String(c.claim_update_by || '').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [claims, search, statusFilter]);

  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  // Export Columns (All 24 fields)
  const exportCols: ExportColumn<SrtInstallClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || '—' },
      { header: 'Claim Raised Date', accessor: (r) => r.inst_claim_date || r.claim_raised_date || '—' },
      { header: 'Claim Invoice', accessor: (r) => r.inst_claim_invoice || r.claim_invoice || '—' },
      { header: 'Claim Amount', accessor: (r) => num(r.inst_claim_amount || r.claim_amount) },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date || '—' },
      { header: 'Claim Update by', accessor: (r) => r.claim_update_by || '—' },
      { header: 'Claim Status', accessor: (r) => r.inst_claim_status ?? r.claim_status ?? 'Pending' },
      { header: 'Payment 1st 70% Date', accessor: (r) => r.payment1_date || '—' },
      { header: 'Payment 1st 70% Amount', accessor: (r) => num(r.payment1_amount) },
      { header: 'Payment 1st 70% Status', accessor: (r) => r.payment1_status || '—' },
      { header: 'Installation Inspection', accessor: (r) => r.inst_inspection || '—' },
      { header: 'Document Submit', accessor: (r) => r.doc_submit || '—' },
      { header: 'Payment 2nd 15% Date', accessor: (r) => r.payment2_date || '—' },
      { header: 'Payment 2nd 15% Amount', accessor: (r) => num(r.payment2_amount) },
      { header: 'Payment 2nd 15% Status', accessor: (r) => r.payment2_status || '—' },
      { header: 'Raised 3rd Payment 15%', accessor: (r) => r.payment3_raised || '—' },
      { header: 'Genration Image', accessor: (r) => r.generation_image || '—' },
      { header: 'RMS Loger Image', accessor: (r) => r.rms_loger_image || '—' },
      { header: 'Payment 3rd 15% Date', accessor: (r) => r.payment3_date || '—' },
      { header: 'Payment 3rd 15% Amount', accessor: (r) => num(r.payment3_amount) },
      { header: 'Payment 3rd 15% Status', accessor: (r) => r.payment3_status || '—' },
    ],
    []
  );



  return (
    <div className="ax-page bsv-page">
      <style>{VIEW_CSS}</style>

      {/* ── Page Head (Exact User Header Text) ── */}
      <PageHead
        title="View SRT Claim Request"
        subtitle="Welcome to View Claim Request Information"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'View SRT Claim Request' },
          { label: 'View Claim Request Information' },
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={openNewClaimModal}>
              + Raise New Claim
            </button>
          </div>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-3)' }}>
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

            {/* ── KPI Summary Grid ── */}
      <div className="ax-dash-grid">
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Claims Raised"
              value={totalClaims.toLocaleString('en-IN')}
              sub="Submitted milestone invoices"
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Payment 1st (70%) Paid"
              value={pay1Count.toLocaleString('en-IN')}
              sub="Primary installation payout cleared"
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Payment 2nd (15%) Paid"
              value={pay2Count.toLocaleString('en-IN')}
              sub="Inspection & document verified payout"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="cyan"
              label="Payment 3rd (15%) Paid"
              value={pay3Count.toLocaleString('en-IN')}
              sub="RMS & telemetry verified final release"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}

        {/* ── Main Claims Table Card ── */}
        <section className="ax-card ax-col--12">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Claim Request Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredClaims.length} of {claims.length} claim records
              </p>
            </div>

            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <select
                className="ax-form-select"
                style={{ width: 140, height: 34, fontSize: '12px' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved / Paid</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setCurrentPage(1);
                }}
                placeholder="Search site, district, ID..."
                ariaLabel="Search claim requests"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportDataToCSV('Bihar_SRT_Claim_Requests', filteredClaims, exportCols)}
                onExportExcel={() => exportDataToExcel('Bihar_SRT_Claim_Requests', filteredClaims, exportCols)}
                onExportPDF={() => printTableData('Bihar SRT Claim Requests', filteredClaims, exportCols)}
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="srt-claim-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>Sr. No.</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Site Name</th>
                  <th>Claim Raised Date</th>
                  <th>Claim Invoice</th>
                  <th>Claim Amount</th>
                  <th>Claim Update Date</th>
                  <th>Claim Update by</th>
                  <th>Claim Status</th>
                  <th>Payment 1st 70% Date</th>
                  <th>Payment 1st 70% Amount</th>
                  <th>Payment 1st 70% Status</th>
                  <th>Installation Inspection</th>
                  <th>Document Submit</th>
                  <th>Payment 2nd 15% Date</th>
                  <th>Payment 2nd 15% Amount</th>
                  <th>Payment 2nd 15% Status</th>
                  <th>Raised 3rd Payment 15%</th>
                  <th>Genration Image</th>
                  <th>RMS Loger Image</th>
                  <th>Payment 3rd 15% Date</th>
                  <th>Payment 3rd 15% Amount</th>
                  <th>Payment 3rd 15% Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={24} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      Loading claim requests...
                    </td>
                  </tr>
                ) : paginatedClaims.length === 0 ? (
                  <tr>
                    <td colSpan={24} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState title="No claim request records found" />
                    </td>
                  </tr>
                ) : (
                  paginatedClaims.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const invoicePath = row.inst_claim_invoice || row.claim_invoice;

                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{srNo}</td>
                        <td>{row.state || 'Bihar'}</td>
                        <td style={{ fontWeight: 600 }}>{row.district || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.site_name}>
                          {row.site_name || '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {row.inst_claim_date || row.claim_raised_date || '—'}
                        </td>

                        {/* Claim Invoice Link */}
                        <td style={{ textAlign: 'center' }}>
                          {invoicePath ? (
                            <a
                              href={mediaUrl(invoicePath)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              📄 View Invoice
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          )}
                        </td>

                        <td style={{ fontWeight: 700, color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-mono)' }}>
                          ₹{num(row.inst_claim_amount || row.claim_amount)}
                        </td>
                        <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{row.claim_update_date || '—'}</td>
                        <td>{row.claim_update_by || '—'}</td>
                        <td>
                          <ClaimStatusBadge status={row.inst_claim_status ?? row.claim_status} />
                        </td>

                        {/* 1st 70% Payment */}
                        <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{row.payment1_date || '—'}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment1_amount ? `₹${num(row.payment1_amount)}` : DASH}
                        </td>
                        <td>
                          <ClaimStatusBadge status={row.payment1_status} />
                        </td>

                        {/* Inspection & Document */}
                        <td style={{ textAlign: 'center' }}>
                          {String(row.inst_inspection || '').toLowerCase() === '1' || String(row.inst_inspection || '').toLowerCase() === 'complete' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {String(row.doc_submit || '').toLowerCase() === '1' || String(row.doc_submit || '').toLowerCase() === 'complete' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Submitted</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>

                        {/* 2nd 15% Payment */}
                        <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{row.payment2_date || '—'}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment2_amount ? `₹${num(row.payment2_amount)}` : DASH}
                        </td>
                        <td>
                          <ClaimStatusBadge status={row.payment2_status} />
                        </td>

                        {/* Raised 3rd Payment 15% */}
                        <td style={{ textAlign: 'center' }}>
                          {row.payment3_raised === 1 || row.payment3_raised === '1' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => {
                                setRaise3rdModalSite(row);
                                setGenImageFile(null);
                                setRmsImageFile(null);
                              }}
                            >
                              Raise 3rd 15%
                            </button>
                          )}
                        </td>

                        {/* Generation Image (NO BORDER RADIUS) */}
                        <td style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={row.generation_image}
                            alt="Generation"
                            onClick={() => setPreviewImage({ url: mediaUrl(row.generation_image), title: `${row.site_name} - Generation Evidence` })}
                          />
                        </td>

                        {/* RMS Logger Image (NO BORDER RADIUS) */}
                        <td style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={row.rms_loger_image}
                            alt="RMS Logger"
                            onClick={() => setPreviewImage({ url: mediaUrl(row.rms_loger_image), title: `${row.site_name} - RMS Logger Photo` })}
                          />
                        </td>

                        {/* 3rd 15% Payment */}
                        <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{row.payment3_date || '—'}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment3_amount ? `₹${num(row.payment3_amount)}` : DASH}
                        </td>
                        <td>
                          <ClaimStatusBadge status={row.payment3_status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ padding: '12px 16px' }}>
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredClaims.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </section>
      </div>

      {/* ── Fullscreen Image Preview Modal ── */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#fff', fontSize: '14px', marginBottom: 10, fontWeight: 600 }}>
              {previewImage.title}
            </div>
            <img
              src={previewImage.url}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 0,
              }}
            />
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ marginTop: 12 }}
              onClick={() => setPreviewImage(null)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ── Raise New Claim Modal ── */}
      {newClaimModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 540,
              borderRadius: 'var(--ax-radius-xl)',
              background: 'var(--ax-surface-solid)',
              overflow: 'hidden',
            }}
          >
            <div className="ax-card__header" style={{ borderBottom: '1px solid var(--ax-border)' }}>
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">PAYMENT CLAIM</span>
                <h3 className="ax-card__title">Raise New SRT Installation Claim</h3>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--subtle ax-btn--sm"
                onClick={() => setNewClaimModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Select Installed SRT Site *
                  </label>
                  <select
                    className="ax-form-select"
                    value={claimSiteId}
                    onChange={(e) => setClaimSiteId(e.target.value)}
                    required
                    disabled={loadingPendingSites}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Choose Installed Site --</option>
                    {pendingSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} - {s.site_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Claim Invoice Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-form-input"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="Enter claim amount (e.g. 50000.00)"
                    required
                    style={{ width: '100%' }}
                  >
                  </input>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Upload Claim Invoice File (PDF / Image) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                    required
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setNewClaimModal(false)}
                  disabled={claimSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={claimSubmitting}
                >
                  {claimSubmitting ? 'Raising Claim...' : 'Confirm & Raise Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Raise 3rd Payment Modal ── */}
      {raise3rdModalSite && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 500,
              borderRadius: 'var(--ax-radius-xl)',
              background: 'var(--ax-surface-solid)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="ax-card__eyebrow">FINAL RELEASE (15%)</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                  Raise 3rd Payment Milestone
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--ax-text-muted)', margin: '4px 0 0' }}>
                  Site: {raise3rdModalSite.site_name}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--subtle ax-btn--sm"
                onClick={() => setRaise3rdModalSite(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handle3rdPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Generation Evidence Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGenImageFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  RMS Datalogger Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRmsImageFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setRaise3rdModalSite(null)}
                  disabled={submitting3rd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={submitting3rd}
                >
                  {submitting3rd ? 'Submitting...' : 'Submit 3rd Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SRT_ClaimRequest;

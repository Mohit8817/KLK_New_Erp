import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
} from '../../../common';
import {
  vendorCommonService,
  resolveCommonMediaUrl,
  type VendorComplaintItem,
  type VendorAssignableItem,
} from '../common-services/vendorCommonService';

/* ───────── Responsive page CSS (Matching Reference Code) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* Modal Details Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export function ViewComplaint() {
  const [searchParams] = useSearchParams();
  const directId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [openComplaints, setOpenComplaints] = useState<VendorComplaintItem[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<VendorComplaintItem[]>([]);
  const [vendorList, setVendorList] = useState<VendorAssignableItem[]>([]);

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected complaint for View Detail modal
  const [detailModalItem, setDetailModalItem] = useState<VendorComplaintItem | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(detailDialogRef, !!detailModalItem);

  // Lightbox Zoom modal for complaint photo
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  // Close Complaint Modal State (C4 & C5)
  const [closeModalItem, setCloseModalItem] = useState<VendorComplaintItem | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeResolvedBy, setCloseResolvedBy] = useState('');
  const [closeMobile, setCloseMobile] = useState('');
  const [closeRemarks, setCloseRemarks] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>('Yes');
  const [closeEmail, setCloseEmail] = useState('');
  const [closeFile, setCloseFile] = useState<File | null>(null);
  const closeDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(closeDialogRef, !!closeModalItem);

  // Assign Complaint Modal State (C6)
  const [assignModalItem, setAssignModalItem] = useState<VendorComplaintItem | null>(null);
  const [assignVendorId, setAssignVendorId] = useState<string>('');
  const [assignRemarks, setAssignRemarks] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const assignDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(assignDialogRef, !!assignModalItem);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load complaints (C3: GET /vendor-view-complaint)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorCommonService.getVendorComplaints();
      setOpenComplaints(data.open_complaints || []);
      setClosedComplaints(data.closed_complaints || []);
      setVendorList(data.vendor || []);

      // If direct id in query, auto open details
      if (directId) {
        const found = [...(data.open_complaints || []), ...(data.closed_complaints || [])].find(
          (c) => String(c.id) === directId
        );
        if (found) setDetailModalItem(found);
      }
    } catch (err: any) {
      console.error('[ViewComplaint] load error:', err);
      setOpenComplaints([]);
      setClosedComplaints([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load vendor complaints register.' });
    } finally {
      setLoading(false);
    }
  }, [directId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combined list based on active tab
  const tabList = useMemo(() => {
    if (activeTab === 'open') return openComplaints;
    if (activeTab === 'closed') return closedComplaints;
    return [...openComplaints, ...closedComplaints];
  }, [activeTab, openComplaints, closedComplaints]);

  // Filtered by Search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabList;

    return tabList.filter((c) => {
      const idMatch = String(c.id).includes(q) || String(c.complaint_id || '').includes(q);
      const textMatch = String(c.complaint || '').toLowerCase().includes(q);
      const woMatch = String(c.workorder || '').toLowerCase().includes(q);
      const nameMatch = String(c.name || '').toLowerCase().includes(q);
      const distMatch = String(c.district || '').toLowerCase().includes(q);
      const mobileMatch = String(c.mobile || '').includes(q);
      return idMatch || textMatch || woMatch || nameMatch || distMatch || mobileMatch;
    });
  }, [tabList, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, setPage]);

  // Metrics
  const totalCount = openComplaints.length + closedComplaints.length;
  const openCount = openComplaints.length;
  const closedCount = closedComplaints.length;

  // Handler: Open Close Complaint Modal (C4)
  const handleOpenCloseModal = async (complaint: VendorComplaintItem) => {
    setCloseModalItem(complaint);
    setCloseResolvedBy(complaint.resolved_by || '');
    setCloseMobile(complaint.mobile || '');
    setCloseRemarks('');
    setCloseSms('Yes');
    setCloseEmail('');
    setCloseFile(null);

    // Call C4 to fetch details
    try {
      const editDetail = await vendorCommonService.getComplaintForEdit(complaint.id);
      if (editDetail) {
        setCloseModalItem((prev) => (prev ? { ...prev, ...editDetail } : editDetail));
      }
    } catch (err) {
      console.warn('[ViewComplaint] fetch edit detail failed:', err);
    }
  };

  // Handler: Submit Close Complaint (C5)
  const handleSubmitClose = async (e: FormEvent) => {
    e.preventDefault();
    if (!closeModalItem) return;

    if (!closeResolvedBy.trim()) {
      setToastMsg({ type: 'danger', text: 'Resolved By technician name is required.' });
      return;
    }
    const cleanMobile = closeMobile.replace(/\D/g, '').trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      setToastMsg({ type: 'danger', text: 'Please enter a valid 10-digit mobile number for resolver.' });
      return;
    }
    if (!closeRemarks.trim()) {
      setToastMsg({ type: 'danger', text: 'Resolution remarks are required.' });
      return;
    }

    setCloseLoading(true);
    try {
      const fd = new FormData();
      fd.append('id', String(closeModalItem.id));
      fd.append('resolved_by', closeResolvedBy.trim());
      fd.append('r_mobile', cleanMobile);
      fd.append('remarks', closeRemarks.trim());
      fd.append('close_sms', closeSms);

      if (closeEmail.trim()) {
        fd.append('r_email', closeEmail.trim());
      }
      if (closeFile) {
        fd.append('r_file', closeFile);
      }

      const res = await vendorCommonService.closeComplaint(fd);
      setToastMsg({ type: 'success', text: res?.message || 'Complaint Closed and Resolved Successfully!' });
      setCloseModalItem(null);
      await loadData();
    } catch (err: any) {
      console.error('[ViewComplaint] close error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to close complaint.' });
    } finally {
      setCloseLoading(false);
    }
  };

  // Handler: Submit Assign Complaint (C6)
  const handleSubmitAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignModalItem) return;

    const nVendor = Number(assignVendorId);
    if (!assignVendorId || isNaN(nVendor)) {
      setToastMsg({ type: 'danger', text: 'Please select a vendor to assign the complaint.' });
      return;
    }

    setAssignLoading(true);
    try {
      const res = await vendorCommonService.assignComplaint({
        complaint_id: assignModalItem.id,
        vendor: nVendor,
        assign_remarks: assignRemarks.trim() || undefined,
      });

      setToastMsg({ type: 'success', text: res?.message || 'Complaint Assigned Successfully!' });
      setAssignModalItem(null);
      setAssignVendorId('');
      setAssignRemarks('');
      await loadData();
    } catch (err: any) {
      console.error('[ViewComplaint] assign error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to assign complaint.' });
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Complaints"
        subtitle="Manage vendor complaint tickets, inspect breakdown reports, assign to partners, and record verified resolution closures"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Complaints' },
          { label: 'View Complaint' },
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

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

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
          value={openCount.toLocaleString('en-IN')}
          sub="Awaiting technician closure"
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
          value={closedCount.toLocaleString('en-IN')}
          sub="Fully resolved & settled"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Available Partners"
          value={vendorList.length.toLocaleString('en-IN')}
          sub="Assignable vendor entities"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Complaints Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Complaints register table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Complaints Register</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabList.length}</span> records
              {' '}· Open: <b className="ax-num">{openCount}</b> · Closed: <b className="ax-num">{closedCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Tab Pills Filter */}
              <div style={{ display: 'inline-flex', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, padding: 2, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <button
                  type="button"
                  className={`ax-btn ax-btn--xs ${activeTab === 'all' ? 'ax-btn--primary' : 'ax-btn--ghost'}`}
                  onClick={() => setActiveTab('all')}
                  style={{ borderRadius: 6, padding: '4px 10px', fontSize: 11 }}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--xs ${activeTab === 'open' ? 'ax-btn--primary' : 'ax-btn--ghost'}`}
                  onClick={() => setActiveTab('open')}
                  style={{ borderRadius: 6, padding: '4px 10px', fontSize: 11 }}
                >
                  Open ({openCount})
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--xs ${activeTab === 'closed' ? 'ax-btn--primary' : 'ax-btn--ghost'}`}
                  onClick={() => setActiveTab('closed')}
                  style={{ borderRadius: 6, padding: '4px 10px', fontSize: 11 }}
                >
                  Closed ({closedCount})
                </button>
              </div>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search complaint, WO, person…"
                size="sm"
                ariaLabel="Search complaints"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = filtered
                    .map((c, i) =>
                      [
                        i + 1,
                        c.complaint_id || c.id,
                        c.workorder || '—',
                        c.complaint,
                        c.name || '—',
                        c.mobile || '—',
                        c.district || '—',
                        formatDate(c.start_date),
                        formatDate(c.close_date),
                        Number(c.status) === 1 ? 'Closed' : 'Open',
                      ].join('\t')
                    )
                    .join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    'Sr. No.,Complaint ID,Work Order,Complaint Issue,Complainant,Mobile,District,Start Date,Close Date,Status',
                    ...filtered.map(
                      (c, i) =>
                        `"${i + 1}","${c.complaint_id || c.id}","${c.workorder || ''}","${(c.complaint || '').replace(/"/g, '""')}","${c.name || ''}","${c.mobile || ''}","${c.district || ''}","${formatDate(c.start_date)}","${formatDate(c.close_date)}","${Number(c.status) === 1 ? 'Closed' : 'Open'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Complaints_Register.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const out = [
                    'Sr. No.,Complaint ID,Work Order,Complaint Issue,Complainant,Mobile,District,Start Date,Close Date,Status',
                    ...filtered.map(
                      (c, i) =>
                        `"${i + 1}","${c.complaint_id || c.id}","${c.workorder || ''}","${(c.complaint || '').replace(/"/g, '""')}","${c.name || ''}","${c.mobile || ''}","${c.district || ''}","${formatDate(c.start_date)}","${formatDate(c.close_date)}","${Number(c.status) === 1 ? 'Closed' : 'Open'}"`
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Vendor_Complaints_Register.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Complaint ID</th>
                <th className="ax-table__th" scope="col">Work Order</th>
                <th className="ax-table__th" scope="col">Issue Description</th>
                <th className="ax-table__th" scope="col">Complainant</th>
                <th className="ax-table__th" scope="col">Mobile</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Start Date</th>
                <th className="ax-table__th" scope="col">Close Date</th>
                <th className="ax-table__th" scope="col">Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading complaints…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No complaints found"
                      message="No complaint records found matching your filter or search query."
                      onClear={() => setSearch('')}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const isClosed = Number(row.status) === 1;
                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--asw-primary)' }}>
                        #{row.complaint_id || row.id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.workorder || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontWeight: 500 }}>
                        {row.complaint}
                      </td>
                      <td className="ax-table__td">{row.name || '—'}</td>
                      <td className="ax-table__td">{row.mobile || '—'}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.start_date || row.created_at)}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.close_date)}
                      </td>
                      <td className="ax-table__td">
                        {isClosed ? (
                          <Badge tone="success">Closed</Badge>
                        ) : (
                          <Badge tone="warning">Open</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setDetailModalItem(row)}
                            title="View full complaint details"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            View
                          </button>

                          {!isClosed && (
                            <>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => setAssignModalItem(row)}
                                title="Assign complaint to vendor"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Assign
                              </button>
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--xs"
                                onClick={() => handleOpenCloseModal(row)}
                                title="Close & Resolve complaint"
                                style={{ padding: '3px 9px', fontSize: 11, fontWeight: 600 }}
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Modal 1: View Details Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="view-complaint-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div ref={detailDialogRef} className="ax-modal__dialog" style={{ maxWidth: 620 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="view-complaint-title" style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Complaint #{detailModalItem.complaint_id || detailModalItem.id}</span>
                {Number(detailModalItem.status) === 1 ? (
                  <Badge tone="success">Closed</Badge>
                ) : (
                  <Badge tone="warning">Open</Badge>
                )}
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailModalItem(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 18px', fontSize: 13, marginBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Work Order</span>
                  <b>{detailModalItem.workorder || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Complainant Name</span>
                  <b>{detailModalItem.name || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Mobile</span>
                  <b>{detailModalItem.mobile || '—'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State / District</span>
                  <b>{detailModalItem.state || '—'} {detailModalItem.district ? `(${detailModalItem.district})` : ''}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Location / Landmark</span>
                  <b>{detailModalItem.location || '—'} {detailModalItem.site ? `· ${detailModalItem.site}` : ''}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Start Date</span>
                  <b>{formatDate(detailModalItem.start_date || detailModalItem.created_at)}</b>
                </div>
                {detailModalItem.close_date && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Close Date</span>
                    <b>{formatDate(detailModalItem.close_date)}</b>
                  </div>
                )}
                {detailModalItem.resolved_by && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Resolved By</span>
                    <b>{detailModalItem.resolved_by} {detailModalItem.r_mobile ? `(${detailModalItem.r_mobile})` : ''}</b>
                  </div>
                )}
              </div>

              {/* Issue Description */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Complaint Issue Description
                </span>
                <p style={{ margin: 0, fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  {detailModalItem.complaint}
                </p>
              </div>

              {detailModalItem.remarks && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Remarks / Observations
                  </span>
                  <p style={{ margin: 0, fontSize: 13, background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                    {detailModalItem.remarks}
                  </p>
                </div>
              )}

              {/* Photos or proof */}
              {detailModalItem.image && (
                <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Complaint Photograph
                  </span>
                  <img
                    src={resolveCommonMediaUrl(detailModalItem.image)}
                    alt="Complaint defect"
                    style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                    onClick={() => setPreviewPhoto({ url: resolveCommonMediaUrl(detailModalItem.image), title: `Complaint #${detailModalItem.complaint_id || detailModalItem.id} Photo` })}
                  />
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              {Number(detailModalItem.status) !== 1 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    const item = detailModalItem;
                    setDetailModalItem(null);
                    handleOpenCloseModal(item);
                  }}
                >
                  Close & Resolve Complaint
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Close Complaint Modal (C4 & C5) ── */}
      {closeModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="close-complaint-title">
          <div className="ax-modal__backdrop" onClick={() => !closeLoading && setCloseModalItem(null)} />
          <div ref={closeDialogRef} className="ax-modal__dialog" style={{ maxWidth: 540 }}>
            <form onSubmit={handleSubmitClose}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="close-complaint-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Close Complaint #{closeModalItem.complaint_id || closeModalItem.id}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Record technician resolution notes and mark complaint as settled.
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-modal__close"
                  onClick={() => setCloseModalItem(null)}
                  disabled={closeLoading}
                  aria-label="Close dialog"
                >
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, fontSize: 12, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <b>Issue:</b> {closeModalItem.complaint} {closeModalItem.workorder ? `· WO: ${closeModalItem.workorder}` : ''}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="close_resolved_by" style={{ fontSize: 12, fontWeight: 600 }}>
                    Resolved By (Technician Name) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="close_resolved_by"
                    type="text"
                    className="ax-input"
                    value={closeResolvedBy}
                    onChange={(e) => setCloseResolvedBy(e.target.value)}
                    placeholder="e.g. Sunil Sharma"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="close_mobile" style={{ fontSize: 12, fontWeight: 600 }}>
                    Resolver Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="close_mobile"
                    type="tel"
                    className="ax-input"
                    value={closeMobile}
                    onChange={(e) => setCloseMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="e.g. 9876500002"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="close_remarks" style={{ fontSize: 12, fontWeight: 600 }}>
                    Resolution Remarks <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    id="close_remarks"
                    className="ax-input"
                    rows={3}
                    value={closeRemarks}
                    onChange={(e) => setCloseRemarks(e.target.value)}
                    placeholder="Describe how the complaint was fixed (e.g. Battery replaced / wiring reconnected)..."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="close_sms" style={{ fontSize: 12, fontWeight: 600 }}>
                      Send Close SMS? <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="close_sms"
                      className="ax-input"
                      value={closeSms}
                      onChange={(e) => setCloseSms(e.target.value as 'Yes' | 'No')}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="close_email" style={{ fontSize: 12, fontWeight: 600 }}>
                      Resolver Email (Optional)
                    </label>
                    <input
                      id="close_email"
                      type="email"
                      className="ax-input"
                      value={closeEmail}
                      onChange={(e) => setCloseEmail(e.target.value)}
                      placeholder="e.g. tech@klkerp.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="close_file" style={{ fontSize: 12, fontWeight: 600 }}>
                    Resolution Proof Document / Photo (Optional, Max 5MB)
                  </label>
                  <input
                    id="close_file"
                    type="file"
                    accept="image/*,.pdf"
                    className="ax-input"
                    onChange={(e) => setCloseFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setCloseModalItem(null)}
                  disabled={closeLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={closeLoading}
                >
                  {closeLoading ? 'Closing Ticket…' : 'Submit Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Assign Complaint Modal (C6) ── */}
      {assignModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="assign-complaint-title">
          <div className="ax-modal__backdrop" onClick={() => !assignLoading && setAssignModalItem(null)} />
          <div ref={assignDialogRef} className="ax-modal__dialog" style={{ maxWidth: 480 }}>
            <form onSubmit={handleSubmitAssign}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="assign-complaint-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Assign Complaint #{assignModalItem.complaint_id || assignModalItem.id}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Forward this grievance ticket to another authorized vendor.
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-modal__close"
                  onClick={() => setAssignModalItem(null)}
                  disabled={assignLoading}
                  aria-label="Close dialog"
                >
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, fontSize: 12, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <b>Issue:</b> {assignModalItem.complaint}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="assign_vendor_select" style={{ fontSize: 12, fontWeight: 600 }}>
                    Select Vendor <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="assign_vendor_select"
                    className="ax-input"
                    value={assignVendorId}
                    onChange={(e) => setAssignVendorId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Target Vendor --</option>
                    {vendorList.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.name} ({v.vendor_id || `#${v.id}`})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="assign_remarks_input" style={{ fontSize: 12, fontWeight: 600 }}>
                    Assignment Remarks (Optional)
                  </label>
                  <textarea
                    id="assign_remarks_input"
                    className="ax-input"
                    rows={3}
                    value={assignRemarks}
                    onChange={(e) => setAssignRemarks(e.target.value)}
                    placeholder="Instructions or notes for the assigned vendor..."
                  />
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setAssignModalItem(null)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={assignLoading || !assignVendorId}
                >
                  {assignLoading ? 'Assigning…' : 'Assign Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Photo Lightbox Modal ── */}
      {previewPhoto && (
        <div className="ax-modal" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setPreviewPhoto(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 700 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" style={{ fontSize: 14, fontWeight: 700 }}>
                {previewPhoto.title}
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setPreviewPhoto(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 12, textAlign: 'center', background: '#0f172a' }}>
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <a href={previewPhoto.url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
                Open in new tab ↗
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setPreviewPhoto(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewComplaint;

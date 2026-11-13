import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  getJammuMediaCandidates,
  type JammuRescoPaymentItem,
  type JammuRescoClaimData,
} from '../../../../V-Portal/jammu/jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const ClaimStatusBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised (Under Audit)</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentStatusBadge = ({ status, isClaimRaised }: { status?: number | string; isClaimRaised?: boolean }) => {
  if (isClaimRaised === false) return <Badge tone="neutral">Not Raised</Badge>;
  const s = Number(status ?? 0);
  if (s === 1 || s === 2) return <Badge tone="success">Disbursed</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Invoice Lightbox Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function InvoicePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf ? 'ready' : 'loading');
  }, [url, isPdf]);

  return (
    <Modal open onClose={onClose} labelledBy="claim-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="claim-preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Invoice Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading invoice…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Invoice document could not be previewed inline. Try opening it in a new tab.</div>
          )}

          {isPdf ? (
            <iframe
              src={url}
              title={title || 'Invoice PDF Preview'}
              style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
            />
          ) : (
            <img
              key={url}
              src={url}
              alt={title || 'Invoice'}
              onLoad={() => setStatus('ready')}
              onError={() => setStatus('error')}
              style={{
                display: status === 'ready' ? 'block' : 'none',
                margin: 'auto',
                borderRadius: 0,
                ...(zoom === 1
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          )}
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        {!isPdf ? (
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
        ) : <div />}
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
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

/* ───────── Styles ───────── */
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
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .solar-erp-page .swp-claim-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    padding: 0 20px;
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .solar-erp-page .swp-claim-tab-btn {
    padding: 10px 16px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--ax-text-muted, #64748b);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
  }
  .solar-erp-page .swp-claim-tab-btn.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }

  /* Modals */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
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
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const RESCO_PAYMENT_HEADERS = [
  'S.No.',
  'Date',
  'Claim Milestone',
  'Sites',
  'Invoice',
  'Amount',
  'Remarks',
  'Status',
  'Payment Amount',
  'Payment Balance',
  'Payment Date',
  'Payment Remarks',
  'Payment Status',
  'Action',
];

type TabKey = 'all' | 'pay40' | 'pay30_1' | 'pay30_2';

export const ViewRescoClaim: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [claimData, setClaimData] = useState<JammuRescoClaimData>({
    payments: [],
    pay1: [],
    pay2: [],
    pay3: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState<boolean>(false);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [sitesDropdown, setSitesDropdown] = useState<any[]>([]);
  const [claimPayType, setClaimPayType] = useState<number>(1);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState<string>('');
  const [claimError, setClaimError] = useState<string | null>(null);

  // Audit / Update Claim Modal State
  const [auditModalItem, setAuditModalItem] = useState<JammuRescoPaymentItem | null>(null);
  const [auditClaimStatus, setAuditClaimStatus] = useState<string>('2');
  const [auditPayAmount, setAuditPayAmount] = useState<string>('');
  const [auditPayRemarks, setAuditPayRemarks] = useState<string>('');
  const [savingAudit, setSavingAudit] = useState<boolean>(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Claims from API
  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getInstallationClaims();
      setClaimData(res);
    } catch (err: any) {
      console.error('[Admin View Resco Claim] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load claims.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  // Load dropdown sites for raise modal
  const loadSitesForModal = async () => {
    try {
      const names = await jammuRescoService.getInstallableSiteNames();
      setSitesDropdown(Array.isArray(names) ? names : []);
    } catch {
      setSitesDropdown([]);
    }
  };

  const handleOpenRaiseModal = () => {
    setRaiseModalOpen(true);
    loadSitesForModal();
  };

  // Switch tab data
  const tabPayments = useMemo(() => {
    if (activeTab === 'pay40') return claimData.pay1 || [];
    if (activeTab === 'pay30_1') return claimData.pay2 || [];
    if (activeTab === 'pay30_2') return claimData.pay3 || [];
    return claimData.payments || [];
  }, [activeTab, claimData]);

  // Filtered
  const filtered = useMemo(() => {
    return tabPayments.filter((r) => {
      if (statusFilter === 'approved' && Number(r.status) !== 2) return false;
      if (statusFilter === 'rejected' && Number(r.status) !== 3) return false;
      if (statusFilter === 'raised' && Number(r.status) !== 1) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sName = String(r.site_name || r.sites || '').toLowerCase();
        const cType = String(r.claim || '').toLowerCase();
        const rem = String(r.remarks || r.inst_remarks || '').toLowerCase();
        const inv = String(r.invoice || '').toLowerCase();
        if (!sName.includes(q) && !cType.includes(q) && !rem.includes(q) && !inv.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tabPayments, statusFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filtered,
    initialPageSize: 10,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, activeTab, setPage]);

  // Metrics
  const totalClaimsCount = claimData.payments.length;
  const approvedClaimsCount = useMemo(
    () => claimData.payments.filter((p) => Number(p.status) === 2).length,
    [claimData]
  );
  const totalClaimAmount = useMemo(
    () => claimData.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    [claimData]
  );
  const totalDisbursedAmount = useMemo(
    () => claimData.payments.reduce((acc, p) => acc + (Number(p.payment_amount) || 0), 0),
    [claimData]
  );

  // Submit Raise Claim
  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    if (!selectedSiteId || !claimAmount) {
      setClaimError('Site selection and claim amount are required.');
      return;
    }
    setSubmittingClaim(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('pay', String(claimPayType));
      fd.append('amount', claimAmount);
      fd.append('remarks', claimRemarks);
      if (claimInvoiceFile) {
        fd.append('invoice', claimInvoiceFile);
      }

      await jammuRescoService.addClaim(fd);
      setToastMsg({ type: 'success', text: 'Installation claim submitted successfully!' });
      setRaiseModalOpen(false);
      setSelectedSiteId('');
      setClaimAmount('');
      setClaimInvoiceFile(null);
      setClaimRemarks('');
      loadClaims();
    } catch (err: any) {
      console.error('[Admin Raise Claim] error:', err);
      setClaimError(err?.message || 'Failed to submit claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit Audit / Update Claim
  const handleSaveAudit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auditModalItem) return;
    setSavingAudit(true);
    try {
      const fd = new FormData();
      fd.append('id', String(auditModalItem.id));
      fd.append('status', auditClaimStatus);
      if (auditPayAmount) fd.append('payment_amount', auditPayAmount);
      if (auditPayRemarks) fd.append('payment_remarks', auditPayRemarks);

      await jammuRescoService.updateClaim(fd);
      setToastMsg({ type: 'success', text: 'Claim audit updated successfully!' });
      setAuditModalItem(null);
      loadClaims();
    } catch (err: any) {
      console.error('[Admin Audit Claim] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to update claim.' });
    } finally {
      setSavingAudit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoPaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => txt(r, 'date') || txt(r, 'created_at') },
      { header: 'Claim Milestone', accessor: (r) => r.claim || '—' },
      { header: 'Sites', accessor: (r) => r.site_name || r.sites || '—' },
      { header: 'Claim Amount', accessor: (r) => (r.amount !== undefined ? `Rs. ${Number(r.amount).toLocaleString('en-IN')}` : '—') },
      { header: 'Remarks', accessor: (r) => r.remarks || r.inst_remarks || '—' },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Approved' : Number(r.status) === 3 ? 'Rejected' : 'Raised') },
      { header: 'Payment Amount', accessor: (r) => (r.payment_amount !== undefined ? `Rs. ${Number(r.payment_amount).toLocaleString('en-IN')}` : '—') },
      { header: 'Balance', accessor: (r) => (r.balance !== undefined ? `Rs. ${Number(r.balance).toLocaleString('en-IN')}` : '—') },
      { header: 'Payment Date', accessor: (r) => txt(r, 'payment_date') || '—' },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || '—' },
      { header: 'Payment Status', accessor: (r) => (Number(r.payment_status) === 1 || Number(r.payment_status) === 2 ? 'Disbursed' : 'Pending') },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - View Claims"
        subtitle="Review vendor installation claim requests, milestone breakdown (40% / 30% / 30%), claim approvals, and invoices"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'View Claims' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleOpenRaiseModal}
            >
              + Raise New Claim
            </button>
            <Link to="/vendor-management/jammu/installation/resco/view-payment" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Payments
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims Raised"
          value={totalClaimsCount.toLocaleString('en-IN')}
          sub="Vendor payment claims"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Approved Claims"
          value={approvedClaimsCount.toLocaleString('en-IN')}
          sub="Sanctioned by department"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Total Claim Value"
          value={`Rs. ${totalClaimAmount.toLocaleString('en-IN')}`}
          sub="Gross claim invoices"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Total Disbursed"
          value={`Rs. ${totalDisbursedAmount.toLocaleString('en-IN')}`}
          sub="Released to vendors"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-5" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card with Tabs ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Claims Register Table">
        {/* Milestone Sub-Tabs */}
        <div className="swp-claim-tabs" role="tablist">
          <button
            type="button"
            className={`swp-claim-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            role="tab"
            aria-selected={activeTab === 'all'}
          >
            All Claims ({claimData.payments.length})
          </button>
          <button
            type="button"
            className={`swp-claim-tab-btn ${activeTab === 'pay40' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay40')}
            role="tab"
            aria-selected={activeTab === 'pay40'}
          >
            Stage 1 (40% Milestone) ({claimData.pay1.length})
          </button>
          <button
            type="button"
            className={`swp-claim-tab-btn ${activeTab === 'pay30_1' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay30_1')}
            role="tab"
            aria-selected={activeTab === 'pay30_1'}
          >
            Stage 2 (30% Milestone) ({claimData.pay2.length})
          </button>
          <button
            type="button"
            className={`swp-claim-tab-btn ${activeTab === 'pay30_2' ? 'active' : ''}`}
            onClick={() => setActiveTab('pay30_2')}
            role="tab"
            aria-selected={activeTab === 'pay30_2'}
          >
            Stage 3 (30% Final) ({claimData.pay3.length})
          </button>
        </div>

        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Installation Claims Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabPayments.length}</span> claims
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="raised">Raised (Pending)</option>
                <option value="rejected">Rejected</option>
              </select>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, claim, remarks…"
                size="sm"
                ariaLabel="Search claims"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, 'Jammu_RESCO_Claims')}
                onExportExcel={() => exportToExcel(filtered, exportCols, 'Jammu_RESCO_Claims')}
                onExportPDF={() => exportToPDF(filtered, exportCols, 'Jammu RESCO Claims Register')}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                {RESCO_PAYMENT_HEADERS.map((h) => (
                  <th key={h} className="ax-table__th" scope="col" style={h === 'Action' ? { textAlign: 'center' } : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={RESCO_PAYMENT_HEADERS.length} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claims from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={RESCO_PAYMENT_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claim records found"
                      message="No claims match your current selection or tab filter."
                      onClear={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => {
                  const invoiceUrl = row.invoice ? resolveJammuMediaUrl(row.invoice) : null;
                  const isClaimRaised = row.status !== undefined && Number(row.status) > 0;

                  return (
                    <tr key={row.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{txt(row, 'date') || txt(row, 'created_at') || DASH}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">
                          {row.claim || `Stage ${row.pay || 1}`}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || row.sites || DASH}
                      </td>

                      {/* Invoice Preview */}
                      <td className="ax-table__td">
                        {invoiceUrl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => openPreview(invoiceUrl, `Invoice: ${row.site_name || row.id}`)}
                              style={{ height: 26, padding: '0 8px', fontSize: 11, color: '#2563eb' }}
                            >
                              Preview Invoice
                            </button>
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ height: 26, padding: '0 6px', fontSize: 11 }}
                              title="Open in new window"
                            >
                              ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>No Invoice</span>
                        )}
                      </td>

                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        {row.amount !== undefined ? `Rs. ${Number(row.amount).toLocaleString('en-IN')}` : DASH}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.remarks || row.inst_remarks || DASH}
                      </td>

                      {/* Claim Status */}
                      <td className="ax-table__td">
                        <ClaimStatusBadge status={row.status} />
                      </td>

                      <td className="ax-table__td ax-num" style={{ color: '#16a34a', fontWeight: 600 }}>
                        {row.payment_amount !== undefined && Number(row.payment_amount) > 0
                          ? `Rs. ${Number(row.payment_amount).toLocaleString('en-IN')}`
                          : DASH}
                      </td>

                      <td className="ax-table__td ax-num" style={{ color: '#d97706' }}>
                        {row.balance !== undefined ? `Rs. ${Number(row.balance).toLocaleString('en-IN')}` : DASH}
                      </td>

                      <td className="ax-table__td" style={{ fontSize: 12 }}>{txt(row, 'payment_date') || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 11 }}>
                        {row.payment_remarks || DASH}
                      </td>

                      <td className="ax-table__td">
                        <PaymentStatusBadge status={row.payment_status} isClaimRaised={isClaimRaised} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => {
                            setAuditModalItem(row);
                            setAuditClaimStatus(String(row.status ?? '2'));
                            setAuditPayAmount(String(row.payment_amount || row.amount || ''));
                            setAuditPayRemarks(row.payment_remarks || '');
                          }}
                          style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                        >
                          Audit Claim
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Left-aligned Pagination ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>

      {/* ── Raise Claim Modal ── */}
      {raiseModalOpen && (
        <Modal open onClose={() => setRaiseModalOpen(false)} labelledBy="raise-modal-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleRaiseSubmit}>
            <div className="ax-modal__header">
              <h3 id="raise-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Raise Installation Claim
              </h3>
              <button type="button" className="ax-modal__close" onClick={() => setRaiseModalOpen(false)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              {claimError && (
                <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
                  <div className="ax-alert__text">{claimError}</div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Select Installed Site <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Installed Site --</option>
                  {sitesDropdown.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name || `Site #${s.id}`} {s.district ? `(${s.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Claim Milestone Stage <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={claimPayType}
                  onChange={(e) => setClaimPayType(Number(e.target.value))}
                  required
                >
                  <option value={1}>Stage 1 - 40% Milestone</option>
                  <option value={2}>Stage 2 - 30% Milestone</option>
                  <option value={3}>Stage 3 - 30% Milestone (Final)</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Claim Amount (Rs.) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Upload Tax Invoice (PDF or Image)
                </label>
                <input
                  type="file"
                  className="ax-input"
                  style={{ height: 42, width: '100%', padding: '6px 10px' }}
                  accept="application/pdf,image/*"
                  onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Remarks / Notes
                </label>
                <textarea
                  className="ax-input"
                  rows={3}
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  placeholder="Enter invoice details, milestone certificate references…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setRaiseModalOpen(false)}
                disabled={submittingClaim}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={submittingClaim}
              >
                {submittingClaim ? 'Submitting…' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Audit Claim Modal ── */}
      {auditModalItem && (
        <Modal open onClose={() => setAuditModalItem(null)} labelledBy="audit-claim-title" dialogClass="ax-modal__dialog--md">
          <form onSubmit={handleSaveAudit}>
            <div className="ax-modal__header">
              <div>
                <h3 id="audit-claim-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Audit Vendor Claim
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Site: <b>{auditModalItem.site_name || auditModalItem.sites}</b> · Claim Amount: <b>Rs. {Number(auditModalItem.amount).toLocaleString('en-IN')}</b>
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setAuditModalItem(null)} aria-label="Close modal">
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Claim Approval Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={auditClaimStatus}
                  onChange={(e) => setAuditClaimStatus(e.target.value)}
                  required
                >
                  <option value="2">Approve Claim</option>
                  <option value="3">Reject Claim</option>
                  <option value="1">Keep as Pending</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Approved Disbursement Amount (Rs.)
                </label>
                <input
                  type="number"
                  className="ax-input"
                  style={{ height: 42, width: '100%' }}
                  value={auditPayAmount}
                  onChange={(e) => setAuditPayAmount(e.target.value)}
                  placeholder="e.g. 150000"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Payment / Audit Remarks
                </label>
                <textarea
                  className="ax-input"
                  rows={3}
                  style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                  value={auditPayRemarks}
                  onChange={(e) => setAuditPayRemarks(e.target.value)}
                  placeholder="Enter audit approval remarks, deduction reasons, or payment instructions…"
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setAuditModalItem(null)}
                disabled={savingAudit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={savingAudit}
              >
                {savingAudit ? 'Saving Audit…' : 'Save Claim Audit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Invoice Preview Modal ── */}
      {preview && (
        <InvoicePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default ViewRescoClaim;

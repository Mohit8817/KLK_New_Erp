import { useState, useEffect, useMemo, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuExpenseService,
  resolveJammuMediaUrl,
  getJammuMediaCandidates,
  type JammuExpenseClaimItem,
} from '../../jammu-services';
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
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const ClaimStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 1);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="info">Raised (Pending Audit)</Badge>;
};

const PayStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Disbursed</Badge>;
  if (s === 2) return <Badge tone="neutral">Partially Paid</Badge>;
  return <Badge tone="warning">Pending Disbursal</Badge>;
};

const formatDate = (d?: string | null): string => {
  if (!d) return DASH;
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === DASH || trimmed === 'null' || trimmed === 'undefined') return DASH;

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

/* ───────── Top KPI Card ───────── */
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

/* ───────── Modal Component (FocusTrap & Portal) ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Lightbox Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="claim-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="claim-preview-title">{title || 'Receipt Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading receipt voucher…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Receipt document could not be previewed directly. Try opening in a new tab.</div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Receipt'}
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
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Receipt Thumbnail Component ───────── */
function ReceiptThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getJammuMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview receipt"
    />
  );
}

/* ───────── CSS Styles matching Design System ───────── */
const OVERLAY_CSS = `
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
    transition: all 0.15s ease;
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

  .ax-modal img { border-radius: 0 !important; }

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

  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
`;

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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

export function ViewExpenses() {
  const [expenses, setExpenses] = useState<JammuExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('all');
  const [payStatusFilter, setPayStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Invoice / receipt preview lightbox modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Edit Modal State (API 18 & 19)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [sitesDropdown, setSitesDropdown] = useState<Array<{ id: number; site_name: string; site_code?: string }>>([]);
  const [editForm, setEditForm] = useState({
    site_id: '',
    purpose: '',
    date: '',
    amount: '',
    remarks: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load claims from API 15: GET /jammu/installation-expenses
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuExpenseService.getExpenseClaims();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Jammu SRT ViewExpenses] load error:', err);
      setExpenses([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load expense claims register from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Open Edit Modal (API 18: GET /jammu/installation-expenses-edit?claim_id={id})
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditFile(null);
    setEditError(null);

    try {
      const data = await jammuExpenseService.editExpenseClaimLoad(id);
      if (data?.claim) {
        setEditForm({
          site_id: String(data.claim.site_id || ''),
          purpose: data.claim.purpose || '',
          date: data.claim.date ? data.claim.date.split('T')[0] : new Date().toISOString().slice(0, 10),
          amount: String(data.claim.amount || ''),
          remarks: data.claim.remarks || '',
        });
      }
      setSitesDropdown(Array.isArray(data?.srt70mw) ? data.srt70mw : []);
    } catch (err: any) {
      console.error('[Jammu SRT Edit Expense] load error:', err);
      const match = expenses.find((e) => e.id === id);
      setEditForm({
        site_id: String(match?.site_id || match?.id || ''),
        purpose: match?.purpose || '',
        date: match?.date ? match.date.split('T')[0] : new Date().toISOString().slice(0, 10),
        amount: String(match?.amount || ''),
        remarks: match?.remarks || '',
      });
      setSitesDropdown([]);
      setEditError(err?.message || 'Could not fetch full site list for edit.');
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit Handler (API 19: POST /jammu/installation-expenses-update)
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!editForm.site_id) {
      setEditError('Please select a site.');
      return;
    }
    if (!editForm.purpose.trim()) {
      setEditError('Purpose is required.');
      return;
    }
    const numAmt = Number(editForm.amount);
    if (!editForm.amount || isNaN(numAmt) || numAmt < 1) {
      setEditError('Please enter a valid amount (minimum ₹ 1).');
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);

    try {
      const fd = new FormData();
      // Fields per API 19
      fd.append('claim_id', String(editingId));
      fd.append('site_id', editForm.site_id);
      fd.append('project', 'srt70mw');
      fd.append('date', editForm.date);
      fd.append('claim_amount', String(numAmt));
      fd.append('amount', String(numAmt));
      fd.append('purpose', editForm.purpose.trim());

      if (editForm.remarks.trim()) {
        fd.append('remarks', editForm.remarks.trim());
      }
      if (editFile) {
        fd.append('claim_invoice', editFile);
        fd.append('file', editFile);
      }

      const res = await jammuExpenseService.updateExpenseClaim(fd);

      setToastMsg({
        type: 'success',
        text: res.message || 'Expense claim updated successfully! Claim status reset to Raised.',
      });
      setEditModalOpen(false);
      await loadExpenses();
    } catch (err: any) {
      console.error('[Jammu SRT Edit Expense] submit error:', err);
      setEditError(err?.message || 'Failed to update expense claim.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // KPIs calculation
  const kpis = useMemo(() => {
    const totalCount = expenses.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let disbursedCount = 0;
    let disbursedAmount = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalAmount += amt;
      if (Number(e.claim_status) === 2) {
        approvedCount++;
        approvedAmount += amt;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
      if (Number(e.pay_status) === 1) {
        disbursedCount++;
        disbursedAmount += amt;
      }
    });

    return {
      totalCount,
      totalAmount,
      approvedCount,
      approvedAmount,
      pendingCount,
      pendingAmount,
      disbursedCount,
      disbursedAmount,
    };
  }, [expenses]);

  // Distinct purposes
  const distinctPurposes = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.purpose) set.add(e.purpose.trim());
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let list = expenses;

    if (claimStatusFilter === 'approved') {
      list = list.filter((e) => Number(e.claim_status) === 2);
    } else if (claimStatusFilter === 'pending') {
      list = list.filter((e) => Number(e.claim_status) === 1);
    }

    if (payStatusFilter === 'paid') {
      list = list.filter((e) => Number(e.pay_status) === 1);
    } else if (payStatusFilter === 'partial') {
      list = list.filter((e) => Number(e.pay_status) === 2);
    } else if (payStatusFilter === 'unpaid') {
      list = list.filter((e) => Number(e.pay_status) === 0);
    }

    if (purposeFilter !== 'all') {
      list = list.filter((e) => e.purpose?.trim().toLowerCase() === purposeFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const amtStr = String(e.amount || '');
        return (
          String(e.id).includes(q) ||
          e.site_name?.toLowerCase().includes(q) ||
          e.site_code?.toLowerCase().includes(q) ||
          e.purpose?.toLowerCase().includes(q) ||
          e.remarks?.toLowerCase().includes(q) ||
          e.approved_remarks?.toLowerCase().includes(q) ||
          e.claim_status_remarks?.toLowerCase().includes(q) ||
          e.date?.toLowerCase().includes(q) ||
          amtStr.includes(q)
        );
      });
    }

    return list;
  }, [expenses, search, claimStatusFilter, payStatusFilter, purposeFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredExpenses, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, claimStatusFilter, payStatusFilter, purposeFilter, setPage]);

  const hasFilters = search.trim() !== '' || claimStatusFilter !== 'all' || payStatusFilter !== 'all' || purposeFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setClaimStatusFilter('all');
    setPayStatusFilter('all');
    setPurposeFilter('all');
    setPage(1);
  };

  // Export Columns definition (Exact columns per specification)
  const exportCols: ExportColumn<JammuExpenseClaimItem>[] = useMemo(
    () => [
      { header: 'Sr No', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => formatDate(r.date) },
      { header: 'State', accessor: (r) => r.state || 'Jammu' },
      { header: 'Project', accessor: (r) => r.project || 'SRT 70MW' },
      { header: 'Type', accessor: (r) => r.type || 'Installation' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Purpose', accessor: (r) => r.purpose || DASH },
      { header: 'Claim Amount', accessor: (r) => (r.amount ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Invoice File', accessor: (r) => r.file || DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      {
        header: 'Claim Status',
        accessor: (r) => (Number(r.claim_status) === 2 ? 'Approved' : 'Raised'),
      },
      {
        header: 'Claim Status Remarks',
        accessor: (r) => r.approved_remarks || r.claim_status_remarks || r.status_remarks || DASH,
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SRT_70MW_Installation_Expenses';
  const fileTitle = 'Jammu SRT 70MW Installation Expense Requisition Ledger';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
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
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SRT 70MW - View Expenses"
        subtitle="Audit vendor installation expense claims, verify voucher attachments, and track department reimbursal states"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Expenses' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadExpenses}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation-expenses/srt-70mw/request-expenses" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Request Expense</span>
            </Link>
            <Link to="/v/jammu/installation-expenses/srt-70mw/view-payments" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Payments</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims"
          value={kpis.totalCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.totalAmount.toLocaleString('en-IN')} gross claimed`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Approved Claims"
          value={kpis.approvedCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.approvedAmount.toLocaleString('en-IN')} sanctioned`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Audit"
          value={kpis.pendingCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.pendingAmount.toLocaleString('en-IN')} in review`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Disbursed / Paid"
          value={kpis.disbursedCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.disbursedAmount.toLocaleString('en-IN')} paid`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Expense Ledger Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu SRT 70MW Expense Claims Ledger">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Installation Expenses</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredExpenses.length}</span> of <span className="ax-num">{expenses.length}</span> claims
              {' '}· Approved <b className="ax-num">{kpis.approvedCount}</b> · Pending <b className="ax-num">{kpis.pendingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Purpose Filter */}
              {distinctPurposes.length > 0 && (
                <select
                  id="jammu_exp_purpose_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={purposeFilter}
                  onChange={(e) => {
                    setPurposeFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by purpose head"
                >
                  <option value="all">All Purpose Heads</option>
                  {distinctPurposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}

              {/* Audit Status Filter */}
              <select
                id="jammu_exp_audit_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={claimStatusFilter}
                onChange={(e) => {
                  setClaimStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by audit status"
              >
                <option value="all">All Audit Status</option>
                <option value="pending">Pending Audit</option>
                <option value="approved">Approved</option>
              </select>

              {/* Payout Status Filter */}
              <select
                id="jammu_exp_payout_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={payStatusFilter}
                onChange={(e) => {
                  setPayStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by payout status"
              >
                <option value="all">All Payouts</option>
                <option value="paid">Disbursed</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Pending</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, purpose, code, amount…"
                size="sm"
                ariaLabel="Search expense requisitions"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredExpenses, exportCols)}
                onExportCSV={() => exportToCSV(filteredExpenses, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredExpenses, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredExpenses, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1250 }}
          >
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr No</th>
                <th className="ax-table__th" scope="col">Date</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">Project</th>
                <th className="ax-table__th" scope="col">Type</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Purpose</th>
                <th className="ax-table__th" scope="col">Claim Amount</th>
                <th className="ax-table__th" scope="col">Invoice File</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                <th className="ax-table__th" scope="col">Claim Status Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={14} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading expense claims from server…
                  </td>
                </tr>
              )}
              {!loading && filteredExpenses.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={14} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No records match your filters. Try clearing your query.'
                          : 'No installation expense requisitions submitted yet. Click "+ Request Expense" to initiate a claim.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const receiptUrl = resolveJammuMediaUrl(row.file);
                  const isApproved = Number(row.claim_status) === 2;

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {formatDate(row.date)}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu'}</td>
                      <td className="ax-table__td">{row.project || 'SRT 70MW'}</td>
                      <td className="ax-table__td">{row.type || 'Installation'}</td>
                      <td className="ax-table__td"><b>{row.district || DASH}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.purpose || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {row.amount ? `₹ ${Number(row.amount).toLocaleString('en-IN')}` : DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.file ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ReceiptThumbnail
                              src={row.file}
                              alt={`Receipt - ${row.site_name}`}
                              onPreview={openPreview}
                              size={28}
                            />
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
                              title="Open receipt voucher in new tab"
                            >
                              View ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <ClaimStatusBadge status={row.claim_status} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.approved_remarks || row.claim_status_remarks || row.status_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--ax-text-muted, #64748b)',
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              borderRadius: 6,
                            }}
                            title="Approved claims are locked for audit integrity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, color: '#10b981' }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => handleOpenEdit(row.id)}
                            title="Edit expense claim"
                            style={{ padding: '3px 10px', fontSize: 11 }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Image Lightbox Zoom Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Expense Claim Modal (API 18 & 19) ── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="edit-exp-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleSaveEdit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="edit-exp-title">
                Edit Expense Requisition #{editingId}
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Update claim details, voucher attachment, or revised billing amount.
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editError && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editError}
              </div>
            )}

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#2563eb' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim details from server…
              </div>
            ) : (
              <>
                {/* Site Selection */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_site_select">
                    <span>Site Allocation</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <select
                    id="edit_site_select"
                    className="ax-input"
                    style={{ width: '100%', height: 42 }}
                    value={editForm.site_id}
                    onChange={(e) => setEditForm({ ...editForm, site_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Allocated Site --</option>
                    {sitesDropdown.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.site_name} {s.site_code ? `[${s.site_code}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Date */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_exp_date">
                    <span>Date of Expense</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input
                    id="edit_exp_date"
                    type="date"
                    className="ax-input"
                    style={{ width: '100%', height: 42 }}
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                  />
                </div>

                {/* Purpose */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_purpose">
                    <span>Expense Purpose / Head</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input
                    id="edit_purpose"
                    type="text"
                    className="ax-input"
                    style={{ width: '100%', height: 42 }}
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    placeholder="Enter purpose description"
                    required
                  />
                </div>

                {/* Amount */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_amount">
                    <span>Claim Amount (₹)</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input
                    id="edit_amount"
                    type="number"
                    min="1"
                    step="0.01"
                    className="ax-input"
                    style={{ width: '100%', height: 42 }}
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    required
                  />
                </div>

                {/* Replace File */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_receipt_file">
                    <span>Replace Receipt Voucher (Optional, Max 5MB)</span>
                  </label>
                  <input
                    id="edit_receipt_file"
                    type="file"
                    accept=".pdf,image/*"
                    className="ax-input"
                    style={{ width: '100%', padding: '8px' }}
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                  {editFile && (
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                      ✓ Selected replacement: {editFile.name} ({(editFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div className="ax-modern-field">
                  <label className="ax-modern-label" htmlFor="edit_remarks">
                    <span>Field Remarks / Justification</span>
                  </label>
                  <textarea
                    id="edit_remarks"
                    className="ax-input"
                    style={{ width: '100%', padding: '10px 12px', minHeight: 65 }}
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEdit || editLoading}
            >
              {submittingEdit ? 'Saving Changes…' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ViewExpenses;

import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  assamSwpService,
  resolveAssamMediaUrl,
  type ClaimItem,
  type ClaimEligibleSite,
} from '../../assam-services';
import { SAMPLE_PAYMENT_SITES } from '../../../../../data/demo/assamPayments';

/* ───────── Responsive page CSS (Exact Bihar SRT / ULA reference, all columns scrollable) ───────── */
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* Multi-select site picker */
  .asw-site-select-box {
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-md, 8px);
    padding: 8px 12px;
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .asw-site-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 6px 8px;
    border-radius: var(--ax-radius-sm, 4px);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .asw-site-item:hover {
    background: var(--ax-surface-solid, #ffffff);
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

/* ───────── Overlay CSS (modals & modern fields matching Bihar SSL reference) ───────── */
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

  /* ── Modern Form Controls (Matching Bihar SSL Supply Inspection design) ── */
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
  .ax-modern-input-wrap {
    display: flex; align-items: center;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px; background: var(--ax-surface-solid, #ffffff);
    transition: all 0.2s ease; overflow: hidden;
  }
  .ax-modern-input-wrap:focus-within {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-addon {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 13px; height: 42px; background: var(--ax-surface-subtle, #f8fafc);
    border-right: 1.5px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text-muted, #64748b); font-size: 14px; font-weight: 700; user-select: none;
  }
  .ax-modern-input {
    width: 100%; height: 42px; padding: 0 14px;
    border: none; outline: none; font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a); background: transparent;
  }
  .ax-modern-input::placeholder { color: var(--ax-text-muted, #94a3b8); }
  .ax-modern-select {
    width: 100%; height: 42px; padding: 0 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px; font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a); background: var(--ax-surface-solid, #ffffff);
    outline: none; transition: all 0.2s ease;
  }
  .ax-modern-select:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-textarea {
    width: 100%; min-height: 80px; padding: 10px 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1); border-radius: 9px;
    font-size: 13px; color: var(--ax-text-strong, #0f172a);
    background: var(--ax-surface-solid, #ffffff); outline: none;
    transition: all 0.2s ease; resize: vertical; line-height: 1.5;
  }
  .ax-modern-textarea:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #2563eb) 18%, transparent);
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  @media (max-width: 540px) {
    .ax-modern-grid-2 { grid-template-columns: 1fr; }
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
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 580,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h4>
            {subtitle && <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ax-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component (matching Bihar SRT / ULA reference) ── */
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

const fmtMoney = (val?: string | number) => {
  const n = Number(val || 0);
  return '₹' + n.toLocaleString('en-IN');
};

const fmtDate = (s?: string) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return s.slice(0, 10);
};

const renderClaimStatusBadge = (status: number) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Raised (Pending)</Badge>;
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const parseSiteIds = (val?: any): (number | string)[] => {
  if (val === null || val === undefined || val === '') return [];
  if (typeof val === 'number') return [val];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
        const n = Number(item);
        return isNaN(n) ? String(item).trim() : n;
      })
      .filter((x) => x !== '' && x !== null && x !== undefined);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'object' && item !== null && 'id' in item) return item.id;
            const n = Number(item);
            return isNaN(n) ? String(item).trim() : n;
          })
          .filter((x) => x !== '' && x !== null && x !== undefined);
      }
      if (typeof parsed === 'number') return [parsed];
    } catch {}
    const parts = trimmed
      .replace(/[\[\]"']/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.map((p) => {
        const n = Number(p);
        return isNaN(n) ? p : n;
      });
    }
    return [trimmed];
  }
  return [];
};

export function ViewPayment() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [eligibleSites, setEligibleSites] = useState<ClaimEligibleSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3'>('all');

  // Add Claim Modal (API 12)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addSelectedSites, setAddSelectedSites] = useState<number[]>([]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addRemarks, setAddRemarks] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Update Claim Modal (API 13)
  const [editClaim, setEditClaim] = useState<ClaimItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSelectedSites, setEditSelectedSites] = useState<(number | string)[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Load Claims Data (API 11) & Eligible Completed Sites
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, sitesList] = await Promise.all([
        assamSwpService.getViewClaims().catch((err) => {
          console.error('Failed to load installation claims:', err);
          return { data: [], sites: [] };
        }),
        assamSwpService.getClaimEligibleSites().catch((err) => {
          console.error('Failed to load eligible completed sites:', err);
          return [];
        }),
      ]);

      setClaims(res.data || []);

      let allSites: ClaimEligibleSite[] = [];
      if (Array.isArray(sitesList) && sitesList.length > 0) {
        allSites = sitesList;
      } else if (Array.isArray(res.sites) && res.sites.length > 0) {
        allSites = res.sites;
      }

      if (allSites.length === 0 && SAMPLE_PAYMENT_SITES.length > 0) {
        allSites = SAMPLE_PAYMENT_SITES.map((s) => ({
          id: Number(s.id),
          farmer_name: s.label,
        }));
      }

      setEligibleSites(allSites);
    } catch (err: any) {
      console.error('Failed to load installation claims:', err);
      setError(err?.message || 'Failed to load installation claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Claim Submit (API 12)
  const handleAddClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) < 1) {
      setAddError('Please enter a valid claim amount (minimum 1).');
      return;
    }
    if (addSelectedSites.length === 0) {
      setAddError('Please select at least one eligible installation site.');
      return;
    }
    if (!addFile) {
      setAddError('Invoice document is required.');
      return;
    }
    if (!addRemarks.trim()) {
      setAddError('Claim remarks are required.');
      return;
    }

    setAddSubmitting(true);
    setAddError(null);
    try {
      const formData = new FormData();
      formData.append('amount', addAmount.trim());
      addSelectedSites.forEach((id) => {
        formData.append('site_id[]', String(id));
      });
      formData.append('file', addFile);
      formData.append('remarks', addRemarks.trim());

      const res = await assamSwpService.addClaim(formData);
      setAddSuccess(res.message || 'Payment claim raised successfully!');
      setTimeout(() => {
        setAddModalOpen(false);
        setAddAmount('');
        setAddSelectedSites([]);
        setAddFile(null);
        setAddRemarks('');
        setAddSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to raise payment claim:', err);
      setAddError(err?.message || 'Failed to raise payment claim');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (c: ClaimItem) => {
    setEditClaim(c);
    setEditAmount(String(c.amount || ''));
    setEditRemarks(c.remarks || '');
    setEditFile(null);
    setEditError(null);
    setEditSuccess(null);

    let siteIds: (number | string)[] = parseSiteIds(c.site_id);
    if (siteIds.length > 0) {
      siteIds = siteIds.map((sid) => {
        if (typeof sid === 'string' && isNaN(Number(sid))) {
          const match = eligibleSites.find(
            (s) => s.farmer_name && s.farmer_name.trim().toLowerCase() === sid.trim().toLowerCase()
          );
          return match ? match.id : sid;
        }
        return sid;
      });
    } else if (c.site_id) {
      const match = eligibleSites.find(
        (s) => s.farmer_name && s.farmer_name.trim().toLowerCase() === String(c.site_id).trim().toLowerCase()
      );
      siteIds = match ? [match.id] : [c.site_id as any];
    }
    setEditSelectedSites(siteIds);
  };

  // Handle Update Claim Submit (API 13)
  const handleUpdateClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClaim) return;
    if (!editAmount || Number(editAmount) < 1) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    // Determine sites to send: fallback to existing claim site(s) if selection array is empty
    let sitesToSend = editSelectedSites;
    if (sitesToSend.length === 0) {
      sitesToSend = parseSiteIds(editClaim.site_id);
    }
    if (sitesToSend.length === 0 && editClaim.site_id) {
      sitesToSend = [editClaim.site_id as any];
    }
    if (sitesToSend.length === 0 && (editClaim as any).site) {
      sitesToSend = [(editClaim as any).site];
    }

    if (sitesToSend.length === 0) {
      setEditError('Please select at least one site.');
      return;
    }
    if (!editRemarks.trim()) {
      setEditError('Claim remarks are required.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const formData = new FormData();
      // Backend validates: 'update_id' => 'required'
      formData.append('update_id', String(editClaim.id));
      formData.append('id', String(editClaim.id));
      formData.append('amount', editAmount.trim());
      // Backend validates: 'site_id' => 'required|array'
      // Must only append array items with 'site_id[]'
      sitesToSend.forEach((sid) => {
        formData.append('site_id[]', String(sid));
      });
      if (editFile) {
        formData.append('file', editFile);
      }
      formData.append('remarks', editRemarks.trim());

      const res = await assamSwpService.updateClaim(formData);
      setEditSuccess(res.message || 'Payment claim updated successfully!');
      setTimeout(() => {
        setEditClaim(null);
        setEditAmount('');
        setEditSelectedSites([]);
        setEditFile(null);
        setEditRemarks('');
        setEditSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update payment claim:', err);
      setEditError(err?.message || 'Failed to update payment claim');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      const st = Number(statusFilter);
      list = list.filter((c) => c.claim_status === st);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const idStr = String(c.id);
        const amountStr = String(c.amount || '');
        const remarksStr = (c.remarks || '').toLowerCase();
        const dateStr = (c.date || '').toLowerCase();
        const siteStr = String(c.site_id || '').toLowerCase();
        return (
          idStr.includes(q) ||
          amountStr.includes(q) ||
          remarksStr.includes(q) ||
          dateStr.includes(q) ||
          siteStr.includes(q)
        );
      });
    }
    return list;
  }, [claims, search, statusFilter]);

  // Pagination hook
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // KPI Calculations
  const totalClaimsCount = claims.length;
  const approvedClaims = claims.filter((c) => c.claim_status === 2).length;
  const pendingClaims = claims.filter((c) => c.claim_status === 1).length;
  const totalAmountSum = claims.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const eligibleSitesCount = eligibleSites.length;

  // Export Columns definition
  const exportCols: ExportColumn<ClaimItem>[] = useMemo(() => [
    { header: 'Submission Date', accessor: (r: ClaimItem) => fmtDate(r.date) },
    { header: 'Covered Sites', accessor: (r: ClaimItem) => String(r.site_id || '—') },
    { header: 'Claim Amount', accessor: (r: ClaimItem) => fmtMoney(r.amount) },
    { header: 'Invoice File', accessor: (r: ClaimItem) => (r.file ? resolveAssamMediaUrl(r.file) : '—') },
    { header: 'Remarks', accessor: (r: ClaimItem) => r.remarks || '—' },
    {
      header: 'Status',
      accessor: (r: ClaimItem) =>
        r.claim_status === 2 ? 'Approved' : r.claim_status === 3 ? 'Rejected' : 'Raised (Pending)',
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Assam_SWP_Claims';
  const fileTitle = 'Assam SWP Vendor Claims & Invoice Register';

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
      alert('Claims data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Claims data copied to clipboard!');
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
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const headers = ['S.no', 'Submission Date', 'Covered Sites / Farmers', 'Claim Amount', 'Invoice Document', 'Remarks', 'Status', 'Action'];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header (exact Bihar pattern, NO refresh button) ── */}
      <PageHead
        title="Assam SWP Claims & Payments"
        subtitle="Track vendor installation claims, invoice submission, and disbursement status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'SWP' },
          { label: 'Claims & Payments' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => setAddModalOpen(true)}
            >
              <span className="ax-btn__label">+ Raise New Claim</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Error Loading Claims</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims Raised"
          value={totalClaimsCount.toLocaleString('en-IN')}
          sub={`${approvedClaims} approved · ${pendingClaims} pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Total Claimed Amount"
          value={fmtMoney(totalAmountSum)}
          sub="Disbursement requests"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Claims"
          value={pendingClaims.toLocaleString('en-IN')}
          sub="Under review by administration"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Eligible Unclaimed"
          value={eligibleSitesCount.toLocaleString('en-IN')}
          sub="Sites ready to claim"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2l4 -4" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact Bihar SRT table card layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Vendor Claims & Invoice Registry">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Vendor Claims & Invoice Registry</h2>
            <p className="ax-card__subtitle">
              Listing <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Approved <b className="ax-num">{approvedClaims}</b> · Pending <b className="ax-num">{pendingClaims}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="swp_claim_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="1">Raised (Pending)</option>
                <option value="2">Approved</option>
                <option value="3">Rejected</option>
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
                placeholder="Search claim, amount, site…"
                size="sm"
                ariaLabel="Search vendor claims"
              />

              {/* TableExportToolbar without columns toggle (F 1I Columns section removed) */}
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* All table columns fully scrollable horizontally - no sticky column */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1050 }}
          >
            <caption className="ax-visually-hidden">Vendor Claims & Invoice Registry</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' ? { textAlign: 'right' } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claim records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search query. Try clearing your query.'
                          : 'No claims have been submitted yet. Click "+ Raise New Claim" to submit your first claim.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((c, index) => {
                  const invoiceUrl = resolveAssamMediaUrl(c.file);
                  return (
                    <tr key={c.id} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
       
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {fmtDate(c.date)}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {String(c.site_id || '—')}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <strong style={{ fontSize: '14px', color: 'var(--asw-primary)' }}>
                          {fmtMoney(c.amount)}
                        </strong>
                      </td>
                      <td className="ax-table__td">
                        {invoiceUrl ? (
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: 'var(--asw-primary)', fontWeight: 600 }}
                          >
                            View Invoice ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)', maxWidth: 220, display: 'inline-block' }}>
                          {c.remarks || '—'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        {renderClaimStatusBadge(c.claim_status)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => openEditModal(c)}
                          >
                            Edit Claim
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (exact Bihar pagination structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Add Claim Modal (API 12) ── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Raise Installation Payment Claim"
        subtitle="Submit payment invoice for verified & doc-approved Assam SWP sites"
        maxWidth={620}
      >
        {addSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {addSuccess}</span>
          </div>
        )}

        {addError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{addError}</span>
          </div>
        )}

        <form onSubmit={handleAddClaimSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Amount Field with ₹ icon */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_amount">
                <span>Claim Amount (₹)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <div className="ax-modern-input-wrap">
                <span className="ax-modern-addon">₹</span>
                <input
                  id="add_amount"
                  type="number"
                  className="ax-modern-input"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  min={1}
                />
              </div>
            </div>

            {/* Eligible Completed Sites Dropdown */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_site_select">
                <span>
                  Select Eligible Completed Sites{' '}
                  {addSelectedSites.length > 0 && (
                    <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>
                      ({addSelectedSites.length} selected)
                    </span>
                  )}
                </span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="add_site_select"
                className="ax-modern-select"
                value={addSelectedSites.length === 1 ? String(addSelectedSites[0]) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const num = Number(val);
                  if (!addSelectedSites.includes(num)) {
                    setAddSelectedSites((prev) => [...prev, num]);
                  }
                }}
                disabled={addSubmitting}
                required={addSelectedSites.length === 0}
              >
                <option value="">
                  {loading
                    ? 'Fetching completed sites from server…'
                    : eligibleSites.length === 0
                    ? 'No unclaimed eligible sites available'
                    : '-- Choose Eligible Completed Site --'}
                </option>
                {eligibleSites.map((site) => {
                  const isSelected = addSelectedSites.includes(site.id);
                  return (
                    <option key={site.id} value={site.id}>
                      #{site.id} — {site.farmer_name || 'Farmer'} {site.district ? `(${site.district})` : ''} {isSelected ? '✓ [Selected]' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Selected site tags */}
              {addSelectedSites.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {addSelectedSites.map((sid) => {
                    const match = eligibleSites.find((s) => s.id === sid);
                    return (
                      <span
                        key={sid}
                        className="ax-badge ax-badge--soft ax-badge--info"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          fontSize: '12px',
                          borderRadius: 6,
                        }}
                      >
                        <span>
                          #{sid} — {match?.farmer_name || `Site #${sid}`}
                          {match?.district ? ` (${match.district})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddSelectedSites((prev) => prev.filter((id) => id !== sid))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            color: 'currentColor',
                            lineHeight: 1,
                          }}
                          title="Remove site"
                          aria-label="Remove site"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Document Upload Dropzone */}
            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>Invoice / Bill File (PDF / JPG / PNG)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                ref={addFileRef}
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => setAddFile(e.target.files?.[0] || null)}
              />
              {!addFile ? (
                <div
                  className="ax-modern-dropzone"
                  onClick={() => addFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ax-modern-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                      Click to upload invoice / bill file
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                      Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ax-modern-file-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="ax-modern-file-chip__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {addFile.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                        {(addFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      setAddFile(null);
                      if (addFileRef.current) addFileRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="add_remarks">
                <span>Claim Remarks / Description</span>
                <span className="ax-modern-req">*</span>
              </label>
              <textarea
                id="add_remarks"
                className="ax-modern-textarea"
                rows={3}
                value={addRemarks}
                onChange={(e) => setAddRemarks(e.target.value)}
                placeholder="Enter remarks or invoice details..."
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={addSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={addSubmitting || eligibleSites.length === 0}
            >
              {addSubmitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Claim Modal (API 13) ── */}
      <Modal
        open={!!editClaim}
        onClose={() => setEditClaim(null)}
        title="Edit Claim"
        subtitle="Update claim amount, remarks, or replace invoice document"
        maxWidth={620}
      >
        {editSuccess && (
          <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
            <span>✓ {editSuccess}</span>
          </div>
        )}

        {editError && (
          <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
            <span>{editError}</span>
          </div>
        )}

        {editClaim && (
          <form onSubmit={handleUpdateClaimSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Amount */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_amount">
                  <span>Claim Amount (₹)</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <div className="ax-modern-input-wrap">
                  <span className="ax-modern-addon">₹</span>
                  <input
                    id="edit_amount"
                    type="number"
                    className="ax-modern-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                    min={1}
                  />
                </div>
              </div>

              {/* Sites */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_site_select">
                  <span>Included Sites ({editSelectedSites.length > 0 ? editSelectedSites.length : 1} selected)</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <select
                  id="edit_site_select"
                  className="ax-modern-select"
                  value={editSelectedSites.length === 1 ? String(editSelectedSites[0]) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const num = Number(val);
                    if (!editSelectedSites.some((id) => String(id) === String(num))) {
                      setEditSelectedSites((prev) => [...prev, num]);
                    }
                  }}
                >
                  <option value="">-- Select Site from Dropdown to Add --</option>
                  {eligibleSites.map((site) => {
                    const isChecked = editSelectedSites.some((id) => String(id) === String(site.id));
                    return (
                      <option key={site.id} value={site.id}>
                        #{site.id} — {site.farmer_name} {isChecked ? '✓ [Included]' : ''}
                      </option>
                    );
                  })}
                </select>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {editSelectedSites.map((sid) => {
                    const match = eligibleSites.find((s) => String(s.id) === String(sid));
                    return (
                      <span
                        key={sid}
                        className="ax-badge ax-badge--soft ax-badge--info"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '12px' }}
                      >
                        <span>#{sid} — {match?.farmer_name || String(sid)}</span>
                        <button
                          type="button"
                          onClick={() => setEditSelectedSites((prev) => prev.filter((id) => String(id) !== String(sid)))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                          title="Remove site"
                          aria-label="Remove site"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Replace Invoice File */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>Replace Invoice File (Optional)</span>
                </label>
                <input
                  ref={editFileRef}
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                />
                {!editFile ? (
                  <div>
                    <div
                      className="ax-modern-dropzone"
                      onClick={() => editFileRef.current?.click()}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="ax-modern-dropzone__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                          Click to upload new invoice file
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                          Leave empty to keep existing invoice document
                        </div>
                      </div>
                    </div>
                    {editClaim.file && (
                      <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                        Current invoice:{' '}
                        <a href={resolveAssamMediaUrl(editClaim.file)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                          View Current ↗
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {editFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(editFile.size / 1024).toFixed(1)} KB (New file)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setEditFile(null);
                        if (editFileRef.current) editFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="edit_remarks">
                  <span>Claim Remarks / Description</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <textarea
                  id="edit_remarks"
                  className="ax-modern-textarea"
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setEditClaim(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={editSubmitting}
              >
                {editSubmitting ? 'Updating…' : 'Update Claim'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default ViewPayment;

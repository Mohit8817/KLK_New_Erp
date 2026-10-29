import { useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharComplaintService,
  getMediaUrl,
  type BiharComplaintItem,
  type AssignedComplaintsResponse,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
  Modal,
} from '../../../../../common';

type Row = BiharComplaintItem;
type TabKey = 'open' | 'approved' | 'closed';

interface Toast { id: number; msg: string; }
let TID = 0;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const X = (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Responsive page CSS (same as View Complaint) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  /* ── Pure White Professional Modal (Fixed, Non-jumping, Scrollable) ── */
  .ax-modal {
    position: fixed !important;
    inset: 0 !important;
    z-index: 10000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px 16px !important;
    overflow: hidden !important;
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(4px) !important;
  }
  .ax-modal__backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: transparent !important;
  }
  .ax-modal__dialog,
  .ax-modal__dialog--lg,
  .ax-modal__dialog--scrollable,
  .ax-modal__dialog--white {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    max-width: 840px !important;
    height: min(88vh, 840px) !important;
    max-height: calc(100vh - 48px) !important;
    background: #ffffff !important;
    color: #0f172a !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05) !important;
    overflow: hidden !important;
    margin: 0 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .ax-modal__dialog > form {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }
  .ax-modal__header {
    flex: 0 0 auto !important;
    background: #ffffff !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 18px 24px !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 12px !important;
    z-index: 5 !important;
  }
  .ax-modal__title {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
  }
  .ax-modal__close {
    width: 32px !important;
    height: 32px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    color: #64748b !important;
    background: #f1f5f9 !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__close:hover {
    color: #0f172a !important;
    background: #e2e8f0 !important;
  }
  .ax-modal__body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    background: #ffffff !important;
    padding: 24px !important;
  }
  .ax-modal__body::-webkit-scrollbar {
    width: 6px;
  }
  .ax-modal__body::-webkit-scrollbar-track {
    background: #ffffff;
  }
  .ax-modal__body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
  }
  .ax-modal__body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .ax-modal__footer {
    flex: 0 0 auto !important;
    background: #ffffff !important;
    border-top: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 12px !important;
    z-index: 5 !important;
  }
  .ax-modal__footer .ax-btn--ghost,
  .ax-modal__footer .ax-btn--secondary {
    background: #f1f5f9 !important;
    color: #334155 !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    padding: 8px 18px !important;
    border-radius: 8px !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__footer .ax-btn--ghost:hover,
  .ax-modal__footer .ax-btn--secondary:hover {
    background: #e2e8f0 !important;
    color: #0f172a !important;
  }
  .ax-modal__footer .ax-btn--primary {
    background: #2563eb !important;
    color: #ffffff !important;
    border: 1px solid #2563eb !important;
    font-weight: 600 !important;
    padding: 8px 24px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal__footer .ax-btn--primary:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }

  /* ── Floating labels: Clean professional styling ── */
  .ax-modal .ax-float { position: relative; width: 100%; }
  .ax-modal .ax-float__input {
    background: #ffffff !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 10px !important;
    height: 48px !important;
    color: #0f172a !important;
    font-size: 14px !important;
    padding: 0 14px !important;
    box-sizing: border-box !important;
    transition: all 0.15s ease !important;
  }
  .ax-modal .ax-float__input::placeholder { color: transparent !important; }
  .ax-modal .ax-float__input:hover { border-color: #94a3b8 !important; }
  .ax-modal .ax-float__input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
    outline: none !important;
  }
  .ax-modal .ax-float__input.is-invalid {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
  }
  .ax-modal .ax-float__input.is-valid {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
  }
  .ax-modal .ax-float__label {
    position: absolute;
    inset-inline-start: 12px;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
    padding: 0 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    background: #ffffff !important;
    border-radius: 4px;
    pointer-events: none;
    z-index: 3;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ax-modal .ax-float__input:focus + .ax-float__label,
  .ax-modal .ax-float__input:not(:placeholder-shown) + .ax-float__label,
  .ax-modal .ax-float--date .ax-float__label,
  .ax-modal .ax-float--locked .ax-float__label,
  .ax-modal .ax-float--area .ax-float__input:focus + .ax-float__label,
  .ax-modal .ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
    top: 0;
    font-size: 11px;
    font-weight: 600;
    color: #475569;
  }
  .ax-modal .ax-float__input:focus + .ax-float__label { color: #2563eb !important; }
  .ax-modal .ax-float__input.is-invalid + .ax-float__label { color: #ef4444 !important; }
  .ax-modal .ax-float--area .ax-float__label { top: 14px; transform: none; }
  .ax-modal .ax-textarea.ax-float__input {
    height: auto !important;
    min-height: 96px !important;
    padding: 14px !important;
    line-height: 1.5 !important;
  }
  .ax-modal .ax-float--locked .ax-float__input {
    background: #f8fafc !important;
    color: #475569 !important;
    cursor: not-allowed !important;
  }

  .assigned-overview-card {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 16px 20px !important;
  }

  @media (max-width: 768px) {
    .ax-modal {
      padding: 12px !important;
    }
    .ax-modal__dialog,
    .ax-modal__dialog--lg,
    .ax-modal__dialog--scrollable,
    .ax-modal__dialog--white {
      max-width: 100% !important;
      height: calc(100vh - 24px) !important;
      max-height: calc(100vh - 24px) !important;
      border-radius: 12px !important;
    }
    .ax-modal__body {
      padding: 16px !important;
    }
    .ax-modal__header,
    .ax-modal__footer {
      padding: 14px 16px !important;
    }
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string;
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span: number; children: ReactNode }) {
  return (
    <div className={`ax-col--${span}`}>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{children}</div>
    </div>
  );
}

/* ───────── Upload dropzone (dashed card) ───────── */
function UploadDrop({
  id, label, file, onPick, onClear,
  accept = 'image/*,.pdf',
  hint = 'PDF, JPG or PNG — single file',
}: {
  id: string; label: string; file: File | null;
  onPick: (f: File | null) => void; onClear: () => void;
  accept?: string; hint?: string;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 6 }}>
        {label}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0] || null); }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, textAlign: 'center', cursor: 'pointer',
          padding: '24px 16px', minHeight: 140,
          border: `1.5px dashed ${drag ? 'var(--ax-accent)' : '#cbd5e1'}`,
          borderRadius: 12,
          background: drag ? '#eff6ff' : '#ffffff',
          transition: 'all .15s ease',
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => { onPick(e.target.files?.[0] || null); e.target.value = ''; }}
        />

        <span style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#eff6ff', color: '#2563eb',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
            <path d="M9 15l3 -3l3 3" />
            <path d="M12 12v9" />
          </svg>
        </span>

        {file ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', wordBreak: 'break-all' }}>
              ✓ {file.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {(file.size / 1024).toFixed(1)} KB ·{' '}
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                style={{ padding: '0 6px', height: 'auto', color: '#ef4444' }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{hint}</div>
          </>
        )}
      </div>
    </div>
  );
}

const isItemRejected = (item: BiharComplaintItem | any): boolean => {
  if (!item) return false;
  const statusStr = String(item.status ?? '').toLowerCase().trim();
  const closeStatusStr = String(item.close_status ?? '').toLowerCase().trim();
  const approvalStatusStr = String(item.approval_status ?? item.approved_status ?? item.approval ?? '').toLowerCase().trim();
  const rejectStatusStr = String(item.reject_status ?? item.rejected ?? item.is_rejected ?? '').toLowerCase().trim();
  const remarksStr = String(item.reject_reason ?? item.reject_remarks ?? item.admin_remarks ?? '').toLowerCase().trim();

  return (
    statusStr === '2' || statusStr === '-1' || statusStr === '3' ||
    statusStr === 'rejected' || statusStr === 'reject' ||
    closeStatusStr === '-1' || closeStatusStr === '2' ||
    closeStatusStr === 'rejected' || closeStatusStr === 'reject' ||
    approvalStatusStr === 'rejected' || approvalStatusStr === 'reject' || approvalStatusStr === '2' ||
    rejectStatusStr === '1' || rejectStatusStr === 'true' || rejectStatusStr === 'rejected' ||
    (remarksStr.length > 0 && (remarksStr.includes('reject') || statusStr === '2'))
  );
};

/* ── Table column config ── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

interface Col { key: string; th: string; get: (r: Row) => ReactNode; exp: (r: Row) => string | number; style?: CSSProperties }

const ellipsis = (maxWidth: number, v: unknown) => (
  <div title={v ? String(v) : undefined} style={{ maxWidth, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt(v)}</div>
);

const COLS: Col[] = [
  { key: 'Complaint ID', th: 'Complaint ID', get: (r) => `#${r.complaint_id}`, exp: (r) => r.complaint_id ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-accent)' } },
  { key: 'Complaint Date', th: 'Complaint Date', get: (r) => txt(r.start_date), exp: (r) => r.start_date ?? '' },
  { key: 'Complaint', th: 'Complaint', get: (r) => ellipsis(260, r.complaint), exp: (r) => r.complaint ?? '' },
  { key: 'State', th: 'State', get: (r) => txt(r.state || 'Bihar'), exp: (r) => r.state || 'Bihar' },
  { key: 'Discom', th: 'Discom', get: (r) => txt(r.discom), exp: (r) => r.discom ?? '' },
  { key: 'District', th: 'District', get: (r) => txt(r.district), exp: (r) => r.district ?? '', style: { fontWeight: 'var(--ax-weight-medium)' as any } },
  { key: 'Dept Name', th: 'Dept Name', get: (r) => txt(r.dept_name), exp: (r) => r.dept_name ?? '' },
  { key: 'Site Name', th: 'Site Name', get: (r) => txt(r.site_name), exp: (r) => r.site_name ?? '', style: { fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' } },
  { key: 'Location', th: 'Location', get: (r) => ellipsis(180, r.location), exp: (r) => r.location ?? '' },
  { key: 'Firm Name', th: 'Firm Name', get: (r) => txt(r.firm_name), exp: (r) => r.firm_name ?? '' },
  { key: 'CA No', th: 'CA No', get: (r) => txt(r.ca_no), exp: (r) => r.ca_no ?? '' },
  { key: 'Sanction Load', th: 'Sanction Load', get: (r) => txt(r.sanction_load), exp: (r) => r.sanction_load ?? '' },
  { key: 'Plant SC', th: 'Plant SC', get: (r) => txt(r.plant_sc), exp: (r) => r.plant_sc ?? '' },
  { key: 'WO No', th: 'WO No', get: (r) => txt(r.wo_no), exp: (r) => r.wo_no ?? '' },
  { key: 'Phase', th: 'Phase', get: (r) => txt(r.phase), exp: (r) => r.phase ?? '' },
  {
    key: 'Document', th: 'Document',
    get: (r) => {
      const url = r.file ? getMediaUrl(r.file) : '';
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', textDecoration: 'none' }} title="View Document">View</a>
      ) : DASH;
    },
    exp: (r) => (r.file ? getMediaUrl(r.file) : ''),
  },
  {
    key: 'Assign Complaint', th: 'Assign Complaint',
    get: (r) => (r.assigned_vendor_name
      ? <span className="ax-badge ax-badge--soft ax-badge--pill"><span className="ax-badge__dot" />{r.assigned_vendor_name}</span>
      : DASH),
    exp: (r) => r.assigned_vendor_name ?? '',
  },
];

const approvalLabel = (r: Row) =>
  isItemRejected(r) ? 'Rejected' : r.close_status === 1 ? 'Approved' : r.status === 1 ? 'Pending Approval' : 'Open';

export function Bihar_Complaint_SRT_AssignedComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedData, setAssignedData] = useState<AssignedComplaintsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column Visibility
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (key: string) => !hiddenCols.includes(key);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<BiharComplaintItem | null>(null);

  // ── Resolve / Close Complaint Modal State ──
  const [resolvingItem, setResolvingItem] = useState<BiharComplaintItem | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rMobile, setRMobile] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>('Yes');
  const [rFile, setRFile] = useState<File | null>(null);
  const [rFile2, setRFile2] = useState<File | null>(null);
  const [rFile3, setRFile3] = useState<File | null>(null);
  const [rFile4, setRFile4] = useState<File | null>(null);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, number>>({});
  const showToast = useCallback((msg: string, ttl = 3500) => {
    const id = ++TID;
    setToasts((t) => [...t, { id, msg }]);
    timers.current[id] = window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  const pickResolveFile = (f: File | null, setter: (f: File | null) => void) => {
    if (!f) return;
    const okType = /^image\/(jpeg|png|webp)$/.test(f.type) || f.type === 'application/pdf';
    if (!okType) { setResolveError('Only PDF, JPG, PNG or WebP files are allowed.'); return; }
    if (f.size > MAX_FILE_SIZE) { setResolveError('File size must be 5 MB or less.'); return; }
    setResolveError(null);
    setter(f);
  };

  const openResolveModal = (item: BiharComplaintItem) => {
    setAttempted(false);
    setResolvingItem(item);
    setResolveError(null);
    setResolvedBy(assignedData?.name || (assignedData as any)?.vendor?.name || 'App Testing');
    setContactPerson(item.contact_person || item.site_name || item.beneficiary_name || '');
    setContactNumber(item.contact_number || item.contact_no || '');
    setREmail((assignedData as any)?.vendor?.email || '');
    setRMobile((assignedData as any)?.vendor?.contact || '');
    setClosingDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setCloseSms('Yes');
    setRFile(null);
    setRFile2(null);
    setRFile3(null);
    setRFile4(null);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;
    setAttempted(true);

    if (!resolvedBy.trim()) { setResolveError('Resolved By is required.'); return; }
    if (!contactPerson.trim()) { setResolveError('Contact person is required.'); return; }
    const cleanContact = contactNumber.trim().replace(/\D/g, '');
    if (cleanContact.length !== 10) { setResolveError('Contact number must be exactly 10 digits.'); return; }
    if (!rEmail.trim() || !/\S+@\S+\.\S+/.test(rEmail)) { setResolveError('Please enter a valid resolver email address.'); return; }
    const cleanMobile = rMobile.trim().replace(/\D/g, '');
    if (cleanMobile.length !== 10) { setResolveError('Resolver mobile must be exactly 10 digits.'); return; }
    if (!closingDate) { setResolveError('Closing date is required.'); return; }
    if (!remarks.trim()) { setResolveError('Remarks are required.'); return; }

    setResolveSubmitting(true);
    setResolveError(null);

    try {
      const fd = new FormData();
      fd.append('srt_id', String(resolvingItem.id));
      fd.append('resolved_by', resolvedBy.trim());
      fd.append('contact_person', contactPerson.trim());
      fd.append('contact_number', cleanContact);
      fd.append('r_email', rEmail.trim());
      fd.append('r_mobile', cleanMobile);
      fd.append('manual_close_date', closingDate);
      fd.append('remarks', remarks.trim());
      fd.append('close_sms', closeSms);
      if (rFile) fd.append('r_file', rFile);
      if (rFile2) fd.append('r_file2', rFile2);
      if (rFile3) fd.append('r_file3', rFile3);
      if (rFile4) fd.append('r_file4', rFile4);

      const res = await biharComplaintService.closeUpdateSrtComplaint(fd);
      if (res.success) {
        setSuccessToast(res.message || 'Complaint Close Request Raised Successfully.');
        setResolvingItem(null);
        await loadData();
      } else {
        setResolveError(res.message || 'Failed to resolve SRT complaint.');
      }
    } catch (err: any) {
      setResolveError(err?.message || 'Error occurred while resolving complaint.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const contactInvalid = attempted && contactNumber.trim().replace(/\D/g, '').length !== 10;
  const emailInvalid = attempted && (!rEmail.trim() || !/\S+@\S+\.\S+/.test(rEmail));
  const mobileInvalid = attempted && rMobile.trim().replace(/\D/g, '').length !== 10;

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // API 10: GET /bihar/srt/complaint/assign
      const resp = await biharComplaintService.getAssignedSrtComplaints();
      setAssignedData(resp);
      if (resp.open && resp.open.length > 0) setActiveTab('open');
      else if (resp.approved && resp.approved.length > 0) setActiveTab('approved');
      else setActiveTab('closed');
    } catch (err) {
      console.error('Error loading SRT assigned complaints:', err);
      setErrorMsg('Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const tabItems = useMemo(() => {
    if (!assignedData) return [];
    if (activeTab === 'open') return assignedData.open || [];
    if (activeTab === 'approved') return assignedData.approved || [];
    return assignedData.data || [];
  }, [assignedData, activeTab]);

  const districts = useMemo(() => {
    if (!assignedData) return [];
    const all = [...(assignedData.open || []), ...(assignedData.approved || []), ...(assignedData.data || [])];
    const s = new Set<string>();
    all.forEach((i) => { if (i.district) s.add(i.district); });
    return Array.from(s).sort();
  }, [assignedData]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return tabItems.filter((item) => {
      if (districtFilter !== 'all' && item.district !== districtFilter) return false;
      if (q) {
        const str = [
          item.complaint_id, item.site_name, item.dept_name, item.ca_no, item.wo_no,
          item.district, item.discom, item.location, item.complaint, item.firm_name,
        ].join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [tabItems, districtFilter, deferredQuery]);

  const pagination = usePagination({ data: filtered, initialPageSize: 100 });

  // Counts from API response #10
  const totalCount = assignedData?.total_complaint ?? 0;
  const openCount = assignedData?.open_complaint ?? 0;
  const approvedCount = assignedData?.approved_complaint ?? 0;
  const closedCount = assignedData?.close_complaint ?? 0;

  /* ── Export ── */
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      ...COLS.filter((c) => c.key !== 'Document').map((c) => ({ header: c.key, accessor: c.exp })),
      { header: 'Approval Status', accessor: (r: Row) => approvalLabel(r) },
      { header: 'Status', accessor: (r: Row) => (r.close_status === 1 ? 'Closed' : 'Open') },
    ],
    []
  );
  const activeExportCols = useMemo(() => exportCols.filter((c) => !hiddenCols.includes(c.header)), [exportCols, hiddenCols]);


  const handleCopy = () => copyTableDataToClipboard(filtered, activeExportCols);
  const handleExportCSV = () => exportDataToCSV(`Bihar_SRT_Assigned_${activeTab}`, filtered, activeExportCols);
  const handleExportExcel = () => exportDataToExcel(`Bihar_SRT_Assigned_${activeTab}`, filtered, activeExportCols);
  const handleExportPDF = () => printTableData(`Bihar SRT Assigned Complaints (${activeTab})`, filtered, activeExportCols);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'open', label: 'Open', count: openCount },
    { key: 'approved', label: 'Pending Approval', count: approvedCount },
    { key: 'closed', label: 'Closed', count: closedCount },
  ];

  const hasFilters = !!searchQuery || districtFilter !== 'all';
  const clearFilters = () => { setSearchQuery(''); setDistrictFilter('all'); pagination.setPage(1); };
  const visibleCols = COLS.filter((c) => isVisible(c.key));
  const tabTitle = activeTab === 'open' ? 'Open Assigned Complaints' : activeTab === 'approved' ? 'Pending Approval Complaints' : 'Closed Assigned Complaints';

  const renderApproval = (item: Row) => {
    if (isItemRejected(item)) {
      return (
        <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--danger" title={(item as any).reject_reason || (item as any).reject_remarks || 'Complaint rejected from main portal'}>
          <span className="ax-badge__dot" />Rejected
        </span>
      );
    }
    if (activeTab === 'approved' || (item.status === 1 && item.close_status !== 1)) {
      return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--info"><span className="ax-badge__dot" />Pending</span>;
    }
    if (activeTab === 'closed' || item.close_status === 1) {
      return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--success"><span className="ax-badge__dot" />Approved</span>;
    }
    return <span className="ax-badge ax-badge--soft ax-badge--pill ax-badge--warning"><span className="ax-badge__dot" />Open</span>;
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Complaints"
        subtitle="Manage and inspect all Solar Rooftop breakdown complaints assigned to vendor in Bihar"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT', href: '/v/complaint/bihar/srt-view-complaint' },
          { label: 'Assigned Complaints' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {successToast && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✓ {successToast}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSuccessToast(null)}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠ {errorMsg}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent" label="Total Complaints" value={num(totalCount)} sub="Total assigned tickets"
              icon={svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>)}
            />
            <KpiCard
              tone="amber" label="Open Complaints" value={num(openCount)} sub="Awaiting vendor dispatch"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>)}
            />
            <KpiCard
              tone="cyan" label="Pending Approval" value={num(approvedCount)} sub="Resolution under review"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="emerald" label="Resolved Complaints" value={num(closedCount)} sub="Completed & verified"
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Assigned complaints tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => { setActiveTab(t.key); pagination.setPage(1); }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : t.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT Assigned Complaints">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{tabTitle}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{tabItems.length}</span> complaints
                {' '}· Open <b className="ax-num">{openCount}</b> · Pending Approval <b className="ax-num">{approvedCount}</b> · Closed <b className="ax-num">{closedCount}</b>
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); pagination.setPage(1); }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={searchQuery}
                  onChange={(val) => { setSearchQuery(val); pagination.setPage(1); }}
                  placeholder="Search records…"
                  size="sm"
                  ariaLabel="Search records"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}

                />
              </div>
            </div>
          </div>

          {loading ? (
            <TableSkeleton columns={12} rows={8} showCard={false} />
          ) : filtered.length === 0 ? (
            <TableEmptyState
              title="No records found"
              message={
                hasFilters
                  ? 'No complaints match your filters. Try clearing filters or search term.'
                  : 'There are currently no assigned tickets in this category.'
              }
              onClear={hasFilters ? clearFilters : undefined}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                  <caption className="ax-visually-hidden">Bihar SRT Assigned Complaints</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      {visibleCols.map((c) => <th key={c.key} className="ax-table__th" scope="col">{c.th}</th>)}
                      {isVisible('Approval Status') && <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Approval Status</th>}
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paged.map((item, idx) => {
                      const srNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                      const rejected = isItemRejected(item);
                      return (
                        <tr key={item.id || idx} className="ax-table__row">
                          <td className="ax-table__td ax-num">{srNo}</td>
                          {visibleCols.map((c) => (
                            <td key={c.key} className="ax-table__td" style={c.style}>
                              {c.key === 'Complaint ID' ? (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--ghost ax-btn--sm"
                                  onClick={() => setSelectedItem(item)}
                                  style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-accent)' }}
                                >
                                  {c.get(item)}
                                </button>
                              ) : c.get(item)}
                            </td>
                          ))}
                          {isVisible('Approval Status') && (
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>{renderApproval(item)}</td>
                          )}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              {(activeTab === 'approved' || rejected) ? (
                                <>
                                  <button
                                    type="button"
                                    className="ax-btn ax-btn--secondary ax-btn--sm"
                                    onClick={() => navigate(`/v/complaint/bihar/srt-add-complaint?edit=${item.id}`)}
                                  >
                                    Edit
                                  </button>
                                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                    View
                                  </button>
                                </>
                              ) : activeTab === 'closed' ? (
                                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                  View
                                </button>
                              ) : (
                                <>
                                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(item)}>
                                    View
                                  </button>
                                  {item.close_status !== 1 && (
                                    <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => openResolveModal(item)} title="Resolve this complaint">
                                      Resolve
                                    </button>
                                  )}
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

              <div className="ax-card__footer">
                <div className="ula-pagination-left">
                  <Pagination {...pagination} onPageSizeChange={pagination.setPageSize} pageSizeOptions={[100, 200, 300]} />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── View Detail Modal ── */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        labelledBy="m-srt-view-title"
        dialogClass="ax-modal__dialog--lg ax-modal__dialog--white ax-modal__dialog--scrollable"
      >
        {selectedItem && (
          <>
            <div className="ax-modal__header">
              <div>
                <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)' }}>
                  SRT Complaint Details
                </span>
                <h2 className="ax-modal__title" id="m-srt-view-title">
                  Assigned Complaint #{selectedItem.complaint_id}
                </h2>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginTop: '4px' }}>
                  Vendor: <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedItem.assigned_vendor_name || '—'}</strong> • Date: {selectedItem.start_date || '—'}
                </div>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setSelectedItem(null)}
                aria-label="Close dialog"
              >
                {X}
              </button>
            </div>

            <div className="ax-modal__body">
              <div className="ax-dash-grid">
                <Field label="Site Name" span={6}>{selectedItem.site_name || '—'}</Field>
                <Field label="Department" span={6}>{selectedItem.dept_name || '—'}</Field>
                <Field label="District / Discom" span={4}>
                  {selectedItem.district || '—'} ({selectedItem.discom || '—'})
                </Field>
                <Field label="CA Number" span={4}>{selectedItem.ca_no || '—'}</Field>
                <Field label="Sanction Load" span={4}>{selectedItem.sanction_load || '—'}</Field>
                <Field label="Plant SC" span={4}>{selectedItem.plant_sc || '—'}</Field>
                <Field label="Work Order No" span={4}>{selectedItem.wo_no || '—'}</Field>
                <Field label="Phase" span={4}>{selectedItem.phase || '—'}</Field>
                <Field label="Location / Campus" span={12}>{selectedItem.location || selectedItem.address || '—'}</Field>

                {isItemRejected(selectedItem) && (
                  <div className="ax-col--12">
                    <div className="ax-alert ax-alert--danger" role="alert">
                      <span className="ax-alert__icon">
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
                      </span>
                      <div className="ax-alert__content">
                        <p className="ax-alert__title">Complaint Rejected by Main Portal</p>
                        {((selectedItem as any).reject_reason || (selectedItem as any).reject_remarks) && (
                          <p className="ax-alert__message">Reason: {(selectedItem as any).reject_reason || (selectedItem as any).reject_remarks}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="ax-col--12">
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Complaint Description
                  </div>
                  <div style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)', background: 'var(--ax-surface-subtle)', fontSize: 'var(--ax-text-sm)' }}>
                    {selectedItem.complaint || '—'}
                  </div>
                </div>

                {selectedItem.close_status === 1 && (
                  <div className="ax-col--12">
                    <div className="ax-alert ax-alert--success" role="status">
                      <span className="ax-alert__icon">
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                      </span>
                      <div className="ax-alert__content">
                        <p className="ax-alert__title">Resolution Log</p>
                        <p className="ax-alert__message">
                          Resolved by: <b>{selectedItem.resolved_by || '—'}</b> | Date: {selectedItem.close_date || '—'}
                          {selectedItem.remarks && <><br />Remarks: {selectedItem.remarks}</>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {isItemRejected(selectedItem) ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => {
                      const id = selectedItem.id;
                      setSelectedItem(null);
                      navigate(`/v/complaint/bihar/srt-add-complaint?edit=${id}`);
                    }}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                    <span className="ax-btn__label">Edit & Fix Complaint</span>
                  </button>
                ) : activeTab === 'open' && selectedItem.close_status !== 1 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      openResolveModal(item);
                    }}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                    <span className="ax-btn__label">Resolve This Complaint</span>
                  </button>
                )}
              </div>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Vendor Close / Resolve Complaint Modal ── */}
      <Modal
        open={Boolean(resolvingItem)}
        onClose={() => !resolveSubmitting && setResolvingItem(null)}
        labelledBy="m-srt-resolve-title"
        dialogClass="ax-modal__dialog--lg ax-modal__dialog--white ax-modal__dialog--scrollable"
        closeOnBackdrop={!resolveSubmitting}
      >
        {resolvingItem && (
          <form onSubmit={handleResolveSubmit} noValidate>
            <div className="ax-modal__header">
              <div>
                <span className="ax-card__eyebrow" style={{ color: 'var(--ax-viz-emerald, #103ab9)' }}>
                  Vendor Close Complaints
                </span>
                <h2 className="ax-modal__title" id="m-srt-resolve-title">
                  Resolve Complaint #{resolvingItem.complaint_id}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Enter resolution information, attach proof images and submit to close.
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => !resolveSubmitting && setResolvingItem(null)}
                disabled={resolveSubmitting}
                aria-label="Close dialog"
              >
                {X}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              {resolveError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <span className="ax-alert__icon">
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                    </svg>
                  </span>
                  <div className="ax-alert__content">
                    <p className="ax-alert__message">{resolveError}</p>
                  </div>
                </div>
              )}

              {/* ── Read-only Complaint Overview ── */}
              <div className="assigned-overview-card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-bold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ax-text-muted)', marginBottom: 'var(--ax-space-3)' }}>
                  Complaint Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', fontSize: 'var(--ax-text-xs)' }}>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{resolvingItem.state || 'bihar'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{resolvingItem.district || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Discom:</span> <b>{resolvingItem.discom || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Dept Name:</span> <b>{resolvingItem.dept_name || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{resolvingItem.site_name || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Location:</span> <b>{resolvingItem.location || resolvingItem.address || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>CA No:</span> <b>{resolvingItem.ca_no || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanction Load:</span> <b>{resolvingItem.sanction_load || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Plant SC:</span> <b>{resolvingItem.plant_sc || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>WO No:</span> <b>{resolvingItem.wo_no || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Phase:</span> <b>{resolvingItem.phase || '—'}</b></div>
                  <div><span style={{ color: 'var(--ax-text-muted)' }}>Complaint Date:</span> <b>{resolvingItem.start_date || '—'}</b></div>
                </div>
              </div>

              {/* ── Resolution Inputs with Floating Labels ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--ax-space-5)' }}>
                {/* Resolved By */}
                <div className="ax-float ax-float--locked">
                  <input
                    id="res-resolved-by"
                    type="text"
                    className="ax-input ax-float__input"
                    placeholder=" "
                    value={resolvedBy}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.85 }}
                  />
                  <label className="ax-float__label" htmlFor="res-resolved-by">
                    Resolved By <span style={{ color: 'var(--ax-danger-500)' }}>*</span> (Locked)
                  </label>
                </div>

                {/* Contact Person / Incharge */}
                <div className="ax-float">
                  <input
                    id="res-contact-person"
                    type="text"
                    className={`ax-input ax-float__input${attempted && !contactPerson.trim() ? ' is-invalid' : ''}${attempted && contactPerson.trim() ? ' is-valid' : ''}`}
                    placeholder=" "
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-contact-person">
                    Contact Person / Incharge <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !contactPerson.trim() && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Enter contact person name.</span>
                  )}
                </div>

                {/* Contact Number */}
                <div className="ax-float">
                  <input
                    id="res-contact-number"
                    type="tel"
                    maxLength={10}
                    className={`ax-input ax-float__input ax-num${attempted && contactNumber.trim().replace(/\D/g, '').length !== 10 ? ' is-invalid' : ''}${attempted && contactNumber.trim().replace(/\D/g, '').length === 10 ? ' is-valid' : ''}`}
                    placeholder=" "
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    style={{ fontFamily: 'var(--ax-font-mono)' }}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-contact-number">
                    Contact Number (10 Digits) <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && contactNumber.trim().replace(/\D/g, '').length !== 10 && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Contact number must be exactly 10 digits.</span>
                  )}
                </div>

                {/* Resolver Email */}
                <div className="ax-float">
                  <input
                    id="res-remail"
                    type="email"
                    className={`ax-input ax-float__input${attempted && (!rEmail.trim() || !/\S+@\S+\.\S+/.test(rEmail)) ? ' is-invalid' : ''}${attempted && rEmail.trim() && /\S+@\S+\.\S+/.test(rEmail) ? ' is-valid' : ''}`}
                    placeholder=" "
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-remail">
                    Resolver Email <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && (!rEmail.trim() || !/\S+@\S+\.\S+/.test(rEmail)) && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Enter a valid email address.</span>
                  )}
                </div>

                {/* Resolver Mobile */}
                <div className="ax-float">
                  <input
                    id="res-rmobile"
                    type="tel"
                    maxLength={10}
                    className={`ax-input ax-float__input ax-num${attempted && rMobile.trim().replace(/\D/g, '').length !== 10 ? ' is-invalid' : ''}${attempted && rMobile.trim().replace(/\D/g, '').length === 10 ? ' is-valid' : ''}`}
                    placeholder=" "
                    value={rMobile}
                    onChange={(e) => setRMobile(e.target.value)}
                    style={{ fontFamily: 'var(--ax-font-mono)' }}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-rmobile">
                    Resolver Mobile (10 Digits) <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && rMobile.trim().replace(/\D/g, '').length !== 10 && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Resolver mobile must be 10 digits.</span>
                  )}
                </div>

                {/* Closing Date */}
                <div className="ax-float ax-float--date">
                  <input
                    id="res-closing-date"
                    type="date"
                    className={`ax-input ax-float__input${attempted && !closingDate ? ' is-invalid' : ''}${attempted && closingDate ? ' is-valid' : ''}`}
                    placeholder=" "
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-closing-date">
                    Closing Date <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !closingDate && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Select closing date.</span>
                  )}
                </div>

                {/* Proof Images & Documents */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)' }}>
                  <UploadDrop
                    id="res-srt-rfile"
                    label="Image 1 (Optional)"
                    file={rFile}
                    onPick={(f) => pickResolveFile(f, setRFile)}
                    onClear={() => setRFile(null)}
                  />
                  <UploadDrop
                    id="res-srt-rfile2"
                    label="Image 2 (Optional)"
                    file={rFile2}
                    onPick={(f) => pickResolveFile(f, setRFile2)}
                    onClear={() => setRFile2(null)}
                  />
                  <UploadDrop
                    id="res-srt-rfile3"
                    label="Image 3 (Optional)"
                    file={rFile3}
                    onPick={(f) => pickResolveFile(f, setRFile3)}
                    onClear={() => setRFile3(null)}
                  />
                  <UploadDrop
                    id="res-srt-rfile4"
                    label="Image 4 / Test Sheet (Optional)"
                    file={rFile4}
                    onPick={(f) => pickResolveFile(f, setRFile4)}
                    onClear={() => setRFile4(null)}
                  />
                </div>

                {/* Remarks */}
                <div className="ax-float ax-float--area" style={{ gridColumn: '1 / -1' }}>
                  <textarea
                    id="res-remarks"
                    className={`ax-textarea ax-float__input${attempted && !remarks.trim() ? ' is-invalid' : ''}${attempted && remarks.trim() ? ' is-valid' : ''}`}
                    rows={3}
                    placeholder=" "
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                  <label className="ax-float__label" htmlFor="res-remarks">
                    Remarks <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </label>
                  {attempted && !remarks.trim() && (
                    <span className="ax-field__message ax-field__message--error" role="alert">Please enter remarks / resolution notes.</span>
                  )}
                </div>

                {/* Send SMS Notification */}
                <div style={{
                  gridColumn: '1 / -1',
                  padding: 'var(--ax-space-3) var(--ax-space-4)',
                  background: 'var(--ax-surface-subtle)',
                  borderRadius: 'var(--ax-radius-sm)',
                  border: '1px solid var(--ax-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--ax-space-3)'
                }}>
                  <div style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                    Send SMS Notification <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                  </div>
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-5)' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>
                      <input
                        type="radio"
                        className="ax-radio"
                        name="close_sms"
                        value="Yes"
                        checked={closeSms === 'Yes'}
                        onChange={() => setCloseSms('Yes')}
                      />
                      <span>Yes</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-2)', cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>
                      <input
                        type="radio"
                        className="ax-radio"
                        name="close_sms"
                        value="No"
                        checked={closeSms === 'No'}
                        onChange={() => setCloseSms('No')}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setResolvingItem(null)}
                disabled={resolveSubmitting}
              >
                <span className="ax-btn__label">Cancel</span>
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={resolveSubmitting}
                aria-busy={resolveSubmitting}
                style={{ minWidth: 160 }}
              >
                {resolveSubmitting && <span className="ax-spinner ax-spinner--xs" aria-hidden="true" />}
                <span className="ax-btn__label">{resolveSubmitting ? 'Resolving…' : 'Confirm & Resolve Complaint'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ───── Toast region ───── */}
      {toasts.length > 0 && createPortal(
        <div className="ax-toast-region" aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 'var(--ax-space-6)', insetInlineEnd: 'var(--ax-space-6)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
          {toasts.map((t) => (
            <div key={t.id} className="ax-toast" role="status">
              <div className="ax-toast__content"><p className="ax-toast__message">{t.msg}</p></div>
              <button type="button" className="ax-toast__dismiss" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Dismiss">{X}</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default Bihar_Complaint_SRT_AssignedComplaint;

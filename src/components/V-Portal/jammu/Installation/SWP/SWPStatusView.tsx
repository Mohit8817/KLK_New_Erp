import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSwpService,
  type JammuSwpStatusSiteItem,
} from '../../jammu-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const DASH = '—';
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

/* ───────── Field helpers ───────── */
const pick = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

const pickNum = (row: any, ...keys: string[]): number => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }
  }
  return 0;
};

const ALIASES: Record<string, string[]> = {
  f_farmer_name: ['f_farmer_name', 'farmer_name', 'applicant_name', 'name'],
  motor_no: ['mt_motor_no', 'motor_no'],
  pump_no: ['mt_pump_no', 'pump_no'],
  vfd_no: ['vfd_no', 'vfd_serial_no'],
  district: ['district', 'District'],
  tehsil: ['tehsil', 'Tehsil'],
  village: ['village', 'Village'],
};

const txt = (row: JammuSwpStatusSiteItem, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

const verifyOf = (r: any) => pickNum(r, 'verify_status', 'inst_verify_status');
const claimOf = (r: any) => pickNum(r, 'claim_status', 'inst_claim_status');
const isInstalled = (r: any) => Number(r.inst_status) === 1;

type VerifyState = 'approved' | 'rejected' | 'pending';
const verifyState = (r: any): VerifyState => {
  const v = verifyOf(r);
  return v === 1 ? 'approved' : v === 2 ? 'rejected' : 'pending';
};
const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const claimLabel = (c: number) => (c === 2 ? 'Approved' : c === 3 ? 'Rejected' : c === 1 ? 'Raised' : 'Not Raised');

/* ───────── Badges ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${tone}`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

const InstallBadge = ({ row }: { row: any }) =>
  isInstalled(row) ? <Badge tone="success">Installed</Badge> : <Badge tone="warning">Pending</Badge>;

const VerifyBadge = ({ row }: { row: any }) => {
  const s = verifyState(row);
  return <Badge tone={s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning'}>{verifyLabel(s)}</Badge>;
};

const ClaimBadge = ({ status }: { status: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  dialogStyle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Action dropdown (menu rendered in <body> so the table never clips it) ───────── */
const MENU_W = 180;

interface MenuItem {
  label: string;
  onClick: () => void;
}

function RowActionDropdown({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuH = items.length * 36 + 8;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < menuH + 8 && r.top > menuH + 8 ? r.top - menuH - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    setPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button type="button" ref={btnRef} className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <span>Action</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} aria-hidden="true">
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            {items.map((it) => (
              <button key={it.label} type="button" className="ula-menu__item" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }}>
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (modals + dropdown; global because they render in <body>) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--md { max-width: 680px; }
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
    color: var(--ax-text-muted, #64748b);
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong, #0f172a); }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }

  @media (max-width: 560px) {
    .ula-m-grid { grid-template-columns: 1fr; }
  }
`;

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px); margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) { .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px) { .solar-erp-page .asw-cards-row { grid-template-columns: 1fr; } }

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
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title { font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md); }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }
  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
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

/* ───────── KPI card (same as Bihar status view) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone] || TONE.accent;
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

/* ───────── Status catalog (grouped like Bihar) ───────── */
export type StatusCategory = 'all' | 'installation' | 'vendor' | 'verification' | 'hoc' | 'claim' | 'payment';

export interface StatusOption {
  key: string;
  label: string;
  sub: string;
  category: StatusCategory;
  tone: KpiTone;
}

const STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All allocated solar water pump sites', category: 'all', tone: 'accent' },

  { key: 'inst-complete', label: 'Installed', sub: 'Completed installations', category: 'installation', tone: 'emerald' },
  { key: 'inst-pending', label: 'Pending', sub: 'Pending field installations', category: 'installation', tone: 'amber' },

  { key: 'vendor-assigned', label: 'Vendor Assigned', sub: 'Assigned to vendor', category: 'vendor', tone: 'cyan' },
  { key: 'vendor-not-assigned', label: 'Vendor Not Assigned', sub: 'Awaiting allocation', category: 'vendor', tone: 'amber' },

  { key: 'verify-approved', label: 'Verify Approved', sub: 'Approved by departmental audit', category: 'verification', tone: 'emerald' },
  { key: 'verify-pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', category: 'verification', tone: 'amber' },
  { key: 'verify-reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', category: 'verification', tone: 'red' },

  { key: 'doc-submitted', label: 'HOC Submitted', sub: 'HOC documentation submitted', category: 'hoc', tone: 'cyan' },
  { key: 'doc-pending', label: 'HOC Pending', sub: 'Awaiting HOC submission', category: 'hoc', tone: 'amber' },

  { key: 'claim-applicable', label: 'Claim Applicable', sub: 'Sites eligible for claim', category: 'claim', tone: 'violet' },
  { key: 'claim-raised', label: 'Claim Raised', sub: 'Payment claim raised', category: 'claim', tone: 'accent' },
  { key: 'claim-approved', label: 'Claim Approved', sub: 'Claims sanctioned', category: 'claim', tone: 'emerald' },

  { key: 'pay-done', label: 'Payment Done', sub: 'Payment fully disbursed', category: 'payment', tone: 'emerald' },
  { key: 'pay-partially', label: 'Payment Partially Done', sub: 'Partially disbursed', category: 'payment', tone: 'cyan' },
  { key: 'pay-pending', label: 'Payment Pending', sub: 'Payment settlement pending', category: 'payment', tone: 'amber' },
];

const STATUS_META_MAP: Record<string, StatusOption> = Object.fromEntries(STATUS_CATALOG.map((s) => [s.key, s]));

const CATEGORY_LABELS: { key: StatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'installation', label: 'Installation' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'verification', label: 'Verification' },
  { key: 'hoc', label: 'HOC Document' },
  { key: 'claim', label: 'Claim' },
  { key: 'payment', label: 'Payment' },
];

const COLUMN_HEADERS = [
  'Sr. No.',
  'Site ID',
  'Applicant / Farmer Name',
  'District',
  'Tehsil',
  'Village',
  'VFD No.',
  'Motor No.',
  'Pump No.',
  'Install Status',
  'Verify Status',
  'Claim Status',
  'Action',
];

export function SWPStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'total';
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);
  const [data, setData] = useState<JammuSwpStatusSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [detailItem, setDetailItem] = useState<JammuSwpStatusSiteItem | null>(null);

  const isAllDistricts = !districtFilter || districtFilter === 'all' || districtFilter === 'All';

  const activeMeta: StatusOption = useMemo(
    () =>
      STATUS_META_MAP[currentStatus] || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        sub: `Filtered by ${currentStatus}`,
        category: 'all' as const,
        tone: 'accent' as const,
      },
    [currentStatus]
  );

  // Sync state from query params (dashboard drill-down links)
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    if (s && s !== currentStatus) setCurrentStatus(s);
    setDistrictFilter(d || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load status sites via API 16 or 17
  const loadStatusData = useCallback(async (statusKey: string, district: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let items: JammuSwpStatusSiteItem[] = [];
      if (district && district !== 'all' && district !== 'All') {
        const res = await jammuSwpService.getDashboardDistrictwise(statusKey, district);
        items = res.data;
      } else {
        const res = await jammuSwpService.getDashboardByStatus(statusKey);
        items = res.data;
      }

      setData(Array.isArray(items) ? items : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Jammu SWP StatusView] API error:', err);
      setData([]);
      setError(err?.message || 'Failed to load installation status records from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatusData(currentStatus, districtFilter);
  }, [currentStatus, districtFilter, loadStatusData]);

  const handleSelectStatus = (key: string) => {
    setCurrentStatus(key);
    setSearchParams(!isAllDistricts ? { status: key, district: districtFilter } : { status: key });
  };

  const handleSelectDistrict = (dist: string) => {
    setDistrictFilter(dist);
    setSearchParams(dist !== 'all' ? { status: currentStatus, district: dist } : { status: currentStatus });
  };

  // District options (+ currently selected one so the dropdown never goes blank)
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = txt(r, 'district');
      if (d) set.add(d.trim());
    });
    if (!isAllDistricts) set.add(districtFilter);
    return Array.from(set).sort();
  }, [data, districtFilter, isAllDistricts]);

  // KPI counts
  const summary = useMemo(() => {
    const total = data.length;
    const installed = data.filter(isInstalled).length;
    const vApp = data.filter((r) => verifyState(r) === 'approved').length;
    const vRej = data.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = total - vApp - vRej;
    return { total, installed, vApp, vRej, vPend };
  }, [data]);

  // Filtered rows (search + verify filter)
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      const dist = txt(row, 'district').trim();
      if (!isAllDistricts && dist.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (verifyFilter !== 'all' && verifyState(row) !== verifyFilter) return false;
      if (!q) return true;
      return [
        row.id,
        txt(row, 'f_farmer_name'),
        txt(row, 'district'),
        txt(row, 'tehsil'),
        txt(row, 'village'),
        txt(row, 'vfd_no'),
        txt(row, 'motor_no'),
        txt(row, 'pump_no'),
      ]
        .filter((v) => v !== undefined && v !== null && v !== '')
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [data, districtFilter, isAllDistricts, search, verifyFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredRows, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, verifyFilter, currentStatus, districtFilter]);

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || !isAllDistricts;
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setDistrictFilter('all');
    setSearchParams({ status: currentStatus });
    setPage(1);
  };

  // Export columns
  const exportCols: ExportColumn<JammuSwpStatusSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Site ID', accessor: (r) => r.id },
      { header: 'Applicant Name', accessor: (r) => txt(r, 'f_farmer_name') || DASH },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Tehsil', accessor: (r) => txt(r, 'tehsil') || DASH },
      { header: 'Village', accessor: (r) => txt(r, 'village') || DASH },
      { header: 'VFD No.', accessor: (r) => txt(r, 'vfd_no') || DASH },
      { header: 'Motor No.', accessor: (r) => txt(r, 'motor_no') || DASH },
      { header: 'Pump No.', accessor: (r) => txt(r, 'pump_no') || DASH },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Claim Status', accessor: (r) => claimLabel(claimOf(r)) },
    ],
    []
  );

  const pageTitle = `Jammu SWP Sites: ${activeMeta.label}${!isAllDistricts ? ` (${districtFilter})` : ''}`;
  const fileBase = `Jammu_SWP_${currentStatus}_Sites`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SWP Installation Data"
        subtitle={`Viewing ${activeMeta.label}${!isAllDistricts ? ` in ${districtFilter}` : ''} — ${activeMeta.sub} · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP', href: '/v/jammu/installation/swp/dashboard' },
          { label: activeMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, districtFilter, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation/swp/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone={activeMeta.tone}
          label={`${activeMeta.label} Total`}
          value={summary.total.toLocaleString('en-IN')}
          sub={!isAllDistricts ? `Filtered in ${districtFilter}` : 'Across all J&K districts'}
          icon={svgIcon(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
        />
        <KpiCard
          tone="emerald"
          label="Installed Sites"
          value={summary.installed.toLocaleString('en-IN')}
          sub={`${summary.total > 0 ? Math.round((summary.installed / summary.total) * 100) : 0}% of current list`}
          icon={svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
        />
        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={summary.vApp.toLocaleString('en-IN')}
          sub={`${summary.vPend} verification pending`}
          icon={svgIcon(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>)}
        />
        <KpiCard
          tone="red"
          label="Verify Rejected"
          value={summary.vRej.toLocaleString('en-IN')}
          sub="Flagged for correction"
          icon={svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>)}
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="SWP Status Sites Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{pageTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{data.length}</span> sites
              {' '}· Status: <b>{activeMeta.label}</b>
              {' '}· Approved <b className="ax-num">{summary.vApp}</b> · Pending <b className="ax-num">{summary.vPend}</b> · Rejected <b className="ax-num">{summary.vRej}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher */}
              <select
                id="swpsv_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeMeta.key}
                onChange={(e) => handleSelectStatus(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[activeMeta.key] && <option value={activeMeta.key}>{activeMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="swpsv_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={isAllDistricts ? 'all' : districtFilter}
                onChange={(e) => handleSelectDistrict(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="all">All Districts ({districts.length})</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="swpsv_verify_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value as typeof verifyFilter)}
                aria-label="Filter by verify status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {hasFilters && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={resetFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search applicant, serial, district…"
                size="sm"
                ariaLabel="Search status sites"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportDataToCSV(fileBase, filteredRows, exportCols)}
                onExportExcel={() => exportDataToExcel(fileBase, filteredRows, exportCols)}
                onExportPDF={() => printTableData(pageTitle, filteredRows, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <caption className="ax-visually-hidden">Jammu SWP Status View</caption>
            <thead className="ax-table__head">
              <tr>
                {COLUMN_HEADERS.map((h) => (
                  <th key={h} className="ax-table__th" scope="col" style={h === 'Action' ? { textAlign: 'center' } : undefined}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu SWP sites…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found for this status"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No sites currently in "${activeMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => (
                  <tr key={row.id || idx} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="ax-table__td" style={{ ...monoCell, fontWeight: 700, color: 'var(--ax-accent)' }}>{row.id}</td>
                    <td className="ax-table__td">
                      <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row, 'f_farmer_name') || DASH}</span>
                    </td>
                    <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                    <td className="ax-table__td">{txt(row, 'tehsil') || DASH}</td>
                    <td className="ax-table__td">{txt(row, 'village') || DASH}</td>
                    <td className="ax-table__td" style={monoCell}>{txt(row, 'vfd_no') || DASH}</td>
                    <td className="ax-table__td" style={monoCell}>{txt(row, 'motor_no') || DASH}</td>
                    <td className="ax-table__td" style={monoCell}>{txt(row, 'pump_no') || DASH}</td>
                    <td className="ax-table__td"><InstallBadge row={row} /></td>
                    <td className="ax-table__td"><VerifyBadge row={row} /></td>
                    <td className="ax-table__td"><ClaimBadge status={claimOf(row)} /></td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <RowActionDropdown
                        items={[
                          { label: 'View Details', onClick: () => setDetailItem(row) },
                          { label: isInstalled(row) ? 'Open Installation Form' : 'Install Site', onClick: () => navigate(`/v/jammu/installation/swp/installation-site?site_id=${row.id}`) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="swpsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="swpsv-detail-title">
                  {txt(detailItem, 'f_farmer_name') || `Site ${detailItem.id}`}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Site ID: {detailItem.id}{txt(detailItem, 'district') ? ` · District: ${txt(detailItem, 'district')}` : ''} · Jammu SWP
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body">
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Applicant:</span> <b>{txt(detailItem, 'f_farmer_name') || DASH}</b></div>
                <div className="ula-m-info"><span>District:</span> <b>{txt(detailItem, 'district') || DASH}</b></div>
                <div className="ula-m-info"><span>Tehsil:</span> <b>{txt(detailItem, 'tehsil') || DASH}</b></div>
                <div className="ula-m-info"><span>Village:</span> <b>{txt(detailItem, 'village') || DASH}</b></div>
                <div className="ula-m-info"><span>VFD No:</span> <b>{txt(detailItem, 'vfd_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Motor No:</span> <b>{txt(detailItem, 'motor_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Pump No:</span> <b>{txt(detailItem, 'pump_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Installation:</span> <b>{isInstalled(detailItem) ? 'Installed' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Claim:</span> <b>{claimLabel(claimOf(detailItem))}</b></div>
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailItem(null)}>Close</button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={() => navigate(`/v/jammu/installation/swp/installation-site?site_id=${detailItem.id}`)}
              >
                Open Form ➔
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SWPStatusView;
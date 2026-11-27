import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { kashmirSrtService } from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Types ───────── */
export type SrtStatusCategory = 'all' | 'material' | 'installation' | 'verification' | 'claim' | 'payment';

export interface SrtStatusMeta {
  key: string;
  label: string;
  category: SrtStatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── Status catalog (grouped like Bihar) ───────── */
export const KASHMIR_SRT_STATUS_CATALOG: SrtStatusMeta[] = [
  { key: 'total', label: 'All Sites (Total)', category: 'all', tone: 'accent', sub: 'All allocated SRT sites' },

  { key: 'material-dispatch', label: 'Material Dispatched', category: 'material', tone: 'cyan', sub: 'Material dispatched to site' },
  { key: 'material-pending', label: 'Material Pending', category: 'material', tone: 'amber', sub: 'Material dispatch pending' },

  { key: 'inst-complete', label: 'Installation Complete', category: 'installation', tone: 'emerald', sub: 'SRT installation completed' },
  { key: 'inst-pending', label: 'Installation Pending', category: 'installation', tone: 'amber', sub: 'Installation yet to be done' },

  { key: 'verify-approved', label: 'Verify Approved', category: 'verification', tone: 'emerald', sub: 'Physically verified and approved' },
  { key: 'verify-pending', label: 'Verify Pending', category: 'verification', tone: 'amber', sub: 'Awaiting verification' },
  { key: 'verify-reject', label: 'Verify Rejected', category: 'verification', tone: 'red', sub: 'Rejected / rework required' },

  { key: 'claim-applicable', label: 'Claim Applicable', category: 'claim', tone: 'cyan', sub: 'Sites eligible for claim' },
  { key: 'claim-raised', label: 'Claim Raised', category: 'claim', tone: 'accent', sub: 'Claim submitted' },
  { key: 'claim-approved', label: 'Claim Approved', category: 'claim', tone: 'emerald', sub: 'Claim approved by authority' },

  { key: 'inst-pay80-done', label: '80% Payment Disbursed', category: 'payment', tone: 'emerald', sub: '80% installment paid' },
  { key: 'inst-pay80-pending', label: '80% Payment Pending', category: 'payment', tone: 'amber', sub: '80% installment pending' },
  { key: 'inst-pay20-done', label: '20% Payment Disbursed', category: 'payment', tone: 'emerald', sub: '20% installment paid' },
  { key: 'inst-pay20-pending', label: '20% Payment Pending', category: 'payment', tone: 'amber', sub: '20% installment pending' },
];

const STATUS_META_MAP: Record<string, SrtStatusMeta> = Object.fromEntries(
  KASHMIR_SRT_STATUS_CATALOG.map((m) => [m.key, m])
);

const CATEGORY_LABELS: { key: SrtStatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'material', label: 'Material' },
  { key: 'installation', label: 'Installation' },
  { key: 'verification', label: 'Verification' },
  { key: 'claim', label: 'Claim' },
  { key: 'payment', label: 'Payment' },
];

/* ───────── Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${tone}`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

const isInstalled = (r: any) => Number(r.site_inst_status) === 1;

type VerifyState = 'approved' | 'rejected' | 'pending';
const verifyState = (r: any): VerifyState => {
  const v = Number(r.inst_verify_status ?? 0);
  return v === 1 ? 'approved' : v === 2 ? 'rejected' : 'pending';
};
const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const verifyTone = (s: VerifyState): Tone => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const claimOf = (r: any) => Number(r.inst_claim_status ?? 0);
const p80Of = (r: any) => Number(r.inst_pay80_status ?? 0);
const p20Of = (r: any) => Number(r.inst_pay20_status ?? 0);

const claimLabel = (c: number) => (c === 2 ? 'Approved' : c === 1 ? 'Raised' : 'Not Raised');
const payLabel = (p: number) => (p === 1 ? 'Done' : p === 2 ? 'Partial' : 'Pending');

const VerifyBadge = ({ row }: { row: any }) => {
  const s = verifyState(row);
  return <Badge tone={verifyTone(s)}>{verifyLabel(s)}</Badge>;
};
const InstallBadge = ({ row }: { row: any }) =>
  isInstalled(row) ? <Badge tone="success">Installed</Badge> : <Badge tone="warning">Pending</Badge>;
const ClaimBadge = ({ status }: { status: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};
const PayBadge = ({ status }: { status: number }) => {
  if (status === 1) return <Badge tone="success">Done</Badge>;
  if (status === 2) return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const rowLabel = (r: any) => r.uid || `#${r.id}`;

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
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
const MENU_W = 190;

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

const COLUMN_HEADERS = [
  'Sr. No.',
  'Site ID',
  'Site Name',
  'District',
  'Contact Person',
  'Contact No.',
  'Install Date',
  'Solar Meter No.',
  'Inverter No.',
  'Install Status',
  'Verify Status',
  'Claim Status',
  '80% Pay',
  '20% Pay',
  'Action',
];

/* ═══════════════════════════════════════════════════════════════ */

export function Kashmir_Installation_StatusView() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const currentStatus = params.status || searchParams.get('status') || 'total';
  const currentDistrict = params.district || searchParams.get('district') || '';

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [districtFilter, setDistrictFilter] = useState(currentDistrict);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [detailItem, setDetailItem] = useState<any | null>(null);

  // Sync route param changes to state
  useEffect(() => {
    setDistrictFilter(currentDistrict);
  }, [currentDistrict]);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const list = districtFilter
        ? await kashmirSrtService.getDashboardDistrictwise(currentStatus, districtFilter)
        : await kashmirSrtService.getDashboardByStatus(currentStatus);
      setSites(Array.isArray(list) ? list : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.warn('Failed to load status sites:', err);
      setApiError(err?.message || 'Failed to load status drilldown records from server.');
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, districtFilter]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Active status meta
  const currentMeta: SrtStatusMeta = useMemo(
    () =>
      STATUS_META_MAP[currentStatus] || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        category: 'all',
        tone: 'accent',
        sub: `Filtered by ${currentStatus}`,
      },
    [currentStatus]
  );

  // District options
  const allDistricts = useMemo(() => {
    const s = new Set<string>();
    sites.forEach((r) => {
      if (r.district && String(r.district).trim()) s.add(String(r.district).trim());
    });
    if (districtFilter) s.add(districtFilter);
    return Array.from(s).sort();
  }, [sites, districtFilter]);

  // KPI counts
  const summary = useMemo(() => {
    const total = sites.length;
    const installed = sites.filter(isInstalled).length;
    const vApp = sites.filter((r) => verifyState(r) === 'approved').length;
    const vRej = sites.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = sites.filter((r) => verifyState(r) === 'pending').length;
    const pay80 = sites.filter((r) => p80Of(r) === 1).length;
    const pay20 = sites.filter((r) => p20Of(r) === 1).length;
    return { total, installed, vApp, vRej, vPend, pay80, pay20 };
  }, [sites]);

  // Client-side search + verify filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sites.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (!q) return true;
      return [r.id, r.uid, r.site_name, r.district, r.contact_person, r.contact_number, r.inverter_no, r.solarmeter_no].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      );
    });
  }, [sites, search, verifyFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, verifyFilter, currentStatus, districtFilter]);

  // ── Navigation (same URL scheme as dashboard) ──
  const goStatus = (status: string, dist?: string) => {
    if (dist) navigate(`/v/kashmir/srt/70mw-installation-districtwise/${status}/${encodeURIComponent(dist)}`);
    else navigate(`/v/kashmir/srt/70mw-installation-view-dashboard/${status}`);
  };

  const handleStatusChange = (newStatus: string) => goStatus(newStatus, districtFilter || undefined);

  const handleDistrictChange = (newDist: string) => {
    setDistrictFilter(newDist);
    setPage(1);
    goStatus(currentStatus, newDist || undefined);
  };

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || !!districtFilter;
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setDistrictFilter('');
    setPage(1);
    goStatus(currentStatus);
  };

  // Export columns
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Site ID', accessor: (r) => rowLabel(r) },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Installation Date', accessor: (r) => r.inst_date || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verification Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Claim Status', accessor: (r) => claimLabel(claimOf(r)) },
      { header: '80% Payment', accessor: (r) => payLabel(p80Of(r)) },
      { header: '20% Payment', accessor: (r) => payLabel(p20Of(r)) },
    ],
    []
  );

  const pageTitle = `Kashmir SRT 70MW: ${currentMeta.label}${districtFilter ? ` (${districtFilter})` : ''}`;
  const fileBase = `Kashmir_SRT_${currentStatus}_sites`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Kashmir SRT 70MW Installation Data"
        subtitle={`Viewing ${currentMeta.label}${districtFilter ? ` in ${districtFilter}` : ''} — Master register of SRT installation, verification, claims and payment status · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Dashboard', href: '/v/kashmir/srt/70mw/installation/dashboard' },
          { label: currentMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadSites} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              Refresh
            </button>
            <Link to="/v/kashmir/srt/70mw/installation/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <Link to="/v/kashmir/srt/70mw/installation/site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Install Site</span>
            </Link>
          </div>
        }
      />

      {apiError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{apiError}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone={currentMeta.tone}
          label={`${currentMeta.label} Total`}
          value={summary.total.toLocaleString('en-IN')}
          sub={districtFilter ? `Filtered in ${districtFilter}` : 'Across all Kashmir districts'}
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
          tone="violet"
          label="80% Payment Settled"
          value={summary.pay80.toLocaleString('en-IN')}
          sub={`${summary.pay20} 20% paid · ${summary.vRej} rejected`}
          icon={svgIcon(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)}
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Kashmir SRT 70MW Status View">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{pageTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> sites
              {' '}· Status: <b>{currentMeta.label}</b>
              {' '}· Approved <b className="ax-num">{summary.vApp}</b> · Pending <b className="ax-num">{summary.vPend}</b> · Rejected <b className="ax-num">{summary.vRej}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher */}
              <select
                id="srtsv_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {KASHMIR_SRT_STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[currentStatus] && <option value={currentStatus}>{currentMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="srtsv_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="">All Districts ({allDistricts.length})</option>
                {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="srtsv_verify_filter"
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
                placeholder="Search site, contact, meter…"
                size="sm"
                ariaLabel="Search installations"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV(fileBase, filtered, exportCols)}
                onExportExcel={() => exportDataToExcel(fileBase, filtered, exportCols)}
                onExportPDF={() => printTableData(pageTitle, filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <caption className="ax-visually-hidden">Kashmir SRT 70MW Status View</caption>
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kashmir SRT installation sites…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found matching criteria"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No sites currently in "${currentMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, index) => {
                  const label = rowLabel(r);
                  const installed = isInstalled(r);
                  const isApproved =
                    verifyState(r) === 'approved' ||
                    Number(r.inst_verify_status) === 1 ||
                    String(r.inst_verify_status).trim().toLowerCase() === 'approved' ||
                    Number(r.verify_status) === 1 ||
                    String(r.verify_status).trim().toLowerCase() === 'approved';

                  const items: MenuItem[] = installed
                    ? [
                        { label: 'View Details', onClick: () => setDetailItem(r) },
                        ...(!isApproved
                          ? [
                              {
                                label: 'Edit Installation',
                                onClick: () => navigate(`/v/kashmir/srt/70mw/installation/site?edit=1&srt_id=${r.id}`),
                              },
                            ]
                          : []),
                        { label: 'Open Installed Sites', onClick: () => navigate('/v/kashmir/srt/70mw/view-install-sites') },
                      ]
                    : [
                        { label: 'View Details', onClick: () => setDetailItem(r) },
                        { label: 'Install Site', onClick: () => navigate(`/v/kashmir/srt/70mw/installation/site?srt_id=${r.id}`) },
                      ];

                  return (
                    <tr key={r.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)', fontFamily: 'var(--ax-font-mono, monospace)' }}>{label}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(r.site_name)}</span>
                      </td>
                      <td className="ax-table__td"><b>{txt(r.district)}</b></td>
                      <td className="ax-table__td">{txt(r.contact_person)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(r.contact_number)}</td>
                      <td className="ax-table__td">{txt(r.inst_date)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(r.solarmeter_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(r.inverter_no)}</td>

                      <td className="ax-table__td"><InstallBadge row={r} /></td>
                      <td className="ax-table__td"><VerifyBadge row={r} /></td>
                      <td className="ax-table__td"><ClaimBadge status={claimOf(r)} /></td>
                      <td className="ax-table__td"><PayBadge status={p80Of(r)} /></td>
                      <td className="ax-table__td"><PayBadge status={p20Of(r)} /></td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown items={items} />
                      </td>
                    </tr>
                  );
                })}
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
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="srtsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="srtsv-detail-title">
                  SRT Site Record {rowLabel(detailItem)}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {detailItem.district ? `District: ${detailItem.district} · ` : ''}Project: Kashmir SRT 70MW
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body">
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Site Name:</span> <b>{txt(detailItem.site_name)}</b></div>
                <div className="ula-m-info"><span>District:</span> <b>{txt(detailItem.district)}</b></div>
                <div className="ula-m-info"><span>Contact Person:</span> <b>{txt(detailItem.contact_person)}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{txt(detailItem.contact_number)}</b></div>
                <div className="ula-m-info"><span>Install Date:</span> <b>{txt(detailItem.inst_date)}</b></div>
                <div className="ula-m-info"><span>Solar Meter No:</span> <b>{txt(detailItem.solarmeter_no)}</b></div>
                <div className="ula-m-info"><span>Inverter No:</span> <b>{txt(detailItem.inverter_no)}</b></div>
                <div className="ula-m-info"><span>Installation:</span> <b>{isInstalled(detailItem) ? 'Installed' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Claim:</span> <b>{claimLabel(claimOf(detailItem))}</b></div>
                <div className="ula-m-info"><span>80% Payment:</span> <b>{payLabel(p80Of(detailItem))}</b></div>
                <div className="ula-m-info"><span>20% Payment:</span> <b>{payLabel(p20Of(detailItem))}</b></div>
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailItem(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Kashmir_Installation_StatusView;
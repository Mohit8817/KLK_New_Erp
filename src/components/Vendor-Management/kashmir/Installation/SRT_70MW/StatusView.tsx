import { useState, useMemo, useEffect, useCallback, type ReactNode, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  kashmirAdminService,
  resolveKashmirMediaUrl,
  getKashmirMediaCandidates,
} from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import {
  MediaFileThumbnail,
  MediaLightbox,
} from '../../../up/Installation/upInstallationShared';

type Row = any;
type VerifyFilter = 'all' | 'approved' | 'pending' | 'rejected';
type InstallFilter = 'all' | 'installed' | 'pending';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const siteNameOf = (r: Row) => r.site_name || r.name || `Site #${r.id}`;
const siteCodeOf = (r: Row) => r.site_code || r.uid || (r.id ? `JK-${r.id}` : DASH);
const isInstalled = (r: Row) => Number(r.site_inst_status ?? r.inst_status ?? 0) === 1;

const verifyState = (r: Row): 'approved' | 'rejected' | 'pending' => {
  const v = Number(r.inst_verify_status ?? 0);
  return v === 1 ? 'approved' : v === 2 ? 'rejected' : 'pending';
};
const verifyLabel = (s: 'approved' | 'rejected' | 'pending') =>
  s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending';
const verifyTone = (s: 'approved' | 'rejected' | 'pending') =>
  s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning';

const isMaterialDispatched = (r: Row): boolean => {
  const s = String(r.material_status ?? '').toLowerCase().trim();
  return Number(r.material_status ?? 0) === 1 || s === 'dispatched' || s === 'complete' || s === 'dispatched site';
};

const getClaimStatusLabel = (status: unknown): string => {
  const n = Number(status ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Rejected';
  if (n === 1) return 'Pending';
  return 'Not Raised';
};

const getClaimStatusTone = (status: unknown): 'success' | 'danger' | 'warning' | 'neutral' => {
  const n = Number(status ?? 0);
  if (n === 2) return 'success';
  if (n === 3) return 'danger';
  if (n === 1) return 'warning';
  return 'neutral';
};

const getPaymentStatusLabel = (status: unknown): string => {
  return Number(status ?? 0) === 1 ? 'Paid' : 'Pending';
};

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

const parseStringArray = (raw?: string | string[] | null): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '[]') return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {}
  }
  return trimmed
    .split(',')
    .map((s) => s.trim().replace(/^["'[\]]+|["'[\]]+$/g, ''))
    .filter(Boolean);
};

function normalizeKashmirStatus(status?: string | null): string {
  if (!status) return 'total-site';
  const s = status.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (s === 'all' || s === 'total' || s === 'total-site' || s === 'site-count' || s === 'total-sites') return 'total-site';
  if (s === 'complete' || s === 'installed') return 'complete';
  if (s === 'pending' || s === 'install-pending') return 'pending';
  if (s === 'assigned' || s === 'site-assigned' || s === 'total-assigned') return 'site-assigned';
  if (s === 'site-not-assigned' || s === 'unassigned') return 'site-not-assigned';
  if (s === 'material-dispatch' || s === 'material-dispatched') return 'material-dispatch';
  if (s === 'material-pending') return 'material-pending';
  if (s === 'verify-approved' || s === 'verified') return 'verify-approved';
  if (s === 'verify-pending' || s === 'in-audit') return 'verify-pending';
  if (s === 'verify-reject' || s === 'rejected') return 'verify-reject';
  if (s === 'claim-raised' || s === 'claims') return 'claim-raised';
  if (s === 'claim-applicable') return 'claim-applicable';
  if (s === 'pay80-complete' || s === 'pay-complete' || s === 'payment-settled') return 'pay80-complete';
  if (s === 'pay20-complete') return 'pay20-complete';
  if (s === 'pay80-pending') return 'pay80-pending';
  if (s === 'pay20-pending') return 'pay20-pending';
  if (s === 'inst-doc-complete' || s === 'doc-complete') return 'inst-doc-complete';
  if (s === 'inst-doc-pending' || s === 'doc-pending') return 'inst-doc-pending';
  return s;
}

function getStatusDisplayLabel(status?: string | null): string {
  const s = (status || 'total-site').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (s === 'total-site' || s === 'total' || s === 'all') return 'TOTAL SITE';
  if (s === 'complete' || s === 'installed') return 'COMPLETED';
  if (s === 'pending' || s === 'install-pending') return 'INSTALLATION PENDING';
  if (s === 'site-assigned' || s === 'assigned') return 'SITE ASSIGNED';
  if (s === 'site-not-assigned') return 'SITE NOT ASSIGNED';
  if (s === 'material-dispatch' || s === 'material-dispatched') return 'MATERIAL DISPATCHED';
  if (s === 'material-pending') return 'MATERIAL PENDING';
  if (s === 'verify-approved' || s === 'verified') return 'VERIFY APPROVED';
  if (s === 'verify-pending' || s === 'in-audit') return 'VERIFY PENDING';
  if (s === 'verify-reject' || s === 'rejected') return 'VERIFY REJECTED';
  if (s === 'claim-raised' || s === 'claims') return 'CLAIM RAISED';
  if (s === 'claim-applicable') return 'CLAIM APPLICABLE';
  if (s === 'pay80-complete') return '80% PAYMENT COMPLETE';
  if (s === 'pay80-pending') return '80% PAYMENT PENDING';
  if (s === 'pay20-complete') return '20% PAYMENT COMPLETE';
  if (s === 'pay20-pending') return '20% PAYMENT PENDING';
  if (s === 'inst-doc-complete') return 'DOCUMENTS COMPLETED';
  if (s === 'inst-doc-pending') return 'DOCUMENTS PENDING';
  return status ? status.replace(/[-_]/g, ' ').toUpperCase() : 'TOTAL SITE';
}

/* ───────── Responsive page CSS (Exact Karnataka / Assam SWP Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* ───────── Modal Dialog Styles ───────── */
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
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── Modal Dialog ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 680,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
  footer?: ReactNode;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── KPI card (Exact Karnataka SWP Reference) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

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
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function StatusView() {
  const [searchParams] = useSearchParams();
  const rawStatus = searchParams.get('status') || 'total-site';
  const districtParam = searchParams.get('district');
  const vendorParam = searchParams.get('vendor');

  const normalizedStatus = normalizeKashmirStatus(rawStatus);
  const statusLabel = getStatusDisplayLabel(rawStatus);

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>('all');
  const [installFilter, setInstallFilter] = useState<InstallFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewDetailSite, setViewDetailSite] = useState<Row | null>(null);

  // Panel Serial modal & Lightbox
  const [panelModalSite, setPanelModalSite] = useState<Row | null>(null);
  const [panelSearch, setPanelSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const pageTitle = useMemo(() => {
    let t = `Kashmir SRT 70MW Sites: ${statusLabel}`;
    if (districtParam) t += ` (${districtParam})`;
    if (vendorParam) t += ` (Vendor #${vendorParam})`;
    return t;
  }, [statusLabel, districtParam, vendorParam]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let res: any;
      if (districtParam && districtParam !== 'all') {
        res = await kashmirAdminService.getDistrictWiseData(normalizedStatus, districtParam);
      } else if (vendorParam && vendorParam !== 'all') {
        res = await kashmirAdminService.getVendorWiseData(normalizedStatus, vendorParam);
      } else {
        res = await kashmirAdminService.getViewDashboard(normalizedStatus);
      }

      let data: Row[] = [];
      const raw = res?.data ?? res;
      if (Array.isArray(raw)) {
        data = raw;
      } else if (Array.isArray(raw?.kashmirsrt70mw)) {
        data = raw.kashmirsrt70mw;
      } else if (Array.isArray(raw?.sites)) {
        data = raw.sites;
      } else if (Array.isArray(raw?.data)) {
        data = raw.data;
      } else if (Array.isArray(res?.kashmirsrt70mw)) {
        data = res.kashmirsrt70mw;
      } else if (Array.isArray(res?.sites)) {
        data = res.sites;
      }
      setItems(data);
    } catch (err: any) {
      console.error('Kashmir StatusView load error:', err);
      setErrorMsg(err?.message || 'Failed to load status drilldown records from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [normalizedStatus, districtParam, vendorParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── KPI summary (derived from real data) ── */
  const summary = useMemo(() => {
    const total = items.length;
    const installed = items.filter(isInstalled).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    return {
      total,
      installed,
      notInstalled: total - installed,
      vApp,
      vRej,
      vPend: total - vApp - vRej,
    };
  }, [items]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    return Array.from(set).sort();
  }, [items]);

  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      const v = r.vendor_name || r.vendors?.name;
      if (v) set.add(String(v).trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (installFilter !== 'all') {
        const inst = isInstalled(r);
        if (installFilter === 'installed' && !inst) return false;
        if (installFilter === 'pending' && inst) return false;
      }
      if (
        selectedDistrict !== 'all' &&
        String(r.district || '').trim().toLowerCase() !== selectedDistrict.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedVendor !== 'all' &&
        String(r.vendor_name || r.vendors?.name || '').trim().toLowerCase() !== selectedVendor.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      const serials = parseStringArray(r.panel_no).join(' ');
      return [
        siteNameOf(r),
        r.id,
        r.site_code,
        r.uid,
        r.state,
        r.department_name,
        r.dept_name,
        r.district,
        r.location,
        r.address,
        r.firm_name,
        r.work_order_no,
        r.loa_no,
        r.phase,
        r.connection_phase,
        r.ca_no,
        r.vendor_name,
        r.vendors?.name,
        r.contact_person,
        r.contact_person_phone,
        r.contact_number,
        r.solar_meter_no,
        r.solarmeter_no,
        r.meter_no,
        r.inverter_no,
        r.net_smart_meter_no,
        r.nm_sm_no,
        serials,
        r.loger_no,
        r.sanction_load,
        r.inst_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter, installFilter, selectedDistrict, selectedVendor]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters =
    !!search ||
    verifyFilter !== 'all' ||
    installFilter !== 'all' ||
    selectedDistrict !== 'all' ||
    selectedVendor !== 'all';

  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setInstallFilter('all');
    setSelectedDistrict('all');
    setSelectedVendor('all');
    setCurrentPage(1);
  };

  /* ── Panel Serial Modal Filtered Items ── */
  const modalAllSerials = useMemo(
    () => (panelModalSite ? parseStringArray(panelModalSite.panel_no) : []),
    [panelModalSite]
  );

  const modalFilteredSerials = useMemo(() => {
    const q = panelSearch.trim().toLowerCase();
    return modalAllSerials
      .map((serial, index) => ({ serial, index: index + 1 }))
      .filter((item) => !q || item.serial.toLowerCase().includes(q) || String(item.index) === q);
  }, [modalAllSerials, panelSearch]);

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state || 'Jammu & Kashmir' },
      { header: 'Department Name', accessor: (r) => r.department_name || r.dept_name || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Location', accessor: (r) => r.location || r.address || DASH },
      { header: 'Site Name', accessor: (r) => siteNameOf(r) },
      { header: 'Site Code', accessor: (r) => siteCodeOf(r) },
      { header: 'Firm Name', accessor: (r) => r.firm_name || DASH },
      { header: 'Work Order No.', accessor: (r) => r.work_order_no || DASH },
      { header: 'Work Date', accessor: (r) => fmtDate(r.work_date) },
      { header: 'LOA No.', accessor: (r) => r.loa_no || DASH },
      { header: 'Phase', accessor: (r) => r.phase || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH) },
      { header: 'Connection Phase', accessor: (r) => r.connection_phase || DASH },
      { header: 'CA No', accessor: (r) => r.ca_no || DASH },
      { header: 'Material Status', accessor: (r) => (isMaterialDispatched(r) ? 'Dispatched' : 'Pending') },
      { header: 'Material Dispatch Date', accessor: (r) => fmtDate(r.material_dispatch_date) },
      { header: 'Installation Vendor', accessor: (r) => r.vendor_name || r.vendors?.name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || r.installation_date) },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Person Phone', accessor: (r) => r.contact_person_phone || r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || r.solarmeter_no || r.meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || r.nm_sm_no || DASH },
      { header: 'Panel No.', accessor: (r) => parseStringArray(r.panel_no).join(', ') || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'System Image', accessor: (r) => (r.system_image ? 'Available' : DASH) },
      { header: 'Inverter Image', accessor: (r) => (r.inverter_image ? 'Available' : DASH) },
      { header: 'Panel Image', accessor: (r) => (r.panel_image ? 'Available' : DASH) },
      { header: 'Net/Smart Meter Image', accessor: (r) => ((r.net_smart_meter_image || r.nm_sm_image) ? 'Available' : DASH) },
      { header: 'Loger Image', accessor: (r) => (r.loger_image ? 'Available' : DASH) },
      { header: 'Latitude', accessor: (r) => txt(r.latitude ?? r.lat ?? r.inst_latitude) },
      { header: 'Longitude', accessor: (r) => txt(r.longitude ?? r.long ?? r.inst_longitude) },
      { header: 'Installation Remarks', accessor: (r) => r.inst_remarks || DASH },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verification Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Claim Status', accessor: (r) => getClaimStatusLabel(r.inst_claim_status) },
      { header: 'Payment 80%', accessor: (r) => getPaymentStatusLabel(r.inst_pay80_status) },
      { header: 'Payment 20%', accessor: (r) => getPaymentStatusLabel(r.inst_pay20_status) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Kashmir_SRT_70MW_${statusLabel.replace(/\s+/g, '_')}_Drilldown`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Kashmir_SRT_70MW_${statusLabel.replace(/\s+/g, '_')}_Drilldown`, filtered, exportCols);
  const handlePdf = () => printTableData(pageTitle, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title={pageTitle}
        subtitle="Detailed status drilldown of Kashmir SRT 70MW site records"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Kashmir SRT 70MW Dashboard', href: '/vendor-management/kashmir/srt70mw/installation/dashboard' },
          { label: 'Status Drilldown' },
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
            <Link to="/vendor-management/kashmir/srt70mw/installation/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>
            ✕
          </button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row (Exact Karnataka SWP Layout) ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Records"
              value={summary.total.toLocaleString('en-IN')}
              sub={`${summary.installed} installed · ${summary.notInstalled} pending`}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Installed"
              value={summary.installed.toLocaleString('en-IN')}
              sub={`${summary.notInstalled} installation pending`}
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Verify Approved"
              value={summary.vApp.toLocaleString('en-IN')}
              sub={`${summary.vPend} pending · ${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Verify Pending"
              value={summary.vPend.toLocaleString('en-IN')}
              sub={`${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Main Table Card (Exact Karnataka SWP Layout) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Kashmir SRT 70MW status drilldown">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Status Drilldown Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{items.length}</span> sites
                {' '}· Installed <b className="ax-num">{summary.installed}</b> · Verified <b className="ax-num">{summary.vApp}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as VerifyFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {uniqueVendors.length > 1 && (
                  <select
                    className="ax-input ax-input--sm"
                    aria-label="Filter by vendor"
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  >
                    <option value="all">All Vendors</option>
                    {uniqueVendors.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}

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
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search site, code, vendor, CA No, meter…"
                  size="sm"
                  ariaLabel="Search sites"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 3400 }}>
              <caption className="ax-visually-hidden">Kashmir SRT 70MW status drilldown</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Department Name</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Location</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Site Code</th>
                  <th className="ax-table__th" scope="col">Firm Name</th>
                  <th className="ax-table__th" scope="col">Work Order No.</th>
                  <th className="ax-table__th" scope="col">Work Date</th>
                  <th className="ax-table__th" scope="col">LOA No.</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">Sanction Load</th>
                  <th className="ax-table__th" scope="col">Connection Phase</th>
                  <th className="ax-table__th" scope="col">CA No</th>
                  <th className="ax-table__th" scope="col">Material Status</th>
                  <th className="ax-table__th" scope="col">Material Dispatch Date</th>
                  <th className="ax-table__th" scope="col">Installation Vendor</th>
                  <th className="ax-table__th" scope="col">Installation Date</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Person Phone</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Panel No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col">System Image</th>
                  <th className="ax-table__th" scope="col">Inverter Image</th>
                  <th className="ax-table__th" scope="col">Panel Image</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter Image</th>
                  <th className="ax-table__th" scope="col">Loger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Installation Remarks</th>
                  <th className="ax-table__th" scope="col">Installation Status</th>
                  <th className="ax-table__th" scope="col">Verification Status</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment 80%</th>
                  <th className="ax-table__th" scope="col">Payment 20%</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={40} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading drilldown records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={40} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No records found"
                        message={
                          hasFilters
                            ? 'No sites match your filters. Try clearing filters or search term.'
                            : errorMsg || 'No sites matched this status or filter query.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const installed = isInstalled(row);
                    const vs = verifyState(row);
                    const serials = parseStringArray(row.panel_no);
                    const matDispatched = isMaterialDispatched(row);
                    const netSmartImg = row.net_smart_meter_image || row.nm_sm_image;

                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        {/* 1. Sr. No. */}
                        <td className="ax-table__td ax-num">{srNo}</td>

                        {/* 2. State */}
                        <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>

                        {/* 3. Department Name */}
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.department_name || row.dept_name || ''}>
                          {txt(row.department_name || row.dept_name)}
                        </td>

                        {/* 4. District */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.district)}</td>

                        {/* 5. Location */}
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.location || row.address || ''}>
                          {txt(row.location || row.address)}
                        </td>

                        {/* 6. Site Name */}
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }} title={siteNameOf(row)}>
                          {siteNameOf(row)}
                        </td>

                        {/* 7. Site Code */}
                        <td
                          className="ax-table__td"
                          style={{
                            fontFamily: 'var(--ax-font-mono, monospace)',
                            fontWeight: 600,
                            color: 'var(--ax-accent)',
                          }}
                        >
                          {siteCodeOf(row)}
                        </td>

                        {/* 8. Firm Name */}
                        <td className="ax-table__td">{txt(row.firm_name)}</td>

                        {/* 9. Work Order No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.work_order_no)}
                        </td>

                        {/* 10. Work Date */}
                        <td className="ax-table__td">{fmtDate(row.work_date)}</td>

                        {/* 11. LOA No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.loa_no)}
                        </td>

                        {/* 12. Phase */}
                        <td className="ax-table__td">{txt(row.phase)}</td>

                        {/* 13. Sanction Load */}
                        <td className="ax-table__td">
                          {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                        </td>

                        {/* 14. Connection Phase */}
                        <td className="ax-table__td">{txt(row.connection_phase)}</td>

                        {/* 15. CA No */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.ca_no)}
                        </td>

                        {/* 16. Material Status */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${matDispatched ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                            <span className="ax-badge__dot" />
                            {matDispatched ? 'Dispatched' : 'Pending'}
                          </span>
                        </td>

                        {/* 17. Material Dispatch Date */}
                        <td className="ax-table__td">{fmtDate(row.material_dispatch_date)}</td>

                        {/* 18. Installation Vendor */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {txt(row.vendor_name || row.vendors?.name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH))}
                        </td>

                        {/* 19. Installation Date */}
                        <td className="ax-table__td">{fmtDate(row.inst_date || row.installation_date)}</td>

                        {/* 20. Contact Person */}
                        <td className="ax-table__td">{txt(row.contact_person)}</td>

                        {/* 21. Contact Person Phone */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.contact_person_phone || row.contact_number)}
                        </td>

                        {/* 22. Solar Meter No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.solar_meter_no || row.solarmeter_no || row.meter_no)}
                        </td>

                        {/* 23. Inverter No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.inverter_no)}
                        </td>

                        {/* 24. Net/Smart Meter No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.net_smart_meter_no || row.nm_sm_no)}
                        </td>

                        {/* 25. Panel No. */}
                        <td className="ax-table__td">
                          {serials.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {serials.slice(0, 2).map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: 10.5,
                                    background: 'var(--ax-surface-subtle, #f1f5f9)',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {serials.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelModalSite(row);
                                    setPanelSearch('');
                                  }}
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--ax-accent, #2563eb)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    padding: 0,
                                    fontWeight: 600,
                                  }}
                                >
                                  +{serials.length - 2} more (Search)
                                </button>
                              )}
                            </div>
                          ) : (
                            DASH
                          )}
                        </td>

                        {/* 26. Loger No. */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.loger_no)}
                        </td>

                        {/* 27. System Image */}
                        <td className="ax-table__td">
                          <MediaFileThumbnail
                            url={row.system_image ? resolveKashmirMediaUrl(row.system_image) : null}
                            candidates={row.system_image ? getKashmirMediaCandidates(row.system_image) : undefined}
                            alt="System Image"
                            onClick={(url, title) => setLightbox({ url, title: title || 'System Image' })}
                          />
                        </td>

                        {/* 28. Inverter Image */}
                        <td className="ax-table__td">
                          <MediaFileThumbnail
                            url={row.inverter_image ? resolveKashmirMediaUrl(row.inverter_image) : null}
                            candidates={row.inverter_image ? getKashmirMediaCandidates(row.inverter_image) : undefined}
                            alt="Inverter Image"
                            onClick={(url, title) => setLightbox({ url, title: title || 'Inverter Image' })}
                          />
                        </td>

                        {/* 29. Panel Image */}
                        <td className="ax-table__td">
                          <MediaFileThumbnail
                            url={row.panel_image ? resolveKashmirMediaUrl(row.panel_image) : null}
                            candidates={row.panel_image ? getKashmirMediaCandidates(row.panel_image) : undefined}
                            alt="Panel Image"
                            onClick={(url, title) => setLightbox({ url, title: title || 'Panel Image' })}
                          />
                        </td>

                        {/* 30. Net/Smart Meter Image */}
                        <td className="ax-table__td">
                          <MediaFileThumbnail
                            url={netSmartImg ? resolveKashmirMediaUrl(netSmartImg) : null}
                            candidates={netSmartImg ? getKashmirMediaCandidates(netSmartImg) : undefined}
                            alt="Net/Smart Meter Image"
                            onClick={(url, title) => setLightbox({ url, title: title || 'Net/Smart Meter Image' })}
                          />
                        </td>

                        {/* 31. Loger Image */}
                        <td className="ax-table__td">
                          <MediaFileThumbnail
                            url={row.loger_image ? resolveKashmirMediaUrl(row.loger_image) : null}
                            candidates={row.loger_image ? getKashmirMediaCandidates(row.loger_image) : undefined}
                            alt="Loger Image"
                            onClick={(url, title) => setLightbox({ url, title: title || 'Loger Image' })}
                          />
                        </td>

                        {/* 32. Latitude */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.latitude ?? row.lat ?? row.inst_latitude)}
                        </td>

                        {/* 33. Longitude */}
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {txt(row.longitude ?? row.long ?? row.inst_longitude)}
                        </td>

                        {/* 34. Installation Remarks */}
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={row.inst_remarks || ''}
                        >
                          {txt(row.inst_remarks)}
                        </td>

                        {/* 35. Installation Status */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              installed ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {installed ? 'Installed' : 'Pending'}
                          </span>
                        </td>

                        {/* 36. Verification Status */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${verifyTone(vs)}`}>
                            <span className="ax-badge__dot" />
                            {verifyLabel(vs)}
                          </span>
                        </td>

                        {/* 37. Claim Status */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${getClaimStatusTone(row.inst_claim_status)}`}>
                            <span className="ax-badge__dot" />
                            {getClaimStatusLabel(row.inst_claim_status)}
                          </span>
                        </td>

                        {/* 38. Payment 80% */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${Number(row.inst_pay80_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                            <span className="ax-badge__dot" />
                            {getPaymentStatusLabel(row.inst_pay80_status)}
                          </span>
                        </td>

                        {/* 39. Payment 20% */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ${Number(row.inst_pay20_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                            <span className="ax-badge__dot" />
                            {getPaymentStatusLabel(row.inst_pay20_status)}
                          </span>
                        </td>

                        {/* 40. Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--subtle ax-btn--xs"
                            onClick={() => setViewDetailSite(row)}
                            title="View Site Details"
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Quick Detail Modal ── */}
      {viewDetailSite && (
        <Modal
          open={!!viewDetailSite}
          onClose={() => setViewDetailSite(null)}
          title={`Site Details: ${siteNameOf(viewDetailSite)}`}
          subtitle={`Code: ${siteCodeOf(viewDetailSite)} · District: ${viewDetailSite.district || DASH}`}
          maxWidth={820}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 1. General & Department Info */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                Site & Department Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>State</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{viewDetailSite.state || 'Jammu & Kashmir'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department Name</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.department_name || viewDetailSite.dept_name)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>District</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.district)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.location || viewDetailSite.address)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Site Code</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace', color: 'var(--ax-accent)' }}>{siteCodeOf(viewDetailSite)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Firm Name</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.firm_name)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Work Order No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.work_order_no)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Work Date</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{fmtDate(viewDetailSite.work_date)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>LOA No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.loa_no)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Phase & Conn. Phase</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.phase)} / {txt(viewDetailSite.connection_phase)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sanction Load</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{viewDetailSite.sanction_load ? `${viewDetailSite.sanction_load} kW` : DASH}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CA No</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.ca_no)}</div>
                </div>
              </div>
            </div>

            {/* 2. Vendor & Contacts */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                Vendor & Contact Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Installation Vendor</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.vendor_name || viewDetailSite.vendors?.name || viewDetailSite.inst_vendor)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{txt(viewDetailSite.contact_person)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contact Person Phone</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.contact_person_phone || viewDetailSite.contact_number)}</div>
                </div>
              </div>
            </div>

            {/* 3. Meters & Equipment */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                Meter & Equipment Serials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Solar Meter No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.solar_meter_no || viewDetailSite.solarmeter_no || viewDetailSite.meter_no)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inverter No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.inverter_no)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Net/Smart Meter No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.net_smart_meter_no || viewDetailSite.nm_sm_no)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Loger No.</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{txt(viewDetailSite.loger_no)}</div>
                </div>
              </div>
              {/* Panel Serials preview */}
              {parseStringArray(viewDetailSite.panel_no).length > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                    Panel Serials ({parseStringArray(viewDetailSite.panel_no).length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parseStringArray(viewDetailSite.panel_no).map((s, i) => (
                      <span key={i} style={{ fontFamily: 'monospace', fontSize: 11, background: '#ffffff', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--ax-border)' }}>
                        #{i + 1} {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Workflow Status & Payment */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                Workflow Status & Payments
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Material Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                    {isMaterialDispatched(viewDetailSite) ? 'Dispatched' : 'Pending'} {viewDetailSite.material_dispatch_date && `(${fmtDate(viewDetailSite.material_dispatch_date)})`}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Installation Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                    {isInstalled(viewDetailSite) ? 'Installed' : 'Pending'} {viewDetailSite.inst_date && `(${fmtDate(viewDetailSite.inst_date || viewDetailSite.installation_date)})`}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Verification Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{verifyLabel(verifyState(viewDetailSite))}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Claim Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getClaimStatusLabel(viewDetailSite.inst_claim_status)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Payment 80%</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getPaymentStatusLabel(viewDetailSite.inst_pay80_status)}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Payment 20%</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getPaymentStatusLabel(viewDetailSite.inst_pay20_status)}</div>
                </div>
              </div>
            </div>

            {/* 5. GPS Coordinates */}
            {(viewDetailSite.latitude || viewDetailSite.longitude || viewDetailSite.lat || viewDetailSite.long || viewDetailSite.inst_latitude || viewDetailSite.inst_longitude) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                  GPS Coordinates
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
                  Latitude: {txt(viewDetailSite.latitude ?? viewDetailSite.lat ?? viewDetailSite.inst_latitude)} · Longitude: {txt(viewDetailSite.longitude ?? viewDetailSite.long ?? viewDetailSite.inst_longitude)}
                </div>
              </div>
            )}

            {/* 6. Site Images */}
            {(viewDetailSite.system_image || viewDetailSite.inverter_image || viewDetailSite.panel_image || viewDetailSite.net_smart_meter_image || viewDetailSite.nm_sm_image || viewDetailSite.loger_image) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                  Site Images (Click to Preview)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {viewDetailSite.system_image && (
                    <div
                      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)', cursor: 'pointer' }}
                      onClick={() => setLightbox({ url: resolveKashmirMediaUrl(viewDetailSite.system_image), title: 'System Image' })}
                    >
                      <img
                        src={resolveKashmirMediaUrl(viewDetailSite.system_image)}
                        alt="System"
                        style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div style={{ padding: '4px 6px', fontSize: 10, textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>System</div>
                    </div>
                  )}
                  {viewDetailSite.inverter_image && (
                    <div
                      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)', cursor: 'pointer' }}
                      onClick={() => setLightbox({ url: resolveKashmirMediaUrl(viewDetailSite.inverter_image), title: 'Inverter Image' })}
                    >
                      <img
                        src={resolveKashmirMediaUrl(viewDetailSite.inverter_image)}
                        alt="Inverter"
                        style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div style={{ padding: '4px 6px', fontSize: 10, textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>Inverter</div>
                    </div>
                  )}
                  {viewDetailSite.panel_image && (
                    <div
                      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)', cursor: 'pointer' }}
                      onClick={() => setLightbox({ url: resolveKashmirMediaUrl(viewDetailSite.panel_image), title: 'Panel Image' })}
                    >
                      <img
                        src={resolveKashmirMediaUrl(viewDetailSite.panel_image)}
                        alt="Panel"
                        style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div style={{ padding: '4px 6px', fontSize: 10, textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>Panel</div>
                    </div>
                  )}
                  {(viewDetailSite.net_smart_meter_image || viewDetailSite.nm_sm_image) && (
                    <div
                      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)', cursor: 'pointer' }}
                      onClick={() => setLightbox({ url: resolveKashmirMediaUrl(viewDetailSite.net_smart_meter_image || viewDetailSite.nm_sm_image), title: 'Net/Smart Meter Image' })}
                    >
                      <img
                        src={resolveKashmirMediaUrl(viewDetailSite.net_smart_meter_image || viewDetailSite.nm_sm_image)}
                        alt="Net/Smart Meter"
                        style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div style={{ padding: '4px 6px', fontSize: 10, textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>Net Meter</div>
                    </div>
                  )}
                  {viewDetailSite.loger_image && (
                    <div
                      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)', cursor: 'pointer' }}
                      onClick={() => setLightbox({ url: resolveKashmirMediaUrl(viewDetailSite.loger_image), title: 'Loger Image' })}
                    >
                      <img
                        src={resolveKashmirMediaUrl(viewDetailSite.loger_image)}
                        alt="Loger"
                        style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div style={{ padding: '4px 6px', fontSize: 10, textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>Loger</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. Remarks */}
            {viewDetailSite.inst_remarks && (
              <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Installation Remarks</div>
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--ax-text)' }}>{viewDetailSite.inst_remarks}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Panel Serial Numbers Search Modal ── */}
      <Modal
        open={Boolean(panelModalSite)}
        onClose={() => {
          setPanelModalSite(null);
          setPanelSearch('');
        }}
        title="Panel Serial Numbers"
        subtitle={
          panelModalSite
            ? `Site #${panelModalSite.id} • ${siteNameOf(panelModalSite)} • Code: ${siteCodeOf(panelModalSite)}`
            : ''
        }
        maxWidth={640}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => {
              setPanelModalSite(null);
              setPanelSearch('');
            }}
          >
            Close
          </button>
        }
      >
        {panelModalSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                {panelSearch.trim()
                  ? `Showing ${modalFilteredSerials.length} of ${modalAllSerials.length}`
                  : `${modalAllSerials.length} Panel(s)`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 220px', maxWidth: 320 }}>
                <input
                  type="text"
                  className="ax-input ax-input--sm"
                  value={panelSearch}
                  onChange={(e) => setPanelSearch(e.target.value)}
                  placeholder="Search panel serial no..."
                  aria-label="Search panel serial number"
                  style={{ width: '100%', height: 32, fontSize: 12 }}
                />
                {panelSearch && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--xs"
                    onClick={() => setPanelSearch('')}
                    style={{ height: 32, padding: '0 8px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {modalFilteredSerials.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', padding: '12px 0' }}>
                No panel serial matches <b>"{panelSearch}"</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {modalFilteredSerials.map(({ serial, index }) => (
                  <span
                    key={`${index}-${serial}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      background: 'var(--ax-surface-subtle, #f8fafc)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--ax-border, #cbd5e1)',
                      color: 'var(--ax-text-strong, #0f172a)',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ax-accent, #2563eb)' }}>#{index}</span>
                    <span>{serial}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Media Lightbox Preview ── */}
      <MediaLightbox
        url={lightbox?.url || null}
        title={lightbox?.title}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

export default StatusView;

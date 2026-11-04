import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpRescoMonthlyBillItem,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

/* ───────── KPI Card (same style as Goa SRT) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Main Page Component ───────── */
export function UP_Installation_Resco_MonthlyBill() {
  const [bills, setBills] = useState<UpRescoMonthlyBillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modals
  const [generateModalSite, setGenerateModalSite] = useState<UpRescoMonthlyBillItem | null>(null);
  const [viewDetailSite, setViewDetailSite] = useState<UpRescoMonthlyBillItem | null>(null);
  const [billMonth, setBillMonth] = useState('2026-10');
  const [meterReading, setMeterReading] = useState('');
  const [generating, setGenerating] = useState(false);

  // Endpoint 14 & 16 integration
  const [billFormData, setBillFormData] = useState<any>(null);
  const [loadingBillForm, setLoadingBillForm] = useState(false);
  const [billingFrom, setBillingFrom] = useState('');
  const [billingTo, setBillingTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [inverterRows, setInverterRows] = useState<{
    inverter_no: string;
    previous_reading: number;
    current_reading: number;
    generated_reading: number;
    amount: number;
    file: File | null;
  }[]>([]);

  // Endpoint 15 past bills
  const [sitePastBills, setSitePastBills] = useState<any[]>([]);
  const [loadingPastBills, setLoadingPastBills] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoMonthlyBill();
      setBills(res || []);
    } catch (err: any) {
      console.warn('[UP Resco MonthlyBill] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load Resco installations for monthly billing.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Open Generate Bill Modal (calls Endpoint 14)
  const handleOpenGenerateBill = async (site: UpRescoMonthlyBillItem) => {
    setGenerateModalSite(site);
    setLoadingBillForm(true);
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = today.slice(0, 8) + '01';
    setBillingFrom(firstDay);
    setBillingTo(today);
    setDueDate(today);

    try {
      const data = await upInstallationService.getRescoBillFormData(site.id);
      setBillFormData(data);
      const rawInverters = data?.resco?.inverter_no
        ? data.resco.inverter_no.split(',')
        : [site.inverter_no || 'INV-1'];
      const rate = data?.readingAmount || 4.90;
      const prevMap = data?.previousReadings || {};

      const rows = rawInverters.map((inv: string) => {
        const invClean = inv.trim();
        const prev = prevMap[invClean] ?? 0;
        return {
          inverter_no: invClean,
          previous_reading: prev,
          current_reading: prev,
          generated_reading: 0,
          amount: 0,
          file: null,
        };
      });
      setInverterRows(rows);
    } catch (e) {
      console.warn('Error loading bill form data:', e);
    } finally {
      setLoadingBillForm(false);
    }
  };

  // Open View Details Modal (calls Endpoint 15)
  const handleOpenViewDetails = async (site: UpRescoMonthlyBillItem) => {
    setViewDetailSite(site);
    setLoadingPastBills(true);
    try {
      const res = await upInstallationService.getRescoSiteBills(site.id);
      setSitePastBills(res.bills || []);
    } catch (e) {
      console.warn('Error loading past bills:', e);
      setSitePastBills([]);
    } finally {
      setLoadingPastBills(false);
    }
  };

  const handleInverterCurrentChange = (idx: number, currentVal: number) => {
    const rate = billFormData?.readingAmount || 4.90;
    setInverterRows((prev) => {
      const copy = [...prev];
      const r = copy[idx];
      const generated = Math.max(0, currentVal - r.previous_reading);
      const amount = Math.round(generated * rate * 100) / 100;
      copy[idx] = {
        ...r,
        current_reading: currentVal,
        generated_reading: generated,
        amount,
      };
      return copy;
    });
  };

  // Handle Generate Bill Submit (calls Endpoint 16)
  const handleGenerateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateModalSite) return;
    setGenerating(true);

    const fd = new FormData();
    fd.append('resco_id', String(generateModalSite.id));
    fd.append('billing_from', billingFrom);
    fd.append('billing_to', billingTo);
    fd.append('due_date', dueDate);

    const rate = billFormData?.readingAmount || 4.90;
    fd.append('per_unit_price', String(rate));

    let totalAmount = 0;
    let totalGenerated = 0;

    inverterRows.forEach((r, idx) => {
      fd.append('inverter_no[]', r.inverter_no);
      fd.append('previous_reading[]', String(r.previous_reading));
      fd.append('current_reading[]', String(r.current_reading));
      fd.append('generated_reading[]', String(r.generated_reading));
      fd.append('amount[]', String(r.amount));
      if (r.file) {
        fd.append(`myfile[${idx}]`, r.file);
      }
      totalAmount += r.amount;
      totalGenerated += r.generated_reading;
    });

    fd.append('reading', String(totalGenerated));
    fd.append('total_price', String(totalAmount));

    try {
      const res = await upInstallationService.storeRescoBill(fd);
      if (res.status) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Bill created successfully!' });
        setGenerateModalSite(null);
      } else {
        setFeedbackMsg({ type: 'danger', text: res.message || 'Failed to create bill.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Server error creating bill.' });
    } finally {
      setGenerating(false);
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    const total = bills.length;
    const active = bills.filter((b) => b.solar_meter_no || b.net_smart_meter_no).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [bills]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.district && b.district.trim()) set.add(b.district.trim());
    });
    return Array.from(set).sort();
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Status filter
      const hasMeter = !!(b.solar_meter_no || b.net_smart_meter_no);
      if (statusFilter === 'active' && !hasMeter) return false;
      if (statusFilter === 'inactive' && hasMeter) return false;

      // District filter
      if (districtFilter !== 'all' && (b.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          b.state, b.district, b.site_name, b.contact_person, b.contact_number,
          b.solar_meter_no, b.inverter_no, b.net_smart_meter_no, b.loger_no,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [bills, statusFilter, districtFilter, search]);

  // Paginated slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const setStatus = (s: 'all' | 'active' | 'inactive') => {
    setStatusFilter(s);
    setCurrentPage(1);
  };

  // Export columns
  const exportCols: ExportColumn<UpRescoMonthlyBillItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: UpRescoMonthlyBillItem, i: number) => String(i + 1) },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
    ],
    []
  );

  const TOTAL_COLUMNS = 11;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View UP Resco Installation"
        subtitle="Welcome to, View UP Resco Installation Monthly Billing"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Installation' },
          { label: 'Monthly Bill' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards (click to filter) ── */}
      {!loading && (
        <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <KpiCard
            tone="accent"
            label="Total Sites"
            value={summary.total.toLocaleString('en-IN')}
            sub="All Resco installation sites"
            active={statusFilter === 'all'}
            onClick={() => setStatus('all')}
            icon={svg(
              <>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="M9 14l2 2 4-4" />
              </>
            )}
          />
          <KpiCard
            tone="emerald"
            label="Active Sites"
            value={summary.active.toLocaleString('en-IN')}
            sub="Sites with meter installed"
            active={statusFilter === 'active'}
            onClick={() => setStatus('active')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </>
            )}
          />
          <KpiCard
            tone="amber"
            label="Pending"
            value={summary.inactive.toLocaleString('en-IN')}
            sub="Sites without meter data"
            active={statusFilter === 'inactive'}
            onClick={() => setStatus('inactive')}
            icon={svg(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </>
            )}
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Resco Monthly Bill Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">RESCO INSTALLATION</span>
              <h2 className="ax-card__title">Monthly Billing Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredBills.length} of {bills.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Pending</option>
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search site, district, contact…"
                  size="sm"
                  ariaLabel="Search billing sites"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredBills, exportCols)}
                  onExportCSV={() => exportDataToCSV('UP_Resco_Monthly_Billing', filteredBills, exportCols)}
                  onExportExcel={() => exportDataToExcel('UP_Resco_Monthly_Billing', filteredBills, exportCols)}
                  onExportPDF={() => printTableData('UP Resco Installation - Monthly Billing', filteredBills, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1400 }}
            >
              <caption className="ax-visually-hidden">UP Resco Installation Monthly Billing Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 180 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col" style={{ width: 200, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading monthly bill sites…
                    </td>
                  </tr>
                )}
                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No installed sites found for billing.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((item, index) => {
                    const sr = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={item.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{sr}</td>
                        <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>{item.state || 'UP'}</td>
                        <td className="ax-table__td">{item.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{item.site_name || DASH}</td>
                        <td className="ax-table__td">{item.contact_person || DASH}</td>
                        <td className="ax-table__td">{item.contact_number || DASH}</td>
                        <td className="ax-table__td">{item.solar_meter_no || DASH}</td>
                        <td className="ax-table__td">{item.inverter_no || DASH}</td>
                        <td className="ax-table__td">{item.net_smart_meter_no || DASH}</td>
                        <td className="ax-table__td">{item.loger_no || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ padding: '3px 10px', fontSize: 11 }}
                              onClick={() => handleOpenGenerateBill(item)}
                            >
                              Generate Bill
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '3px 10px', fontSize: 11 }}
                              onClick={() => handleOpenViewDetails(item)}
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Punjab-style: pagination only) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredBills.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Generate Bill Modal (Endpoints 14 & 16) ── */}
      {generateModalSite && (
        <Modal
          open={!!generateModalSite}
          onClose={() => setGenerateModalSite(null)}
          labelledBy="generate-bill-title"
          dialogStyle={{ maxWidth: 720 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                Generate Monthly Bill (Rate: ₹{billFormData?.readingAmount || 4.90}/kWh)
              </span>
              <h3 id="generate-bill-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {generateModalSite.site_name}
              </h3>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setGenerateModalSite(null)}
              aria-label="Close dialog"
            >
              {X_ICON}
            </button>
          </div>

          <form onSubmit={handleGenerateBillSubmit}>
            <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingBillForm ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <span className="ax-spinner" /> Loading site inverter & reading rates…
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Billing From *
                      </label>
                      <input
                        type="date"
                        required
                        className="ax-input"
                        value={billingFrom}
                        onChange={(e) => setBillingFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Billing To *
                      </label>
                      <input
                        type="date"
                        required
                        className="ax-input"
                        value={billingTo}
                        onChange={(e) => setBillingTo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        className="ax-input"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Inverter Readings Table */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '8px 0 6px' }}>
                      Inverter Readings (Per Unit Price: ₹{billFormData?.readingAmount || 4.90})
                    </label>
                    <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 6 }}>
                      <table className="ax-table ax-table--sm" style={{ width: '100%', fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>Inverter No</th>
                            <th>Prev Reading</th>
                            <th>Curr Reading *</th>
                            <th>Units Gen</th>
                            <th>Amount (₹)</th>
                            <th>Reading Photo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inverterRows.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{row.inverter_no}</td>
                              <td>{row.previous_reading}</td>
                              <td>
                                <input
                                  type="number"
                                  step="any"
                                  required
                                  style={{ width: 100, height: 28, fontSize: 12, padding: '2px 6px' }}
                                  className="ax-input"
                                  value={row.current_reading}
                                  onChange={(e) => handleInverterCurrentChange(idx, Number(e.target.value) || 0)}
                                />
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>{row.generated_reading}</td>
                              <td style={{ fontWeight: 700 }}>₹{row.amount}</td>
                              <td>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  style={{ fontSize: 10, width: 140 }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setInverterRows((p) => {
                                      const c = [...p];
                                      c[idx].file = file;
                                      return c;
                                    });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ax-surface-subtle)', padding: '10px 14px', borderRadius: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Total Units: {inverterRows.reduce((acc, r) => acc + r.generated_reading, 0)} kWh</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ax-accent)' }}>
                      Total Bill Amount: ₹{inverterRows.reduce((acc, r) => acc + r.amount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--ax-border)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setGenerateModalSite(null)}
                disabled={generating}
              >
                Cancel
              </button>
              <button type="submit" className="ax-btn ax-btn--primary" disabled={generating || loadingBillForm}>
                {generating ? 'Generating…' : 'Submit & Create Bill'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── View Bill Details Modal (Endpoint 15) ── */}
      {viewDetailSite && (
        <Modal
          open={!!viewDetailSite}
          onClose={() => setViewDetailSite(null)}
          labelledBy="view-detail-title"
          dialogStyle={{ maxWidth: 700 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                Resco Monthly Bills & Readings
              </span>
              <h3 id="view-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {viewDetailSite.site_name}
              </h3>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setViewDetailSite(null)}
              aria-label="Close modal"
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 20 }}>
            {loadingPastBills ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <span className="ax-spinner" /> Loading past bills…
              </div>
            ) : sitePastBills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Generated Bills ({sitePastBills.length})</h4>
                {sitePastBills.map((b, i) => (
                  <div key={b.id || i} style={{ border: '1px solid var(--ax-border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <strong>Bill #{b.bill_no}</strong>
                        <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, marginLeft: 8 }}>
                          {b.bill_date || b.billing_from} to {b.due_date || b.billing_to}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--ax-accent)', fontSize: 14 }}>
                        ₹{Number(b.bill_amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {b.readings && b.readings.length > 0 && (
                      <table className="ax-table ax-table--sm" style={{ width: '100%', fontSize: 11 }}>
                        <thead>
                          <tr>
                            <th>Inverter No</th>
                            <th>Previous Reading</th>
                            <th>Current Reading</th>
                            <th>Generated Reading</th>
                            <th>Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.readings.map((r: any, ri: number) => (
                            <tr key={ri}>
                              <td style={{ fontWeight: 600 }}>{r.inverter_no}</td>
                              <td>{r.previous_reading}</td>
                              <td>{r.current_reading}</td>
                              <td>{r.generated_reading || Number(r.current_reading) - Number(r.previous_reading)}</td>
                              <td style={{ fontWeight: 700 }}>₹{r.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--ax-text-muted)', fontSize: 13 }}>No past bills found for this site.</p>
            )}
          </div>

          <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => setViewDetailSite(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UP_Installation_Resco_MonthlyBill;
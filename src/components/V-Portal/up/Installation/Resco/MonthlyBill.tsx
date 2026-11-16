import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoVerifiedSite,
  type UpRescoBillItem,
  type UpRescoBillInverterReading,
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
const txt = (v: unknown) => (v === null || v === undefined || String(v).trim() === '' ? DASH : String(v));

/* ───────── Top KPI Card (Accent, Emerald, Amber) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb, 37, 99, 235), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
};

const svg = (children: ReactNode) => (
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
        boxShadow: active ? `0 0 0 2px ${t.fg}` : undefined,
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
  }

  .solar-erp-page .site-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 1024px) {
    .solar-erp-page .site-meta-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
    .solar-erp-page .site-meta-grid {
      grid-template-columns: 1fr;
    }
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
`;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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

/* ───────── Accessible Modal ───────── */
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

/* ───────── Flattened Reading Item for View Bills ───────── */
interface FlattenedReadingRow {
  srNo: number;
  billId: number;
  billingFrom: string;
  billingTo: string;
  dueDate: string;
  billNo: string;
  totalReading: string | number;
  billAmount: string | number;
  inverterNo: string;
  previousReading: string | number;
  currentReading: string | number;
  generatedReading: string | number;
  amount: string | number;
  documentFile?: string | null;
  verifyStatus: number | string;
  remarks: string;
  billRaw: UpRescoBillItem;
}

export function UP_Installation_Resco_MonthlyBill() {
  // Navigation / Views: 'list' | 'create-bill' | 'view-bills'
  const [activeView, setActiveView] = useState<'list' | 'create-bill' | 'view-bills'>('list');
  const [selectedSite, setSelectedSite] = useState<UpRescoVerifiedSite | null>(null);

  // Endpoint 13 (Verified Sites list)
  const [sites, setSites] = useState<UpRescoVerifiedSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Global Toast / Alert message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Endpoint 14 & 16: Create Bill Form State
  const [loadingBillForm, setLoadingBillForm] = useState(false);
  const [billingFrom, setBillingFrom] = useState('');
  const [billingTo, setBillingTo] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [perUnitPrice, setPerUnitPrice] = useState<number>(4.9);
  const [inverterRows, setInverterRows] = useState<{
    inverter_no: string;
    previous_reading: number;
    current_reading: number;
    generated_reading: number;
    amount: number;
    file: File | null;
  }[]>([]);
  const [submittingBill, setSubmittingBill] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Endpoint 15: View Bills State
  const [sitePastBills, setSitePastBills] = useState<UpRescoBillItem[]>([]);
  const [loadingPastBills, setLoadingPastBills] = useState(false);
  const [billsSearch, setBillsSearch] = useState('');

  // Voucher modal state for printing/viewing a bill
  const [voucherModalBill, setVoucherModalBill] = useState<UpRescoBillItem | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4500);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  /* ─────────────────────────────────────────────────────────────
   * 1. LOAD VERIFIED SITES (Endpoint 13: up/resco/view-install)
   * ───────────────────────────────────────────────────────────── */
  const loadVerifiedSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const res = await upInstallationService.getRescoVerifiedSites();
      const list = Array.isArray(res) ? res : [];
      setSites(list);
    } catch (err: any) {
      console.warn('[UP Resco MonthlyBill] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load verified Resco installations.' });
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadVerifiedSites();
  }, [loadVerifiedSites]);

  /* ─────────────────────────────────────────────────────────────
   * 2. OPEN CREATE BILL VIEW (Endpoint 14: up/resco/create-bill)
   * ───────────────────────────────────────────────────────────── */
  const handleOpenGenerateBill = async (site: UpRescoVerifiedSite) => {
    setSelectedSite(site);
    setActiveView('create-bill');
    setLoadingBillForm(true);
    setFormError(null);

    // Initial default dates
    const today = new Date().toISOString().slice(0, 10);
    const firstDayOfMonth = today.slice(0, 8) + '01';
    setBillingFrom(firstDayOfMonth);
    setBillingTo(today);

    // Due date default to 15 days from today
    const due = new Date();
    due.setDate(due.getDate() + 15);
    setDueDate(due.toISOString().slice(0, 10));

    // Also fetch full site details in background so address, dept_name, plant_sc are fully populated
    upInstallationService.getRescoSiteDetail(site.id).then((full) => {
      if (full) {
        setSelectedSite((prev) => (prev ? { ...prev, ...full } : full));
      }
    });

    try {
      const data = await upInstallationService.getRescoBillFormData(site.id);
      const rate = Number(data?.readingAmount || (Number(site.sanction_load) >= 200 ? 4.85 : 4.90));
      setPerUnitPrice(rate);

      const rawInverters = data?.resco?.inverter_no
        ? String(data.resco.inverter_no).split(',').map((s) => s.trim()).filter(Boolean)
        : (site.inverter_no ? String(site.inverter_no).split(',').map((s) => s.trim()).filter(Boolean) : ['INV-1']);

      const prevMap = data?.previousReadings || {};

      const rows = rawInverters.map((inv) => {
        const prev = Number(prevMap[inv] ?? 0);
        return {
          inverter_no: inv,
          previous_reading: prev,
          current_reading: prev,
          generated_reading: 0,
          amount: 0,
          file: null,
        };
      });

      setInverterRows(rows);
    } catch (err: any) {
      console.warn('Error fetching bill form data:', err);
      setFormError('Failed to load inverter details for billing.');
    } finally {
      setLoadingBillForm(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
   * 3. OPEN VIEW BILLS VIEW (Endpoint 15: up/resco/view-create-bill)
   * ───────────────────────────────────────────────────────────── */
  const handleOpenViewDetails = async (site: UpRescoVerifiedSite) => {
    setSelectedSite(site);
    setActiveView('view-bills');
    setLoadingPastBills(true);
    setBillsSearch('');

    // Fetch full site details to ensure all 12 metadata fields are complete
    upInstallationService.getRescoSiteDetail(site.id).then((full) => {
      if (full) {
        setSelectedSite((prev) => (prev ? { ...prev, ...full } : full));
      }
    });

    try {
      const res = await upInstallationService.getRescoSiteBills(site.id);
      setSitePastBills(res.bills || []);
    } catch (err: any) {
      console.warn('Error fetching site bills:', err);
      setSitePastBills([]);
    } finally {
      setLoadingPastBills(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
   * Inverter reading change calculation
   * ───────────────────────────────────────────────────────────── */
  const handleInverterCurrentChange = (idx: number, currentVal: number) => {
    setInverterRows((prev) => {
      const copy = [...prev];
      const r = copy[idx];
      const prevVal = Number(r.previous_reading) || 0;
      const gen = Math.max(0, currentVal - prevVal);
      const amt = Math.round(gen * perUnitPrice * 100) / 100;
      copy[idx] = {
        ...r,
        current_reading: currentVal,
        generated_reading: gen,
        amount: amt,
      };
      return copy;
    });
  };

  const totalGeneratedReading = useMemo(() => {
    return inverterRows.reduce((sum, r) => sum + Number(r.generated_reading || 0), 0);
  }, [inverterRows]);

  const totalBillAmount = useMemo(() => {
    return inverterRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [inverterRows]);

  /* ─────────────────────────────────────────────────────────────
   * 4. SUBMIT CREATE BILL (Endpoint 16: up/resco/bill-store)
   * ───────────────────────────────────────────────────────────── */
  const handleGenerateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    if (!billingFrom || !billingTo || !dueDate) {
      setFormError('Billing Period From, Billing Period To, and Due Date are mandatory.');
      return;
    }
    if (new Date(billingTo) < new Date(billingFrom)) {
      setFormError('Billing Period To date must be on or after Billing Period From date.');
      return;
    }
    if (new Date(dueDate) < new Date(billingTo)) {
      setFormError('Due Date must be on or after Billing Period To date.');
      return;
    }

    setSubmittingBill(true);
    setFormError(null);

    const fd = new FormData();
    fd.append('resco_id', String(selectedSite.id));
    fd.append('billing_from', billingFrom);
    fd.append('billing_to', billingTo);
    fd.append('due_date', dueDate);
    fd.append('per_unit_price', String(perUnitPrice));
    fd.append('reading', String(totalGeneratedReading));
    fd.append('total_price', String(totalBillAmount));

    inverterRows.forEach((r, idx) => {
      fd.append(`inverter_no[${idx}]`, r.inverter_no);
      fd.append(`previous_reading[${idx}]`, String(r.previous_reading));
      fd.append(`current_reading[${idx}]`, String(r.current_reading));
      fd.append(`generated_reading[${idx}]`, String(r.generated_reading));
      fd.append(`amount[${idx}]`, String(r.amount));
      if (r.file) {
        fd.append(`myfile[${idx}]`, r.file);
      }
    });

    try {
      const res = await upInstallationService.storeRescoBill(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Bill and inverter readings saved successfully!' });
        // Transition directly to View Bills screen
        handleOpenViewDetails(selectedSite);
      } else {
        const errorDetails = res.errors ? Object.values(res.errors).flat().join(' ') : '';
        const errMsg = errorDetails || res.message || 'Validation failed creating bill.';
        setFormError(errMsg);
        setToastMsg({ type: 'danger', text: errMsg });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Server error creating bill.';
      setFormError(errMsg);
      setToastMsg({ type: 'danger', text: errMsg });
    } finally {
      setSubmittingBill(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
   * Main Sites Filter & Search
   * ───────────────────────────────────────────────────────────── */
  const districts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => s.district && set.add(s.district.trim()));
    return Array.from(set).sort();
  }, [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (districtFilter !== 'all' && (s.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          s.site_name,
          s.district,
          s.dept_name,
          s.contact_person,
          s.contact_number,
          s.inverter_no,
          s.solar_meter_no,
          s.solarmeter_no,
          s.net_smart_meter_no,
          s.nm_sm_no,
          s.loger_no,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sites, districtFilter, search]);

  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const exportCols: ExportColumn<UpRescoVerifiedSite>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => String(i + 1) },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Sanction Load', accessor: (r) => r.sanction_load ? `${r.sanction_load} kW` : DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || r.nm_sm_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
    ],
    []
  );

  /* ─────────────────────────────────────────────────────────────
   * Flattened Bills for View Details Table
   * ───────────────────────────────────────────────────────────── */
  const flattenedBillRows: FlattenedReadingRow[] = useMemo(() => {
    const rows: FlattenedReadingRow[] = [];
    let counter = 1;

    sitePastBills.forEach((b) => {
      const readings = Array.isArray(b.readings) && b.readings.length > 0 ? b.readings : [null];
      readings.forEach((rd) => {
        rows.push({
          srNo: counter++,
          billId: b.id,
          billingFrom: b.billing_from || b.bill_date || DASH,
          billingTo: b.billing_to || DASH,
          dueDate: b.due_date || DASH,
          billNo: b.bill_no || DASH,
          totalReading: b.total_reading || b.reading || DASH,
          billAmount: b.bill_amount,
          inverterNo: rd ? rd.inverter_no : (b as any).inverter_no || DASH,
          previousReading: rd ? rd.previous_reading : DASH,
          currentReading: rd ? rd.current_reading : DASH,
          generatedReading: rd ? (rd.generated_reading ?? (Number(rd.current_reading || 0) - Number(rd.previous_reading || 0))) : DASH,
          amount: rd ? rd.amount : b.bill_amount,
          documentFile: rd?.file || b.file,
          verifyStatus: b.verify_status ?? b.bill_status ?? 1,
          remarks: b.remarks || rd?.remarks || '—',
          billRaw: b,
        });
      });
    });

    if (billsSearch.trim()) {
      const q = billsSearch.toLowerCase();
      return rows.filter((r) =>
        [r.billNo, r.inverterNo, r.billingFrom, r.billingTo, String(r.billAmount), r.remarks]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    return rows;
  }, [sitePastBills, billsSearch]);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ─────────────────────────────────────────────────────────────
       * 1. MAIN VIEW: VIEW UP RESCO INSTALLATION MONTHLY BILLING
       * ───────────────────────────────────────────────────────────── */}
      {activeView === 'list' && (
        <>
          <PageHead
            title="View UP Resco Installation"
            subtitle="Welcome to, View UP Resco Installation Monthly Billing"
            breadcrumbs={[
              { label: 'Home', href: '/v' },
              { label: 'UP Resco Installation' },
              { label: 'Monthly Billing' },
            ]}
            actions={
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={loadVerifiedSites}
                  disabled={loadingSites}
                >
                  <span className={loadingSites ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
                  <span className="ax-btn__label">Refresh</span>
                </button>
              </div>
            }
          />

          {toastMsg && (
            <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 16 }} role="status">
              <div className="ax-alert__content">{toastMsg.text}</div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={() => setToastMsg(null)}
                aria-label="Dismiss alert"
              >
                {X_ICON}
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          {!loadingSites && (
            <div className="ax-dash-grid" style={{ marginBottom: 20 }}>
              <KpiCard
                tone="accent"
                label="Total Sites"
                value={sites.length}
                sub="All verified installations"
                active={districtFilter === 'all'}
                onClick={() => setDistrictFilter('all')}
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
                label="Districts"
                value={districts.length}
                sub="Active operational districts"
                icon={svg(
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </>
                )}
              />
              <KpiCard
                tone="amber"
                label="Verified Sites"
                value={sites.filter((s) => Number(s.inst_verify_status) === 1 || Number(s.inst_status) === 1).length}
                sub="Eligible for monthly bill generation"
                icon={svg(
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </>
                )}
              />
            </div>
          )}

          {/* Verified Sites Table */}
          <div className="ax-dash-grid">
            <section className="ax-card ax-col--12" role="region" aria-label="Resco Verified Sites Records">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <span className="ax-card__eyebrow">UP RESCO BILLING</span>
                  <h2 className="ax-card__title">Verified Installation Sites</h2>
                  <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                    {filteredSites.length} of {sites.length} sites ready for billing
                  </p>
                </div>
                <div className="ax-card__actions">
                  <div className="ax-cluster" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    {districts.length > 0 && (
                      <select
                        className="ax-input ax-input--sm"
                        style={{ width: 140, height: 32 }}
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

                    <SearchInput
                      value={search}
                      onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                      placeholder="Search site, contact, meter…"
                      size="sm"
                      ariaLabel="Search billing sites"
                    />

                    <TableExportToolbar
                      onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                      onExportCSV={() => exportDataToCSV('UP_Resco_Monthly_Billing', filteredSites, exportCols)}
                      onExportExcel={() => exportDataToExcel('UP_Resco_Monthly_Billing', filteredSites, exportCols)}
                      onExportPDF={() => printTableData('UP Resco Installation - Monthly Billing', filteredSites, exportCols)}
                    />
                  </div>
                </div>
              </div>

              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover" style={{ minWidth: 1350 }}>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                      <th className="ax-table__th">State</th>
                      <th className="ax-table__th">District</th>
                      <th className="ax-table__th" style={{ minWidth: 200 }}>Site Name</th>
                      <th className="ax-table__th">Sanction Load</th>
                      <th className="ax-table__th">Contact Person</th>
                      <th className="ax-table__th">Contact Number</th>
                      <th className="ax-table__th">Solar Meter No.</th>
                      <th className="ax-table__th">Inverter No.</th>
                      <th className="ax-table__th">Net/Smart Meter No.</th>
                      <th className="ax-table__th">Loger No.</th>
                      <th className="ax-table__th" style={{ width: 180, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody aria-busy={loadingSites}>
                    {loadingSites && (
                      <tr>
                        <td className="ax-table__td" colSpan={12} style={{ textAlign: 'center', padding: 36 }}>
                          <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading verified installation sites…
                        </td>
                      </tr>
                    )}
                    {!loadingSites && filteredSites.length === 0 && (
                      <tr>
                        <td className="ax-table__td" colSpan={12} style={{ padding: 0 }}>
                          <TableEmptyState
                            title="No verified sites found"
                            message="No verified Resco rooftop installation sites available for billing."
                            onClear={() => { setSearch(''); setDistrictFilter('all'); }}
                          />
                        </td>
                      </tr>
                    )}
                    {!loadingSites &&
                      paginatedSites.map((item, index) => {
                        const sr = (currentPage - 1) * pageSize + index + 1;
                        return (
                          <tr key={item.id || index} className="ax-table__row">
                            <td className="ax-table__td ax-num">{sr}</td>
                            <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>{item.state || 'UP'}</td>
                            <td className="ax-table__td">{txt(item.district)}</td>
                            <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {item.site_name}
                            </td>
                            <td className="ax-table__td">{item.sanction_load ? `${item.sanction_load} kW` : DASH}</td>
                            <td className="ax-table__td">{txt(item.contact_person)}</td>
                            <td className="ax-table__td">{txt(item.contact_number)}</td>
                            <td className="ax-table__td">{txt(item.solar_meter_no || item.solarmeter_no)}</td>
                            <td className="ax-table__td">{txt(item.inverter_no)}</td>
                            <td className="ax-table__td">{txt(item.net_smart_meter_no || item.nm_sm_no)}</td>
                            <td className="ax-table__td">{txt(item.loger_no)}</td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  style={{ padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}
                                  onClick={() => handleOpenGenerateBill(item)}
                                >
                                  Generate Bill
                                </button>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--secondary ax-btn--sm"
                                  style={{ padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}
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

              <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border)', padding: '12px 16px' }}>
                <div className="ula-pagination-left">
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredSites.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[25, 50, 100, 200]}
                  />
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
       * 2. CREATE BILL VIEW: RESCO CREATE BILL (Endpoint 14 & 16)
       * ───────────────────────────────────────────────────────────── */}
      {activeView === 'create-bill' && selectedSite && (
        <div>
          <PageHead
            title="Resco Create Bill"
            subtitle="Welcome to, Resco Create Bill"
            breadcrumbs={[
              { label: 'Home', href: '/v' },
              { label: 'Resco Create Bill' },
            ]}
            actions={
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setActiveView('list')}
              >
                ← Back to Sites List
              </button>
            }
          />

          {toastMsg && (
            <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 16 }} role="status">
              <div className="ax-alert__content">{toastMsg.text}</div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={() => setToastMsg(null)}
                aria-label="Dismiss alert"
              >
                {X_ICON}
              </button>
            </div>
          )}

          {/* Site Metadata Information Card (12 requested fields) */}
          <div className="ax-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--ax-border)', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                {selectedSite.vendors?.name || selectedSite.firm_name || selectedSite.vendor || selectedSite.site_name}
              </h3>
              <span className="ax-badge ax-badge--soft ax-badge--primary">
                Site ID: #{selectedSite.id}
              </span>
            </div>

            <div className="site-meta-grid" style={{ fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.state || 'up'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.district)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department Name</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.dept_name || selectedSite.site_name)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Address</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.address)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction Load</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.sanction_load ? `${selectedSite.sanction_load} kW` : DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Plant Capacity</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.plant_sc || selectedSite.capacity || selectedSite.sanction_load ? `${selectedSite.plant_sc || selectedSite.capacity || selectedSite.sanction_load} kWp` : DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.contact_person)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Number</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.contact_number)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Inverter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.inverter_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Solar Meter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.solar_meter_no || selectedSite.solarmeter_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Net Meter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.net_smart_meter_no || selectedSite.nm_sm_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Logger No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.loger_no)}</span>
              </div>
            </div>
          </div>

          {/* Bill Generation Form Card */}
          <div className="ax-card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--ax-border)', paddingBottom: 10 }}>
              Monthly Electricity Generation Bill Form
            </h3>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            {loadingBillForm ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading billing rates & inverter reading history…
              </div>
            ) : (
              <form onSubmit={handleGenerateBillSubmit}>
                {/* 3 Date inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Billing Period From</span><span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="ax-input"
                      value={billingFrom}
                      onChange={(e) => setBillingFrom(e.target.value)}
                    />
                  </div>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Billing Period To</span><span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="ax-input"
                      value={billingTo}
                      onChange={(e) => setBillingTo(e.target.value)}
                    />
                  </div>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Due Date</span><span className="ax-modern-req">*</span>
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

                {/* KPI metric summary boxes for reading & price */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--ax-border)', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Total Reading *</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                      {totalGeneratedReading.toLocaleString('en-IN')} kWh
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--ax-border)', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Generated Reading</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                      {totalGeneratedReading.toLocaleString('en-IN')} Units
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--ax-border)', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>
                      Total Price (Rate: ₹{perUnitPrice}/kWh)
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 2 }}>
                      ₹{totalBillAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Inverter Readings Table */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>
                    Inverter Readings Breakdown
                  </h4>
                  <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 8 }}>
                    <table className="ax-table" style={{ width: '100%', fontSize: 13 }}>
                      <thead className="ax-table__head">
                        <tr>
                          <th className="ax-table__th">Inverter No.</th>
                          <th className="ax-table__th">Previous Reading</th>
                          <th className="ax-table__th" style={{ width: 140 }}>Current Reading *</th>
                          <th className="ax-table__th">Generate Reading</th>
                          <th className="ax-table__th">Amount (₹)</th>
                          <th className="ax-table__th" style={{ width: 220 }}>File (Reading Photo / PDF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inverterRows.map((r, idx) => (
                          <tr key={idx} className="ax-table__row">
                            <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.inverter_no}</td>
                            <td className="ax-table__td ax-num">{r.previous_reading}</td>
                            <td className="ax-table__td">
                              <input
                                type="number"
                                step="any"
                                required
                                min={r.previous_reading}
                                className="ax-input ax-input--sm"
                                style={{ width: 130 }}
                                value={r.current_reading}
                                onChange={(e) => handleInverterCurrentChange(idx, Number(e.target.value) || 0)}
                              />
                            </td>
                            <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#2563eb' }}>
                              {r.generated_reading}
                            </td>
                            <td className="ax-table__td ax-num" style={{ fontWeight: 700 }}>
                              ₹{r.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="ax-table__td">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                className="ax-input ax-input--sm"
                                style={{ fontSize: 11 }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setInverterRows((prev) => {
                                    const copy = [...prev];
                                    copy[idx].file = file;
                                    return copy;
                                  });
                                }}
                              />
                              {r.file && (
                                <span style={{ fontSize: 11, color: '#16a34a', display: 'block', marginTop: 2 }}>
                                  Selected: {r.file.name}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--ax-border)', paddingTop: 16 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setActiveView('list')}
                    disabled={submittingBill}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={submittingBill || loadingBillForm}
                  >
                    {submittingBill ? 'Generating Bill…' : 'Submit & Create Bill'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
       * 3. VIEW BILL DETAILS: VIEW RESCO DETAILS (Endpoint 15)
       * ───────────────────────────────────────────────────────────── */}
      {activeView === 'view-bills' && selectedSite && (
        <div>
          <PageHead
            title="View Resco Details"
            subtitle="welcome to, View Resco Details"
            breadcrumbs={[
              { label: 'Home', href: '/v' },
              { label: 'View Resco Generate Bill' },
            ]}
            actions={
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setActiveView('list')}
              >
                ← Back to Sites List
              </button>
            }
          />

          {toastMsg && (
            <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 16 }} role="status">
              <div className="ax-alert__content">{toastMsg.text}</div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={() => setToastMsg(null)}
                aria-label="Dismiss alert"
              >
                {X_ICON}
              </button>
            </div>
          )}

          {/* Site Metadata Information Card */}
          <div className="ax-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--ax-border)', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                {selectedSite.vendors?.name || selectedSite.firm_name || selectedSite.vendor || selectedSite.site_name}
              </h3>
              <span className="ax-badge ax-badge--soft ax-badge--primary">
                Site ID: #{selectedSite.id}
              </span>
            </div>

            <div className="site-meta-grid" style={{ fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.state || 'up'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>District</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.district)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Department Name</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.dept_name || selectedSite.site_name)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Address</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.address)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Sanction Load</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.sanction_load ? `${selectedSite.sanction_load} kW` : DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Plant Capacity</span>
                <span style={{ fontWeight: 600 }}>{selectedSite.plant_sc || selectedSite.capacity || selectedSite.sanction_load ? `${selectedSite.plant_sc || selectedSite.capacity || selectedSite.sanction_load} kWp` : DASH}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.contact_person)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Number</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.contact_number)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Inverter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.inverter_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Solar Meter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.solar_meter_no || selectedSite.solarmeter_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Net Meter No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.net_smart_meter_no || selectedSite.nm_sm_no)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Logger No.</span>
                <span style={{ fontWeight: 600 }}>{txt(selectedSite.loger_no)}</span>
              </div>
            </div>
          </div>

          {/* Action Tabs Bar: View Months Wise Bill Details & Generate Bill */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ fontWeight: 700 }}
              onClick={() => handleOpenViewDetails(selectedSite)}
            >
              View Months Wise Bill Details
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ fontWeight: 700 }}
              onClick={() => handleOpenGenerateBill(selectedSite)}
            >
              Generate Bill
            </button>
          </div>

          {/* Bills List Table */}
          <div className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">MONTHLY BILLING</span>
                <h3 className="ax-card__title">Generated Energy Bills</h3>
                <p className="ax-card__subtitle">
                  {flattenedBillRows.length} billing records found for this site
                </p>
              </div>
              <div className="ax-card__actions">
                <SearchInput
                  value={billsSearch}
                  onChange={setBillsSearch}
                  placeholder="Search bill no, inverter, date…"
                  size="sm"
                  ariaLabel="Search bills"
                />
              </div>
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" style={{ minWidth: 1450, fontSize: 13 }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ width: 55 }}>Sr No</th>
                    <th className="ax-table__th">Billing From</th>
                    <th className="ax-table__th">Billing To</th>
                    <th className="ax-table__th">Due Date</th>
                    <th className="ax-table__th">Bill No</th>
                    <th className="ax-table__th">Total Reading</th>
                    <th className="ax-table__th">Bill Amount</th>
                    <th className="ax-table__th">Inverter No</th>
                    <th className="ax-table__th">Previous Reading</th>
                    <th className="ax-table__th">Current Reading</th>
                    <th className="ax-table__th">Generated Reading</th>
                    <th className="ax-table__th">Amount</th>
                    <th className="ax-table__th">Document File</th>
                    <th className="ax-table__th">Verify Status</th>
                    <th className="ax-table__th">Remarks</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody aria-busy={loadingPastBills}>
                  {loadingPastBills && (
                    <tr>
                      <td className="ax-table__td" colSpan={16} style={{ textAlign: 'center', padding: 36 }}>
                        <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading bills & inverter readings…
                      </td>
                    </tr>
                  )}
                  {!loadingPastBills && flattenedBillRows.length === 0 && (
                    <tr>
                      <td className="ax-table__td" colSpan={16} style={{ padding: 0 }}>
                        <TableEmptyState
                          title="No bills generated yet"
                          message="No monthly energy bills have been created for this site yet."
                        />
                      </td>
                    </tr>
                  )}
                  {!loadingPastBills &&
                    flattenedBillRows.map((row, idx) => (
                      <tr key={idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{row.srNo}</td>
                        <td className="ax-table__td">{row.billingFrom}</td>
                        <td className="ax-table__td">{row.billingTo}</td>
                        <td className="ax-table__td">{row.dueDate}</td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: '#2563eb' }}>
                          {row.billNo}
                        </td>
                        <td className="ax-table__td ax-num">{row.totalReading}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 700 }}>
                          ₹{Number(row.billAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.inverterNo}</td>
                        <td className="ax-table__td ax-num">{row.previousReading}</td>
                        <td className="ax-table__td ax-num">{row.currentReading}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600, color: '#10b981' }}>
                          {row.generatedReading}
                        </td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 700 }}>
                          ₹{Number(row.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="ax-table__td">
                          {row.documentFile ? (
                            <a
                              href={resolveUpMediaUrl(row.documentFile)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', fontWeight: 600 }}
                            >
                              View File
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="ax-table__td">
                          {Number(row.verifyStatus) === 2 || Number(row.verifyStatus) === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Generated</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.remarks}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ fontWeight: 600 }}
                            onClick={() => setVoucherModalBill(row.billRaw)}
                          >
                            Print Voucher
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
       * 4. PRINTABLE BILL VOUCHER MODAL
       * ───────────────────────────────────────────────────────────── */}
      {voucherModalBill && selectedSite && (
        <Modal
          open={!!voucherModalBill}
          onClose={() => setVoucherModalBill(null)}
          labelledBy="voucher-modal-title"
          dialogStyle={{ maxWidth: 680, width: '95%' }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                UP RESCO ROOFTOP SOLAR ENERGY BILL
              </span>
              <h3 id="voucher-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Bill Voucher #{voucherModalBill.bill_no}
              </h3>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setVoucherModalBill(null)}
              aria-label="Close dialog"
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 20 }}>
            {/* Header info */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--ax-border)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{selectedSite.site_name}</h4>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                    District: <b>{selectedSite.district || 'UP'}</b> | Dept: <b>{selectedSite.dept_name || selectedSite.site_name}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  <div>Due Date: <b>{voucherModalBill.due_date || DASH}</b></div>
                  <div>Bill Date: <b>{voucherModalBill.bill_date || voucherModalBill.billing_from || DASH}</b></div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Billing Period: <b>{voucherModalBill.billing_from || DASH}</b> to <b>{voucherModalBill.billing_to || DASH}</b>
              </div>
            </div>

            {/* Inverter breakdown */}
            {voucherModalBill.readings && voucherModalBill.readings.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>Inverter Generation Details</h5>
                <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 6 }}>
                  <table className="ax-table ax-table--sm" style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Inverter No</th>
                        <th>Prev Reading</th>
                        <th>Curr Reading</th>
                        <th>Units (kWh)</th>
                        <th>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherModalBill.readings.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.inverter_no}</td>
                          <td>{r.previous_reading}</td>
                          <td>{r.current_reading}</td>
                          <td style={{ fontWeight: 600, color: '#2563eb' }}>{r.generated_reading}</td>
                          <td style={{ fontWeight: 700 }}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Gross Payable */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Gross Bill Amount Payable:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                ₹{Number(voucherModalBill.bill_amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--ax-border)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => window.print()}
            >
              Print Invoice
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => setVoucherModalBill(null)}
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

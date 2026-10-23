import { useCallback, useEffect, useMemo, useState, useDeferredValue, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type SslInstallationInspectionItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Colors & Helpers ── */
const DASH = '—';
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

// Helper to format panchayat string or JSON array
const formatPanchayat = (val: unknown): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) return val.join(', ');
  const str = String(val).trim();
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {
      // Return raw string if JSON parsing fails
    }
  }
  return str;
};

type KpiTone = 'blue' | 'cyan' | 'emerald' | 'amber';

const KPI_TONE: Record<KpiTone, { bg: string; fg: string }> = {
  blue: { bg: 'color-mix(in srgb, var(--ax-accent, #2563eb) 12%, transparent)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in srgb, #06b6d4 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in srgb, #10b981 14%, transparent)', fg: '#059669' },
  amber: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', fg: '#d97706' },
};

/* ── ULA Page & Table Styling ── */
const PAGE_CSS = `
  .solar-erp-page { --bsv-card-radius: var(--ax-radius-lg); --ula-accent: var(--ax-accent, #2563eb); }
  .solar-erp-page .ax-dash-grid { align-items: stretch; gap: var(--ax-space-4); margin-bottom: var(--ax-space-5); }
  .solar-erp-page .bsv-kpi {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--ax-border);
    border-radius: var(--bsv-card-radius);
    background: var(--ax-bg-surface, var(--ax-surface-solid));
    box-shadow: var(--ax-shadow-sm);
    transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
  }
  .solar-erp-page .bsv-kpi:hover {
    box-shadow: var(--ax-shadow-md);
    border-color: var(--ax-border);
    transform: translateY(-1px);
  }
  .solar-erp-page .bsv-kpi__body {
    height: 100%;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .solar-erp-page .bsv-kpi__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--ax-radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .solar-erp-page .bsv-kpi__icon svg { width: 16px; height: 16px; }
  .solar-erp-page .bsv-kpi__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__caption {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.35;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__value {
    font-family: var(--ax-font-display);
    font-size: 1.35rem;
    line-height: 1.1;
    font-weight: 700;
    color: var(--ax-text-strong);
    font-variant-numeric: tabular-nums;
  }
  .solar-erp-page .bsv-kpi__unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted);
  }

  /* Table Card */
  .solar-erp-page .ax-card {
    min-width: 0;
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: var(--ax-shadow-sm, 0 2px 8px rgba(15,23,42,.04));
    overflow: hidden;
    background: var(--ax-surface-solid, #fff);
  }
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 180px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title {
    font-size: var(--ax-text-lg, 17px);
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    margin: 0;
  }
  .solar-erp-page .ax-card__subtitle {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Table */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 2200px; white-space: nowrap; }
  .solar-erp-page .ax-table { border-collapse: separate; border-spacing: 0; }
  .solar-erp-page .ax-table__th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: var(--ax-text-muted, #64748b);
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    white-space: nowrap;
  }
  .solar-erp-page .ax-table__td {
    padding: 11px 14px;
    vertical-align: middle;
    font-size: var(--ax-text-sm, 13px);
    border-bottom: 1px solid var(--ax-border-subtle, #edf2f7);
  }
  .solar-erp-page .ax-table__row:last-child .ax-table__td { border-bottom: 0; }
  .solar-erp-page .ax-table--hover .ax-table__row:hover .ax-table__td {
    background: color-mix(in srgb, var(--ula-accent) 4%, var(--ax-surface-solid, #fff));
  }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-surface-solid, #fff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-sticky-first th:first-child {
    z-index: 3;
    background: var(--ax-surface-subtle, #f8fafc);
  }

  /* Left-aligned ULA Pagination */
  .solar-erp-page .ax-card__footer {
    width: 100%;
    box-sizing: border-box;
    background: var(--ax-surface-subtle, #f8fafc);
    padding: 10px 16px;
    border-top: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Modal */
  .solar-erp-page .ax-modal {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: 0 24px 70px rgba(15,23,42,.2);
    overflow: hidden;
  }
  .solar-erp-page .ax-modal__header {
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
`;

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

const ICON_PLUS = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_EYE = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS}>
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

function MetricKpiCard({
  icon,
  tone,
  label,
  value,
  unit,
  sub,
  badge,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  badge: string;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className="bsv-kpi ax-col--3" role="region" aria-label={label}>
      <div className="bsv-kpi__body">
        <div className="bsv-kpi__head">
          <div className="bsv-kpi__title-wrap">
            <span className="bsv-kpi__icon" style={{ background: t.bg, color: t.fg }}>
              <svg {...ICON_PROPS}>{icon}</svg>
            </span>
            <span className="bsv-kpi__label">{label}</span>
          </div>
          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{badge}</span>
        </div>
        <div className="bsv-kpi__value-row">
          <span className="bsv-kpi__value">{value}</span>
          {unit && <span className="bsv-kpi__unit">{unit}</span>}
        </div>
        <div className="bsv-kpi__caption">{sub}</div>
      </div>
    </div>
  );
}

export function Bihar_Installation_SSL_InstallationInspection() {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<SslInstallationInspectionItem[]>([]);
  const [eligibleDistricts, setEligibleDistricts] = useState<string[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState('all');

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDistrict, setAddDistrict] = useState('');
  const [addBlock, setAddBlock] = useState('');
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [availablePanchayats, setAvailablePanchayats] = useState<{ panchayat: string; count: number }[]>([]);
  const [panchayatsLoading, setPanchayatsLoading] = useState(false);
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>([]);

  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addNoOfLights, setAddNoOfLights] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addRemarks, setAddRemarks] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);

  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // View Details Modal
  const [detailItem, setDetailItem] = useState<SslInstallationInspectionItem | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstallationInspection();
      setEligibleDistricts(Array.isArray(res.districts) ? res.districts : []);
      setInspections(Array.isArray(res.inspections) ? res.inspections : []);
    } catch (err) {
      console.error('[InstallationInspection] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When Add Modal district changes, fetch blocks
  useEffect(() => {
    if (!addDistrict) {
      setAvailableBlocks([]);
      setAddBlock('');
      setAvailablePanchayats([]);
      setSelectedPanchayats([]);
      return;
    }
    let active = true;
    (async () => {
      setBlocksLoading(true);
      try {
        const blks = await biharSslInstallationService.fetchInspectionBlocks(addDistrict);
        if (active) {
          setAvailableBlocks(blks);
          setAddBlock('');
          setAvailablePanchayats([]);
          setSelectedPanchayats([]);
        }
      } catch (err) {
        console.error('[Fetch Blocks] error:', err);
      } finally {
        if (active) setBlocksLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [addDistrict]);

  // When Add Modal block changes, fetch panchayats
  useEffect(() => {
    if (!addDistrict || !addBlock) {
      setAvailablePanchayats([]);
      setSelectedPanchayats([]);
      return;
    }
    let active = true;
    (async () => {
      setPanchayatsLoading(true);
      try {
        const pList = await biharSslInstallationService.fetchInspectionPanchayats(addDistrict, addBlock);
        if (active) {
          setAvailablePanchayats(pList);
          setSelectedPanchayats([]);
        }
      } catch (err) {
        console.error('[Fetch Panchayats] error:', err);
      } finally {
        if (active) setPanchayatsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [addDistrict, addBlock]);

  // Toggle panchayat selection
  const handleTogglePanchayat = (pName: string) => {
    setSelectedPanchayats((prev) => {
      if (prev.includes(pName)) {
        return prev.filter((p) => p !== pName);
      } else {
        return [...prev, pName];
      }
    });
  };

  // Update total lights count based on selected panchayats
  useEffect(() => {
    let count = 0;
    selectedPanchayats.forEach((pName) => {
      const found = availablePanchayats.find((ap) => ap.panchayat === pName);
      if (found) count += found.count;
    });
    setAddNoOfLights(count > 0 ? String(count) : '');
  }, [selectedPanchayats, availablePanchayats]);

  // Handle Add Submit
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!addDistrict || !addBlock || selectedPanchayats.length === 0) {
      setAddError('Please select District, Block, and at least one Panchayat.');
      return;
    }
    if (!addDate || !addNoOfLights || !addAmount || !addRemarks.trim()) {
      setAddError('All fields marked with * are required.');
      return;
    }
    if (!addFile) {
      setAddError('Please upload an inspection file.');
      return;
    }

    setAddSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('district', addDistrict);
      fd.append('block', addBlock);
      selectedPanchayats.forEach((p) => {
        fd.append('panchayat[]', p);
      });
      fd.append('date', addDate);
      fd.append('no_of_lights', addNoOfLights);
      fd.append('amount', addAmount);
      fd.append('remarks', addRemarks.trim());
      fd.append('file', addFile);

      const res = await biharSslInstallationService.storeInstallationInspection(fd);
      setAddSuccess(res.message || 'Inspection Created Successfully!');
      await loadData();
      setTimeout(() => {
        setAddModalOpen(false);
        setAddDistrict('');
        setAddBlock('');
        setSelectedPanchayats([]);
        setAddNoOfLights('');
        setAddAmount('');
        setAddRemarks('');
        setAddFile(null);
      }, 1000);
    } catch (err: any) {
      console.error('[Add Installation Inspection] error:', err);
      setAddError(err.message || 'Failed to submit inspection.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Unique districts for filter
  const allDistricts = useMemo(() => {
    const set = new Set<string>();
    inspections.forEach((item) => {
      if (item.district) set.add(item.district.trim());
    });
    return Array.from(set).sort();
  }, [inspections]);

  // Filtered List
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return inspections.filter((item) => {
      if (q) {
        const matches =
          (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
          (item.district && item.district.toLowerCase().includes(q)) ||
          (item.block && item.block.toLowerCase().includes(q)) ||
          (item.remarks && item.remarks.toLowerCase().includes(q)) ||
          (item.insp_code && item.insp_code.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (districtFilter !== 'all' && item.district?.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (verifyFilter !== 'all' && String(item.verify_status) !== verifyFilter) {
        return false;
      }
      return true;
    });
  }, [inspections, deferredQuery, districtFilter, verifyFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = inspections.length;
    let totalLights = 0;
    let totalAmount = 0;
    let verifiedCount = 0;

    inspections.forEach((item) => {
      totalLights += Number(item.no_of_lights) || 0;
      totalAmount += Number(item.amount) || 0;
      if (item.inspection_status === 1 || item.verify_status === 1) verifiedCount++;
    });

    return { totalCount, totalLights, totalAmount, verifiedCount };
  }, [inspections]);

  // Pagination hook
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Export Columns
  const exportCols: ExportColumn<SslInstallationInspectionItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || DASH },
    { header: 'State', accessor: (r) => r.state || 'Bihar' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => formatPanchayat(r.panchayat) },
    { header: 'Date', accessor: 'date' },
    { header: 'No of Lights', accessor: 'no_of_lights' },
    { header: 'Amount', accessor: (r) => cur(r.amount) },
    { header: 'Inspection Remark', accessor: 'remarks' },
    {
      header: 'Inspection Status',
      accessor: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Verify Status',
      accessor: (r) => (r.verify_status === 1 ? 'Approved' : 'Pending'),
    },
    { header: 'Verify Remarks', accessor: (r) => r.verify_remarks || DASH },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Payment By', accessor: 'payment_by' },
    { header: 'Payment Remark', accessor: 'payment_remark' },
    {
      header: 'Payment Status',
      accessor: (r) => (r.payment_status === 1 ? 'Paid' : 'Pending'),
    },
  ];

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV('Bihar_SSL_Installation_Inspection', filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel('Bihar_SSL_Installation_Inspection', filtered, exportCols);
  const handleExportPDF = () => printTableData('Bihar SSL Installation Inspection', filtered, exportCols);

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Installation Inspection"
        subtitle="Manage site installation inspection reports, audits, and verification approvals"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Inspection' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setAddError(null);
                setAddSuccess(null);
                setAddModalOpen(true);
              }}
            >
              {ICON_PLUS}
              <span className="ax-btn__label">Add Installation Inspection</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh list"
            >
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid">
          <MetricKpiCard
            icon={
              <>
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </>
            }
            tone="blue"
            label="Total Installation Inspections"
            value={metrics.totalCount}
            sub="Site inspection batches"
            badge="Batches"
          />

          <MetricKpiCard
            icon={
              <>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </>
            }
            tone="cyan"
            label="Total Inspected Lights"
            value={num(metrics.totalLights)}
            unit="lights"
            sub="Audited site points"
            badge="Installed"
          />

          <MetricKpiCard
            icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
            tone="emerald"
            label="Cumulative Amount"
            value={cur(metrics.totalAmount)}
            sub="Total inspection value"
            badge="Inspection"
          />

          <MetricKpiCard
            icon={
              <>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </>
            }
            tone="amber"
            label="Verified Inspections"
            value={metrics.verifiedCount}
            unit="approved"
            sub="Completed BREDA audits"
            badge="Verified"
          />
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SSL Installation Inspection</h2>
            <p className="ax-card__subtitle" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {inspections.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            {/* District Filter */}
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
            >
              <option value="all">All Districts</option>
              {allDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Verify Status Filter */}
            <select
              className="ax-input ax-input--sm"
              value={verifyFilter}
              onChange={(e) => {
                setVerifyFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
            >
              <option value="all">All Verification</option>
              <option value="1">Approved</option>
              <option value="0">Pending</option>
            </select>

            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, district, block…"
              ariaLabel="Search installation inspections"
            />

            {/* Export Toolbar */}
            <TableExportToolbar
              onCopy={handleCopy}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={19} rows={8} showCard={false} />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            title="No Data Available in Table"
            message={
              searchQuery || districtFilter !== 'all' || verifyFilter !== 'all'
                ? 'No installation inspections match your current filters.'
                : 'No installation inspections recorded yet. Click "Add Installation Inspection" to create one.'
            }
            onClear={() => {
              setSearchQuery('');
              setDistrictFilter('all');
              setVerifyFilter('all');
            }}
            clearLabel="Reset Filters"
          />
        ) : (
          <>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
                <caption className="ax-visually-hidden">View SSL Installation Inspection</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 50 }}>
                      Sr. No.
                    </th>
                    <th className="ax-table__th" scope="col">
                      Vendor Name
                    </th>
                    <th className="ax-table__th" scope="col">
                      State
                    </th>
                    <th className="ax-table__th" scope="col">
                      District
                    </th>
                    <th className="ax-table__th" scope="col">
                      Block
                    </th>
                    <th className="ax-table__th" scope="col">
                      Panchayat
                    </th>
                    <th className="ax-table__th" scope="col">
                      Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      No of Lights
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Amount
                    </th>
                    <th className="ax-table__th" scope="col">
                      Inspection Remark
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      File
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Inspection Status
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Verify Status
                    </th>
                    <th className="ax-table__th" scope="col">
                      Verify Remarks
                    </th>
                    <th className="ax-table__th" scope="col">
                      Payment Date
                    </th>
                    <th className="ax-table__th" scope="col">
                      Payment By
                    </th>
                    <th className="ax-table__th" scope="col">
                      Payment Remark
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Payment Status
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.map((item, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isInspApproved = item.inspection_status === 1;
                    const isVerifyApproved = item.verify_status === 1;
                    const isPaid = item.payment_status === 1;
                    const fileUrl = getMediaUrl(item.file);

                    return (
                      <tr key={item.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {rowNum}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}
                        >
                          {item.vendor_name || DASH}
                        </td>
                        <td className="ax-table__td">{item.state || 'Bihar'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {item.district || DASH}
                        </td>
                        <td className="ax-table__td">{item.block || DASH}</td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={formatPanchayat(item.panchayat)}
                        >
                          {formatPanchayat(item.panchayat)}
                        </td>
                        <td className="ax-table__td">{item.date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                            {item.no_of_lights ? `${item.no_of_lights} Lights` : DASH}
                          </span>
                        </td>
                        <td
                          className="ax-table__td"
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            fontFamily: 'var(--ax-font-mono)',
                            color: 'var(--ax-text-strong)',
                          }}
                        >
                          {cur(item.amount)}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.remarks || undefined}
                        >
                          {item.remarks || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-badge ax-badge--soft ax-badge--neutral"
                              style={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                              View File ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isInspApproved ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isInspApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isVerifyApproved ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isVerifyApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.verify_remarks || undefined}
                        >
                          {item.verify_remarks || DASH}
                        </td>
                        <td className="ax-table__td">{item.payment_date || DASH}</td>
                        <td className="ax-table__td">{item.payment_by || DASH}</td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={item.payment_remark || undefined}
                        >
                          {item.payment_remark || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setDetailItem(item)}
                            title="View Details"
                            style={{ gap: 4 }}
                          >
                            {ICON_EYE}
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left-aligned ULA Pagination */}
            <div className="ax-card__footer">
              <div className="ula-pagination-left">
                <Pagination
                  currentPage={pagination.curPage}
                  totalItems={filtered.length}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Add Installation Inspection Modal ── */}
      {addModalOpen && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !addSubmitting && setAddModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 580 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Add SSL Installation Inspection</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setAddModalOpen(false)}
                disabled={addSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="ax-modal__body">
                {addError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{addError}</div>
                  </div>
                )}
                {addSuccess && (
                  <div className="ax-alert ax-alert--success" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{addSuccess}</div>
                  </div>
                )}

                {/* District Selector */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    District <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="ax-input"
                    value={addDistrict}
                    onChange={(e) => setAddDistrict(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  >
                    <option value="">-- Select District --</option>
                    {eligibleDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Block Selector */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Block <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="ax-input"
                    value={addBlock}
                    onChange={(e) => setAddBlock(e.target.value)}
                    disabled={!addDistrict || blocksLoading}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  >
                    <option value="">
                      {blocksLoading ? 'Loading Blocks…' : '-- Select Block --'}
                    </option>
                    {availableBlocks.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Panchayats Multi-select Checkboxes */}
                {addBlock && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                      Select Panchayats <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {panchayatsLoading ? (
                      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', padding: '10px 0' }}>
                        Loading panchayats…
                      </div>
                    ) : availablePanchayats.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', padding: '10px 0' }}>
                        No pending installed lights available in this block.
                      </div>
                    ) : (
                      <div
                        style={{
                          maxHeight: 140,
                          overflowY: 'auto',
                          border: '1px solid var(--ax-border)',
                          borderRadius: 8,
                          padding: 10,
                          background: 'var(--ax-surface-subtle)',
                        }}
                      >
                        {availablePanchayats.map((p) => {
                          const checked = selectedPanchayats.includes(p.panchayat);
                          return (
                            <label
                              key={p.panchayat}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 13,
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleTogglePanchayat(p.panchayat)}
                                />
                                <span>{p.panchayat}</span>
                              </span>
                              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                                {p.count} Lights
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Date & No of Lights */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                      Inspection Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="ax-input"
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                      No. of Lights <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="ax-input"
                      value={addNoOfLights}
                      onChange={(e) => setAddNoOfLights(e.target.value)}
                      placeholder="Auto calculated"
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                      required
                    />
                  </div>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Inspection Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-input"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Remarks <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="ax-input"
                    rows={2}
                    value={addRemarks}
                    onChange={(e) => setAddRemarks(e.target.value)}
                    placeholder="Enter inspection remarks..."
                    style={{ width: '100%', borderRadius: 8, resize: 'vertical' }}
                    required
                  />
                </div>

                {/* File Upload */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Inspection Document / Report <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                    className="ax-input"
                    style={{ width: '100%', height: 40 }}
                    required
                  />
                </div>
              </div>

              <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setAddModalOpen(false)}
                  disabled={addSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={addSubmitting}>
                  {addSubmitting ? 'Submitting…' : 'Submit Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {detailItem && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setDetailItem(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 540 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Inspection Report Details #{detailItem.id}</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailItem(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong>Vendor:</strong> {detailItem.vendor_name || DASH}
                </div>
                <div>
                  <strong>District:</strong> {detailItem.district || DASH}
                </div>
                <div>
                  <strong>Block:</strong> {detailItem.block || DASH}
                </div>
                <div>
                  <strong>Panchayat:</strong> {formatPanchayat(detailItem.panchayat)}
                </div>
                <div>
                  <strong>Inspection Date:</strong> {detailItem.date || DASH}
                </div>
                <div>
                  <strong>No. of Lights:</strong> {detailItem.no_of_lights || 0}
                </div>
                <div>
                  <strong>Amount:</strong> {cur(detailItem.amount)}
                </div>
                <div>
                  <strong>Inspection Status:</strong>{' '}
                  <span
                    className={`ax-badge ax-badge--soft ax-badge--pill ${
                      detailItem.inspection_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                    }`}
                  >
                    {detailItem.inspection_status === 1 ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div>
                  <strong>Verify Status:</strong>{' '}
                  <span
                    className={`ax-badge ax-badge--soft ax-badge--pill ${
                      detailItem.verify_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                    }`}
                  >
                    {detailItem.verify_status === 1 ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span
                    className={`ax-badge ax-badge--soft ax-badge--pill ${
                      detailItem.payment_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                    }`}
                  >
                    {detailItem.payment_status === 1 ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Inspection Remark:</strong> {detailItem.remarks || DASH}
                </div>
                {detailItem.verify_remarks && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Verify Remarks:</strong> {detailItem.verify_remarks}
                  </div>
                )}
                {detailItem.file && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                    <strong>Attached File:</strong>{' '}
                    <a
                      href={getMediaUrl(detailItem.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ax-badge ax-badge--soft ax-badge--info"
                    >
                      View Attached Inspection Document ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setDetailItem(null)}
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

export default Bihar_Installation_SSL_InstallationInspection;

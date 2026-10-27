<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
=======
import { useCallback, useEffect, useMemo, useState, useDeferredValue, type CSSProperties, type ReactNode } from 'react';
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
<<<<<<< HEAD
=======
  getCompanyId,
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
  type AssignedSslLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
<<<<<<< HEAD
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';

const ICON_BATCH = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const ICON_SITES = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
const ICON_CLOCK = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const ICON_CHECK = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

// API: panchayat JSON string aata hai, e.g. "[\"Name\"]" -> "Name"
const parsePanchayat = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s;
    }
  }
  return '';
};

// API field names -> component field names
const normalizeRecord = (r: any): AssignedSslLightItem => ({
  ...r,
  start_date: r.start_date ?? r.sdate ?? '',
  end_date: r.end_date ?? r.ldate ?? '',
  site_count: Number(r.site_count ?? r.sitecount) || 0,
  remarks: r.remarks ?? r.remark ?? '',
  panchayat: parsePanchayat(r.panchayat),
  status: Number(r.status) || 0,
});

// yyyy-mm-dd -> dd-mm-yyyy
const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const [y, m, day] = String(d).split('-');
  return y && m && day ? `${day}-${m}-${y}` : String(d);
};

const getFileExt = (url?: string | null) => {
  if (!url) return 'FILE';
  const clean = url.split('?')[0];
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  return ext ? ext.toUpperCase() : 'FILE';
};

const resolveFileUrl = (file?: string | null) => {
  if (!file) return '';
  if (/^https?:\/\//i.test(file)) return file;
  return getMediaUrl(file) || '';
};

export function Bihar_Installation_SSL_AssignedLights() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AssignedSslLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedSslLightItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await biharSslInstallationService.getAssignedLights();
      setRecords(Array.isArray(data) ? data.map(normalizeRecord) : []);
    } catch (err: any) {
      console.error('[AssignedLights] load error:', err);
      setActionErrorMsg('Failed to load assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts for filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter: 1 = Pending, 2 = Accepted
      if (statusFilter === 'pending' && r.status === 2) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;

      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let totalSites = 0;
    let pendingCount = 0;
    let acceptedCount = 0;

    records.forEach((r) => {
      totalSites += Number(r.site_count) || 0;
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
    });

    return { totalBatches, totalSites, pendingCount, acceptedCount };
  }, [records]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 100 });

  // Export Columns
  const exportCols: ExportColumn<AssignedSslLightItem>[] = [
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'State', accessor: (r) => r.state || '' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Start Date', accessor: (r) => fmtDate(r.start_date) },
    { header: 'End Date', accessor: (r) => fmtDate(r.end_date) },
    { header: 'Site Count', accessor: 'site_count' },
    { header: 'Remarks', accessor: 'remarks' },
    {
      header: 'Status',
      accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Acceptance'),
    },
  ];

  const handleExportCSV = () => {
    exportDataToCSV('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  };

  const handleCopy = () => {
    copyTableDataToClipboard(filtered, exportCols);
  };

  const handleExportPDF = () => {
    printTableData('Bihar SSL Assigned Lights', filtered, exportCols);
  };

  const handleExportExcel = () => {
    exportDataToExcel('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  };

  // Trigger Accept
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await biharSslInstallationService.acceptAssignedLight(selectedItem.id);
      setActionSuccessMsg(res.message || 'Light assignment accepted successfully!');
      setAcceptModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to accept light assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const thBase: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--ax-text-subtle)',
  };

  const kpiCard: React.CSSProperties = {
    padding: '14px 18px',
    border: '1px solid var(--ax-border, #e2e8f0)',
    borderRadius: 12,
  };

  const kpiLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--ax-text-muted)',
    letterSpacing: '0.04em',
  };

  const kpiIcon = (bg: string, color: string): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    background: bg,
    color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="Assigned Lights"
        subtitle="Manage and accept Solar Street Light installation site allocations in Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Assigned Lights' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh list"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Notifications */}
      {actionSuccessMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {actionSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠ {actionErrorMsg}</span>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div className="ax-card ax-col--3" style={kpiCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={kpiIcon('rgba(37, 99, 235, 0.12)', BLUE_PRIMARY)}>{ICON_BATCH}</span>
              <span style={kpiLabel}>Total Batches</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalBatches)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>Assigned work orders</div>
          </div>

          <div className="ax-card ax-col--3" style={kpiCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={kpiIcon('rgba(100, 116, 139, 0.12)', 'var(--ax-text-strong)')}>{ICON_SITES}</span>
              <span style={kpiLabel}>Total Allocated Sites</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {num(metrics.totalSites)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>Cumulative light points</div>
          </div>

          <div className="ax-card ax-col--3" style={kpiCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={kpiIcon('rgba(245, 158, 11, 0.14)', AMBER_WARNING)}>{ICON_CLOCK}</span>
              <span style={kpiLabel}>Pending Acceptance</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: AMBER_WARNING, marginTop: 4 }}>
              {num(metrics.pendingCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>Requires vendor action</div>
          </div>

          <div className="ax-card ax-col--3" style={kpiCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={kpiIcon('rgba(16, 185, 129, 0.14)', GREEN_EMERALD)}>{ICON_CHECK}</span>
              <span style={kpiLabel}>Accepted Batches</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.acceptedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>Ready for installation</div>
=======
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Colors ── */
const BLUE_ACCENT = '#2563eb';
const GREEN_SUCCESS = '#10b981';
const AMBER_WARNING = '#f59e0b';
const DASH = '—';

/* ── ULA Page & Table CSS ── */
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
    gap: 10px;
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
    color: var(--bsv-accent);
    background: color-mix(in srgb, var(--bsv-accent) 12%, transparent);
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
  .solar-erp-page .bsv-kpi__head > .ax-badge {
    flex-shrink: 0;
    font-size: 11px;
    padding: 1px 6px;
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
  .solar-erp-page .bsv-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 12px;
    padding-top: 7px;
    border-top: 1px solid var(--ax-border-subtle);
  }
  .solar-erp-page .bsv-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-legend__dot {
    width: 7px;
    height: 7px;
    flex: 0 0 7px;
    border-radius: 50%;
    background: var(--c);
  }
  .solar-erp-page .bsv-legend__num {
    font-weight: 700;
    color: var(--ax-text-strong);
    font-variant-numeric: tabular-nums;
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
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 180px;
    min-width: 180px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Table styling */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 1380px; white-space: nowrap; }
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

  /* Left-aligned Pagination Container */
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

const ICON_CHECK = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS} strokeWidth={2.2}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface Segment {
  label: string;
  count: number;
  color: string;
}

function KpiCard({
  accent,
  icon,
  label,
  caption,
  value,
  unit,
  badge,
  segments,
}: {
  accent: string;
  icon: ReactNode;
  label: string;
  caption: string;
  value: ReactNode;
  unit?: string;
  badge?: ReactNode;
  segments?: Segment[];
}) {
  return (
    <div
      className="bsv-kpi ax-col--4"
      role="region"
      aria-label={label}
      style={{ ['--bsv-accent' as string]: accent } as CSSProperties}
    >
      <div className="bsv-kpi__body">
        <div className="bsv-kpi__head">
          <div className="bsv-kpi__title-wrap">
            <span className="bsv-kpi__icon">
              <svg {...ICON_PROPS}>{icon}</svg>
            </span>
            <div>
              <div className="bsv-kpi__label">{label}</div>
              <div className="bsv-kpi__caption">{caption}</div>
            </div>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
          </div>
          {badge}
        </div>
<<<<<<< HEAD
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <style>{`
          .assigned-lights-header {
            padding: 14px 20px;
            border-bottom: 1px solid var(--ax-border, #e2e8f0);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: nowrap;
            gap: 16px;
            overflow-x: auto;
            white-space: nowrap;
          }
          .assigned-lights-header .ax-export-toolbar {
            width: auto !important;
            margin-left: 0 !important;
            flex: 0 0 auto !important;
            gap: 6px !important;
          }
          .assigned-lights-header .ax-search-input {
            margin-left: 0 !important;
          }
        `}</style>

        {/* Filters and Search Toolbar in ONE Line */}
        <div className="ax-card__header assigned-lights-header">
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('all'); pagination.setPage(1); }}
            >
              All ({metrics.totalBatches})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'pending' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('pending'); pagination.setPage(1); }}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'accepted' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('accepted'); pagination.setPage(1); }}
            >
              Accepted ({metrics.acceptedCount})
            </button>
          </div>

          {/* Right Toolbar: District Filter + Search + Export in ONE Line */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ width: 'auto', minWidth: 140, height: 32, borderRadius: 8, fontSize: 13 }}
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, district, block…"
              style={{ width: 230, maxWidth: 230, flex: '0 0 230px', marginLeft: 0 }}
            />

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
          <TableSkeleton columns={13} rows={8} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ ...thBase, width: 50 }}>Sr. No.</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>Vendor</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>State</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>District</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>Block</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>Panchayat</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>Start Date</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>End Date</th>
                  <th style={{ ...thBase, textAlign: 'right' }}>Site Count</th>
                  <th style={{ ...thBase, textAlign: 'center' }}>Unique ID's File</th>
                  <th style={{ ...thBase, textAlign: 'left' }}>Remarks</th>
                  <th style={{ ...thBase, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thBase, textAlign: 'center', width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Assigned Lights Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No lights currently assigned.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isAccepted = r.status === 2;
                    const fileUrl = resolveFileUrl(r.uid_file);
                    const fileExt = getFileExt(r.uid_file);

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>
                          {rowNum}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                          {r.state || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.district || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{r.block || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{r.panchayat || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{fmtDate(r.start_date)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{fmtDate(r.end_date)}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.site_count)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: BLUE_PRIMARY }}
                              title="View / Download UID File"
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1={12} y1={18} x2={12} y2={12} />
                                <line x1={9} y1={15} x2={12} y2={18} />
                                <line x1={15} y1={15} x2={12} y2={18} />
                              </svg>
                              <span>{fileExt}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td
                          style={{ padding: '12px 14px', fontSize: 12.5, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={r.remarks || ''}
                        >
                          {r.remarks || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isAccepted ? '#ecfdf5' : '#fffbeb',
                              color: isAccepted ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {isAccepted ? 'Accepted' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {isAccepted ? (
                            <span style={{ fontSize: 12, color: GREEN_EMERALD, fontWeight: 700 }}>✓ Done</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => {
                                setSelectedItem(r);
                                setAcceptModalOpen(true);
                              }}
                            >
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <Pagination {...pagination} />
        </div>
      </section>

      {/* ── Accept Confirmation Modal ── */}
      {acceptModalOpen && selectedItem && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => {
            if (!submitting) {
              setAcceptModalOpen(false);
              setSelectedItem(null);
            }
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Accept Light Assignment
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!submitting) {
                    setAcceptModalOpen(false);
                    setSelectedItem(null);
                  }
                }}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
                Are you sure you want to accept this assigned solar street light batch for installation?
              </p>

              <div
                style={{
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1px solid var(--ax-border, #e2e8f0)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Vendor:</strong> {selectedItem.vendor || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>District:</strong> {selectedItem.district || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Block:</strong> {selectedItem.block || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Panchayat:</strong> {selectedItem.panchayat || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Period:</strong>{' '}
                  {fmtDate(selectedItem.start_date)} → {fmtDate(selectedItem.end_date)}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Site Count:</strong>{' '}
                  <span style={{ color: BLUE_PRIMARY, fontWeight: 700 }}>{num(selectedItem.site_count)}</span>
                </div>
              </div>
            </div>

            <div
              className="ax-modal__footer"
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => {
                  setAcceptModalOpen(false);
                  setSelectedItem(null);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={handleConfirmAccept}
                disabled={submitting}
              >
                {submitting ? 'Accepting…' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
=======

        <div className="bsv-kpi__value-row">
          <span className="bsv-kpi__value">{value}</span>
          {unit && <span className="bsv-kpi__unit">{unit}</span>}
        </div>

        {segments && (
          <div className="bsv-legend">
            {segments.map((s) => (
              <span key={s.label} className="bsv-legend__item" style={{ ['--c' as string]: s.color } as CSSProperties}>
                <span className="bsv-legend__dot" />
                {s.label} <span className="bsv-legend__num">{s.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
    </div>
  );
}

<<<<<<< HEAD
export default Bihar_Installation_SSL_AssignedLights;
=======
export function Bihar_Installation_SSL_AssignedLights() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AssignedSslLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedSslLightItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await biharSslInstallationService.getAssignedLights();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[AssignedLights] load error:', err);
      setActionErrorMsg('Failed to load assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter === 'pending' && r.status !== 1) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;
      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let totalSites = 0;
    let pendingCount = 0;
    let acceptedCount = 0;

    records.forEach((r) => {
      totalSites += Number(r.site_count) || 0;
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
    });

    const acceptedPct = totalBatches ? Math.round((acceptedCount / totalBatches) * 100) : 0;
    const pendingPct = totalBatches ? Math.round((pendingCount / totalBatches) * 100) : 0;

    return { totalBatches, totalSites, pendingCount, acceptedCount, acceptedPct, pendingPct };
  }, [records]);

  // Pagination hook
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Export Columns matching exact table structure
  const exportCols: ExportColumn<AssignedSslLightItem>[] = [
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'State', accessor: 'state' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Start Date', accessor: 'start_date' },
    { header: 'End Date', accessor: 'end_date' },
    { header: 'Site Count', accessor: 'site_count' },
    { header: 'Remarks', accessor: 'remarks' },
    {
      header: 'Status',
      accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Acceptance'),
    },
  ];

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  const handleExportPDF = () => printTableData('Bihar SSL Assigned Lights', filtered, exportCols);

  // Trigger Accept
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await biharSslInstallationService.acceptAssignedLight(selectedItem.id);
      setActionSuccessMsg(res.message || 'Light assignment accepted successfully!');
      setAcceptModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to accept light assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Lights"
        subtitle="Manage assigned installation batches and accept assignments for site execution"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Assigned Lights' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
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

      {/* Feedback Alerts */}
      {actionSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{actionSuccessMsg}</div>
        </div>
      )}

      {actionErrorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{actionErrorMsg}</div>
        </div>
      )}

      {/* ── KPI Row (ULA Standard 3-KPI Cards) ── */}
      {loading ? (
        <KpiSkeleton count={3} />
      ) : (
        <div className="ax-dash-grid">
          {/* KPI 1: Total Batches */}
          <KpiCard
            accent={BLUE_ACCENT}
            label="Total Assignments"
            caption="Allocated installation batches"
            value={metrics.totalBatches}
            unit="batches"
            badge={<span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">All Orders</span>}
            icon={
              <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </>
            }
            segments={[
              { label: 'Accepted', count: metrics.acceptedCount, color: GREEN_SUCCESS },
              { label: 'Pending', count: metrics.pendingCount, color: AMBER_WARNING },
            ]}
          />

          {/* KPI 2: Pending Acceptance */}
          <KpiCard
            accent={AMBER_WARNING}
            label="Pending Acceptance"
            caption="Vendor action required to start installation"
            value={metrics.pendingCount}
            unit="pending"
            badge={<span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">{metrics.pendingPct}%</span>}
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            }
            segments={[
              { label: 'Pending', count: metrics.pendingCount, color: AMBER_WARNING },
              { label: 'Others', count: metrics.totalBatches - metrics.pendingCount, color: 'var(--ax-border)' },
            ]}
          />

          {/* KPI 3: Accepted Batches */}
          <KpiCard
            accent={GREEN_SUCCESS}
            label="Accepted Assignments"
            caption="Ready for site execution"
            value={`${metrics.acceptedPct}%`}
            unit="accepted"
            badge={
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                {metrics.acceptedCount} / {metrics.totalBatches}
              </span>
            }
            icon={
              <>
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </>
            }
            segments={[
              { label: 'Accepted', count: metrics.acceptedCount, color: GREEN_SUCCESS },
              { label: 'Pending', count: metrics.pendingCount, color: AMBER_WARNING },
            ]}
          />
        </div>
      )}

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Assigned Installation Batches">
        {/* Header with Title, Tabs, District Select, Search & Export Toolbar */}
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Assigned SSL Lights</h2>
            <p className="ax-card__subtitle" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {records.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            {/* Status Tabs */}
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setStatusFilter('all');
                  pagination.setPage(1);
                }}
              >
                All ({metrics.totalBatches})
              </button>
              <button
                type="button"
                className={`ax-btn ax-btn--sm ${statusFilter === 'pending' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setStatusFilter('pending');
                  pagination.setPage(1);
                }}
              >
                Pending ({metrics.pendingCount})
              </button>
              <button
                type="button"
                className={`ax-btn ax-btn--sm ${statusFilter === 'accepted' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setStatusFilter('accepted');
                  pagination.setPage(1);
                }}
              >
                Accepted ({metrics.acceptedCount})
              </button>
            </div>

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
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, district, block…"
              ariaLabel="Search assigned lights"
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

        {/* Data Table with Skeletons */}
        {loading ? (
          <TableSkeleton columns={13} rows={8} showCard={false} />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            title="No Assigned Lights Found"
            message={
              searchQuery || statusFilter !== 'all' || districtFilter !== 'all'
                ? 'No assignments match your active filters. Try clearing search or filters.'
                : 'Assigned installation requests will appear here once allocated.'
            }
            onClear={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDistrictFilter('all');
            }}
            clearLabel="Reset Filters"
          />
        ) : (
          <>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
                <caption className="ax-visually-hidden">Assigned SSL Lights</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 60 }}>
                      Sr. No.
                    </th>
                    <th className="ax-table__th" scope="col">
                      Vendor
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
                      Start Date
                    </th>
                    <th className="ax-table__th" scope="col">
                      End Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Site Count
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Unique ID's File
                    </th>
                    <th className="ax-table__th" scope="col">
                      Remarks
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Status
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 120 }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isAccepted = r.status === 2;
                    const fileUrl = getMediaUrl(r.uid_file);

                    return (
                      <tr key={r.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {rowNum}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}
                        >
                          {r.vendor || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                          {r.state || 'Bihar'}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {r.district || DASH}
                        </td>
                        <td className="ax-table__td">{r.block || DASH}</td>
                        <td className="ax-table__td">{r.panchayat || DASH}</td>
                        <td className="ax-table__td">{r.start_date || DASH}</td>
                        <td className="ax-table__td">{r.end_date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                            {r.site_count ? `${r.site_count} Sites` : DASH}
                          </span>
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
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={r.remarks || undefined}
                        >
                          {r.remarks || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isAccepted ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isAccepted ? 'Accepted' : 'Pending Accept'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {isAccepted ? (
                            <span
                              className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill"
                              style={{ fontSize: 11 }}
                            >
                              ✓ Accepted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => {
                                setSelectedItem(r);
                                setAcceptModalOpen(true);
                              }}
                              style={{ gap: 4 }}
                            >
                              {ICON_CHECK}
                              <span>Accept</span>
                            </button>
                          )}
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

      {/* ── Accept Confirmation Modal ── */}
      {acceptModalOpen && selectedItem && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !submitting && setAcceptModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 480 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Confirm Acceptance</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setAcceptModalOpen(false)}
                disabled={submitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body">
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ax-text-strong)', lineHeight: 1.5 }}>
                Are you sure you want to accept this light assignment batch?
              </p>
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 'var(--ax-radius-md)',
                  background: 'var(--ax-surface-subtle)',
                  border: '1px solid var(--ax-border)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong>District:</strong> {selectedItem.district || DASH}
                </div>
                <div>
                  <strong>Block:</strong> {selectedItem.block || DASH}
                </div>
                <div>
                  <strong>Panchayat:</strong> {selectedItem.panchayat || DASH}
                </div>
                <div>
                  <strong>Site Count:</strong> {selectedItem.site_count || 0} Lights
                </div>
              </div>
            </div>
            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setAcceptModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={handleConfirmAccept}
                disabled={submitting}
              >
                {submitting ? 'Accepting…' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_AssignedLights;
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966

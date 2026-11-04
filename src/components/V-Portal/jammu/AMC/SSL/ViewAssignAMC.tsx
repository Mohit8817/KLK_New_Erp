import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSslService,
  type JammuSslComplaintItem,
} from '../../jammu-services';

const DASH = '—';

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
  } catch {
    // fallback
  }
  return trimmed;
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const isClosedOrResolved = (row: JammuSslComplaintItem): boolean => {
  const s = String(row.complaint_status ?? row.status ?? '').toLowerCase().trim();
  return (
    s === '2' ||
    s === 'closed' ||
    s === 'resolved' ||
    Boolean(row.closed_date) ||
    Boolean(row.resolved_by) ||
    Boolean(row.resolve_date)
  );
};

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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
    <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 18, height: 18, display: 'inline-flex' }}>{icon}</span>
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ───────── Responsive styling ───────── */
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

export function SSLAMC() {
  const [complaints, setComplaints] = useState<JammuSslComplaintItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'Open' | 'Closed'>('Open');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modal inspection
  const [inspectRow, setInspectRow] = useState<JammuSslComplaintItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'closed') {
        setActiveTab('Closed');
      } else if (hash === 'open') {
        setActiveTab('Open');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (nextTab: 'Open' | 'Closed') => {
    setActiveTab(nextTab);
    window.location.hash = nextTab;
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load complaints from API
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSslService.getViewSslComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Jammu SSL AMC] load error:', err);
      setComplaints([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load SSL complaints from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Summary counts
  const summary = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;
    let closerApprovedCount = 0;

    complaints.forEach((c) => {
      if (isClosedOrResolved(c)) {
        closedCount += 1;
        if (Number(c.closer_approved) === 1 || String(c.closer_approved).toLowerCase() === 'approved') {
          closerApprovedCount += 1;
        }
      } else {
        openCount += 1;
      }
    });

    return {
      total: complaints.length,
      open: openCount,
      closed: closedCount,
      approved: closerApprovedCount,
    };
  }, [complaints]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.district) set.add(c.district.trim());
    });
    return Array.from(set).sort();
  }, [complaints]);

  // Tab filtering: [Open] or [Closed]
  const tabFilteredComplaints = useMemo(() => {
    if (activeTab === 'Closed') {
      return complaints.filter((c) => isClosedOrResolved(c));
    }
    return complaints.filter((c) => !isClosedOrResolved(c));
  }, [complaints, activeTab]);

  // Search & district filtering
  const filteredComplaints = useMemo(() => {
    let list = tabFilteredComplaints;

    if (districtFilter !== 'all') {
      list = list.filter((c) => c.district?.toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          String(c.complaint_id || c.id || '').toLowerCase().includes(q) ||
          c.beneficiary_name?.toLowerCase().includes(q) ||
          c.site_name?.toLowerCase().includes(q) ||
          c.contact_no?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.pole_no?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q) ||
          c.block?.toLowerCase().includes(q) ||
          c.panchyat?.toLowerCase().includes(q) ||
          c.panchayat?.toLowerCase().includes(q) ||
          c.ward_no?.toLowerCase().includes(q) ||
          c.complaint?.toLowerCase().includes(q) ||
          c.complaint_issue?.toLowerCase().includes(q) ||
          c.luminary_no?.toLowerCase().includes(q) ||
          c.sim_no?.toLowerCase().includes(q) ||
          c.battery_serial_no?.toLowerCase().includes(q) ||
          c.module_no?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [tabFilteredComplaints, districtFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredComplaints, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, activeTab, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setPage(1);
  };

  // Exactly 30 export columns per user specifications
  const exportCols: ExportColumn<JammuSslComplaintItem>[] = useMemo(
    () => [
      { header: 'Sr. no.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Complaint ID', accessor: (r) => r.complaint_id || (r.id ? `#${r.id}` : DASH) },
      { header: 'Complaint Date', accessor: (r) => formatDate(r.complaint_date || r.created_at || r.date) },
      { header: 'Complaint', accessor: (r) => r.complaint || r.complaint_issue || DASH },
      { header: 'State', accessor: (r) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchyat', accessor: (r) => r.panchyat || r.panchayat || DASH },
      { header: 'Ward No', accessor: (r) => r.ward_no || DASH },
      { header: 'Pole No', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || r.site_name || DASH },
      { header: 'Contact No', accessor: (r) => r.contact_no || r.phone || r.mobile || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Along with Pole', accessor: (r) => r.along_with_pole || DASH },
      { header: 'Luminary No', accessor: (r) => r.luminary_no || DASH },
      { header: 'SIM No', accessor: (r) => r.sim_no || r.sim || DASH },
      { header: 'Battery Serial No', accessor: (r) => r.battery_serial_no || r.battery_no || DASH },
      { header: 'Module No', accessor: (r) => r.module_no || r.panel_no || DASH },
      { header: 'Date of Installation', accessor: (r) => formatDate(r.date_of_installation || r.installation_date) },
      { header: 'Document', accessor: (r) => (r.document || r.file ? 'Attached' : DASH) },
      {
        header: 'Complaint Status',
        accessor: (r) => (isClosedOrResolved(r) ? 'Closed' : 'Open'),
      },
      { header: 'Resolved By', accessor: (r) => r.resolved_by || r.resolver_name || DASH },
      { header: 'Closed Date', accessor: (r) => formatDate(r.closed_date || r.resolve_date) },
      { header: 'Resolver Email', accessor: (r) => r.resolver_email || DASH },
      { header: 'Resolver Phone', accessor: (r) => r.resolver_phone || r.resolver_contact || DASH },
      { header: 'Resolved Document', accessor: (r) => (r.resolved_document ? 'Attached' : DASH) },
      { header: 'Resolved Remark', accessor: (r) => r.resolved_remark || r.closer_remark || DASH },
      {
        header: 'Closer Approved',
        accessor: (r) =>
          r.closer_approved !== undefined && r.closer_approved !== null
            ? Number(r.closer_approved) === 1
              ? 'Approved'
              : 'Pending'
            : DASH,
      },
      { header: 'Action', accessor: () => 'View' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_Complaints_${activeTab}`;
  const fileTitle = `Jammu SSL AMC Complaints Register (${activeTab})`;

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
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeExportValue(c.header)}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredComplaints.length) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const rowsHtml = filteredComplaints
      .map(
        (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${escapeExportValue(r.complaint_id || r.id || DASH)}</b></td>
          <td>${formatDate(r.complaint_date || r.date)}</td>
          <td>${escapeExportValue(r.complaint || r.complaint_issue || DASH)}</td>
          <td>${escapeExportValue(r.state || 'Jammu & Kashmir')}</td>
          <td>${escapeExportValue(r.district || DASH)}</td>
          <td>${escapeExportValue(r.block || DASH)}</td>
          <td>${escapeExportValue(r.panchyat || r.panchayat || DASH)}</td>
          <td>${escapeExportValue(r.ward_no || DASH)}</td>
          <td>${escapeExportValue(r.pole_no || DASH)}</td>
          <td>${escapeExportValue(r.beneficiary_name || r.site_name || DASH)}</td>
          <td>${escapeExportValue(r.contact_no || r.phone || DASH)}</td>
          <td>${escapeExportValue(r.latitude || DASH)}</td>
          <td>${escapeExportValue(r.longitude || DASH)}</td>
          <td>${escapeExportValue(r.along_with_pole || DASH)}</td>
          <td>${escapeExportValue(r.luminary_no || DASH)}</td>
          <td>${escapeExportValue(r.sim_no || r.sim || DASH)}</td>
          <td>${escapeExportValue(r.battery_serial_no || DASH)}</td>
          <td>${escapeExportValue(r.module_no || DASH)}</td>
          <td>${formatDate(r.date_of_installation)}</td>
          <td>${isClosedOrResolved(r) ? 'Closed' : 'Open'}</td>
          <td>${escapeExportValue(r.resolved_by || DASH)}</td>
          <td>${formatDate(r.closed_date)}</td>
        </tr>`
      )
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; margin: 20px; color: #1e293b; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            p { margin-top: 0; color: #64748b; font-size: 11px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>${fileTitle}</h1>
          <p>Generated on ${new Date().toLocaleString()} · Total: ${filteredComplaints.length} records</p>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Complaint ID</th>
                <th>Date</th>
                <th>Complaint</th>
                <th>State</th>
                <th>District</th>
                <th>Block</th>
                <th>Panchyat</th>
                <th>Ward No</th>
                <th>Pole No</th>
                <th>Beneficiary Name</th>
                <th>Contact</th>
                <th>Lat</th>
                <th>Long</th>
                <th>Along Pole</th>
                <th>Luminary</th>
                <th>SIM</th>
                <th>Battery No</th>
                <th>Module No</th>
                <th>Installation Date</th>
                <th>Status</th>
                <th>Resolved By</th>
                <th>Closed Date</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            background: toastMsg.type === 'success' ? '#16a34a' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{toastMsg.text}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <PageHead
        title="Jammu SSL — View SSL Complaint"
        subtitle="Annual Maintenance Contract (AMC) tracker and complaint register for Solar Street Lights"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Jammu & Kashmir' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View SSL Complaint' },
        ]}
      />

      {/* KPI Summary Cards */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Complaints"
          value={Number(summary.total || 0).toLocaleString('en-IN')}
          sub="All registered grievances"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Open Complaints"
          value={Number(summary.open || 0).toLocaleString('en-IN')}
          sub="Awaiting technician resolution"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Closed / Resolved"
          value={Number(summary.closed || 0).toLocaleString('en-IN')}
          sub="Successfully rectified issues"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Closer Approved"
          value={Number(summary.approved || 0).toLocaleString('en-IN')}
          sub="Verified and signed off"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
      </div>

      {/* ── Report Wise Bifurcation ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div
          style={{
            fontSize: 'var(--ax-text-xs, 12px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted, #64748b)',
            marginBottom: 6,
            letterSpacing: '0.04em',
          }}
        >
          Report Wise Bifurcation
        </div>
        <div className="ax-cluster" role="tablist" aria-label="Complaint report bifurcation tabs" style={{ gap: 'var(--ax-space-2, 8px)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'Open'}
            className={`ax-btn ax-btn--sm ${activeTab === 'Open' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => handleTabChange('Open')}
          >
            <span className="ax-btn__label">
              Open ({summary.open})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'Closed'}
            className={`ax-btn ax-btn--sm ${activeTab === 'Closed' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => handleTabChange('Closed')}
          >
            <span className="ax-btn__label">
              Closed ({summary.closed})
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Complaints Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu SSL Complaints">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SSL Complaint</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredComplaints.length}</span> of <span className="ax-num">{complaints.length}</span> complaints
              {' '}· Active Tab: <b className="ax-num">{activeTab}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter */}
              {distinctDistricts.length > 0 && (
                <select
                  id="jammu_ssl_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {distinctDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

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
                placeholder="Search complaint, beneficiary, pole…"
                size="sm"
                ariaLabel="Search complaints"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredComplaints, exportCols)}
                onExportCSV={() => exportToCSV(filteredComplaints, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredComplaints, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* Table Body - Exact 30 Columns */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 2800 }}
          >
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. no.</th>
                <th className="ax-table__th" scope="col">Complaint ID</th>
                <th className="ax-table__th" scope="col">Complaint Date</th>
                <th className="ax-table__th" scope="col">Complaint</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Panchyat</th>
                <th className="ax-table__th" scope="col">Ward No</th>
                <th className="ax-table__th" scope="col">Pole No</th>
                <th className="ax-table__th" scope="col">Beneficiary Name</th>
                <th className="ax-table__th" scope="col">Contact No</th>
                <th className="ax-table__th" scope="col">Latitude</th>
                <th className="ax-table__th" scope="col">Longitude</th>
                <th className="ax-table__th" scope="col">Along with Pole</th>
                <th className="ax-table__th" scope="col">Luminary No</th>
                <th className="ax-table__th" scope="col">SIM No</th>
                <th className="ax-table__th" scope="col">Battery Serial No</th>
                <th className="ax-table__th" scope="col">Module No</th>
                <th className="ax-table__th" scope="col">Date of Installation</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Complaint Status</th>
                <th className="ax-table__th" scope="col">Resolved By</th>
                <th className="ax-table__th" scope="col">Closed Date</th>
                <th className="ax-table__th" scope="col">Resolver Email</th>
                <th className="ax-table__th" scope="col">Resolver Phone</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Resolved Document</th>
                <th className="ax-table__th" scope="col">Resolved Remark</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Closer Approved</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={30} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SSL complaints from server…
                  </td>
                </tr>
              )}
              {!loading && filteredComplaints.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={30} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No complaints match your active filters or search query.'
                          : undefined
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const closed = isClosedOrResolved(row);
                  const docUrl = row.document || row.file;
                  const resDocUrl = row.resolved_document;

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      {/* 1. Sr. no. */}
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>

                      {/* 2. Complaint ID */}
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                          {row.complaint_id || (row.id ? `#${row.id}` : DASH)}
                        </span>
                      </td>

                      {/* 3. Complaint Date */}
                      <td className="ax-table__td">{formatDate(row.complaint_date || row.created_at || row.date)}</td>

                      {/* 4. Complaint */}
                      <td className="ax-table__td">
                        <span
                          title={row.complaint || row.complaint_issue || ''}
                          style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {row.complaint || row.complaint_issue || DASH}
                        </span>
                      </td>

                      {/* 5. State */}
                      <td className="ax-table__td">{row.state || 'Jammu & Kashmir'}</td>

                      {/* 6. District */}
                      <td className="ax-table__td">{row.district || DASH}</td>

                      {/* 7. Block */}
                      <td className="ax-table__td">{row.block || DASH}</td>

                      {/* 8. Panchyat */}
                      <td className="ax-table__td">{row.panchyat || row.panchayat || DASH}</td>

                      {/* 9. Ward No */}
                      <td className="ax-table__td">{row.ward_no || DASH}</td>

                      {/* 10. Pole No */}
                      <td className="ax-table__td">{row.pole_no || DASH}</td>

                      {/* 11. Beneficiary Name */}
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.beneficiary_name || row.site_name || DASH}
                        </span>
                      </td>

                      {/* 12. Contact No */}
                      <td className="ax-table__td">
                        {row.contact_no || row.phone || row.mobile ? (
                          <a
                            href={`tel:${row.contact_no || row.phone || row.mobile}`}
                            style={{ color: 'var(--asw-primary)', textDecoration: 'none' }}
                          >
                            {row.contact_no || row.phone || row.mobile}
                          </a>
                        ) : (
                          DASH
                        )}
                      </td>

                      {/* 13. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {row.latitude || DASH}
                      </td>

                      {/* 14. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {row.longitude || DASH}
                      </td>

                      {/* 15. Along with Pole */}
                      <td className="ax-table__td">{row.along_with_pole || DASH}</td>

                      {/* 16. Luminary No */}
                      <td className="ax-table__td">{row.luminary_no || DASH}</td>

                      {/* 17. SIM No */}
                      <td className="ax-table__td">{row.sim_no || row.sim || DASH}</td>

                      {/* 18. Battery Serial No */}
                      <td className="ax-table__td">{row.battery_serial_no || row.battery_no || DASH}</td>

                      {/* 19. Module No */}
                      <td className="ax-table__td">{row.module_no || row.panel_no || DASH}</td>

                      {/* 20. Date of Installation */}
                      <td className="ax-table__td">{formatDate(row.date_of_installation || row.installation_date)}</td>

                      {/* 21. Document */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {docUrl ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                            onClick={() => setPreviewDoc({ url: docUrl, title: `Complaint #${row.complaint_id || row.id} Document` })}
                          >
                            View Doc
                          </button>
                        ) : (
                          DASH
                        )}
                      </td>

                      {/* 22. Complaint Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {closed ? <Badge tone="success">Closed</Badge> : <Badge tone="warning">Open</Badge>}
                      </td>

                      {/* 23. Resolved By */}
                      <td className="ax-table__td">{row.resolved_by || row.resolver_name || DASH}</td>

                      {/* 24. Closed Date */}
                      <td className="ax-table__td">{formatDate(row.closed_date || row.resolve_date)}</td>

                      {/* 25. Resolver Email */}
                      <td className="ax-table__td">{row.resolver_email || DASH}</td>

                      {/* 26. Resolver Phone */}
                      <td className="ax-table__td">{row.resolver_phone || row.resolver_contact || DASH}</td>

                      {/* 27. Resolved Document */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {resDocUrl ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                            onClick={() => setPreviewDoc({ url: resDocUrl, title: `Closure Doc #${row.complaint_id || row.id}` })}
                          >
                            View Doc
                          </button>
                        ) : (
                          DASH
                        )}
                      </td>

                      {/* 28. Resolved Remark */}
                      <td className="ax-table__td">
                        <span
                          title={row.resolved_remark || row.closer_remark || ''}
                          style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {row.resolved_remark || row.closer_remark || DASH}
                        </span>
                      </td>

                      {/* 29. Closer Approved */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.closer_approved !== undefined && row.closer_approved !== null ? (
                          Number(row.closer_approved) === 1 ? (
                            <Badge tone="success">Approved</Badge>
                          ) : (
                            <Badge tone="info">Pending</Badge>
                          )
                        ) : (
                          DASH
                        )}
                      </td>

                      {/* 30. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ height: 28, padding: '0 10px', fontSize: 12, fontWeight: 600 }}
                          onClick={() => setInspectRow(row)}
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

        {/* Footer with Pagination */}
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

      {/* ── Inspection Details Modal ── */}
      {inspectRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complaint-detail-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setInspectRow(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--ax-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
              }}
            >
              <div>
                <h3 id="complaint-detail-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Complaint Details: {inspectRow.complaint_id || (inspectRow.id ? `#${inspectRow.id}` : DASH)}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  State: {inspectRow.state || 'Jammu & Kashmir'} · District: {inspectRow.district || DASH}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setInspectRow(null)}
                style={{ fontSize: 18, lineHeight: 1, padding: 6 }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 16,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Beneficiary Name</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{inspectRow.beneficiary_name || inspectRow.site_name || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Contact Number</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{inspectRow.contact_no || inspectRow.phone || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Block / Panchayat</div>
                  <div style={{ marginTop: 2 }}>{inspectRow.block || DASH} / {inspectRow.panchyat || inspectRow.panchayat || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Ward / Pole No</div>
                  <div style={{ marginTop: 2 }}>Ward: {inspectRow.ward_no || DASH} | Pole: {inspectRow.pole_no || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Coordinates (Lat, Long)</div>
                  <div style={{ marginTop: 2, fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                    {inspectRow.latitude || DASH}, {inspectRow.longitude || DASH}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Luminary & SIM</div>
                  <div style={{ marginTop: 2 }}>Luminary: {inspectRow.luminary_no || DASH} | SIM: {inspectRow.sim_no || inspectRow.sim || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Battery & Module No</div>
                  <div style={{ marginTop: 2 }}>Battery: {inspectRow.battery_serial_no || DASH} | Module: {inspectRow.module_no || DASH}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Installation Date</div>
                  <div style={{ marginTop: 2 }}>{formatDate(inspectRow.date_of_installation)}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Complaint / Reported Issue</div>
                  <div style={{ marginTop: 4, padding: 10, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {inspectRow.complaint || inspectRow.complaint_issue || DASH}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Status & Closer Approval</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isClosedOrResolved(inspectRow) ? <Badge tone="success">Closed</Badge> : <Badge tone="warning">Open</Badge>}
                    {inspectRow.closer_approved !== undefined && inspectRow.closer_approved !== null && (
                      <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                        Closer: {Number(inspectRow.closer_approved) === 1 ? 'Approved' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Resolved By & Date</div>
                  <div style={{ marginTop: 2 }}>{inspectRow.resolved_by || inspectRow.resolver_name || DASH} ({formatDate(inspectRow.closed_date)})</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Resolution Remarks</div>
                  <div style={{ marginTop: 4, padding: 10, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {inspectRow.resolved_remark || inspectRow.closer_remark || DASH}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px 20px',
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setInspectRow(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              maxWidth: 800,
              width: '100%',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{previewDoc.title}</h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setPreviewDoc(null)}
                style={{ fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'center', maxHeight: '75vh', overflow: 'auto' }}>
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--primary ax-btn--sm"
              >
                Open in New Tab
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setPreviewDoc(null)}
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

export { SSLAMC as ViewAssignAMC };
export default SSLAMC;

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSslSiteRecord,
} from '../../up-services';
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

const DASH = '—';

type KpiTone = 'accent' | 'amber' | 'emerald';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
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
    <div className="ax-card ax-col--4" style={{ padding: '16px 20px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
      <div style={{ fontSize: 26, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .up-tab-btn {
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ax-text-muted, #64748b);
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .up-tab-btn:hover {
    color: var(--ax-text, #0f172a);
    background: var(--ax-surface-subtle, #f1f5f9);
  }
  .up-tab-btn.active {
    background: var(--ax-surface-solid, #ffffff);
    color: var(--ax-accent, #2563eb);
    border-color: var(--ax-border, #cbd5e1);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .up-tab-badge {
    padding: 2px 7px;
    font-size: 11px;
    border-radius: 9999px;
    background: var(--ax-surface-subtle, #e2e8f0);
    color: inherit;
    font-weight: 700;
  }
  .up-tab-btn.active .up-tab-badge {
    background: rgba(37, 99, 235, 0.12);
    color: var(--ax-accent, #2563eb);
  }
`;

function DetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: UpSslSiteRecord | null;
  onClose: () => void;
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

  if (!open || !item) return null;

  return createPortal(
    <div
      className="ax-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ssl-site-title"
        className="ax-card"
        style={{
          width: '100%',
          maxWidth: 620,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
          borderRadius: 16,
          background: 'var(--ax-surface-solid, #ffffff)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase' }}>
              SSL Site Information
            </span>
            <h3 id="ssl-site-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              {item.beneficiary_name} {item.uid ? `(${item.uid})` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--subtle"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{(item.state || 'UP').toUpperCase()}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{item.district || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Block: </span><strong>{item.block || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Village: </span><strong>{item.village || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary: </span><strong>{item.beneficiary_name || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact No.: </span><strong>{item.contact_no || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>UID: </span><strong>{item.uid || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Vendor: </span><strong>{item.vendor || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Scheme: </span><strong>{item.scheme || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Survey Status: </span><strong>{Number(item.survey_status) === 1 ? 'Complete' : 'Incomplete'}</strong></div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--primary"
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function UP_Survey_SSL_ViewData() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<UpSslSiteRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'incomplete' | 'complete'>('incomplete');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailItem, setDetailItem] = useState<UpSslSiteRecord | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    upSurveyService
      .getViewSslSites()
      .then((res) => {
        setSites(res);
      })
      .catch((err) => {
        console.error('Error fetching UP SSL sites:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts
  const counts = useMemo(() => {
    const total = sites.length;
    const complete = sites.filter((s) => Number(s.survey_status) === 1 || String(s.survey_status).toLowerCase() === 'complete').length;
    const incomplete = total - complete;
    return { total, incomplete, complete };
  }, [sites]);

  // Tab List
  const tabList = useMemo(() => {
    return sites.filter((s) => {
      const isComplete = Number(s.survey_status) === 1 || String(s.survey_status).toLowerCase() === 'complete';
      return activeTab === 'complete' ? isComplete : !isComplete;
    });
  }, [sites, activeTab]);

  // Filtered List
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabList;
    return tabList.filter((s) => {
      return (
        String(s.state || '').toLowerCase().includes(q) ||
        String(s.district || '').toLowerCase().includes(q) ||
        String(s.block || '').toLowerCase().includes(q) ||
        String(s.contact_no || '').toLowerCase().includes(q) ||
        String(s.beneficiary_name || '').toLowerCase().includes(q)
      );
    });
  }, [tabList, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Export Columns definition
  const exportCols: ExportColumn<UpSslSiteRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => i + 1 },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Contact NO', accessor: (r) => r.contact_no || DASH },
      { header: 'Beneficery Name', accessor: (r) => r.beneficiary_name || DASH },
    ],
    []
  );

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, View UP SSl Site"
        subtitle="View and manage Uttar Pradesh Solar Street Light survey sites"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'View UP SSl Site' },
        ]}
      />

      {/* KPI Cards: Total, Incomplete Sites, Completed Sites (Strictly numbers only, NO 'Nos.') */}
      <div className="ax-dash-grid" style={{ marginBottom: 24, gap: 16 }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              tone="accent"
              label="Total"
              value={counts.total}
              sub="All SSL Sites"
            />
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              tone="amber"
              label="Incomplete Sites"
              value={counts.incomplete}
              sub="Pending Survey"
            />
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              tone="emerald"
              label="Completed Sites"
              value={counts.complete}
              sub="Survey Completed"
            />
          </>
        )}
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div
          className="ax-card__header"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          }}
        >
          {/* Report Wise Bifurcation */}
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              Report Wise Bifurcation
            </h3>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--ax-surface-subtle, #f1f5f9)',
                padding: 4,
                borderRadius: 10,
                border: '1px solid var(--ax-border, #e2e8f0)',
                gap: 4,
              }}
            >
              <button
                type="button"
                className={`up-tab-btn ${activeTab === 'incomplete' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('incomplete');
                  setPage(1);
                }}
              >
                <span>Incomplete</span>
                <span className="up-tab-badge">{counts.incomplete}</span>
              </button>
              <button
                type="button"
                className={`up-tab-btn ${activeTab === 'complete' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('complete');
                  setPage(1);
                }}
              >
                <span>Complete</span>
                <span className="up-tab-badge">{counts.complete}</span>
              </button>
            </div>
          </div>

          {/* Search & Export Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ width: 280 }}>
              <SearchInput
                placeholder="Search..."
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard('UP_SSL_Sites', filteredList, exportCols)}
              onExportCSV={() => exportDataToCSV('UP_SSL_Sites', filteredList, exportCols)}
              onExportExcel={() => exportDataToExcel('UP_SSL_Sites', filteredList, exportCols)}
              onPrint={() => printTableData('Vendor UP SSL Sites', filteredList, exportCols)}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Contact NO</th>
                  <th>Beneficery Name</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ax-text-muted)' }}>
                      Loading UP SSL sites...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          search
                            ? 'No sites match your search keywords.'
                            : `There are currently no ${activeTab} SSL sites.`
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center' }}>{srNo}</td>
                        <td>{(row.state || 'UP').toUpperCase()}</td>
                        <td>{row.district || DASH}</td>
                        <td>{row.block || DASH}</td>
                        <td>{row.contact_no || DASH}</td>
                        <td style={{ fontWeight: 600 }}>{row.beneficiary_name || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="ax-btn ax-btn--subtle"
                            style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer with Pagination */}
        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredList.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}

export const UPSurveySSLViewData = UP_Survey_SSL_ViewData;
export default UP_Survey_SSL_ViewData;

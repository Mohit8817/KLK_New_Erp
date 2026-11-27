import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
  jammuSurveyAdminService,
  type JammuSrt70SurveyAssignRecord,
  type JammuSrt70SurveyStats,
} from '../jammuSurveyAdminService';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
  actionsRowStyle,
  footerStyle,
  centerCell,
  Modal,
  KpiCard,
  MediaFileThumbnail,
  MediaLightbox,
  StatusFeedbackBanners,
  fmtDate,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

/* SVG Icons matching Solar ERP standard */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_CLIPBOARD = svg(<><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2l4 -4" /></>);
const I_USER_CHECK = svg(<><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);

export function ViewAssignSrt70MWSurvey() {
  const [batches, setBatches] = useState<JammuSrt70SurveyAssignRecord[]>([]);
  const [stats, setStats] = useState<JammuSrt70SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected batch for site details modal
  const [selectedBatch, setSelectedBatch] = useState<JammuSrt70SurveyAssignRecord | null>(null);
  const [batchSiteSearch, setBatchSiteSearch] = useState('');

  // Media lightbox
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchAssignData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSurveyAdminService.viewSrt70SurveyAssign();
      setBatches(Array.isArray(res.assign_surveys) ? res.assign_surveys : []);
      setStats(res.srts || null);
    } catch (err: any) {
      console.error('Failed to load assigned surveys:', err);
      setErrorMsg(err?.message || 'Failed to load Jammu SRT 70MW assigned survey records.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignData();
  }, [fetchAssignData]);

  // Search filter
  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) => {
      const vendorName = b.vendors?.name || String(b.vendor || '');
      return (
        String(b.id).includes(q) ||
        vendorName.toLowerCase().includes(q) ||
        (b.district || '').toLowerCase().includes(q) ||
        (b.purpose || '').toLowerCase().includes(q) ||
        (b.remarks || '').toLowerCase().includes(q)
      );
    });
  }, [batches, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredBatches, {
    initialPageSize: 10,
  });

  const pagedBatches = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredBatches.slice(start, start + pagination.pageSize);
  }, [filteredBatches, pagination.currentPage, pagination.pageSize]);

  // Parse sites in a batch
  const getBatchSites = useCallback((b: JammuSrt70SurveyAssignRecord) => {
    if (Array.isArray(b.site_details) && b.site_details.length > 0) {
      return b.site_details;
    }
    if (Array.isArray(b.site_names) && b.site_names.length > 0) {
      return b.site_names.map((name, i) => ({ id: i + 1, site_name: name }));
    }
    if (typeof b.site_name === 'string') {
      try {
        const parsed = JSON.parse(b.site_name);
        if (Array.isArray(parsed)) {
          return parsed.map((item, i) =>
            typeof item === 'object' && item !== null
              ? { id: item.id || i + 1, site_name: item.site_name || item.name || `Site #${item.id || i + 1}` }
              : { id: Number(item) || i + 1, site_name: `Site #${item}` }
          );
        }
      } catch {
        return b.site_name.split(',').map((s, i) => ({ id: i + 1, site_name: s.trim() }));
      }
    }
    return [];
  }, []);

  // Filtered sites inside modal
  const modalSites = useMemo(() => {
    if (!selectedBatch) return [];
    const all = getBatchSites(selectedBatch);
    const q = batchSiteSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) => String(s.id).includes(q) || (s.site_name || '').toLowerCase().includes(q));
  }, [selectedBatch, batchSiteSearch, getBatchSites]);

  // Export Columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'id', header: 'Batch ID' },
    { key: 'vendorName', header: 'Vendor Name' },
    { key: 'district', header: 'District' },
    { key: 'siteCount', header: 'Assigned Sites' },
    { key: 'purpose', header: 'Purpose' },
    { key: 'remarks', header: 'Remarks' },
    { key: 'assignDate', header: 'Assigned Date' },
  ];

  const exportRows = useMemo(() => {
    return filteredBatches.map((b) => ({
      id: b.id,
      vendorName: b.vendors?.name || b.vendor || DASH,
      district: b.district || DASH,
      siteCount: b.sitecount ?? getBatchSites(b).length,
      purpose: b.purpose || DASH,
      remarks: b.remarks || DASH,
      assignDate: fmtDate(b.assign_date || b.created_at),
    }));
  }, [filteredBatches, getBatchSites]);

  return (
    <div className="ax-page solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW Survey Assignments"
        subtitle="View and manage survey site assignments for empaneled vendors in Jammu"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'SRT 70MW', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'Assigned Surveys' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Survey Dashboard
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/verify"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Verify Surveys
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Survey Sites
            </Link>
          </div>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        onClearError={() => setErrorMsg('')}
      />

      {/* KPI Cards Row */}
      <div className="asw-cards-row">
        <KpiCard
          icon={I_CLIPBOARD}
          tone="accent"
          label="Total Survey Sites"
          value={fmtNum(stats?.total ?? stats?.totalsite ?? 0)}
          sub="Empaneled SRT 70MW sites"
        />
        <KpiCard
          icon={I_USER_CHECK}
          tone="emerald"
          label="Assigned Sites"
          value={fmtNum(stats?.assigned ?? stats?.assignsite ?? 0)}
          sub="Dispatched to survey vendors"
        />
        <KpiCard
          icon={I_DONE}
          tone="cyan"
          label="Survey Completed"
          value={fmtNum(stats?.survey_done ?? stats?.complete_survey ?? 0)}
          sub="Field surveys conducted"
        />
        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Survey Pending"
          value={fmtNum(stats?.survey_pending ?? stats?.pending_survey ?? 0)}
          sub="Awaiting vendor site visits"
        />
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
              Assigned Survey Batches
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredBatches.length} assigned work order batch{filteredBatches.length === 1 ? '' : 'es'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by vendor, district, batch..."
              />
              <TableExportToolbar
                onExportCSV={() => exportRowsCSV(exportColumns, exportRows, 'jammu_srt_survey_assign.csv')}
                onExportExcel={() => exportRowsExcel(exportColumns, exportRows, 'jammu_srt_survey_assign.xlsx')}
                onExportPDF={() => exportRowsPDF(exportColumns, exportRows, 'Jammu SRT 70MW Survey Assignments')}
                onCopy={() => copyRowsToClipboard(exportColumns, exportRows)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table">
            <thead>
              <tr>
                <th style={{ width: 50, ...centerCell }}>#</th>
                <th style={{ width: 100 }}>Batch ID</th>
                <th style={{ minWidth: 180 }}>Vendor Name</th>
                <th style={{ minWidth: 120 }}>District</th>
                <th style={{ minWidth: 130, ...centerCell }}>Assigned Sites</th>
                <th style={{ minWidth: 100 }}>Purpose</th>
                <th style={{ minWidth: 120, ...centerCell }}>Work Order File</th>
                <th style={{ minWidth: 180 }}>Remarks</th>
                <th style={{ minWidth: 130 }}>Assigned On</th>
                <th style={{ width: 110, ...centerCell }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 16px', color: '#2563eb' }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} />
                    Loading assigned survey records...
                  </td>
                </tr>
              ) : pagedBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '32px 16px' }}>
                    <TableEmptyState
                      title="No Survey Assignments Found"
                      description={searchQuery ? 'No batches match your search criteria.' : 'No survey batches have been assigned yet.'}
                    />
                  </td>
                </tr>
              ) : (
                pagedBatches.map((b, idx) => {
                  const vendorName = b.vendors?.name || (b.vendor ? `Vendor #${b.vendor}` : DASH);
                  const siteList = getBatchSites(b);
                  const siteCount = b.sitecount ?? siteList.length;

                  return (
                    <tr key={b.id}>
                      <td style={centerCell}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td>
                        <b style={{ color: '#2563eb' }}>#{b.id}</b>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendorName}</div>
                        {b.type && <span style={{ fontSize: 11, color: '#64748b' }}>Type: {b.type}</span>}
                      </td>
                      <td>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">
                          {b.district || 'Jammu'}
                        </span>
                      </td>
                      <td style={centerCell}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => {
                            setSelectedBatch(b);
                            setBatchSiteSearch('');
                          }}
                          style={{ gap: 4, fontWeight: 600 }}
                        >
                          <span style={{ color: '#2563eb' }}>{siteCount}</span> Site(s)
                        </button>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: 12, color: '#475569' }}>
                          {b.purpose || 'survey'}
                        </span>
                      </td>
                      <td style={centerCell}>
                        {b.file ? (
                          <MediaFileThumbnail
                            url={b.file}
                            title={`Batch #${b.id} Work Order`}
                            onClick={(url, title) => setLightbox({ url, title: title || `Batch #${b.id} Work Order` })}
                          />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{DASH}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {b.remarks || DASH}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {fmtDate(b.assign_date || b.created_at)}
                        </span>
                      </td>
                      <td style={centerCell}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => {
                            setSelectedBatch(b);
                            setBatchSiteSearch('');
                          }}
                        >
                          View Sites
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredBatches.length}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </div>

      {/* Batch Sites Modal */}
      {selectedBatch && (
        <Modal
          open={Boolean(selectedBatch)}
          title={`Batch #${selectedBatch.id} Assigned Survey Sites (${getBatchSites(selectedBatch).length})`}
          onClose={() => setSelectedBatch(null)}
          maxWidth={640}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  Vendor: {selectedBatch.vendors?.name || `Vendor #${selectedBatch.vendor}`}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  District: <b>{selectedBatch.district || 'Jammu'}</b> | State: <b>Jammu</b>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search sites in batch..."
                value={batchSiteSearch}
                onChange={(e) => setBatchSiteSearch(e.target.value)}
                className="ax-input ax-input--sm"
                style={{ width: 200, height: 34, fontSize: 12 }}
              />
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table className="ax-table ax-table--compact" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ width: 40, ...centerCell }}>#</th>
                    <th style={{ width: 90 }}>Site ID</th>
                    <th>Site Name / Address</th>
                  </tr>
                </thead>
                <tbody>
                  {modalSites.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 13 }}>
                        No sites match your filter.
                      </td>
                    </tr>
                  ) : (
                    modalSites.map((site, i) => (
                      <tr key={site.id || i}>
                        <td style={centerCell}>{i + 1}</td>
                        <td>
                          <b style={{ color: '#2563eb' }}>#{site.id}</b>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                            {site.site_name || `Site #${site.id}`}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedBatch(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox */}
      {lightbox && (
        <MediaLightbox
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default ViewAssignSrt70MWSurvey;

import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  type JammuSrt70SurveyItem,
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
  MediaLightbox,
  StatusFeedbackBanners,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

/* SVG Icons */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_CLIPBOARD = svg(<><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2l4 -4" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);

const QUICK_STATUS_PILLS = [
  { key: 'all', label: 'All Sites' },
  { key: 'pending', label: 'Verification Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = (searchParams.get('status') || 'all').toLowerCase();
  const districtParam = searchParams.get('district') || '';
  const vendorParam = searchParams.get('vendor') || '';

  const [activePill, setActivePill] = useState(rawStatus);
  const [allRecords, setAllRecords] = useState<JammuSrt70SurveyItem[]>([]);
  const [stats, setStats] = useState<JammuSrt70SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected row for details modal
  const [detailRow, setDetailRow] = useState<JammuSrt70SurveyItem | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSurveyAdminService.viewSrt70Survey();
      const p = Array.isArray(res.pending) ? res.pending : [];
      const v = Array.isArray(res.verify) ? res.verify : [];
      setAllRecords([...p, ...v]);
      setStats(res.srt70mw || null);
    } catch (err: any) {
      console.error('Failed to load Jammu SRT Survey records:', err);
      setErrorMsg(err?.message || 'Failed to load survey records from server.');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Keep active pill in sync if URL parameter changes
  useEffect(() => {
    if (rawStatus) {
      setActivePill(rawStatus);
    }
  }, [rawStatus]);

  // Filter records based on active status pill, district, vendor, and search
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Status pill filter
      if (activePill === 'pending') {
        if (Number(r.survey_verify_status ?? 0) !== 0) return false;
      } else if (activePill === 'approved') {
        if (Number(r.survey_verify_status) !== 1) return false;
      } else if (activePill === 'rejected') {
        if (Number(r.survey_verify_status) !== 2) return false;
      }

      // 2. District filter from URL
      if (districtParam && districtParam !== 'All') {
        if ((r.district || '').toLowerCase() !== districtParam.toLowerCase()) return false;
      }

      // 3. Vendor filter from URL
      if (vendorParam && vendorParam !== 'All') {
        const vId = String(r.survey_vendor || '');
        const vName = String(r.vendor_name || '');
        if (vId !== vendorParam && !vName.toLowerCase().includes(vendorParam.toLowerCase())) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesId = String(r.id).includes(q) || String(r.uid || '').includes(q);
        const matchesName = (r.site_name || '').toLowerCase().includes(q);
        const matchesDistrict = (r.district || '').toLowerCase().includes(q);
        const matchesContact = (r.contact_person || '').toLowerCase().includes(q) || String(r.contact_no || '').includes(q);
        const matchesVendor = String(r.vendor_name || r.survey_vendor || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesDistrict && !matchesContact && !matchesVendor) return false;
      }

      return true;
    });
  }, [allRecords, activePill, districtParam, vendorParam, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredRecords, {
    initialPageSize: 10,
  });

  const pagedRecords = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredRecords.slice(start, start + pagination.pageSize);
  }, [filteredRecords, pagination.currentPage, pagination.pageSize]);

  // Export Columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'id', header: 'Site ID' },
    { key: 'siteName', header: 'Site Name' },
    { key: 'district', header: 'District' },
    { key: 'vendor', header: 'Vendor' },
    { key: 'sanctionLoad', header: 'Sanction Load (kW)' },
    { key: 'surveyStatus', header: 'Survey Status' },
    { key: 'verifyStatus', header: 'Verify Status' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'contactNo', header: 'Contact No' },
  ];

  const exportRows = useMemo(() => {
    return filteredRecords.map((r) => ({
      id: r.id,
      siteName: r.site_name || DASH,
      district: r.district || DASH,
      vendor: r.vendor_name || r.survey_vendor || DASH,
      sanctionLoad: r.sanction_load || DASH,
      surveyStatus: Number(r.survey_status) === 1 ? 'Survey Done' : 'Pending',
      verifyStatus:
        Number(r.survey_verify_status) === 1
          ? 'Approved'
          : Number(r.survey_verify_status) === 2
          ? 'Rejected'
          : 'Pending Audit',
      contactPerson: r.contact_person || DASH,
      contactNo: r.contact_no || DASH,
    }));
  }, [filteredRecords]);

  return (
    <div className="ax-page solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW Survey Status Register"
        subtitle="Drilldown inspection register of Jammu SRT 70MW solar rooftop survey sites"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'SRT 70MW', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'Status Register' },
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
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              Verify Survey Queue
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
          value={fmtNum(allRecords.length || stats?.totalsite || stats?.total || 0)}
          sub="Dispatched survey records"
        />
        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={fmtNum(stats?.survey_verify_pending ?? allRecords.filter((r) => Number(r.survey_verify_status ?? 0) === 0).length)}
          sub="Awaiting admin approval"
        />
        <KpiCard
          icon={I_SHIELD}
          tone="emerald"
          label="Approved Surveys"
          value={fmtNum(stats?.survey_verify ?? stats?.survey_verify_complete ?? allRecords.filter((r) => Number(r.survey_verify_status) === 1).length)}
          sub="Verified and feasible"
        />
        <KpiCard
          icon={I_X}
          tone="red"
          label="Rejected Surveys"
          value={fmtNum(stats?.survey_verify_reject ?? allRecords.filter((r) => Number(r.survey_verify_status) === 2).length)}
          sub="Failed survey criteria"
        />
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
              Survey Records Register
            </h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {QUICK_STATUS_PILLS.map((p) => {
                const isSelected = activePill === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setActivePill(p.key);
                      setSearchParams({ status: p.key });
                    }}
                    className={`ax-btn ax-btn--xs ${isSelected ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                    style={{ borderRadius: 999, padding: '4px 12px', fontWeight: isSelected ? 700 : 500 }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by ID, name, district..."
              />
              <TableExportToolbar
                onExportCSV={() => exportRowsCSV(exportColumns, exportRows, 'jammu_srt_survey_register.csv')}
                onExportExcel={() => exportRowsExcel(exportColumns, exportRows, 'jammu_srt_survey_register.xlsx')}
                onExportPDF={() => exportRowsPDF(exportColumns, exportRows, 'Jammu SRT 70MW Survey Register')}
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
                <th style={{ width: 90 }}>Site ID</th>
                <th style={{ minWidth: 180 }}>Site Name / Consumer</th>
                <th style={{ minWidth: 120 }}>District</th>
                <th style={{ minWidth: 140 }}>Vendor</th>
                <th style={{ minWidth: 110, textAlign: 'right' }}>Load (kW)</th>
                <th style={{ minWidth: 120, ...centerCell }}>Survey Status</th>
                <th style={{ minWidth: 130, ...centerCell }}>Verify Status</th>
                <th style={{ minWidth: 140 }}>Contact Person</th>
                <th style={{ width: 100, ...centerCell }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 16px', color: '#2563eb' }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} />
                    Loading survey records...
                  </td>
                </tr>
              ) : pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '32px 16px' }}>
                    <TableEmptyState
                      title="No Survey Records Found"
                      description={searchQuery ? 'No survey sites match your search filter.' : 'No records match this status category.'}
                    />
                  </td>
                </tr>
              ) : (
                pagedRecords.map((r, idx) => {
                  const isDone = Number(r.survey_status) === 1;
                  const verifyStatus = Number(r.survey_verify_status ?? 0);

                  return (
                    <tr key={r.id || idx}>
                      <td style={centerCell}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td>
                        <b style={{ color: '#2563eb' }}>#{r.id}</b>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {r.site_name || DASH}
                        </div>
                        {r.address && (
                          <div style={{ fontSize: 11, color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.address}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">
                          {r.district || 'Jammu'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                          {r.vendor_name || (r.survey_vendor ? `Vendor #${r.survey_vendor}` : DASH)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {r.sanction_load ? `${r.sanction_load} kW` : DASH}
                      </td>
                      <td style={centerCell}>
                        <span className={`ax-badge ax-badge--soft ${isDone ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {isDone ? 'Survey Done' : 'Pending'}
                        </span>
                      </td>
                      <td style={centerCell}>
                        {verifyStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : verifyStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending Audit</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: '#334155' }}>
                          {r.contact_person || DASH}
                        </div>
                        {r.contact_no && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {r.contact_no}
                          </div>
                        )}
                      </td>
                      <td style={centerCell}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => setDetailRow(r)}
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

        {/* Footer Pagination */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredRecords.length}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </div>

      {/* Site Technical Details Modal */}
      {detailRow && (
        <Modal
          open={Boolean(detailRow)}
          title={`Survey Site Technical Details #${detailRow.id}`}
          onClose={() => setDetailRow(null)}
          maxWidth={700}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Site Name</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{detailRow.site_name || DASH}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>District / State</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{detailRow.district || 'Jammu'}, Jammu</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Vendor</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{detailRow.vendor_name || detailRow.survey_vendor || DASH}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Sanction Load</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{detailRow.sanction_load ? `${detailRow.sanction_load} kW` : DASH}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Consumer / Contact</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{detailRow.contact_person || DASH} ({detailRow.contact_no || DASH})</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Work Order No</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{detailRow.wo_no || DASH}</div>
              </div>
            </div>

            {detailRow.remarks && (
              <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 6, fontSize: 13 }}>
                <b>Remarks:</b> {detailRow.remarks}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailRow(null)}
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

export default StatusView;

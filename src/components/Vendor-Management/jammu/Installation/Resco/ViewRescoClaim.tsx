import { useEffect, useMemo, useState, useCallback, type FormEvent } from 'react';
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
  jammuRescoAdminService,
  resolveJammuMediaUrl,
  type RescoClaimRecord,
} from './jammuRescoAdminService';
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
  fmtCurrency,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

const getClaimStatusCode = (claim: RescoClaimRecord): number => {
  const candidates = [
    claim.claim_status,
    (claim as any).inst_claim_status,
    (claim as any).status,
    (claim as any).verify_status,
  ];
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '' && typeof val !== 'boolean') {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
  }
  return 1;
};

const getClaimStatusLabel = (status: number): string => {
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  if (status === 1) return 'Pending';
  return 'Not Raised';
};

export function ViewRescoClaim() {
  const [claims, setClaims] = useState<RescoClaimRecord[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    claim_approved: number;
    claim_pending: number;
    claim_reject: number;
  }>({
    total: 0,
    claim_approved: 0,
    claim_pending: 0,
    claim_reject: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify Claim Modal (id, status: 2|3, remarks)
  const [actionClaim, setActionClaim] = useState<RescoClaimRecord | null>(null);
  const [claimStatus, setClaimStatus] = useState<'2' | '3'>('2');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchClaims = useCallback(async (preserveError = false) => {
    setLoading(true);
    if (!preserveError) setErrorMsg('');
    try {
      const res = await jammuRescoAdminService.getViewClaim();
      const list: RescoClaimRecord[] = Array.isArray(res?.claims) ? res.claims : [];
      setClaims(list);
      const details = res?.claim_details;
      const approvedCount = list.filter((c) => getClaimStatusCode(c) === 2).length;
      const pendingCount = list.filter((c) => getClaimStatusCode(c) === 1).length;
      const rejectCount = list.filter((c) => getClaimStatusCode(c) === 3).length;
      setSummary({
        total: list.length > 0 ? list.length : Number(details?.total ?? 0),
        claim_approved: list.length > 0 ? approvedCount : Number(details?.claim_approved ?? 0),
        claim_pending: list.length > 0 ? pendingCount : Number(details?.claim_pending ?? 0),
        claim_reject: list.length > 0 ? rejectCount : Number(details?.claim_reject ?? 0),
      });
    } catch (err: any) {
      console.error('Failed to fetch Jammu RESCO claim requests:', err);
      if (!preserveError) {
        setErrorMsg(err?.message || 'Failed to fetch Jammu RESCO claim requests.');
      }
      setClaims([]);
      setSummary({ total: 0, claim_approved: 0, claim_pending: 0, claim_reject: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleVerifyClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionClaim || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuRescoAdminService.verifyClaimStatus(
        actionClaim.id,
        Number(claimStatus),
        claimRemarks.trim() || undefined
      );
      if (!res.success) {
        setErrorMsg(res.message || 'Failed to update claim status.');
        setActionClaim(null);
        setClaimRemarks('');
        await fetchClaims(true);
        return;
      }
      setSuccessMsg(res.message || 'Claim status updated successfully.');
      setActionClaim(null);
      setClaimRemarks('');
      await fetchClaims();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update claim status.');
      setActionClaim(null);
      setClaimRemarks('');
      await fetchClaims(true);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClaims = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      list = list.filter((c) => {
        const st = getClaimStatusCode(c);
        if (statusFilter === '1') return st === 1;
        if (statusFilter === '2') return st === 2;
        if (statusFilter === '3') return st === 3;
        return String(st) === statusFilter;
      });
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const siteNames = Array.isArray(c.sites) ? c.sites.map((s) => s.site_name).join(' ') : String(c.site_id || '');
      const district = Array.isArray(c.sites) && c.sites.length > 0 ? c.sites[0].district : (c as any).district || '';
      const vendorName = c.vendors?.name || (c as any).vendor_name || (c.vendor_id ? `Vendor #${c.vendor_id}` : '');
      const hay = [
        c.id,
        'JAMMU',
        district,
        siteNames,
        vendorName,
        c.amount,
        c.remarks,
        c.verify_remarks,
        c.approved_remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [claims, searchQuery, statusFilter]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<RescoClaimRecord>[]>(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: () => 'JAMMU' },
      {
        header: 'District',
        accessor: (r) => (Array.isArray(r.sites) && r.sites.length > 0 ? r.sites[0].district : (r as any).district || DASH),
      },
      {
        header: 'Vendor',
        accessor: (r) => r.vendors?.name || (r as any).vendor_name || (r.vendor_id ? `Vendor #${r.vendor_id}` : DASH),
      },
      { header: 'Claim Date', accessor: (r) => fmtDate(r.date || (r as any).created_at) },
      {
        header: 'Site Name',
        accessor: (r) =>
          Array.isArray(r.sites) && r.sites.length > 0
            ? r.sites.map((s) => s.site_name).join(', ')
            : String(r.site_id || `Site #${r.id}`),
      },
      { header: 'Claim Amount', accessor: (r) => r.amount },
      { header: 'Claim Update Date', accessor: (r) => fmtDate((r as any).updated_at || r.date) },
      {
        header: 'Claim Status',
        accessor: (r) => getClaimStatusLabel(getClaimStatusCode(r)),
      },
      { header: 'Claim Verify Remarks', accessor: (r) => r.verify_remarks || r.approved_remarks || DASH },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu RESCO Installation Claim"
        subtitle="Verification and audit desk for rooftop solar RESCO milestone claims, vendor submission invoices, and DISCOM commissioning settlements across Jammu"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: 'View Claim' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-payment"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Payments
          </Link>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>}
          tone="accent"
          label="Total Claims"
          value={fmtNum(summary.total)}
          sub="All RESCO claim requests"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          tone="amber"
          label="Claim Pending"
          value={fmtNum(summary.claim_pending)}
          sub="Awaiting approval"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Claim Approved"
          value={fmtNum(summary.claim_approved)}
          sub="Cleared for payment"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Claim Rejected"
          value={fmtNum(summary.claim_reject)}
          sub="Rejected claims"
        />
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Jammu RESCO Claim Request Data</h2>
            <p className="ax-card__subtitle">Showing {filteredClaims.length} claim record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 135, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="1">Pending (1)</option>
                <option value="2">Approved (2)</option>
                <option value="3">Rejected (3)</option>
              </select>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, amount, remarks..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredClaims, exportCols, `Jammu_RESCO_Claims_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredClaims, exportCols, `Jammu_RESCO_Claims_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredClaims, exportCols, 'View Jammu RESCO Claim Request Data')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1150 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Claim Date</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Update Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Claim Status</th>
                <th className="ax-table__th">Claim Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu RESCO claim requests...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No Jammu RESCO claim requests found." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const invoicePath = row.invoice_file || (row as any).invoice || (row as any).file;
                  const st = getClaimStatusCode(row);
                  const siteTitle = Array.isArray(row.sites) && row.sites.length > 0
                    ? row.sites.map((s) => s.site_name).join(', ')
                    : String(row.site_id || `Site #${row.id}`);
                  const districtName = Array.isArray(row.sites) && row.sites.length > 0
                    ? row.sites[0].district
                    : (row as any).district || DASH;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">{districtName}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendors?.name || (row as any).vendor_name || (row.vendor_id ? `Vendor #${row.vendor_id}` : DASH)}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.date || (row as any).inst_claim_date || (row as any).created_at)}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">{siteTitle}</span>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={invoicePath ? resolveJammuMediaUrl(invoicePath) : null}
                          alt={`Claim #${row.id} Invoice`}
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700 }}>{fmtCurrency(row.amount)}</td>
                      <td className="ax-table__td">{fmtDate((row as any).updated_at || row.date)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : st === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : st === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Raised</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.verify_remarks || row.approved_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => {
                              setActionClaim(row);
                              setClaimStatus('2');
                              setClaimRemarks(row.verify_remarks || row.approved_remarks || '');
                            }}
                          >
                            Verify Claim
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            {st === 2 || st === 3 ? 'Processed' : 'Not Raised'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Verify Claim Modal */}
      <Modal
        open={Boolean(actionClaim)}
        onClose={() => setActionClaim(null)}
        title="Verify Jammu RESCO Claim Request"
        subtitle={
          actionClaim
            ? `Claim #${actionClaim.id} • ${Array.isArray(actionClaim.sites) && actionClaim.sites.length > 0 ? actionClaim.sites[0].site_name : 'RESCO Site'} • Amount: ${fmtCurrency(actionClaim.amount)}`
            : ''
        }
        maxWidth={480}
      >
        <form onSubmit={handleVerifyClaim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Claim Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="ax-input"
              value={claimStatus}
              onChange={(e) => setClaimStatus(e.target.value as '2' | '3')}
              style={{ width: '100%' }}
              required
            >
              <option value="2">Approve (2)</option>
              <option value="3">Reject (3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Verify Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              placeholder="Optional approval or rejection notes..."
              style={{ width: '100%', padding: 10 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setActionClaim(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Submit Claim Status'}
            </button>
          </div>
        </form>
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default ViewRescoClaim;

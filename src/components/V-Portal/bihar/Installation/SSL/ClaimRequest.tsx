import { useCallback, useEffect, useMemo, useState, useDeferredValue, type FormEvent } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type SslClaimRaisedItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const RED_DANGER = '#ef4444';

const ICON_CLAIMS = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const ICON_RUPEE = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);
const ICON_APPROVED = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ICON_ELIGIBLE = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);


const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function Bihar_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<SslClaimRaisedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Eligible sites for claim
  const [eligibleSiteIds, setEligibleSiteIds] = useState<number[]>([]);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [siteIdsInput, setSiteIdsInput] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);
  const [raiseError, setRaiseError] = useState<string | null>(null);
  const [raiseSuccess, setRaiseSuccess] = useState<string | null>(null);

  // Edit Claim Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<SslClaimRaisedItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimList, installedData] = await Promise.all([
        biharSslInstallationService.getViewClaimDetails(),
        biharSslInstallationService.getViewInstalledLights(),
      ]);
      setClaims(Array.isArray(claimList) ? claimList : []);
      if (installedData?.claimed_applicable_ids) {
        setEligibleSiteIds(installedData.claimed_applicable_ids);
        setSiteIdsInput(installedData.claimed_applicable_ids.join(', '));
      }
    } catch (err) {
      console.error('[ClaimRequest] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered claims
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return claims.filter((c) => {
      if (q) {
        const matches =
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
          (c.vendor && c.vendor.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          String(c.claim_amount).includes(q) ||
          String(c.claim_site_count).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && String(c.claim_status) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [claims, deferredQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalClaims = claims.length;
    let totalClaimAmount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    claims.forEach((c) => {
      totalClaimAmount += Number(c.claim_amount) || 0;
      if (c.claim_status === 1) approvedCount++;
      else if (c.claim_status === 0) pendingCount++;
    });

    return {
      totalClaims,
      totalClaimAmount,
      approvedCount,
      pendingCount,
      eligibleSitesCount: eligibleSiteIds.length,
    };
  }, [claims, eligibleSiteIds]);

  // Pagination
  const pagination = usePagination<SslClaimRaisedItem>({
    data: filtered,
    initialPageSize: 15,
  });

  // Handle Raise Claim Submit
  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRaiseError(null);
    setRaiseSuccess(null);

    const cleanSites = siteIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleanSites.length < 100) {
      setRaiseError(`Minimum 100 eligible sites required to raise a claim. Currently provided: ${cleanSites.length}`);
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setRaiseError('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setRaiseError('Please select a claim invoice file.');
      return;
    }

    setRaiseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('claim_amount', claimAmount.trim());
      fd.append('claim_invoice', claimInvoiceFile);
      fd.append('site_ids', cleanSites.join(','));

      const res = await biharSslInstallationService.raiseClaim(fd);
      setRaiseSuccess(res.message || 'Claim Raised Successfully!!!');
      await loadData();
      setTimeout(() => {
        setRaiseModalOpen(false);
        setClaimAmount('');
        setClaimInvoiceFile(null);
      }, 1200);
    } catch (err: any) {
      console.error('[Raise Claim] error:', err);
      setRaiseError(err.message || 'Failed to raise claim request.');
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // Open Edit Claim Modal
  const handleOpenEdit = (claim: SslClaimRaisedItem) => {
    setEditingClaim(claim);
    setEditAmount(String(claim.claim_amount || ''));
    setEditInvoiceFile(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Handle Update Claim Submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    setEditError(null);
    if (!editAmount || Number(editAmount) <= 0) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_ids', String(editingClaim.id));
      fd.append('claim_amount', editAmount.trim());
      if (editInvoiceFile) {
        fd.append('claim_invoice', editInvoiceFile);
      }

      await biharSslInstallationService.updateClaimRaised(fd);
      await loadData();
      setEditModalOpen(false);
      setEditingClaim(null);
    } catch (err: any) {
      console.error('[Update Claim] error:', err);
      setEditError(err.message || 'Failed to update claim raised.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async (claimId: number) => {
    try {
      const blob = await biharSslInstallationService.downloadClaimPdf(claimId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bihar_SSL_Claim_${claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Could not download PDF: ${err.message}`);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslClaimRaisedItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || '—' },
    { header: 'State', accessor: 'state' },
    { header: 'Claim Raised Date', accessor: 'claim_raised_date' },
    { header: 'Site Count', accessor: 'claim_site_count' },
    { header: 'Claim Amount', accessor: 'claim_amount' },
    { header: 'Claim Update Date', accessor: 'claim_update_date' },
    {
      header: 'Claim Status',
      accessor: (r) => (r.claim_status === 1 ? 'Approved' : r.claim_status === 2 ? 'Rejected' : 'Pending'),
    },
    { header: 'Payment Status', accessor: 'payment_status' },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Payment Amount', accessor: 'payment_amount' },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="View SSL Claim Request"
        subtitle="Manage vendor installation payment claims and billing certifications (Min. 100 Sites)"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setRaiseError(null);
                setRaiseSuccess(null);
                setRaiseModalOpen(true);
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1={12} y1={5} x2={12} y2={19} />
                <line x1={5} y1={12} x2={19} y2={12} />
              </svg>
              <span>Raise Claim</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh claims"
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

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37, 99, 235, 0.12)', color: BLUE_PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_CLAIMS}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Total Claims Raised
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalClaims)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Submitted invoices
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(100, 116, 139, 0.12)', color: 'var(--ax-text-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_RUPEE}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Total Claim Amount
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {cur(metrics.totalClaimAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Combined billing value
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.14)', color: GREEN_EMERALD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_APPROVED}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Claims Approved
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.approvedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {num(metrics.pendingCount)} pending approval
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: metrics.eligibleSitesCount >= 100 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)', color: metrics.eligibleSitesCount >= 100 ? GREEN_EMERALD : AMBER_WARNING, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_ELIGIBLE}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Eligible Sites Available
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: metrics.eligibleSitesCount >= 100 ? GREEN_EMERALD : AMBER_WARNING, marginTop: 4 }}>
              {num(metrics.eligibleSitesCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {metrics.eligibleSitesCount >= 100 ? 'Eligible to raise claim' : 'Need min 100 sites'}
            </div>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('all'); pagination.setPage(1); }}
            >
              All Claims ({claims.length})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '0' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('0'); pagination.setPage(1); }}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('1'); pagination.setPage(1); }}
            >
              Approved ({metrics.approvedCount})
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, amount…"
            />
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Claims', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Claims', filtered, exportCols)}
              onExportPDF={() => printTableData('Bihar SSL Claim Requests', filtered, exportCols)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={14} rows={6} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Vendor Name</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Claim Raised Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Site Count</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Claim Invoice</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Claim Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Claim Update Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Claim Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Payment Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Payment Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Remark</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Claims Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No claim requests available.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.page - 1) * pagination.pageSize + idx + 1;
                    const invoiceUrl = getMediaUrl(r.claim_invoice);
                    const isApproved = r.claim_status === 1;
                    const isRejected = r.claim_status === 2;

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor_name || r.vendor || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.claim_raised_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.claim_site_count)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {invoiceUrl ? (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: BLUE_PRIMARY }}
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>Invoice</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {cur(r.claim_amount)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.claim_update_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#fffbeb',
                              color: isApproved ? GREEN_EMERALD : isRejected ? RED_DANGER : AMBER_WARNING,
                            }}
                          >
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: r.payment_status === 1 || r.payment_status === 'Paid' ? '#ecfdf5' : '#fffbeb',
                              color: r.payment_status === 1 || r.payment_status === 'Paid' ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {r.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.payment_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {r.payment_amount ? cur(r.payment_amount) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.payment_remark || ''}>
                          {r.payment_remark || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                         
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleOpenEdit(r)}
                              title="Update claim details"
                            >
                              Edit
                            </button>
                          </div>
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

      {/* ── Raise Claim Modal (Minimum 100 Sites Rule) ── */}
      {raiseModalOpen && (
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
            if (!raiseSubmitting) setRaiseModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 620,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
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
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Raise SSL Installation Claim
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Minimum 100 verified eligible sites required by policy
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!raiseSubmitting) setRaiseModalOpen(false);
                }}
                disabled={raiseSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 22 }}>
              {raiseSuccess && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                  ✓ {raiseSuccess}
                </div>
              )}
              {raiseError && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {raiseError}
                </div>
              )}

              <form onSubmit={handleRaiseSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="ax-input"
                      placeholder="e.g. 250000.00"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Claim Invoice Document (PDF / Image) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                      required
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700 }}>
                        Site IDs (Comma-separated) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: siteIdsInput.split(',').filter((s) => s.trim()).length >= 100 ? GREEN_EMERALD : RED_DANGER,
                        }}
                      >
                        Count: {siteIdsInput.split(',').filter((s) => s.trim()).length} / 100 required
                      </span>
                    </div>
                    <textarea
                      className="ax-input"
                      rows={4}
                      placeholder="e.g. 101, 102, 103..."
                      value={siteIdsInput}
                      onChange={(e) => setSiteIdsInput(e.target.value)}
                      required
                      style={{ width: '100%', borderRadius: 8, padding: 10, fontSize: 12.5 }}
                    />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 11.5 }}>
                      Auto-populated from your {eligibleSiteIds.length} eligible installed sites.
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setRaiseModalOpen(false)}
                    disabled={raiseSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={raiseSubmitting}
                  >
                    {raiseSubmitting ? 'Submitting…' : 'Submit Claim Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Claim Raised Modal (API 12) ── */}
      {editModalOpen && editingClaim && (
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
            if (!editSubmitting) setEditModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 14,
              maxWidth: 520,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
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
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Update Claim Request (#{editingClaim.id})
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!editSubmitting) setEditModalOpen(false);
                }}
                disabled={editSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 22 }}>
              {editError && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="ax-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Replace Invoice Document (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Updating…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_ClaimRequest;

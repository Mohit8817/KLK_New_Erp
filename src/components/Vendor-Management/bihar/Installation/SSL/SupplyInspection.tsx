import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

export interface BiharSSLSupplyItem {
  id: number;
  vendor_name: string;
  state: string;
  date: string;
  no_of_lights: number;
  amount: string;
  inspection_remark: string;
  file: string;
  inspection_status: string;
  verify_status: string;
  verify_remark: string;
}

export function BiharSSLInstallationSupplyInspection() {
  const [items, setItems] = useState<BiharSSLSupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Action / Verification Modal
  const [actionItem, setActionItem] = useState<BiharSSLSupplyItem | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<'1' | '2'>('1');
  const [verifyRemarkInput, setVerifyRemarkInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await biharAdminService.getViewSslSupplyInspections();
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.inspections)
        ? res.inspections
        : Array.isArray(res?.supply_inspections)
        ? res.supply_inspections
        : [];

      const mapped: BiharSSLSupplyItem[] = rawList.map((item: any, idx: number) => ({
        id: item.id ?? idx + 1,
        vendor_name: item.vendor_name || item.vendor || item.agency_name || '—',
        state: item.state || 'Bihar',
        date: item.date || item.created_at || item.inspection_date || '—',
        no_of_lights: Number(item.no_of_lights || item.lights_count || item.site_count || 0),
        amount: item.amount || item.claim_amount || '—',
        inspection_remark: item.inspection_remark || item.remarks || item.remark || '—',
        file: item.file || item.invoice || '',
        inspection_status:
          item.inspection_status ||
          (item.status === 1 ? 'Approved' : item.status === 2 ? 'Rejected' : 'Pending'),
        verify_status:
          item.verify_status ||
          (item.status === 1 ? 'Complete' : 'Pending'),
        verify_remark: item.verify_remark || item.verify_remarks || '—',
      }));

      setItems(mapped);
    } catch (err: any) {
      console.error('Failed to load Bihar SSL supply inspections:', err);
      setError(err?.message || 'Failed to load supply inspection data from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Verify Status update submission
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;
    try {
      setSubmitting(true);
      await biharAdminService.updateSslSupplyInspectionStatus({
        id: actionItem.id,
        status: verifyStatusChoice,
        verify_remark: verifyRemarkInput,
      });
      setActionSuccessMsg(`Supply inspection for ${actionItem.vendor_name} updated successfully!`);
      setActionItem(null);
      setVerifyRemarkInput('');
      await loadData();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Failed to update status: ${err?.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalRequests = items.length;
  const completeCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.verify_status.toLowerCase().includes('complete') ||
          i.verify_status.toLowerCase().includes('approved') ||
          i.inspection_status.toLowerCase().includes('approved')
      ).length,
    [items]
  );
  const pendingCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.verify_status.toLowerCase().includes('pending') ||
          i.inspection_status.toLowerCase().includes('pending')
      ).length,
    [items]
  );

  // Search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [
        r.vendor_name,
        r.state,
        r.date,
        r.amount,
        r.inspection_remark,
        r.inspection_status,
        r.verify_status,
        r.verify_remark,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });

  const exportCols: ExportColumn<BiharSSLSupplyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name },
      { header: 'State', accessor: (r) => r.state },
      { header: 'Date', accessor: (r) => r.date },
      { header: 'No of Lights', accessor: (r) => r.no_of_lights },
      { header: 'Amount', accessor: (r) => r.amount },
      { header: 'Inspection Remark', accessor: (r) => r.inspection_remark },
      { header: 'File', accessor: (r) => r.file },
      { header: 'Inspection Status', accessor: (r) => r.inspection_status },
      { header: 'Verify Status', accessor: (r) => r.verify_status },
      { header: 'Verify Remark', accessor: (r) => r.verify_remark },
    ],
    []
  );

  return (
    <div className="solar-erp-page" style={{ maxWidth: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="View Bihar SSL Supply Inspection"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: 'View Bihar SSL Supply Inspection' },
        ]}
      />

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, marginBottom: 16, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>
          ✕ {error}
        </div>
      )}

      {/* ── Top 3 KPI Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Supply Inspection Request</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {loading ? '—' : totalRequests}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Inspection notices</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#047857', textTransform: 'uppercase' }}>Verify Status</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
            {loading ? '—' : completeCount}
          </div>
          <div style={{ fontSize: 11.5, color: '#047857', fontWeight: 600 }}>Complete</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>Verify Status</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>
            {loading ? '—' : pendingCount}
          </div>
          <div style={{ fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>Pending</div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="ax-card__title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              View Bihar SSL Supply Inspection
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
              Showing {filtered.length} of {items.length} inspection records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search vendor, file..."
              size="sm"
              ariaLabel="Search inspections"
            />
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Supply_Inspections', filtered, exportCols)}
              onExportPDF={() => printTableData('View Bihar SSL Supply Inspection', filtered, exportCols)}
            />
          </div>
        </div>

        <div className="ax-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%', fontSize: 12.5 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>No of Lights</th>
                <th className="ax-table__th">Amount</th>
                <th className="ax-table__th">Inspection Remark</th>
                <th className="ax-table__th">File</th>
                <th className="ax-table__th">Inspection Status</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Verify Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="ax-spinner" style={{ width: 18, height: 18 }} />
                      <span>Loading supply inspections from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No inspection records found"
                      message={search ? 'No inspections match your search criteria.' : 'No supply inspections received from server.'}
                      onClear={search ? () => setSearch('') : undefined}
                      clearLabel="Clear search"
                    />
                  </td>
                </tr>
              ) : (
                (pagination.paged ?? []).map((r, idx) => {
                  const srNo = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={r.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.vendor_name}</td>
                      <td className="ax-table__td">{r.state}</td>
                      <td className="ax-table__td ax-num">{r.date}</td>
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700 }}>
                          {r.no_of_lights}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#047857' }}>{r.amount}</td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.inspection_remark}
                      </td>
                      <td className="ax-table__td">
                        {r.file ? (
                          <a
                            href={resolveBiharMediaUrl(r.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>📎</span>
                            <span>{r.file.split('/').pop()}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ${r.inspection_status.toLowerCase().includes('approv') ? 'ax-badge--success' : r.inspection_status.toLowerCase().includes('reject') ? 'ax-badge--danger' : 'ax-badge--warning'}`}>
                          {r.inspection_status}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ${r.verify_status.toLowerCase().includes('complete') || r.verify_status.toLowerCase().includes('approv') ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {r.verify_status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.verify_remark}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActionItem(r);
                            setVerifyStatusChoice('1');
                            setVerifyRemarkInput('');
                          }}
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ height: 28, padding: '0 10px', fontSize: 12, fontWeight: 600 }}
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filtered.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>

      {/* Action / Verification Modal */}
      {actionItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Verify Supply Inspection
              </h3>
              <button
                type="button"
                onClick={() => setActionItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Vendor Name</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{actionItem.vendor_name}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>No of Lights / Amount</div>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  {actionItem.no_of_lights} Lights · {actionItem.amount}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Verification Status *
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="radio"
                      name="verifyChoice"
                      value="1"
                      checked={verifyStatusChoice === '1'}
                      onChange={() => setVerifyStatusChoice('1')}
                    />
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Approve / Complete</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="radio"
                      name="verifyChoice"
                      value="2"
                      checked={verifyStatusChoice === '2'}
                      onChange={() => setVerifyStatusChoice('2')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Reject</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Verification Remarks
                </label>
                <textarea
                  className="ax-input"
                  rows={3}
                  value={verifyRemarkInput}
                  onChange={(e) => setVerifyRemarkInput(e.target.value)}
                  placeholder="Enter remarks for supply inspection..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActionItem(null)}
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

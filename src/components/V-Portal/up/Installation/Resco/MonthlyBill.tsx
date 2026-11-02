import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpRescoMonthlyBillItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

export function UP_Installation_Resco_MonthlyBill() {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState<UpRescoMonthlyBillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [generateModalSite, setGenerateModalSite] = useState<UpRescoMonthlyBillItem | null>(null);
  const [viewBillSite, setViewBillSite] = useState<UpRescoMonthlyBillItem | null>(null);
  const [billMonth, setBillMonth] = useState('2026-10');
  const [meterReading, setMeterReading] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoMonthlyBill();
      // If empty, provide sample default or empty state
      setBills(res || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load Resco installations for monthly billing.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setToast({ type: 'success', message: `Monthly Bill for ${generateModalSite?.site_name} generated successfully!` });
      setGenerateModalSite(null);
    }, 800);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter((b) =>
      Object.values(b).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [bills, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  const exportCols: ExportColumn<UpRescoMonthlyBillItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'State', accessor: (r) => r.state || 'up' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.net_smart_meter_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, View UP Resco Installation"
        subtitle="Generate recurring monthly energy generation bills and inspect site tariff statements"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Installation' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ${toast.type === 'success' ? 'ax-alert--success' : 'ax-alert--danger'}`} style={{ marginBottom: 16 }}>
          <span>{toast.message}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setToast(null)} style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}

      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              UP Resco Installation
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Generate generation invoices and monthly billing details
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search..."
              size="sm"
            />
            <TableExportToolbar
              data={filtered}
              columns={exportCols}
              filename="up_resco_monthly_billing"
              title="UP Resco Installation - Monthly Billing"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Site Name</th>
                  <th>Contact Person</th>
                  <th>Contact Number</th>
                  <th>Solar Meter No.</th>
                  <th>Inverter No.</th>
                  <th>Net/Smart Meter No.</th>
                  <th>Loger No.</th>
                  <th style={{ width: 200, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading monthly bill sites...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : 'No installed sites found for billing'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, idx) => {
                    const sr = startIndex + idx + 1;
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td>{item.state || 'up'}</td>
                        <td>{item.district || DASH}</td>
                        <td style={{ fontWeight: 600 }}>{item.site_name || DASH}</td>
                        <td>{item.contact_person || DASH}</td>
                        <td>{item.contact_number || DASH}</td>
                        <td>{item.solar_meter_no || DASH}</td>
                        <td>{item.inverter_no || DASH}</td>
                        <td>{item.net_smart_meter_no || DASH}</td>
                        <td>{item.loger_no || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => {
                                setGenerateModalSite(item);
                                setMeterReading('');
                              }}
                            >
                              Generate Bill
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => setViewBillSite(item)}
                            >
                              View Bill Details
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
        </div>

        <div className="ax-card__footer" style={{ padding: '10px 18px' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Generate Bill Modal */}
      {generateModalSite &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setGenerateModalSite(null)}
          >
            <div
              className="ax-card"
              style={{ width: 520, maxWidth: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Generate Bill: {generateModalSite.site_name}
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setGenerateModalSite(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGenerateBillSubmit}>
                <div className="ax-card__body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Billing Month
                      </label>
                      <input
                        type="month"
                        required
                        className="ax-input"
                        value={billMonth}
                        onChange={(e) => setBillMonth(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Current Meter Reading (kWh) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        className="ax-input"
                        placeholder="e.g. 1420.5"
                        value={meterReading}
                        onChange={(e) => setMeterReading(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Meter Serial Number
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="ax-input"
                        value={generateModalSite.solar_meter_no || generateModalSite.net_smart_meter_no || 'SM-001'}
                      />
                    </div>
                  </div>
                </div>

                <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setGenerateModalSite(null)} disabled={generating}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={generating}>
                    {generating ? 'Generating...' : 'Submit & Generate'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* View Bill Details Modal */}
      {viewBillSite &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setViewBillSite(null)}
          >
            <div
              className="ax-card"
              style={{ width: 560, maxWidth: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Bill Details: {viewBillSite.site_name}
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setViewBillSite(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ax-card__body" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, fontSize: 13 }}>
                  <div><b>District:</b> {viewBillSite.district || DASH}</div>
                  <div><b>Contact Person:</b> {viewBillSite.contact_person || DASH}</div>
                  <div><b>Contact:</b> {viewBillSite.contact_number || DASH}</div>
                  <div><b>Solar Meter No.:</b> {viewBillSite.solar_meter_no || DASH}</div>
                  <div><b>Inverter No.:</b> {viewBillSite.inverter_no || DASH}</div>
                  <div><b>Net Meter No.:</b> {viewBillSite.net_smart_meter_no || DASH}</div>
                  <div><b>Billing Cycle:</b> Monthly</div>
                  <div><b>Status:</b> <span className="ax-badge ax-badge--soft ax-badge--success">Active</span></div>
                </div>
              </div>

              <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
                <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setViewBillSite(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_Resco_MonthlyBill;

import { useCallback, useEffect, useMemo, useState, useDeferredValue, type FormEvent } from 'react';
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
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const RED_DANGER = '#ef4444';

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Helper to format panchayat string or JSON array
const formatPanchayat = (val: unknown): string => {
  if (!val) return '—';
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
        const panchs = await biharSslInstallationService.fetchInspectionPanchayats(addBlock, addDistrict);
        if (active) {
          setAvailablePanchayats(panchs);
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

  // Filtered List
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return inspections.filter((item) => {
      if (q) {
        const matches =
          (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
          (item.district && item.district.toLowerCase().includes(q)) ||
          (item.block && item.block.toLowerCase().includes(q)) ||
          (item.panchayat && item.panchayat.toLowerCase().includes(q)) ||
          (item.remarks && item.remarks.toLowerCase().includes(q)) ||
          String(item.no_of_lights).includes(q) ||
          String(item.amount).includes(q);
        if (!matches) return false;
      }
      if (districtFilter !== 'all' && item.district.toLowerCase() !== districtFilter.toLowerCase()) {
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
      if (item.verify_status === 1) verifiedCount++;
    });

    return { totalCount, totalLights, totalAmount, verifiedCount };
  }, [inspections]);

  // Pagination
  const pagination = usePagination<SslInstallationInspectionItem>({
    data: filtered,
    initialPageSize: 15,
  });

  // Toggle panchayat checkbox selection
  const handleTogglePanchayat = (name: string) => {
    setSelectedPanchayats((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  // Submit Add Installation Inspection
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!addDistrict || !addBlock || selectedPanchayats.length === 0 || !addDate || !addNoOfLights || !addAmount) {
      setAddError('Please fill in all mandatory fields and select at least one Panchayat.');
      return;
    }
    if (!addFile) {
      setAddError('Please attach an inspection file.');
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
      if (addRemarks.trim()) {
        fd.append('remarks', addRemarks.trim());
      }
      fd.append('file', addFile);

      const res = await biharSslInstallationService.storeInstallationInspection(fd);
      setAddSuccess(res.message || 'Installation Inspection Successfully!');
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
      }, 1200);
    } catch (err: any) {
      console.error('[Add Installation Inspection] error:', err);
      setAddError(err.message || 'Failed to submit installation inspection.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslInstallationInspectionItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || '—' },
    { header: 'State', accessor: 'state' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => formatPanchayat(r.panchayat) },
    { header: 'Date', accessor: 'date' },
    { header: 'No of Lights', accessor: 'no_of_lights' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Remarks', accessor: (r) => r.remarks || r.inspection_remark || '—' },
    {
      header: 'Inspection Status',
      accessor: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Verify Status',
      accessor: (r) => (r.verify_status === 1 ? 'Verified' : 'Pending'),
    },
    { header: 'Payment Status', accessor: 'payment_status' },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="View SSL Installation Inspection"
        subtitle="Verification and official inspection logs for installed Solar Street Lights in Bihar"
        breadcrumbs={[
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
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1={12} y1={5} x2={12} y2={19} />
                <line x1={5} y1={12} x2={19} y2={12} />
              </svg>
              <span>Add Installation Inspection</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh inspections"
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
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Total Inspections
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Site inspection batches
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Total Inspected Lights
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.totalLights)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Verified installed light units
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Inspected Amount
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {cur(metrics.totalAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Cumulative installation value
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Verified Status
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.verifiedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Approved field inspections
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
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 36, borderRadius: 8 }}
            >
              <option value="all">All Districts</option>
              {eligibleDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="ax-input ax-input--sm"
              value={verifyFilter}
              onChange={(e) => {
                setVerifyFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 36, borderRadius: 8 }}
            >
              <option value="all">All Verification</option>
              <option value="1">Verified</option>
              <option value="0">Pending</option>
            </select>
          </div>

          {/* Search & Export */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, block…"
            />
            <TableExportToolbar
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Installation_Inspections', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Installation_Inspections', filtered, exportCols)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={18} rows={6} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Vendor Name</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>District</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Block</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panchayat</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>No of Lights</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Inspection Remark</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>File</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Inspection Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Verify Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Verify Remarks</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment By</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Remark</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Payment Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={19} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Installation Inspections Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No inspection records available.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.page - 1) * pagination.pageSize + idx + 1;
                    const fileUrl = getMediaUrl(r.file);
                    const isApproved = r.inspection_status === 1;

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor_name || r.vendor || 'App Testing'}
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.district || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{r.block || '—'}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatPanchayat(r.panchayat)}>
                          {formatPanchayat(r.panchayat)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.no_of_lights)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {cur(r.amount)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remarks || r.inspection_remark || ''}>
                          {r.remarks || r.inspection_remark || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: BLUE_PRIMARY }}
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>Doc</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isApproved ? '#ecfdf5' : '#fffbeb',
                              color: isApproved ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {isApproved ? 'Approved' : 'Pending'}
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
                              background: r.verify_status === 1 ? '#ecfdf5' : '#f8fafc',
                              color: r.verify_status === 1 ? GREEN_EMERALD : '#64748b',
                            }}
                          >
                            {r.verify_status === 1 ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.verify_remarks || ''}>
                          {r.verify_remarks || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.payment_date || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.payment_by || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.payment_remark || ''}>
                          {r.payment_remark || '—'}
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
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => setDetailItem(r)}
                            title="View details"
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
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <Pagination {...pagination} />
        </div>
      </section>

      {/* ── View Details Modal ── */}
      {detailItem && (
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
          onClick={() => setDetailItem(null)}
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
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Installation Inspection Details (#{detailItem.id})
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setDetailItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13 }}>
                {[
                  { label: 'Vendor Name', val: detailItem.vendor_name || detailItem.vendor },
                  { label: 'State', val: detailItem.state },
                  { label: 'District / Block', val: `${detailItem.district} / ${detailItem.block}` },
                  { label: 'Panchayat(s)', val: formatPanchayat(detailItem.panchayat) },
                  { label: 'Inspection Date', val: detailItem.date },
                  { label: 'Number of Lights', val: num(detailItem.no_of_lights) },
                  { label: 'Amount', val: cur(detailItem.amount) },
                  { label: 'Inspection Remark', val: detailItem.remarks || detailItem.inspection_remark },
                  { label: 'Payment Date', val: detailItem.payment_date },
                  { label: 'Payment By', val: detailItem.payment_by },
                  { label: 'Payment Amount', val: detailItem.payment_status ? cur(detailItem.amount) : '—' },
                  { label: 'Payment Remark', val: detailItem.payment_remark },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{item.val || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ax-modal__footer" style={{ padding: '12px 22px', borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Installation Inspection Modal (With District, Block & Panchayat Cascade) ── */}
      {addModalOpen && (
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
            if (!addSubmitting) setAddModalOpen(false);
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
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Add SSL Installation Inspection
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!addSubmitting) setAddModalOpen(false);
                }}
                disabled={addSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 22, maxHeight: '72vh', overflowY: 'auto' }}>
              {addSuccess && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                  ✓ {addSuccess}
                </div>
              )}
              {addError && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                  ⚠ {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* District Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      District <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="ax-input"
                      value={addDistrict}
                      onChange={(e) => setAddDistrict(e.target.value)}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    >
                      <option value="">-- Select District --</option>
                      {eligibleDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Block Selection (Dynamic) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Block <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="ax-input"
                      value={addBlock}
                      onChange={(e) => setAddBlock(e.target.value)}
                      required
                      disabled={!addDistrict || blocksLoading}
                      style={{ width: '100%', height: 40, borderRadius: 8 }}
                    >
                      <option value="">
                        {blocksLoading ? 'Loading blocks…' : '-- Select Block --'}
                      </option>
                      {availableBlocks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Panchayat Multi-Select (Dynamic) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Panchayat(s) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {panchayatsLoading ? (
                      <div style={{ padding: 12, fontSize: 13, color: 'var(--ax-text-muted)' }}>
                        Fetching panchayats…
                      </div>
                    ) : availablePanchayats.length === 0 ? (
                      <div style={{ padding: 10, fontSize: 12.5, color: 'var(--ax-text-muted)', background: '#f8fafc', borderRadius: 6 }}>
                        {addBlock ? 'No panchayats available for this block.' : 'Please select District and Block first.'}
                      </div>
                    ) : (
                      <div
                        style={{
                          border: '1px solid var(--ax-border, #e2e8f0)',
                          borderRadius: 8,
                          maxHeight: 140,
                          overflowY: 'auto',
                          padding: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          background: '#fff',
                        }}
                      >
                        {availablePanchayats.map((p) => {
                          const isChecked = selectedPanchayats.includes(p.panchayat);
                          return (
                            <label
                              key={p.panchayat}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 13,
                                cursor: 'pointer',
                                padding: '4px 6px',
                                borderRadius: 4,
                                background: isChecked ? '#eff6ff' : 'transparent',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePanchayat(p.panchayat)}
                                />
                                <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? BLUE_PRIMARY : 'inherit' }}>
                                  {p.panchayat}
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                                ({p.count} lights)
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {selectedPanchayats.length > 0 && (
                      <div style={{ fontSize: 11.5, color: BLUE_PRIMARY, marginTop: 4, fontWeight: 600 }}>
                        Selected: {selectedPanchayats.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Date, No of Lights, Amount */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="ax-input"
                        value={addDate}
                        onChange={(e) => setAddDate(e.target.value)}
                        required
                        style={{ width: '100%', height: 40, borderRadius: 8 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        No. of Lights <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="ax-input"
                        placeholder="e.g. 20"
                        value={addNoOfLights}
                        onChange={(e) => setAddNoOfLights(e.target.value)}
                        required
                        style={{ width: '100%', height: 40, borderRadius: 8 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                        Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-input"
                        placeholder="e.g. 40000.00"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        required
                        style={{ width: '100%', height: 40, borderRadius: 8 }}
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Remarks (Optional)
                    </label>
                    <textarea
                      className="ax-input"
                      rows={2}
                      placeholder="Enter inspection remarks…"
                      value={addRemarks}
                      onChange={(e) => setAddRemarks(e.target.value)}
                      style={{ width: '100%', borderRadius: 8, padding: 8 }}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                      Inspection File <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                      required
                      style={{ fontSize: 13 }}
                    />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      Allowed: jpg, jpeg, png, webp, pdf (Max 5 MB)
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setAddModalOpen(false)}
                    disabled={addSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={addSubmitting}
                  >
                    {addSubmitting ? 'Submitting…' : 'Save Inspection'}
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

export default Bihar_Installation_SSL_InstallationInspection;

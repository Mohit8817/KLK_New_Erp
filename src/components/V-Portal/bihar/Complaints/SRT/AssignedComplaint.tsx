import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharComplaintService,
  getMediaUrl,
  type BiharComplaintItem,
  type AssignedComplaintsResponse,
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
  copyTableDataToClipboard,
  printTableData,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const CYAN_INFO = '#0891b2';

const ICON_TOTAL = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const ICON_ALERT = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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

const TH: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--ax-text-subtle)',
  textAlign: 'left',
};
const TD: React.CSSProperties = { padding: '12px 14px' };

function KpiCard({
  icon,
  bg,
  fg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  bg: string;
  fg: string;
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div
      className="ax-card ax-col--3"
      style={{ padding: '14px 18px', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: bg,
            color: fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span: number; children: React.ReactNode }) {
  return (
    <div className={`ax-col--${span}`}>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{children}</div>
    </div>
  );
}

const isItemRejected = (item: BiharComplaintItem | any): boolean => {
  if (!item) return false;
  const statusStr = String(item.status ?? '').toLowerCase().trim();
  const closeStatusStr = String(item.close_status ?? '').toLowerCase().trim();
  const approvalStatusStr = String(item.approval_status ?? item.approved_status ?? item.approval ?? '').toLowerCase().trim();
  const rejectStatusStr = String(item.reject_status ?? item.rejected ?? item.is_rejected ?? '').toLowerCase().trim();
  const remarksStr = String(item.reject_reason ?? item.reject_remarks ?? item.admin_remarks ?? '').toLowerCase().trim();

  return (
    statusStr === '2' ||
    statusStr === '-1' ||
    statusStr === '3' ||
    statusStr === 'rejected' ||
    statusStr === 'reject' ||
    closeStatusStr === '-1' ||
    closeStatusStr === '2' ||
    closeStatusStr === 'rejected' ||
    closeStatusStr === 'reject' ||
    approvalStatusStr === 'rejected' ||
    approvalStatusStr === 'reject' ||
    approvalStatusStr === '2' ||
    rejectStatusStr === '1' ||
    rejectStatusStr === 'true' ||
    rejectStatusStr === 'rejected' ||
    (remarksStr.length > 0 && (remarksStr.includes('reject') || statusStr === '2'))
  );
};

type TabKey = 'open' | 'approved' | 'closed';

export function Bihar_Complaint_SRT_AssignedComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedData, setAssignedData] = useState<AssignedComplaintsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<BiharComplaintItem | null>(null);

  // ── Resolve / Close Complaint Modal State ──
  const [resolvingItem, setResolvingItem] = useState<BiharComplaintItem | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rMobile, setRMobile] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>('Yes');
  const [rFile, setRFile] = useState<File | null>(null);
  const [rFile2, setRFile2] = useState<File | null>(null);
  const [rFile3, setRFile3] = useState<File | null>(null);
  const [rFile4, setRFile4] = useState<File | null>(null);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const openResolveModal = (item: BiharComplaintItem) => {
    setResolvingItem(item);
    setResolveError(null);
    setResolvedBy(assignedData?.name || (assignedData as any)?.vendor?.name || 'App Testing');
    setContactPerson(item.contact_person || item.site_name || item.beneficiary_name || '');
    setContactNumber(item.contact_number || item.contact_no || '');
    setREmail((assignedData as any)?.vendor?.email || '');
    setRMobile((assignedData as any)?.vendor?.contact || '');
    setClosingDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setCloseSms('Yes');
    setRFile(null);
    setRFile2(null);
    setRFile3(null);
    setRFile4(null);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    if (!resolvedBy.trim()) {
      setResolveError('Resolved By is required.');
      return;
    }
    if (!contactPerson.trim()) {
      setResolveError('Contact person is required.');
      return;
    }
    const cleanContact = contactNumber.trim().replace(/\D/g, '');
    if (cleanContact.length !== 10) {
      setResolveError('Contact number must be exactly 10 digits.');
      return;
    }
    if (!rEmail.trim() || !/\S+@\S+\.\S+/.test(rEmail)) {
      setResolveError('Please enter a valid resolver email address.');
      return;
    }
    const cleanMobile = rMobile.trim().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setResolveError('Resolver mobile must be exactly 10 digits.');
      return;
    }
    if (!closingDate) {
      setResolveError('Closing date is required.');
      return;
    }
    if (!remarks.trim()) {
      setResolveError('Remarks are required.');
      return;
    }

    setResolveSubmitting(true);
    setResolveError(null);

    try {
      const fd = new FormData();
      fd.append('srt_id', String(resolvingItem.id));
      fd.append('resolved_by', resolvedBy.trim());
      fd.append('contact_person', contactPerson.trim());
      fd.append('contact_number', cleanContact);
      fd.append('r_email', rEmail.trim());
      fd.append('r_mobile', cleanMobile);
      fd.append('manual_close_date', closingDate);
      fd.append('remarks', remarks.trim());
      fd.append('close_sms', closeSms);
      if (rFile) fd.append('r_file', rFile);
      if (rFile2) fd.append('r_file2', rFile2);
      if (rFile3) fd.append('r_file3', rFile3);
      if (rFile4) fd.append('r_file4', rFile4);

      const res = await biharComplaintService.closeUpdateSrtComplaint(fd);
      if (res.success) {
        setSuccessToast(res.message || 'Complaint Close Request Raised Successfully.');
        setResolvingItem(null);
        await loadData();
      } else {
        setResolveError(res.message || 'Failed to resolve SRT complaint.');
      }
    } catch (err: any) {
      setResolveError(err?.message || 'Error occurred while resolving complaint.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // API 10: GET /bihar/srt/complaint/assign
      const resp = await biharComplaintService.getAssignedSrtComplaints();
      setAssignedData(resp);
      if (resp.open && resp.open.length > 0) {
        setActiveTab('open');
      } else if (resp.approved && resp.approved.length > 0) {
        setActiveTab('approved');
      } else {
        setActiveTab('closed');
      }
    } catch (err) {
      console.error('Error loading SRT assigned complaints:', err);
      setErrorMsg('Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabItems = useMemo(() => {
    if (!assignedData) return [];
    if (activeTab === 'open') return assignedData.open || [];
    if (activeTab === 'approved') return assignedData.approved || [];
    return assignedData.data || [];
  }, [assignedData, activeTab]);

  const districts = useMemo(() => {
    if (!assignedData) return [];
    const all = [...(assignedData.open || []), ...(assignedData.approved || []), ...(assignedData.data || [])];
    const s = new Set<string>();
    all.forEach((i) => {
      if (i.district) s.add(i.district);
    });
    return Array.from(s).sort();
  }, [assignedData]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return tabItems.filter((item) => {
      if (districtFilter !== 'all' && item.district !== districtFilter) return false;
      if (q) {
        const str = [
          item.complaint_id,
          item.site_name,
          item.dept_name,
          item.ca_no,
          item.wo_no,
          item.district,
          item.discom,
          item.location,
          item.complaint,
          item.firm_name,
        ]
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [tabItems, districtFilter, deferredQuery]);

  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Counts from API response #10
  const totalCount = assignedData?.total_complaint ?? 0;
  const openCount = assignedData?.open_complaint ?? 0;
  const approvedCount = assignedData?.approved_complaint ?? 0;
  const closedCount = assignedData?.close_complaint ?? 0;

  const exportCols: ExportColumn<BiharComplaintItem>[] = [
    { header: 'Complaint ID', accessor: 'complaint_id' },
    { header: 'Complaint Date', accessor: 'start_date' },
    { header: 'Complaint', accessor: 'complaint' },
    { header: 'State', accessor: 'state' },
    { header: 'Discom', accessor: 'discom' },
    { header: 'District', accessor: 'district' },
    { header: 'Dept Name', accessor: 'dept_name' },
    { header: 'Site Name', accessor: 'site_name' },
    { header: 'Location', accessor: 'location' },
    { header: 'Firm Name', accessor: 'firm_name' },
    { header: 'CA No', accessor: 'ca_no' },
    { header: 'Sanction Load', accessor: 'sanction_load' },
    { header: 'Plant SC', accessor: 'plant_sc' },
    { header: 'WO No', accessor: 'wo_no' },
    { header: 'Phase', accessor: 'phase' },
    { header: '', accessor: 'assigned_vendor_name' },
    { header: 'Status', accessor: (r) => (r.close_status === 1 ? 'Closed' : 'Open') },
  ];

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV(`Bihar_SRT_Assigned_${activeTab}`, filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel(`Bihar_SRT_Assigned_${activeTab}`, filtered, exportCols);
  const handleExportPDF = () => printTableData(`Bihar SRT Assigned Complaints (${activeTab})`, filtered, exportCols);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'open', label: 'Open', count: openCount },
    { key: 'approved', label: 'Pending Approval', count: approvedCount },
    { key: 'closed', label: 'Closed', count: closedCount },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="Assigned Complaints"
        subtitle="Manage and inspect all Solar Rooftop breakdown complaints assigned to vendor in Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT', href: '/v/complaint/bihar/srt-view-complaint' },
          { label: 'Assigned Complaints' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={loadData} title="Refresh list">
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

      {successToast && (
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
          <span>✓ {successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
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
          <span>⚠ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
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
          <KpiCard icon={ICON_TOTAL} bg="rgba(37, 99, 235, 0.12)" fg={BLUE_PRIMARY} label="Total Complaints" value={num(totalCount)} sub="Total assigned tickets" />
          <KpiCard icon={ICON_ALERT} bg="rgba(245, 158, 11, 0.14)" fg={AMBER_WARNING} label="Open Complaints" value={num(openCount)} sub="Awaiting vendor dispatch" />
          <KpiCard icon={ICON_CLOCK} bg="rgba(6, 182, 212, 0.14)" fg={CYAN_INFO} label="Pending Approval" value={num(approvedCount)} sub="Resolution under review" />
          <KpiCard icon={ICON_CHECK} bg="rgba(16, 185, 129, 0.14)" fg={GREEN_EMERALD} label="Resolved Complaints" value={num(closedCount)} sub="Completed & verified" />
        </div>
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <style>{`
          .assigned-complaints-header {
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
          .assigned-complaints-header .ax-export-toolbar {
            width: auto !important;
            margin-left: 0 !important;
            flex: 0 0 auto !important;
            gap: 6px !important;
          }
          .assigned-complaints-header .ax-search-input {
            margin-left: 0 !important;
          }
        `}</style>

        <div className="ax-card__header assigned-complaints-header">
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`ax-btn ax-btn--sm ${activeTab === t.key ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => {
                  setActiveTab(t.key);
                  pagination.setPage(1);
                }}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* District Filter + Search + Export in ONE line */}
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
              placeholder="Search complaint, site, CA no, WO no…"
              style={{ width: 260, maxWidth: 260, flex: '0 0 260px', marginLeft: 0 }}
            />

            <TableExportToolbar onCopy={handleCopy} onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={20} rows={8} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 2200 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ ...TH, width: 50 }}>Sr. No.</th>
                  <th style={TH}>Complaint ID</th>
                  <th style={TH}>Complaint Date</th>
                  <th style={{ ...TH, minWidth: 220 }}>Complaint</th>
                  <th style={TH}>State</th>
                  <th style={TH}>Discom</th>
                  <th style={TH}>District</th>
                  <th style={TH}>Dept Name</th>
                  <th style={TH}>Site Name</th>
                  <th style={{ ...TH, minWidth: 160 }}>Location</th>
                  <th style={TH}>Firm Name</th>
                  <th style={TH}>CA No</th>
                  <th style={TH}>Sanction Load</th>
                  <th style={TH}>Plant SC</th>
                  <th style={TH}>WO No</th>
                  <th style={TH}>Phase</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Document</th>
                  <th style={TH}>Assign Complaint</th>
                  <th style={{ ...TH, textAlign: 'center', minWidth: 130 }}>Approval Status</th>
                  <th style={{ ...TH, textAlign: 'center', minWidth: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={20} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Assigned Complaints Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'There are currently no assigned tickets in this category.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((item, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const fileUrl = item.file ? getMediaUrl(item.file) : '';
                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ ...TD, fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                        <td style={{ ...TD, fontWeight: 700, color: BLUE_PRIMARY }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => setSelectedItem(item)}
                            style={{ fontWeight: 700, color: BLUE_PRIMARY }}
                          >
                            #{item.complaint_id}
                          </button>
                        </td>
                        <td style={{ ...TD, fontSize: 12.5 }}>{item.start_date || '—'}</td>
                        <td
                          style={{ ...TD, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={item.complaint}
                        >
                          {item.complaint || '—'}
                        </td>
                        <td style={TD}>{item.state || 'Bihar'}</td>
                        <td style={TD}>{item.discom || '—'}</td>
                        <td style={{ ...TD, fontWeight: 600 }}>{item.district || '—'}</td>
                        <td style={TD}>{item.dept_name || '—'}</td>
                        <td style={{ ...TD, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{item.site_name || '—'}</td>
                        <td
                          style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={item.location}
                        >
                          {item.location || '—'}
                        </td>
                        <td style={TD}>{item.firm_name || '—'}</td>
                        <td style={TD}>{item.ca_no || '—'}</td>
                        <td style={TD}>{item.sanction_load || '—'}</td>
                        <td style={TD}>{item.plant_sc || '—'}</td>
                        <td style={{ ...TD, fontSize: 12.5 }}>{item.wo_no || '—'}</td>
                        <td style={TD}>{item.phase || '—'}</td>
                        <td style={{ ...TD, textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: BLUE_PRIMARY }}
                              title="View Document"
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>View</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={TD}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: BLUE_PRIMARY,
                            }}
                          >
                            {item.assigned_vendor_name || '—'}
                          </span>
                        </td>
                        {/* Approval Status Column */}
                        <td style={{ ...TD, textAlign: 'center' }}>
                          {isItemRejected(item) ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                              }}
                              title={(item as any).reject_reason || (item as any).reject_remarks || 'Complaint rejected from main portal'}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b91c1c' }} />
                              Rejected
                            </span>
                          ) : activeTab === 'approved' || (item.status === 1 && item.close_status !== 1) ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#ecfeff',
                                color: '#0891b2',
                                border: '1px solid #a5f3fc',
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0891b2' }} />
                              Pending
                            </span>
                          ) : activeTab === 'closed' || item.close_status === 1 ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#047857' }} />
                              Approved
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b45309' }} />
                              Open
                            </span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td style={{ ...TD, textAlign: 'center' }}>
                          {activeTab === 'approved' || isItemRejected(item) ? (
                            /* Pending Approval / Rejected: Edit button to fix and View button */
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => navigate(`/v/complaint/bihar/srt-add-complaint?edit=${item.id}`)}
                                title="Edit Complaint"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                onClick={() => setSelectedItem(item)}
                                title="View Details"
                              >
                                View
                              </button>
                            </div>
                          ) : activeTab === 'closed' ? (
                            /* Closed: View button */
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => setSelectedItem(item)}
                                title="View Complaint Details"
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            /* Open: View and Resolve buttons */
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => setSelectedItem(item)}
                                title="View Complaint Details"
                              >
                                View
                              </button>
                              {item.close_status !== 1 && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderColor: '#059669',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                  }}
                                  onClick={() => openResolveModal(item)}
                                  title="Resolve this complaint"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
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

      {/* ── View Detail Modal ── */}
      {selectedItem && (
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
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 760,
              maxHeight: '90vh',
              overflowY: 'auto',
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
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Assigned Complaint #{selectedItem.complaint_id}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Vendor: {selectedItem.assigned_vendor_name || '—'} | Date: {selectedItem.start_date || '—'}
                </div>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSelectedItem(null)}>
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px 24px' }}>
              <div className="ax-dash-grid">
                <Field label="Site Name" span={6}>{selectedItem.site_name || '—'}</Field>
                <Field label="Department" span={6}>{selectedItem.dept_name || '—'}</Field>
                <Field label="District / Discom" span={4}>
                  {selectedItem.district || '—'} ({selectedItem.discom || '—'})
                </Field>
                <Field label="CA Number" span={4}>{selectedItem.ca_no || '—'}</Field>
                <Field label="Sanction Load" span={4}>{selectedItem.sanction_load || '—'}</Field>
                <Field label="Plant SC" span={4}>{selectedItem.plant_sc || '—'}</Field>
                <Field label="Work Order No" span={4}>{selectedItem.wo_no || '—'}</Field>
                <Field label="Phase" span={4}>{selectedItem.phase || '—'}</Field>
                <Field label="Location / Campus" span={12}>{selectedItem.location || selectedItem.address || '—'}</Field>

                {isItemRejected(selectedItem) && (
                  <div className="ax-col--12">
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13 }}>
                      <strong>Complaint Rejected by Main Portal</strong>
                      {((selectedItem as any).reject_reason || (selectedItem as any).reject_remarks) && (
                        <div style={{ marginTop: 4 }}>Reason: {(selectedItem as any).reject_reason || (selectedItem as any).reject_remarks}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="ax-col--12">
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Complaint Description
                  </div>
                  <div
                    style={{
                      background: 'var(--ax-surface-subtle, #f8fafc)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--ax-border, #e2e8f0)',
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    {selectedItem.complaint || '—'}
                  </div>
                </div>

                {selectedItem.close_status === 1 && (
                  <div className="ax-col--12">
                    <div className="ax-alert ax-alert--success">
                      <strong>Resolution Log:</strong>
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        Resolved by: {selectedItem.resolved_by || '—'} | Date: {selectedItem.close_date || '—'}
                      </div>
                      {selectedItem.remarks && <div style={{ marginTop: 4, fontSize: 13 }}>Remarks: {selectedItem.remarks}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="ax-modal__footer"
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                {isItemRejected(selectedItem) ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    onClick={() => {
                      const id = selectedItem.id;
                      setSelectedItem(null);
                      navigate(`/v/complaint/bihar/srt-add-complaint?edit=${id}`);
                    }}
                  >
                    Edit & Fix Complaint
                  </button>
                ) : activeTab === 'open' && selectedItem.close_status !== 1 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderColor: '#059669',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      openResolveModal(item);
                    }}
                  >
                    Resolve This Complaint
                  </button>
                )}
              </div>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Vendor Close / Resolve Complaint Modal ── */}
      {resolvingItem && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => !resolveSubmitting && setResolvingItem(null)}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 780,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--ax-surface-subtle, #f8fafc)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#059669',
                    letterSpacing: '0.05em',
                  }}
                >
                  Vendor Close Complaints
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Resolve Complaint #{resolvingItem.complaint_id}
                </h4>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setResolvingItem(null)}
                disabled={resolveSubmitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div className="ax-modal__body" style={{ padding: '20px 24px' }}>
                {resolveError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      marginBottom: 16,
                      borderRadius: 8,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    ⚠ {resolveError}
                  </div>
                )}

                {/* ── Read-only Complaint Overview Card ── */}
                <div
                  style={{
                    background: 'var(--ax-surface-subtle, #f8fafc)',
                    border: '1px solid var(--ax-border, #e2e8f0)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', marginBottom: 8 }}>
                    Complaint Information
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px 16px',
                      fontSize: 12.5,
                    }}
                  >
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>State:</span> <b>{resolvingItem.state || 'bihar'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{resolvingItem.district || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Discom:</span> <b>{resolvingItem.discom || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Dept Name:</span> <b>{resolvingItem.dept_name || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Site Name:</span> <b>{resolvingItem.site_name || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Location:</span> <b>{resolvingItem.location || resolvingItem.address || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>CA No:</span> <b>{resolvingItem.ca_no || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanction Load:</span> <b>{resolvingItem.sanction_load || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Plant SC:</span> <b>{resolvingItem.plant_sc || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>WO No:</span> <b>{resolvingItem.wo_no || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Phase:</span> <b>{resolvingItem.phase || '—'}</b></div>
                    <div><span style={{ color: 'var(--ax-text-muted)' }}>Complaint Date:</span> <b>{resolvingItem.start_date || '—'}</b></div>
                  </div>
                </div>

                {/* ── Resolution Inputs Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px 16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Resolved By <span style={{ color: '#ef4444' }}>*</span> (Locked)
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={resolvedBy}
                      readOnly
                      disabled
                      style={{
                        background: 'var(--ax-surface-subtle, #f1f5f9)',
                        color: 'var(--ax-text-muted, #64748b)',
                        cursor: 'not-allowed',
                      }}
                      placeholder="e.g. App Testing"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Contact Person / Incharge <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Contact Number (10 Digits) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className="ax-input"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Resolver Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="ax-input"
                      value={rEmail}
                      onChange={(e) => setREmail(e.target.value)}
                      placeholder="e.g. resolver@gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Resolver Mobile (10 Digits) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className="ax-input"
                      value={rMobile}
                      onChange={(e) => setRMobile(e.target.value)}
                      placeholder="e.g. 9454969296"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Closing Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="ax-input"
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Proof Image 1 (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="ax-input"
                      style={{ fontSize: 12 }}
                      onChange={(e) => setRFile(e.target.files?.[0] || null)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Max 5 MB (JPG, PNG, WebP, PDF)</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Proof Image 2 (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="ax-input"
                      style={{ fontSize: 12 }}
                      onChange={(e) => setRFile2(e.target.files?.[0] || null)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Max 5 MB (JPG, PNG, WebP, PDF)</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Proof Image 3 (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="ax-input"
                      style={{ fontSize: 12 }}
                      onChange={(e) => setRFile3(e.target.files?.[0] || null)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Max 5 MB (JPG, PNG, WebP, PDF)</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Proof Image 4 / Test Sheet (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="ax-input"
                      style={{ fontSize: 12 }}
                      onChange={(e) => setRFile4(e.target.files?.[0] || null)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Max 5 MB (JPG, PNG, WebP, PDF)</span>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Remarks <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      className="ax-input"
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter resolution notes and actions taken..."
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Send SMS Notification <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'inline-flex', gap: 16, alignItems: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="radio"
                          name="close_sms"
                          value="Yes"
                          checked={closeSms === 'Yes'}
                          onChange={() => setCloseSms('Yes')}
                        />
                        <span>Yes</span>
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="radio"
                          name="close_sms"
                          value="No"
                          checked={closeSms === 'No'}
                          onChange={() => setCloseSms('No')}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="ax-modal__footer"
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--ax-border, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                }}
              >
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setResolvingItem(null)}
                  disabled={resolveSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={resolveSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#059669',
                    minWidth: 160,
                  }}
                >
                  {resolveSubmitting ? 'Resolving…' : 'Confirm & Resolve Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Complaint_SRT_AssignedComplaint;
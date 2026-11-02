import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upComplaintService,
  getMediaUrl,
  type UpSslComplaintItem,
  type UpAssignedDataResponse,
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

type KpiTone = 'accent' | 'amber' | 'cyan' | 'emerald';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
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
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
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
    cursor: pointer;
    color: var(--ax-text-muted, #64748b);
    transition: all 0.15s ease;
  }
  .up-tab-btn.is-active {
    background: var(--ax-surface-solid, #ffffff);
    color: var(--ax-accent, #2563eb);
    border-color: var(--ax-border, #cbd5e1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
`;

const X_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="6" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  children,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  maxWidth?: number;
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

  if (!open) return null;

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
        aria-labelledby={labelledBy}
        className="ax-modal"
        style={{
          backgroundColor: 'var(--ax-surface-solid, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: `${maxWidth}px`,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--ax-border, #e2e8f0)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

type TabKey = 'open' | 'approved' | 'closed';

export function UP_Complaint_SSL_AssignedComplaint() {
  const [data, setData] = useState<UpAssignedDataResponse<UpSslComplaintItem>>({
    open: [],
    approved: [],
    close: [],
    total_complaint: 0,
    open_complaint: 0,
    approved_complaint: 0,
    close_complaint: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [search, setSearch] = useState('');

  // Pagination
  const [curPage, setCurPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [detailItem, setDetailItem] = useState<UpSslComplaintItem | null>(null);
  const [closeTarget, setCloseTarget] = useState<UpSslComplaintItem | null>(null);
  const [previewImg, setPreviewImg] = useState<{ src: string; title: string } | null>(null);

  // Close form state
  const [closeForm, setCloseForm] = useState({
    resolved_by: '',
    r_email: '',
    r_mobile: '',
    manual_close_date: new Date().toISOString().split('T')[0],
    remarks: '',
    close_sms: 'Yes',
  });
  const [rFile, setRFile] = useState<File | null>(null);
  const [rFile1, setRFile1] = useState<File | null>(null);
  const [closeErrors, setCloseErrors] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const rFileRef = useRef<HTMLInputElement>(null);
  const rFile1Ref = useRef<HTMLInputElement>(null);

  const loadAssigned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upComplaintService.getSslAssignedComplaints();
      setData(res);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    if (activeTab === 'approved') return data.approved;
    if (activeTab === 'closed') return data.close;
    return data.open;
  }, [data, activeTab]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((r) => {
      return (
        String(r.complaint_id || '').toLowerCase().includes(q) ||
        String(r.beneficiary_name || '').toLowerCase().includes(q) ||
        String(r.district || '').toLowerCase().includes(q) ||
        String(r.block || '').toLowerCase().includes(q) ||
        String(r.panchayat || '').toLowerCase().includes(q) ||
        String(r.contact_no || '').toLowerCase().includes(q) ||
        String(r.uid_no || '').toLowerCase().includes(q) ||
        String(r.complaint || '').toLowerCase().includes(q) ||
        String(r.complaint_issue || r.issue || '').toLowerCase().includes(q)
      );
    });
  }, [currentList, search]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (curPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, curPage, pageSize]);

  // Handle open close modal
  const handleOpenCloseModal = (item: UpSslComplaintItem) => {
    setCloseTarget(item);
    setCloseForm({
      resolved_by: '',
      r_email: '',
      r_mobile: '',
      manual_close_date: new Date().toISOString().split('T')[0],
      remarks: '',
      close_sms: 'Yes',
    });
    setRFile(null);
    setRFile1(null);
    setCloseErrors({});
  };

  // Submit Close complaint
  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeTarget) return;

    const errs: Record<string, string> = {};
    if (!closeForm.resolved_by.trim()) errs.resolved_by = 'Resolved By name is required';
    if (!closeForm.r_email.trim()) {
      errs.r_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(closeForm.r_email)) {
      errs.r_email = 'Enter a valid email';
    }
    if (!closeForm.r_mobile.trim()) {
      errs.r_mobile = 'Mobile is required';
    } else if (!/^\d{10}$/.test(closeForm.r_mobile.trim())) {
      errs.r_mobile = 'Must be exactly 10 digits';
    }
    if (!closeForm.manual_close_date) errs.manual_close_date = 'Close date is required';
    if (!closeForm.remarks.trim()) errs.remarks = 'Resolution remarks are required';
    if (!rFile) errs.r_file = 'Resolution Photo is required';

    if (Object.keys(errs).length > 0) {
      setCloseErrors(errs);
      return;
    }

    setClosing(true);
    try {
      const fd = new FormData();
      fd.append('complain_id', String(closeTarget.id));
      fd.append('resolved_by', closeForm.resolved_by.trim());
      fd.append('r_email', closeForm.r_email.trim());
      fd.append('r_mobile', closeForm.r_mobile.trim());
      fd.append('manual_close_date', closeForm.manual_close_date);
      fd.append('remarks', closeForm.remarks.trim());
      fd.append('close_sms', closeForm.close_sms);
      if (closeTarget.beneficiary_name) fd.append('beneficiary_name', closeTarget.beneficiary_name);
      if (closeTarget.contact_no) fd.append('contact_no', String(closeTarget.contact_no));
      if (rFile) fd.append('r_file', rFile);
      if (rFile1) fd.append('r_file1', rFile1);

      const res = await upComplaintService.closeSslComplaint(fd);
      if (res.status) {
        setAlertMsg({ type: 'success', text: res.message || 'SSL Complaint closed successfully!' });
        setCloseTarget(null);
        loadAssigned();
      } else {
        setAlertMsg({ type: 'danger', text: res.message || 'Failed to close SSL complaint.' });
        if (res.errors) {
          const map: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            map[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setCloseErrors(map);
        }
      }
    } catch (err: any) {
      setAlertMsg({ type: 'danger', text: err?.message || 'Error occurred while closing complaint.' });
    } finally {
      setClosing(false);
    }
  };

  // Export Columns (matches 25 data columns)
  const exportCols: ExportColumn<UpSslComplaintItem>[] = useMemo(
    () => [
      { header: 'Complaint ID', accessor: (r: UpSslComplaintItem) => r.complaint_id || `CMP-${r.id}` },
      { header: 'Complaint Date', accessor: (r: UpSslComplaintItem) => r.complaint_date || DASH },
      { header: 'Complaint Issue', accessor: (r: UpSslComplaintItem) => r.complaint_issue || r.issue || DASH },
      { header: 'Complaint', accessor: (r: UpSslComplaintItem) => r.complaint || DASH },
      { header: 'Complaint Source', accessor: (r: UpSslComplaintItem) => r.complaint_source || DASH },
      { header: 'State', accessor: (r: UpSslComplaintItem) => r.state || 'Uttar Pradesh' },
      { header: 'District', accessor: (r: UpSslComplaintItem) => r.district || DASH },
      { header: 'Block', accessor: (r: UpSslComplaintItem) => r.block || DASH },
      { header: 'Panchayat', accessor: (r: UpSslComplaintItem) => r.panchayat || DASH },
      { header: 'Phase', accessor: (r: UpSslComplaintItem) => r.phase || DASH },
      { header: 'Address', accessor: (r: UpSslComplaintItem) => r.address || DASH },
      { header: 'Ward No', accessor: (r: UpSslComplaintItem) => r.ward_no || DASH },
      { header: 'Pole No', accessor: (r: UpSslComplaintItem) => r.pole_no || DASH },
      { header: 'Light No', accessor: (r: UpSslComplaintItem) => r.light_no || DASH },
      { header: 'Beneficiary Name', accessor: (r: UpSslComplaintItem) => r.beneficiary_name || DASH },
      { header: 'Contact No', accessor: (r: UpSslComplaintItem) => r.contact_no || DASH },
      { header: 'Latitude', accessor: (r: UpSslComplaintItem) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r: UpSslComplaintItem) => r.longitude || DASH },
      { header: 'Along with Pole', accessor: (r: UpSslComplaintItem) => r.along_with_pole || DASH },
      { header: 'Luminary No', accessor: (r: UpSslComplaintItem) => r.luminary_no || DASH },
      { header: 'SIM No', accessor: (r: UpSslComplaintItem) => r.sim_no || DASH },
      { header: 'Battery Serial No', accessor: (r: UpSslComplaintItem) => r.battery_serial_no || DASH },
      { header: 'Module No', accessor: (r: UpSslComplaintItem) => r.module_no || DASH },
      { header: 'Date of Installation', accessor: (r: UpSslComplaintItem) => r.date_of_installation || r.installation_date || DASH },
      { header: 'Document', accessor: (r: UpSslComplaintItem) => r.document || r.file || DASH },
    ],
    []
  );

  const fileBase = `UP_SSL_Assigned_${activeTab}_Complaints`;
  const fileTitle = `UP SSL Assigned Complaints (${activeTab.toUpperCase()})`;

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View UP Vendor SSL Complaints"
        subtitle="Manage assigned solar street light complaints and submit repair closures"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL Complaints' },
        ]}
      />

      {alertMsg && (
        <div className={`ax-alert ax-alert--${alertMsg.type}`} style={{ marginBottom: 20 }}>
          <div className="ax-alert__content">{alertMsg.text}</div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="ax-dash-grid" style={{ marginBottom: 20 }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              tone="accent"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
              label="Total Complaints"
              value={data.total_complaint}
              sub="Assigned street lights"
            />
            <KpiCard
              tone="amber"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              label="Open Complaints"
              value={data.open_complaint}
              sub="Lights requiring service"
            />
            <KpiCard
              tone="cyan"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              label="Pending Approval"
              value={data.approved_complaint}
              sub="Submitted repair verification"
            />
            <KpiCard
              tone="emerald"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
              label="Resolved Complaints"
              value={data.close_complaint}
              sub="Successfully verified & resolved"
            />
          </>
        )}
      </div>

      {/* Main Card with Bifurcation Tabs */}
      <section className="ax-card ax-col--12">
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
              Report Bifurcation Details
            </h4>
            <div style={{ display: 'inline-flex', background: 'var(--ax-surface-subtle, #f1f5f9)', padding: 4, borderRadius: 10, marginTop: 8, gap: 4 }}>
              <button
                type="button"
                className={`up-tab-btn ${activeTab === 'open' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('open');
                  setCurPage(1);
                }}
              >
                Open ({data.open_complaint})
              </button>
              <button
                type="button"
                className={`up-tab-btn ${activeTab === 'approved' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('approved');
                  setCurPage(1);
                }}
              >
                Approved ({data.approved_complaint})
              </button>
              <button
                type="button"
                className={`up-tab-btn ${activeTab === 'closed' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('closed');
                  setCurPage(1);
                }}
              >
                Closed ({data.close_complaint})
              </button>
            </div>
          </div>

          <TableExportToolbar
            onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
            onExportCSV={() => exportDataToCSV(fileBase, filtered, exportCols)}
            onExportExcel={() => exportDataToExcel(fileBase, filtered, exportCols)}
            onExportPDF={() => printTableData(fileTitle, filtered, exportCols)}
          />
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setCurPage(1);
            }}
            placeholder="Search beneficiary, pole, UID..."
          />

          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={loadAssigned}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* 27-Column Table */}
        <div className="ax-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
          <table className="ax-table ax-table--striped ax-table--hover" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sr. no.</th>
                <th>Complaint ID</th>
                <th>Complaint Date</th>
                <th>Complaint Issue</th>
                <th>Complaint</th>
                <th>Complaint Source</th>
                <th>State</th>
                <th>District</th>
                <th>Block</th>
                <th>Panchayat</th>
                <th>Phase</th>
                <th>Address</th>
                <th>Ward No</th>
                <th>Pole No</th>
                <th>Light No</th>
                <th>Beneficiary Name</th>
                <th>Contact No</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Along with Pole</th>
                <th>Luminary No</th>
                <th>SIM No</th>
                <th>Battery Serial No</th>
                <th>Module No</th>
                <th>Date of Installation</th>
                <th>Document</th>
                <th style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle)' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={27} style={{ textAlign: 'center', padding: '36px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" /> Loading assigned complaints...
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={27}>
                    <TableEmptyState
                      title="No data available in table"
                      message={`No ${activeTab} SSL complaints found.`}
                    />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const serialNo = (curPage - 1) * pageSize + idx + 1;
                  const docPath = r.document || r.file;
                  const docUrl = docPath ? getMediaUrl(docPath) : '';
                  const canClose = activeTab !== 'closed';

                  return (
                    <tr key={r.id || idx}>
                      <td>{serialNo}</td>
                      <td>
                        <strong style={{ color: 'var(--ax-accent, #2563eb)' }}>
                          {r.complaint_id || `CMP-${r.id}`}
                        </strong>
                      </td>
                      <td>{r.complaint_date || DASH}</td>
                      <td>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral">
                          {r.complaint_issue || r.issue || DASH}
                        </span>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.complaint || ''}>
                        {r.complaint || DASH}
                      </td>
                      <td>{r.complaint_source || DASH}</td>
                      <td>{r.state || 'Uttar Pradesh'}</td>
                      <td>{r.district || DASH}</td>
                      <td>{r.block || DASH}</td>
                      <td>{r.panchayat || DASH}</td>
                      <td>{r.phase || DASH}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.address || ''}>
                        {r.address || DASH}
                      </td>
                      <td>{r.ward_no || DASH}</td>
                      <td>{r.pole_no || DASH}</td>
                      <td>{r.light_no || DASH}</td>
                      <td><strong>{r.beneficiary_name || DASH}</strong></td>
                      <td>{r.contact_no || DASH}</td>
                      <td>{r.latitude || DASH}</td>
                      <td>{r.longitude || DASH}</td>
                      <td>{r.along_with_pole || DASH}</td>
                      <td>{r.luminary_no || DASH}</td>
                      <td>{r.sim_no || DASH}</td>
                      <td>{r.battery_serial_no || DASH}</td>
                      <td>{r.module_no || DASH}</td>
                      <td>{r.date_of_installation || r.installation_date || DASH}</td>
                      <td>
                        {docUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImg({ src: docUrl, title: `Complaint ${r.complaint_id || r.id} Document` })}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <img
                              src={docUrl}
                              alt="Document"
                              style={{ width: 34, height: 34, objectFit: 'cover', border: '1px solid var(--ax-border)', borderRadius: 0 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-solid)' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setDetailItem(r)}
                          >
                            View
                          </button>
                          {canClose && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              onClick={() => handleOpenCloseModal(r)}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)' }}>
          <div className="ula-pagination-left">
            <Pagination
              curPage={curPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ──────────────── Close SSL Complaint Modal ──────────────── */}
      <Modal open={!!closeTarget} onClose={() => !closing && setCloseTarget(null)} labelledBy="close-ssl-title" maxWidth={650}>
        {closeTarget && (
          <form onSubmit={handleCloseSubmit}>
            <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="ax-modal__title" id="close-ssl-title" style={{ margin: 0, fontSize: 16 }}>
                Resolve & Close SSL Complaint — {closeTarget.complaint_id || `CMP-${closeTarget.id}`}
              </h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => !closing && setCloseTarget(null)}
                disabled={closing}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ background: 'var(--ax-surface-subtle)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div><strong>Beneficiary:</strong> {closeTarget.beneficiary_name} | <strong>Panchayat:</strong> {closeTarget.panchayat}</div>
                <div style={{ marginTop: 4, color: 'var(--ax-text-muted)' }}>{closeTarget.complaint}</div>
              </div>

              {/* Resolved By */}
              <div>
                <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolved By *</label>
                <input
                  type="text"
                  className={`ax-form-control ${closeErrors.resolved_by ? 'is-invalid' : ''}`}
                  placeholder="Technician / Electrician name"
                  value={closeForm.resolved_by}
                  onChange={(e) => setCloseForm((p) => ({ ...p, resolved_by: e.target.value }))}
                />
                {closeErrors.resolved_by && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.resolved_by}</span>}
              </div>

              {/* Resolver Email & Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolver Email *</label>
                  <input
                    type="email"
                    className={`ax-form-control ${closeErrors.r_email ? 'is-invalid' : ''}`}
                    placeholder="technician@example.com"
                    value={closeForm.r_email}
                    onChange={(e) => setCloseForm((p) => ({ ...p, r_email: e.target.value }))}
                  />
                  {closeErrors.r_email && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.r_email}</span>}
                </div>
                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolver Mobile *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    className={`ax-form-control ${closeErrors.r_mobile ? 'is-invalid' : ''}`}
                    placeholder="10 digit mobile"
                    value={closeForm.r_mobile}
                    onChange={(e) => setCloseForm((p) => ({ ...p, r_mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  />
                  {closeErrors.r_mobile && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.r_mobile}</span>}
                </div>
              </div>

              {/* Close Date & Send SMS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Manual Close Date *</label>
                  <input
                    type="date"
                    className={`ax-form-control ${closeErrors.manual_close_date ? 'is-invalid' : ''}`}
                    value={closeForm.manual_close_date}
                    onChange={(e) => setCloseForm((p) => ({ ...p, manual_close_date: e.target.value }))}
                  />
                  {closeErrors.manual_close_date && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.manual_close_date}</span>}
                </div>
                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Close SMS</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_ssl_sms"
                        value="Yes"
                        checked={closeForm.close_sms === 'Yes'}
                        onChange={(e) => setCloseForm((p) => ({ ...p, close_sms: e.target.value }))}
                      />
                      <span>Yes</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        name="close_ssl_sms"
                        value="No"
                        checked={closeForm.close_sms === 'No'}
                        onChange={(e) => setCloseForm((p) => ({ ...p, close_sms: e.target.value }))}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Resolution File Uploads */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolved Light Photo *</label>
                  <input
                    type="file"
                    ref={rFileRef}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && setRFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={() => rFileRef.current?.click()}
                  >
                    {rFile ? rFile.name : 'Choose Photo *'}
                  </button>
                  {closeErrors.r_file && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.r_file}</span>}
                </div>

                <div>
                  <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolution Document 2</label>
                  <input
                    type="file"
                    ref={rFile1Ref}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && setRFile1(e.target.files[0])}
                  />
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={() => rFile1Ref.current?.click()}
                  >
                    {rFile1 ? rFile1.name : 'Choose File 2'}
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="ax-form-label" style={{ fontSize: 12, fontWeight: 600 }}>Resolution Remarks *</label>
                <textarea
                  rows={3}
                  className={`ax-form-control ${closeErrors.remarks ? 'is-invalid' : ''}`}
                  placeholder="Detail repairs made (e.g., replaced luminary, rewired connector, battery replaced)"
                  value={closeForm.remarks}
                  onChange={(e) => setCloseForm((p) => ({ ...p, remarks: e.target.value }))}
                />
                {closeErrors.remarks && <span style={{ color: '#ef4444', fontSize: 11 }}>{closeErrors.remarks}</span>}
              </div>
            </div>

            <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setCloseTarget(null)}
                disabled={closing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--sm"
                disabled={closing}
              >
                {closing ? 'Closing SSL Complaint...' : 'Confirm & Close Complaint'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ──────────────── Details Modal ──────────────── */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="ssl-assigned-detail-title" maxWidth={720}>
        {detailItem && (
          <div>
            <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="ax-modal__title" id="ssl-assigned-detail-title" style={{ margin: 0, fontSize: 16 }}>
                Assigned SSL Complaint — {detailItem.complaint_id || `CMP-${detailItem.id}`}
              </h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 20px', fontSize: 13 }}>
                <div><strong>Beneficiary:</strong> {detailItem.beneficiary_name || DASH}</div>
                <div><strong>Contact No:</strong> {detailItem.contact_no || DASH}</div>
                <div><strong>District:</strong> {detailItem.district || DASH}</div>
                <div><strong>Block:</strong> {detailItem.block || DASH}</div>
                <div><strong>Panchayat:</strong> {detailItem.panchayat || DASH}</div>
                <div><strong>Ward No:</strong> {detailItem.ward_no || DASH}</div>
                <div><strong>Address:</strong> {detailItem.address || DASH}</div>
                <div><strong>Phase:</strong> {detailItem.phase || DASH}</div>
                <div><strong>UID No:</strong> {detailItem.uid_no || DASH}</div>
                <div><strong>Pole No:</strong> {detailItem.pole_no || DASH}</div>
                <div><strong>Light No:</strong> {detailItem.light_no || DASH}</div>
                <div><strong>Luminary No:</strong> {detailItem.luminary_no || DASH}</div>
                <div><strong>SIM No:</strong> {detailItem.sim_no || DASH}</div>
                <div><strong>Battery Serial No:</strong> {detailItem.battery_serial_no || DASH}</div>
                <div><strong>Module No:</strong> {detailItem.module_no || DASH}</div>
                <div><strong>Installation Date:</strong> {detailItem.date_of_installation || detailItem.installation_date || DASH}</div>
                <div><strong>Complaint Date:</strong> {detailItem.complaint_date || DASH}</div>
                <div><strong>Complaint Issue:</strong> {detailItem.complaint_issue || detailItem.issue || DASH}</div>
                <div><strong>Complaint Source:</strong> {detailItem.complaint_source || DASH}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Complaint Description:</strong>
                  <div style={{ marginTop: 4, padding: 10, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                    {detailItem.complaint || 'No detailed description provided.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailItem(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── Image Preview Modal ──────────────── */}
      <Modal open={!!previewImg} onClose={() => setPreviewImg(null)} labelledBy="ssl-assigned-img-title" maxWidth={800}>
        {previewImg && (
          <div>
            <div className="ax-modal__header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="ax-modal__title" id="ssl-assigned-img-title" style={{ margin: 0, fontSize: 15 }}>
                {previewImg.title}
              </h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setPreviewImg(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 16, textAlign: 'center', background: '#000' }}>
              <img
                src={previewImg.src}
                alt={previewImg.title}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 0 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UP_Complaint_SSL_AssignedComplaint;

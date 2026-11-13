import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
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
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';
import { BIHAR_DISTRICTS, type BiharSSLAssignRecord } from '../../bihar-types';

type Row = BiharSSLAssignRecord;
type AssignState = 'accepted' | 'approved' | 'pending';
type FilterKey = 'all' | AssignState;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const parsePanchayat = (v: unknown): string => {
  if (!v) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    } catch {
      return s.replace(/[\[\]"']/g, '').trim();
    }
  }
  return String(v);
};

const assignState = (r: Row): AssignState => {
  const s = Number(r.status);
  return s === 2 ? 'accepted' : s === 1 ? 'approved' : 'pending';
};
const stateLabel = (s: AssignState) => (s === 'accepted' ? 'Accepted' : s === 'approved' ? 'Approved' : 'Pending');
const stateTone = (s: AssignState) => (s === 'accepted' ? 'success' : s === 'approved' ? 'info' : 'warning');

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return String(val).slice(0, 10);
};

/* ───────── Responsive page CSS (Exact Kashmir SRT 70MW Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Modal Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff; border-radius: 16px;
    border: 1px solid var(--ax-border, #e2e8f0); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--ax-text-muted, #64748b);
  }
  .ax-modal__body { padding: 0; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 14px 20px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc); display: flex; align-items: center; justify-content: space-between;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const ICONS = {
  doc: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>),
  check: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>),
  shield: svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  cross: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></>),
  coin: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M10 8c4 0 4 4 0 4l4 4" /></>),
};
type IconKey = keyof typeof ICONS;

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub?: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open, onClose, labelledBy, title, subtitle, children, footer, dialogStyle,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  dialogStyle?: CSSProperties;
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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={dialogStyle}>
        <div className="ax-modal__header">
          <div>
            <h2 className="ax-modal__title" id={labelledBy} style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const REFRESH_ICON = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'accepted', label: 'Accepted' },
];

export function BiharSSLInstallationViewAssignLight() {
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [kpis, setKpis] = useState({
    total_assigned: 0,
    complete: 0,
    pending: 0,
    approve: 0,
    reject: 0,
    verify_pending: 0,
    claim_applicable: 0,
    payment_done: 0,
  });

  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRecord, setSelectedRecord] = useState<Row | null>(null);
  const [selectedFilesRow, setSelectedFilesRow] = useState<Row | null>(null);
  const [previewFile, setPreviewFile] = useState<{ title: string; filename: string } | null>(null);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setErrorMsg('');
    biharAdminService
      .getViewAssignSsl()
      .then((res: any) => {
        const rawList =
          res?.data?.assignedsite ||
          res?.data?.assigned_site ||
          res?.data?.assignments ||
          res?.data?.assigned ||
          res?.data?.list ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);

        const list: Row[] = Array.isArray(rawList)
          ? rawList.map((r: any, idx: number) => {
              const vendorName =
                r.vendors?.name ||
                r.vendors?.company ||
                r.vendor_name ||
                (typeof r.vendor === 'string' && isNaN(Number(r.vendor)) ? r.vendor : '') ||
                (r.vendor ? `Vendor #${r.vendor}` : 'Vendor');

              const volVal = r.volume ? String(r.volume).trim() : '1';
              const volumeStr = volVal.toLowerCase().startsWith('volume') ? volVal : `Volume ${volVal}`;

              const stNum = typeof r.status === 'number'
                ? r.status
                : r.status === 'Accepted' || r.status === '2' ? 2
                : r.status === 'Approved' || r.status === '1' ? 1 : 0;

              return {
                id: Number(r.id || idx + 1),
                vendor: vendorName,
                vendor_id: r.vendors?.vendor_id || r.vendor || '',
                vendor_firm: r.vendors?.firm || r.vendors?.company || '',
                vendor_contact: r.vendors?.contact || '',
                company_id: r.company_id || '',
                state: r.state ? (String(r.state).charAt(0).toUpperCase() + String(r.state).slice(1).toLowerCase()) : 'Bihar',
                volume: volumeStr,
                district: r.district || '—',
                block: r.block || '—',
                panchayat: parsePanchayat(r.panchayat) || '—',
                ward_no: r.ward_no ? `Ward ${r.ward_no}` : (r.insp_code ? `Insp: ${r.insp_code}` : 'Ward —'),
                pole_no: r.pole_no || (r.insp_code ? String(r.insp_code) : '—'),
                assign_date: r.sdate || r.assign_date || r.created_at || '—',
                deadline_date: r.ldate || r.deadline_date || r.end_date || '—',
                site_count: Number(r.sitecount ?? r.site_count ?? r.light_count ?? 1),
                data_match: r.data_match || (r.match_material === 1 ? 'Match' : r.match_material === 0 ? 'Mismatch' : 'Match'),
                unique_id_file: r.uid_file || r.unique_id_file || null,
                battery_no_file: r.battery_no_file || null,
                sim_no_file: r.sim_no_file || null,
                panel_no_file: r.panel_no_file || null,
                imei_no_file: r.imei_no_file || null,
                remarks: r.remarks || r.remark || '—',
                status: (stNum === 2 ? 2 : stNum === 1 ? 1 : 0) as 0 | 1 | 2,
              };
            })
          : [];

        setRecords(list);

        const d = res?.data || {};
        const summary = d.summary || res?.summary || {};

        const total = Number(
          d.totalsite ??
          summary.total_assigned ??
          d.total_assigned ??
          list.reduce((acc, r) => acc + r.site_count, 0)
        );
        const comp = Number(
          d.complete ??
          summary.complete ??
          list.filter((r) => r.status === 2).length
        );
        const pend = Number(
          d.pendingsite ??
          d.pending ??
          summary.pending ??
          Math.max(0, total - comp)
        );
        const app = Number(
          d.approvedsite ??
          summary.approve ??
          d.approve ??
          list.filter((r) => r.status === 1).length
        );
        const rej = Number(
          d.rejectsite ??
          summary.reject ??
          d.reject ??
          0
        );
        const vPend = Number(
          d.verifypending ??
          summary.verify_pending ??
          d.verify_pending ??
          0
        );
        const claimApp = Number(
          d.claimedapplicable ??
          summary.claim_applicable ??
          d.claim_applicable ??
          0
        );
        const payDone = Number(
          d.paymentsitecount ??
          summary.payment_done ??
          d.payment_done ??
          0
        );

        setKpis({
          total_assigned: total,
          complete: comp,
          pending: pend,
          approve: app,
          reject: rej,
          verify_pending: vPend,
          claim_applicable: claimApp,
          payment_done: payDone,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to load assigned SSL lights:', err);
        setErrorMsg(err?.message || 'Failed to connect to SSL view-assign API.');
        setRecords([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await biharAdminService.approveSslAssign(id);
      setSuccessMsg(`Light Assignment #${id} approved successfully!`);
      handleRefresh();
    } catch (err: any) {
      console.error(`Approval failed for #${id}:`, err);
      setErrorMsg(err?.message || `Failed to approve assignment #${id}.`);
    } finally {
      setApprovingId(null);
    }
  };

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district && r.district !== '—') set.add(r.district.trim());
    });
    BIHAR_DISTRICTS.forEach((d) => set.add(d));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'all' && assignState(r) !== statusFilter) return false;
      if (districtFilter !== 'all' && r.district.trim().toLowerCase() !== districtFilter.trim().toLowerCase()) return false;
      if (!q) return true;
      return [
        r.vendor,
        r.state,
        r.volume,
        r.district,
        r.block,
        r.panchayat,
        r.ward_no,
        r.pole_no,
        r.remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [records, search, statusFilter, districtFilter]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || districtFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'Assign Date', accessor: (r) => fmtDate(r.assign_date) },
      { header: 'Deadline Date', accessor: (r) => fmtDate(r.deadline_date) },
      { header: 'State', accessor: (r) => r.state },
      { header: 'Volume', accessor: (r) => r.volume },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Block', accessor: (r) => r.block },
      { header: 'Panchayat', accessor: (r) => r.panchayat },
      { header: 'Ward No', accessor: (r) => r.ward_no },
      { header: 'Pole No', accessor: (r) => r.pole_no },
      { header: 'Site Count', accessor: (r) => r.site_count },
      { header: 'Data Match', accessor: (r) => r.data_match },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => stateLabel(assignState(r)) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SSL_View_Assign_Light', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SSL_View_Assign_Light', filtered, exportCols);
  const handlePdf = () => printTableData('View Bihar SSL Installation', filtered, exportCols);

  const colCount = 13;
  const tabCount = (k: FilterKey) => (k === 'all' ? records.length : records.filter((a) => assignState(a) === k).length);
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');

  const kpiCards: { label: string; value: unknown; tone: KpiTone; icon: IconKey; sub?: string }[] = [
    { label: 'Total Assigned Lights', value: kpis.total_assigned, tone: 'accent', icon: 'doc', sub: 'assigned to vendors' },
    { label: 'Complete Lights', value: kpis.complete, tone: 'emerald', icon: 'check', sub: 'installation complete' },
    { label: 'Pending', value: kpis.pending, tone: 'amber', icon: 'clock', sub: 'installation pending' },
    { label: 'Approve Lights', value: kpis.approve, tone: 'cyan', icon: 'shield', sub: 'verified & approved' },
    { label: 'Reject Lights', value: kpis.reject, tone: 'amber', icon: 'cross', sub: 'verified & rejected' },
    { label: 'Verify Pending', value: kpis.verify_pending, tone: 'accent', icon: 'clock', sub: 'awaiting verification' },
    { label: 'Claim Applicable', value: kpis.claim_applicable, tone: 'cyan', icon: 'doc', sub: 'milestone eligible' },
    { label: 'Payment Done', value: kpis.payment_done, tone: 'emerald', icon: 'coin', sub: 'disbursed batches' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View Bihar SSL Installation"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: 'View Bihar SSL Installation', href: '/vendor-management/bihar/ssl/installation/view-assign' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={handleRefresh} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/vendor-management/bihar/ssl/installation/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Assign Light</span>
            </Link>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{successMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={8} />
        ) : (
          kpiCards.map((k) => (
            <KpiCard key={k.label} tone={k.tone} label={k.label} value={num(k.value)} sub={k.sub} icon={ICONS[k.icon]} />
          ))
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Assignment status tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === statusFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assignment records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Assign SSL Installation</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{records.length}</span> assignment batches
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <select
                  className="ax-input ax-input--sm"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 150, height: 32, fontSize: '12px' }}
                >
                  <option value="all">All Districts ({availableDistricts.length})</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, block, pole…"
                  size="sm"
                  ariaLabel="Search assignments"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Assignment records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">Deadline Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Volume</th>
                  <th className="ax-table__th" scope="col">District / Block</th>
                  <th className="ax-table__th" scope="col">Panchayat & Ward</th>
                  <th className="ax-table__th" scope="col">Pole No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col">Files</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading assignment records…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No assigned SSL sites found"
                        message={hasFilters ? 'No assignments match your search. Try clearing the search term.' : 'No SSL assignments have been created yet.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const st = assignState(row);
                    const isPending = Number(row.status) === 0;

                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor}</td>
                        <td className="ax-table__td">{fmtDate(row.assign_date)}</td>
                        <td className="ax-table__td">{fmtDate(row.deadline_date)}</td>
                        <td className="ax-table__td">{row.state}</td>
                        <td className="ax-table__td">{row.volume}</td>
                        <td className="ax-table__td">
                          <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.district}</div>
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{row.block}</div>
                        </td>
                        <td className="ax-table__td">
                          <div>{row.panchayat}</div>
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{row.ward_no}</div>
                        </td>
                        <td className="ax-table__td">
                          <span className="ax-badge ax-badge--soft" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            {row.pole_no}
                          </span>
                        </td>
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 600 }}>
                          {row.site_count}
                        </td>
                        <td className="ax-table__td">
                          {(() => {
                            const fileCount = [
                              row.unique_id_file,
                              row.battery_no_file,
                              row.sim_no_file,
                              row.panel_no_file,
                              row.imei_no_file,
                            ].filter(Boolean).length;

                            return fileCount > 0 ? (
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => setSelectedFilesRow(row)}
                              >
                                View Files ({fileCount})
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>No Files</span>
                            );
                          })()}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(row.remarks)}
                        </td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${stateTone(st)}`}>
                            <span className="ax-badge__dot" />
                            {stateLabel(st)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {isPending && (
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--sm"
                                onClick={() => handleApprove(row.id)}
                                disabled={approvingId === row.id}
                                title="Approve Site Assignment"
                              >
                                {approvingId === row.id ? 'Approving…' : 'Approve'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => setSelectedRecord(row)}
                              title="View Details"
                            >
                              Details
                            </button>
                            <Link
                              to={`/vendor-management/bihar/ssl/installation/assign?id=${row.id}`}
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              title="Edit Assignment"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal: SSL Assignment Details ── */}
      <Modal
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        labelledBy="bih-ssl-assign-details-title"
        title={`SSL Assignment Details #${selectedRecord?.id || ''}`}
        subtitle={selectedRecord ? `${selectedRecord.vendor} · ${selectedRecord.panchayat}, ${selectedRecord.block}, ${selectedRecord.district}` : undefined}
        dialogStyle={{ maxWidth: 640 }}
        footer={
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedRecord(null)}>
            Close
          </button>
        }
      >
        {selectedRecord && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px', fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Volume</span>
                <strong>{selectedRecord.volume}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Pole Numbers</span>
                <code style={{ fontSize: 12 }}>{selectedRecord.pole_no}</code>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Ward No</span>
                <strong>{selectedRecord.ward_no}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Assigned Lights</span>
                <strong style={{ color: 'var(--ax-accent)', fontSize: 15 }}>{selectedRecord.site_count}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Assign Date</span>
                <strong>{fmtDate(selectedRecord.assign_date)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Deadline Date</span>
                <strong style={{ color: 'var(--ax-viz-amber, #d97706)' }}>{fmtDate(selectedRecord.deadline_date)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Data Match Status</span>
                <span className="ax-badge ax-badge--soft ax-badge--success">{selectedRecord.data_match}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${stateTone(assignState(selectedRecord))}`}>
                  <span className="ax-badge__dot" />
                  {stateLabel(assignState(selectedRecord))}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Remarks</span>
                <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 12 }}>
                  {txt(selectedRecord.remarks)}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Attached Files</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { title: "Unique ID's File", fn: selectedRecord.unique_id_file },
                    { title: "Battery No. File", fn: selectedRecord.battery_no_file },
                    { title: "Sim No. File", fn: selectedRecord.sim_no_file },
                    { title: "Panel No. File", fn: selectedRecord.panel_no_file },
                    { title: "IMEI No. File", fn: selectedRecord.imei_no_file },
                  ]
                    .filter((f) => !!f.fn)
                    .map((f) => (
                      <button
                        key={f.title}
                        type="button"
                        className="ax-btn ax-btn--secondary ax-btn--xs"
                        onClick={() => setPreviewFile({ title: f.title, filename: f.fn! })}
                        style={{ fontSize: 11.5 }}
                      >
                        📎 {f.title}: {f.fn!.split('/').pop()}
                      </button>
                    ))}
                  {![
                    selectedRecord.unique_id_file,
                    selectedRecord.battery_no_file,
                    selectedRecord.sim_no_file,
                    selectedRecord.panel_no_file,
                    selectedRecord.imei_no_file,
                  ].some(Boolean) && (
                    <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>No files uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Batch Files List ── */}
      <Modal
        open={!!selectedFilesRow}
        onClose={() => setSelectedFilesRow(null)}
        labelledBy="bih-ssl-assign-files-title"
        title="Assigned Batch Files"
        subtitle={selectedFilesRow ? `Vendor: ${selectedFilesRow.vendor} · ${selectedFilesRow.district}` : undefined}
        dialogStyle={{ maxWidth: 560 }}
        footer={
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setSelectedFilesRow(null)}>
            Close
          </button>
        }
      >
        {selectedFilesRow && (
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ width: '100%' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 50 }}>#</th>
                  <th className="ax-table__th" scope="col">Document Type</th>
                  <th className="ax-table__th" scope="col">File Name</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, title: "Unique ID's File", fn: selectedFilesRow.unique_id_file },
                  { id: 2, title: "Battery No. File", fn: selectedFilesRow.battery_no_file },
                  { id: 3, title: "Sim No. File", fn: selectedFilesRow.sim_no_file },
                  { id: 4, title: "Panel No. File", fn: selectedFilesRow.panel_no_file },
                  { id: 5, title: "IMEI No. File", fn: selectedFilesRow.imei_no_file },
                ].map((item) => (
                  <tr key={item.id} className="ax-table__row">
                    <td className="ax-table__td ax-num">{item.id}</td>
                    <td className="ax-table__td" style={{ fontWeight: 600 }}>{item.title}</td>
                    <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {item.fn ? item.fn.split('/').pop() : <span style={{ color: 'var(--ax-text-muted)', fontStyle: 'italic' }}>Not Uploaded</span>}
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      {item.fn ? (
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => setPreviewFile({ title: item.title, filename: item.fn! })}
                        >
                          View File
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── Modal: File Preview ── */}
      <Modal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        labelledBy="bih-ssl-assign-file-preview-title"
        title={previewFile ? `Document Preview: ${previewFile.title}` : 'Document Preview'}
        subtitle={previewFile?.filename}
        dialogStyle={{ maxWidth: 720 }}
        footer={
          previewFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <a
                href={resolveBiharMediaUrl(previewFile.filename)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Download / Open File</span>
                <span aria-hidden="true">↗</span>
              </a>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setPreviewFile(null)}>
                Close
              </button>
            </div>
          ) : null
        }
      >
        {previewFile && (() => {
          const fileUrl = resolveBiharMediaUrl(previewFile.filename);
          const ext = previewFile.filename.split('.').pop()?.toLowerCase() || '';
          const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
          const isPdf = ext === 'pdf';

          return (
            <div style={{ padding: 20 }}>
              {isImage ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={fileUrl}
                    alt={previewFile.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 460,
                      objectFit: 'contain',
                      borderRadius: 8,
                      border: '1px solid var(--ax-border, #e2e8f0)',
                    }}
                  />
                </div>
              ) : isPdf ? (
                <div style={{ width: '100%', height: 480 }}>
                  <iframe
                    src={fileUrl}
                    title={previewFile.title}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                  />
                </div>
              ) : (
                <div style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>{previewFile.filename.split('/').pop()}</h4>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Assigned Bihar SSL installation dispatch document ({ext.toUpperCase() || 'FILE'}).
                  </p>
                  <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: '12px 20px', fontSize: 12, marginBottom: 16 }}>
                    Path: <code>{previewFile.filename}</code>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Open / Download ({ext.toUpperCase()}) ↗
                  </a>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

export default BiharSSLInstallationViewAssignLight;

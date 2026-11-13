import { useState, useMemo, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';
import type { BiharSSLVerifyLightItem } from '../../bihar-types';

type Row = BiharSSLVerifyLightItem;
type TabType = 'completed' | 'verified';

const DASH = '—';

const statusTone = (s: string): 'success' | 'danger' | 'warning' =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning';

/* ───────── Responsive page CSS ───────── */
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

  /* Image thumbnails */
  .solar-erp-page .kswp-thumb {
    display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--ax-border, #e2e8f0); background: var(--ax-surface-subtle, #f8fafc);
    overflow: hidden; cursor: pointer; transition: transform 0.15s ease;
  }
  .solar-erp-page .kswp-thumb:hover { transform: scale(1.08); }
  .solar-erp-page .kswp-thumb img { width: 100%; height: 100%; object-fit: cover; }
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

function ImageThumbnail({ src, label, onOpen }: { src?: string | null; label: string; onOpen: (url: string, title: string) => void }) {
  const [broken, setBroken] = useState(false);
  if (!src || src === DASH) return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  return (
    <button type="button" className="kswp-thumb" title={`View ${label}`} onClick={() => onOpen(src, label)}>
      {broken ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ax-accent)' }}>IMG</span>
      ) : (
        <img src={src} alt={label} onError={() => setBroken(true)} />
      )}
    </button>
  );
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'completed', label: 'Lights Completed' },
  { key: 'verified', label: 'Approved / Rejected Lights' },
];

export function BiharSSLInstallationVerifyLight() {
  const [activeTab, setActiveTab] = useState<TabType>('completed');
  const [completedList, setCompletedList] = useState<Row[]>([]);
  const [verifiedList, setVerifiedList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Image preview
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Verify action modal
  const [actionItem, setActionItem] = useState<Row | null>(null);
  const [verifyChoice, setVerifyChoice] = useState<'1' | '2'>('1');
  const [remarks, setRemarks] = useState('');
  const [modalError, setModalError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [kpis, setKpis] = useState({
    totalAssignedLights: 0,
    completeLights: 0,
    pendingLights: 0,
    approveLights: 0,
    rejectLights: 0,
    verifyPending: 0,
    claimApplicable: 0,
    paymentDone: 0,
  });

  const loadInstallations = useCallback(() => {
    setLoading(true);
    setErrorMsg('');
    biharAdminService
      .getViewSslInstallation()
      .then((res: any) => {
        const rawCompleted = res?.data?.completed || res?.data?.verification || res?.completed || [];
        const rawVerified = res?.data?.verified || res?.verified || [];
        const allList = Array.isArray(res?.data?.installations)
          ? res.data.installations
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        const compItems = Array.isArray(rawCompleted) && rawCompleted.length > 0
          ? rawCompleted
          : allList.filter((s: any) => !s.verify_status || s.verify_status === 'Pending' || s.verify_status === 0 || s.verify_status === '0');

        const verItems = Array.isArray(rawVerified) && rawVerified.length > 0
          ? rawVerified
          : allList.filter((s: any) => s.verify_status === 'Approved' || s.verify_status === 'Rejected' || s.verify_status === 1 || s.verify_status === 2);

        const normalize = (item: any, idx: number): Row => ({
          id: item.id || idx + 1,
          vendor: item.vendor_name || item.vendor || 'Vendor',
          uid: item.uid || item.unique_id || `SSL-${item.id || idx + 1}`,
          state: item.state || 'Bihar',
          phase: item.phase || 'Phase 1',
          district: item.district || '—',
          district_code: item.district_code || '',
          block: item.block || '—',
          block_code: item.block_code || '',
          panchayat: item.panchayat || '—',
          panchayat_code: item.panchayat_code || '',
          ward_no: item.ward_no ? `Ward ${item.ward_no}` : 'Ward —',
          pole_no: item.pole_no || '—',
          beneficiary_name: item.beneficiary_name || item.farmer_name || '—',
          beneficiary_contact: item.beneficiary_contact || item.contact || '—',
          latitude: item.latitude || '—',
          longitude: item.longitude || '—',
          uuid_no: item.uuid_no || '—',
          imei_no: item.imei_no || '—',
          light_no: item.light_no || '—',
          battery_no: item.battery_no || '—',
          panel_no: item.panel_no || '—',
          light_image: resolveBiharMediaUrl(item.light_image || item.image),
          remark: item.remark || item.remarks || '—',
          verify_status: item.verify_status === 1 || item.verify_status === 'Approved' ? 'Approved' : item.verify_status === 2 || item.verify_status === 'Rejected' ? 'Rejected' : 'Pending',
          reverify_status: item.reverify_status || '',
        });

        const cList = compItems.map(normalize);
        const vList = verItems.map(normalize);

        setCompletedList(cList);
        setVerifiedList(vList);

        const summary = res?.data?.summary || res?.summary || {};
        const total = summary.total_assigned !== undefined ? Number(summary.total_assigned) : cList.length + vList.length;
        const comp = summary.complete !== undefined ? Number(summary.complete) : cList.length;
        const pend = summary.pending !== undefined ? Number(summary.pending) : Math.max(0, total - comp);

        setKpis({
          totalAssignedLights: total,
          completeLights: comp,
          pendingLights: pend,
          approveLights: summary.approve !== undefined ? Number(summary.approve) : vList.filter((r: Row) => r.verify_status === 'Approved').length,
          rejectLights: summary.reject !== undefined ? Number(summary.reject) : vList.filter((r: Row) => r.verify_status === 'Rejected').length,
          verifyPending: summary.verify_pending !== undefined ? Number(summary.verify_pending) : cList.length,
          claimApplicable: summary.claim_applicable !== undefined ? Number(summary.claim_applicable) : 0,
          paymentDone: summary.payment_done !== undefined ? Number(summary.payment_done) : 0,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to load SSL installations:', err);
        setErrorMsg(err?.message || 'Failed to connect to SSL view-installation API.');
        setCompletedList([]);
        setVerifiedList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadInstallations();
  }, [loadInstallations]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  const activeList = activeTab === 'completed' ? completedList : verifiedList;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((r) =>
      [r.vendor, r.uid, r.district, r.block, r.panchayat, r.ward_no, r.pole_no, r.beneficiary_name].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [activeList, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const openVerify = (row: Row) => {
    setActionItem(row);
    setVerifyChoice('1');
    setRemarks('');
    setModalError('');
  };

  const handleVerifySubmit = async () => {
    if (!actionItem) return;

    const isApprove = verifyChoice === '1';
    setSubmittingAction(true);
    setModalError('');
    try {
      await biharAdminService.verifySslInstallationStatus({
        id: actionItem.id,
        verify_status: verifyChoice,
        remark: remarks,
      });
      setSuccessMsg(`Light ${actionItem.uid} (${actionItem.pole_no}) marked as ${isApprove ? 'Approved' : 'Rejected'}!`);
      setActionItem(null);
      setRemarks('');
      loadInstallations();
    } catch (err: any) {
      setModalError(`Failed to update verification: ${err?.message || 'Server error'}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const openImage = (url: string, title: string) => setLightbox({ url, title });

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'UID', accessor: (r) => r.uid },
      { header: 'State', accessor: (r) => r.state },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Block', accessor: (r) => r.block },
      { header: 'Panchayat', accessor: (r) => r.panchayat },
      { header: 'Ward No', accessor: (r) => r.ward_no },
      { header: 'Pole No', accessor: (r) => r.pole_no },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name },
      { header: 'Contact', accessor: (r) => r.beneficiary_contact },
      { header: 'UUID No', accessor: (r) => r.uuid_no },
      { header: 'IMEI No', accessor: (r) => r.imei_no },
      { header: 'Light No', accessor: (r) => r.light_no },
      { header: 'Status', accessor: (r) => r.verify_status },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_SSL_Verify_${activeTab}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_SSL_Verify_${activeTab}`, filtered, exportCols);
  const handlePdf = () => printTableData(`Verify Bihar SSL Installation - ${activeTab}`, filtered, exportCols);

  const isCompletedTab = activeTab === 'completed';
  const colCount = isCompletedTab ? 26 : 23;
  const tabCount = (k: TabType) => (k === 'completed' ? completedList.length : verifiedList.length);
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');

  const kpiCards: { label: string; value: number; tone: KpiTone; icon: IconKey; sub?: string }[] = [
    { label: 'Total Assigned Lights', value: kpis.totalAssignedLights, tone: 'accent', icon: 'doc', sub: 'assigned to vendors' },
    { label: 'Complete Lights', value: kpis.completeLights, tone: 'emerald', icon: 'check', sub: 'installation complete' },
    { label: 'Pending', value: kpis.pendingLights, tone: 'amber', icon: 'clock', sub: 'installation pending' },
    { label: 'Approve Lights', value: kpis.approveLights, tone: 'cyan', icon: 'shield', sub: 'verified & approved' },
    { label: 'Reject Lights', value: kpis.rejectLights, tone: 'amber', icon: 'cross', sub: 'verified & rejected' },
    { label: 'Verify Pending', value: kpis.verifyPending, tone: 'accent', icon: 'clock', sub: 'awaiting verification' },
    { label: 'Claim Applicable', value: kpis.claimApplicable, tone: 'cyan', icon: 'doc' },
    { label: 'Payment Done', value: kpis.paymentDone, tone: 'emerald', icon: 'coin' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Verify Bihar SSL Installation"
        subtitle="Super Admin physical and geo-tagged verification of completed Bihar Solar Street Light installations"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: 'Verify Bihar SSL Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadInstallations} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
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
          <div className="ax-cluster" role="tablist" aria-label="Light verification tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
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
        <section className="ax-card ax-col--12" role="region" aria-label="Light verification">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{isCompletedTab ? 'Lights Completed' : 'Approved / Rejected Lights'}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{activeList.length}</span> SSL lights
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, UID, pole, block…"
                  size="sm"
                  ariaLabel="Search lights"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar SSL light verification</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">UID</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">District</th>
                  {isCompletedTab && <th className="ax-table__th" scope="col">District Code</th>}
                  <th className="ax-table__th" scope="col">Block</th>
                  {isCompletedTab && <th className="ax-table__th" scope="col">Block Code</th>}
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  {isCompletedTab && <th className="ax-table__th" scope="col">Panchayat Code</th>}
                  <th className="ax-table__th" scope="col">Ward No</th>
                  <th className="ax-table__th" scope="col">Pole No</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Beneficiary Contact</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">UUID No.</th>
                  <th className="ax-table__th" scope="col">IMEI No.</th>
                  <th className="ax-table__th" scope="col">Light No.</th>
                  <th className="ax-table__th" scope="col">Battery No.</th>
                  <th className="ax-table__th" scope="col">Panel No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Light Image</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  {isCompletedTab ? (
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                  ) : (
                    <th className="ax-table__th" scope="col">Reverify Status</th>
                  )}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Bihar SSL installation data from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={isCompletedTab ? 'No pending verifications' : 'No verified records'}
                        message={hasFilters ? 'No lights match your search. Try clearing the search term.' : 'No light installations found under this category.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((r, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={r.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.vendor}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>{r.uid}</td>
                        <td className="ax-table__td">{r.state}</td>
                        <td className="ax-table__td">{r.phase}</td>
                        <td className="ax-table__td">{r.district}</td>
                        {isCompletedTab && <td className="ax-table__td ax-num">{r.district_code}</td>}
                        <td className="ax-table__td">{r.block}</td>
                        {isCompletedTab && <td className="ax-table__td ax-num">{r.block_code}</td>}
                        <td className="ax-table__td">{r.panchayat}</td>
                        {isCompletedTab && <td className="ax-table__td ax-num">{r.panchayat_code}</td>}
                        <td className="ax-table__td">{r.ward_no}</td>
                        <td className="ax-table__td ax-num">{r.pole_no}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{r.beneficiary_name}</td>
                        <td className="ax-table__td ax-num">{r.beneficiary_contact}</td>
                        <td className="ax-table__td ax-num">{r.latitude}</td>
                        <td className="ax-table__td ax-num">{r.longitude}</td>
                        <td className="ax-table__td ax-num">{r.uuid_no}</td>
                        <td className="ax-table__td ax-num">{r.imei_no}</td>
                        <td className="ax-table__td ax-num">{r.light_no}</td>
                        <td className="ax-table__td ax-num">{r.battery_no}</td>
                        <td className="ax-table__td ax-num">{r.panel_no}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <ImageThumbnail src={r.light_image} label={`Pole ${r.pole_no} - Light Image`} onOpen={openImage} />
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>{r.remark}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusTone(r.verify_status)}`}>
                            <span className="ax-badge__dot" />
                            {r.verify_status}
                          </span>
                        </td>
                        {isCompletedTab ? (
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => openVerify(r)}>
                              Verify
                            </button>
                          </td>
                        ) : (
                          <td className="ax-table__td">{r.reverify_status || DASH}</td>
                        )}
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
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal: Verify Light Installation ── */}
      <Modal
        open={!!actionItem}
        onClose={() => setActionItem(null)}
        labelledBy="bssl-verify-light-title"
        title={`Verify Light Installation${actionItem ? ` #${actionItem.uid}` : ''}`}
        subtitle={actionItem ? `Pole: ${actionItem.pole_no} · ${actionItem.panchayat}, ${actionItem.block}` : undefined}
        dialogStyle={{ maxWidth: 560 }}
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setActionItem(null)} disabled={submittingAction}>
              Cancel
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${verifyChoice === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={handleVerifySubmit}
              disabled={submittingAction}
              style={verifyChoice === '2' ? { color: 'var(--ax-danger, #ef4444)', borderColor: 'var(--ax-danger, #ef4444)' } : undefined}
            >
              {submittingAction ? 'Updating…' : verifyChoice === '1' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modalError && (
            <div className="ax-alert ax-alert--danger" role="alert">
              <div className="ax-alert__content">{modalError}</div>
            </div>
          )}

          {actionItem && (
            <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                <div><b>Vendor:</b> {actionItem.vendor}</div>
                <div><b>Beneficiary:</b> {actionItem.beneficiary_name}</div>
                <div><b>District:</b> {actionItem.district}</div>
                <div><b>Block / Panchayat:</b> {actionItem.block} / {actionItem.panchayat}</div>
                <div><b>Ward / Pole:</b> {actionItem.ward_no} / {actionItem.pole_no}</div>
                <div><b>IMEI / Light No:</b> {actionItem.imei_no} / {actionItem.light_no}</div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Verification Decision *</label>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="ssl_verify_choice" checked={verifyChoice === '1'} onChange={() => setVerifyChoice('1')} />
                <span style={{ fontWeight: 600, color: 'var(--ax-success, #10b981)' }}>Approve Light</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="ssl_verify_choice" checked={verifyChoice === '2'} onChange={() => setVerifyChoice('2')} />
                <span style={{ fontWeight: 600, color: 'var(--ax-danger, #ef4444)' }}>Reject Light</span>
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="ssl_verify_remark" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Verification Remarks</label>
            <textarea
              id="ssl_verify_remark"
              className="ax-textarea"
              rows={3}
              placeholder="Enter verification notes…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal: Image Preview ── */}
      <Modal
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        labelledBy="bssl-light-image-title"
        title={lightbox?.title || 'Light Image'}
        dialogStyle={{ maxWidth: 900 }}
        footer={
          <>
            <a href={lightbox?.url || '#'} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setLightbox(null)}>Close</button>
          </>
        }
      >
        <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox?.url || ''} alt={lightbox?.title || 'Light photo'} style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }} />
        </div>
      </Modal>
    </div>
  );
}

export default BiharSSLInstallationVerifyLight;
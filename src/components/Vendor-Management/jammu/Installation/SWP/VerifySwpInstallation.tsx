import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
} from './jammuSwpAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SRT 70MW reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
  }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }

  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0' }}>
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

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 580,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image & Document Lightbox Modal ───────── */
function LightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Media Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface JammuSwpVerifyInstallationItem {
  id: number;
  state: string;
  vendorName: string;
  district: string;
  tehsil: string;
  block: string;
  village: string;
  applicantName: string;
  vfdNo: string;
  motorNo: string;
  pumpNo: string;
  moduleSerialNo: string;
  farmerWithModuleImage?: string;
  inverterVfdFarmerImage?: string;
  runningWaterFarmerImage?: string;
  poleFarmerImage?: string;
  instRemarks: string;
  verifyStatus: 'Pending' | 'Approved' | 'Rejected';
  rawStatus: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verifyFile?: string;
  verifyRemarks: string;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function VerifySwpInstallation() {
  const [items, setItems] = useState<JammuSwpVerifyInstallationItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    not_assigned: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>('all');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Verify Action Modal
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<JammuSwpVerifyInstallationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>(''); // '1' = Approved, '2' = Rejected
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Load verification data live from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await jammuAdminSwpService.getViewInstallation();
      if (resp.detail) {
        setStats({
          total: Number(resp.detail.total || 0),
          assigned: Number(resp.detail.assigned || 0),
          not_assigned: Number(resp.detail.not_assigned || 0),
          complete: Number(resp.detail.complete || 0),
          pending: Number(resp.detail.pending || 0),
          verify_approved: Number(resp.detail.verify_approved || 0),
          verify_pending: Number(resp.detail.verify_pending || 0),
          verify_reject: Number(resp.detail.verify_reject || 0),
        });
      }

      const mapItem = (item: any, defaultSt: number): JammuSwpVerifyInstallationItem => {
        const rawStatus = Number(item.inst_verify_status ?? defaultSt);
        const verifyStatus: 'Pending' | 'Approved' | 'Rejected' =
          rawStatus === 1 ? 'Approved' : rawStatus === 2 ? 'Rejected' : 'Pending';

        const rawVerifyFile =
          item.inst_doc ||
          item.inst_verify_file ||
          item.verify_file ||
          item.file ||
          item.verify_doc ||
          item.doc_file ||
          item.document ||
          item.hoc_photo;

        let moduleSerials = '—';
        const modArr = item.jammu_modulee || item.jammuModulee || item.modules;
        if (Array.isArray(modArr) && modArr.length > 0) {
          moduleSerials = modArr.map((m: any) => m.sr_no || m.module_no || m.serial_no).filter(Boolean).join(', ');
        } else if (item.module_sr_no) {
          moduleSerials = String(item.module_sr_no);
        }

        const rawModuleImg = item.module_image || item.farmer_with_module || item.farmer_module_image || item.image1;
        const rawVfdImg = item.vfd_image || item.inverter_vfd || item.inverter_vfd_farmer_image || item.inverter_image || item.image2;
        const rawWaterImg = item.running_water_image || item.running_water || item.running_water_farmer_image || item.image3;
        const rawPoleImg = item.pole_image || item.pole_farmer_image || item.pole_with_farmer_image || item.hoc_photo || item.image4;

        return {
          id: item.id,
          state: 'Jammu',
          vendorName: item.vendor_name || item.vendor || (item.inst_vendor ? `Vendor #${item.inst_vendor}` : '—'),
          district: item.district || item.f_district || '—',
          tehsil: item.tehsil || item.f_tehsil || item.sub_district || '—',
          block: item.block || item.f_block || '—',
          village: item.village || item.f_village || '—',
          applicantName: item.f_farmer_name || item.farmer_name || item.applicant_name || `Farmer #${item.id}`,
          vfdNo: item.controller_sr_no || item.vfd_no || item.vfd_sr_no || item.controller_no || '—',
          motorNo: item.motor_sr_no || item.motor_no || '—',
          pumpNo: item.pump_sr_no || item.pump_no || '—',
          moduleSerialNo: moduleSerials,
          farmerWithModuleImage: rawModuleImg ? resolveJammuSwpMediaUrl(rawModuleImg) : undefined,
          inverterVfdFarmerImage: rawVfdImg ? resolveJammuSwpMediaUrl(rawVfdImg) : undefined,
          runningWaterFarmerImage: rawWaterImg ? resolveJammuSwpMediaUrl(rawWaterImg) : undefined,
          poleFarmerImage: rawPoleImg ? resolveJammuSwpMediaUrl(rawPoleImg) : undefined,
          instRemarks: item.remarks || item.inst_remarks || '—',
          verifyStatus,
          rawStatus,
          verifyFile: rawVerifyFile ? resolveJammuSwpMediaUrl(rawVerifyFile) : undefined,
          verifyRemarks: item.inst_verify_remarks || item.verify_remarks || '—',
        };
      };

      const combined: JammuSwpVerifyInstallationItem[] = [
        ...(resp.verification || []).map((x: any) => mapItem(x, 0)),
        ...(resp.verified || []).map((x: any) => mapItem(x, 1)),
      ];
      setItems(combined);
    } catch (err: any) {
      console.error('Failed to load live Jammu SWP verification data:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct districts
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      const d = String(r.district || '').trim();
      if (d && d !== '—') set.add(d);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter based on bifurcation tabs and search
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'pending') {
      result = result.filter((s) => s.verifyStatus === 'Pending');
    } else if (activeTab === 'processed') {
      result = result.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected');
    }

    if (districtFilter !== 'all') {
      result = result.filter((s) => s.district.toLowerCase() === districtFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.applicantName.toLowerCase().includes(q) ||
          s.vendorName.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.tehsil.toLowerCase().includes(q) ||
          s.block.toLowerCase().includes(q) ||
          s.village.toLowerCase().includes(q) ||
          s.vfdNo.toLowerCase().includes(q) ||
          s.motorNo.toLowerCase().includes(q) ||
          s.pumpNo.toLowerCase().includes(q) ||
          s.moduleSerialNo.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    return result;
  }, [items, activeTab, districtFilter, search]);

  const pagination = usePagination(filteredItems, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [activeTab, districtFilter, search]);

  // Export Columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'State', accessor: 'state' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'District', accessor: 'district' },
    { header: 'Tehsil', accessor: 'tehsil' },
    { header: 'Block', accessor: 'block' },
    { header: 'Village', accessor: 'village' },
    { header: 'Applicant Name', accessor: 'applicantName' },
    { header: 'VFD No.', accessor: 'vfdNo' },
    { header: 'Motor No.', accessor: 'motorNo' },
    { header: 'Pump No.', accessor: 'pumpNo' },
    { header: 'Module Serial No.', accessor: 'moduleSerialNo' },
    { header: 'Farmer With Module Image', accessor: 'farmerWithModuleImage' },
    { header: 'Inverter and VFD with Farmer Image', accessor: 'inverterVfdFarmerImage' },
    { header: 'Running Water With Farmer Image', accessor: 'runningWaterFarmerImage' },
    { header: 'Pole With Farmer Image', accessor: 'poleFarmerImage' },
    { header: 'Inst. Remarks', accessor: 'instRemarks' },
    { header: 'Verify Status', accessor: 'verifyStatus' },
    { header: 'Verify File', accessor: 'verifyFile' },
    { header: 'Verify Remarks', accessor: 'verifyRemarks' },
  ];

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!filteredItems.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!filteredItems.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredItems.map((row) =>
        exportColumns.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SWP_Verify_${activeTab}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredItems.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((row) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SWP_Verify_${activeTab}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredItems.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SWP Verify Sites</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SWP Installation Verification</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Action Submit for verification
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    if (!actionStatus) {
      alert('Please select status.');
      return;
    }
    if (!actionFile && !selectedSiteForAction.verifyFile) {
      alert('Please choose a file.');
      return;
    }

    setSubmittingAction(true);
    try {
      const targetStatus = Number(actionStatus);
      const res = await jammuAdminSwpService.verifyInstallationStatus({
        id: selectedSiteForAction.id,
        status: targetStatus,
        file: actionFile,
        remarks: actionRemarks,
        inst_verify_remarks: actionRemarks,
      });

      if (res.success || res.status) {
        const newStatusLabel: 'Pending' | 'Approved' | 'Rejected' =
          targetStatus === 1 ? 'Approved' : targetStatus === 2 ? 'Rejected' : 'Pending';

        const updatedFileUrl = actionFile
          ? URL.createObjectURL(actionFile)
          : selectedSiteForAction.verifyFile;

        setItems((prev) =>
          prev.map((s) =>
            s.id === selectedSiteForAction.id
              ? {
                  ...s,
                  rawStatus: targetStatus,
                  verifyStatus: newStatusLabel,
                  verifyRemarks: actionRemarks || s.verifyRemarks,
                  verifyFile: updatedFileUrl,
                }
              : s
          )
        );

        setStats((prev) => ({
          ...prev,
          verify_pending: Math.max(0, (prev.verify_pending || 0) - 1),
          verify_approved: targetStatus === 1 ? (prev.verify_approved || 0) + 1 : prev.verify_approved,
          verify_reject: targetStatus === 2 ? (prev.verify_reject || 0) + 1 : prev.verify_reject,
        }));

        setSelectedSiteForAction(null);
        setActionStatus('');
        setActionRemarks('');
        setActionFile(null);
        alert(res.message || 'Verification status updated successfully.');
      } else {
        alert(res.message || 'Failed to update verification status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const pendingCount = items.filter((s) => s.verifyStatus === 'Pending').length;
  const processedCount = items.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected').length;

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SWP Installation - Verify Sites"
        subtitle="Technical audit desk for solar water pumping installations, VFD controller serials, pump motors, and field verification across Jammu"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'SWP', href: '/vendor-management/jammu/installation/swp/dashboard' },
          { label: 'Verify Sites' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/swp/view-assign"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Assigned Sites Register
            </Link>
            <Link
              to="/vendor-management/jammu/installation/swp/assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Sites
            </Link>
          </div>
        }
      />

      {/* ── Top 5 KPI Metric Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total Sites"
          value={stats.total || items.length}
          sub={`${stats.assigned} Assigned · ${stats.not_assigned} Unassigned`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={`${stats.complete} / ${stats.pending}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verify Pending"
          value={stats.verify_pending || pendingCount}
          sub="Awaiting admin QA review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Verified Approved"
          value={stats.verify_approved}
          sub="QA verified & approved"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="violet"
          label="Verified Rejected"
          value={stats.verify_reject}
          sub="Requires re-inspection"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`asw-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Sites
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {stats.verify_pending || pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processed')}
          className={`asw-pill-btn ${activeTab === 'processed' ? 'active' : ''}`}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'processed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(stats.verify_approved + stats.verify_reject) || processedCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'all'
                ? 'All Jammu SWP Installed Sites'
                : activeTab === 'pending'
                ? 'Jammu SWP Installations Pending Verification'
                : 'Jammu SWP Verified Installations Register'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredItems.length} site{filteredItems.length === 1 ? '' : 's'} with pump equipment barcodes & high-resolution proof photos
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtOptions.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-form-control"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', height: 32 }}
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, applicant, serial..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={copyToClipboard}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* ── Horizontally Scrollable Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: activeTab === 'pending' ? 2550 : 2400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Tehsil</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Applicant Name</th>
                <th className="ax-table__th">VFD No.</th>
                <th className="ax-table__th">Motor No.</th>
                <th className="ax-table__th">Pump No.</th>
                <th className="ax-table__th">Module Serial No.</th>
                <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Farmer With Module Image</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Inverter and VFD with Farmer Image</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Running Water With Farmer Image</th>
                <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Pole With Farmer Image</th>
                <th className="ax-table__th">Inst. Remarks</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Verify File</th>
                <th className="ax-table__th">Verify Remarks</th>
                {activeTab === 'pending' && (
                  <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 21 : 20} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation verification records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 21 : 20} style={centerCell}>
                    <TableEmptyState
                      title="No Verification Records Found"
                      description={`No records found under "${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected Data'}" matching your criteria.`}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const serialNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.state}
                      </td>

                      {/* 3. Vendor Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendorName}</div>
                      </td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 5. Tehsil */}
                      <td className="ax-table__td">{row.tehsil}</td>

                      {/* 6. Block */}
                      <td className="ax-table__td">{row.block}</td>

                      {/* 7. Village */}
                      <td className="ax-table__td">{row.village}</td>

                      {/* 8. Applicant Name */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.applicantName}
                      </td>

                      {/* 9. VFD No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.vfdNo}
                      </td>

                      {/* 10. Motor No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.motorNo}
                      </td>

                      {/* 11. Pump No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.pumpNo}
                      </td>

                      {/* 12. Module Serial No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.moduleSerialNo}>
                        {row.moduleSerialNo}
                      </td>

                      {/* 13. Farmer With Module Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.farmerWithModuleImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.farmerWithModuleImage!, title: `Farmer With Module - ${row.applicantName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Farmer With Module Image"
                          >
                            <img
                              src={row.farmerWithModuleImage}
                              alt="Farmer With Module"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 14. Inverter and VFD with Farmer Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.inverterVfdFarmerImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.inverterVfdFarmerImage!, title: `Inverter/VFD with Farmer - ${row.applicantName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Inverter and VFD with Farmer Image"
                          >
                            <img
                              src={row.inverterVfdFarmerImage}
                              alt="Inverter & VFD"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 15. Running Water With Farmer Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.runningWaterFarmerImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.runningWaterFarmerImage!, title: `Running Water With Farmer - ${row.applicantName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Running Water With Farmer Image"
                          >
                            <img
                              src={row.runningWaterFarmerImage}
                              alt="Running Water"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 16. Pole With Farmer Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.poleFarmerImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.poleFarmerImage!, title: `Pole With Farmer - ${row.applicantName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Pole With Farmer Image"
                          >
                            <img
                              src={row.poleFarmerImage}
                              alt="Pole With Farmer"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 17. Inst. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.instRemarks}>
                          {row.instRemarks}
                        </div>
                      </td>

                      {/* 18. Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              row.verifyStatus === 'Approved'
                                ? '#ecfdf5'
                                : row.verifyStatus === 'Rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              row.verifyStatus === 'Approved'
                                ? '#059669'
                                : row.verifyStatus === 'Rejected'
                                ? '#dc2626'
                                : '#d97706',
                            border: `1px solid ${
                              row.verifyStatus === 'Approved'
                                ? '#a7f3d0'
                                : row.verifyStatus === 'Rejected'
                                ? '#fecaca'
                                : '#fde68a'
                            }`,
                          }}
                        >
                          {row.verifyStatus}
                        </span>
                      </td>

                      {/* 19. Verify File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.verifyFile ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(row.verifyFile) ? (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl({ url: row.verifyFile!, title: `Verify File - ${row.applicantName}` })}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title="Click to preview Verify File"
                              >
                                <img
                                  src={row.verifyFile}
                                  alt="Verify File"
                                  style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </button>
                            ) : (
                              <a
                                href={row.verifyFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#eff4fc',
                                  color: '#2559bf',
                                  textDecoration: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #bfd3f8',
                                }}
                                title="Open / Download Verify File"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>View File</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 20. Verify Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                          {row.verifyRemarks || '—'}
                        </div>
                      </td>

                      {/* 21. Action column (ONLY if Verification Pending tab) */}
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteForAction(row);
                              setActionStatus('');
                              setActionRemarks(row.verifyRemarks !== '—' ? row.verifyRemarks : '');
                              setActionFile(null);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#2559bf',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Verify
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Verify Status Modal (Only triggered from Pending tab) ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) {
            setSelectedSiteForAction(null);
            setActionStatus('');
            setActionRemarks('');
            setActionFile(null);
          }
        }}
        title="Verify Status"
        subtitle={selectedSiteForAction ? `Site: ${selectedSiteForAction.applicantName} (${selectedSiteForAction.district})` : undefined}
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Status <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">-- Select Status --</option>
              <option value="1">Approve</option>
              <option value="2">Reject</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              File <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="file"
              required={!selectedSiteForAction?.verifyFile}
              onChange={(e) => setActionFile(e.target.files?.[0] || null)}
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
              }}
            />
            {selectedSiteForAction?.verifyFile && !actionFile && (
              <span style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'block' }}>
                Current File: <a href={selectedSiteForAction.verifyFile} target="_blank" rel="noopener noreferrer" style={{ color: '#2559bf' }}>View Existing Upload</a>
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Remark
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter technical verification remarks, inspection notes, or rectification directives..."
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setSelectedSiteForAction(null);
                setActionStatus('');
                setActionRemarks('');
                setActionFile(null);
              }}
              className="ax-btn ax-btn--secondary"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                borderRadius: 8,
                background: '#2559bf',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: submittingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {submittingAction ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Media Lightbox Modal ── */}
      {lightboxUrl && (
        <LightboxModal
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          url={lightboxUrl.url}
          title={lightboxUrl.title}
        />
      )}
    </div>
  );
}

export default VerifySwpInstallation;

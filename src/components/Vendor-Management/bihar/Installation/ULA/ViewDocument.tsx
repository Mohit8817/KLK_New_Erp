import { useEffect, useMemo, useRef, useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

/* ───────── Responsive page CSS (Exact Karnataka SWP Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
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
    border-color: #2563eb;
    color: #2563eb;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
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
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
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
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
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

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

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

export interface UlaDocumentItem {
  id: number;
  state: string;
  vendor_name: string;
  district: string;
  block: string;
  tehsil?: string;
  village: string;
  f_post?: string;
  f_pincode?: string;
  beneficiary_name: string;
  father_name?: string;
  contact_number: string;
  aadhar_no?: string;
  work_order_no?: string;
  volume?: string;
  work_order_date?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  logger_no?: string;
  pump_capacity?: string;
  pump_sub_type?: string;
  module_serial_no?: string | string[];
  document_file?: string;
  complete_photo?: string;
  module_image?: string;
  inverter_image?: string;
  running_water_image?: string;
  submit_date: string;
  remarks?: string;
  verify_status: 'Complete' | 'Approved' | 'Pending' | 'Reject' | 'Rejected' | string;
  verify_status_code: number; // 0: Pending, 1: Approved, 2: Rejected
  verify_remarks?: string;
  verify_date?: string;
  verify_by?: string;
  latitude?: string;
  longitude?: string;
}

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
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
      <div className="ax-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ax-modal__dialog" ref={dialogRef} style={{ maxWidth }}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                {subtitle}
              </p>
            )}
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

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';
const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
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

function parseModuleSerials(raw?: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // ignore and fallback
      }
    }
    return trimmed.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return [String(raw)];
}

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function MediaFileThumbnail({
  file,
  alt = 'Document Preview',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const fullUrl = resolveBiharMediaUrl(file);
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <button
      type="button"
      onClick={() => onClick(fullUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      title={`Click to preview: ${file.split('/').pop()}`}
    >
      {!imgError && (isDirectImage || ext === 'heic') ? (
        <img
          src={fullUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#f1f5f9',
            borderRadius: 4,
            padding: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginTop: 1 }}>
            {ext || 'DOC'}
          </span>
        </div>
      )}
    </button>
  );
}

// Initial fallback mock data for Bihar ULA
const INITIAL_ULA_DOCS: UlaDocumentItem[] = [
  {
    id: 401,
    state: 'Bihar',
    vendor_name: 'ETS Networks Pvt Ltd',
    district: 'Patna',
    block: 'Danapur',
    tehsil: 'Danapur',
    village: 'Khagaul',
    f_post: 'Khagaul SO',
    f_pincode: '801105',
    beneficiary_name: 'Rajendra Prasad',
    father_name: 'Mahavir Prasad',
    contact_number: '9876543210',
    aadhar_no: '8834-1123-9941',
    work_order_no: 'WO-BIH-ULA-2024-401',
    volume: 'Phase-1',
    work_order_date: '15-Aug-2024',
    solar_meter_no: 'SM-PAT-4011',
    inverter_no: 'INV-401-K3',
    net_smart_meter_no: 'NSM-40122',
    logger_no: 'LOG-401-PAT',
    pump_capacity: '5 HP',
    pump_sub_type: 'AC Submersible',
    module_serial_no: ['MOD-ULA-401-A', 'MOD-ULA-401-B', 'MOD-ULA-401-C', 'MOD-ULA-401-D'],
    document_file: 'jcr_handover_401.pdf',
    complete_photo: 'ula_site_401_full.jpg',
    module_image: 'ula_mod_401.jpg',
    inverter_image: 'ula_inv_401.jpg',
    running_water_image: 'ula_water_401.jpg',
    submit_date: '2024-10-28',
    remarks: 'Joint Commissioning Report signed by AEE & Nodal Officer',
    verify_status: 'Approved',
    verify_status_code: 1,
    verify_remarks: 'All signatures verified with nodal officer seal and GPS coordinates intact.',
    verify_date: '2024-10-29',
    verify_by: 'QA Officer (Patna)',
    latitude: '25.5941',
    longitude: '85.1376',
  },
  {
    id: 402,
    state: 'Bihar',
    vendor_name: 'ETS Networks Pvt Ltd',
    district: 'Patna',
    block: 'Danapur',
    tehsil: 'Danapur',
    village: 'Khagaul',
    f_post: 'Khagaul SO',
    f_pincode: '801105',
    beneficiary_name: 'Dinesh Mandal',
    father_name: 'Ramdhani Mandal',
    contact_number: '9876543211',
    aadhar_no: '7612-4590-2384',
    work_order_no: 'WO-BIH-ULA-2024-402',
    volume: 'Phase-1',
    work_order_date: '18-Aug-2024',
    solar_meter_no: 'SM-PAT-4021',
    inverter_no: 'INV-402-K3',
    net_smart_meter_no: 'NSM-40233',
    logger_no: 'LOG-402-PAT',
    pump_capacity: '3 HP',
    pump_sub_type: 'DC Surface',
    module_serial_no: ['MOD-ULA-402-A', 'MOD-ULA-402-B'],
    document_file: 'farmer_undertaking_402.pdf',
    complete_photo: 'ula_site_402_full.jpg',
    submit_date: '2024-11-02',
    remarks: 'Farmer affidavit and land registry certificate submitted',
    verify_status: 'Pending',
    verify_status_code: 0,
    latitude: '25.6023',
    longitude: '85.0489',
  },
  {
    id: 403,
    state: 'Bihar',
    vendor_name: 'Shakti Pumps Ltd',
    district: 'Gaya',
    block: 'Bodh Gaya',
    tehsil: 'Bodh Gaya',
    village: 'Bakrour',
    f_post: 'Bodh Gaya SO',
    f_pincode: '824231',
    beneficiary_name: 'Satish Kumar',
    father_name: 'Kamal Kishore',
    contact_number: '9876543212',
    aadhar_no: '9182-3401-7782',
    work_order_no: 'WO-BIH-ULA-2024-403',
    volume: 'Phase-2',
    work_order_date: '22-Aug-2024',
    solar_meter_no: 'SM-GAY-4031',
    inverter_no: 'INV-403-S5',
    net_smart_meter_no: 'NSM-40344',
    logger_no: 'LOG-403-GAY',
    pump_capacity: '7.5 HP',
    pump_sub_type: 'AC Submersible',
    module_serial_no: ['MOD-ULA-403-1', 'MOD-ULA-403-2', 'MOD-ULA-403-3', 'MOD-ULA-403-4', 'MOD-ULA-403-5'],
    document_file: 'pump_test_cert_403.pdf',
    complete_photo: 'ula_site_403_full.jpg',
    submit_date: '2024-11-04',
    remarks: 'Pump head, flow-rate curve and water discharge report verified at site',
    verify_status: 'Pending',
    verify_status_code: 0,
    latitude: '24.6961',
    longitude: '84.9913',
  },
  {
    id: 404,
    state: 'Bihar',
    vendor_name: 'ETS Networks Pvt Ltd',
    district: 'Nalanda',
    block: 'Bihar Sharif',
    tehsil: 'Bihar Sharif',
    village: 'Pawapuri',
    f_post: 'Pawapuri SO',
    f_pincode: '803115',
    beneficiary_name: 'Manoj Verma',
    father_name: 'Suresh Verma',
    contact_number: '9876543213',
    aadhar_no: '6543-9812-3456',
    work_order_no: 'WO-BIH-ULA-2024-404',
    volume: 'Phase-1',
    work_order_date: '25-Aug-2024',
    solar_meter_no: 'SM-NAL-4041',
    inverter_no: 'INV-404-E2',
    net_smart_meter_no: 'NSM-40455',
    logger_no: 'LOG-404-NAL',
    pump_capacity: '5 HP',
    pump_sub_type: 'AC Submersible',
    module_serial_no: ['MOD-ULA-404-A', 'MOD-ULA-404-B', 'MOD-ULA-404-C'],
    document_file: 'jcr_warranty_404.pdf',
    complete_photo: 'ula_site_404_full.jpg',
    submit_date: '2024-11-05',
    remarks: 'Comprehensive 5-year AMC contract copy & equipment guarantee',
    verify_status: 'Approved',
    verify_status_code: 1,
    verify_remarks: 'Duly approved and logged in central registry with warranty card signed.',
    verify_date: '2024-11-06',
    verify_by: 'QA Lead (Bihar)',
    latitude: '25.1982',
    longitude: '85.5186',
  },
  {
    id: 405,
    state: 'Bihar',
    vendor_name: 'Tata Power Solar Systems',
    district: 'Muzaffarpur',
    block: 'Kanti',
    tehsil: 'Kanti',
    village: 'Damodarpur',
    f_post: 'Kanti SO',
    f_pincode: '843109',
    beneficiary_name: 'Umesh Choudhary',
    father_name: 'Ganesh Choudhary',
    contact_number: '9876543214',
    aadhar_no: '4321-7890-1122',
    work_order_no: 'WO-BIH-ULA-2024-405',
    volume: 'Phase-2',
    work_order_date: '01-Sep-2024',
    solar_meter_no: 'SM-MUZ-4051',
    inverter_no: 'INV-405-T4',
    net_smart_meter_no: 'NSM-40566',
    logger_no: 'LOG-405-MUZ',
    pump_capacity: '5 HP',
    pump_sub_type: 'AC Submersible',
    module_serial_no: ['MOD-ULA-405-1', 'MOD-ULA-405-2'],
    document_file: 'affidavit_405.pdf',
    submit_date: '2024-11-06',
    remarks: 'Missing Aadhaar verification barcode and unreadable stamp',
    verify_status: 'Rejected',
    verify_status_code: 2,
    verify_remarks: 'Rejected due to blurry Aadhaar scan and missing farmer signature on page 2. Re-upload required.',
    verify_date: '2024-11-07',
    verify_by: 'Senior Auditor',
    latitude: '26.1209',
    longitude: '85.3647',
  },
];

export function BiharULAInstallationViewDocument() {
  const [verificationPending, setVerificationPending] = useState<UlaDocumentItem[]>([]);
  const [verifiedList, setVerifiedList] = useState<UlaDocumentItem[]>([]);
  const [detailSummary, setDetailSummary] = useState<any>({
    total: 47,
    assigned: 25,
    not_assigned: 21,
    complete: 11,
    pending: 14,
    doc_pending: 2,
    doc_approved: 2,
    doc_reject: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Bifurcation: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<UlaDocumentItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Action Popup State
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<UlaDocumentItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1: Approved, 2: Rejected, 0: Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Fetch API: GET /admin/bihar/ula/installation/view-document
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biharAdminService.getViewUlaDocument();
      if (res && res.data) {
        // If API returns bifurcated data structure
        if (Array.isArray(res.data.verification) || Array.isArray(res.data.verified)) {
          setVerificationPending(res.data.verification || []);
          setVerifiedList(res.data.verified || []);
          if (res.data.detail) setDetailSummary(res.data.detail);
        } else {
          // If API returns flat list
          const rawList = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.documents)
            ? res.data.documents
            : Array.isArray(res.data.data)
            ? res.data.data
            : [];

          if (rawList.length > 0) {
            const mapped: UlaDocumentItem[] = rawList.map((item: any, idx: number) => {
              const code =
                item.verify_status_code !== undefined
                  ? Number(item.verify_status_code)
                  : item.verify_status === 1 || item.verify_status === 'Approved' || item.verify_status === 'Complete'
                  ? 1
                  : item.verify_status === 2 || item.verify_status === 'Reject' || item.verify_status === 'Rejected'
                  ? 2
                  : 0;

              const statusText = code === 1 ? 'Approved' : code === 2 ? 'Rejected' : 'Pending';

              return {
                id: item.id || idx + 1,
                state: item.state || 'Bihar',
                vendor_name: item.vendor_name || item.vendor || 'ETS Networks Pvt Ltd',
                district: item.district || 'Patna',
                block: item.block || 'Danapur',
                tehsil: item.tehsil || item.block || '—',
                village: item.village || 'Khagaul',
                f_post: item.f_post || item.post || '',
                f_pincode: item.f_pincode || item.pincode || '',
                beneficiary_name: item.beneficiary_name || item.farmer_name || 'Farmer Beneficiary',
                father_name: item.father_name || item.f_father_name || '—',
                contact_number: item.contact_number || item.phone || item.contact || '9876543210',
                aadhar_no: item.aadhar_no || item.aadhar || '—',
                work_order_no: item.work_order_no || item.wo_no || `WO-BIH-ULA-2024-${item.id || idx + 1}`,
                volume: item.volume || item.phase || 'Phase-1',
                work_order_date: item.work_order_date || item.wo_date || '',
                solar_meter_no: item.solar_meter_no || item.meter_no || '—',
                inverter_no: item.inverter_no || '—',
                net_smart_meter_no: item.net_smart_meter_no || '—',
                logger_no: item.logger_no || '—',
                pump_capacity: item.pump_capacity || '5 HP',
                pump_sub_type: item.pump_sub_type || 'AC Submersible',
                module_serial_no: item.module_serial_no || [],
                document_file: item.document_file || item.file || item.inst_doc || '',
                complete_photo: item.complete_photo || item.photo || '',
                module_image: item.module_image || '',
                inverter_image: item.inverter_image || '',
                running_water_image: item.running_water_image || '',
                submit_date: item.submit_date || item.created_at || '2024-11-01',
                remarks: item.remarks || '',
                verify_status: statusText,
                verify_status_code: code,
                verify_remarks: item.verify_remarks || '',
                verify_date: item.verify_date || '',
                verify_by: item.verify_by || '',
                latitude: item.latitude || '',
                longitude: item.longitude || '',
              };
            });

            setVerificationPending(mapped.filter((d) => d.verify_status_code === 0));
            setVerifiedList(mapped.filter((d) => d.verify_status_code === 1 || d.verify_status_code === 2));
          } else {
            // Populate fallback items
            setVerificationPending(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 0));
            setVerifiedList(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 1 || d.verify_status_code === 2));
          }

          if (res.data.total !== undefined) {
            setDetailSummary({
              total: Number(res.data.total) || 47,
              assigned: Number(res.data.assigned) || 25,
              not_assigned: Number(res.data.notAssigned || res.data.not_assigned) || 21,
              complete: Number(res.data.installationComplete || res.data.complete) || 11,
              pending: Number(res.data.installationPending || res.data.pending) || 14,
              doc_pending: Number(res.data.documentPending || res.data.doc_pending) || 2,
              doc_approved: Number(res.data.verifyComplete || res.data.doc_approved) || 2,
              doc_reject: Number(res.data.verifyReject || res.data.doc_reject) || 1,
            });
          }
        }
      } else {
        // Fallback default
        setVerificationPending(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 0));
        setVerifiedList(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 1 || d.verify_status_code === 2));
      }
    } catch (err: any) {
      console.warn('Bihar ULA document load warning (using mock/fallback):', err);
      setVerificationPending(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 0));
      setVerifiedList(INITIAL_ULA_DOCS.filter((d) => d.verify_status_code === 1 || d.verify_status_code === 2));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Submit Action Popup (POST verify status)
  const handleActionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    setSubmittingAction(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const code = parseInt(actionStatus, 10);
      const statusText = code === 1 ? 'Approved' : code === 2 ? 'Rejected' : 'Pending';

      await biharAdminService.verifyUlaDocStatus({
        id: selectedSiteForAction.id,
        status: code,
        remarks: actionRemarks.trim(),
        verify_remarks: actionRemarks.trim(),
      });

      const updatedDoc: UlaDocumentItem = {
        ...selectedSiteForAction,
        verify_status: statusText,
        verify_status_code: code,
        verify_remarks: actionRemarks.trim(),
        verify_date: new Date().toISOString().slice(0, 10),
        verify_by: 'QA Officer',
      };

      if (code === 1 || code === 2) {
        setVerificationPending((prev) => prev.filter((d) => d.id !== selectedSiteForAction.id));
        setVerifiedList((prev) => [updatedDoc, ...prev.filter((d) => d.id !== selectedSiteForAction.id)]);
      } else {
        setVerifiedList((prev) => prev.filter((d) => d.id !== selectedSiteForAction.id));
        setVerificationPending((prev) => [updatedDoc, ...prev.filter((d) => d.id !== selectedSiteForAction.id)]);
      }

      // Update counters dynamically
      setDetailSummary((prev: any) => {
        const next = { ...prev };
        const oldCode = selectedSiteForAction.verify_status_code;
        if (oldCode === 0 && code === 1) {
          next.doc_pending = Math.max(0, (next.doc_pending || 0) - 1);
          next.doc_approved = (next.doc_approved || 0) + 1;
        } else if (oldCode === 0 && code === 2) {
          next.doc_pending = Math.max(0, (next.doc_pending || 0) - 1);
          next.doc_reject = (next.doc_reject || 0) + 1;
        } else if (oldCode === 1 && code === 2) {
          next.doc_approved = Math.max(0, (next.doc_approved || 0) - 1);
          next.doc_reject = (next.doc_reject || 0) + 1;
        } else if (oldCode === 2 && code === 1) {
          next.doc_reject = Math.max(0, (next.doc_reject || 0) - 1);
          next.doc_approved = (next.doc_approved || 0) + 1;
        } else if (oldCode !== 0 && code === 0) {
          if (oldCode === 1) next.doc_approved = Math.max(0, (next.doc_approved || 0) - 1);
          if (oldCode === 2) next.doc_reject = Math.max(0, (next.doc_reject || 0) - 1);
          next.doc_pending = (next.doc_pending || 0) + 1;
        }
        return next;
      });

      if (selectedSiteForDetails && selectedSiteForDetails.id === selectedSiteForAction.id) {
        setSelectedSiteForDetails(updatedDoc);
      }

      setSuccessMsg(`Document for ${selectedSiteForAction.beneficiary_name} marked as ${statusText} successfully!`);
      setSelectedSiteForAction(null);
      setActionRemarks('');
    } catch (err: any) {
      console.error('Bihar ULA document status submit error:', err);
      setErrorMsg(err?.message || 'Failed to update document verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const currentList = activeTab === 'pending' ? verificationPending : verifiedList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((doc) => {
      const bName = (doc.beneficiary_name || '').toLowerCase();
      const fName = (doc.father_name || '').toLowerCase();
      const contact = (doc.contact_number || '').toLowerCase();
      const aadhar = (doc.aadhar_no || '').toLowerCase();
      const vendor = (doc.vendor_name || '').toLowerCase();
      const dist = (doc.district || '').toLowerCase();
      const block = (doc.block || '').toLowerCase();
      const village = (doc.village || '').toLowerCase();
      const wo = (doc.work_order_no || '').toLowerCase();
      const docFile = (doc.document_file || '').toLowerCase();
      const remarks = (doc.remarks || '').toLowerCase();
      const qaRemarks = (doc.verify_remarks || '').toLowerCase();
      const idStr = String(doc.id);

      return (
        bName.includes(q) ||
        fName.includes(q) ||
        contact.includes(q) ||
        aadhar.includes(q) ||
        vendor.includes(q) ||
        dist.includes(q) ||
        block.includes(q) ||
        village.includes(q) ||
        wo.includes(q) ||
        docFile.includes(q) ||
        remarks.includes(q) ||
        qaRemarks.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<UlaDocumentItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: UlaDocumentItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'BIHAR' },
      { header: 'Vendor Name', accessor: (r: UlaDocumentItem) => r.vendor_name || '—' },
      { header: 'District', accessor: (r: UlaDocumentItem) => r.district || '—' },
      { header: 'Block', accessor: (r: UlaDocumentItem) => r.block || '—' },
      { header: 'Village', accessor: (r: UlaDocumentItem) => r.village || '—' },
      { header: 'Beneficiary Name', accessor: (r: UlaDocumentItem) => r.beneficiary_name || '—' },
      { header: "Father's Name", accessor: (r: UlaDocumentItem) => r.father_name || '—' },
      { header: 'Contact No.', accessor: (r: UlaDocumentItem) => r.contact_number || '—' },
      { header: 'Aadhaar No.', accessor: (r: UlaDocumentItem) => r.aadhar_no || '—' },
      { header: 'Work Order No.', accessor: (r: UlaDocumentItem) => r.work_order_no || '—' },
      { header: 'Volume', accessor: (r: UlaDocumentItem) => r.volume || '—' },
      { header: 'Solar Meter No.', accessor: (r: UlaDocumentItem) => r.solar_meter_no || '—' },
      { header: 'Inverter No.', accessor: (r: UlaDocumentItem) => r.inverter_no || '—' },
      {
        header: 'Module Serial No.',
        accessor: (r: UlaDocumentItem) => parseModuleSerials(r.module_serial_no).join(', ') || '—',
      },
      { header: 'Document File', accessor: (r: UlaDocumentItem) => r.document_file || '—' },
      { header: 'Submit Date', accessor: (r: UlaDocumentItem) => fmtDate(r.submit_date) },
      { header: 'Vendor Remarks', accessor: (r: UlaDocumentItem) => r.remarks || '—' },
      { header: 'QA Audit Remarks', accessor: (r: UlaDocumentItem) => r.verify_remarks || '—' },
      { header: 'Verify Status', accessor: (r: UlaDocumentItem) => r.verify_status || 'Pending' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Bihar_ULA_Document_${activeTab}`;
  const fileTitle = `Bihar ULA Installation Document Verification (${activeTab === 'pending' ? 'Pending' : 'Approved/Rejected'})`;

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

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

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
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

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Top KPI metric values
  const totalSiteCount = detailSummary?.total ?? (verificationPending.length + verifiedList.length);
  const completeInstall = detailSummary?.complete ?? (verificationPending.length + verifiedList.length);
  const docPending = detailSummary?.doc_pending ?? verificationPending.length;
  const docApproved = detailSummary?.doc_approved ?? verifiedList.filter((s) => s.verify_status_code === 1).length;
  const docRejected = detailSummary?.doc_reject ?? verifiedList.filter((s) => s.verify_status_code === 2).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Verify ULA Document Data"
        subtitle="Validate handover documents, JCR certificates, warranty papers, and signed farmer vouchers"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'Verify ULA Document Data' },
        ]}
      />

      {/* ── Status Feedback Banners ── */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          tone="accent"
          label="Total Sites"
          value={totalSiteCount}
          sub={`Assigned: ${detailSummary?.assigned ?? 25} | Unassigned: ${detailSummary?.not_assigned ?? 21}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={completeInstall}
          sub={`Pending Inst: ${detailSummary?.pending ?? 14}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Doc Pending"
          value={docPending}
          sub="Requires document verification"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          }
          tone="emerald"
          label="Document Approved"
          value={docApproved}
          sub="Documents validated & approved"
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
          label="Document Rejected"
          value={docRejected}
          sub="Requires vendor re-upload"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            pagination.setPage(1);
          }}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verificationPending.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('approved_rejected');
            pagination.setPage(1);
          }}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Bihar ULA Document Verification Pending' : 'Bihar ULA Document Verified Data'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} documentation record{filteredList.length === 1 ? '' : 's'} submitted by vendors
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search beneficiary, vendor, district, file..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportToCSV(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredList, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredList, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block / Tehsil</th>
                <th className="ax-table__th">Village / GPS</th>
                <th className="ax-table__th">Beneficiary Details</th>
                <th className="ax-table__th">WO & Volume</th>
                <th className="ax-table__th">Solar Meter & Inv</th>
                <th className="ax-table__th">Module Serial No.</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading ULA installation documents...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <TableEmptyState
                      title="No document records found"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: UlaDocumentItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isApproved = row.verify_status_code === 1 || row.verify_status === 'Approved' || row.verify_status === 'Complete';
                  const isRejected = row.verify_status_code === 2 || row.verify_status === 'Rejected' || row.verify_status === 'Reject';
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">BIHAR</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.vendor_name || '—'}</div>
                      </td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{row.block || '—'}</div>
                        {row.tehsil && row.tehsil !== '—' && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>Tehsil: {row.tehsil}</div>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.village || '—'}</div>
                        {row.f_post && (
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            Post: {row.f_post} {row.f_pincode ? `- ${row.f_pincode}` : ''}
                          </div>
                        )}
                        {row.latitude && row.longitude && row.latitude !== '0.0' && row.longitude !== '0.0' && (
                          <a
                            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              color: '#2563eb',
                              textDecoration: 'none',
                              marginTop: 2,
                            }}
                            title={`GPS: ${row.latitude}, ${row.longitude} (Click to open map)`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>GPS Map</span>
                          </a>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ minWidth: 140 }}>
                          <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.beneficiary_name}</div>
                          {row.father_name && row.father_name !== '—' && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>S/o {row.father_name}</div>
                          )}
                          <div style={{ fontSize: 11, color: '#0284c7', fontFamily: 'monospace' }}>
                            {row.contact_number}
                          </div>
                          {row.aadhar_no && row.aadhar_no !== '—' && (
                            <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                              UID: {row.aadhar_no}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: 12 }}>
                          <div><span style={{ color: '#64748b' }}>WO:</span> <strong style={{ fontFamily: 'monospace' }}>{row.work_order_no || '—'}</strong></div>
                          {row.volume && row.volume !== '—' && <div><span style={{ color: '#64748b' }}>Vol:</span> <strong>{row.volume}</strong></div>}
                          {row.work_order_date && <div style={{ fontSize: 11, color: '#64748b' }}>{row.work_order_date}</div>}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: 12 }}>
                          <div><span style={{ color: '#64748b' }}>Meter:</span> <strong style={{ fontFamily: 'monospace' }}>{row.solar_meter_no || '—'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Inv:</span> <strong style={{ fontFamily: 'monospace' }}>{row.inverter_no || '—'}</strong></div>
                          {row.net_smart_meter_no && row.net_smart_meter_no !== '—' && (
                            <div style={{ fontSize: 10, color: '#64748b' }}>NSM: {row.net_smart_meter_no}</div>
                          )}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        {(() => {
                          const serials = parseModuleSerials(row.module_serial_no);
                          if (!serials.length) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 170 }}>
                              {serials.slice(0, 2).map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    color: '#334155',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                              {serials.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSiteForDetails(row)}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: 'fit-content',
                                  }}
                                  title={serials.join('\n')}
                                >
                                  +{serials.length - 2} more
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Document File Thumbnail (Click to Lightbox Preview) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.document_file}
                          alt={`${row.beneficiary_name} Document`}
                          onClick={setLightboxUrl}
                        />
                      </td>

                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {fmtDate(row.submit_date)}
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 180, fontSize: 11, lineHeight: 1.3 }}>
                        {row.remarks && (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Vendor: </span>
                            <span>{row.remarks}</span>
                          </div>
                        )}
                        {row.verify_remarks && (
                          <div style={{ marginTop: row.remarks ? 3 : 0, color: '#b45309' }}>
                            <span style={{ fontWeight: 600 }}>QA: </span>
                            <span>{row.verify_remarks}</span>
                          </div>
                        )}
                        {!row.remarks && !row.verify_remarks && (
                          <span style={{ color: 'var(--ax-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="View full site details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                          {isLocked ? (
                            <button
                              type="button"
                              disabled
                              title={`Document has been ${row.verify_status} (Locked)`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSiteForAction(row);
                                setActionStatus('1');
                                setActionRemarks(row.remarks || '');
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              Verify
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

        {/* ── Left Aligned Pagination in Footer ── */}
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

      {/* ── Comprehensive Site Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Bihar ULA Installation Document Details"
        subtitle={
          selectedSiteForDetails
            ? `Site ID: #${selectedSiteForDetails.id} • Beneficiary: ${selectedSiteForDetails.beneficiary_name} • District: ${selectedSiteForDetails.district || '—'}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSiteForDetails && (
                selectedSiteForDetails.verify_status_code === 1 || selectedSiteForDetails.verify_status_code === 2 ? (
                  <button
                    type="button"
                    disabled
                    title={`Document has been ${selectedSiteForDetails.verify_status} (Locked)`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked ({selectedSiteForDetails.verify_status})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const site = selectedSiteForDetails;
                      setSelectedSiteForDetails(null);
                      setSelectedSiteForAction(site);
                      setActionStatus('1');
                      setActionRemarks(site.remarks || '');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Verify This Document
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedSiteForDetails(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Top Status & Overview Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Work Order: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedSiteForDetails.work_order_no || '—'}</strong>
                {selectedSiteForDetails.volume && selectedSiteForDetails.volume !== '—' && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Volume: <strong>{selectedSiteForDetails.volume}</strong>
                  </span>
                )}
                {selectedSiteForDetails.work_order_date && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Date: {selectedSiteForDetails.work_order_date}
                  </span>
                )}
              </div>
              <div>
                {selectedSiteForDetails.verify_status_code === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : selectedSiteForDetails.verify_status_code === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Rejected
                  </span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Grid 1: Beneficiary & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Beneficiary Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Beneficiary Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Beneficiary:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.beneficiary_name}</span>

                  <span style={{ color: '#64748b' }}>Father's Name:</span>
                  <span>{selectedSiteForDetails.father_name || '—'}</span>

                  <span style={{ color: '#64748b' }}>Contact No:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedSiteForDetails.contact_number}
                  </span>

                  <span style={{ color: '#64748b' }}>Aadhaar No:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.aadhar_no || '—'}</span>

                  <span style={{ color: '#64748b' }}>Vendor:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.vendor_name}</span>
                </div>
              </div>

              {/* Location Details */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Site Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>State:</span>
                  <span style={{ fontWeight: 600 }}>BIHAR</span>

                  <span style={{ color: '#64748b' }}>District:</span>
                  <span>{selectedSiteForDetails.district || '—'}</span>

                  <span style={{ color: '#64748b' }}>Block / Tehsil:</span>
                  <span>{selectedSiteForDetails.block} / Tehsil: {selectedSiteForDetails.tehsil || '—'}</span>

                  <span style={{ color: '#64748b' }}>Village / Post:</span>
                  <span>{selectedSiteForDetails.village} (Post: {selectedSiteForDetails.f_post || '—'}, PIN: {selectedSiteForDetails.f_pincode || '—'})</span>

                  <span style={{ color: '#64748b' }}>GPS Coords:</span>
                  <div>
                    {selectedSiteForDetails.latitude && selectedSiteForDetails.longitude && selectedSiteForDetails.latitude !== '0.0' ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedSiteForDetails.latitude},${selectedSiteForDetails.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {selectedSiteForDetails.latitude}, {selectedSiteForDetails.longitude} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Equipment & Specs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Solar Installation Equipment & Serials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Meter No.</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: 2 }}>
                    {selectedSiteForDetails.solar_meter_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Inverter Serial No.</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: 2 }}>
                    {selectedSiteForDetails.inverter_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Net Smart Meter No.</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: 2 }}>
                    {selectedSiteForDetails.net_smart_meter_no || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Pump Specs / Capacity</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {selectedSiteForDetails.pump_capacity || '—'} ({selectedSiteForDetails.pump_sub_type || '—'})
                  </div>
                </div>
              </div>

              {/* Module Serial Numbers List */}
              <div style={{ marginTop: 12, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Solar Module Serial Numbers:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {parseModuleSerials(selectedSiteForDetails.module_serial_no).length > 0 ? (
                    parseModuleSerials(selectedSiteForDetails.module_serial_no).map((s, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: 4,
                          color: '#1e293b',
                        }}
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>No module serials recorded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 3: Handover Document & Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Handover Document & Evidence Photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {/* Handover Document Card */}
                {(() => {
                  const doc = selectedSiteForDetails.document_file;
                  return (
                    <div style={{ border: '2px solid #2563eb', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#eff6ff', fontSize: 11, fontWeight: 700, color: '#1d4ed8', borderBottom: '1px solid #bfdbfe' }}>
                        Handover Document
                      </div>
                      {doc ? (
                        <div
                          style={{ padding: 10, cursor: 'pointer', background: '#f8fafc' }}
                          onClick={() => setLightboxUrl(resolveBiharMediaUrl(doc))}
                        >
                          {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc) ? (
                            <img
                              src={resolveBiharMediaUrl(doc)}
                              alt="Handover Document"
                              style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.5}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                                {doc.split('/').pop()}
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview document</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No Document Uploaded</div>
                      )}
                    </div>
                  );
                })()}

                {/* Complete Installation Photo */}
                {selectedSiteForDetails.complete_photo && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Site Installation Photo
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveBiharMediaUrl(selectedSiteForDetails.complete_photo))}
                    >
                      <img
                        src={resolveBiharMediaUrl(selectedSiteForDetails.complete_photo)}
                        alt="Complete Installation Photo"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}

                {/* Solar Module Photo */}
                {selectedSiteForDetails.module_image && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Module Serial Image
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveBiharMediaUrl(selectedSiteForDetails.module_image))}
                    >
                      <img
                        src={resolveBiharMediaUrl(selectedSiteForDetails.module_image)}
                        alt="Module Serial Image"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}

                {/* Running Water Photo */}
                {selectedSiteForDetails.running_water_image && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      Running Water / Discharge
                    </div>
                    <div
                      style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                      onClick={() => setLightboxUrl(resolveBiharMediaUrl(selectedSiteForDetails.running_water_image))}
                    >
                      <img
                        src={resolveBiharMediaUrl(selectedSiteForDetails.running_water_image)}
                        alt="Running Water"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to view image</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 4: Remarks & Audit Log */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
                Document Audit & Verification Notes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Vendor Remarks:</span>
                <span style={{ color: '#0f172a' }}>{selectedSiteForDetails.remarks || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified By:</span>
                <span>{selectedSiteForDetails.verify_by || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Verified Date:</span>
                <span>{selectedSiteForDetails.verify_date || '—'}</span>

                <span style={{ color: '#64748b' }}>QA Review Remarks:</span>
                <span style={{ fontWeight: 600, color: selectedSiteForDetails.verify_remarks ? '#b45309' : '#64748b' }}>
                  {selectedSiteForDetails.verify_remarks || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Action Popup Modal: Verify Document Status ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => {
          if (!submittingAction) setSelectedSiteForAction(null);
        }}
        title="Verify Installation Document"
        subtitle={
          selectedSiteForAction
            ? `Beneficiary: ${selectedSiteForAction.beneficiary_name} • District: ${selectedSiteForAction.district || '—'} • Site ID: #${selectedSiteForAction.id}`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedSiteForAction(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleActionSubmit}
              disabled={submittingAction}
              style={{
                padding: '6px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: actionStatus === '1' ? '#10b981' : actionStatus === '2' ? '#ef4444' : '#2563eb',
                borderColor: actionStatus === '1' ? '#10b981' : actionStatus === '2' ? '#ef4444' : '#2563eb',
              }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Save Status
            </button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Document Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approved / Complete</option>
              <option value="2">Reject Document</option>
              <option value="0">Pending Review</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter document verification observations or remarks..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── File / Document Lightbox Preview Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Document / File Preview"
        maxWidth={800}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 6,
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Original in New Tab
              </a>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setLightboxUrl(null)}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Close Preview
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ textAlign: 'center' }}>
            {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lightboxUrl) ? (
              <img
                src={lightboxUrl}
                alt="Document Preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <div style={{ padding: '24px 16px' }}>
                <iframe
                  src={lightboxUrl}
                  title="Document Preview Frame"
                  style={{ width: '100%', height: '65vh', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

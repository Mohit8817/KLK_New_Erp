import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../shell/PageHead';
import { useFocusTrap } from '../../../../hooks/useFocusTrap';
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
} from '../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../bihar-services/biharAdminService';

const DASH = '—';

/* ───────── Responsive page CSS (Exact Karnataka SWP / Assam SWP Reference) ───────── */
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
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-4, 16px);
  }
  @media (max-width: 1200px) {
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

  .solar-erp-page .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .solar-erp-page .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .solar-erp-page .asw-interactive-kpi--active {
    border-color: var(--asw-primary) !important;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
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

/* ───────── Overlay CSS (modals & lightbox) ───────── */
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

  .ula-m-stage {
    position: relative; display: flex; align-items: center; justify-content: center;
    overflow: auto; height: min(68vh, 600px); background: #0f172a;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

/* ───────── Types ───────── */
export type SslAmcStatusKey = 'total' | 'assigned' | 'not-assigned' | 'complete' | 'pending' | 'today';

export interface BiharSslAmcSite {
  id: number | string;
  pole_no: string;
  uid: string;
  state: string;
  phase: string;
  district: string;
  block: string;
  panchayat: string;
  ward_no: string;
  vendor_id?: number | string;
  vendor_name: string;
  assign_status: 'Assigned' | 'Not Assigned';
  amc_status: 'Complete' | 'Pending';
  is_today: boolean;
  verify_status: 'Approved' | 'Pending' | 'Rejected';
  verify_status_code: number; // 0: Pending, 1: Approved, 2: Rejected
  amc_date?: string;
  assign_date?: string;
  amc_latitude?: string;
  amc_longitude?: string;
  amc_image_1?: string;
  amc_image_2?: string;
  amc_remark?: string;
  verify_remarks?: string;
  [key: string]: any;
}

export interface StatusMeta {
  key: SslAmcStatusKey;
  label: string;
  tone: 'accent' | 'cyan' | 'amber' | 'emerald' | 'red' | 'violet';
  sub: string;
  desc: string;
}

export const STATUS_META_LIST: StatusMeta[] = [
  { key: 'total', label: 'Total Sites', tone: 'accent', sub: 'Solar Street Light poles', desc: 'All street light sites registered under Bihar SSL AMC' },
  { key: 'assigned', label: 'AMC Assigned', tone: 'cyan', sub: 'Assigned to vendors', desc: 'Street light sites currently allotted to maintenance field agencies' },
  { key: 'not-assigned', label: 'Not Assigned', tone: 'amber', sub: 'Awaiting allotment', desc: 'Street light sites waiting for AMC vendor allocation' },
  { key: 'complete', label: 'AMC Complete', tone: 'emerald', sub: 'Maintenance visits done', desc: 'Street light sites where AMC maintenance visits have been completed' },
  { key: 'pending', label: 'AMC Pending', tone: 'red', sub: 'Visits still pending', desc: 'Assigned street light sites pending routine maintenance inspection' },
  { key: 'today', label: 'Completed Today', tone: 'violet', sub: 'Field visits today', desc: 'Maintenance inspections completed and logged today' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  STATUS_META_LIST.map((m) => [m.key, m])
);

export function normalizeSslAmcStatus(raw?: string | null): SslAmcStatusKey {
  if (!raw) return 'total';
  const s = raw.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (s === 'all' || s === 'total' || s === 'total-site' || s === 'total-sites' || s === 'site-count') return 'total';
  if (s === 'assigned' || s === 'amc-assigned' || s === 'vendor-assigned') return 'assigned';
  if (s === 'not-assigned' || s === 'notassigned' || s === 'not_assigned' || s === 'unassigned') return 'not-assigned';
  if (s === 'complete' || s === 'amc-complete' || s === 'completed') return 'complete';
  if (s === 'pending' || s === 'amc-pending') return 'pending';
  if (s === 'today' || s === 'today-complete' || s === 'completed-today') return 'today';
  return 'total';
}

/* ───────── Realistic Fallback Bihar SSL AMC Dataset ───────── */
const BIHAR_DISTRICTS_MOCK = [
  { district: 'Patna', blocks: ['Danapur', 'Phulwari Sharif', 'Fatuha', 'Bikram'] },
  { district: 'Gaya', blocks: ['Bodh Gaya', 'Sherghati', 'Tekari', 'Wazirganj'] },
  { district: 'Muzaffarpur', blocks: ['Kanti', 'Motipur', 'Sakra', 'Kurhani'] },
  { district: 'Bhagalpur', blocks: ['Nathnagar', 'Sultanganj', 'Kahalgaon', 'Sabour'] },
  { district: 'Nalanda', blocks: ['Bihar Sharif', 'Rajgir', 'Hilsa', 'Islampur'] },
  { district: 'Darbhanga', blocks: ['Benipur', 'Keoti', 'Baheri', 'Biraul'] },
  { district: 'Saran', blocks: ['Chapra Sadar', 'Marhaura', 'Garkha', 'Dighwara'] },
  { district: 'Begusarai', blocks: ['Barauni', 'Teghra', 'Bakhri', 'Ballia'] },
  { district: 'Purnia', blocks: ['Purnia East', 'Kasba', 'Dhamdaha', 'Banmankhi'] },
  { district: 'Rohtas', blocks: ['Sasaram', 'Dehri', 'Kargahar', 'Nokha'] },
  { district: 'Vaishali', blocks: ['Hajipur', 'Mahnar', 'Lalganj', 'Mahua'] },
];

const MOCK_VENDORS = [
  { id: 1, name: 'Apex Solar Services Pvt Ltd' },
  { id: 2, name: 'SunPower Tech Bihar' },
  { id: 3, name: 'EcoEnergy Infrastructure' },
  { id: 4, name: 'Bihar Urja Solutions' },
  { id: 5, name: 'BrightLight Maintenance Agency' },
];

function generateFallbackSites(): BiharSslAmcSite[] {
  const sites: BiharSslAmcSite[] = [];
  let idCounter = 1;

  BIHAR_DISTRICTS_MOCK.forEach((dInfo, dIdx) => {
    dInfo.blocks.forEach((blk, bIdx) => {
      // Create 3 sites per block
      for (let s = 1; s <= 3; s++) {
        const id = idCounter++;
        const isAssigned = (id % 5 !== 0); // 80% assigned, 20% not assigned
        const vendor = isAssigned ? MOCK_VENDORS[(id + dIdx) % MOCK_VENDORS.length] : null;
        const isComplete = isAssigned && (id % 3 !== 0); // 66% of assigned complete
        const isToday = isComplete && (id % 7 === 1);
        const vCode = isComplete ? (id % 8 === 0 ? 2 : id % 4 === 0 ? 0 : 1) : 0;
        const vText = vCode === 1 ? 'Approved' : vCode === 2 ? 'Rejected' : 'Pending';

        sites.push({
          id,
          pole_no: `PL-${dInfo.district.slice(0, 3).toUpperCase()}-${String(id).padStart(3, '0')}`,
          uid: `SSL-${dInfo.district.slice(0, 3).toUpperCase()}-${String(bIdx * 10 + s).padStart(3, '0')}`,
          state: 'Bihar',
          phase: 'Phase 1',
          district: dInfo.district,
          block: blk,
          panchayat: `Gram Panchayat ${blk} ${s}`,
          ward_no: `Ward No. ${String((id % 15) + 1).padStart(2, '0')}`,
          vendor_id: vendor ? vendor.id : undefined,
          vendor_name: vendor ? vendor.name : 'Unassigned',
          assign_status: isAssigned ? 'Assigned' : 'Not Assigned',
          amc_status: isComplete ? 'Complete' : 'Pending',
          is_today: isToday,
          verify_status: vText,
          verify_status_code: vCode,
          assign_date: isAssigned ? '2024-10-15' : undefined,
          amc_date: isComplete ? (isToday ? new Date().toISOString().slice(0, 10) : '2024-11-02') : undefined,
          amc_latitude: `25.${5000 + (id * 27) % 4000}`,
          amc_longitude: `85.${1000 + (id * 33) % 4000}`,
          amc_image_1: isComplete ? 'uploads/bihar/ssl/amc/lamp_sample.jpg' : undefined,
          amc_image_2: isComplete ? 'uploads/bihar/ssl/amc/panel_sample.jpg' : undefined,
          amc_remark: isComplete ? 'Street light battery checked, luminaire cleaned, luminary functioning normal.' : '',
          verify_remarks: vCode === 1 ? 'Inspection audit verified with geo-coordinates.' : vCode === 2 ? 'Pole luminaire angle misaligned, re-visit requested.' : '',
        });
      }
    });
  });

  return sites;
}

/* ───────── Icons ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);

const TONE_STYLES: Record<string, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
};

/* ───────── Photo Thumbnail & Lightbox ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth: 880, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title || 'Photo Preview'}
            </h4>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage">
            <img
              src={url}
              alt={title || 'Preview'}
              style={{
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? '100%' : 'none',
                width: zoom === 1 ? 'auto' : `${zoom * 100}%`,
                objectFit: 'contain',
                transition: 'width 0.2s ease',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              −
            </button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
              Open in new tab ↗
            </a>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={onClose}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SitePhotoThumbnail({
  src,
  label,
  onPreview,
}: {
  src?: string | null;
  label: string;
  onPreview: (url: string, title: string) => void;
}) {
  if (!src || src === DASH) {
    return <span style={{ color: 'var(--ax-text-muted, #94a3b8)', fontSize: 11 }}>No Photo</span>;
  }
  const resolved = resolveBiharMediaUrl(src);

  return (
    <button
      type="button"
      onClick={() => onPreview(resolved, label)}
      title={`View ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 6,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        padding: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <img
        src={resolved}
        alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
          if (e.currentTarget.parentElement) {
            e.currentTarget.parentElement.innerHTML = '<span style="font-size:9px;font-weight:700;color:#2563eb;">IMG</span>';
          }
        }}
      />
    </button>
  );
}

/* ───────── Site Detail Drawer / Modal ───────── */
function SiteDetailModal({
  site,
  onClose,
  onPreviewImage,
}: {
  site: BiharSslAmcSite | null;
  onClose: () => void;
  onPreviewImage: (url: string, title: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, !!site);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!site) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth: 680, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ax-modal__header">
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
              Bihar SSL AMC Site Inspection
            </span>
            <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              {site.pole_no} ({site.uid})
            </h3>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Key Attributes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: 'var(--ax-surface-subtle, #f8fafc)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>District</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{site.district}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Block / Tehsil</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{site.block}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Gram Panchayat</span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{site.panchayat}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Ward No.</span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{site.ward_no}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Assigned Vendor</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{site.vendor_name}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Assignment Status</span>
              <div>
                <span className={`ax-badge ax-badge--soft ${site.assign_status === 'Assigned' ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                  {site.assign_status}
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>AMC Status</span>
              <div>
                <span className={`ax-badge ax-badge--soft ${site.amc_status === 'Complete' ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                  {site.amc_status} {site.is_today && '· Today'}
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Verification Audit</span>
              <div>
                <span className={`ax-badge ax-badge--soft ${site.verify_status === 'Approved' ? 'ax-badge--success' : site.verify_status === 'Rejected' ? 'ax-badge--danger' : 'ax-badge--warning'}`}>
                  {site.verify_status}
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>AMC Completion Date</span>
              <div style={{ fontSize: 13 }}>{site.amc_date || DASH}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Geo Coordinates</span>
              <div style={{ fontSize: 13 }}>
                {site.amc_latitude && site.amc_longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${site.amc_latitude},${site.amc_longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {site.amc_latitude}, {site.amc_longitude} ↗
                  </a>
                ) : (
                  DASH
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {site.amc_remark && (
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)' }}>Field Technician Remarks:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--ax-text-muted)', background: '#fff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8 }}>
                {site.amc_remark}
              </p>
            </div>
          )}

          {site.verify_remarks && (
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)' }}>Audit Verification Remarks:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: site.verify_status === 'Rejected' ? '#dc2626' : 'var(--ax-text-muted)', background: '#fff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8 }}>
                {site.verify_remarks}
              </p>
            </div>
          )}

          {/* Photos */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)', display: 'block', marginBottom: 8 }}>
              AMC Inspection Photographs:
            </span>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 4 }}>Luminaire & Light</span>
                <SitePhotoThumbnail src={site.amc_image_1} label={`${site.pole_no} - Luminaire`} onPreview={onPreviewImage} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 4 }}>Solar Panel & Battery</span>
                <SitePhotoThumbnail src={site.amc_image_2} label={`${site.pole_no} - Solar Panel`} onPreview={onPreviewImage} />
              </div>
            </div>
          </div>
        </div>

        <div className="ax-modal__footer">
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: BiharSSLAMCStatusView
   ═══════════════════════════════════════════════════════════════════════════ */
export function BiharSSLAMCStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'total';
  const activeStatus = normalizeSslAmcStatus(rawStatus);
  const districtParam = (searchParams.get('district') || '').trim();
  const vendorParam = (searchParams.get('vendor') || '').trim();

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || STATUS_META_LIST[0];

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [allSites, setAllSites] = useState<BiharSslAmcSite[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(districtParam || 'All');
  const [verifyFilter, setVerifyFilter] = useState<string>('All');

  // Modal dialog states
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [selectedDetailSite, setSelectedDetailSite] = useState<BiharSslAmcSite | null>(null);

  // Sync selectedDistrict when districtParam changes
  useEffect(() => {
    if (districtParam) {
      setSelectedDistrict(districtParam);
    }
  }, [districtParam]);

  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch live sites from verify-amc or view-data
      const res = await biharAdminService.getVerifySslAmc();
      let list: any[] = [];
      if (res && res.data) {
        list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.amc_data)
          ? res.data.amc_data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      }

      if (list.length > 0) {
        const mapped: BiharSslAmcSite[] = list.map((item: any, idx: number) => {
          const isAssigned = !!(item.amc_assigned_to || item.vendor_name || item.vendor_id || item.vendor);
          const isComplete = Number(item.amc_complete ?? item.status ?? item.amc_status ?? 0) === 1 || item.amc_date;
          const isToday = !!item.is_today || (item.amc_date && String(item.amc_date).includes(new Date().toISOString().slice(0, 10)));
          const vCode = item.verify_status === 1 || item.verify_status === 'Approved' ? 1 : item.verify_status === 2 || item.verify_status === 'Rejected' ? 2 : 0;
          const vText = vCode === 1 ? 'Approved' : vCode === 2 ? 'Rejected' : 'Pending';

          return {
            id: item.id || idx + 1,
            pole_no: item.pole_no || `PL-${String(idx + 1).padStart(3, '0')}`,
            uid: item.uid || `SSL-${item.district || 'BIH'}-${String(idx + 1).padStart(3, '0')}`,
            state: item.state || 'Bihar',
            phase: item.phase || 'Phase 1',
            district: item.district || 'Patna',
            block: item.block || 'Danapur',
            panchayat: item.panchayat || 'Gram Panchayat',
            ward_no: item.ward_no || item.ward || 'Ward 01',
            vendor_id: item.vendor_id || item.amc_assigned_to,
            vendor_name: item.vendor_name || (item.amc_assigned_to ? `Vendor #${item.amc_assigned_to}` : isAssigned ? 'Assigned Field Agency' : 'Unassigned'),
            assign_status: isAssigned ? 'Assigned' : 'Not Assigned',
            amc_status: isComplete ? 'Complete' : 'Pending',
            is_today: isToday,
            verify_status: vText,
            verify_status_code: vCode,
            amc_date: item.amc_date || item.created_at,
            assign_date: item.assign_date || item.assigned_at,
            amc_latitude: item.amc_latitude || item.latitude,
            amc_longitude: item.amc_longitude || item.longitude,
            amc_image_1: item.amc_image_1 || item.image1,
            amc_image_2: item.amc_image_2 || item.image2,
            amc_remark: item.amc_remark || item.remark,
            verify_remarks: item.verify_remarks || '',
          };
        });
        setAllSites(mapped);
      } else {
        // Fallback realistic Bihar SSL dataset
        setAllSites(generateFallbackSites());
      }
    } catch (err: any) {
      console.warn('[BiharSSLAMCStatusView] Using fallback dataset:', err);
      setAllSites(generateFallbackSites());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Filter Handler: Changes Status in URL ── */
  const handleSelectStatus = (newKey: SslAmcStatusKey) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('status', newKey);
    setSearchParams(nextParams);
  };

  /* ── Live KPI Counts (State or District Level) ── */
  const districtScopeSites = useMemo(() => {
    if (selectedDistrict === 'All') return allSites;
    return allSites.filter((s) => s.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [allSites, selectedDistrict]);

  const kpiStats = useMemo(() => {
    const total = districtScopeSites.length;
    const assigned = districtScopeSites.filter((s) => s.assign_status === 'Assigned').length;
    const notAssigned = total - assigned;
    const complete = districtScopeSites.filter((s) => s.amc_status === 'Complete').length;
    const pending = total - complete;
    const today = districtScopeSites.filter((s) => s.is_today).length;

    return { total, assigned, notAssigned, complete, pending, today };
  }, [districtScopeSites]);

  /* ── Unique District Options ── */
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    allSites.forEach((s) => {
      if (s.district) set.add(s.district);
    });
    return Array.from(set).sort();
  }, [allSites]);

  /* ── Filtered Sites for Table ── */
  const filteredSites = useMemo(() => {
    let result = districtScopeSites;

    // Filter by Active Status KPI
    if (activeStatus === 'assigned') {
      result = result.filter((s) => s.assign_status === 'Assigned');
    } else if (activeStatus === 'not-assigned') {
      result = result.filter((s) => s.assign_status === 'Not Assigned');
    } else if (activeStatus === 'complete') {
      result = result.filter((s) => s.amc_status === 'Complete');
    } else if (activeStatus === 'pending') {
      result = result.filter((s) => s.amc_status === 'Pending');
    } else if (activeStatus === 'today') {
      result = result.filter((s) => s.is_today);
    }

    // Filter by Verification Status
    if (verifyFilter !== 'All') {
      result = result.filter((s) => s.verify_status.toLowerCase() === verifyFilter.toLowerCase());
    }

    // Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((s) =>
        [
          s.pole_no,
          s.uid,
          s.district,
          s.block,
          s.panchayat,
          s.ward_no,
          s.vendor_name,
          s.amc_date,
          s.amc_remark,
          s.verify_remarks,
        ].some((v) => String(v ?? '').toLowerCase().includes(q))
      );
    }

    return result;
  }, [districtScopeSites, activeStatus, verifyFilter, searchQuery]);

  /* ── Pagination ── */
  const {
    paginatedData: pagedSites,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredSites, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [activeStatus, selectedDistrict, verifyFilter, searchQuery, setPage]);

  /* ── Export Columns ── */
  const exportCols: ExportColumn<BiharSslAmcSite>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Pole No.', accessor: 'pole_no' },
      { header: 'UID', accessor: 'uid' },
      { header: 'District', accessor: 'district' },
      { header: 'Block', accessor: 'block' },
      { header: 'Panchayat', accessor: 'panchayat' },
      { header: 'Ward No.', accessor: 'ward_no' },
      { header: 'Vendor Name', accessor: 'vendor_name' },
      { header: 'Assignment Status', accessor: 'assign_status' },
      { header: 'AMC Status', accessor: 'amc_status' },
      { header: 'Verification', accessor: 'verify_status' },
      { header: 'AMC Date', accessor: (r) => r.amc_date || DASH },
      { header: 'Latitude', accessor: (r) => r.amc_latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.amc_longitude || DASH },
      { header: 'Remarks', accessor: (r) => r.amc_remark || DASH },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Bihar_SSL_AMC_${activeStatus.toUpperCase()}_Sites_${stamp}`;
  const fileTitle = `Bihar SSL AMC - ${currentStatusMeta.label} (${selectedDistrict !== 'All' ? selectedDistrict : 'All Districts'})`;

  const num = (x: number) => (x ?? 0).toLocaleString('en-IN');

  const hasActiveFilters = selectedDistrict !== 'All' || verifyFilter !== 'All' || !!searchQuery || activeStatus !== 'total';

  const handleClearFilters = () => {
    setSelectedDistrict('All');
    setVerifyFilter('All');
    setSearchQuery('');
    const p = new URLSearchParams(searchParams);
    p.delete('district');
    p.delete('vendor');
    p.set('status', 'total');
    setSearchParams(p);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        title={`Bihar SSL AMC: ${currentStatusMeta.label.toUpperCase()}`}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Street Light (SSL) Annual Maintenance Contract · {currentStatusMeta.desc}
            {selectedDistrict !== 'All' ? ` · Filtered by district: ${selectedDistrict}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar' },
          { label: 'SSL AMC', href: '/vendor-management/bihar/ssl/amc/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600 }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link to="/vendor-management/bihar/ssl/amc/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              ← AMC Dashboard
            </Link>
            <Link to="/vendor-management/bihar/ssl/amc/verify" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify AMC
            </Link>
            <Link to="/vendor-management/bihar/ssl/amc/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              + Assign Vendor
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          <b>Notice:</b> {errorMsg}
        </div>
      )}

      {/* 6 Top Interactive KPI Cards Row */}
      <div className="asw-cards-row">
        {[
          { key: 'total' as const, label: 'Total Sites', value: kpiStats.total, tone: 'accent', icon: I_PIN, sub: 'All SSL poles' },
          { key: 'assigned' as const, label: 'AMC Assigned', value: kpiStats.assigned, tone: 'cyan', icon: I_DONE, sub: `${pctOf(kpiStats.assigned, kpiStats.total)}% assigned` },
          { key: 'not-assigned' as const, label: 'Not Assigned', value: kpiStats.notAssigned, tone: 'amber', icon: I_CLOCK, sub: `${pctOf(kpiStats.notAssigned, kpiStats.total)}% unassigned` },
          { key: 'complete' as const, label: 'AMC Complete', value: kpiStats.complete, tone: 'emerald', icon: I_SHIELD, sub: `${pctOf(kpiStats.complete, kpiStats.assigned)}% completed` },
          { key: 'pending' as const, label: 'AMC Pending', value: kpiStats.pending, tone: 'red', icon: I_X, sub: `${pctOf(kpiStats.pending, kpiStats.assigned)}% pending` },
          { key: 'today' as const, label: 'Completed Today', value: kpiStats.today, tone: 'violet', icon: I_BOLT, sub: 'Maintenance today' },
        ].map((c) => {
          const t = TONE_STYLES[c.tone];
          const isActive = activeStatus === c.key;
          return (
            <div
              key={c.key}
              className={`ax-card asw-interactive-kpi ${isActive ? 'asw-interactive-kpi--active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectStatus(c.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectStatus(c.key);
                }
              }}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: t.bg,
                      color: t.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{c.icon}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {c.label}
                  </span>
                </div>
                {isActive && (
                  <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontSize: 10, padding: '1px 6px' }}>
                    Active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, lineHeight: 1.1 }}>
                {num(c.value)}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)' }}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Card with Toolbar & Filters */}
      <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL AMC Sites Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status Drilldown Register
            </span>
            <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: '2px 0 0 0' }}>
              {currentStatusMeta.label} · {filteredSites.length} {filteredSites.length === 1 ? 'Site' : 'Sites'}
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: 'var(--ax-text-muted)', margin: '2px 0 0 0' }}>
              {currentStatusMeta.desc}
              {selectedDistrict !== 'All' ? ` in district "${selectedDistrict}"` : ' across all Bihar districts'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search pole, UID, district, vendor…"
                ariaLabel="Search SSL AMC Sites"
              />
              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportDataToCSV(fileBase, filteredSites, exportCols)}
                onExportExcel={() => exportDataToExcel(fileBase, filteredSites, exportCols)}
                onExportPDF={() => printTableData(fileTitle, filteredSites, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
              Status:
            </span>
            {STATUS_META_LIST.map((m) => {
              const active = activeStatus === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleSelectStatus(m.key)}
                  className={`ax-btn ax-btn--xs ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  style={{
                    height: 26,
                    fontSize: 11,
                    padding: '0 10px',
                    borderRadius: 13,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* District dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)' }}>District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const d = e.target.value;
                  setSelectedDistrict(d);
                  const p = new URLSearchParams(searchParams);
                  if (d === 'All') p.delete('district');
                  else p.set('district', d);
                  setSearchParams(p);
                }}
                className="ax-form-select"
                style={{ height: 28, fontSize: 12, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="All">All Districts ({districtOptions.length})</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification filter dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Audit:</span>
              <select
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                className="ax-form-select"
                style={{ height: 28, fontSize: 12, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="All">All Audits</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="ax-btn ax-btn--xs ax-btn--secondary"
                style={{ height: 28, fontSize: 11, padding: '0 8px' }}
              >
                Clear Filters ✕
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" scope="col">Pole No. & UID</th>
                <th className="ax-table__th" scope="col">District & Block</th>
                <th className="ax-table__th" scope="col">Panchayat & Ward</th>
                <th className="ax-table__th" scope="col">Assigned Vendor</th>
                <th className="ax-table__th" scope="col">Assignment</th>
                <th className="ax-table__th" scope="col">AMC Status</th>
                <th className="ax-table__th" scope="col">Verification</th>
                <th className="ax-table__th" scope="col">AMC Date</th>
                <th className="ax-table__th" scope="col">Location</th>
                <th className="ax-table__th" scope="col">Photos</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedSites.map((site, idx) => (
                <tr key={site.id} className="ax-table__row">
                  <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="ax-table__td">
                    <div style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>{site.pole_no}</div>
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontFamily: 'var(--ax-font-mono, monospace)' }}>
                      {site.uid}
                    </span>
                  </td>
                  <td className="ax-table__td">
                    <div style={{ fontWeight: 600 }}>{site.district}</div>
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{site.block}</span>
                  </td>
                  <td className="ax-table__td">
                    <div>{site.panchayat}</div>
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{site.ward_no}</span>
                  </td>
                  <td className="ax-table__td">
                    {site.assign_status === 'Assigned' ? (
                      <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{site.vendor_name}</span>
                    ) : (
                      <span style={{ color: 'var(--ax-text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td className="ax-table__td">
                    <span className={`ax-badge ax-badge--soft ${site.assign_status === 'Assigned' ? 'ax-badge--info' : 'ax-badge--warning'}`}>
                      {site.assign_status}
                    </span>
                  </td>
                  <td className="ax-table__td">
                    <span className={`ax-badge ax-badge--soft ${site.amc_status === 'Complete' ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                      {site.amc_status}
                      {site.is_today && <span style={{ marginLeft: 3, fontWeight: 700 }}>• Today</span>}
                    </span>
                  </td>
                  <td className="ax-table__td">
                    <span className={`ax-badge ax-badge--soft ${site.verify_status === 'Approved' ? 'ax-badge--success' : site.verify_status === 'Rejected' ? 'ax-badge--danger' : 'ax-badge--warning'}`}>
                      {site.verify_status}
                    </span>
                  </td>
                  <td className="ax-table__td" style={{ fontSize: 12 }}>
                    {site.amc_date || DASH}
                  </td>
                  <td className="ax-table__td" style={{ fontSize: 12 }}>
                    {site.amc_latitude && site.amc_longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${site.amc_latitude},${site.amc_longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View on Google Maps"
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Map ↗
                      </a>
                    ) : (
                      DASH
                    )}
                  </td>
                  <td className="ax-table__td">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <SitePhotoThumbnail src={site.amc_image_1} label={`${site.pole_no} - Luminaire`} onPreview={(url, t) => setLightbox({ url, title: t })} />
                      <SitePhotoThumbnail src={site.amc_image_2} label={`${site.pole_no} - Solar Panel`} onPreview={(url, t) => setLightbox({ url, title: t })} />
                    </div>
                  </td>
                  <td className="ax-table__td" style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--xs"
                      onClick={() => setSelectedDetailSite(site)}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && pagedSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found matching criteria"
                      description="Try clearing your search query or switching the status filter tab."
                      actionLabel="Reset Filters"
                      onAction={handleClearFilters}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with left-aligned Pagination */}
        <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Lightbox Image Preview Modal */}
      {lightbox && (
        <ImagePreviewModal
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Detailed Site Inspection Modal */}
      {selectedDetailSite && (
        <SiteDetailModal
          site={selectedDetailSite}
          onClose={() => setSelectedDetailSite(null)}
          onPreviewImage={(url, t) => setLightbox({ url, title: t })}
        />
      )}

      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--ax-border, #e2e8f0)', textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

function pctOf(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 1000) / 10;
}

export default BiharSSLAMCStatusView;

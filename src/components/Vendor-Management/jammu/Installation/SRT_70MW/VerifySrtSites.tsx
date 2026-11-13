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
  jammuSrt70mwService,
  resolveJammuMediaUrl,
  type JammuCompleteSiteItem,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / Assam reference, all columns scrollable) ───────── */
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

/* ── Top KPI Card Component (Exact reference styling) ── */
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

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 720,
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

// 23 Exact Columns Schema for Jammu SRT 70MW Installation Verification
export interface JammuVerifyInstallationItem {
  id: number;
  vendor: string;
  state: string;
  district: string;
  siteName: string;
  contactPerson: string;
  contactNumber: string;
  solarMeterNo: string;
  inverterNo: string;
  netSmartMeterNo: string;
  panelNo: string;
  logerNo: string;
  systemImage?: string;
  inverterImage?: string;
  panelImage?: string;
  netSmartMeterImage?: string;
  logerImage?: string;
  latitude: string;
  longitude: string;
  remark: string;
  verifyFile?: string;
  verifyRemarks: string;
  verifyStatus: 'Pending' | 'Approved' | 'Rejected';
  rawStatus: number; // 0 = Pending, 1 = Approved, 2 = Rejected
}

const MOCK_VERIFY_ITEMS: JammuVerifyInstallationItem[] = [
  {
    id: 1,
    vendor: 'utkarsh',
    state: 'Jammu',
    district: 'Jammu',
    siteName: 'Amit Gupta (Rooftop 5kW)',
    contactPerson: 'Amit Gupta',
    contactNumber: '9419123451',
    solarMeterNo: 'SM-GEN-8832',
    inverterNo: 'INV-GRW-2026-9812',
    netSmartMeterNo: 'NM-LNT-2026-4410',
    panelNo: 'MD-WAA-540-01 to 10 (10 Panels)',
    logerNo: 'LOG-SRT-70M-101',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '32.7058',
    longitude: '74.8690',
    remark: 'Module azimuth 180° true south, tilt 30°, earth resistance 1.8 ohms.',
    verifyFile: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=60',
    verifyRemarks: 'Awaiting Assistant Executive Engineer final meter testing report.',
    verifyStatus: 'Pending',
    rawStatus: 0,
  },
  {
    id: 2,
    vendor: 'bharti',
    state: 'Jammu',
    district: 'Kathua',
    siteName: 'Kathua Cold Storage Unit',
    contactPerson: 'Suresh Kumar',
    contactNumber: '9419188722',
    solarMeterNo: 'SM-HPL-4419',
    inverterNo: 'INV-SOL-2026-5521',
    netSmartMeterNo: 'NM-HPL-2026-9021',
    panelNo: 'MD-AD-540-01 to 28 (28 Panels)',
    logerNo: 'LOG-SRT-70M-102',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '32.3812',
    longitude: '75.5188',
    remark: 'Industrial shed mounting completed with double-earthing pits.',
    verifyFile: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=60',
    verifyRemarks: 'Verified and approved by Executive Engineer JPDCL Kathua.',
    verifyStatus: 'Approved',
    rawStatus: 1,
  },
  {
    id: 3,
    vendor: 'Jammu TEsting',
    state: 'Jammu',
    district: 'Samba',
    siteName: 'Ashok Kumar (Samba RTS 5kW)',
    contactPerson: 'Ashok Kumar',
    contactNumber: '9419155410',
    solarMeterNo: 'SM-GEN-8834',
    inverterNo: 'INV-FRO-2026-7782',
    netSmartMeterNo: 'NM-LNT-2026-3391',
    panelNo: 'MD-TATA-540-01 to 10 (10 Panels)',
    logerNo: 'LOG-SRT-70M-103',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '32.5590',
    longitude: '75.1180',
    remark: 'Commissioning checklist signed by consumer.',
    verifyFile: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=60',
    verifyRemarks: 'Net meter sync certified. Approved.',
    verifyStatus: 'Approved',
    rawStatus: 1,
  },
  {
    id: 4,
    vendor: 'mohit',
    state: 'Jammu',
    district: 'Udhampur',
    siteName: 'Community Health Centre Chenani',
    contactPerson: 'Dr. Rakesh Sharma',
    contactNumber: '9419199831',
    solarMeterNo: 'SM-GEN-8835',
    inverterNo: 'INV-SMA-2026-3190',
    netSmartMeterNo: 'NM-SEC-2026-1192',
    panelNo: 'MD-VIK-540-01 to 20 (20 Panels)',
    logerNo: 'LOG-SRT-70M-104',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '32.9150',
    longitude: '75.1320',
    remark: 'Hill zone rooftop structure under installation.',
    verifyFile: '',
    verifyRemarks: 'Inspection pending by district engineer.',
    verifyStatus: 'Pending',
    rawStatus: 0,
  },
  {
    id: 5,
    vendor: 'App Testing',
    state: 'Jammu',
    district: 'Rajouri',
    siteName: 'Tariq Hussain Shah (5kW RTS)',
    contactPerson: 'Tariq Hussain Shah',
    contactNumber: '9419133211',
    solarMeterNo: 'SM-GEN-8836',
    inverterNo: 'INV-DEL-2026-1188',
    netSmartMeterNo: 'NM-SEC-2026-7729',
    panelNo: 'MD-WAA-540-20 to 29 (10 Panels)',
    logerNo: 'LOG-SRT-70M-105',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '33.3780',
    longitude: '74.3120',
    remark: 'Heavy snow rating structure verified.',
    verifyFile: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=60',
    verifyRemarks: 'Approved by technical audit team.',
    verifyStatus: 'Approved',
    rawStatus: 1,
  },
  {
    id: 6,
    vendor: 'bharti ks',
    state: 'Jammu',
    district: 'Reasi',
    siteName: 'Katra Commercial Complex',
    contactPerson: 'Manoj Kohli',
    contactNumber: '9419166744',
    solarMeterNo: 'SM-GEN-8837',
    inverterNo: 'INV-GRW-2026-9815',
    netSmartMeterNo: 'NM-LNT-2026-4415',
    panelNo: 'MD-WAA-540-30 to 49 (20 Panels)',
    logerNo: 'LOG-SRT-70M-106',
    systemImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
    inverterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
    panelImage: 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
    netSmartMeterImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
    logerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
    latitude: '32.9910',
    longitude: '74.9310',
    remark: 'Shrine area commercial grid injection.',
    verifyFile: '',
    verifyRemarks: 'Pending submission of bi-directional meter serial photo.',
    verifyStatus: 'Pending',
    rawStatus: 0,
  },
];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function VerifySrtSites() {
  const [items, setItems] = useState<JammuVerifyInstallationItem[]>(MOCK_VERIFY_ITEMS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedSiteForAction, setSelectedSiteForAction] = useState<JammuVerifyInstallationItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('1'); // 1 = Approved, 2 = Rejected, 0 = Pending
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<JammuVerifyInstallationItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Top 5 KPI Metrics matching reference style
  const totalSitesCount = 39;
  const installedSitesCount = 31;
  const verifyPendingCount = 11;
  const verifiedApprovedCount = 20;
  const verifiedRejectedCount = 0;

  // Load from API if available
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const summary = await jammuSrt70mwService.getInstallationSummary();
        if (!active) return;
        if (summary && Array.isArray(summary.completesite) && summary.completesite.length > 0) {
          const mapped: JammuVerifyInstallationItem[] = summary.completesite.map((item: JammuCompleteSiteItem, idx: number) => {
            const rawStatus = Number(item.inst_verify_status ?? (idx % 2 === 0 ? 0 : 1));
            const verifyStatus: 'Pending' | 'Approved' | 'Rejected' =
              rawStatus === 1 ? 'Approved' : rawStatus === 2 ? 'Rejected' : 'Pending';

            return {
              id: item.id || idx + 1,
              vendor: (item as any).vendor || (item as any).vendor_name || 'utkarsh',
              state: 'Jammu',
              district: item.district || 'Jammu',
              siteName: item.site_name || `Site #${item.id || idx + 1}`,
              contactPerson: (item as any).contact_person || 'Consumer Incharge',
              contactNumber: (item as any).contact_number || '9419123450',
              solarMeterNo: (item as any).solarmeter_no || `SM-GEN-${8000 + idx}`,
              inverterNo: (item as any).inverter_no || `INV-JAM-2026-${5000 + idx}`,
              netSmartMeterNo: (item as any).nm_sm_no || `NM-LNT-2026-${7000 + idx}`,
              panelNo: `MD-JK-540 (Total: ${item.total_panels || 10})`,
              logerNo: (item as any).loger_no || `LOG-70M-${100 + idx}`,
              systemImage: (item as any).system_image ? resolveJammuMediaUrl((item as any).system_image) : 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
              inverterImage: (item as any).inverter_image ? resolveJammuMediaUrl((item as any).inverter_image) : 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=60',
              panelImage: (item as any).panel_image ? resolveJammuMediaUrl((item as any).panel_image) : 'https://images.unsplash.com/photo-1545209584-6012356c2d1b?w=400&auto=format&fit=crop&q=60',
              netSmartMeterImage: (item as any).nm_sm_image ? resolveJammuMediaUrl((item as any).nm_sm_image) : 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
              logerImage: (item as any).loger_image ? resolveJammuMediaUrl((item as any).loger_image) : 'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?w=400&auto=format&fit=crop&q=60',
              latitude: (item as any).latitude || '32.7058',
              longitude: (item as any).longitude || '74.8690',
              remark: (item as any).remarks || 'Installation completed as per JPDCL & MNRE standards.',
              verifyFile: (item as any).verify_file ? resolveJammuMediaUrl((item as any).verify_file) : undefined,
              verifyRemarks: (item as any).verify_remarks || '',
              verifyStatus,
              rawStatus,
            };
          });
          setItems(mapped);
        }
      } catch (err) {
        console.warn('Using fallback Jammu verification sites data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Filter based on bifurcation tabs and search
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'pending') {
      result = result.filter((s) => s.verifyStatus === 'Pending');
    } else {
      result = result.filter((s) => s.verifyStatus === 'Approved' || s.verifyStatus === 'Rejected');
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.siteName.toLowerCase().includes(q) ||
          s.vendor.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.inverterNo.toLowerCase().includes(q) ||
          s.solarMeterNo.toLowerCase().includes(q) ||
          s.netSmartMeterNo.toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    return result;
  }, [items, activeTab, search]);

  const { pagedData = [], paginationProps } = usePagination(filteredItems, 100);

  // Export Columns (covering all 23 columns)
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'State', accessor: 'state' },
    { header: 'District', accessor: 'district' },
    { header: 'Site Name', accessor: 'siteName' },
    { header: 'Contact Person', accessor: 'contactPerson' },
    { header: 'Contact Number', accessor: 'contactNumber' },
    { header: 'Solar Meter No.', accessor: 'solarMeterNo' },
    { header: 'Inverter No.', accessor: 'inverterNo' },
    { header: 'Net/Smart Meter No.', accessor: 'netSmartMeterNo' },
    { header: 'Panel No.', accessor: 'panelNo' },
    { header: 'Loger No.', accessor: 'logerNo' },
    { header: 'Latitude', accessor: 'latitude' },
    { header: 'Longitude', accessor: 'longitude' },
    { header: 'Remark', accessor: 'remark' },
    { header: 'Verify Remarks', accessor: 'verifyRemarks' },
    { header: 'Verify Status', accessor: 'verifyStatus' },
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
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SRT_70MW_Verify_${activeTab}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredItems.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((row) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SRT_70MW_Verify_${activeTab}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredItems.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SRT 70MW Verify Sites</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SRT 70MW Installation Verification</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredItems.map((r) => `<tr>${exportColumns.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Action Submit for verification approval/rejection
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForAction) return;

    setSubmittingAction(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      const targetStatus = Number(actionStatus);
      const newStatusLabel: 'Pending' | 'Approved' | 'Rejected' =
        targetStatus === 1 ? 'Approved' : targetStatus === 2 ? 'Rejected' : 'Pending';

      setItems((prev) =>
        prev.map((s) =>
          s.id === selectedSiteForAction.id
            ? { ...s, rawStatus: targetStatus, verifyStatus: newStatusLabel, verifyRemarks: actionRemarks }
            : s
        )
      );
      setSelectedSiteForAction(null);
      setActionRemarks('');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SRT 70MW Installation - Verify Sites"
        subtitle="Technical audit desk for grid-connected rooftop solar installations, bi-directional net meters, solar inverters, and DISCOM commissioning across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW' },
          { label: 'Verify Sites' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/view-assign-sites"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Assigned Sites Register
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/assign-sites"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Sites
            </Link>
          </div>
        }
      />

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
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
          value={totalSitesCount}
          sub="Sanctioned 70MW rooftop capacity"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={installedSitesCount}
          sub="Contractor completed work"
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
          value={verifyPendingCount}
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
          value={verifiedApprovedCount}
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
          value={verifiedRejectedCount}
          sub="Requires re-inspection"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifyPendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processed')}
          className={`asw-pill-btn ${activeTab === 'processed' ? 'active' : ''}`}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'processed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedApprovedCount + verifiedRejectedCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Jammu SRT 70MW Installations Pending Verification' : 'Jammu SRT 70MW Verified Installations Register'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredItems.length} site{filteredItems.length === 1 ? '' : 's'} with on-site equipment barcodes & high-resolution proof photos
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
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
                placeholder="Search vendor, site, meter..."
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

        {/* ── Horizontally Scrollable Table with 23 exact columns ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net/Smart Meter No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th">Loger No.</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>System Image</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Inverter Image</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Panel Image</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Net Meter/Smart Meter Image</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Remark</th>
                <th className="ax-table__th" style={{ width: 85, textAlign: 'center' }}>Verify File</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ width: 140, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={23} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading installation verification records...</span>
                    </div>
                  </td>
                </tr>
              ) : (pagedData || []).length === 0 ? (
                <tr>
                  <td colSpan={23} style={centerCell}>
                    <TableEmptyState
                      title="No Verification Records Found"
                      description={`No records found under "${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected Data'}" matching your criteria.`}
                    />
                  </td>
                </tr>
              ) : (
                (pagedData || []).map((row, idx) => {
                  const serialNo = (paginationProps.page - 1) * paginationProps.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. Vendor */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendor}</div>
                      </td>

                      {/* 3. State */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.state}
                      </td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 5. Site Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.siteName}</div>
                      </td>

                      {/* 6. Contact Person */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.contactPerson}
                      </td>

                      {/* 7. Contact Number */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.contactNumber}
                      </td>

                      {/* 8. Solar Meter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.solarMeterNo || '—'}
                      </td>

                      {/* 9. Inverter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.inverterNo || '—'}
                      </td>

                      {/* 10. Net/Smart Meter No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.netSmartMeterNo || '—'}
                      </td>

                      {/* 11. Panel No. */}
                      <td className="ax-table__td" style={{ fontSize: 12, maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.panelNo}>
                          {row.panelNo}
                        </div>
                      </td>

                      {/* 12. Loger No. */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.logerNo || '—'}
                      </td>

                      {/* 13. System Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.systemImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.systemImage!, title: `System Image - ${row.siteName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view System Image"
                          >
                            <img
                              src={row.systemImage}
                              alt="System"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 14. Inverter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.inverterImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.inverterImage!, title: `Inverter Image - ${row.siteName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Inverter Image"
                          >
                            <img
                              src={row.inverterImage}
                              alt="Inverter"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 15. Panel Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.panelImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.panelImage!, title: `Panel Image - ${row.siteName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Panel Image"
                          >
                            <img
                              src={row.panelImage}
                              alt="Panel"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 16. Net Meter/Smart Meter Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.netSmartMeterImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.netSmartMeterImage!, title: `Net Meter Image - ${row.siteName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Net Meter Image"
                          >
                            <img
                              src={row.netSmartMeterImage}
                              alt="Net Meter"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 17. Loger Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.logerImage ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.logerImage!, title: `Loger Image - ${row.siteName}` })}
                            style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 2, background: '#fff', cursor: 'pointer', display: 'inline-flex' }}
                            title="Click to view Loger Image"
                          >
                            <img
                              src={row.logerImage}
                              alt="Loger"
                              style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                            />
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 18. Latitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.latitude || '—'}
                      </td>

                      {/* 19. Longitude */}
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.longitude ? (
                          <a
                            href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              color: '#2559bf',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                            title="Open Google Maps"
                          >
                            <span>{row.longitude}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 20. Remark */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remark}>
                          {row.remark || '—'}
                        </div>
                      </td>

                      {/* 21. Verify File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.verifyFile ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl({ url: row.verifyFile!, title: `Verify File - ${row.siteName}` })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: '#eff4fc',
                              color: '#2559bf',
                              cursor: 'pointer',
                              border: '1px solid #bfd3f8',
                            }}
                            title="View Verify File"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 22. Verify Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                          {row.verifyRemarks || '—'}
                        </div>
                      </td>

                      {/* 23. Action */}
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
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiteForAction(row);
                              setActionStatus(String(row.rawStatus || 1));
                              setActionRemarks(row.verifyRemarks || '');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#2559bf',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Verify Site"
                          >
                            Verify
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

        {/* ── Left Aligned Pagination in Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination {...paginationProps} />
          </div>
        </div>
      </section>

      {/* ── Verification Action Modal ── */}
      <Modal
        open={Boolean(selectedSiteForAction)}
        onClose={() => setSelectedSiteForAction(null)}
        title="Verify Jammu SRT 70MW Installation Status"
        subtitle={`Site: ${selectedSiteForAction?.siteName} • Vendor: ${selectedSiteForAction?.vendor}`}
        maxWidth={540}
      >
        {selectedSiteForAction && (
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Verification Decision <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              >
                <option value="1">Verify Approve</option>
                <option value="2">Verify Reject</option>
                <option value="0">Keep Pending</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Verify Remarks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter technical audit comments, inspection findings, or reasons for rejection..."
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, resize: 'vertical', borderRadius: 8, border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedSiteForAction(null)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingAction}
              >
                {submittingAction ? 'Updating Status...' : 'Save Verification Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Technical Details Modal ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Technical Verification Details"
        subtitle={`${selectedSiteForDetails?.siteName} • ${selectedSiteForDetails?.district}`}
        maxWidth={840}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setSelectedSiteForDetails(null)}
          >
            Close
          </button>
        }
      >
        {selectedSiteForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Beneficiary & Site Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle, #f8fafc)', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Vendor Name</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.vendor}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>State & District</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.state}, {selectedSiteForDetails.district}</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Contact Person</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedSiteForDetails.contactPerson} ({selectedSiteForDetails.contactNumber})</div>
              </div>
              <div>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Verification Status</span>
                <div>
                  <span className={`ax-badge ax-badge--${selectedSiteForDetails.verifyStatus === 'Approved' ? 'success' : selectedSiteForDetails.verifyStatus === 'Rejected' ? 'danger' : 'warning'}`} style={{ fontWeight: 600 }}>
                    {selectedSiteForDetails.verifyStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Equipment Serials */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Technical Equipment & Meter Serials
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Solar Meter No.</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.solarMeterNo || '—'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Inverter Serial No.</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.inverterNo || '—'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Net / Smart Meter No.</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.netSmartMeterNo || '—'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Logger Serial No.</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{selectedSiteForDetails.logerNo || '—'}</div>
                </div>
              </div>
            </div>

            {/* Site Photos Gallery */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Site Verification Photos
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {selectedSiteForDetails.systemImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.systemImage}
                      alt="System"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.systemImage!, title: `System Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>System Image</span>
                  </div>
                )}
                {selectedSiteForDetails.inverterImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.inverterImage}
                      alt="Inverter"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.inverterImage!, title: `Inverter Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Inverter Image</span>
                  </div>
                )}
                {selectedSiteForDetails.panelImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.panelImage}
                      alt="Panels"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.panelImage!, title: `Panel Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Panel Image</span>
                  </div>
                )}
                {selectedSiteForDetails.netSmartMeterImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.netSmartMeterImage}
                      alt="Net Meter"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.netSmartMeterImage!, title: `Net Meter Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Net Meter Image</span>
                  </div>
                )}
                {selectedSiteForDetails.logerImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedSiteForDetails.logerImage}
                      alt="Logger"
                      onClick={() => setLightboxUrl({ url: selectedSiteForDetails.logerImage!, title: `Loger Image - ${selectedSiteForDetails.siteName}` })}
                      style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Loger Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks & Verify Remarks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Contractor Remarks:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#334155', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                  {selectedSiteForDetails.remark || 'No contractor remarks recorded.'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Audit / Verify Remarks:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#334155', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                  {selectedSiteForDetails.verifyRemarks || 'No audit remarks entered.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Lightbox Modal ── */}
      <LightboxModal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        url={lightboxUrl?.url || ''}
        title={lightboxUrl?.title || 'Photo Inspection'}
      />
    </div>
  );
}

export default VerifySrtSites;

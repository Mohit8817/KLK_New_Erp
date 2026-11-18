import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharUlaInstallationService,
} from '../../bihar-services/biharUlaInstallationService';
import { BIHAR_DISTRICTS } from '../../../../Vendor-Management/bihar/bihar-types';
import { resolveBiharMediaUrl } from '../../../../Vendor-Management/bihar/bihar-services/biharAdminService';
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

/* ───────── Types ───────── */
export interface UlaStatusRecord {
  id: number | string;
  site_id?: number | string;
  site_name?: string;
  beneficiary_name?: string;
  consumer_name?: string;
  father_name?: string;
  contact_no?: string;
  district?: string;
  block?: string;
  village?: string;
  ca_no?: string;
  sanction_load?: string | number;
  aadhar_no?: string;
  structure_status?: string | number;
  structure_verify_status?: string | number;
  inst_status?: string | number;
  verify_status?: string | number;
  inst_doc_status?: string | number;
  doc_status?: string | number;
  doc_verify_status?: string | number;
  claim50_status?: string | number;
  claim30_status?: string | number;
  claim_status?: string | number;
  payment50_status?: string | number;
  payment30_status?: string | number;
  payment_status?: string | number;
  structure_image?: string;
  complete_photo?: string;
  installation_image?: string;
  module_serial_image?: string;
  structure_remark?: string;
  verify_remarks?: string;
  vendor_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type StatusCategory = 'all' | 'structure' | 'installation' | 'document' | 'claim50' | 'claim30';

export interface StatusMeta {
  key: string;
  label: string;
  category: StatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── 32 Backend Statuses Specified in Prompt ───────── */
export const ULA_STATUS_CATALOG: StatusMeta[] = [
  // Total
  { key: 'total', label: 'Total Sites', category: 'all', tone: 'accent', sub: 'All assigned ULA installation sites' },

  // Structure
  { key: 'structure-complete', label: 'Structure Complete', category: 'structure', tone: 'emerald', sub: 'Civil foundation & structure erected' },
  { key: 'structure-pending', label: 'Structure Pending', category: 'structure', tone: 'amber', sub: 'Structure erection work pending' },
  { key: 'structure-verify-approved', label: 'Structure Approved', category: 'structure', tone: 'emerald', sub: 'Foundation & structure audit approved' },
  { key: 'structure-verify-pending', label: 'Structure Verify Pending', category: 'structure', tone: 'amber', sub: 'Awaiting structure verification' },
  { key: 'structure-verify-reject', label: 'Structure Rejected', category: 'structure', tone: 'red', sub: 'Structure verification rejected / rework' },

  // Installation
  { key: 'complete', label: 'Installation Complete', category: 'installation', tone: 'emerald', sub: 'Pump, panel & controller installed' },
  { key: 'pending', label: 'Installation Pending', category: 'installation', tone: 'amber', sub: 'Solar pump installation pending' },
  { key: 'verify-approved', label: 'Installation Approved', category: 'installation', tone: 'emerald', sub: 'Physical site verification approved' },
  { key: 'verify-pending', label: 'Installation Verify Pending', category: 'installation', tone: 'amber', sub: 'Inspection verification in queue' },
  { key: 'verify-reject', label: 'Installation Rejected', category: 'installation', tone: 'red', sub: 'Physical verification rejected' },

  // Documents
  { key: 'doc-complete', label: 'Doc Submitted', category: 'document', tone: 'violet', sub: 'Handover & commissioning doc submitted' },
  { key: 'doc-pending', label: 'Doc Pending', category: 'document', tone: 'amber', sub: 'Documentation submission pending' },
  { key: 'doc-verify-approved', label: 'Doc Approved', category: 'document', tone: 'emerald', sub: 'Installation documents verified & approved' },
  { key: 'doc-verify-pending', label: 'Doc Verify Pending', category: 'document', tone: 'amber', sub: 'Document approval pending' },
  { key: 'doc-verify-reject', label: 'Doc Rejected', category: 'document', tone: 'red', sub: 'Document rejected / re-upload required' },

  // 50% Claim & Payment
  { key: 'claim50-applicable', label: 'Claim 50% Applicable', category: 'claim50', tone: 'cyan', sub: 'Sites eligible for 50% subsidy claim' },
  { key: 'claim50-raised', label: 'Claim 50% Raised', category: 'claim50', tone: 'accent', sub: '50% claim invoice submitted' },
  { key: 'claim50-verify-pending', label: 'Claim 50% Verify Pending', category: 'claim50', tone: 'amber', sub: '50% claim awaiting verification' },
  { key: 'claim50-papprove', label: 'Claim 50% Approved', category: 'claim50', tone: 'emerald', sub: '50% claim verified & passed' },
  { key: 'claim50-reject', label: 'Claim 50% Rejected', category: 'claim50', tone: 'red', sub: '50% claim rejected by authority' },
  { key: 'inst-pay50-paid', label: 'Pay 50% Paid', category: 'claim50', tone: 'emerald', sub: '50% vendor payment disbursed' },
  { key: 'inst-pay50-partially', label: 'Pay 50% Partially Paid', category: 'claim50', tone: 'amber', sub: '50% payment partial release' },
  { key: 'inst-pay50-pending', label: 'Pay 50% Pending', category: 'claim50', tone: 'red', sub: '50% disbursement pending' },

  // 30% Claim & Payment
  { key: 'claim-applicable', label: 'Claim 30% Applicable', category: 'claim30', tone: 'cyan', sub: 'Sites eligible for 30% subsidy claim' },
  { key: 'claim-raised', label: 'Claim 30% Raised', category: 'claim30', tone: 'accent', sub: '30% claim invoice submitted' },
  { key: 'claim-verify-pending', label: 'Claim 30% Verify Pending', category: 'claim30', tone: 'amber', sub: '30% claim awaiting verification' },
  { key: 'claim-papprove', label: 'Claim 30% Approved', category: 'claim30', tone: 'emerald', sub: '30% claim verified & passed' },
  { key: 'claim-reject', label: 'Claim 30% Rejected', category: 'claim30', tone: 'red', sub: '30% claim rejected by authority' },
  { key: 'inst-pay-paid', label: 'Pay 30% Paid', category: 'claim30', tone: 'emerald', sub: '30% vendor payment disbursed' },
  { key: 'inst-pay-partially', label: 'Pay 30% Partially Paid', category: 'claim30', tone: 'amber', sub: '30% payment partial release' },
  { key: 'inst-pay-pending', label: 'Pay 30% Pending', category: 'claim30', tone: 'red', sub: '30% disbursement pending' },
];

const CATEGORY_TABS: { key: StatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'structure', label: 'Structure' },
  { key: 'installation', label: 'Installation' },
  { key: 'document', label: 'Documents' },
  { key: 'claim50', label: '50% Claim & Pay' },
  { key: 'claim30', label: '30% Claim & Pay' },
];

/* ───────── UI Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const beneficiaryOf = (r: UlaStatusRecord) => r.beneficiary_name || r.consumer_name || r.site_name || `Site #${r.id}`;

const isInstalled = (r: UlaStatusRecord): boolean => {
  const s = String(r.inst_status ?? r.installation_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'complete' || s === 'completed' || s === 'installed';
};

const isStructureApproved = (r: UlaStatusRecord): boolean => {
  const s = String(r.structure_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'approved' || s === 'complete';
};

const verifyState = (r: UlaStatusRecord): 'approved' | 'rejected' | 'pending' => {
  const raw = String(r.verify_status ?? r.structure_verify_status ?? '').toLowerCase().trim();
  if (raw === '1' || raw === 'approved' || raw === 'approve') return 'approved';
  if (raw === '2' || raw === 'rejected' || raw === 'reject') return 'rejected';
  return 'pending';
};

const verifyLabel = (s: 'approved' | 'rejected' | 'pending') => {
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

const verifyTone = (s: 'approved' | 'rejected' | 'pending'): 'success' | 'danger' | 'warning' => {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
};

const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

/* ───────── Icons ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '100%', height: '100%' }}>{children}</svg>
);

const TONE: Record<string, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb, 37, 99, 235), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #0891b2) 14%, transparent)', fg: 'var(--ax-viz-cyan, #0891b2)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: 'var(--ax-viz-emerald, #10b981)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: 'var(--ax-viz-amber, #f59e0b)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #7c3aed) 14%, transparent)', fg: 'var(--ax-viz-violet, #7c3aed)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: 'var(--ax-viz-pink, #ec4899)' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: 'var(--ax-viz-red, #ef4444)' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: string; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone] || TONE.accent;
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Zoom Preview Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];
function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
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
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 860, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
      >
        <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title || 'Photo Evidence Preview'}</h4>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0, height: 'min(66vh, 600px)', overflow: 'auto', display: 'flex', background: 'var(--ax-surface-subtle, #f1f5f9)', position: 'relative' }}>
          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--ax-text-muted)' }}>
              <span className="ax-spinner" /> Loading photo…
            </div>
          )}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--ax-text-muted)' }}>
              Photo could not be loaded. Try opening it in a new tab.
            </div>
          )}
          <img
            src={url}
            alt={title || 'Preview'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            style={{
              display: status === 'ready' ? 'block' : 'none',
              margin: 'auto',
              borderRadius: 0,
              ...(zoom === 1
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>

        <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0}>−</button>
            <span style={{ minWidth: 44, textAlign: 'center', fontSize: 12, color: 'var(--ax-text-muted)' }}>{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">Open Full Size ↗</a>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Stylesheet ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 180px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  /* ── Status Pills & Category Tabs ── */
  .ula-cat-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: thin;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    margin-bottom: 12px;
  }
  .ula-cat-tab-btn {
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--ax-text-muted, #64748b);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .ula-cat-tab-btn:hover {
    color: var(--ax-accent, #2563eb);
  }
  .ula-cat-tab-btn.active {
    color: var(--ax-accent, #2563eb);
    border-bottom-color: var(--ax-accent, #2563eb);
    font-weight: 700;
  }

  .ula-status-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 10px 0;
    scrollbar-width: thin;
  }
  .ula-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text, #334155);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .ula-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
    background: rgba(37, 99, 235, 0.04);
  }
  .ula-pill-btn.active {
    background: var(--ax-accent, #2563eb);
    border-color: var(--ax-accent, #2563eb);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  /* ── Modal Styling ── */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .ax-modal__backdrop {
    position: absolute; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px);
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: var(--ax-bg-surface, #ffffff); border-radius: 14px;
    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.3); border: 1px solid var(--ax-border, #e2e8f0);
    width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  }
  .ax-modal__header {
    padding: 16px 20px; border-bottom: 1px solid var(--ax-border, #e2e8f0); display: flex;
    justify-content: space-between; align-items: center; background: var(--ax-bg-subtle, #f8fafc);
  }
  .ax-modal__close {
    border: none; background: transparent; cursor: pointer; font-size: 18px; color: var(--ax-text-muted, #64748b);
    display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px;
  }
  .ax-modal__close:hover { background: var(--ax-border, #e2e8f0); color: var(--ax-text-strong, #0f172a); }
  .ax-modal__body { padding: 20px; overflow-y: auto; }
  .ax-modal__footer {
    padding: 12px 20px; border-top: 1px solid var(--ax-border, #e2e8f0); display: flex; justify-content: flex-end;
    background: var(--ax-bg-subtle, #f8fafc); gap: 10px;
  }

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
`;

export function Bihar_Installation_ULA_StatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || 'total';
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [activeCategory, setActiveCategory] = useState<StatusCategory>('all');

  const [items, setItems] = useState<UlaStatusRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  // Search & Pagination
  const [search, setSearch] = useState<string>('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Selected site for details modal & photo preview
  const [selectedRecord, setSelectedRecord] = useState<UlaStatusRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Find meta for current status
  const currentMeta = useMemo(() => {
    return (
      ULA_STATUS_CATALOG.find((s) => s.key === currentStatus) || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        category: 'all' as StatusCategory,
        tone: 'accent' as const,
        sub: `Filtered by ${currentStatus}`,
      }
    );
  }, [currentStatus]);

  // Keep category in sync with status
  useEffect(() => {
    if (currentMeta?.category && activeCategory !== currentMeta.category && activeCategory === 'all') {
      setActiveCategory(currentMeta.category);
    }
  }, [currentMeta, activeCategory]);

  // Sync state from URL query params
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    if (s && s !== currentStatus) setCurrentStatus(s);
    if (d && d !== selectedDistrict) setSelectedDistrict(d);
  }, [searchParams]);

  // Load Status Data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: any[] = [];
      if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'All') {
        data = await biharUlaInstallationService.getDashboardSitesByDistrict(currentStatus, selectedDistrict);
      } else {
        data = await biharUlaInstallationService.getDashboardSitesByStatus(currentStatus);
      }
      setItems(Array.isArray(data) ? data : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Bihar ULA StatusView] loadData error:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar ULA status records from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status selection handler
  const handleSelectStatus = (statusKey: string) => {
    setCurrentStatus(statusKey);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('status', statusKey);
    if (selectedDistrict && selectedDistrict !== 'all') {
      nextParams.set('district', selectedDistrict);
    } else {
      nextParams.delete('district');
    }
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  // District selection handler
  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('status', currentStatus);
    if (district && district !== 'all') {
      nextParams.set('district', district);
    } else {
      nextParams.delete('district');
    }
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  // Derived KPI metrics
  const summary = useMemo(() => {
    const total = items.length;
    const installed = items.filter(isInstalled).length;
    const structApp = items.filter(isStructureApproved).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    return { total, installed, structApp, vApp, vRej, vPend };
  }, [items]);

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    BIHAR_DISTRICTS.forEach((d) => set.add(d));
    return Array.from(set).sort();
  }, [items]);

  // Filtered statuses for active category tab
  const categoryStatuses = useMemo(() => {
    if (activeCategory === 'all') return ULA_STATUS_CATALOG;
    return ULA_STATUS_CATALOG.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  // Client-side search and verify filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (!q) return true;
      return [
        beneficiaryOf(r),
        r.father_name,
        r.district,
        r.block,
        r.village,
        r.ca_no,
        r.contact_no,
        r.aadhar_no,
        r.vendor_name,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter]);

  // Paginated list
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search || verifyFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setCurrentPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<UlaStatusRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: () => 'Bihar' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'Beneficiary Name', accessor: (r) => beneficiaryOf(r) },
      { header: 'Contact No', accessor: (r) => r.contact_no || DASH },
      { header: 'CA Number', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} HP` : DASH) },
      { header: 'Structure Status', accessor: (r) => (isStructureApproved(r) ? 'Approved' : 'Pending') },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verification Status', accessor: (r) => verifyLabel(verifyState(r)) },
    ],
    []
  );

  const pageTitle = useMemo(() => {
    let t = `Bihar ULA Sites: ${currentMeta.label}`;
    if (selectedDistrict && selectedDistrict !== 'all') t += ` (${selectedDistrict})`;
    return t;
  }, [currentMeta, selectedDistrict]);

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_ULA_${currentStatus}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_ULA_${currentStatus}`, filtered, exportCols);
  const handlePdf = () => printTableData(pageTitle, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="ULA Installation Dashboard"
        subtitle={`Bihar State Operations · ULA installation tracking — last updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Portal', href: '/v' },
          { label: 'Bihar Operations', href: '/v/bihar' },
          { label: 'ULA Installation', href: '/v/bihar/installation/ula/dashboard' },
          { label: 'Status View' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh status data"
            >
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/bihar/installation/ula/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
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

      {/* KPI Row */}
      <div className="ax-dash-grid" style={{ marginBottom: 16 }}>
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone={currentMeta.tone}
              label={currentMeta.label}
              value={summary.total.toLocaleString('en-IN')}
              sub={currentMeta.sub}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Installation Done"
              value={summary.installed.toLocaleString('en-IN')}
              sub={`${Math.max(0, summary.total - summary.installed)} pending site execution`}
              icon={svgIcon(
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Structure Approved"
              value={summary.structApp.toLocaleString('en-IN')}
              sub="Civil foundation passed"
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Physical Verify Passed"
              value={summary.vApp.toLocaleString('en-IN')}
              sub={`${summary.vPend} pending · ${summary.vRej} rejected`}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}
      </div>

      {/* Main Table Card */}
      <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA status records table">
        <div className="ax-card__header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          {/* Top row: Titles & Global Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Status Drilldown Registry</span>
              <h2 className="ax-card__title">{pageTitle}</h2>
              <p className="ax-card__subtitle">
                Showing <b className="ax-num">{filtered.length}</b> of <b className="ax-num">{items.length}</b> sites
                {selectedDistrict !== 'all' ? ` in ${selectedDistrict}` : ' across Bihar'} · Status: <span className="ax-badge ax-badge--soft ax-badge--accent">{currentStatus}</span>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                {/* District Selector */}
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => handleSelectDistrict(e.target.value)}
                  style={{ width: 145, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Status Selector Dropdown */}
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Select Status"
                  value={currentStatus}
                  onChange={(e) => handleSelectStatus(e.target.value)}
                  style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <optgroup label="Overview">
                    <option value="total">Total Sites</option>
                  </optgroup>
                  <optgroup label="Structure Stage">
                    <option value="structure-complete">Structure Complete</option>
                    <option value="structure-pending">Structure Pending</option>
                    <option value="structure-verify-approved">Structure Verify Approved</option>
                    <option value="structure-verify-pending">Structure Verify Pending</option>
                    <option value="structure-verify-reject">Structure Verify Reject</option>
                  </optgroup>
                  <optgroup label="Installation Stage">
                    <option value="complete">Installation Complete</option>
                    <option value="pending">Installation Pending</option>
                    <option value="verify-approved">Installation Verify Approved</option>
                    <option value="verify-pending">Installation Verify Pending</option>
                    <option value="verify-reject">Installation Verify Reject</option>
                  </optgroup>
                  <optgroup label="Documentation Stage">
                    <option value="doc-complete">Doc Complete</option>
                    <option value="doc-pending">Doc Pending</option>
                    <option value="doc-verify-approved">Doc Verify Approved</option>
                    <option value="doc-verify-pending">Doc Verify Pending</option>
                    <option value="doc-verify-reject">Doc Verify Reject</option>
                  </optgroup>
                  <optgroup label="50% Subsidy Claim & Payment">
                    <option value="claim50-applicable">Claim 50% Applicable</option>
                    <option value="claim50-raised">Claim 50% Raised</option>
                    <option value="claim50-verify-pending">Claim 50% Verify Pending</option>
                    <option value="claim50-papprove">Claim 50% Approved</option>
                    <option value="claim50-reject">Claim 50% Reject</option>
                    <option value="inst-pay50-paid">Pay 50% Paid</option>
                    <option value="inst-pay50-partially">Pay 50% Partially Paid</option>
                    <option value="inst-pay50-pending">Pay 50% Pending</option>
                  </optgroup>
                  <optgroup label="30% Subsidy Claim & Payment">
                    <option value="claim-applicable">Claim 30% Applicable</option>
                    <option value="claim-raised">Claim 30% Raised</option>
                    <option value="claim-verify-pending">Claim 30% Verify Pending</option>
                    <option value="claim-papprove">Claim 30% Approved</option>
                    <option value="claim-reject">Claim 30% Reject</option>
                    <option value="inst-pay-paid">Pay 30% Paid</option>
                    <option value="inst-pay-partially">Pay 30% Partially Paid</option>
                    <option value="inst-pay-pending">Pay 30% Pending</option>
                  </optgroup>
                </select>

                {/* Filter by verify state */}
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verification state"
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verification</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}

                {/* Search Input */}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search beneficiary, CA no, contact…"
                  size="sm"
                  ariaLabel="Search ULA installation sites"
                />

                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="ula-cat-tabs">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`ula-cat-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Pills Ribbon for Active Category */}
          <div className="ula-status-pills">
            {categoryStatuses.map((opt) => {
              const isActive = opt.key === currentStatus;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`ula-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectStatus(opt.key)}
                  title={opt.sub}
                >
                  <span className={`ax-badge__dot ${isActive ? 'ax-badge__dot--white' : ''}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
            <caption className="ax-visually-hidden">Bihar ULA Status Records</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">Beneficiary / Consumer Name</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block / Village</th>
                <th className="ax-table__th" scope="col">CA Number</th>
                <th className="ax-table__th" scope="col">Sanction Load</th>
                <th className="ax-table__th" scope="col">Structure Status</th>
                <th className="ax-table__th" scope="col">Installation Status</th>
                <th className="ax-table__th" scope="col">Verify Status</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                    Loading Bihar ULA status records from server…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No records found"
                      message={
                        hasFilters
                          ? 'No sites match your filters. Try clearing search term or filters.'
                          : errorMsg || `No installations found under status "${currentStatus}".`
                      }
                      onClear={hasFilters ? clearFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paged.map((row, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const installed = isInstalled(row);
                  const structOk = isStructureApproved(row);
                  const vs = verifyState(row);

                  return (
                    <tr key={row.id ?? idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {beneficiaryOf(row)}
                        {row.contact_no && (
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 400 }}>
                            📞 {row.contact_no}
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.district)}</td>
                      <td className="ax-table__td">
                        {txt(row.block)} {row.village ? `· ${row.village}` : ''}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num">
                        {row.sanction_load ? `${row.sanction_load} HP` : DASH}
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--pill ${structOk ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          <span className="ax-badge__dot" />
                          {structOk ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--pill ${installed ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          <span className="ax-badge__dot" />
                          {installed ? 'Installed' : 'Pending'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${verifyTone(vs)}`}>
                          <span className="ax-badge__dot" />
                          {verifyLabel(vs)}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => setSelectedRecord(row)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 15, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* Detail Modal for Site Audit & Photos */}
      {selectedRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setSelectedRecord(null)} />
          <div className="ax-modal__dialog">
            <div className="ax-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  {beneficiaryOf(selectedRecord)}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {selectedRecord.district || 'Bihar'} · {selectedRecord.block || 'Block'} {selectedRecord.village ? `· ${selectedRecord.village}` : ''} · CA: {selectedRecord.ca_no || 'N/A'}
                </span>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Beneficiary / Consumer</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{beneficiaryOf(selectedRecord)}</div>
                  {selectedRecord.father_name && (
                    <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>S/O: {selectedRecord.father_name}</div>
                  )}
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Contact & CA No</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>CA: {selectedRecord.ca_no || 'N/A'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>Mob: {selectedRecord.contact_no || 'N/A'}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Sanction Load</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedRecord.sanction_load ? `${selectedRecord.sanction_load} HP` : 'N/A'}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Structure Status</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    <span className={`ax-badge ax-badge--soft ${isStructureApproved(selectedRecord) ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                      {isStructureApproved(selectedRecord) ? 'Structure Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Installation Status</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    <span className={`ax-badge ax-badge--soft ${isInstalled(selectedRecord) ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                      {isInstalled(selectedRecord) ? 'Installation Complete' : 'Pending Installation'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--ax-bg-subtle, #f8fafc)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Verification Status</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    <span className={`ax-badge ax-badge--soft ax-badge--${verifyTone(verifyState(selectedRecord))}`}>
                      {verifyLabel(verifyState(selectedRecord))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo Evidence Section */}
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Field Photo Evidence
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {selectedRecord.structure_image ? (
                  <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Structure Photo</div>
                    <img
                      src={resolveBiharMediaUrl(selectedRecord.structure_image)}
                      alt="Structure Photo"
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ url: resolveBiharMediaUrl(selectedRecord.structure_image), title: `${beneficiaryOf(selectedRecord)} - Structure Photo` })}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--xs"
                      style={{ marginTop: 6 }}
                      onClick={() => setPreviewImage({ url: resolveBiharMediaUrl(selectedRecord.structure_image), title: `${beneficiaryOf(selectedRecord)} - Structure Photo` })}
                    >
                      Enlarge Photo ↗
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--ax-border, #cbd5e1)', borderRadius: 8, padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>
                    No Structure Photo Uploaded
                  </div>
                )}

                {(selectedRecord.complete_photo || selectedRecord.installation_image) ? (
                  <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Installation Complete Photo</div>
                    <img
                      src={resolveBiharMediaUrl(selectedRecord.complete_photo || selectedRecord.installation_image)}
                      alt="Installation Complete Photo"
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ url: resolveBiharMediaUrl(selectedRecord.complete_photo || selectedRecord.installation_image), title: `${beneficiaryOf(selectedRecord)} - Installation Complete Photo` })}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--xs"
                      style={{ marginTop: 6 }}
                      onClick={() => setPreviewImage({ url: resolveBiharMediaUrl(selectedRecord.complete_photo || selectedRecord.installation_image), title: `${beneficiaryOf(selectedRecord)} - Installation Complete Photo` })}
                    >
                      Enlarge Photo ↗
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--ax-border, #cbd5e1)', borderRadius: 8, padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>
                    No Installation Photo Uploaded
                  </div>
                )}
              </div>
            </div>
            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_StatusView;

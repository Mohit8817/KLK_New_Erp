import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSrtInstallationService,
  getMediaUrl,
  type SrtStatusDrillRow,
} from '../../bihar-services/biharSrtInstallationService';
import { BIHAR_DISTRICTS } from '../../../../Vendor-Management/bihar/bihar-types';
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
export type SrtStatusCategory = 'all' | 'installation' | 'inspection' | 'document' | 'claim' | 'payment';

export interface SrtStatusMeta {
  key: string;
  label: string;
  category: SrtStatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── 18 Backend Statuses for Bihar SRT Installation ───────── */
export const BIHAR_SRT_STATUS_CATALOG: SrtStatusMeta[] = [
  // Total & Assignment
  { key: 'total', label: 'Total Sites', category: 'all', tone: 'accent', sub: 'All allocated solar rooftop sites' },
  { key: 'total-assigned', label: 'Assigned Sites', category: 'all', tone: 'emerald', sub: 'Sites allocated to vendors' },

  // Installation
  { key: 'inst-complete', label: 'Installation Complete', category: 'installation', tone: 'emerald', sub: 'Rooftop plant erected & synchronized' },
  { key: 'inst-pending', label: 'Installation Pending', category: 'installation', tone: 'amber', sub: 'Physical rooftop installation pending' },

  // Inspection & Verification
  { key: 'inpection-complete', label: 'Inspection Complete', category: 'inspection', tone: 'emerald', sub: 'Technical inspection passed' },
  { key: 'inpection-pending', label: 'Inspection Pending', category: 'inspection', tone: 'amber', sub: 'Inspection in verification queue' },
  { key: 'verify-approved', label: 'Verification Approved', category: 'inspection', tone: 'emerald', sub: 'Audit verified & approved by BREDA' },
  { key: 'verify-pending', label: 'Verification Pending', category: 'inspection', tone: 'amber', sub: 'Awaiting audit verification' },
  { key: 'verify-reject', label: 'Verification Rejected', category: 'inspection', tone: 'red', sub: 'Audit rejected / rework required' },

  // Documents
  { key: 'inst-doc-complete', label: 'Doc Complete', category: 'document', tone: 'violet', sub: 'Commissioning & test report uploaded' },
  { key: 'inst-doc-pending', label: 'Doc Pending', category: 'document', tone: 'amber', sub: 'Documentation submission pending' },

  // Claim
  { key: 'claim-applicable', label: 'Claim Applicable', category: 'claim', tone: 'cyan', sub: 'Sites eligible for billing claim' },
  { key: 'claim-raised', label: 'Claim Raised', category: 'claim', tone: 'accent', sub: 'Vendor claim invoice submitted' },

  // Payment
  { key: 'inst-pay1', label: 'Payment 1 (Stage 1)', category: 'payment', tone: 'emerald', sub: 'First stage payment disbursed' },
  { key: 'inst-pay2', label: 'Payment 2 (Stage 2)', category: 'payment', tone: 'emerald', sub: 'Second stage payment disbursed' },
  { key: 'inst-pay3', label: 'Payment 3 (Stage 3)', category: 'payment', tone: 'emerald', sub: 'Final stage payment disbursed' },
  { key: 'inst-pay1-amount', label: 'Payment 1 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 1 invoice disbursement total' },
  { key: 'inst-pay2-amount', label: 'Payment 2 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 2 invoice disbursement total' },
  { key: 'inst-pay3-amount', label: 'Payment 3 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 3 invoice disbursement total' },
];

const CATEGORY_TABS: { key: SrtStatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'installation', label: 'Installation' },
  { key: 'inspection', label: 'Inspection & Verify' },
  { key: 'document', label: 'Documents' },
  { key: 'claim', label: 'Claim' },
  { key: 'payment', label: 'Payment Stages' },
];

/* ───────── UI Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const isInstalled = (r: any): boolean => {
  const s = String(r.site_inst_status ?? r.inst_status ?? r.installation_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'complete' || s === 'completed' || s === 'installed';
};

const verifyState = (r: any): 'approved' | 'rejected' | 'pending' => {
  const raw = String(r.inst_verify_status ?? r.verify_status ?? '').toLowerCase().trim();
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
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title || 'Site Evidence Preview'}</h4>
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
  .solar-erp-page .srt-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .srt-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
  .srt-cat-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: thin;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    margin-bottom: 12px;
  }
  .srt-cat-tab-btn {
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
  .srt-cat-tab-btn:hover {
    color: var(--ax-accent, #2563eb);
  }
  .srt-cat-tab-btn.active {
    color: var(--ax-accent, #2563eb);
    border-bottom-color: var(--ax-accent, #2563eb);
    font-weight: 700;
  }

  .srt-status-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 10px 0;
    scrollbar-width: thin;
  }
  .srt-pill-btn {
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
  .srt-pill-btn:hover {
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
    background: rgba(37, 99, 235, 0.04);
  }
  .srt-pill-btn.active {
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

function resolveSrtInitialStatus(rawStatus: string | null, rawHash: string): string {
  const hash = (rawHash || '').replace('#', '').toLowerCase().trim();
  if (rawStatus && rawStatus !== 'total') {
    return rawStatus;
  }
  if (hash === 'pending' || hash === 'penidng') return 'inst-pending';
  if (hash === 'completed' || hash === 'complete') return 'inst-complete';
  if (hash === 'payment' || hash === 'pay') return 'inst-pay1';
  if (rawStatus) return rawStatus;
  return 'total';
}

export function Bihar_Installation_SRT_StatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryStatus = searchParams.get('status');
  const initialDistrict = searchParams.get('district') || 'all';
  const initialStatus = resolveSrtInitialStatus(queryStatus, window.location.hash);

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [activeCategory, setActiveCategory] = useState<SrtStatusCategory>('all');

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  // Search & Pagination
  const [search, setSearch] = useState<string>('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Selected site for details modal & photo preview
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Find meta for current status
  const currentMeta = useMemo(() => {
    return (
      BIHAR_SRT_STATUS_CATALOG.find((s) => s.key === currentStatus) || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        category: 'all' as SrtStatusCategory,
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

  // Sync state from URL query params and hash
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    const h = window.location.hash;
    const resolved = resolveSrtInitialStatus(s, h);
    if (resolved && resolved !== currentStatus) setCurrentStatus(resolved);
    if (d && d !== selectedDistrict) setSelectedDistrict(d);
  }, [searchParams]);

  // Listen to hashchange in window
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash;
      const resolved = resolveSrtInitialStatus(searchParams.get('status'), h);
      if (resolved && resolved !== currentStatus) {
        setCurrentStatus(resolved);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentStatus, searchParams]);

  // Load Status Data from API 13 & 14
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: any[] = [];
      if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'All') {
        data = await biharSrtInstallationService.getDashboardSitesByDistrict(currentStatus, selectedDistrict);
      } else {
        data = await biharSrtInstallationService.getDashboardSitesByStatus(currentStatus);
      }
      setItems(Array.isArray(data) ? data : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Bihar SRT StatusView] loadData error:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar SRT status records from server.');
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

    // Keep URL hash aligned: #pending for pending, #completed for complete
    if (statusKey === 'inst-pending') {
      window.location.hash = 'pending';
    } else if (statusKey === 'inst-complete') {
      window.location.hash = 'completed';
    } else if (statusKey.startsWith('inst-pay')) {
      window.location.hash = 'payment';
    }

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
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    return { total, installed, vApp, vRej, vPend };
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
    if (activeCategory === 'all') return BIHAR_SRT_STATUS_CATALOG;
    return BIHAR_SRT_STATUS_CATALOG.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  // Client-side search and verify filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (!q) return true;
      return [
        r.site_name,
        r.district,
        r.block,
        r.village,
        r.ca_no,
        r.contact_no,
        r.consumer_name,
        r.beneficiary_name,
        r.installer_name,
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
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Site Name', accessor: (r) => r.site_name || `Site #${r.id}` },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Consumer Name', accessor: (r) => r.consumer_name || r.beneficiary_name || DASH },
      { header: 'Contact No', accessor: (r) => r.contact_no || DASH },
      { header: 'CA Number', accessor: (r) => r.ca_no || DASH },
      { header: 'Capacity / Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH) },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Inspection Status', accessor: (r) => (Number(r.inpection_status ?? r.inspection_status ?? 0) === 1 ? 'Complete' : 'Pending') },
      { header: 'Verification Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Doc Status', accessor: (r) => (Number(r.inst_doc_status ?? r.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending') },
      { header: 'Claim Status', accessor: (r) => (Number(r.inst_claim_status ?? r.claim_status ?? 0) === 1 ? 'Raised' : 'Not Raised') },
      { header: 'Payment Stage', accessor: (r) => (Number(r.inst_pay3_status ?? 0) === 1 ? 'Stage 3 Paid' : Number(r.inst_pay2_status ?? 0) === 1 ? 'Stage 2 Paid' : Number(r.inst_pay1_status ?? 0) === 1 ? 'Stage 1 Paid' : 'Pending') },
    ],
    []
  );

  const pageTitle = useMemo(() => {
    let t = `Bihar SRT Sites: ${currentMeta.label}`;
    if (selectedDistrict && selectedDistrict !== 'all') t += ` (${selectedDistrict})`;
    return t;
  }, [currentMeta, selectedDistrict]);

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_SRT_${currentStatus}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_SRT_${currentStatus}`, filtered, exportCols);
  const handlePdf = () => printTableData(pageTitle, filtered, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Header */}
      <PageHead
        title={pageTitle}
        subtitle={`Live Bihar solar rooftop sites drilling on status "${currentStatus}" via GET /bihar/srt/installation/view-dashboard-data/${currentStatus}`}
        breadcrumbs={[
          { label: 'V-Portal', to: '/v-portal' },
          { label: 'Bihar SRT Dashboard', to: '/v/bihar/vendor-srt-installation-dashboard' },
          { label: 'Status View', active: true },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH} Refresh
            </button>
            <Link to="/v/bihar/vendor-srt-installation-dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              ← Back to Dashboard
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI Summary Cards */}
        {loading && items.length === 0 ? (
          <div className="ax-col--12" style={{ marginBottom: 12 }}>
            <KpiSkeleton count={4} />
          </div>
        ) : (
          <>
            <KpiCard
              icon={svgIcon(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />)}
              tone={currentMeta.tone}
              label={currentMeta.label}
              value={summary.total.toLocaleString('en-IN')}
              sub={`Total records for status "${currentStatus}"`}
            />
            <KpiCard
              icon={svgIcon(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>)}
              tone="emerald"
              label="Installed Complete"
              value={summary.installed.toLocaleString('en-IN')}
              sub={`${summary.total > 0 ? Math.round((summary.installed / summary.total) * 100) : 0}% of current filtered`}
            />
            <KpiCard
              icon={svgIcon(<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />)}
              tone="cyan"
              label="BREDA Approved"
              value={summary.vApp.toLocaleString('en-IN')}
              sub={`${summary.vPend} pending · ${summary.vRej} rejected`}
            />
            <KpiCard
              icon={svgIcon(<><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></>)}
              tone="violet"
              label="Filtered District"
              value={selectedDistrict && selectedDistrict !== 'all' ? selectedDistrict : 'All Districts'}
              sub={`Showing data updated at ${fmtTime(updatedAt)}`}
            />
          </>
        )}

        {/* Status Selection and Table Container */}
        <div className="ax-card ax-col--12">
          {/* Category Tabs */}
          <div className="srt-cat-tabs" role="tablist">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.key}
                className={`srt-cat-tab-btn ${activeCategory === tab.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Pills */}
          <div className="srt-status-pills" role="region" aria-label="Status Pills">
            {categoryStatuses.map((st) => {
              const isActive = currentStatus === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  className={`srt-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectStatus(st.key)}
                  title={st.sub}
                >
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Card Header with District Filter, Search & Export */}
          <div className="ax-card__header" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 14 }}>
            <div className="ax-card__titles">
              <h3 className="ax-card__title" style={{ fontSize: 16 }}>
                {currentMeta.label} Records
                <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ marginLeft: 8 }}>
                  {filtered.length.toLocaleString('en-IN')}
                </span>
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: 12 }}>
                {currentMeta.sub} · Endpoint: <code style={{ fontSize: 11 }}>/bihar/srt/installation/view-dashboard-data/{currentStatus}</code>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster">
                {/* District Filter Dropdown */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <label htmlFor="srt-district-filter" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>
                    District:
                  </label>
                  <select
                    id="srt-district-filter"
                    className="ax-input ax-input--sm"
                    style={{ height: 32, fontSize: 12, minWidth: 130 }}
                    value={selectedDistrict}
                    onChange={(e) => handleSelectDistrict(e.target.value)}
                  >
                    <option value="all">All Districts</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Verification Filter */}
                <select
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
                  value={verifyFilter}
                  onChange={(e) => {
                    setVerifyFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by verification"
                >
                  <option value="all">All Verify</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Search */}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Site Name, CA No, District…"
                />

                {/* Clear filters button */}
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters}>
                    Clear
                  </button>
                )}

                {/* Export Toolbar */}
                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ margin: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: 13 }}>
              <b>Error:</b> {errorMsg}
            </div>
          )}

          {/* Table */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Capacity (kW)</th>
                  <th className="ax-table__th" scope="col">Consumer Name</th>
                  <th className="ax-table__th" scope="col">Contact No</th>
                  <th className="ax-table__th" scope="col">CA Number</th>
                  <th className="ax-table__th" scope="col">Installation Status</th>
                  <th className="ax-table__th" scope="col">Inspection</th>
                  <th className="ax-table__th" scope="col">Verification</th>
                  <th className="ax-table__th" scope="col">Doc Status</th>
                  <th className="ax-table__th" scope="col">Payment Stage</th>
                  <th className="ax-table__th" scope="col">Photo</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && items.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Bihar SRT sites from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No records found"
                        message={
                          hasFilters
                            ? 'No SRT sites match your query. Try clearing filters.'
                            : `No solar rooftop sites currently found under status "${currentStatus}".`
                        }
                      />
                    </td>
                  </tr>
                )}
                {paged.map((r, idx) => {
                  const serialNo = (currentPage - 1) * pageSize + idx + 1;
                  const vState = verifyState(r);
                  const isInst = isInstalled(r);
                  const imgUrl = getMediaUrl(r.inst_gen_image || r.generation_image || r.site_image || r.rms_loger_image);
                  const isInspect = Number(r.inpection_status ?? r.inspection_status ?? 0) === 1;
                  const isDoc = Number(r.inst_doc_status ?? r.doc_status ?? 0) === 1;

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{serialNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>
                        {r.site_name || `Site #${r.id}`}
                      </td>
                      <td className="ax-table__td">{txt(r.district)}</td>
                      <td className="ax-table__td">{txt(r.block)}</td>
                      <td className="ax-table__td ax-num">
                        {r.sanction_load ? `${r.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {txt(r.consumer_name || r.beneficiary_name)}
                      </td>
                      <td className="ax-table__td ax-num">{txt(r.contact_no)}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {txt(r.ca_no)}
                      </td>
                      <td className="ax-table__td">
                        {isInst ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Installed</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {isInspect ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ax-badge--${verifyTone(vState)}`}>
                          {verifyLabel(vState)}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        {isDoc ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Uploaded</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {Number(r.inst_pay3_status ?? 0) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Stage 3 Paid</span>
                        ) : Number(r.inst_pay2_status ?? 0) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Stage 2 Paid</span>
                        ) : Number(r.inst_pay1_status ?? 0) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--accent">Stage 1 Paid</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Payment Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {imgUrl ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '2px 6px', height: 26, fontSize: 11 }}
                            onClick={() => setPreviewImage({ url: imgUrl, title: `Site: ${r.site_name || r.id}` })}
                          >
                            📷 View
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ padding: '2px 8px', height: 26, fontSize: 11 }}
                          onClick={() => setSelectedRecord(r)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          <div className="ax-card__footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--ax-border, #e2e8f0)', flexWrap: 'wrap', gap: 10 }}>
            <div className="srt-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(ps) => {
                  setPageSize(ps);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="ax-modal" role="dialog" aria-modal="true" onClick={() => setSelectedRecord(null)}>
          <div className="ax-modal__backdrop" />
          <div className="ax-modal__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Site Details: {selectedRecord.site_name || `Site #${selectedRecord.id}`}
              </h4>
              <button type="button" className="ax-modal__close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>District</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.district)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Block</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.block)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Consumer Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.consumer_name || selectedRecord.beneficiary_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CA Number</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.ca_no)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contact No</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.contact_no)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Capacity / Load</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{selectedRecord.sanction_load ? `${selectedRecord.sanction_load} kW` : DASH}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Installation Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{isInstalled(selectedRecord) ? 'Installed' : 'Pending'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inspection Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{Number(selectedRecord.inpection_status ?? selectedRecord.inspection_status ?? 0) === 1 ? 'Complete' : 'Pending'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>BREDA Verification</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{verifyLabel(verifyState(selectedRecord))}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Doc Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{Number(selectedRecord.inst_doc_status ?? selectedRecord.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Claim Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                    {Number(selectedRecord.inst_claim_status ?? selectedRecord.claim_status ?? 0) === 1 ? 'Raised' : 'Not Raised'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Created Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{txt(selectedRecord.created_at)}</div>
                </div>
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--primary" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
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

export default Bihar_Installation_SRT_StatusView;

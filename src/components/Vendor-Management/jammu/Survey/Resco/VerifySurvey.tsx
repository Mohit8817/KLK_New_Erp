import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
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
  jammuSurveyAdminService,
  resolveJammuSurveyMediaUrl,
  type JKRescoSurveyItem,
  type JKRescoSurveyStats,
} from '../jammuSurveyAdminService';

/* ───────── Responsive page CSS (Exact reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
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
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1400px) {
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
    border-color: var(--ax-accent, #2563eb);
    color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-pill-btn.active {
    background: var(--ax-gradient-accent, var(--ax-accent, #2563eb)) !important;
    color: var(--ax-on-accent, #ffffff) !important;
    border-color: transparent !important;
    box-shadow: var(--ax-glow-accent, 0 2px 4px rgba(37, 99, 235, 0.2)) !important;
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

const actionsRowStyle = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)',
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
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'danger';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Media Helper for Jammu Resco ── */
function getMediaUrl(path?: string | null, type?: 'image' | 'pdf' | 'bos' | 'doc'): string {
  if (!path) return '';
  const isPdf = /\.pdf($|\?)/i.test(path);
  const cat = type === 'bos' ? 'resco_bos' : (isPdf || type === 'pdf') ? 'resco_pdf' : 'resco_image';
  return resolveJammuSurveyMediaUrl(path, cat);
}

/* ── Image / Document Thumbnail helper ── */
function ImageThumbnail({
  path,
  label,
  type,
  onClick,
}: {
  path?: string | null;
  label: string;
  type?: 'image' | 'pdf' | 'bos' | 'doc';
  onClick: (url: string) => void;
}) {
  if (!path) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;
  const isPdf = /\.pdf($|\?)/i.test(path) || type === 'pdf';
  const url = getMediaUrl(path, type);

  return (
    <button
      type="button"
      onClick={() => onClick(url)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={`Click to view ${label}`}
    >
      {isPdf ? (
        <div style={{ width: 44, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }}>PDF</span>
        </div>
      ) : (
        <img
          src={url}
          alt={label}
          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      )}
    </button>
  );
}

export function VerifySurvey() {
  const [pendingSites, setPendingSites] = useState<JKRescoSurveyItem[]>([]);
  const [verifiedSites, setVerifiedSites] = useState<JKRescoSurveyItem[]>([]);
  const [summary, setSummary] = useState<JKRescoSurveyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [searchParams] = useSearchParams();

  // Report Wise Bifurcation tabs: 'pending' vs 'approved_rejected'
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  // Secondary sub-filter for approved_rejected tab: 'all' | 'approved' | 'rejected'
  const [approvedSubFilter, setApprovedSubFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Popup State: Verification Status (API 15)
  const [selectedSiteForVerify, setSelectedSiteForVerify] = useState<JKRescoSurveyItem | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<number>(1); // 1 = Approve, 2 = Reject, 0 = Pending
  const [verifyRemarks, setVerifyRemarks] = useState<string>('');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);

  // Material Dispatch Modal State (API 16)
  const [selectedSiteForDispatch, setSelectedSiteForDispatch] = useState<JKRescoSurveyItem | null>(null);
  const [dispatchFile, setDispatchFile] = useState<File | null>(null);
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dispatchRemarks, setDispatchRemarks] = useState<string>('');
  const [submittingDispatch, setSubmittingDispatch] = useState<boolean>(false);

  // BOS Status Modal State (API 17)
  const [selectedSiteForBOS, setSelectedSiteForBOS] = useState<JKRescoSurveyItem | null>(null);
  const [bosRemarks, setBosRemarks] = useState<string>('');
  const [submittingBOS, setSubmittingBOS] = useState<boolean>(false);

  // Full Details View Modal State
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<JKRescoSurveyItem | null>(null);

  // Lightbox Photo / PDF preview
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch API 14: GET /jammu/resco/survey/view-survey
  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuSurveyAdminService.viewRescoSurvey();
      const rawPending = Array.isArray(res.pending) ? res.pending : [];
      const rawVerify = Array.isArray(res.verify) ? res.verify : [];

      // Combine into a map to deduplicate by id
      const map = new Map<number, JKRescoSurveyItem>();
      rawPending.forEach((s) => map.set(s.id, s));
      rawVerify.forEach((s) => map.set(s.id, s));
      const all = Array.from(map.values());

      // Strictly pending: verification status is NOT 1 (approved) and NOT 2 (rejected)
      const pSites = all.filter((s) => {
        const v = Number(s.survey_verify_status ?? s.verify_status ?? 0);
        return v !== 1 && v !== 2;
      });

      // Strictly approved/rejected: verification status is 1 (approved) or 2 (rejected)
      const vSites = all.filter((s) => {
        const v = Number(s.survey_verify_status ?? s.verify_status ?? 0);
        return v === 1 || v === 2;
      });

      setPendingSites(pSites);
      setVerifiedSites(vSites);
      setSummary(res.resco || null);
    } catch (err: any) {
      console.error('Failed to load Jammu Resco survey verification data:', err);
      setErrorMsg(err?.message || 'Failed to fetch survey verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Deep-link query param listener (?tab=... or ?site_id=...)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'approved' || tabParam === 'verified' || tabParam === 'approved_rejected') {
      setActiveTab('approved_rejected');
    }
    const siteIdParam = searchParams.get('site_id') || searchParams.get('id');
    if (siteIdParam) {
      const inPending = pendingSites.find((s) => String(s.id) === String(siteIdParam));
      if (inPending) {
        setActiveTab('pending');
        setSelectedSiteForVerify(inPending);
        setVerifyStatusChoice(1);
        setVerifyRemarks(inPending.survey_verify_remarks || inPending.verify_remarks || '');
      } else {
        const inVerified = verifiedSites.find((s) => String(s.id) === String(siteIdParam));
        if (inVerified) {
          setActiveTab('approved_rejected');
          setSelectedSiteForDetails(inVerified);
        }
      }
    }
  }, [searchParams, pendingSites, verifiedSites]);

  // Handle Verify Survey Status Submit (API 15)
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForVerify) return;

    setSubmittingVerify(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuSurveyAdminService.verifyRescoSurveyStatus(
        selectedSiteForVerify.id,
        verifyStatusChoice,
        verifyRemarks.trim() || undefined
      );
      const updatedSite: JKRescoSurveyItem = {
        ...selectedSiteForVerify,
        survey_verify_status: verifyStatusChoice,
        verify_status: verifyStatusChoice,
        survey_verify_remarks: verifyRemarks.trim() || selectedSiteForVerify.survey_verify_remarks,
        verify_remarks: verifyRemarks.trim() || selectedSiteForVerify.verify_remarks,
      };

      if (verifyStatusChoice === 1 || verifyStatusChoice === 2) {
        // Site verified (Approved or Rejected): remove from pending and move to verified
        setPendingSites((prev) => prev.filter((s) => s.id !== selectedSiteForVerify.id));
        setVerifiedSites((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForVerify.id)]);
      } else {
        // Kept in pending
        setVerifiedSites((prev) => prev.filter((s) => s.id !== selectedSiteForVerify.id));
        setPendingSites((prev) => [updatedSite, ...prev.filter((s) => s.id !== selectedSiteForVerify.id)]);
      }

      setSummary((prev: any) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (verifyStatusChoice === 1) {
          next.survey_verify_pending = Math.max(0, (next.survey_verify_pending || 0) - 1);
          next.survey_verify = (next.survey_verify || 0) + 1;
        } else if (verifyStatusChoice === 2) {
          next.survey_verify_pending = Math.max(0, (next.survey_verify_pending || 0) - 1);
          next.survey_verify_reject = (next.survey_verify_reject || 0) + 1;
        }
        return next;
      });

      setSuccessMsg(res.message || 'Survey verification status updated successfully.');
      setSelectedSiteForVerify(null);
      setVerifyRemarks('');
    } catch (err: any) {
      console.error('Verify status submit error:', err);
      setErrorMsg(err?.message || 'Failed to update survey verification status.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Handle Material Dispatch Submit (API 16)
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForDispatch) return;
    if (!dispatchFile) return setErrorMsg('Upload File is required for material dispatch.');
    if (!dispatchDate) return setErrorMsg('Dispatch Date is required.');

    setSubmittingDispatch(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('id', String(selectedSiteForDispatch.id));
      formData.append('file', dispatchFile);
      formData.append('material_document', dispatchFile);
      formData.append('dispatch_date', dispatchDate);
      formData.append('material_date', dispatchDate);
      if (dispatchRemarks.trim()) {
        formData.append('remarks', dispatchRemarks.trim());
        formData.append('material_remarks', dispatchRemarks.trim());
      }

      const res = await jammuSurveyAdminService.materialDispatchRescoSurvey(formData);
      setSuccessMsg(res.message || 'Material dispatched successfully!');

      // Instantly mark material_status as 1 (Dispatched) so the button is removed immediately
      setVerifiedSites((prev) =>
        prev.map((s) =>
          s.id === selectedSiteForDispatch.id
            ? {
                ...s,
                material_status: 1,
                material_date: dispatchDate,
                material_dispatch_date: dispatchDate,
                material_remarks: dispatchRemarks,
                material_dispatch_remarks: dispatchRemarks,
              }
            : s
        )
      );

      setSelectedSiteForDispatch(null);
      setDispatchFile(null);
      setDispatchRemarks('');
    } catch (err: any) {
      console.error('Material dispatch error:', err);
      setErrorMsg(err?.message || 'Failed to dispatch material.');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Handle BOS Status Submit (API 17)
  const handleBOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForBOS) return;

    setSubmittingBOS(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuSurveyAdminService.bosStatusRescoSurvey(selectedSiteForBOS.id, bosRemarks.trim());
      setSuccessMsg(res.message || 'BOS verification updated successfully!');

      const updateRow = (row: JKRescoSurveyItem): JKRescoSurveyItem =>
        row.id === selectedSiteForBOS.id
          ? {
              ...row,
              bos_verify_status: 1,
              bos_status: 1,
              bos_verify_remarks: bosRemarks.trim(),
              bos_remarks: bosRemarks.trim(),
            }
          : row;

      setPendingSites((prev) => prev.map(updateRow));
      setVerifiedSites((prev) => prev.map(updateRow));

      setSelectedSiteForBOS(null);
      setBosRemarks('');
    } catch (err: any) {
      console.error('BOS verification error:', err);
      setErrorMsg(err?.message || 'Failed to update BOS status.');
    } finally {
      setSubmittingBOS(false);
    }
  };

  // Filter current active tab data
  const currentList = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingSites;
    }
    // activeTab === 'approved_rejected'
    if (approvedSubFilter === 'approved') {
      return verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 1);
    }
    if (approvedSubFilter === 'rejected') {
      return verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 2);
    }
    return verifiedSites;
  }, [activeTab, pendingSites, verifiedSites, approvedSubFilter]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((site) => {
      const sName = site.site_name?.toLowerCase() || '';
      const vName = (site.vendors?.name || site.vendor_name || '').toLowerCase();
      const dist = site.district?.toLowerCase() || '';
      const ca = site.ca_no?.toLowerCase() || '';
      const addr = (site.site_address || site.address || '').toLowerCase();
      const person = (site.agency_person_name || site.contact_person || '').toLowerCase();
      const nodal = site.nodal_person?.toLowerCase() || '';
      const idStr = String(site.id || site.unique_id || '');
      return (
        sName.includes(q) ||
        vName.includes(q) ||
        dist.includes(q) ||
        ca.includes(q) ||
        addr.includes(q) ||
        person.includes(q) ||
        nodal.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<JKRescoSurveyItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JKRescoSurveyItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Unique ID', accessor: (r: JKRescoSurveyItem) => r.unique_id || `#${r.id}` },
      { header: 'Vendor Name', accessor: (r: JKRescoSurveyItem) => r.vendors?.name || r.vendor_name || `Vendor #${r.survey_vendor || r.vendor || '—'}` },
      { header: 'State', accessor: (r: JKRescoSurveyItem) => r.state?.toUpperCase() || 'JAMMU' },
      { header: 'District', accessor: (r: JKRescoSurveyItem) => r.district || '—' },
      { header: 'Site Name', accessor: (r: JKRescoSurveyItem) => r.site_name || '—' },
      { header: 'Sanction Load (KW/KVA)', accessor: (r: JKRescoSurveyItem) => r.sanction_load || '—' },
      { header: 'Connected Load (KW)', accessor: (r: JKRescoSurveyItem) => r.connected_load || '—' },
      { header: 'BOS Status', accessor: (r: JKRescoSurveyItem) => (Number(r.bos_verify_status ?? r.bos_status) === 1 ? 'Verified' : 'Pending') },
      { header: 'BOS Remarks', accessor: (r: JKRescoSurveyItem) => r.bos_verify_remarks || r.bos_remarks || '—' },
      { header: 'Site Address', accessor: (r: JKRescoSurveyItem) => r.site_address || r.address || '—' },
      { header: 'CA No.', accessor: (r: JKRescoSurveyItem) => r.ca_no || '—' },
      { header: 'Survey Date', accessor: (r: JKRescoSurveyItem) => r.survey_date || '—' },
      { header: 'Load Type', accessor: (r: JKRescoSurveyItem) => r.load_type || '—' },
      { header: 'Connection Phase', accessor: (r: JKRescoSurveyItem) => r.connection_phase || '—' },
      { header: 'Meter Type', accessor: (r: JKRescoSurveyItem) => r.meter_type || '—' },
      { header: 'Roof Condition', accessor: (r: JKRescoSurveyItem) => r.roof_condition || '—' },
      { header: 'Total Roof Area (Sq.Feet)', accessor: (r: JKRescoSurveyItem) => r.total_roof_area || r.area_roof || '—' },
      { header: 'Verify Status', accessor: (r: JKRescoSurveyItem) => (Number(r.survey_verify_status ?? r.verify_status) === 1 ? 'Approved' : Number(r.survey_verify_status ?? r.verify_status) === 2 ? 'Rejected' : 'Pending') },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_Resco_Survey_Verify_${activeTab}`;
  const fileTitle = `Jammu Resco Survey Verification (${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected'})`;

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
  const totalAssignedSites = summary?.assignsite ?? summary?.assigned ?? (pendingSites.length + verifiedSites.length);
  const completeSurvey = summary?.complete_survey ?? summary?.survey_done ?? (pendingSites.length + verifiedSites.length);
  const pendingSurvey = summary?.pending_survey ?? summary?.survey_pending ?? 0;
  const verifyPendingCount = summary?.survey_verify_pending ?? pendingSites.length;
  const verifyApprovedCount = summary?.survey_verify ?? summary?.survey_verify_complete ?? verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 1).length;
  const verifyRejectCount = summary?.survey_verify_reject ?? verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 2).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Welcome to, Jammu RESCO Survey"
        subtitle="Review vendor submitted rooftop solar survey feasibility reports, shadow photos, and verify sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Verify Survey' },
        ]}

        
      />

      {/* Status Feedback Banners */}
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

      {/* Top 6 KPI Metric Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
          tone="accent"
          label="Total Assigned Sites"
          value={totalAssignedSites}
          sub="Sites assigned to surveyors"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Complete Survey"
          value={completeSurvey}
          sub="Completed by survey teams"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          tone="amber"
          label="Pending Survey"
          value={pendingSurvey}
          sub="Survey in progress"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="violet"
          label="Verify Pending Survey"
          value={verifyPendingCount}
          sub="Awaiting Admin Review"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Verify Approve Survey"
          value={verifyApprovedCount}
          sub="Approved & Created in Resco"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="danger"
          label="Verify Reject Survey"
          value={verifyRejectCount}
          sub="Rejected feasibility reports"
        />
      </div>

      {/* Report Wise Bifurcation Pills */}
      <div className="asw-bifurcation-row" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            pagination.setPage(1);
          }}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingSites.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('approved_rejected');
            pagination.setPage(1);
          }}
        >
          Approved/Rejected Resco Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedSites.length}
          </span>
        </button>

        {activeTab === 'approved_rejected' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8, paddingLeft: 10, borderLeft: '1px solid var(--ax-border, #cbd5e1)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Status:</span>
            <button
              type="button"
              className={`asw-pill-btn ${approvedSubFilter === 'all' ? 'active ax-btn--secondary' : ''}`}
              style={{ fontSize: 12, padding: '3px 10px', height: 28 }}
              onClick={() => {
                setApprovedSubFilter('all');
                pagination.setPage(1);
              }}
            >
              All ({verifiedSites.length})
            </button>
            <button
              type="button"
              className={`asw-pill-btn ${approvedSubFilter === 'approved' ? 'active' : ''}`}
              style={{
                fontSize: 12,
                padding: '3px 10px',
                height: 28,
                color: approvedSubFilter === 'approved' ? '#fff' : '#15803d',
                background: approvedSubFilter === 'approved' ? '#16a34a' : '#f0fdf4',
                borderColor: '#86efac',
              }}
              onClick={() => {
                setApprovedSubFilter('approved');
                pagination.setPage(1);
              }}
            >
              Approved ({verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 1).length})
            </button>
            <button
              type="button"
              className={`asw-pill-btn ${approvedSubFilter === 'rejected' ? 'active' : ''}`}
              style={{
                fontSize: 12,
                padding: '3px 10px',
                height: 28,
                color: approvedSubFilter === 'rejected' ? '#fff' : '#b91c1c',
                background: approvedSubFilter === 'rejected' ? '#dc2626' : '#fef2f2',
                borderColor: '#fca5a5',
              }}
              onClick={() => {
                setApprovedSubFilter('rejected');
                pagination.setPage(1);
              }}
            >
              Rejected ({verifiedSites.filter((s) => Number(s.survey_verify_status ?? s.verify_status) === 2).length})
            </button>
          </div>
        )}
      </div>

      {/* Main Data Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Jammu Resco Survey Pending Verification' : 'Approved/Rejected Resco Data'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredList.length} site{filteredList.length === 1 ? '' : 's'} with electrical specifications, structural feasibility & proof photos
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
                placeholder="Search site, CA, vendor, district..."
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

        {/* Responsive Horizontal Scroll Table */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                {activeTab === 'approved_rejected' && (
                  <>
                    <th className="ax-table__th">Division</th>
                    <th className="ax-table__th">Sub Division</th>
                    <th className="ax-table__th">Department</th>
                  </>
                )}
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Sanction Load (KW/KVA)</th>
                <th className="ax-table__th">Connected Load (KW)</th>
                <th className="ax-table__th">BOS Status</th>
                <th className="ax-table__th">BOS File</th>
                <th className="ax-table__th">BOS Remarks</th>
                <th className="ax-table__th">Site Address</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Survey Address</th>
                <th className="ax-table__th">Nearest Landmark</th>
                <th className="ax-table__th">Agency Contact Person Name</th>
                <th className="ax-table__th">Agency Contact Number</th>
                <th className="ax-table__th">Nodal Person</th>
                <th className="ax-table__th">Nodal Person Contact</th>
                <th className="ax-table__th">Survey Date</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Load Type</th>
                <th className="ax-table__th">Connection Phase</th>
                <th className="ax-table__th">Meter Connection Type</th>
                <th className="ax-table__th">Meter Number</th>
                <th className="ax-table__th">Meter Type</th>
                <th className="ax-table__th">Grid Power Availability</th>
                <th className="ax-table__th">Three-Phase Availability</th>
                <th className="ax-table__th">Missing Phase</th>
                <th className="ax-table__th">LTDB Present</th>
                <th className="ax-table__th">Roof Condition</th>
                <th className="ax-table__th">Total Roof Area (Sq.Feet)</th>
                <th className="ax-table__th">Free Space for Solar Installation (in Sq.Feet)</th>
                <th className="ax-table__th">Free Space for Control Room/Inverter (in Sq.Feet)</th>
                <th className="ax-table__th">Earth Pit Position</th>
                <th className="ax-table__th">Age of Building</th>
                <th className="ax-table__th">Access to the Roof</th>
                <th className="ax-table__th">Rooftop Height (Feet)</th>
                <th className="ax-table__th">Parapet Height (Feet)</th>
                <th className="ax-table__th">No. of Floors</th>
                <th className="ax-table__th">Water Source for Cleaning</th>
                <th className="ax-table__th">Access to Site</th>
                <th className="ax-table__th">Distance of Site from Main Road (km)</th>
                <th className="ax-table__th">Building Image</th>
                <th className="ax-table__th">Roof Image</th>
                <th className="ax-table__th">Control Room</th>
                <th className="ax-table__th">Meter</th>
                <th className="ax-table__th">Other Image</th>
                <th className="ax-table__th">PDF</th>
                <th className="ax-table__th">Verify Status</th>
                {activeTab === 'approved_rejected' && (
                  <>
                    <th className="ax-table__th">Material Document</th>
                    <th className="ax-table__th">Material Date</th>
                    <th className="ax-table__th">Material Dispatch By</th>
                    <th className="ax-table__th">Material Status</th>
                    <th className="ax-table__th">Material Remarks</th>
                  </>
                )}
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 52 : 60} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Jammu Resco survey records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 52 : 60} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No survey records available in this section'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: JKRescoSurveyItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vStatus = Number(row.survey_verify_status ?? row.verify_status ?? 0);
                  const isBOSVerified = Number(row.bos_verify_status ?? row.bos_status) === 1;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {row.unique_id || `#${row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendors?.name || row.vendor_name || `Vendor #${row.survey_vendor || row.vendor || '—'}`}
                      </td>
                      <td className="ax-table__td">{row.state?.toUpperCase() || 'JAMMU'}</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      {activeTab === 'approved_rejected' && (
                        <>
                          <td className="ax-table__td">{row.division || '—'}</td>
                          <td className="ax-table__td">{row.sub_division || '—'}</td>
                          <td className="ax-table__td">{row.department || row.dept_name || '—'}</td>
                        </>
                      )}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#1e293b' }}>
                        {row.site_name || '—'}
                      </td>
                      <td className="ax-table__td">{row.sanction_load || '—'}</td>
                      <td className="ax-table__td">{row.connected_load || '—'}</td>
                      <td className="ax-table__td">
                        {isBOSVerified ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                            Verified
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.bos_file || row.bos_verify_file} label="BOS File" type="bos" onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.bos_verify_remarks || row.bos_remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.site_address || row.address || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.ca_no || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.survey_address || row.site_address || row.address || '—'}
                      </td>
                      <td className="ax-table__td">{row.nearest_landmark || row.landmark || '—'}</td>
                      <td className="ax-table__td">{row.agency_person_name || row.agency_contact_person_name || row.contact_person || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.agency_person_contact || row.agency_contact_number || row.contact_number || '—'}
                      </td>
                      <td className="ax-table__td">{row.nodal_person || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.nodal_person_contact || row.contact_nodal || '—'}
                      </td>
                      <td className="ax-table__td">{row.survey_date || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.latitude || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.longitude || '—'}</td>
                      <td className="ax-table__td">{row.load_type || '—'}</td>
                      <td className="ax-table__td">{row.connection_phase || '—'}</td>
                      <td className="ax-table__td">{row.meter_connection || row.meter_connection_type || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.meter_number || '—'}</td>
                      <td className="ax-table__td">{row.meter_type || '—'}</td>
                      <td className="ax-table__td">{row.grid_power || row.grid_power_availability || '—'}</td>
                      <td className="ax-table__td">{row.all_3_phase_ltdb || row.three_phase_availability || '—'}</td>
                      <td className="ax-table__td">{row.missing_phase || '—'}</td>
                      <td className="ax-table__td">{row.ltdb_present || '—'}</td>
                      <td className="ax-table__td">{row.roof_condition || '—'}</td>
                      <td className="ax-table__td">{row.total_roof_area || row.area_roof || '—'}</td>
                      <td className="ax-table__td">{row.free_space_solar || row.free_space_for_solar || '—'}</td>
                      <td className="ax-table__td">{row.free_space_inverter || row.free_space_for_control_room || '—'}</td>
                      <td className="ax-table__td">{row.earth_pit_position || row.earth_pit || '—'}</td>
                      <td className="ax-table__td">{row.age_of_building || row.building_age || '—'}</td>
                      <td className="ax-table__td">{row.access_to_roof || row.roof_access || '—'}</td>
                      <td className="ax-table__td">{row.rooftop_height || '—'}</td>
                      <td className="ax-table__td">{row.parapet_height || '—'}</td>
                      <td className="ax-table__td">{row.no_of_floors || row.floors_number || '—'}</td>
                      <td className="ax-table__td">{row.water_source_for_cleaning || row.water_source || '—'}</td>
                      <td className="ax-table__td">{row.access_to_site || row.site_access || '—'}</td>
                      <td className="ax-table__td">{row.distance_of_site_from_main_road || row.site_distance || '—'}</td>

                      {/* Photo 1: Building Image */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.building_image || row.image1} label="Building" type="image" onClick={setLightboxUrl} />
                      </td>

                      {/* Photo 2: Roof Image */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.roof_image || row.image2} label="Roof" type="image" onClick={setLightboxUrl} />
                      </td>

                      {/* Photo 3: Control Room */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.control_room_image || row.image3} label="Control Room" type="image" onClick={setLightboxUrl} />
                      </td>

                      {/* Photo 4: Meter */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.meter_image || row.image4} label="Meter" type="image" onClick={setLightboxUrl} />
                      </td>

                      {/* Photo 5: Other Image */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.other_image || row.image5} label="Other Image" type="image" onClick={setLightboxUrl} />
                      </td>

                      {/* Document: PDF */}
                      <td className="ax-table__td">
                        <ImageThumbnail path={row.pdf || row.pdf_file} label="Survey PDF" type="pdf" onClick={setLightboxUrl} />
                      </td>

                      {/* Verify Status Badge */}
                      <td className="ax-table__td">
                        {vStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : vStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {activeTab === 'approved_rejected' && (
                        <>
                          <td className="ax-table__td">
                            <ImageThumbnail path={row.material_document || row.material_dispatch_file} label="Material Document" type="doc" onClick={setLightboxUrl} />
                          </td>
                          <td className="ax-table__td">{row.material_date || row.material_dispatch_date || '—'}</td>
                          <td className="ax-table__td">{row.material_dispatch_by || '—'}</td>
                          <td className="ax-table__td">
                            {Number(row.material_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                Dispatched
                              </span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="ax-table__td" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.material_remarks || row.material_dispatch_remarks || '—'}
                          </td>
                        </>
                      )}

                      {/* Action Cell */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSiteForDetails(row)}
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600 }}
                            title="View Full Site Details"
                          >
                            Details
                          </button>

                          {/* Verification actions ONLY available in pending tab */}
                          {activeTab === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSiteForVerify(row);
                                  setVerifyStatusChoice(1);
                                  setVerifyRemarks(row.survey_verify_remarks || row.verify_remarks || '');
                                }}
                                className="ax-btn ax-btn--primary ax-btn--sm"
                                style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                              >
                                Verify
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSiteForBOS(row);
                                  setBosRemarks(row.bos_verify_remarks || row.bos_remarks || '');
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title="Verify BOS Status"
                              >
                                BOS
                              </button>
                            </>
                          )}

                          {/* In Approved/Rejected tab: ONLY Material Dispatch, and button disappears as soon as dispatched */}
                          {activeTab === 'approved_rejected' && (
                            <>
                              {vStatus === 1 ? (
                                Number(row.material_status) === 1 ? (
                                  <span
                                    className="ax-badge ax-badge--soft ax-badge--success"
                                    style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                                    title={`Dispatched on ${row.material_date || row.material_dispatch_date || 'N/A'}`}
                                  >
                                    ✓ Dispatched
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSiteForDispatch(row);
                                      setDispatchDate(row.material_date || row.material_dispatch_date || new Date().toISOString().slice(0, 10));
                                      setDispatchRemarks(row.material_remarks || row.material_dispatch_remarks || '');
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      background: '#16a34a',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 1px 2px rgba(22, 163, 74, 0.3)',
                                    }}
                                    title="Material Dispatch"
                                  >
                                    Dispatch
                                  </button>
                                )
                              ) : (
                                <span
                                  className="ax-badge ax-badge--soft ax-badge--danger"
                                  style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                                >
                                  Rejected
                                </span>
                              )}
                            </>
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

        {/* Left Aligned Pagination in Footer */}
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

      {/* ── Modal: Verify Survey Status (API 15) ── */}
      <Modal
        open={Boolean(selectedSiteForVerify)}
        onClose={() => setSelectedSiteForVerify(null)}
        title="Verify Survey Status"
        subtitle={selectedSiteForVerify ? `Site: #${selectedSiteForVerify.id} — ${selectedSiteForVerify.site_name} (${selectedSiteForVerify.district})` : ''}
        maxWidth={520}
      >
        {selectedSiteForVerify && (
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
              <strong>Notice:</strong> Approving (Status: 1) this survey creates a new verified site entry in the central Jammu Resco project table.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Verification Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="ax-input"
                style={{ width: '100%', height: 42, fontSize: 13, borderRadius: 8 }}
                value={verifyStatusChoice}
                onChange={(e) => setVerifyStatusChoice(Number(e.target.value))}
                required
              >
                <option value={1}>1 — Approve Survey (Feasible)</option>
                <option value={2}>2 — Reject Survey (Unfeasible)</option>
                <option value={0}>0 — Keep Pending</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Remarks (Optional)
              </label>
              <textarea
                className="ax-input"
                style={{ width: '100%', height: 80, padding: 10, fontSize: 13, resize: 'vertical' }}
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="Enter remarks or approval reason"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedSiteForVerify(null)}
                disabled={submittingVerify}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingVerify}
                style={{ minWidth: 120, fontWeight: 700 }}
              >
                {submittingVerify ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Material Dispatch (API 16) ── */}
      <Modal
        open={Boolean(selectedSiteForDispatch)}
        onClose={() => setSelectedSiteForDispatch(null)}
        title="Material Dispatch"
        subtitle={selectedSiteForDispatch ? `Site: #${selectedSiteForDispatch.id} — ${selectedSiteForDispatch.site_name}` : ''}
        maxWidth={540}
      >
        {selectedSiteForDispatch && (
          <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Upload File <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                className="ax-input"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ width: '100%', padding: '8px' }}
                onChange={(e) => setDispatchFile(e.target.files?.[0] || null)}
                required
              />
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                Upload signed dispatch challan / consignment note (PDF, PNG, JPG)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Dispatch Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                className="ax-input"
                style={{ width: '100%', height: 42, fontSize: 13 }}
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Remarks
              </label>
              <input
                type="text"
                className="ax-input"
                style={{ width: '100%', height: 42, fontSize: 13 }}
                value={dispatchRemarks}
                onChange={(e) => setDispatchRemarks(e.target.value)}
                placeholder="Optional dispatch remarks"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedSiteForDispatch(null)}
                disabled={submittingDispatch}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingDispatch || !dispatchFile}
                style={{ minWidth: 140, fontWeight: 700 }}
              >
                {submittingDispatch ? 'Dispatching...' : 'Submit Dispatch'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: BOS Verification Status (API 17) ── */}
      <Modal
        open={Boolean(selectedSiteForBOS)}
        onClose={() => setSelectedSiteForBOS(null)}
        title="BOS Verification"
        subtitle={selectedSiteForBOS ? `Site: #${selectedSiteForBOS.id} — ${selectedSiteForBOS.site_name}` : ''}
        maxWidth={500}
      >
        {selectedSiteForBOS && (
          <form onSubmit={handleBOSSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}>
              <div><strong>BOS Status:</strong> {Number(selectedSiteForBOS.bos_verify_status ?? selectedSiteForBOS.bos_status) === 1 ? 'Verified (1)' : 'Pending (0)'}</div>
              {(selectedSiteForBOS.bos_file || selectedSiteForBOS.bos_verify_file) && (
                <div style={{ marginTop: 6 }}>
                  <a
                    href={getMediaUrl(selectedSiteForBOS.bos_file || selectedSiteForBOS.bos_verify_file, 'bos')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    View Attached BOS File ↗
                  </a>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                BOS Verification Remarks
              </label>
              <textarea
                className="ax-input"
                style={{ width: '100%', height: 90, padding: 10, fontSize: 13, resize: 'vertical' }}
                value={bosRemarks}
                onChange={(e) => setBosRemarks(e.target.value)}
                placeholder="Enter BOS verification notes or approval remarks"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedSiteForBOS(null)}
                disabled={submittingBOS}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submittingBOS}
                style={{ minWidth: 120, fontWeight: 700 }}
              >
                {submittingBOS ? 'Verifying...' : 'Verify BOS'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Comprehensive Site Details ── */}
      <Modal
        open={Boolean(selectedSiteForDetails)}
        onClose={() => setSelectedSiteForDetails(null)}
        title="Jammu Resco Survey Site Details"
        subtitle={selectedSiteForDetails ? `ID: #${selectedSiteForDetails.id} • ${selectedSiteForDetails.site_name} (${selectedSiteForDetails.district})` : ''}
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {selectedSiteForDetails && (
              <button
                type="button"
                onClick={() => {
                  const s = selectedSiteForDetails;
                  setSelectedSiteForDetails(null);
                  setSelectedSiteForVerify(s);
                  setVerifyStatusChoice(Number(s.survey_verify_status ?? s.verify_status ?? 1));
                  setVerifyRemarks(s.survey_verify_remarks || s.verify_remarks || '');
                }}
                className="ax-btn ax-btn--primary"
                style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700 }}
              >
                Verify This Survey
              </button>
            )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Top Info Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>CA Number: </span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedSiteForDetails.ca_no || '—'}</strong>
                <span style={{ marginLeft: 14, fontSize: 12, color: '#64748b' }}>District: <strong>{selectedSiteForDetails.district || '—'}</strong></span>
                <span style={{ marginLeft: 14, fontSize: 12, color: '#64748b' }}>Survey Date: <strong>{selectedSiteForDetails.survey_date || '—'}</strong></span>
              </div>
              <div>
                {Number(selectedSiteForDetails.survey_verify_status ?? selectedSiteForDetails.verify_status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Approved
                  </span>
                ) : Number(selectedSiteForDetails.survey_verify_status ?? selectedSiteForDetails.verify_status) === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Rejected
                  </span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            {/* Grid 1: General & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                  General Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Site Name:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.site_name || '—'}</span>
                  <span style={{ color: '#64748b' }}>Unique ID:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.unique_id || `#${selectedSiteForDetails.id}`}</span>
                  <span style={{ color: '#64748b' }}>State / District:</span>
                  <span>{selectedSiteForDetails.state?.toUpperCase() || 'JAMMU'} / {selectedSiteForDetails.district || '—'}</span>
                  <span style={{ color: '#64748b' }}>Division / Sub-Div:</span>
                  <span>{selectedSiteForDetails.division || '—'} / {selectedSiteForDetails.sub_division || '—'}</span>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span>{selectedSiteForDetails.department || selectedSiteForDetails.dept_name || '—'}</span>
                  <span style={{ color: '#64748b' }}>Site Address:</span>
                  <span>{selectedSiteForDetails.site_address || selectedSiteForDetails.address || '—'}</span>
                  <span style={{ color: '#64748b' }}>Nearest Landmark:</span>
                  <span>{selectedSiteForDetails.nearest_landmark || selectedSiteForDetails.landmark || '—'}</span>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                  Contacts & Coordinates
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 6, fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Agency Contact:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.agency_person_name || selectedSiteForDetails.agency_contact_person_name || selectedSiteForDetails.contact_person || '—'}</span>
                  <span style={{ color: '#64748b' }}>Agency Phone:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.agency_person_contact || selectedSiteForDetails.agency_contact_number || selectedSiteForDetails.contact_number || '—'}</span>
                  <span style={{ color: '#64748b' }}>Nodal Person:</span>
                  <span style={{ fontWeight: 600 }}>{selectedSiteForDetails.nodal_person || '—'}</span>
                  <span style={{ color: '#64748b' }}>Nodal Contact:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedSiteForDetails.nodal_person_contact || selectedSiteForDetails.contact_nodal || '—'}</span>
                  <span style={{ color: '#64748b' }}>GPS Coordinates:</span>
                  <span>{selectedSiteForDetails.latitude}, {selectedSiteForDetails.longitude}</span>
                  <span style={{ color: '#64748b' }}>Distance from Road:</span>
                  <span>{selectedSiteForDetails.distance_of_site_from_main_road || selectedSiteForDetails.site_distance || '0'} km</span>
                </div>
              </div>
            </div>

            {/* Grid 2: Electrical & Metering */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                Technical & Electrical Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Load Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.load_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Connection Phase</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.connection_phase || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Meter Connection</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.meter_connection || selectedSiteForDetails.meter_connection_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Meter Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedSiteForDetails.meter_number || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Meter Type</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.meter_type || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Sanction Load</div>
                  <div style={{ fontWeight: 700 }}>{selectedSiteForDetails.sanction_load || '—'} KW/KVA</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Connected Load</div>
                  <div style={{ fontWeight: 700 }}>{selectedSiteForDetails.connected_load || '—'} KW</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Grid Power Availability</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.grid_power || selectedSiteForDetails.grid_power_availability || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>3-Phase Available</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.all_3_phase_ltdb || selectedSiteForDetails.three_phase_availability || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>LTDB Present</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.ltdb_present || '—'}</div>
                </div>
              </div>
            </div>

            {/* Grid 3: Civil & Structural */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
                Civil & Structural Feasibility
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Roof Condition</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>{selectedSiteForDetails.roof_condition || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Total Roof Area</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.total_roof_area || selectedSiteForDetails.area_roof || '—'} Sq. Ft.</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Solar Space Available</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.free_space_solar || selectedSiteForDetails.free_space_for_solar || '—'} Sq. Ft.</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Control Room Space</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.free_space_inverter || selectedSiteForDetails.free_space_for_control_room || '—'} Sq. Ft.</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Earth Pit Position</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.earth_pit_position || selectedSiteForDetails.earth_pit || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Building Age</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.age_of_building || selectedSiteForDetails.building_age || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Roof Access (Staircase)</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.access_to_roof || selectedSiteForDetails.roof_access || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Rooftop / Parapet Height</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.rooftop_height || '—'} ft / {selectedSiteForDetails.parapet_height || '—'} ft</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>No. of Floors</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.no_of_floors || selectedSiteForDetails.floors_number || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Water Source for Cleaning</div>
                  <div style={{ fontWeight: 600 }}>{selectedSiteForDetails.water_source_for_cleaning || selectedSiteForDetails.water_source || '—'}</div>
                </div>
              </div>
            </div>

            {/* Grid 4: Photographic Evidence */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#ffffff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>
                Photographic & Document Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Building Image', path: selectedSiteForDetails.building_image || selectedSiteForDetails.image1, type: 'image' as const },
                  { label: 'Roof Image', path: selectedSiteForDetails.roof_image || selectedSiteForDetails.image2, type: 'image' as const },
                  { label: 'Control Room Image', path: selectedSiteForDetails.control_room_image || selectedSiteForDetails.image3, type: 'image' as const },
                  { label: 'Meter Image', path: selectedSiteForDetails.meter_image || selectedSiteForDetails.image4, type: 'image' as const },
                  { label: 'Other Image', path: selectedSiteForDetails.other_image || selectedSiteForDetails.image5, type: 'image' as const },
                  { label: 'Survey PDF', path: selectedSiteForDetails.pdf || selectedSiteForDetails.pdf_file, type: 'pdf' as const },
                ].map((item, idx) => {
                  const mediaUrl = item.path ? getMediaUrl(item.path, item.type) : '';
                  const isPdf = Boolean(item.path && (/\.pdf($|\?)/i.test(item.path) || item.type === 'pdf'));
                  return (
                    <div key={idx} style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                      <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                        {item.label}
                      </div>
                      {mediaUrl ? (
                        <div
                          style={{ padding: 8, cursor: 'pointer', background: '#f1f5f9' }}
                          onClick={() => setLightboxUrl(mediaUrl)}
                        >
                          {isPdf ? (
                            <div style={{ padding: '24px 0', color: '#ef4444', fontWeight: 700, fontSize: 13 }}>
                              📄 Click to View PDF
                            </div>
                          ) : (
                            <img
                              src={mediaUrl}
                              alt={item.label}
                              style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Click to preview</div>
                        </div>
                      ) : (
                        <div style={{ padding: 30, color: '#94a3b8', fontSize: 12 }}>No file</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              {activeTab === 'pending' ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary"
                  onClick={() => {
                    const site = selectedSiteForDetails;
                    setSelectedSiteForDetails(null);
                    setSelectedSiteForVerify(site);
                    setVerifyStatusChoice(1);
                    setVerifyRemarks(site.survey_verify_remarks || site.verify_remarks || '');
                  }}
                  style={{ fontWeight: 700 }}
                >
                  Verify This Survey
                </button>
              ) : (
                <>
                  {Number(selectedSiteForDetails.survey_verify_status ?? selectedSiteForDetails.verify_status) === 1 ? (
                    Number(selectedSiteForDetails.material_status) === 1 ? (
                      <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                        ✓ Material Dispatched
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="ax-btn ax-btn--primary"
                        onClick={() => {
                          const site = selectedSiteForDetails;
                          setSelectedSiteForDetails(null);
                          setSelectedSiteForDispatch(site);
                          setDispatchDate(site.material_date || site.material_dispatch_date || new Date().toISOString().slice(0, 10));
                          setDispatchRemarks(site.material_remarks || site.material_dispatch_remarks || '');
                        }}
                        style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
                      >
                        Dispatch Material
                      </button>
                    )
                  ) : (
                    <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                      Survey Rejected
                    </span>
                  )}
                </>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedSiteForDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document / Image Lightbox Preview Modal ── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                Media File Preview
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                  }}
                >
                  Open Original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minWidth: 320,
                minHeight: 240,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifySurvey;

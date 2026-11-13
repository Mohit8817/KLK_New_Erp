import { useState, useMemo, useRef, useEffect, useCallback, type ReactNode } from 'react';
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
import type { BiharSRTVerifySiteItem } from '../../bihar-types';

type Row = BiharSRTVerifySiteItem;
type TabType = 'pending' | 'verified';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ───────── Responsive page CSS (Exact Karnataka SWP reference, all columns scrollable) ───────── */
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

function MediaThumbnail({
  src,
  label,
  onClick,
}: {
  src?: string | null;
  label: string;
  onClick: (src: string, label: string) => void;
}) {
  const [err, setErr] = useState(false);
  if (!src || src === DASH) return <span style={{ color: 'var(--ax-text-muted)' }}>—</span>;

  return (
    <button
      type="button"
      onClick={() => onClick(src, label)}
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
        transition: 'transform 0.15s ease',
      }}
      title={`Click to view: ${label}`}
    >
      {!err ? (
        <img
          src={src}
          alt={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setErr(true)}
        />
      ) : (
        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>IMG</div>
      )}
    </button>
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function VerifyBiharSRT200Survey() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingList, setPendingList] = useState<Row[]>([]);
  const [verifiedList, setVerifiedList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  const [kpis, setKpis] = useState({
    totalAssignedSites: 0,
    completeSurvey: 0,
    pendingSurvey: 0,
    verifyPendingSurvey: 0,
    verifyApproveSurvey: 0,
    verifyRejectSurvey: 0,
  });

  // Lightbox Preview Modal
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Detail Modal
  const [selectedSite, setSelectedSite] = useState<Row | null>(null);

  // Action Modal
  const [actionItem, setActionItem] = useState<Row | null>(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState<'1' | '2'>('1'); // 1 approve, 2 reject
  const [remarksInput, setRemarksInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadSurveys = useCallback(() => {
    setLoading(true);
    setErrorMsg('');
    biharAdminService
      .getViewSrt200mwSurveys()
      .then((res: any) => {
        const detail = res?.data?.survey_detail || res?.data?.summary || res?.survey_detail || res?.summary || {};
        const rawPending = res?.data?.pending || res?.data?.verification || res?.verification || [];
        const rawVerified = res?.data?.verify || res?.data?.verified || res?.verified || [];

        const allSites = Array.isArray(res?.data?.srt200mw)
          ? res.data.srt200mw
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        const pending = Array.isArray(rawPending) && rawPending.length > 0
          ? rawPending
          : allSites.filter((s: any) => !s.survey_verify_status || s.survey_verify_status === 0 || s.survey_verify_status === '0');

        const verified = Array.isArray(rawVerified) && rawVerified.length > 0
          ? rawVerified
          : allSites.filter((s: any) => s.survey_verify_status === 1 || s.survey_verify_status === 2 || s.survey_verify_status === '1' || s.survey_verify_status === '2');

        const normalize = (item: any, idx: number): Row => ({
          id: item.id || idx + 1,
          uid: item.uid || item.unique_id || `SRT-${item.id || idx + 1}`,
          vendor_name: item.vendor_name || (item.survey_vendor ? `Vendor #${item.survey_vendor}` : (item.vendor || 'Vendor')),
          state: item.state || 'Bihar',
          district: item.district || '—',
          division: item.division || '—',
          sub_division: item.sub_division || '—',
          department: item.department || item.dept_name || '—',
          site_name: item.site_name || `Site #${item.id || idx + 1}`,
          site_address: item.address || item.site_address || '—',
          ca_no: item.ca_no || '—',
          survey_address: item.survey_address || item.address || '—',
          near_landmark: item.near_landmark || item.landmark || '—',
          agency_person_name: item.agency_person_name || '—',
          agency_person_contact: item.agency_person_contact || '—',
          nodal_person: item.nodal_person || '—',
          contact_nodal: item.contact_nodal || '—',
          latitude: item.latitude || '—',
          longitude: item.longitude || '—',
          load_type: item.load_type || '—',
          connection_phase: item.connection_phase || '—',
          meter_connection: item.meter_connection || '—',
          meter_number: item.meter_number || '—',
          meter_type: item.meter_type || '—',
          sanction_load: item.sanction_load || '—',
          connected_load: item.connected_load || '—',
          grid_power: item.grid_power === '1' ? 'Yes' : (item.grid_power === '0' ? 'No' : (item.grid_power || '—')),
          all_3_phase_ltdb: item.all_3_phase_ltdb === '1' ? 'Yes' : (item.all_3_phase_ltdb === '0' ? 'No' : (item.all_3_phase_ltdb || '—')),
          missing_phase: item.missing_phase || '—',
          ltdb_present: item.ltdb_present === '1' ? 'Present' : (item.ltdb_present === '0' ? 'Not Present' : (item.ltdb_present || '—')),
          roof_condition: item.roof_condition === '1' ? 'Feasible' : (item.roof_condition || '—'),
          area_roof: item.area_roof || '—',
          free_space_solar: item.free_space_solar || '—',
          free_space_inverter: item.free_space_inverter || '—',
          earth_pit: item.earth_pit === '1' ? 'Ok' : (item.earth_pit === '0' ? 'Not Ok' : (item.earth_pit || '—')),
          site_feasible: item.site_feasible || '—',
          building_age: item.building_age || '—',
          roof_access: item.roof_access === '1' ? 'Available' : (item.roof_access === '0' ? 'Not Available' : (item.roof_access || '—')),
          rooftop_height: item.rooftop_height || '—',
          parapet_height: item.parapet_height || '—',
          floors_number: item.floors_number || '—',
          water_source: item.water_source || '—',
          site_access: item.site_access || '—',
          site_distance: item.site_distance || '—',
          image1: resolveBiharMediaUrl(item.image1),
          image2: resolveBiharMediaUrl(item.image2),
          image3: resolveBiharMediaUrl(item.image3),
          image4: resolveBiharMediaUrl(item.image4),
          pdf_file: resolveBiharMediaUrl(item.pdf_file),
          survey_remarks: item.survey_remarks || item.remarks || '—',
          survey_verify_status: Number(item.survey_verify_status ?? (verified.includes(item) ? 1 : 0)) as 0 | 1 | 2,
          verify_remarks: item.verify_remarks || item.survey_verify_remarks || '',
          reverify_status: item.reverify_status || '',
          verified_at: item.verified_at || item.survey_verify_date || '',
          verified_by: item.verified_by || (item.survey_verify_by ? String(item.survey_verify_by) : ''),
        });

        const pList = pending.map(normalize);
        const vList = verified.map(normalize);

        setPendingList(pList);
        setVerifiedList(vList);

        const total = detail.assignsite !== undefined ? Number(detail.assignsite) : (detail.total !== undefined ? Number(detail.total) : pList.length + vList.length);
        const comp = detail.complete_survey !== undefined ? Number(detail.complete_survey) : (detail.survey_done !== undefined ? Number(detail.survey_done) : (detail.complete !== undefined ? Number(detail.complete) : vList.length));
        const pend = detail.pending_survey !== undefined ? Number(detail.pending_survey) : (detail.survey_pending !== undefined ? Number(detail.survey_pending) : (detail.pending !== undefined ? Number(detail.pending) : pList.length));
        const vp = detail.survey_verify_pending !== undefined ? Number(detail.survey_verify_pending) : (detail.verify_pending !== undefined ? Number(detail.verify_pending) : pList.length);
        const vc = detail.survey_verify !== undefined ? Number(detail.survey_verify) : (detail.survey_verify_complete !== undefined ? Number(detail.survey_verify_complete) : (detail.verify_complete !== undefined ? Number(detail.verify_complete) : vList.filter((r) => r.survey_verify_status === 1).length));
        const vr = detail.survey_verify_reject !== undefined ? Number(detail.survey_verify_reject) : (detail.verify_reject !== undefined ? Number(detail.verify_reject) : vList.filter((r) => r.survey_verify_status === 2).length);

        setKpis({
          totalAssignedSites: total,
          completeSurvey: comp,
          pendingSurvey: pend,
          verifyPendingSurvey: vp,
          verifyApproveSurvey: vc,
          verifyRejectSurvey: vr,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to load surveys from API:', err);
        setErrorMsg(err?.message || 'Failed to connect to survey verification API.');
        setPendingList([]);
        setVerifiedList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const {
    totalAssignedSites,
    completeSurvey,
    pendingSurvey,
    verifyPendingSurvey,
    verifyApproveSurvey,
    verifyRejectSurvey,
  } = kpis;

  const activeList = activeTab === 'pending' ? pendingList : verifiedList;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter((r) =>
      [
        r.uid,
        r.vendor_name,
        r.site_name,
        r.district,
        r.ca_no,
        r.department,
        r.meter_number,
        r.nodal_person,
        r.survey_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [activeList, search]);

  const pagination = usePagination(filtered, { initialPageSize: 100 });

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;

    if (verifyStatusAction === '2' && !remarksInput.trim()) {
      setActionError('Remarks are required when rejecting a survey.');
      return;
    }

    setSubmittingAction(true);
    setActionError('');
    const isApprove = verifyStatusAction === '1';
    try {
      await biharAdminService.verifySrt200mwSurveyStatus({
        id: actionItem.id,
        survey_verify_status: verifyStatusAction,
        verify_remarks: remarksInput.trim(),
      });
      setSuccessMsg(
        `Site ${actionItem.site_name} (${actionItem.uid}) has been ${isApprove ? 'Approved' : 'Rejected'} successfully!`
      );
      setActionItem(null);
      setRemarksInput('');
      loadSurveys();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setActionError(`Failed to update verification status: ${err?.message || 'Server error'}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: Row, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Unique ID', accessor: (r: Row) => r.uid },
      { header: 'Vendor Name', accessor: (r: Row) => r.vendor_name },
      { header: 'State', accessor: (r: Row) => r.state },
      { header: 'District', accessor: (r: Row) => r.district },
      { header: 'Division', accessor: (r: Row) => r.division || '—' },
      { header: 'Sub Division', accessor: (r: Row) => r.sub_division || '—' },
      { header: 'Department', accessor: (r: Row) => r.department || '—' },
      { header: 'Site Name', accessor: (r: Row) => r.site_name },
      { header: 'Site Address', accessor: (r: Row) => r.site_address || '—' },
      { header: 'CA No.', accessor: (r: Row) => r.ca_no || '—' },
      { header: 'Sanction Load', accessor: (r: Row) => r.sanction_load || '—' },
      { header: 'Connected Load', accessor: (r: Row) => r.connected_load || '—' },
      { header: 'Meter Number', accessor: (r: Row) => r.meter_number || '—' },
      { header: 'Latitude', accessor: (r: Row) => r.latitude || '—' },
      { header: 'Longitude', accessor: (r: Row) => r.longitude || '—' },
      { header: 'Roof Area (Sq.Ft)', accessor: (r: Row) => r.area_roof || '—' },
      { header: 'Free Space (Sq.Ft)', accessor: (r: Row) => r.free_space_solar || '—' },
      { header: 'Vendor Remarks', accessor: (r: Row) => r.survey_remarks || '—' },
      {
        header: 'Verify Status',
        accessor: (r: Row) => (r.survey_verify_status === 1 ? 'Approved' : r.survey_verify_status === 2 ? 'Rejected' : 'Pending'),
      },
      ...(activeTab === 'verified'
        ? [
            { header: 'Verify Remarks', accessor: (r: Row) => r.verify_remarks || '—' },
            { header: 'Reverify Status', accessor: (r: Row) => r.reverify_status || '—' },
          ]
        : []),
    ],
    [activeTab]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Bihar_SRT200MW_Verify_${activeTab}`;
  const fileTitle = `Bihar SRT 200MW Survey Register - ${activeTab === 'pending' ? 'Pending' : 'Verified'}`;

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

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Bihar SRT200MW Survey"
        subtitle="Verify installation and rooftop solar survey data submitted by vendors for Bihar SRT 200MW sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT 200MW', href: '/vendor-management/bihar/srt200mw/survey/dashboard' },
          { label: 'Verify Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadSurveys} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
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

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row (Exact Karnataka SWP Design) ── */}
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
          value={totalAssignedSites}
          sub={`Assigned: ${totalAssignedSites} | Completed: ${completeSurvey}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          tone="cyan"
          label="Complete Survey"
          value={completeSurvey}
          sub={`Pending Survey: ${pendingSurvey}`}
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
          value={verifyPendingSurvey}
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
          value={verifyApproveSurvey}
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
          value={verifyRejectSurvey}
          sub="Requires re-survey"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills (Exact Karnataka SWP Style) ── */}
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
          Verify Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {pendingList.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('verified');
            pagination.setPage(1);
          }}
        >
          Approved / Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'verified' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verifiedList.length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Bihar SRT 200MW Survey Pending Verification' : 'Bihar SRT 200MW Survey Verified List'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filtered.length} site{filtered.length === 1 ? '' : 's'} with on-site rooftop survey data & proof images
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearch('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  pagination.setPage(1);
                }}
                placeholder="Search Unique ID, Vendor, Site, District..."
                size="sm"
                ariaLabel="Search surveys"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
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
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Division / Sub-div</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Coordinates (GPS)</th>
                <th className="ax-table__th">Contact & Nodal</th>
                <th className="ax-table__th">Load Specs</th>
                <th className="ax-table__th">Meter Specs</th>
                <th className="ax-table__th">Roof & Solar Area</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th">Vendor Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                {activeTab === 'verified' && (
                  <>
                    <th className="ax-table__th">Verify Remarks</th>
                    <th className="ax-table__th">Reverify Status</th>
                  </>
                )}
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'verified' ? 24 : 22} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Bihar SRT 200MW surveys...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'verified' ? 24 : 22} style={centerCell}>
                    <TableEmptyState
                      title="No survey dossiers found"
                      description={search ? 'Try adjusting your search criteria' : 'No records match this bifurcation view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: Row, idx: number) => {
                  const srNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vStatus = Number(row.survey_verify_status || 0);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {row.uid}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(row.vendor_name)}
                      </td>
                      <td className="ax-table__td">{txt(row.state)}</td>
                      <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                      <td className="ax-table__td">{txt(row.division)} / {txt(row.sub_division)}</td>
                      <td className="ax-table__td">{txt(row.department)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(row.site_name)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{txt(row.ca_no)}</td>
                      <td className="ax-table__td">
                        {row.latitude && row.longitude && row.latitude !== DASH && row.longitude !== DASH ? (
                          <a
                            href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title={`GPS: ${row.latitude}, ${row.longitude} (Click to open map)`}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {row.latitude}, {row.longitude}
                          </a>
                        ) : (
                          DASH
                        )}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.nodal_person)}</span>
                          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{txt(row.contact_nodal)}</span>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>{txt(row.sanction_load)} KW (Sanction)</span>
                          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{txt(row.connected_load)} KW (Connected)</span>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{txt(row.meter_number)}</span>
                          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{txt(row.meter_type)} ({txt(row.connection_phase)})</span>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600 }}>Roof: {txt(row.area_roof)} Sq.Ft</span>
                          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Free: {txt(row.free_space_solar)} Sq.Ft</span>
                        </div>
                      </td>
                      {/* Image Thumbnails with Lightbox Preview */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaThumbnail src={row.image1} label="Building Image" onClick={(url, title) => setLightbox({ url, title })} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaThumbnail src={row.image2} label="Roof Image" onClick={(url, title) => setLightbox({ url, title })} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaThumbnail src={row.image3} label="Control Room" onClick={(url, title) => setLightbox({ url, title })} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaThumbnail src={row.image4} label="Other Image" onClick={(url, title) => setLightbox({ url, title })} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.survey_remarks}>
                        {row.survey_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
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
                      {activeTab === 'verified' && (
                        <>
                          <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.verify_remarks || DASH}
                          </td>
                          <td className="ax-table__td" style={{ fontWeight: 600, color: vStatus === 1 ? '#059669' : '#dc2626' }}>
                            {row.reverify_status || DASH}
                          </td>
                        </>
                      )}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSite(row)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: '#2563eb',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="View full site survey details"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>

                          {vStatus === 1 || vStatus === 2 ? (
                            <button
                              type="button"
                              disabled
                              title={`Survey Verified & ${vStatus === 1 ? 'Approved' : 'Rejected'} (Locked)`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                border: '1px solid #cbd5e1',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'not-allowed',
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActionItem(row);
                                setVerifyStatusAction('1');
                                setRemarksInput('');
                                setActionError('');
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
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

      {/* ── Modal: Verify Survey Status Action (Exact Karnataka Pattern) ── */}
      <Modal
        open={Boolean(actionItem)}
        onClose={() => {
          if (!submittingAction) setActionItem(null);
        }}
        title="Verify Survey Status"
        subtitle={
          actionItem
            ? `UID: #${actionItem.uid} • Site: ${actionItem.site_name} • District: ${actionItem.district}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setActionItem(null)}
              disabled={submittingAction}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifySubmit}
              disabled={submittingAction}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: verifyStatusAction === '1' ? '#2563eb' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              {verifyStatusAction === '1' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {actionError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {actionError}
            </div>
          )}

          {actionItem && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Site Overview</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                >
                  {actionItem.uid}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Site Name</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{actionItem.site_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Vendor</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{actionItem.vendor_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>District</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{actionItem.district}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Sanction Load</div>
                  <div style={{ fontWeight: 600, color: '#2563eb', marginTop: 2 }}>{actionItem.sanction_load} KW</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Scrutiny Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={verifyStatusAction}
              onChange={(e) => setVerifyStatusAction(e.target.value as '1' | '2')}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approve Survey</option>
              <option value="2">Reject Survey</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Verification Remarks {verifyStatusAction === '2' && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              rows={3}
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              placeholder={verifyStatusAction === '2' ? 'Reason for rejecting survey (required)...' : 'Enter technical scrutiny notes...'}
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Full Site Survey Dossier Details (Exact Karnataka Style) ── */}
      <Modal
        open={Boolean(selectedSite)}
        onClose={() => setSelectedSite(null)}
        title="Bihar SRT 200MW Site Survey Details"
        subtitle={
          selectedSite
            ? `UID: #${selectedSite.uid} • Site: ${selectedSite.site_name} • District: ${selectedSite.district}`
            : ''
        }
        maxWidth={860}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              {selectedSite && (
                Number(selectedSite.survey_verify_status || 0) === 1 || Number(selectedSite.survey_verify_status || 0) === 2 ? (
                  <button
                    type="button"
                    disabled
                    title={`Survey Verified & ${Number(selectedSite.survey_verify_status) === 1 ? 'Approved' : 'Rejected'} (Locked)`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #cbd5e1',
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
                    Locked ({Number(selectedSite.survey_verify_status) === 1 ? 'Approved' : 'Rejected'})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const site = selectedSite;
                      setSelectedSite(null);
                      setActionItem(site);
                      setVerifyStatusAction('1');
                      setRemarksInput('');
                      setActionError('');
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
                    }}
                  >
                    Verify This Survey
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setSelectedSite(null)}
              style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Uploaded Geo-Tagged Site Photographs */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Uploaded Geo-Tagged Site Photographs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Building Image</span>
                  <div
                    style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', height: 110, background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => setLightbox({ url: selectedSite.image1 || '', title: 'Building Image' })}
                  >
                    {selectedSite.image1 && selectedSite.image1 !== DASH ? (
                      <img src={selectedSite.image1} alt="Building" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>No Image</div>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Roof Image</span>
                  <div
                    style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', height: 110, background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => setLightbox({ url: selectedSite.image2 || '', title: 'Roof Image' })}
                  >
                    {selectedSite.image2 && selectedSite.image2 !== DASH ? (
                      <img src={selectedSite.image2} alt="Roof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>No Image</div>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Control Room</span>
                  <div
                    style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', height: 110, background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => setLightbox({ url: selectedSite.image3 || '', title: 'Control Room' })}
                  >
                    {selectedSite.image3 && selectedSite.image3 !== DASH ? (
                      <img src={selectedSite.image3} alt="Control Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>No Image</div>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Other Image</span>
                  <div
                    style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', height: 110, background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => setLightbox({ url: selectedSite.image4 || '', title: 'Other Image' })}
                  >
                    {selectedSite.image4 && selectedSite.image4 !== DASH ? (
                      <img src={selectedSite.image4} alt="Other Image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>No Image</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical & Rooftop Survey Information Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {/* Site & Location */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  Site & Location Details
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Unique ID</span><strong style={{ color: '#2563eb' }}>{selectedSite.uid}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Vendor</span><strong>{selectedSite.vendor_name}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>District</span><strong>{selectedSite.district}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Division / Sub-div</span><strong>{selectedSite.division} / {selectedSite.sub_division}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Department</span><strong>{selectedSite.department}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>CA No.</span><strong>{selectedSite.ca_no}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Address</span>
                    <div>{selectedSite.site_address}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>GPS Coordinates</span>
                    <code>{selectedSite.latitude}, {selectedSite.longitude}</code>
                  </div>
                </div>
              </div>

              {/* Electrical & Load */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  Electrical & Load Parameters
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Sanction Load</span><strong style={{ color: '#2563eb' }}>{selectedSite.sanction_load} KW</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Connected Load</span><strong>{selectedSite.connected_load} KW</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Meter Number</span><strong>{selectedSite.meter_number}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Meter Type / Phase</span><strong>{selectedSite.meter_type} ({selectedSite.connection_phase})</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Grid Power</span><strong>{selectedSite.grid_power}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>LTDB Present</span><strong>{selectedSite.ltdb_present}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Earth Pit</span><strong>{selectedSite.earth_pit}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Missing Phase</span><strong>{selectedSite.missing_phase}</strong></div>
                </div>
              </div>

              {/* Rooftop Architecture */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  Rooftop Architecture & Civil Specs
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: 12 }}>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Roof Condition</span><strong>{selectedSite.roof_condition}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Building Age</span><strong>{selectedSite.building_age}</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Total Roof Area</span><strong>{selectedSite.area_roof} Sq.Ft</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Free Space Solar</span><strong style={{ color: '#16a34a' }}>{selectedSite.free_space_solar} Sq.Ft</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Inverter Space</span><strong>{selectedSite.free_space_inverter} Sq.Ft</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Rooftop Height</span><strong>{selectedSite.rooftop_height} Ft</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Parapet Height</span><strong>{selectedSite.parapet_height} Ft</strong></div>
                  <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Roof Access</span><strong>{selectedSite.roof_access}</strong></div>
                </div>
              </div>

              {/* Contacts & Verification Notes */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  Nodal Officers & Scrutiny Remarks
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Nodal Person</span>
                    <strong>{selectedSite.nodal_person} ({selectedSite.contact_nodal})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Agency Surveyor</span>
                    <strong>{selectedSite.agency_person_name} ({selectedSite.agency_person_contact})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Vendor Remarks</span>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 6, marginTop: 2 }}>
                      {selectedSite.survey_remarks || 'None'}
                    </div>
                  </div>
                  {selectedSite.verify_remarks && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Admin Verification Remarks</span>
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: 6, marginTop: 2, color: '#065f46' }}>
                        {selectedSite.verify_remarks} · {selectedSite.verified_by} ({selectedSite.verified_at})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Lightbox Photo Preview Modal (Exact Karnataka / Assam Style) ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
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
                {lightbox.title || 'Photo Preview'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={lightbox.url}
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
                  onClick={() => setLightbox(null)}
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
              {/\.(pdf)($|\?)/i.test(lightbox.url) ? (
                <iframe
                  src={lightbox.url}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
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

export default VerifyBiharSRT200Survey;

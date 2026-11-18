import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode, type FormEvent } from 'react';
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
  goaAdminService,
  resolveGoaMediaUrl,
  type GoaSurveyVerifyViewData,
} from '../../goa-services';

/* ───────── Responsive Page CSS (Exact ERP Reference Standard) ───────── */
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
  .solar-erp-page .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-search,
  .solar-erp-page [class*="search"] {
    flex: 1 1 140px;
    min-width: 200px;
    max-width: 240px;
  }
  .solar-erp-page input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-export-toolbar,
  .solar-erp-page [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }
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
    .solar-erp-page .ax-search,
    .solar-erp-page [class*="search"] { max-width: 180px; }
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
    .solar-erp-page .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 780,
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
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
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// Helper formats
const fmtFlag = (val: any): string => {
  if (val === 1 || val === '1' || val === true) return 'Yes';
  if (val === 0 || val === '0' || val === false) return 'No';
  return val ? String(val) : '—';
};

const fmtDate = (val?: string | null): string => {
  if (!val || val === '—') return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

/* ── Photographic Thumbnail ── */
function SurveyThumbnail({ file, label, onClick }: { file?: string | null; label: string; onClick: (url: string) => void }) {
  if (!file) return <span style={{ color: 'var(--ax-text-muted, #64748b)' }}>—</span>;
  const url = resolveGoaMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);

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
      title={`Click to preview ${label}`}
    >
      {isPdf ? (
        <div style={{ width: 44, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 16, height: 16 }}>
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

export function GoaSRTSurveyVerify() {
  const [data, setData] = useState<GoaSurveyVerifyViewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedForDetails, setSelectedForDetails] = useState<any | null>(null);
  const [selectedForVerify, setSelectedForVerify] = useState<any | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<string>('1');
  const [verifyRemarksInput, setVerifyRemarksInput] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await goaAdminService.getViewAssignSurvey();
      setData(res);
    } catch (err: any) {
      console.error('Fetch Goa Survey verify error:', err);
      setError(err?.message || 'Failed to fetch survey verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic KPIs from API
  const totalAssignedSites = data?.survey?.assignsite ?? 0;
  const completeSurveys = data?.survey?.complete_survey ?? 0;
  const pendingVerifySites = data?.survey?.survey_verify_pending ?? (data?.pending || []).length;
  const approvedSurveys = data?.survey?.survey_verify ?? (data?.verify || []).filter((s: any) => Number(s.survey_verify_status) === 1).length;
  const rejectedSurveys = data?.survey?.survey_verify_reject ?? (data?.verify || []).filter((s: any) => Number(s.survey_verify_status) === 2).length;

  const currentTabList = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'pending') {
      return (data.pending || []).map((s: any) => ({
        ...s,
        unique_id: String(s.uid || s.unique_id || s.id || '—'),
        vendor: typeof s.vendors === 'object' ? s.vendors?.name : (s.vendor_name || s.survey_vendor || '—'),
      }));
    }
    return (data.verify || []).map((s: any) => ({
      ...s,
      unique_id: String(s.uid || s.unique_id || s.id || '—'),
      vendor: typeof s.vendors === 'object' ? s.vendors?.name : (s.vendor_name || s.survey_vendor || '—'),
    }));
  }, [activeTab, data]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabList;

    return currentTabList.filter((s: any) => {
      return (
        String(s.unique_id).toLowerCase().includes(q) ||
        String(s.site_name || '').toLowerCase().includes(q) ||
        String(s.vendor || '').toLowerCase().includes(q) ||
        String(s.district || '').toLowerCase().includes(q) ||
        String(s.ca_no || '').toLowerCase().includes(q) ||
        String(s.division || '').toLowerCase().includes(q) ||
        String(s.sub_division || '').toLowerCase().includes(q) ||
        String(s.dept_name || '').toLowerCase().includes(q) ||
        String(s.meter_number || '').toLowerCase().includes(q)
      );
    });
  }, [currentTabList, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 100 });

  // Export Columns definition covering all requested fields
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Unique ID', accessor: (r: any) => r.unique_id },
      { header: 'Vendor Name', accessor: (r: any) => r.vendor },
      { header: 'State', accessor: (r: any) => r.state?.toUpperCase() || 'GOA' },
      { header: 'District', accessor: (r: any) => r.district || '—' },
      { header: 'Division', accessor: (r: any) => r.division || '—' },
      { header: 'Sub Division', accessor: (r: any) => r.sub_division || '—' },
      { header: 'Department', accessor: (r: any) => r.dept_name || '—' },
      { header: 'Site Name', accessor: (r: any) => r.site_name || '—' },
      { header: 'Site Address', accessor: (r: any) => r.address || '—' },
      { header: 'CA No.', accessor: (r: any) => r.ca_no || '—' },
      { header: 'Survey Address', accessor: (r: any) => r.survey_address || '—' },
      { header: 'Nearest Landmark', accessor: (r: any) => r.near_landmark || '—' },
      { header: 'Agency Contact Person Name', accessor: (r: any) => r.agency_person_name || '—' },
      { header: 'Agency Contact Number', accessor: (r: any) => r.agency_person_contact || r.agency_person_mobile || '—' },
      { header: 'Nodal Person', accessor: (r: any) => r.nodal_person || r.nodal_person_name || '—' },
      { header: 'Nodal Person Contact', accessor: (r: any) => r.contact_nodal || r.nodal_person_mobile || '—' },
      { header: 'Latitude', accessor: (r: any) => r.latitude || '—' },
      { header: 'Longitude', accessor: (r: any) => r.longitude || '—' },
      { header: 'Load Type', accessor: (r: any) => r.load_type || '—' },
      { header: 'Connection Phase', accessor: (r: any) => r.connection_phase || '—' },
      { header: 'Meter Connection Type', accessor: (r: any) => r.meter_connection || '—' },
      { header: 'Meter Number', accessor: (r: any) => r.meter_number || r.meter_no || '—' },
      { header: 'Meter Type', accessor: (r: any) => r.meter_type || '—' },
      { header: 'Sanction Load (KW/KVA)', accessor: (r: any) => r.sanction_load || '—' },
      { header: 'Connected Load (KW)', accessor: (r: any) => r.connected_load || '—' },
      { header: 'Grid Power Availability', accessor: (r: any) => fmtFlag(r.grid_power) },
      { header: 'Three-Phase Availability', accessor: (r: any) => fmtFlag(r.all_3_phase_ltdb) },
      { header: 'Missing Phase', accessor: (r: any) => r.missing_phase || '—' },
      { header: 'LTDB Present', accessor: (r: any) => fmtFlag(r.ltdb_present) },
      { header: 'Roof Condition', accessor: (r: any) => r.roof_condition || '—' },
      { header: 'Total Roof Area (Sq.Feet)', accessor: (r: any) => r.area_roof || '—' },
      { header: 'Free Space for Solar Installation (in Sq.Feet)', accessor: (r: any) => r.free_space_solar || '—' },
      { header: 'Free Space for Control Room/Inverter (in Sq.Feet)', accessor: (r: any) => r.free_space_inverter || '—' },
      { header: 'Earth Pit Position', accessor: (r: any) => fmtFlag(r.earth_pit) },
      { header: 'Age of Building', accessor: (r: any) => r.building_age || '—' },
      { header: 'Access to the Roof', accessor: (r: any) => fmtFlag(r.roof_access) },
      { header: 'Rooftop Height (Feet)', accessor: (r: any) => r.rooftop_height || '—' },
      { header: 'Parapet Height (Feet)', accessor: (r: any) => r.parapet_height || '—' },
      { header: 'No. of Floors', accessor: (r: any) => r.floors_number || '—' },
      { header: 'Water Source for Cleaning', accessor: (r: any) => r.water_source || '—' },
      { header: 'Access to Site', accessor: (r: any) => r.site_access || '—' },
      { header: 'Distance of Site from Main Road (km)', accessor: (r: any) => r.site_distance || '—' },
      { header: 'Vendor Remarks', accessor: (r: any) => r.survey_remarks || '—' },
      {
        header: 'Verify Status',
        accessor: (r: any) => (Number(r.survey_verify_status) === 1 ? 'Approved' : Number(r.survey_verify_status) === 2 ? 'Rejected' : 'Pending'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Goa_SRT_Survey_Verify_${activeTab}`;
  const fileTitle = `Verify Goa SRT Survey (${activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected'})`;

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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:5px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:8mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedForVerify) return;
    setSubmittingAction(true);
    const statusNum = parseInt(verifyStatusChoice, 10);
    try {
      await goaAdminService.updateSurveyVerifyStatus(selectedForVerify.id, statusNum, verifyRemarksInput);
      setSuccessMsg(`Survey #${selectedForVerify.unique_id} decision updated to ${statusNum === 1 ? 'Approved' : 'Rejected'}!`);
      setSelectedForVerify(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update survey verification status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header & Breadcrumbs ── */}
      <PageHead
        title="Goa SRT Survey Verification & Audit"
        subtitle="Review completed field feasibility surveys, audit shadow analysis & structural data, and approve sites for installation handoff."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Survey' },
          { label: 'SRT Survey' },
          { label: 'Verify Survey' },
        ]}
      />

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', padding: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

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
          value={totalAssignedSites}
          sub="Total assigned sites in Goa"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="cyan"
          label="Completed Surveys"
          value={completeSurveys}
          sub="Field feasibility done"
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
          value={pendingVerifySites}
          sub="Awaiting engineering clearance"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          }
          tone="emerald"
          label="Verified Approved"
          value={approvedSurveys}
          sub="Qualified for installation"
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
          value={rejectedSurveys}
          sub="Requires re-survey"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills (Exact user labels) ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(data?.pending || []).length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved_rejected')}
        >
          Approved/Rejected SRT Survey Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {(data?.verify || []).length}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Verification Pending Surveys' : 'Approved/Rejected SRT Survey Data'}
            </h2>
            <p className="ax-card__subtitle">Showing {filtered.length} survey sites with detailed feasibility parameters & photographic logs</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search UID, site, vendor, CA..."
                size="sm"
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

        {/* ── Responsive Horizontal Scroll Table (Exact 50 Columns + Action) ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 4600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Unique ID</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Division</th>
                <th className="ax-table__th">Sub Division</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Site Address</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Survey Address</th>
                <th className="ax-table__th">Nearest Landmark</th>
                <th className="ax-table__th">Agency Contact Person Name</th>
                <th className="ax-table__th">Agency Contact Number</th>
                <th className="ax-table__th">Nodal Person</th>
                <th className="ax-table__th">Nodal Person Contact</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">Load Type</th>
                <th className="ax-table__th">Connection Phase</th>
                <th className="ax-table__th">Meter Connection Type</th>
                <th className="ax-table__th">Meter Number</th>
                <th className="ax-table__th">Meter Type</th>
                <th className="ax-table__th">Sanction Load (KW/KVA)</th>
                <th className="ax-table__th">Connected Load (KW)</th>
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
                <th className="ax-table__th">Access to the Roof (Availability of Staircase)</th>
                <th className="ax-table__th">Rooftop Height (Feet)</th>
                <th className="ax-table__th">Parapet Height (Feet)</th>
                <th className="ax-table__th">No. of Floors (G+...)</th>
                <th className="ax-table__th">Water Source for Cleaning</th>
                <th className="ax-table__th">Access to Site</th>
                <th className="ax-table__th">Distance of Site from Main Road (km)</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Building Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Roof Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Control Room</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Other Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>PDF</th>
                <th className="ax-table__th">Vendor Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={51} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading survey feasibility records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={51} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={searchQuery ? 'Try adjusting your search criteria' : 'No survey records match this view'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: any, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vStatus = Number(row.survey_verify_status ?? 0);
                  const isApproved = vStatus === 1;
                  const isRejected = vStatus === 2;

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf' }}>
                        {row.unique_id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor}</td>
                      <td className="ax-table__td">{row.state?.toUpperCase() || 'GOA'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || '—'}</td>
                      <td className="ax-table__td">{row.division || '—'}</td>
                      <td className="ax-table__td">{row.sub_division || '—'}</td>
                      <td className="ax-table__td">{row.dept_name || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>{row.site_name}</td>
                      <td className="ax-table__td" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.address}>
                        {row.address || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.ca_no || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.survey_address}>
                        {row.survey_address || '—'}
                      </td>
                      <td className="ax-table__td">{row.near_landmark || '—'}</td>
                      <td className="ax-table__td">{row.agency_person_name || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.agency_person_contact || row.agency_person_mobile || '—'}
                      </td>
                      <td className="ax-table__td">{row.nodal_person || row.nodal_person_name || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>
                        {row.contact_nodal || row.nodal_person_mobile || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.latitude || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.longitude || '—'}</td>
                      <td className="ax-table__td">{row.load_type || '—'}</td>
                      <td className="ax-table__td">{row.connection_phase ? `${row.connection_phase} Phase` : '—'}</td>
                      <td className="ax-table__td">{row.meter_connection || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.meter_number || row.meter_no || '—'}</td>
                      <td className="ax-table__td">{row.meter_type || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.sanction_load ? `${row.sanction_load} kW` : '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.connected_load ? `${row.connected_load} kW` : '—'}</td>
                      <td className="ax-table__td">{fmtFlag(row.grid_power)}</td>
                      <td className="ax-table__td">{fmtFlag(row.all_3_phase_ltdb)}</td>
                      <td className="ax-table__td">{row.missing_phase || '—'}</td>
                      <td className="ax-table__td">{fmtFlag(row.ltdb_present)}</td>
                      <td className="ax-table__td">{row.roof_condition || '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.area_roof ? `${row.area_roof} sq.ft` : '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.free_space_solar ? `${row.free_space_solar} sq.ft` : '—'}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.free_space_inverter ? `${row.free_space_inverter} sq.ft` : '—'}</td>
                      <td className="ax-table__td">{fmtFlag(row.earth_pit)}</td>
                      <td className="ax-table__td">{row.building_age ? `${row.building_age} Years` : '—'}</td>
                      <td className="ax-table__td">{fmtFlag(row.roof_access)}</td>
                      <td className="ax-table__td">{row.rooftop_height ? `${row.rooftop_height} ft` : '—'}</td>
                      <td className="ax-table__td">{row.parapet_height ? `${row.parapet_height} ft` : '—'}</td>
                      <td className="ax-table__td">{row.floors_number || '—'}</td>
                      <td className="ax-table__td">{row.water_source || '—'}</td>
                      <td className="ax-table__td">{row.site_access || '—'}</td>
                      <td className="ax-table__td">{row.site_distance ? `${row.site_distance} km` : '—'}</td>

                      {/* Photographic Evidence Columns */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail file={row.image1} label="Building Image" onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail file={row.image2} label="Roof Image" onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail file={row.image3} label="Control Room Image" onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail file={row.image4} label="Other Image" onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <SurveyThumbnail file={row.pdf_file} label="Survey PDF" onClick={setLightboxUrl} />
                      </td>

                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.survey_remarks || '—'}
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
                            onClick={() => setSelectedForDetails(row)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                          {activeTab === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForVerify(row);
                                setVerifyStatusChoice(String(row.survey_verify_status || '1'));
                                setVerifyRemarksInput(row.survey_verify_remarks || '');
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

      {/* ── Details Dossier Modal ── */}
      <Modal
        open={Boolean(selectedForDetails)}
        onClose={() => setSelectedForDetails(null)}
        title="Goa SRT Survey Engineering Dossier"
        subtitle={selectedForDetails ? `${selectedForDetails.unique_id} • ${selectedForDetails.site_name} • CA: ${selectedForDetails.ca_no || 'N/A'}` : ''}
        maxWidth={840}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {selectedForDetails && activeTab === 'pending' && (
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={() => {
                  const s = selectedForDetails;
                  setSelectedForDetails(null);
                  setSelectedForVerify(s);
                  setVerifyStatusChoice(String(s.survey_verify_status || '1'));
                  setVerifyRemarksInput(s.survey_verify_remarks || '');
                }}
                style={{ padding: '6px 16px', fontSize: 13, fontWeight: 700 }}
              >
                Verify This Survey
              </button>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedForDetails(null)}
              style={{ padding: '6px 18px', fontSize: 13, marginLeft: 'auto' }}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 1. Basic Site & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Site Name</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.site_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Surveyor Vendor</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.vendor}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>District / Division</span>
                <strong style={{ fontSize: 13, display: 'block' }}>{selectedForDetails.district} / {selectedForDetails.division || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Site Address</span>
                <span style={{ fontSize: 12, display: 'block' }}>{selectedForDetails.address || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Survey Address</span>
                <span style={{ fontSize: 12, display: 'block' }}>{selectedForDetails.survey_address || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Nearest Landmark</span>
                <span style={{ fontSize: 12, display: 'block' }}>{selectedForDetails.near_landmark || '—'}</span>
              </div>
            </div>

            {/* 2. Agency & Nodal Details */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                Agency & Nodal Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                <div>Agency Contact: <strong>{selectedForDetails.agency_person_name || '—'}</strong></div>
                <div>Agency Mobile: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.agency_person_contact || selectedForDetails.agency_person_mobile || '—'}</strong></div>
                <div>Nodal Person: <strong>{selectedForDetails.nodal_person || selectedForDetails.nodal_person_name || '—'}</strong></div>
                <div>Nodal Contact: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.contact_nodal || selectedForDetails.nodal_person_mobile || '—'}</strong></div>
                <div>GPS Coordinates: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.latitude}, {selectedForDetails.longitude}</strong></div>
                <div>Survey Date: <strong>{fmtDate(selectedForDetails.survey_date)}</strong></div>
              </div>
            </div>

            {/* 3. Electrical & Meter Specifications */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                Electrical & Meter Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
                <div>Load Type: <strong>{selectedForDetails.load_type || '—'}</strong></div>
                <div>Connection Phase: <strong>{selectedForDetails.connection_phase || '—'}</strong></div>
                <div>Meter Connection: <strong>{selectedForDetails.meter_connection || '—'}</strong></div>
                <div>Meter No: <strong style={{ fontFamily: 'monospace' }}>{selectedForDetails.meter_number || selectedForDetails.meter_no || '—'}</strong></div>
                <div>Meter Type: <strong>{selectedForDetails.meter_type || '—'}</strong></div>
                <div>Sanction Load: <strong>{selectedForDetails.sanction_load ? `${selectedForDetails.sanction_load} kW` : '—'}</strong></div>
                <div>Connected Load: <strong>{selectedForDetails.connected_load ? `${selectedForDetails.connected_load} kW` : '—'}</strong></div>
                <div>Grid Power Availability: <strong>{fmtFlag(selectedForDetails.grid_power)}</strong></div>
                <div>3-Phase Availability: <strong>{fmtFlag(selectedForDetails.all_3_phase_ltdb)}</strong></div>
                <div>Missing Phase: <strong>{selectedForDetails.missing_phase || '—'}</strong></div>
                <div>LTDB Present: <strong>{fmtFlag(selectedForDetails.ltdb_present)}</strong></div>
                <div>Earth Pit: <strong>{fmtFlag(selectedForDetails.earth_pit)}</strong></div>
              </div>
            </div>

            {/* 4. Roof & Civil Feasibility */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 10 }}>
                Roof & Civil Feasibility Dimensions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
                <div>Roof Condition: <strong>{selectedForDetails.roof_condition || '—'}</strong></div>
                <div>Total Roof Area: <strong>{selectedForDetails.area_roof ? `${selectedForDetails.area_roof} sq.ft` : '—'}</strong></div>
                <div>Free Space Solar: <strong>{selectedForDetails.free_space_solar ? `${selectedForDetails.free_space_solar} sq.ft` : '—'}</strong></div>
                <div>Free Space Inverter: <strong>{selectedForDetails.free_space_inverter ? `${selectedForDetails.free_space_inverter} sq.ft` : '—'}</strong></div>
                <div>Building Age: <strong>{selectedForDetails.building_age ? `${selectedForDetails.building_age} Years` : '—'}</strong></div>
                <div>Roof Access: <strong>{fmtFlag(selectedForDetails.roof_access)}</strong></div>
                <div>Rooftop Height: <strong>{selectedForDetails.rooftop_height ? `${selectedForDetails.rooftop_height} ft` : '—'}</strong></div>
                <div>Parapet Height: <strong>{selectedForDetails.parapet_height ? `${selectedForDetails.parapet_height} ft` : '—'}</strong></div>
                <div>No. of Floors: <strong>{selectedForDetails.floors_number || '—'}</strong></div>
                <div>Water Source: <strong>{selectedForDetails.water_source || '—'}</strong></div>
                <div>Access to Site: <strong>{selectedForDetails.site_access || '—'}</strong></div>
                <div>Distance from Road: <strong>{selectedForDetails.site_distance ? `${selectedForDetails.site_distance} km` : '—'}</strong></div>
              </div>
            </div>

            {/* 5. Photographic Evidence Gallery */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12 }}>
                On-Ground Photographic Proof & Survey PDF
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Building Image', file: selectedForDetails.image1, isPdf: false },
                  { label: 'Roof Image', file: selectedForDetails.image2, isPdf: false },
                  { label: 'Control Room', file: selectedForDetails.image3, isPdf: false },
                  { label: 'Other Image', file: selectedForDetails.image4, isPdf: false },
                  { label: 'Survey PDF', file: selectedForDetails.pdf_file, isPdf: true },
                ].map((item, i) => (
                  <div key={i} style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', textAlign: 'center', background: '#f8fafc' }}>
                    <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{item.label}</div>
                    {item.file ? (
                      <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => setLightboxUrl(resolveGoaMediaUrl(item.file))}>
                        {item.isPdf ? (
                          <div style={{ width: '100%', height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 4 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 22, height: 22 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>View PDF</span>
                          </div>
                        ) : (
                          <img src={resolveGoaMediaUrl(item.file)} alt={item.label} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        <span style={{ fontSize: 9, color: '#2559bf', fontWeight: 600 }}>Click to zoom</span>
                      </div>
                    ) : (
                      <div style={{ padding: 24, color: '#94a3b8', fontSize: 11 }}>No Media</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Vendor & Auditor Remarks */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 6 }}>
                Survey Remarks & Clearance Notes
              </div>
              <p style={{ fontSize: 13, margin: 0, color: '#334155' }}>
                <b>Vendor Survey Remark: </b> {selectedForDetails.survey_remarks || '—'}
              </p>
              {selectedForDetails.survey_verify_remarks && (
                <div style={{ marginTop: 10, padding: 8, background: '#eff6ff', borderRadius: 6, fontSize: 12 }}>
                  <strong style={{ color: '#1e40af' }}>Auditor Clearance Note:</strong> {selectedForDetails.survey_verify_remarks}
                  {selectedForDetails.survey_verify_date && <span style={{ marginLeft: 8, color: '#64748b' }}>({selectedForDetails.survey_verify_date})</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Verify Decision Modal ── */}
      <Modal
        open={Boolean(selectedForVerify)}
        onClose={() => {
          if (!submittingAction) setSelectedForVerify(null);
        }}
        title="Verify Feasibility Survey & Civil Integrity"
        subtitle={selectedForVerify ? `Site: ${selectedForVerify.site_name} • UID: ${selectedForVerify.unique_id}` : ''}
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setSelectedForVerify(null)}
              disabled={submittingAction}
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleVerifySubmit}
              disabled={submittingAction}
              style={{ padding: '6px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submittingAction && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Submit Decision
            </button>
          </>
        }
      >
        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={verifyStatusChoice}
              onChange={(e) => setVerifyStatusChoice(e.target.value)}
              required
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="1">Approved (Qualifies for Installation Handoff)</option>
              <option value="2">Rejected (Requires Re-Survey / Feasibility Issues)</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Auditor Remarks
            </label>
            <textarea
              rows={3}
              value={verifyRemarksInput}
              onChange={(e) => setVerifyRemarksInput(e.target.value)}
              placeholder="Enter technical audit remarks, shadow clearance, or structural observation note..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Image & PDF Lightbox Modal ── */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Survey Media Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#2559bf',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              {/\.pdf($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
                />
              ) : (
                <img src={lightboxUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoaSRTSurveyVerify;

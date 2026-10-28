import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaSurveyService,
  type BiharUlaSurveyItem,
  type UlaSurveyKpis,
} from '../../bihar-services';
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
  type ColumnDef,
} from '../../../../../common';

const DASH = '—';

/* ───────── KPI Card (same as SRT Claim Request) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ───────── Responsive page CSS (same as SRT Claim Request) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
  closeOnBackdrop?: boolean;
  children: ReactNode;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal with zoom ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="ula-survey-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ula-survey-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
          {status === 'error' && <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
          <img
            key={url}
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
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getSurveyImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/survey/ula/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

/* ── Robust Table Image: strict NO BORDER RADIUS ── */
function SurveyThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const candidates = useMemo(() => getSurveyImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border)',
        cursor: 'pointer',
        display: 'inline-block',
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview"
    />
  );
}

const DEFAULT_KPIS: UlaSurveyKpis = {
  total: 0,
  feasible: 0,
  not_feasible: 0,
  verified: 0,
  pending: 0,
  rejected: 0,
};

const mono = { fontFamily: 'var(--ax-font-mono)', fontSize: '11px' } as const;

const yesNo = (v: unknown) => (v === 1 || v === '1' ? 'Yes' : 'No');

export function Bihar_Survey_ULA_ViewData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [kpis, setKpis] = useState<UlaSurveyKpis>(DEFAULT_KPIS);
  const [surveys, setSurveys] = useState<BiharUlaSurveyItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Column Visibility
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const isVisible = (header: string) => !hiddenCols.includes(header);

  // Load surveys from backend
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const resp = await biharUlaSurveyService.getViewSurveys();
      setSurveys(resp.surveys || []);
      setKpis(resp.kpis || DEFAULT_KPIS);
      if (!resp.surveys?.length) {
        setErrorMsg('No ULA survey records found from server.');
      }
    } catch (err: any) {
      console.error('[Bihar ULA Survey] Failed to load surveys:', err);
      setErrorMsg(err?.message || 'Failed to load ULA survey records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Districts list for filter dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    surveys.forEach((s) => {
      if (s.district) set.add(String(s.district).trim());
    });
    return Array.from(set).sort();
  }, [surveys]);

  // Filtered surveys (district + verify status + search)
  const filteredSurveys = useMemo(() => {
    let list = surveys;

    if (districtFilter !== 'all') {
      list = list.filter((s) => String(s.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => {
        const v = Number(s.verify_status);
        if (statusFilter === 'approved') return v === 1;
        if (statusFilter === 'rejected') return v === 2;
        if (statusFilter === 'pending') return v !== 1 && v !== 2;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) =>
        Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') {
            return Object.values(val).some(
              (subVal) => subVal !== null && subVal !== undefined && String(subVal).toLowerCase().includes(q)
            );
          }
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    return list;
  }, [surveys, search, districtFilter, statusFilter]);

  // Pagination slice
  const pagedSurveys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSurveys.slice(start, start + pageSize);
  }, [filteredSurveys, currentPage, pageSize]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return DASH;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const getVerifierName = (r: BiharUlaSurveyItem) =>
    typeof r.verifier === 'object' && r.verifier?.name
      ? r.verifier.name
      : typeof r.verifier === 'string'
      ? r.verifier
      : '';

  // Export column definitions
  const exportCols: ExportColumn<BiharUlaSurveyItem>[] = useMemo(
    () => [
      { header: 'Survey Date', accessor: (r) => formatDate(r.survey_date || r.created_at) },
      { header: 'District', accessor: (r) => r.district ?? '' },
      { header: 'Block', accessor: (r) => r.block ?? '' },
      { header: 'Panchayat', accessor: (r) => r.panchayat ?? '' },
      { header: 'Village', accessor: (r) => r.village ?? '' },
      { header: 'Address', accessor: (r) => r.address ?? '' },
      { header: 'Consumer Name', accessor: (r) => r.consumer_name ?? '' },
      { header: 'Gender', accessor: (r) => r.gender ?? '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no ?? '' },
      { header: 'Aadhaar No.', accessor: (r) => r.aadhar_no ?? '' },
      { header: 'CA No.', accessor: (r) => r.ca_number ?? '' },
      { header: 'Smart Meter', accessor: (r) => (r.smart_meter === 1 ? 'Yes' : 'No') },
      { header: 'Smart Meter No.', accessor: (r) => r.smart_meter_no ?? '' },
      { header: 'Meter Functional', accessor: (r) => (r.smart_meter_functional === 1 ? 'Yes' : 'No') },
      { header: 'Feasible', accessor: (r) => (r.feasible_status === 1 ? 'Feasible' : 'Not Feasible') },
      { header: 'Latitude', accessor: (r) => String(r.latitude ?? '') },
      { header: 'Longitude', accessor: (r) => String(r.longitude ?? '') },
      { header: 'Remarks', accessor: (r) => r.remarks ?? '' },
      { header: 'Status', accessor: (r) => (r.survey_status === 1 ? 'Complete' : 'Pending') },
      {
        header: 'Verification',
        accessor: (r) =>
          r.verify_status === 1 ? 'Approved' : r.verify_status === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => r.verify_remarks ?? '' },
      { header: 'Verify By', accessor: (r) => getVerifierName(r) },
    ],
    []
  );

  const activeExportCols = useMemo(
    () => exportCols.filter((col) => !hiddenCols.includes(col.header)),
    [exportCols, hiddenCols]
  );

  const toolbarColumns: ColumnDef[] = useMemo(
    () =>
      exportCols.map((c) => ({
        key: c.header,
        label: c.header,
        visible: !hiddenCols.includes(c.header),
      })),
    [exportCols, hiddenCols]
  );

  const toggleColumn = (key: string) => {
    setHiddenCols((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleCopy = () => copyTableDataToClipboard(filteredSurveys, activeExportCols);
  const handleCsv = () => exportDataToCSV('Bihar_ULA_Surveys', filteredSurveys, activeExportCols);
  const handleExcel = () => exportDataToExcel('Bihar_ULA_Surveys', filteredSurveys, activeExportCols);
  const handlePdf = () => printTableData('Bihar ULA Survey Records', filteredSurveys, activeExportCols);

  const feasiblePct = kpis.total > 0 ? Math.round((kpis.feasible / kpis.total) * 100) : 0;
  const verifiedPct = kpis.total > 0 ? Math.round((kpis.verified / kpis.total) * 100) : 0;

  const colCount =
    1 +
    ['Survey Date', 'District', 'Block', 'Panchayat', 'Village', 'Address', 'Consumer Name', 'Gender', 'Contact No.',
      'Aadhaar No.', 'CA No.', 'Smart Meter', 'Smart Meter No.', 'Meter Functional', 'Feasible', 'Latitude', 'Longitude',
      'Remarks', 'Status', 'Verification', 'Verify Remarks', 'Verify By'].filter(isVisible).length +
    3 + 1;

  const preview = (item: BiharUlaSurveyItem, url: string, label: string) =>
    setPreviewImage({ url, title: `${item.consumer_name || item.ca_number || ''} - ${label}` });

  const th = (key: string) =>
    isVisible(key) ? <th className="ax-table__th" scope="col">{key}</th> : null;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Bihar ULA Survey Records"
        subtitle="ULA solar rooftop survey records and verification details"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA' },
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate('/v/bihar/ula-surveys/create')}>
              {ICON_PLUS}
              <span className="ax-btn__label">Add Survey</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Summary Grid ── */}
      <div className="ax-dash-grid">
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Surveys"
              value={kpis.total.toLocaleString('en-IN')}
              sub="Total ULA surveys recorded"
              icon={svg(<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Feasible Sites"
              value={kpis.feasible.toLocaleString('en-IN')}
              sub={`${feasiblePct}% feasible · ${kpis.not_feasible} not feasible`}
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Verification Approved"
              value={kpis.verified.toLocaleString('en-IN')}
              sub={`${verifiedPct}% verified · ${kpis.pending} pending`}
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="pink"
              label="Verification Rejected"
              value={kpis.rejected.toLocaleString('en-IN')}
              sub="Need re-survey / correction"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA Survey Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">SITE SURVEY</span>
              <h2 className="ax-card__title">Bihar ULA Survey Records</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredSurveys.length} of {surveys.length} records
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by verification status"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {(search || districtFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearch('');
                      setDistrictFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
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
                    setCurrentPage(1);
                  }}
                  placeholder="Search consumer, district, CA..."
                  size="sm"
                  ariaLabel="Search survey records"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Bihar ULA Survey Records</caption>
              <thead>
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  {th('Survey Date')}
                  {th('District')}
                  {th('Block')}
                  {th('Panchayat')}
                  {th('Village')}
                  {th('Address')}
                  {th('Consumer Name')}
                  {th('Gender')}
                  {th('Contact No.')}
                  {th('Aadhaar No.')}
                  {th('CA No.')}
                  {th('Smart Meter')}
                  {th('Smart Meter No.')}
                  {th('Meter Functional')}
                  {th('Feasible')}
                  {th('Latitude')}
                  {th('Longitude')}
                  <th className="ax-table__th" scope="col">Electricity Bill Photo</th>
                  <th className="ax-table__th" scope="col">Consent Form Photo</th>
                  <th className="ax-table__th" scope="col">Aadhaar Card Photo</th>
                  {th('Remarks')}
                  {th('Status')}
                  {th('Verification')}
                  {th('Verify Remarks')}
                  {th('Verify By')}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      Loading ULA survey records...
                    </td>
                  </tr>
                ) : filteredSurveys.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState
                        title="No survey records found"
                        message={
                          search || districtFilter !== 'all' || statusFilter !== 'all'
                            ? 'No survey records match your filters. Try clearing them.'
                            : errorMsg || 'No survey records available.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagedSurveys.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.id || idx}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>
                        {isVisible('Survey Date') && (
                          <td className="ax-table__td" style={mono}>{formatDate(item.survey_date || item.created_at)}</td>
                        )}
                        {isVisible('District') && <td className="ax-table__td" style={{ fontWeight: 600 }}>{item.district || DASH}</td>}
                        {isVisible('Block') && <td className="ax-table__td">{item.block || DASH}</td>}
                        {isVisible('Panchayat') && <td className="ax-table__td">{item.panchayat || DASH}</td>}
                        {isVisible('Village') && <td className="ax-table__td">{item.village || DASH}</td>}
                        {isVisible('Address') && <td className="ax-table__td">{item.address || DASH}</td>}
                        {isVisible('Consumer Name') && (
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {item.consumer_name || DASH}
                          </td>
                        )}
                        {isVisible('Gender') && <td className="ax-table__td">{item.gender || DASH}</td>}
                        {isVisible('Contact No.') && <td className="ax-table__td" style={mono}>{item.contact_no || DASH}</td>}
                        {isVisible('Aadhaar No.') && <td className="ax-table__td" style={mono}>{item.aadhar_no || DASH}</td>}
                        {isVisible('CA No.') && (
                          <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {item.ca_number || DASH}
                          </td>
                        )}
                        {isVisible('Smart Meter') && <td className="ax-table__td">{yesNo(item.smart_meter)}</td>}
                        {isVisible('Smart Meter No.') && <td className="ax-table__td" style={mono}>{item.smart_meter_no || DASH}</td>}
                        {isVisible('Meter Functional') && <td className="ax-table__td">{yesNo(item.smart_meter_functional)}</td>}
                        {isVisible('Feasible') && (
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ${item.feasible_status === 1 ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                              {item.feasible_status === 1 ? 'Feasible' : 'Not Feasible'}
                            </span>
                          </td>
                        )}
                        {isVisible('Latitude') && <td className="ax-table__td" style={mono}>{item.latitude ?? DASH}</td>}
                        {isVisible('Longitude') && <td className="ax-table__td" style={mono}>{item.longitude ?? DASH}</td>}

                        {/* Photos (NO BORDER RADIUS) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={item.electricity_bill_photo}
                            alt="Electricity Bill"
                            onPreview={(url, t) => preview(item, url, t)}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={item.consent_form_photo}
                            alt="Consent Form"
                            onPreview={(url, t) => preview(item, url, t)}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <SurveyThumbnail
                            src={item.aadhar_card_photo}
                            alt="Aadhaar Card"
                            onPreview={(url, t) => preview(item, url, t)}
                          />
                        </td>

                        {isVisible('Remarks') && <td className="ax-table__td">{item.remarks || DASH}</td>}

                        {isVisible('Status') && (
                          <td className="ax-table__td">
                            <span className={`ax-badge ax-badge--soft ${item.survey_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                              {item.survey_status === 1 ? 'Complete' : 'Pending'}
                            </span>
                          </td>
                        )}

                        {isVisible('Verification') && (
                          <td className="ax-table__td">
                            <span
                              className={`ax-badge ax-badge--soft ${
                                item.verify_status === 1
                                  ? 'ax-badge--success'
                                  : item.verify_status === 2
                                  ? 'ax-badge--danger'
                                  : 'ax-badge--warning'
                              }`}
                            >
                              {item.verify_status === 1 ? 'Approved' : item.verify_status === 2 ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                        )}

                        {isVisible('Verify Remarks') && <td className="ax-table__td">{item.verify_remarks || DASH}</td>}
                        {isVisible('Verify By') && <td className="ax-table__td">{getVerifierName(item) || DASH}</td>}

                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => navigate(`/v/bihar/ula-surveys/create?id=${item.id}`)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filteredSurveys.length}
                onChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Image Preview Modal with Zoom ── */}
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

export default Bihar_Survey_ULA_ViewData;
import { useCallback, useEffect, useMemo, useState, useDeferredValue, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getCompanyId,
  type InstalledLightsSummary,
  type InstalledLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Colors ── */
const BLUE_ACCENT = '#2563eb';
const GREEN_SUCCESS = '#10b981';
const AMBER_WARNING = '#f59e0b';
const DASH = '—';

/* ── Image Candidate Resolver (matching ULA ViewInstallation) ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');
const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getInstallationImageCandidates(path?: string | null): string[] {
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

  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/ssl/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

/* ── Interactive Image Thumbnail with Zero Border-Radius ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getInstallationImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
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

/* ── Zoom Preview Modal ── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div className="ax-modal__dialog" style={{ maxWidth: 760, width: '90%' }}>
        <div className="ax-modal__header">
          <h3 className="ax-modal__title">{title || 'Image Preview'}</h3>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="ax-modal__body" style={{ padding: 0, background: '#0b1120' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 380,
              maxHeight: '65vh',
              overflow: 'auto',
            }}
          >
            {status === 'loading' && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>
                Loading image…
              </div>
            )}
            {status === 'error' && (
              <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', padding: 20 }}>
                Unable to load image file.
              </div>
            )}
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
                  ? { maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
              }}
            />
          </div>
        </div>
        <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              −
            </button>
            <span style={{ fontSize: 12, minWidth: 44, textAlign: 'center', fontWeight: 600 }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              +
            </button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
              Open Original ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ULA Page & Table Styling ── */
const PAGE_CSS = `
  .solar-erp-page { --bsv-card-radius: var(--ax-radius-lg); --ula-accent: var(--ax-accent, #2563eb); }
  .solar-erp-page .ax-dash-grid { align-items: stretch; gap: var(--ax-space-4); margin-bottom: var(--ax-space-5); }
  .solar-erp-page .bsv-kpi {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--ax-border);
    border-radius: var(--bsv-card-radius);
    background: var(--ax-bg-surface, var(--ax-surface-solid));
    box-shadow: var(--ax-shadow-sm);
    transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
  }
  .solar-erp-page .bsv-kpi:hover {
    box-shadow: var(--ax-shadow-md);
    border-color: var(--ax-border);
    transform: translateY(-1px);
  }
  .solar-erp-page .bsv-kpi__body {
    height: 100%;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .solar-erp-page .bsv-kpi__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--ax-radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--bsv-accent);
    background: color-mix(in srgb, var(--bsv-accent) 12%, transparent);
  }
  .solar-erp-page .bsv-kpi__icon svg { width: 16px; height: 16px; }
  .solar-erp-page .bsv-kpi__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__caption {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.35;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-kpi__value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .solar-erp-page .bsv-kpi__value {
    font-family: var(--ax-font-display);
    font-size: 1.35rem;
    line-height: 1.1;
    font-weight: 700;
    color: var(--ax-text-strong);
    font-variant-numeric: tabular-nums;
  }
  .solar-erp-page .bsv-kpi__unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted);
  }

  /* Image zero radius strict rule */
  .solar-erp-page img,
  .solar-erp-page .ax-table img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  /* Card */
  .solar-erp-page .ax-card {
    min-width: 0;
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: var(--ax-shadow-sm, 0 2px 8px rgba(15,23,42,.04));
    overflow: hidden;
    background: var(--ax-surface-solid, #fff);
  }
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 180px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title {
    font-size: var(--ax-text-lg, 17px);
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    margin: 0;
  }
  .solar-erp-page .ax-card__subtitle {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Table */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 2200px; white-space: nowrap; }
  .solar-erp-page .ax-table { border-collapse: separate; border-spacing: 0; }
  .solar-erp-page .ax-table__th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: var(--ax-text-muted, #64748b);
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    white-space: nowrap;
  }
  .solar-erp-page .ax-table__td {
    padding: 11px 14px;
    vertical-align: middle;
    font-size: var(--ax-text-sm, 13px);
    border-bottom: 1px solid var(--ax-border-subtle, #edf2f7);
  }
  .solar-erp-page .ax-table__row:last-child .ax-table__td { border-bottom: 0; }
  .solar-erp-page .ax-table--hover .ax-table__row:hover .ax-table__td {
    background: color-mix(in srgb, var(--ula-accent) 4%, var(--ax-surface-solid, #fff));
  }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-surface-solid, #fff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-sticky-first th:first-child {
    z-index: 3;
    background: var(--ax-surface-subtle, #f8fafc);
  }

  /* Left-aligned ULA Pagination */
  .solar-erp-page .ax-card__footer {
    width: 100%;
    box-sizing: border-box;
    background: var(--ax-surface-subtle, #f8fafc);
    padding: 10px 16px;
    border-top: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Subnav Tab Pill button */
  .ula-tab-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--ax-radius-pill, 9999px);
    font-size: 13px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all .15s ease;
  }
  .ula-tab-pill.is-active {
    background: var(--ula-accent);
    color: #fff;
    box-shadow: var(--ax-shadow-sm);
  }
  .ula-tab-pill:not(.is-active) {
    background: var(--ax-surface-solid, #fff);
    border-color: var(--ax-border, #cbd5e1);
    color: var(--ax-text, #0f172a);
  }
  .ula-tab-pill:not(.is-active):hover {
    background: var(--ax-surface-subtle, #f8fafc);
    border-color: var(--ula-accent);
  }
`;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_EDIT = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export function Bihar_Installation_SSL_InstallationDetail() {
  const [activeTab, setActiveTab] = useState<'Completed' | 'Payment'>('Completed');
  const [loading, setLoading] = useState(true);

  // Raw lists & summary
  const [summary, setSummary] = useState<InstalledLightsSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<InstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<InstalledLightItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState('all');

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: '',
  });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    beneficiary_name: '',
    contact_no: '',
    ward_no: '',
    pole_no: '',
    uuid_no: '',
    light_no: '',
    module_no: '',
    battery_serial_no: '',
    latitude: '',
    longitude: '',
    remark: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstalledLights();
      if (res) {
        setSummary(res.install_detail || null);
        setCompleteLights(Array.isArray(res.complete_lights) ? res.complete_lights : []);
        setPaymentLights(Array.isArray(res.payment_lights) ? res.payment_lights : []);
      }
    } catch (err) {
      console.error('[InstallationDetail] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current tab dataset
  const currentList = activeTab === 'Completed' ? completeLights : paymentLights;

  // Available districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  // Filtered dataset
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return currentList.filter((r) => {
      if (q) {
        const matches =
          (r.unique_id && r.unique_id.toLowerCase().includes(q)) ||
          (r.uid && r.uid.toLowerCase().includes(q)) ||
          (r.beneficiary_name && r.beneficiary_name.toLowerCase().includes(q)) ||
          (r.contact_no && r.contact_no.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.panchyat && r.panchyat.toLowerCase().includes(q)) ||
          (r.uuid_no && r.uuid_no.toLowerCase().includes(q)) ||
          (r.light_no && r.light_no.toLowerCase().includes(q)) ||
          (r.battery_no && r.battery_no.toLowerCase().includes(q)) ||
          (r.panel_no && r.panel_no.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (verifyFilter !== 'all') {
        const vStatus = String(r.inst_verify_status ?? r.verify_status ?? '');
        if (vStatus !== verifyFilter) return false;
      }

      return true;
    });
  }, [currentList, deferredQuery, districtFilter, verifyFilter]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Open Edit Modal & load light details
  const handleOpenEdit = async (lightId: number) => {
    setEditingId(lightId);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    setEditFile(null);

    try {
      const data = await biharSslInstallationService.getInstalledLightEdit(lightId);
      if (data) {
        setEditForm({
          beneficiary_name: data.beneficiary_name || '',
          contact_no: data.contact_no || '',
          ward_no: data.ward_no || '',
          pole_no: data.pole_no || '',
          uuid_no: data.uuid_no || '',
          light_no: data.light_no || '',
          module_no: data.module_no || data.panel_no || '',
          battery_serial_no: data.battery_serial_no || data.battery_no || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          remark: data.remark || data.inst_remark || '',
        });
      }
    } catch (err: any) {
      console.error('[Edit Light] fetch error:', err);
      setEditErrorMsg(err.message || 'Failed to fetch light details.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setEditSubmitting(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const fd = new FormData();
      fd.append('ssl_id', String(editingId));
      fd.append('uuid_no', editForm.uuid_no.trim());
      fd.append('light_no', editForm.light_no.trim());
      fd.append('module_no', editForm.module_no.trim());
      fd.append('battery_serial_no', editForm.battery_serial_no.trim());
      fd.append('beneficiary_name', editForm.beneficiary_name.trim());
      fd.append('contact_no', editForm.contact_no.trim());
      fd.append('ward_no', editForm.ward_no.trim());
      fd.append('pole_no', editForm.pole_no.trim());
      fd.append('latitude', editForm.latitude.trim());
      fd.append('longitude', editForm.longitude.trim());
      if (editForm.remark.trim()) fd.append('remark', editForm.remark.trim());
      if (editFile) fd.append('light_file', editFile);

      const res = await biharSslInstallationService.updateInstalledLight(fd);
      setEditSuccessMsg(res.message || 'Details Updated Successfully');
      await loadData();
      setTimeout(() => {
        setEditModalOpen(false);
        setEditingId(null);
      }, 1000);
    } catch (err: any) {
      console.error('[Save Edit] error:', err);
      setEditErrorMsg(err.message || 'Failed to update details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export Columns
  const completedExportCols: ExportColumn<InstalledLightItem>[] = [
    { header: 'UID', accessor: (r) => r.unique_id || r.uid || `#${r.id}` },
    { header: 'State', accessor: 'state' },
    { header: 'Phase', accessor: 'phase' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => r.panchayat || r.panchyat || DASH },
    { header: 'Ward No.', accessor: 'ward_no' },
    { header: 'Pole No.', accessor: 'pole_no' },
    { header: 'Beneficiary Name', accessor: 'beneficiary_name' },
    { header: 'Contact', accessor: 'contact_no' },
    { header: 'Light No.', accessor: 'light_no' },
    { header: 'UUID No.', accessor: 'uuid_no' },
    { header: 'Battery No.', accessor: (r) => r.battery_no || r.battery_serial_no || DASH },
    { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || DASH },
    {
      header: 'Verify Status',
      accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Payment Status',
      accessor: (r) => (Number(r.inst_pay_status ?? r.payment_status) === 1 ? 'Paid' : 'Pending'),
    },
  ];

  const paymentExportCols: ExportColumn<InstalledLightItem>[] = [
    { header: 'UID', accessor: (r) => r.unique_id || r.uid || `#${r.id}` },
    { header: 'State', accessor: 'state' },
    { header: 'Phase', accessor: 'phase' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => r.panchayat || r.panchyat || DASH },
    { header: 'Ward No.', accessor: 'ward_no' },
    { header: 'Pole No.', accessor: 'pole_no' },
    { header: 'Beneficiary Name', accessor: 'beneficiary_name' },
    { header: 'Contact', accessor: 'contact_no' },
    { header: 'Latitude', accessor: 'latitude' },
    { header: 'Longitude', accessor: 'longitude' },
    { header: 'IMEI No.', accessor: 'imei_no' },
    { header: 'Sim No.', accessor: 'sim_no' },
    { header: 'Battery No.', accessor: (r) => r.battery_no || r.battery_serial_no || DASH },
    { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || DASH },
    {
      header: 'Payment Status',
      accessor: (r) => (Number(r.inst_pay_status ?? r.payment_status) === 1 ? 'Paid' : 'Pending'),
    },
  ];

  const currentExportCols = activeTab === 'Completed' ? completedExportCols : paymentExportCols;

  const handleCopy = () => copyTableDataToClipboard(filtered, currentExportCols);
  const handleExportCSV = () => exportDataToCSV(`Bihar_SSL_Installation_${activeTab}`, filtered, currentExportCols);
  const handleExportExcel = () => exportDataToExcel(`Bihar_SSL_Installation_${activeTab}`, filtered, currentExportCols);
  const handleExportPDF = () => printTableData(`Bihar SSL Installation ${activeTab}`, filtered, currentExportCols);

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Installation Details"
        subtitle="View completed installations and payment status for Bihar SSL sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Details' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh list"
            >
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid">
          {/* KPI 1: Completed Sites */}
          <div
            className="bsv-kpi ax-col--3"
            role="region"
            aria-label="Completed Lights"
            style={{ ['--bsv-accent' as string]: BLUE_ACCENT } as CSSProperties}
          >
            <div className="bsv-kpi__body">
              <div className="bsv-kpi__head">
                <div className="bsv-kpi__title-wrap">
                  <span className="bsv-kpi__icon">
                    <svg {...ICON_PROPS}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                  <div>
                    <div className="bsv-kpi__label">Completed Lights</div>
                    <div className="bsv-kpi__caption">Installed on site</div>
                  </div>
                </div>
                <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">All Done</span>
              </div>
              <div className="bsv-kpi__value-row">
                <span className="bsv-kpi__value">{summary?.complete ?? completeLights.length}</span>
                <span className="bsv-kpi__unit">lights</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Verified Sites */}
          <div
            className="bsv-kpi ax-col--3"
            role="region"
            aria-label="Verified Sites"
            style={{ ['--bsv-accent' as string]: GREEN_SUCCESS } as CSSProperties}
          >
            <div className="bsv-kpi__body">
              <div className="bsv-kpi__head">
                <div className="bsv-kpi__title-wrap">
                  <span className="bsv-kpi__icon">
                    <svg {...ICON_PROPS}>
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <div>
                    <div className="bsv-kpi__label">Verified Sites</div>
                    <div className="bsv-kpi__caption">Inspection approved</div>
                  </div>
                </div>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Approved</span>
              </div>
              <div className="bsv-kpi__value-row">
                <span className="bsv-kpi__value">{summary?.verify_approved ?? 0}</span>
                <span className="bsv-kpi__unit">verified</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Verification Pending */}
          <div
            className="bsv-kpi ax-col--3"
            role="region"
            aria-label="Verification Pending"
            style={{ ['--bsv-accent' as string]: AMBER_WARNING } as CSSProperties}
          >
            <div className="bsv-kpi__body">
              <div className="bsv-kpi__head">
                <div className="bsv-kpi__title-wrap">
                  <span className="bsv-kpi__icon">
                    <svg {...ICON_PROPS}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </span>
                  <div>
                    <div className="bsv-kpi__label">Verification Pending</div>
                    <div className="bsv-kpi__caption">Awaiting sign-off</div>
                  </div>
                </div>
                <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Review</span>
              </div>
              <div className="bsv-kpi__value-row">
                <span className="bsv-kpi__value">{summary?.verify_pending ?? 0}</span>
                <span className="bsv-kpi__unit">pending</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Payment Lights */}
          <div
            className="bsv-kpi ax-col--3"
            role="region"
            aria-label="Payment Lights"
            style={{ ['--bsv-accent' as string]: '#06b6d4' } as CSSProperties}
          >
            <div className="bsv-kpi__body">
              <div className="bsv-kpi__head">
                <div className="bsv-kpi__title-wrap">
                  <span className="bsv-kpi__icon">
                    <svg {...ICON_PROPS}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </span>
                  <div>
                    <div className="bsv-kpi__label">Payment Lights</div>
                    <div className="bsv-kpi__caption">Claimed & processed</div>
                  </div>
                </div>
                <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">Payment</span>
              </div>
              <div className="bsv-kpi__value-row">
                <span className="bsv-kpi__value">{paymentLights.length}</span>
                <span className="bsv-kpi__unit">sites</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-navigation Tabs: Completed Lights / Payment Lights ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
        <button
          type="button"
          className={`ula-tab-pill ${activeTab === 'Completed' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('Completed');
            pagination.setPage(1);
          }}
        >
          <span>Lights Completed</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 10,
              fontSize: 11,
              background: activeTab === 'Completed' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle)',
            }}
          >
            {completeLights.length}
          </span>
        </button>

        <button
          type="button"
          className={`ula-tab-pill ${activeTab === 'Payment' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('Payment');
            pagination.setPage(1);
          }}
        >
          <span>Payment Lights</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 10,
              fontSize: 11,
              background: activeTab === 'Payment' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle)',
            }}
          >
            {paymentLights.length}
          </span>
        </button>
      </div>

      {/* ── Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'Completed' ? 'Installed Lights Completed' : 'Payment Status Lights'}
            </h2>
            <p className="ax-card__subtitle" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {currentList.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            {/* District Filter */}
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Verify Status Filter (Only in Completed tab) */}
            {activeTab === 'Completed' && (
              <select
                className="ax-input ax-input--sm"
                value={verifyFilter}
                onChange={(e) => {
                  setVerifyFilter(e.target.value);
                  pagination.setPage(1);
                }}
                style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
              >
                <option value="all">All Verification</option>
                <option value="1">Approved</option>
                <option value="0">Pending</option>
                <option value="2">Rejected</option>
              </select>
            )}

            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search UID, beneficiary, contact…"
              ariaLabel="Search installations"
            />

            {/* Export Toolbar */}
            <TableExportToolbar
              onCopy={handleCopy}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={activeTab === 'Completed' ? 23 : 20} rows={8} showCard={false} />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            title="No Installation Records Found"
            message={
              searchQuery || districtFilter !== 'all' || verifyFilter !== 'all'
                ? 'No site records match your current filters.'
                : 'Installed lights will appear here once submitted from the Install Light form.'
            }
            onClear={() => {
              setSearchQuery('');
              setDistrictFilter('all');
              setVerifyFilter('all');
            }}
            clearLabel="Reset Filters"
          />
        ) : (
          <>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
                <caption className="ax-visually-hidden">
                  {activeTab === 'Completed' ? 'Completed SSL Lights' : 'Payment Lights'}
                </caption>
                <thead className="ax-table__head">
                  {activeTab === 'Completed' ? (
                    <tr>
                      <th className="ax-table__th" scope="col" style={{ width: 50 }}>
                        Sr. No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        UID
                      </th>
                      <th className="ax-table__th" scope="col">
                        State
                      </th>
                      <th className="ax-table__th" scope="col">
                        Phase
                      </th>
                      <th className="ax-table__th" scope="col">
                        District
                      </th>
                      <th className="ax-table__th" scope="col">
                        Block
                      </th>
                      <th className="ax-table__th" scope="col">
                        Panchayat
                      </th>
                      <th className="ax-table__th" scope="col">
                        Ward No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Pole No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Beneficiary Name
                      </th>
                      <th className="ax-table__th" scope="col">
                        Beneficiary Contact
                      </th>
                      <th className="ax-table__th" scope="col">
                        Latitude
                      </th>
                      <th className="ax-table__th" scope="col">
                        Longitude
                      </th>
                      <th className="ax-table__th" scope="col">
                        Light No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        UUID No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Battery No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Panel No.
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Light Image
                      </th>
                      <th className="ax-table__th" scope="col">
                        Remark
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Verify Status
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Claim Status
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Payment Status
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>
                        Action
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="ax-table__th" scope="col" style={{ width: 50 }}>
                        Sr. No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        UID
                      </th>
                      <th className="ax-table__th" scope="col">
                        State
                      </th>
                      <th className="ax-table__th" scope="col">
                        Phase
                      </th>
                      <th className="ax-table__th" scope="col">
                        District
                      </th>
                      <th className="ax-table__th" scope="col">
                        Block
                      </th>
                      <th className="ax-table__th" scope="col">
                        Panchayat
                      </th>
                      <th className="ax-table__th" scope="col">
                        Ward No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Pole No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Beneficiary Name
                      </th>
                      <th className="ax-table__th" scope="col">
                        Beneficiary Contact
                      </th>
                      <th className="ax-table__th" scope="col">
                        Latitude
                      </th>
                      <th className="ax-table__th" scope="col">
                        Longitude
                      </th>
                      <th className="ax-table__th" scope="col">
                        IMEI No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Sim No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Battery No.
                      </th>
                      <th className="ax-table__th" scope="col">
                        Panel No.
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Light Image
                      </th>
                      <th className="ax-table__th" scope="col">
                        Remark
                      </th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                        Payment Status
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isVerifyApproved = Number(r.inst_verify_status ?? r.verify_status) === 1;
                    const isVerifyRejected = Number(r.inst_verify_status ?? r.verify_status) === 2;
                    const isPaid = Number(r.inst_pay_status ?? r.payment_status) === 1;
                    const isClaimed = Number(r.claim_status) === 1;

                    return (
                      <tr key={r.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {rowNum}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{
                            fontWeight: 'var(--ax-weight-semibold)' as any,
                            fontFamily: 'var(--ax-font-mono)',
                            color: 'var(--ax-text-strong)',
                          }}
                        >
                          {r.unique_id || r.uid || `#${r.id}`}
                        </td>
                        <td className="ax-table__td">{r.state || 'Bihar'}</td>
                        <td className="ax-table__td">{r.phase || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {r.district || DASH}
                        </td>
                        <td className="ax-table__td">{r.block || DASH}</td>
                        <td className="ax-table__td">{r.panchayat || r.panchyat || DASH}</td>
                        <td className="ax-table__td">{r.ward_no || DASH}</td>
                        <td className="ax-table__td">{r.pole_no || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 650, color: 'var(--ax-text-strong)' }}>
                          {r.beneficiary_name || DASH}
                        </td>
                        <td className="ax-table__td">{r.contact_no || DASH}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                          {r.latitude || DASH}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                          {r.longitude || DASH}
                        </td>

                        {activeTab === 'Completed' ? (
                          <>
                            <td className="ax-table__td">{r.light_no || DASH}</td>
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                              {r.uuid_no || DASH}
                            </td>
                            <td className="ax-table__td">{r.battery_no || r.battery_serial_no || DASH}</td>
                            <td className="ax-table__td">{r.panel_no || r.module_no || DASH}</td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <InstallationThumbnail
                                  src={r.light_image || r.file}
                                  alt={`Site #${r.unique_id || r.id}`}
                                  onPreview={(url, title) => setPreviewModal({ open: true, url, title })}
                                />
                              </div>
                            </td>
                            <td
                              className="ax-table__td"
                              style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={r.remark || r.remarks || undefined}
                            >
                              {r.remark || r.remarks || DASH}
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  isVerifyApproved
                                    ? 'ax-badge--success'
                                    : isVerifyRejected
                                    ? 'ax-badge--danger'
                                    : 'ax-badge--warning'
                                }`}
                              >
                                {isVerifyApproved ? 'Approved' : isVerifyRejected ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  isClaimed ? 'ax-badge--info' : 'ax-badge--neutral'
                                }`}
                              >
                                {isClaimed ? 'Claimed' : 'Unclaimed'}
                              </span>
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                                }`}
                              >
                                {isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => handleOpenEdit(r.id)}
                                title="Edit Installation"
                                style={{ gap: 4 }}
                              >
                                {ICON_EDIT}
                                <span>Edit</span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="ax-table__td">{r.imei_no || DASH}</td>
                            <td className="ax-table__td">{r.sim_no || DASH}</td>
                            <td className="ax-table__td">{r.battery_no || r.battery_serial_no || DASH}</td>
                            <td className="ax-table__td">{r.panel_no || r.module_no || DASH}</td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <InstallationThumbnail
                                  src={r.light_image || r.file}
                                  alt={`Site #${r.unique_id || r.id}`}
                                  onPreview={(url, title) => setPreviewModal({ open: true, url, title })}
                                />
                              </div>
                            </td>
                            <td
                              className="ax-table__td"
                              style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={r.remark || r.remarks || undefined}
                            >
                              {r.remark || r.remarks || DASH}
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`ax-badge ax-badge--soft ax-badge--pill ${
                                  isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                                }`}
                              >
                                {isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left-aligned ULA Pagination */}
            <div className="ax-card__footer">
              <div className="ula-pagination-left">
                <Pagination
                  currentPage={pagination.curPage}
                  totalItems={filtered.length}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Image Preview Zoom Modal ── */}
      {previewModal.open && (
        <ImagePreviewModal
          url={previewModal.url}
          title={previewModal.title}
          onClose={() => setPreviewModal({ open: false, url: '', title: '' })}
        />
      )}

      {/* ── Edit Light Modal ── */}
      {editModalOpen && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !editSubmitting && setEditModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 640 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Edit Installed Light #{editingId}</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body">
              {editSuccessMsg && (
                <div className="ax-alert ax-alert--success" style={{ marginBottom: 14 }}>
                  <div className="ax-alert__text">{editSuccessMsg}</div>
                </div>
              )}
              {editErrorMsg && (
                <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                  <div className="ax-alert__text">{editErrorMsg}</div>
                </div>
              )}

              {editLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <SkeletonLine width="40%" height="0.8em" style={{ marginBottom: 6 }} />
                      <SkeletonRect width="100%" height={36} borderRadius="6px" />
                    </div>
                  ))}
                </div>
              ) : (
                <form id="edit_light_form" onSubmit={handleSaveEdit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Beneficiary Name
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.beneficiary_name}
                        onChange={(e) => setEditForm({ ...editForm, beneficiary_name: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Contact No.
                      </label>
                      <input
                        type="tel"
                        className="ax-input"
                        value={editForm.contact_no}
                        onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Ward No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.ward_no}
                        onChange={(e) => setEditForm({ ...editForm, ward_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Pole No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.pole_no}
                        onChange={(e) => setEditForm({ ...editForm, pole_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        UUID No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.uuid_no}
                        onChange={(e) => setEditForm({ ...editForm, uuid_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Light No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.light_no}
                        onChange={(e) => setEditForm({ ...editForm, light_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Battery No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.battery_serial_no}
                        onChange={(e) => setEditForm({ ...editForm, battery_serial_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Panel / Module No.
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.module_no}
                        onChange={(e) => setEditForm({ ...editForm, module_no: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Latitude
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                        Longitude
                      </label>
                      <input
                        type="text"
                        className="ax-input"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                      Remarks
                    </label>
                    <textarea
                      className="ax-input"
                      rows={2}
                      value={editForm.remark}
                      onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                      style={{ width: '100%', borderRadius: 6, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 4 }}>
                      Replace Light Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      className="ax-input"
                      style={{ width: '100%', height: 36 }}
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit_light_form"
                className="ax-btn ax-btn--primary"
                disabled={editSubmitting || editLoading}
              >
                {editSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;

import { useState, useMemo, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type StructureSiteItem,
} from '../../../../../services/biharUlaInstallationService';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ── Base URLs for media assets ── */
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

  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/ula/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getInstallationImageCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

/* ── Field helpers ── */
const field = (s: StructureSiteItem, key: string): unknown =>
  (s as unknown as Record<string, unknown>)[key];

const text = (s: StructureSiteItem, key: string): string => {
  const v = field(s, key);
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const num = (s: StructureSiteItem, key: string): number => Number(field(s, key));

const parseList = (val?: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // not JSON
  }
  return [val].filter(Boolean);
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Interactive Image Thumbnail with Candidate Fallbacks ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 34,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string) => void;
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
        borderRadius: 'var(--ax-radius-sm, 4px)',
        objectFit: 'cover',
        cursor: 'pointer',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl)}
      title="Click to preview"
    />
  );
}

function ThumbnailGroup({
  images,
  altPrefix,
  onPreview,
}: {
  images?: unknown;
  altPrefix: string;
  onPreview: (url: string) => void;
}) {
  const list = parseList(images);
  if (!list.length) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  return (
    <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', maxWidth: 160 }}>
      {list.map((img, i) => (
        <InstallationThumbnail
          key={i}
          src={img}
          alt={`${altPrefix} ${i + 1}`}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

/* ───────── Responsive CSS (BiharAMCSSLViewAssignLight / DLE jaisa) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Card header: title and actions */
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

  /* Table: sideways scroll with sticky first column */
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--wide { min-width: 2800px; }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-bg-surface, #ffffff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }

  /* Tablet */
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

  /* Mobile: header stack */
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

  /* Small phones */
  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
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

export function Bihar_Installation_ULA_ViewInstallation() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<StructureSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Photo Lightbox Modal
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Electrical Modal State
  const [electricModalSite, setElectricModalSite] = useState<StructureSiteItem | null>(null);
  const [instDate, setInstDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [solarMeterNo, setSolarMeterNo] = useState('');
  const [inverterNo, setInverterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');
  const [logerNo, setLogerNo] = useState('');
  const [instRemarks, setInstRemarks] = useState('');

  // Electrical Upload Files
  const [completePhoto, setCompletePhoto] = useState<File | null>(null);
  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [earthingImage, setEarthingImage] = useState<File | null>(null);
  const [acdbImage, setAcdbImage] = useState<File | null>(null);
  const [solarMeterImage, setSolarMeterImage] = useState<File | null>(null);
  const [laImage, setLaImage] = useState<File | null>(null);

  const [electricSubmitting, setElectricSubmitting] = useState(false);
  const [electricError, setElectricError] = useState<string | null>(null);

  // Document Modal State
  const [docModalSite, setDocModalSite] = useState<StructureSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Fetch installed sites
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewInstalledSites();
      setSites(data || []);
    } catch (err: any) {
      console.error('[ULA Installation] Error loading installed sites:', err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // District options
  const districtList = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district) set.add(s.district);
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (selectedDistrict !== 'All' && s.district !== selectedDistrict) return false;
      if (selectedStatus === 'Installed' && Number(s.inst_status) !== 1) return false;
      if (selectedStatus === 'Pending' && Number(s.inst_status) === 1) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const modSerials = parseList(field(s, 'module_serial_no')).join(' ').toLowerCase();

      return (
        (s.beneficiary_name || '').toLowerCase().includes(q) ||
        (s.contact_no || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        (s.block || '').toLowerCase().includes(q) ||
        (s.village || '').toLowerCase().includes(q) ||
        (s.solarmeter_no || '').toLowerCase().includes(q) ||
        (s.inverter_no || '').toLowerCase().includes(q) ||
        (s.nm_sm_no || '').toLowerCase().includes(q) ||
        (s.loger_no || '').toLowerCase().includes(q) ||
        modSerials.includes(q) ||
        String(s.id).includes(q) ||
        text(s, 'unique_id').toLowerCase().includes(q) ||
        text(s, 'wo_no').toLowerCase().includes(q)
      );
    });
  }, [sites, search, selectedDistrict, selectedStatus]);

  // Pagination hook from common
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 10 });

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedDistrict, selectedStatus]);

  const hasFilters = search.trim() !== '' || selectedDistrict !== 'All' || selectedStatus !== 'All';
  const resetFilters = () => {
    setSearch('');
    setSelectedDistrict('All');
    setSelectedStatus('All');
    setPage(1);
  };

  // Open Electrical Modal
  const handleOpenElectricModal = (site: StructureSiteItem) => {
    setElectricModalSite(site);
    setInstDate(text(site, 'inst_date') || new Date().toISOString().split('T')[0]);
    setSolarMeterNo(site.solarmeter_no || text(site, 'solar_meter_no') || '');
    setInverterNo(site.inverter_no || '');
    setNmSmNo(site.nm_sm_no || text(site, 'smart_meter_no') || '');
    setLogerNo(site.loger_no || '');
    setInstRemarks(site.inst_remarks || text(site, 'remarks') || '');
    setCompletePhoto(null);
    setInverterImage(null);
    setEarthingImage(null);
    setAcdbImage(null);
    setSolarMeterImage(null);
    setLaImage(null);
    setElectricError(null);
  };

  // Submit Electrical Installation
  const handleSubmitElectric = async (e: FormEvent) => {
    e.preventDefault();
    if (!electricModalSite) return;
    setElectricError(null);
    setElectricSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(electricModalSite.id));
      fd.append('inst_date', instDate);
      if (solarMeterNo) fd.append('solarmeter_no', solarMeterNo);
      if (inverterNo) fd.append('inverter_no', inverterNo);
      if (nmSmNo) fd.append('nm_sm_no', nmSmNo);
      if (logerNo) fd.append('loger_no', logerNo);
      if (instRemarks) fd.append('inst_remarks', instRemarks);

      if (completePhoto) fd.append('complete_photo', completePhoto);
      if (inverterImage) fd.append('inverter_image', inverterImage);
      if (earthingImage) fd.append('earthing_image', earthingImage);
      if (acdbImage) fd.append('acdb_image', acdbImage);
      if (solarMeterImage) fd.append('solarmeter_image', solarMeterImage);
      if (laImage) fd.append('la_image', laImage);

      await biharUlaInstallationService.storeInstallation(fd);
      setToastMsg({ type: 'success', text: 'Electrical installation saved successfully!' });
      setElectricModalSite(null);
      await loadData();
    } catch (err: any) {
      setElectricError(err?.message || 'Failed to save electrical installation.');
    } finally {
      setElectricSubmitting(false);
    }
  };

  // Submit Commissioning Doc
  const handleSubmitDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite || !docFile) return;
    setDocError(null);
    setDocSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(docModalSite.id));
      fd.append('file', docFile);

      await biharUlaInstallationService.uploadInstallationDoc(fd);
      setToastMsg({ type: 'success', text: 'Installation document uploaded successfully!' });
      setDocModalSite(null);
      setDocFile(null);
      await loadData();
    } catch (err: any) {
      setDocError(err?.message || 'Failed to upload document.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Export Columns definition (Exact 30 requested fields)
  const exportCols: ExportColumn<StructureSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => text(r, 'state') || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact Number', accessor: (r) => r.contact_no || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Module Serial No.', accessor: (r) => parseList(field(r, 'module_serial_no')).join(', ') },
      { header: 'Module Serial Image', accessor: (r) => parseList(field(r, 'module_serial_image')).join(', ') },
      { header: 'Foundation & Fastener', accessor: (r) => parseList(field(r, 'foundation_fastener_images')).join(', ') },
      { header: 'Structure Image', accessor: (r) => r.structure_image || '' },
      { header: 'Latitude', accessor: (r) => text(r, 'inst_latitude') || text(r, 'latitude') },
      { header: 'Longitude', accessor: (r) => text(r, 'inst_longitude') || text(r, 'longitude') },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Installed' : 'Pending') },
      {
        header: 'Structure Verify Status',
        accessor: (r) =>
          Number(r.structure_verify_status) === 1
            ? 'Approved'
            : Number(r.structure_verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => text(r, 'structure_verify_remarks') || text(r, 'verify_remarks') },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || text(r, 'solar_meter_no') },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || '' },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || text(r, 'smart_meter_no') },
      { header: 'Loger No.', accessor: (r) => r.loger_no || '' },
      { header: 'Complete Photo', accessor: (r) => text(r, 'complete_photo') },
      { header: 'Inverter Image', accessor: (r) => text(r, 'inverter_image') },
      { header: 'Earthing Image', accessor: (r) => text(r, 'earthing_image') },
      { header: 'ACDB Image', accessor: (r) => text(r, 'acdb_image') },
      { header: 'Solar Meter Image', accessor: (r) => text(r, 'solar_meter_image') || text(r, 'solarmeter_image') },
      { header: 'LA Image', accessor: (r) => text(r, 'la_image') },
      { header: 'Remark', accessor: (r) => text(r, 'inst_remarks') || text(r, 'remarks') },
      { header: 'Installation Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Installed' : 'Pending') },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_verify_status ?? r.verify_status) === 1
            ? 'Approved'
            : Number(r.inst_verify_status ?? r.verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

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
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const toolbarColumns = exportCols.map((c, i) => ({
    key: `${c.header}-${i}`,
    label: c.header,
    visible: !hiddenColumns.includes(`${c.header}-${i}`),
  }));
  const activeCols = exportCols.filter((c, i) => !hiddenColumns.includes(`${c.header}-${i}`));
  const toggleColumn = (key: string) =>
    setHiddenColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const TOTAL_COLUMNS = 31;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Bihar ULA Installation"
        subtitle="Master register of structure erection, electrical commissioning, and physical verification media"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card (Exact DLE style with 31 columns) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="ULA Installation Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Installation Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> installations found.
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter Dropdown */}
                <select
                  id="dist_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="All">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Electric Status Filter Dropdown */}
                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by electric status"
                >
                  <option value="All">All Status</option>
                  <option value="Installed">Installed (1)</option>
                  <option value="Pending">Pending (0)</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={resetFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name, CA, contact, meter…"
                  size="sm"
                  ariaLabel="Search installation records"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredSites, activeCols)}
                  onExportCSV={() => exportToCSV(filteredSites, activeCols, `Bihar_ULA_Installation_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredSites, activeCols, `Bihar_ULA_Installation_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredSites, activeCols, 'Bihar ULA Installation')}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">ULA Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Module Serial No.</th>
                  <th className="ax-table__th" scope="col">Module Serial Image</th>
                  <th className="ax-table__th" scope="col">Foundation & Fastener</th>
                  <th className="ax-table__th" scope="col">Structure Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Structure Status</th>
                  <th className="ax-table__th" scope="col">Structure Verify Status</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col">Complete Photo</th>
                  <th className="ax-table__th" scope="col">Inverter Image</th>
                  <th className="ax-table__th" scope="col">Earthing Image</th>
                  <th className="ax-table__th" scope="col">ACDB Image</th>
                  <th className="ax-table__th" scope="col">Solar Meter Image</th>
                  <th className="ax-table__th" scope="col">LA Image</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Installation Status</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'Installed sites will appear here once structure and electrical work is recorded.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((s, index) => {
                    const modSerials = parseList(field(s, 'module_serial_no'));
                    const isElectricDone = Number(s.inst_status) === 1;

                    const lat = text(s, 'inst_latitude') || text(s, 'latitude');
                    const lng = text(s, 'inst_longitude') || text(s, 'longitude');
                    const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

                    const docPath = text(s, 'inst_doc');

                    return (
                      <tr key={s.id} className="ax-table__row">
                        {/* 1. Sr. No. */}
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>

                        {/* 2. State */}
                        <td className="ax-table__td">{text(s, 'state') || 'Bihar'}</td>

                        {/* 3. District */}
                        <td className="ax-table__td"><b>{s.district || DASH}</b></td>

                        {/* 4. Block */}
                        <td className="ax-table__td">{s.block || DASH}</td>

                        {/* 5. Village */}
                        <td className="ax-table__td">{s.village || DASH}</td>

                        {/* 6. Beneficiary Name */}
                        <td className="ax-table__td">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {s.beneficiary_name || DASH}
                          </span>
                        </td>

                        {/* 7. Contact Number */}
                        <td className="ax-table__td">{s.contact_no || DASH}</td>

                        {/* 8. CA No. */}
                        <td className="ax-table__td">{s.ca_no || DASH}</td>

                        {/* 9. Module Serial No. */}
                        <td className="ax-table__td">
                          {modSerials.length === 0 ? (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {modSerials.map((serial, i) => (
                                <span
                                  key={i}
                                  className="ax-badge ax-badge--soft ax-badge--neutral"
                                  style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}
                                >
                                  {serial}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 10. Module Serial Image */}
                        <td className="ax-table__td">
                          <ThumbnailGroup
                            images={field(s, 'module_serial_image')}
                            altPrefix="Module Serial"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 11. Foundation & Fastener */}
                        <td className="ax-table__td">
                          <ThumbnailGroup
                            images={field(s, 'foundation_fastener_images')}
                            altPrefix="Foundation & Fastener"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 12. Structure Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={s.structure_image}
                            alt="Structure"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 13. Latitude */}
                        <td className="ax-table__td">
                          {hasGeo ? (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
                              title="Open in Google Maps"
                            >
                              {lat}
                            </a>
                          ) : (
                            lat || DASH
                          )}
                        </td>

                        {/* 14. Longitude */}
                        <td className="ax-table__td">{lng || DASH}</td>

                        {/* 15. Structure Status */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ${
                              Number(s.structure_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {Number(s.structure_status) === 1 ? 'Installed' : 'Pending'}
                          </span>
                        </td>

                        {/* 16. Structure Verify Status */}
                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.structure_verify_status)} />
                        </td>

                        {/* 17. Verify Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                          {text(s, 'structure_verify_remarks') || text(s, 'verify_remarks') || DASH}
                        </td>

                        {/* 18. Solar Meter No. */}
                        <td className="ax-table__td">{s.solarmeter_no || text(s, 'solar_meter_no') || DASH}</td>

                        {/* 19. Inverter No. */}
                        <td className="ax-table__td">{s.inverter_no || DASH}</td>

                        {/* 20. Net/Smart Meter No. */}
                        <td className="ax-table__td">{s.nm_sm_no || text(s, 'smart_meter_no') || DASH}</td>

                        {/* 21. Loger No. */}
                        <td className="ax-table__td">{s.loger_no || DASH}</td>

                        {/* 22. Complete Photo */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'complete_photo')}
                            alt="Complete Plant"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 23. Inverter Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'inverter_image')}
                            alt="Inverter"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 24. Earthing Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'earthing_image')}
                            alt="Earthing"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 25. ACDB Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'acdb_image')}
                            alt="ACDB"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 26. Solar Meter Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'solar_meter_image') || text(s, 'solarmeter_image')}
                            alt="Solar Meter"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 27. LA Image */}
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'la_image')}
                            alt="Lightning Arrester"
                            onPreview={setPreviewImg}
                          />
                        </td>

                        {/* 28. Remark */}
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                          {text(s, 'inst_remarks') || text(s, 'remarks') || DASH}
                        </td>

                        {/* 29. Installation Status */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ${
                              isElectricDone ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {isElectricDone ? 'Installed' : 'Pending'}
                          </span>
                        </td>

                        {/* 30. Verify Status */}
                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.inst_verify_status ?? s.verify_status)} />
                        </td>

                        {/* 31. Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                            <button
                              type="button"
                              className={`ax-btn ax-btn--sm ${isElectricDone ? 'ax-btn--ghost' : 'ax-btn--primary'}`}
                              onClick={() => handleOpenElectricModal(s)}
                              title={isElectricDone ? 'Update electric details' : 'Complete electric installation'}
                            >
                              {isElectricDone ? 'Edit Electric' : 'Complete Electric'}
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => setDocModalSite(s)}
                              title="Upload commissioning document"
                            >
                              Upload Doc
                            </button>
                            {docPath && (
                              <a
                                href={mediaUrl(docPath)}
                                target="_blank"
                                rel="noreferrer"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                title="View Commissioning Document"
                              >
                                View Doc ↗
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 40, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Lightbox Modal ── */}
      {previewImg && (
        <div className="ax-modal-backdrop" onClick={() => setPreviewImg(null)}>
          <div
            className="ax-modal"
            style={{ maxWidth: 800, padding: 'var(--ax-space-4)', background: 'var(--ax-surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-2)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--ax-text-base)' }}>Media Preview</h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                onClick={() => setPreviewImg(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: 'center', background: '#0000000d', padding: 8, borderRadius: 'var(--ax-radius-md)' }}>
              <img
                src={previewImg}
                alt="Verification media preview"
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-sm)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <a
                href={previewImg}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--secondary ax-btn--sm"
              >
                Open in New Tab ↗
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setPreviewImg(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Electrical Installation Modal ── */}
      {electricModalSite && (
        <div className="ax-modal-backdrop" onClick={() => setElectricModalSite(null)}>
          <div className="ax-modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitElectric}>
              <div className="ax-modal__header">
                <div>
                  <h4 className="ax-modal__title">Electrical Commissioning</h4>
                  <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Site: <b>{electricModalSite.beneficiary_name}</b> (CA #{electricModalSite.ca_no})
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                  onClick={() => setElectricModalSite(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ax-modal__body" style={{ maxHeight: 520, overflowY: 'auto' }}>
                {electricError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-3)' }}>
                    <div className="ax-alert__text">{electricError}</div>
                  </div>
                )}

                <div className="ax-dash-grid">
                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Installation Date</label>
                      <input
                        type="date"
                        className="ax-input"
                        value={instDate}
                        onChange={(e) => setInstDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Solar Meter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. SM-10023"
                        value={solarMeterNo}
                        onChange={(e) => setSolarMeterNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Inverter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. INV-9081"
                        value={inverterNo}
                        onChange={(e) => setInverterNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Net Meter No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. NM-4521"
                        value={nmSmNo}
                        onChange={(e) => setNmSmNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Logger No.</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. LOG-3321"
                        value={logerNo}
                        onChange={(e) => setLogerNo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--12">
                    <div className="ax-field">
                      <label className="ax-field__label">Installation Remarks</label>
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="e.g. Full electrical wiring and inverter synchronization complete"
                        value={instRemarks}
                        onChange={(e) => setInstRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Complete Plant Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setCompletePhoto(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Inverter Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setInverterImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Earthing Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEarthingImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">ACDB Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setAcdbImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Solar Meter Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setSolarMeterImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="ax-col--6">
                    <div className="ax-field">
                      <label className="ax-field__label">Lightning Arrester (LA) Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setLaImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setElectricModalSite(null)}
                  disabled={electricSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={electricSubmitting}
                >
                  {electricSubmitting ? <span className="ax-spinner" /> : 'Save Electrical Installation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Upload Modal ── */}
      {docModalSite && (
        <div className="ax-modal-backdrop" onClick={() => setDocModalSite(null)}>
          <div className="ax-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitDoc}>
              <div className="ax-modal__header">
                <h4 className="ax-modal__title">Upload Commissioning Document</h4>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                  onClick={() => setDocModalSite(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="ax-modal__body">
                {docError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-3)' }}>
                    <div className="ax-alert__text">{docError}</div>
                  </div>
                )}
                <p style={{ margin: '0 0 var(--ax-space-3) 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Site: <b>{docModalSite.beneficiary_name}</b> (CA #{docModalSite.ca_no})
                </p>
                <div className="ax-field">
                  <label className="ax-field__label">Select Document (PDF/JPG/PNG max 5MB)</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    className="ax-input"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>
              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setDocModalSite(null)}
                  disabled={docSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={docSubmitting || !docFile}
                >
                  {docSubmitting ? <span className="ax-spinner" /> : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_ViewInstallation;

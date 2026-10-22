import { useState, useMemo, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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

/* ── Base URL for media assets (images, documents) ── */
const MEDIA_BASE_URL = '';

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${clean}` : `/${clean}`;
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DASH = '—';

/* ── Response field helpers ── */
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
  if (Array.isArray(val)) return val.map(String);
  if (typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // not json
  }
  return [val];
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

const Sub = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>{children}</div>
);

const Row = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div style={{ whiteSpace: 'nowrap' }}>
    <span style={{ color: 'var(--ax-text-muted)' }}>{label}: </span>
    <b style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{value || DASH}</b>
  </div>
);

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ───────── Responsive CSS (BiharAMCSSLViewAssignLight / DLE jaisa) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Card header (desktop): title ko jagah, actions sikudenge */
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

  /* Table: sideways scroll */
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--wide { min-width: 1100px; }

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

    /* Pehla column (Sr. No.) fixed rahe */
    .solar-erp-page .ula-sticky-first th:first-child,
    .solar-erp-page .ula-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1;
      background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
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

  // Modals
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
      return (
        s.beneficiary_name?.toLowerCase().includes(q) ||
        s.contact_no?.toLowerCase().includes(q) ||
        s.ca_no?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.block?.toLowerCase().includes(q) ||
        s.village?.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        text(s, 'unique_id').toLowerCase().includes(q) ||
        text(s, 'company_id').toLowerCase().includes(q) ||
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
    setInstDate(new Date().toISOString().split('T')[0]);
    setSolarMeterNo(site.solarmeter_no || '');
    setInverterNo(site.inverter_no || '');
    setNmSmNo(site.nm_sm_no || '');
    setLogerNo(site.loger_no || '');
    setInstRemarks(site.inst_remarks || '');
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

  // Export Columns definition
  const exportCols: ExportColumn<StructureSiteItem>[] = useMemo(
    () => [
      { header: 'ID', accessor: (r) => `#${r.id}` },
      { header: 'Unique ID', accessor: (r) => text(r, 'unique_id') },
      { header: 'Company ID', accessor: (r) => text(r, 'company_id') },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact No.', accessor: (r) => r.contact_no || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Firm Name', accessor: (r) => text(r, 'firm_name') },
      { header: 'DISCOM', accessor: (r) => text(r, 'discom') },
      { header: 'State', accessor: (r) => text(r, 'state') },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Latitude', accessor: (r) => text(r, 'inst_latitude') },
      { header: 'Longitude', accessor: (r) => text(r, 'inst_longitude') },
      { header: 'Sanction Load (kW)', accessor: (r) => text(r, 'sanction_load') },
      { header: 'Phase', accessor: (r) => text(r, 'phase') },
      { header: 'WO No.', accessor: (r) => text(r, 'wo_no') },
      { header: 'WO Date', accessor: (r) => text(r, 'wo_date') },
      { header: 'Assign Date', accessor: (r) => text(r, 'inst_assign_date') },
      { header: 'Deadline', accessor: (r) => text(r, 'inst_deadline') },
      { header: 'Installation Date', accessor: (r) => text(r, 'inst_date') },
      { header: 'Installation Remarks', accessor: (r) => text(r, 'inst_remarks') },
      { header: 'Module Serials', accessor: (r) => parseList(field(r, 'module_serial_no')).join(', ') },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Structure Date', accessor: (r) => text(r, 'structure_date') },
      { header: 'Structure Verify', accessor: (r) => (Number(r.structure_verify_status) === 1 ? 'Approved' : Number(r.structure_verify_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Structure Verify Remarks', accessor: (r) => text(r, 'structure_verify_remarks') },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Logger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Electric Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Complete' : 'Pending') },
      { header: 'Electric Verify', accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Electric Verify Date', accessor: (r) => text(r, 'inst_verify_date') },
      { header: 'Doc Date', accessor: (r) => text(r, 'inst_doc_date') },
      { header: 'Doc Remarks', accessor: (r) => text(r, 'inst_doc_remarks') },
      { header: 'Doc Verify', accessor: (r) => (num(r, 'inst_doc_verify_status') === 1 ? 'Approved' : num(r, 'inst_doc_verify_status') === 2 ? 'Rejected' : 'Pending') },
      { header: 'Doc Verify Remarks', accessor: (r) => text(r, 'inst_doc_verify_remarks') },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
    if (typeof column.accessor === 'function') return column.accessor(row);
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
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
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
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
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

  const PhotoBtn = ({ label, path, tone = 'neutral' }: { label: string; path?: string | null; tone?: Tone }) =>
    path ? (
      <button
        type="button"
        className={`ax-badge ax-badge--soft ax-badge--${tone}`}
        style={{ cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
        onClick={() => setPreviewImg(mediaUrl(path))}
      >
        {label}
      </button>
    ) : null;

  const COLS = 17;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Bihar ULA Installation"
        subtitle="Manage structure erection, electrical commissioning, and physical verification media"
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
            <Link to="/v/bihar/ula-installation-pending-structure-site" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Structure</span>
            </Link>
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
        {/* ── Main Table Card (Exact DLE style) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="ULA Installation Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Installation Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> installations.
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
                  placeholder="Search name, CA, unique ID, WO…"
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
                  <th className="ax-table__th" scope="col">IDs</th>
                  <th className="ax-table__th" scope="col">Beneficiary Details</th>
                  <th className="ax-table__th" scope="col">Location</th>
                  <th className="ax-table__th" scope="col">Plant & Work Order</th>
                  <th className="ax-table__th" scope="col">Installation Assignment</th>
                  <th className="ax-table__th" scope="col">Module Serials</th>
                  <th className="ax-table__th" scope="col">Structure Photos</th>
                  <th className="ax-table__th" scope="col">Structure Status</th>
                  <th className="ax-table__th" scope="col">Structure Verify</th>
                  <th className="ax-table__th" scope="col">Electric Equipments</th>
                  <th className="ax-table__th" scope="col">Electric Photos</th>
                  <th className="ax-table__th" scope="col">Electric Status</th>
                  <th className="ax-table__th" scope="col">Electric Verify</th>
                  <th className="ax-table__th" scope="col">Commissioning Doc</th>
                  <th className="ax-table__th" scope="col">50% Payment</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={COLS} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={COLS} style={{ padding: 0 }}>
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
                    const modImages = parseList(field(s, 'module_serial_image'));
                    const fastenerImages = parseList(field(s, 'foundation_fastener_images'));
                    const isElectricDone = Number(s.inst_status) === 1;

                    const lat = text(s, 'inst_latitude');
                    const lng = text(s, 'inst_longitude');
                    const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

                    const docPath = text(s, 'inst_doc');
                    const docSubmitted = num(s, 'inst_doc_submit') === 1 || docPath !== '';

                    const payClaim = num(s, 'inst_pay50_claim_status');
                    const payClaimVerify = num(s, 'inst_pay50_claim_verify_status');
                    const payStatus = num(s, 'inst_pay50_status');

                    return (
                      <tr key={s.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>

                        {/* IDs */}
                        <td className="ax-table__td">
                          <Row label="ID" value={`#${s.id}`} />
                          <Row label="Unique" value={text(s, 'unique_id')} />
                          <Row label="Company" value={text(s, 'company_id')} />
                        </td>

                        {/* Beneficiary Details */}
                        <td className="ax-table__td">
                          <div style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}>{s.beneficiary_name || DASH}</div>
                          <div style={{ color: 'var(--ax-text-muted)' }}>CA: {s.ca_no || DASH}</div>
                          <div style={{ color: 'var(--ax-text-muted)' }}>Ph: {s.contact_no || DASH}</div>
                          <div style={{ color: 'var(--ax-text-muted)' }}>Firm: {text(s, 'firm_name') || DASH}</div>
                        </td>

                        {/* Location */}
                        <td className="ax-table__td">
                          <div><b>{s.district || DASH}</b></div>
                          <div>{s.block || DASH} / {s.village || DASH}</div>
                          <Sub>
                            {[text(s, 'state'), text(s, 'discom')].filter(Boolean).join(' · ') || DASH}
                          </Sub>
                          {hasGeo && (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '10px' }}
                            >
                              {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                            </a>
                          )}
                        </td>

                        {/* Plant & Work Order */}
                        <td className="ax-table__td">
                          <Row label="WO" value={text(s, 'wo_no')} />
                          <Row label="Load" value={text(s, 'sanction_load') ? `${text(s, 'sanction_load')} kW` : DASH} />
                          <Row label="Phase" value={text(s, 'phase')} />
                          {text(s, 'wo_date') && <Sub>Date: {text(s, 'wo_date')}</Sub>}
                        </td>

                        {/* Installation Assignment */}
                        <td className="ax-table__td">
                          <Row label="Vendor" value={text(s, 'inst_vendor')} />
                          <Row label="Assigned" value={text(s, 'inst_assign_date')} />
                          <Row label="Deadline" value={text(s, 'inst_deadline')} />
                          {text(s, 'inst_date') && <Sub>Installed: {text(s, 'inst_date')}</Sub>}
                        </td>

                        {/* Module Serials */}
                        <td className="ax-table__td">
                          {modSerials.length === 0 ? (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {modSerials.map((serial, i) => (
                                <span key={i} className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                                  {serial}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Structure Photos */}
                        <td className="ax-table__td">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 160 }}>
                            <PhotoBtn label="Structure" path={s.structure_image} tone="info" />
                            {modImages.map((p, i) => (
                              <PhotoBtn key={i} label={`Mod ${i + 1}`} path={p} tone="info" />
                            ))}
                            {fastenerImages.map((p, i) => (
                              <PhotoBtn key={i} label={`Fastener ${i + 1}`} path={p} tone="neutral" />
                            ))}
                            {!s.structure_image && !modImages.length && !fastenerImages.length && (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>No media</span>
                            )}
                          </div>
                        </td>

                        {/* Structure Status */}
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ${Number(s.structure_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                            {Number(s.structure_status) === 1 ? 'Complete' : 'Pending'}
                          </span>
                          {text(s, 'structure_date') && <Sub>{text(s, 'structure_date')}</Sub>}
                        </td>

                        {/* Structure Verify */}
                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.structure_verify_status)} />
                          {text(s, 'structure_verify_date') && <Sub>{text(s, 'structure_verify_date')}</Sub>}
                          {text(s, 'structure_verify_remarks') && <Sub>{text(s, 'structure_verify_remarks')}</Sub>}
                        </td>

                        {/* Electric Equipments */}
                        <td className="ax-table__td">
                          {isElectricDone ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '11px' }}>
                              <Row label="Meter" value={s.solarmeter_no} />
                              <Row label="Inverter" value={s.inverter_no} />
                              <Row label="Net Meter" value={s.nm_sm_no} />
                              <Row label="Logger" value={s.loger_no} />
                            </div>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>Pending</span>
                          )}
                        </td>

                        {/* Electric Photos */}
                        <td className="ax-table__td">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 160 }}>
                            <PhotoBtn label="Plant" path={text(s, 'complete_photo')} tone="info" />
                            <PhotoBtn label="Inverter" path={text(s, 'inverter_image')} tone="info" />
                            <PhotoBtn label="Earthing" path={text(s, 'earthing_image')} tone="neutral" />
                            <PhotoBtn label="ACDB" path={text(s, 'acdb_image')} tone="neutral" />
                            <PhotoBtn label="Meter" path={text(s, 'solarmeter_image')} tone="neutral" />
                            <PhotoBtn label="LA" path={text(s, 'la_image')} tone="neutral" />
                            {!text(s, 'complete_photo') && !text(s, 'inverter_image') && !text(s, 'earthing_image') && (
                              <span style={{ color: 'var(--ax-text-subtle)' }}>No media</span>
                            )}
                          </div>
                        </td>

                        {/* Electric Status */}
                        <td className="ax-table__td">
                          {isElectricDone ? (
                            <div>
                              <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                              {text(s, 'inst_date') && <Sub>{text(s, 'inst_date')}</Sub>}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleOpenElectricModal(s)}
                            >
                              Complete Electric
                            </button>
                          )}
                        </td>

                        {/* Electric Verify */}
                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.inst_verify_status)} />
                          {text(s, 'inst_verify_date') && <Sub>{text(s, 'inst_verify_date')}</Sub>}
                        </td>

                        {/* Commissioning Doc */}
                        <td className="ax-table__td">
                          {docSubmitted ? (
                            <div>
                              {docPath && (
                                <a
                                  href={mediaUrl(docPath)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ax-badge ax-badge--soft ax-badge--info"
                                  style={{ textDecoration: 'none' }}
                                >
                                  View Doc ↗
                                </a>
                              )}
                              {text(s, 'inst_doc_date') && <Sub>Submitted: {text(s, 'inst_doc_date')}</Sub>}
                              {text(s, 'inst_doc_remarks') && <Sub>Remarks: {text(s, 'inst_doc_remarks')}</Sub>}
                              <div style={{ marginTop: 4 }}>
                                <VerifyBadge value={num(s, 'inst_doc_verify_status')} />
                              </div>
                              {text(s, 'inst_doc_verify_date') && <Sub>{text(s, 'inst_doc_verify_date')}</Sub>}
                              {text(s, 'inst_doc_verify_remarks') && (
                                <Sub>{text(s, 'inst_doc_verify_remarks')}</Sub>
                              )}
                            </div>
                          ) : (
                            <Badge tone="neutral">Not submitted</Badge>
                          )}
                        </td>

                        {/* 50% Payment */}
                        <td className="ax-table__td">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            {payClaim === 1 ? (
                              <Badge tone="info">Claimed{text(s, 'inst_pay50_claim_id') ? ` #${text(s, 'inst_pay50_claim_id')}` : ''}</Badge>
                            ) : (
                              <Badge tone="neutral">Not claimed</Badge>
                            )}
                            {payClaim === 1 && (
                              payClaimVerify === 1 ? <Badge tone="success">Claim verified</Badge> : <Badge tone="warning">Claim pending</Badge>
                            )}
                            {payStatus === 2 ? (
                              <Badge tone="success">Paid</Badge>
                            ) : payStatus === 0 || Number.isNaN(payStatus) ? (
                              <Badge tone="warning">Payment pending</Badge>
                            ) : (
                              <Badge tone="info">Payment status {payStatus}</Badge>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => setDocModalSite(s)}
                              title="Upload or update commissioning document"
                            >
                              Upload Doc
                            </button>
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
            style={{ maxWidth: 800, padding: 'var(--ax-space-3)', background: 'var(--ax-surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--ax-space-2)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                onClick={() => setPreviewImg(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src={previewImg}
                alt="Verification media preview"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }}
              />
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

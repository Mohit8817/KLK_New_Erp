import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { ApexChart } from '../../../../charts/ApexChart';
import {
  Pagination,
  usePagination,
  SearchInput,
  ExportButton,
  type ExportColumn,
} from '../../../../../common';
import {
  JAMMU_SOLAR_OVERVIEW,
  PHASE_DETAILS_DATA,
  PHASE_WISE_REPORT,
  DISTRICT_WISE_REPORT,
  VENDOR_WISE_REPORT,
  WORK_ORDER_REPORT,
  MONTHLY_INSTALLATION_SERIES,
  SOLAR_MATERIALS_DATA,
  RECENT_SOLAR_PROJECTS,
  RECENT_OPERATIONS_ACTIVITY,
  WORKFORCE_STATS,
  type ReportBifurcationRow,
} from '../../../../../data/demo/solarErpData';

const MATERIAL_EXPORT_COLUMNS: ExportColumn<(typeof SOLAR_MATERIALS_DATA)[0]>[] = [
  { header: 'Material Name', accessor: 'name' },
  { header: 'Specification', accessor: 'specification' },
  { header: 'Category', accessor: 'category' },
  { header: 'Required', accessor: (m) => `${m.required} ${m.unit}` },
  { header: 'Supplied', accessor: 'supplied' },
  { header: 'Installed', accessor: 'installed' },
  { header: 'In Transit', accessor: 'inTransit' },
  { header: 'Pending', accessor: 'pending' },
  { header: 'Status', accessor: 'status' },
];

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// Scoped styling to tighten spacing between PageHead and Filter Operations
const SOLAR_PAGE_CSS = `
  .solar-erp-page .ax-page-head {
    margin-block-end: 10px;
  }
  .solar-erp-page .ax-page-head .ax-breadcrumb {
    margin-block-end: 4px;
  }
  .solar-erp-page .ax-dash-grid {
    margin-top: 0;
  }
`;

// File upload icon definitions matching forms/file-upload
type FileIconKind = 'pdf' | 'doc' | 'xls' | 'img';
const FILE_ICONS: Record<FileIconKind, React.ReactNode> = {
  pdf: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></>,
  doc: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>,
  xls: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M10 12l4 5" /><path d="M10 17l4 -5" /></>,
  img: <><path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" /></>,
};

interface QueueFileItem {
  id: number;
  name: string;
  size: string;
  progress: number;
  status: 'done' | 'uploading' | 'error';
  error?: string;
  c: string;
  icon: FileIconKind;
  rawFile?: File;
}

const fmtSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

const getIconKind = (name: string): FileIconKind => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'xls';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) return 'img';
  return 'doc';
};

const getFileColor = (icon: FileIconKind): string => {
  switch (icon) {
    case 'xls': return 'var(--ax-viz-emerald)';
    case 'pdf': return 'var(--ax-viz-pink)';
    case 'doc': return 'var(--ax-viz-cyan)';
    case 'img': return 'var(--ax-viz-violet)';
  }
};

// Inline SVG Icons matching Tabler design language
const ICON_CAL = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
);
const ICON_CHEV = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);
const ICON_DOWNLOAD = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);

const ICON_TRASH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);

// Tabler Sun & Solar SVGs
const ICON_SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z"/><path d="M6.343 17.657l-1.414 1.414"/><path d="M6.343 6.343l-1.414 -1.414"/><path d="M17.657 6.343l1.414 -1.414"/><path d="M17.657 17.657l1.414 1.414"/><path d="M4 12h-2"/><path d="M12 4v-2"/><path d="M20 12h2"/><path d="M12 20v2"/></svg>
);
const ICON_TRUCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>
);
const ICON_WRENCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5z" /></svg>
);
const ICON_METER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 12l3 -3" /><path d="M12 7v1" /><path d="M7 12h1" /><path d="M17 12h-1" /></svg>
);
const ICON_RMS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 18l.01 0" /><path d="M9.172 15.172a4 4 0 0 1 5.656 0" /><path d="M6.343 12.343a8 8 0 0 1 11.314 0" /><path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" /></svg>
);
const ICON_CURRENCY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h18" /><path d="M3 10h18" /><path d="M3 15h18" /><path d="M3 20h18" /><path d="M12 5v15" /></svg>
);
const ICON_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /></svg>
);
const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>
);

interface UploadedData {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  headers: string[];
  rows: Record<string, string>[];
}

const SAMPLE_EXCEL_DATA: Record<string, string>[] = [
  { 'District': 'Jammu', 'Consumer ID': 'JPDCL-JMU-0841', 'Consumer Name': 'Rakesh Sharma', 'Sanctioned Load (KW)': '15.0', 'Proposed Solar (KW)': '10.0', 'Feasibility Status': 'Approved', 'Survey Date': '2026-08-12', 'Inspector': 'Amit Gupta', 'GPS Lat/Long': '32.7266° N, 74.8570° E' },
  { 'District': 'Kathua', 'Consumer ID': 'JPDCL-KTH-1192', 'Consumer Name': 'Balwan Singh', 'Sanctioned Load (KW)': '8.0', 'Proposed Solar (KW)': '5.0', 'Feasibility Status': 'Approved', 'Survey Date': '2026-08-14', 'Inspector': 'Pooja Verma', 'GPS Lat/Long': '32.3700° N, 75.5200° E' },
  { 'District': 'Samba', 'Consumer ID': 'JPDCL-SMB-0453', 'Consumer Name': 'Vijay Anand', 'Sanctioned Load (KW)': '25.0', 'Proposed Solar (KW)': '20.0', 'Feasibility Status': 'Pending Review', 'Survey Date': '2026-08-15', 'Inspector': 'Mohit Kumar', 'GPS Lat/Long': '32.5600° N, 75.1200° E' },
  { 'District': 'Udhampur', 'Consumer ID': 'JPDCL-UDH-0914', 'Consumer Name': 'Kewal Krishan', 'Sanctioned Load (KW)': '12.0', 'Proposed Solar (KW)': '10.0', 'Feasibility Status': 'Approved', 'Survey Date': '2026-08-18', 'Inspector': 'Amit Gupta', 'GPS Lat/Long': '32.9300° N, 75.1400° E' },
  { 'District': 'Rajouri', 'Consumer ID': 'JPDCL-RAJ-0235', 'Consumer Name': 'Mohd. Tariq', 'Sanctioned Load (KW)': '6.0', 'Proposed Solar (KW)': '4.0', 'Feasibility Status': 'Under Feasibility', 'Survey Date': '2026-08-20', 'Inspector': 'Pooja Verma', 'GPS Lat/Long': '33.3800° N, 74.3100° E' },
  { 'District': 'Doda', 'Consumer ID': 'JPDCL-DOD-0176', 'Consumer Name': 'Ghulam Rasool', 'Sanctioned Load (KW)': '10.0', 'Proposed Solar (KW)': '7.5', 'Feasibility Status': 'Approved', 'Survey Date': '2026-08-22', 'Inspector': 'Mohit Kumar', 'GPS Lat/Long': '33.1400° N, 75.5400° E' },
  { 'District': 'Reasi', 'Consumer ID': 'JPDCL-REA-0387', 'Consumer Name': 'Santosh Rani', 'Sanctioned Load (KW)': '7.0', 'Proposed Solar (KW)': '5.0', 'Feasibility Status': 'Approved', 'Survey Date': '2026-08-25', 'Inspector': 'Amit Gupta', 'GPS Lat/Long': '33.0800° N, 74.8300° E' },
  { 'District': 'Poonch', 'Consumer ID': 'JPDCL-PNC-0128', 'Consumer Name': 'Harbans Singh', 'Sanctioned Load (KW)': '18.0', 'Proposed Solar (KW)': '15.0', 'Feasibility Status': 'Conditional Pass', 'Survey Date': '2026-08-27', 'Inspector': 'Mohit Kumar', 'GPS Lat/Long': '33.7700° N, 74.1000° E' },
];

export function JammuDashboard() {
  // Interactive Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedPhase, setSelectedPhase] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'phaseDetails' | 'phaseWise' | 'districtWise' | 'vendorWise' | 'workOrderWise'>('phaseDetails');
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropzone drag state & files queue matching forms/file-upload
  const [dragging, setDragging] = useState<boolean>(false);
  const uidRef = useRef<number>(10);
  const [files, setFiles] = useState<QueueFileItem[]>([
    {
      id: 1,
      name: 'Jammu_Solar_Survey_Sample.xlsx',
      size: '14.2 KB',
      progress: 100,
      status: 'done',
      c: 'var(--ax-viz-emerald)',
      icon: 'xls',
    },
    {
      id: 2,
      name: 'brand-guidelines-v4.docx',
      size: '1.2 MB',
      progress: 100,
      status: 'done',
      c: 'var(--ax-viz-cyan)',
      icon: 'doc',
    },
    {
      id: 3,
      name: 'Q3-financial-report.pdf',
      size: '3.4 MB',
      progress: 100,
      status: 'done',
      c: 'var(--ax-viz-pink)',
      icon: 'pdf',
    },
    {
      id: 4,
      name: 'pricing-model-2026.xlsx',
      size: '860 KB',
      progress: 100,
      status: 'done',
      c: 'var(--ax-viz-emerald)',
      icon: 'xls',
    },
  ]);

  // Dynamic Excel / CSV table upload state initialized with sample survey
  const [uploadedData, setUploadedData] = useState<UploadedData | null>({
    fileName: 'Jammu_Solar_Survey_Sample.xlsx',
    fileSize: '14.2 KB',
    uploadDate: 'Initial Load',
    headers: Object.keys(SAMPLE_EXCEL_DATA[0]),
    rows: SAMPLE_EXCEL_DATA,
  });
  const [uploadSearchQuery, setUploadSearchQuery] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  void isProcessingFile;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return SOLAR_MATERIALS_DATA.filter((m) => {
      const matchCat = materialFilter === 'All' || m.category === materialFilter;
      const matchQuery = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.specification.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [materialFilter, searchQuery]);

  // Working pagination for Solar Materials table from common folder
  const {
    paginatedData: paginatedMaterials,
    currentPage: materialPage,
    pageSize: materialPageSize,
    totalItems: totalMaterialItems,
    setPage: setMaterialPage,
    setPageSize: setMaterialPageSize,
  } = usePagination({ data: filteredMaterials, initialPageSize: 8 });

  // Filtered recent projects
  const filteredProjects = useMemo(() => {
    return RECENT_SOLAR_PROJECTS.filter((p) => {
      const matchDistrict = selectedDistrict === 'All' || p.district === selectedDistrict;
      const matchPhase = selectedPhase === 'All' || p.phase === selectedPhase;
      return matchDistrict && matchPhase;
    });
  }, [selectedDistrict, selectedPhase]);

  // Data selection for Report-Wise Bifurcation
  const currentBifurcationData: ReportBifurcationRow[] = useMemo(() => {
    switch (activeTab) {
      case 'phaseWise':
        return PHASE_WISE_REPORT;
      case 'districtWise':
        return DISTRICT_WISE_REPORT;
      case 'vendorWise':
        return VENDOR_WISE_REPORT;
      case 'workOrderWise':
        return WORK_ORDER_REPORT;
      default:
        return PHASE_WISE_REPORT;
    }
  }, [activeTab]);



  // Export uploaded data to CSV
  const exportUploadedDataToCSV = () => {
    if (!uploadedData || uploadedData.rows.length === 0) return;
    const headers = uploadedData.headers;
    const rows = uploadedData.rows.map((r) =>
      headers.map((h) => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${uploadedData.fileName.replace(/\.[^/.]+$/, '')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV helper
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string) => {
      const result: string[] = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuote && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (c === ',' && !inQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
      const values = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      return row;
    });
    return { headers, rows };
  };

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setUploadError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const { headers, rows } = parseCSVText(text);
          if (headers.length > 0) {
            setUploadedData({
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(1) + ' KB',
              uploadDate: new Date().toLocaleTimeString(),
              headers,
              rows,
            });
          } else {
            setUploadError('Uploaded file appears to be empty.');
          }
        } catch {
          setUploadError('Failed to parse CSV file. Please verify the format.');
        } finally {
          setIsProcessingFile(false);
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result;
          let XLSX = (window as any).XLSX;
          if (!XLSX) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
              script.onload = () => resolve((window as any).XLSX);
              script.onerror = () => reject(new Error('Network error loading SheetJS'));
              document.head.appendChild(script);
            });
            XLSX = (window as any).XLSX;
          }

          if (XLSX) {
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            if (rawRows.length > 0) {
              const headers = rawRows[0].map((h: any) => String(h || '').trim()).filter(Boolean);
              const rows = rawRows.slice(1).map((r: any[]) => {
                const rowObj: Record<string, string> = {};
                headers.forEach((h: string, idx: number) => {
                  rowObj[h] = r[idx] !== undefined && r[idx] !== null ? String(r[idx]) : '';
                });
                return rowObj;
              });
              setUploadedData({
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(1) + ' KB',
                uploadDate: new Date().toLocaleTimeString(),
                headers,
                rows,
              });
            } else {
              setUploadError('The Excel sheet contains no readable rows.');
            }
          } else {
            setUploadError('Excel parser could not be initialized.');
          }
        } catch {
          setUploadError('Failed to parse Excel file. Tip: You can also save the spreadsheet as .csv and upload.');
        } finally {
          setIsProcessingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadError('Unsupported file format. Please upload an .xlsx, .xls, or .csv file.');
      setIsProcessingFile(false);
    }
  };

  // Dropzone helper operations matching forms/file-upload
  const queueFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems: QueueFileItem[] = [];

    Array.from(fileList).forEach((file) => {
      uidRef.current += 1;
      const big = file.size > 25 * 1024 * 1024;
      const icon = getIconKind(file.name);
      const color = getFileColor(icon);

      const item: QueueFileItem = {
        id: uidRef.current,
        name: file.name,
        size: fmtSize(file.size),
        progress: big ? 0 : 100,
        status: big ? 'error' : 'done',
        error: big ? 'Exceeds 25 MB limit' : '',
        c: color,
        icon,
        rawFile: file,
      };
      newItems.push(item);

      // If it's a spreadsheet and not over limit, parse it into the table
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!big && (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'txt')) {
        handleFileUpload(file);
      }
    });

    setFiles((prev) => [...prev, ...newItems]);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    queueFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    queueFiles(e.dataTransfer.files);
  };

  const retry = (index: number) => {
    setFiles((fs) =>
      fs.map((f, fi) => {
        if (fi === index) {
          if (f.rawFile) handleFileUpload(f.rawFile);
          return { ...f, status: 'done', progress: 100, error: '' };
        }
        return f;
      })
    );
  };

  const removeFile = (id: number) => {
    setFiles((fs) => {
      const removed = fs.find((f) => f.id === id);
      const remaining = fs.filter((f) => f.id !== id);
      if (removed && uploadedData && removed.name === uploadedData.fileName) {
        setUploadedData(null);
      }
      return remaining;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setUploadedData(null);
    setUploadSearchQuery('');
    setUploadError(null);
  };

  const totalSize = () => {
    let totalBytes = 0;
    files.forEach((f) => {
      if (f.size.includes('MB')) {
        totalBytes += parseFloat(f.size) * 1024 * 1024;
      } else if (f.size.includes('KB')) {
        totalBytes += parseFloat(f.size) * 1024;
      }
    });
    return fmtSize(totalBytes || 5.5 * 1024 * 1024);
  };

  const doneCount = () => files.filter((f) => f.status === 'done').length;

  const handleLoadSampleData = () => {
    const headers = Object.keys(SAMPLE_EXCEL_DATA[0]);
    setUploadedData({
      fileName: 'Jammu_Solar_Survey_Sample.xlsx',
      fileSize: '14.2 KB',
      uploadDate: new Date().toLocaleTimeString(),
      headers,
      rows: SAMPLE_EXCEL_DATA,
    });
    setUploadError(null);
    setFiles((prev) => {
      if (prev.some((f) => f.name === 'Jammu_Solar_Survey_Sample.xlsx')) return prev;
      uidRef.current += 1;
      return [
        {
          id: uidRef.current,
          name: 'Jammu_Solar_Survey_Sample.xlsx',
          size: '14.2 KB',
          progress: 100,
          status: 'done',
          c: 'var(--ax-viz-emerald)',
          icon: 'xls',
        },
        ...prev,
      ];
    });
  };

  // Filtered rows for the uploaded table
  const filteredUploadedRows = useMemo(() => {
    if (!uploadedData) return [];
    if (!uploadSearchQuery) return uploadedData.rows;
    const q = uploadSearchQuery.toLowerCase();
    return uploadedData.rows.filter((row) =>
      uploadedData.headers.some((h) => (row[h] || '').toLowerCase().includes(q))
    );
  }, [uploadedData, uploadSearchQuery]);

  return (
    <div className="solar-erp-page">
      <style>{SOLAR_PAGE_CSS}</style>
      {/* 1. Page Header with Breadcrumb, Title & Quick Actions */}
      <PageHead
        title="Jammu Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Jammu State Operations · 70MW Grid-Connected Solar Rooftop (SRT) Scheme
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Jammu
            </span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill" aria-label="Fiscal Year filter">
              {ICON_CAL}
              <span className="ax-btn__label">FY 2026–27</span>
              {ICON_CHEV}
            </button>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh live telemetry">
              {ICON_REFRESH}
            </button>
            <button type="button" className="ax-btn ax-btn--secondary">
              {ICON_DOWNLOAD}
              <span className="ax-btn__label">Export JPDCL Report</span>
            </button>
            <Link to="/jammu/viewdata" className="ax-btn ax-btn--secondary" title="View 49-field technical survey records">
              <span className="ax-btn__label">View Survey Data</span>
            </Link>
            <Link to="/jammu/add-srt-new" className="ax-btn ax-btn--secondary" title="Unified single card form">
              <span className="ax-btn__label">Single Card Form</span>
            </Link>
            <Link to="/jammu/add-srt-70mw" className="ax-btn ax-btn--primary">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Jammu SRT 70MW</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Solar Dashboard Filters"
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--ax-radius-lg)',
            border: '1px solid var(--ax-border-subtle)',  
            background: 'var(--ax-bg-surface)',
          }}
        >

          
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px',
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)',
                  borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              {/* State Filter (locked to Jammu) */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="state-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>State:</label>
                <select id="state-select" className="ax-input ax-input--sm" style={{ width: 130, height: 30, fontSize: 'var(--ax-text-xs)', fontWeight: 600, paddingInline: '8px' }} defaultValue="Jammu" disabled>
                  <option value="Jammu">Jammu (Active)</option>
                </select>
              </div>

              {/* District Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="district-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>District:</label>
                <select
                  id="district-select"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts (10)</option>
                  <option value="Jammu">Jammu</option>
                  <option value="Kathua">Kathua</option>
                  <option value="Samba">Samba</option>
                  <option value="Udhampur">Udhampur</option>
                  <option value="Rajouri">Rajouri</option>
                  <option value="Poonch">Poonch</option>
                  <option value="Doda">Doda</option>
                  <option value="Ramban">Ramban</option>
                  <option value="Reasi">Reasi</option>
                  <option value="Kishtwar">Kishtwar</option>
                </select>
              </div>

              {/* Phase Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="phase-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>Phase:</label>
                <select
                  id="phase-select"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                >
                  <option value="All">All Phases</option>
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Phase 3">Phase 3</option>
                  <option value="Phase 4">Phase 4</option>
                  <option value="Phase 5">Phase 5</option>
                  <option value="Phase 6">Phase 6</option>
                  <option value="Phase 7">Phase 7</option>
                  <option value="Phase 8">Phase 8</option>
                  <option value="Phase NA">Phase NA</option>
                </select>
              </div>

              {/* Reset button */}
              {(selectedDistrict !== 'All' || selectedPhase !== 'All') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedPhase('All'); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Discom: <b style={{ color: 'var(--ax-text-strong)' }}>JPDCL</b> · Nodal: <b style={{ color: 'var(--ax-text-strong)' }}>JAKEDA</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '11px', padding: '2px 8px' }}>
                MNRE Phase-II
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu 70MW SRT Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Solar Energy Management System · State Hub</p>
              <h2 className="ax-welcome__title">Welcome to Jammu 70MW SRT Dashboard</h2>
              <p className="ax-welcome__lede">
                Jammu state operational overview: <b>22,994 KW</b> feasible capacity validated across <b>2,444 active sites</b>.
                <b> 17,469 KW (76.0%)</b> completed on-site with <b>20,936 KW</b> material dispatched and 70% subsidy tranche processed.
              </p>
       
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">3,086</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>Survey: 3,086 / 0</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Feasible Sites</dt>
                <dd className="ax-num">2,444</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>22,994 KW Feasible</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Capacity</dt>
                <dd className="ax-num">17,469 KW</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>1,568 Sites Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Canceled Sites</dt>
                <dd className="ax-num">642</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-red)' }}>5,387 KW Canceled</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Top KPI Cards Row (Solar Domain-specific — Compact Sleek Design) */}
        {/* KPI 1: Feasible Sites & Capacity */}
        <div className="ax-card ax-col--3" role="region" aria-label="Feasible Sites" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_SUN}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Feasible Sites / Active
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} 79.2%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  2,444 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Nos.</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  22,994 KW Feasible
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-accent" series={[{ name: 'Feasible', data: [1800, 1920, 2100, 2240, 2350, 2400, 2444] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Material Dispatch Status */}
        <div className="ax-card ax-col--3" role="region" aria-label="Material Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', color: 'var(--ax-viz-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_TRUCK}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Material Status (Dispatched)
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} 91.0%  
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  20,936 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  2,060 Sites / 384 Pend.
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-cyan" series={[{ name: 'Dispatched', data: [12000, 14500, 17200, 18900, 20100, 20936] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Installation Status */}
        <div className="ax-card ax-col--3" role="region" aria-label="Installation Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', color: 'var(--ax-viz-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_WRENCH}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Installation Completed
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} 76.0%6
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  17,469 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  1,568 Sites / 876 Pend.
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-emerald" series={[{ name: 'Installed', data: [9400, 11800, 13900, 15400, 16800, 17469] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Discom Net Metering */}
        <div className="ax-card ax-col--3" role="region" aria-label="Net Meter Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', color: 'var(--ax-viz-amber)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_METER}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Net Meter Commissioned
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} 604 Nos.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  6,159 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  593 Done / 975 Pending
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-amber" series={[{ name: 'Meters', data: [210, 290, 380, 460, 530, 604] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPI Rail (RMS Telemetry, Payment 70%, Payment 10%, AMC Status) */}
        {/* KPI 5: RMS Status */}
        <div className="ax-card ax-col--3" role="region" aria-label="RMS Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', color: 'var(--ax-viz-violet)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_RMS}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  RMS Telemetry Online
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} 820 Nos.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  9,287 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  816 Active / 752 Pend.
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-violet" series={[{ name: 'RMS', data: [340, 480, 590, 690, 760, 820] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 6: Payment 70% Subsidy */}
        <div className="ax-card ax-col--3" role="region" aria-label="Payment 70%" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_CURRENCY}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Payment 70% Subsidy Tranche
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} ₹80.5 Cr
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  20,936 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  2,060 Done / 384 Pend.
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-accent" series={[{ name: 'Pay 70%', data: [11000, 13800, 16200, 18500, 20936] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 7: Payment 10% Final Settlement */}
        <div className="ax-card ax-col--3" role="region" aria-label="Payment 10%" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', color: 'var(--ax-viz-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_SHIELD}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Payment 10% Final Closeout
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} ₹1.58 Cr
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  413 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  53 Done / 2,391 Pend.
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-pink" series={[{ name: 'Pay 10%', data: [50, 120, 220, 310, 413] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 8: AMC Warranty Lifecycle */}
        <div className="ax-card ax-col--3" role="region" aria-label="AMC Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', color: 'var(--ax-viz-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_WRENCH}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  AMC 1st–5th Year Warranty
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                5-Yr Plan
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  22,994 <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>KW</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  2,444 Sites under SLA
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-emerald" series={[{ name: 'AMC', data: [22994, 22994, 22994, 22994] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Charts Section: Monthly Installation Velocity & Site Feasibility Donut */}
        {/* CHART 1: Monthly Installation Velocity */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly Installation Velocity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Throughput</span>
              <h2 className="ax-card__title">Monthly Installation &amp; Capacity Addition</h2>
              <p className="ax-card__subtitle">Rooftop capacity installed (KW) and panels deployed per month — Jan to Sep 2026</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ax-accent)' }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Capacity (KW)</small>
                </span>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ax-viz-cyan)' }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Panels Installed</small>
                </span>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={320}
              legend="none"
              ariaLabel="Monthly solar installation column chart"
              series={[
                { name: 'Capacity Installed (KW)', data: MONTHLY_INSTALLATION_SERIES.map((m) => m.capacityKw) },
                { name: 'Panels Installed (Nos.)', data: MONTHLY_INSTALLATION_SERIES.map((m) => m.panelsInstalled) },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan')],
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    columnWidth: '55%',
                  },
                },
                xaxis: {
                  categories: MONTHLY_INSTALLATION_SERIES.map((m) => m.month),
                },
                yaxis: [
                  {
                    title: { text: 'Capacity (KW)', style: { color: 'var(--ax-text-muted)' } },
                  },
                  {
                    opposite: true,
                    title: { text: 'Panels Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } },
                  },
                ],
              }}
            />
          </div>
        </section>

        {/* CHART 2: Site Feasibility & Survey Breakdown Donut */}
        <section className="ax-card ax-col--4" role="region" aria-label="Site Feasibility Breakdown">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Distribution</span>
              <h2 className="ax-card__title">Site Feasibility Status</h2>
              <p className="ax-card__subtitle">Total 3,086 Surveyed Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut"
              height={230}
              legend="none"
              ariaLabel="Donut chart of Site Survey Feasibility: 2444 Feasible, 642 Canceled"
              series={[2444, 642]}
              apex={{
                labels: ['Feasible Active Sites', 'Canceled / Infeasible'],
                colors: [cv('--ax-viz-emerald'), cv('--ax-viz-red')],
                stroke: { width: 0 },
                plotOptions: {
                  pie: {
                    donut: {
                      size: '72%',
                      labels: {
                        show: true,
                        name: { fontFamily: cv('--ax-font-sans') },
                        value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                        total: { show: true, label: 'Total Sites', formatter: () => '3,086' },
                      },
                    },
                  },
                },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-emerald)', display: 'inline-block' }} /></span>
                <span className="ax-list__content">
                  <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>Feasible Sites (Active)</span>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>22,994 KW Total Capacity</span>
                </span>
                <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>2,444 (79.2%)</span>
              </li>
              <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-red)', display: 'inline-block' }} /></span>
                <span className="ax-list__content">
                  <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>Canceled Sites</span>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>5,387 KW Infeasible Capacity</span>
                </span>
                <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>642 (20.8%)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 6. District-Wise Solar Capacity Distribution Chart & Stage Funnel */}
        {/* CHART 3: District-Wise Capacity Distribution */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District-wise Solar Project Statistics">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Solar Project Statistics</h2>
              <p className="ax-card__subtitle">Allocated feasible capacity vs. installed capacity across Jammu region</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">10 Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={320}
              legend="top"
              ariaLabel="Horizontal bar chart of solar capacity by district"
              series={[
                { name: 'Allocated Feasible (KW)', data: DISTRICT_WISE_REPORT.map((d) => d.totalCapacityKw) },
                { name: 'Installed (KW)', data: DISTRICT_WISE_REPORT.map((d) => d.installationCompleteKw) },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-emerald')],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    borderRadius: 4,
                    columnWidth: '60%',
                  },
                },
                xaxis: {
                  categories: DISTRICT_WISE_REPORT.map((d) => d.name),
                  labels: { style: { fontSize: '11px' } },
                },
                yaxis: {
                  title: { text: 'Capacity (KW)', style: { color: 'var(--ax-text-muted)' } },
                },
              }}
            />
          </div>
        </section>

        {/* SECTION: Solar Installation & Execution Funnel */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation Progress & Pipeline">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">Installation Milestones</h2>
              <p className="ax-card__subtitle">Progress by project execution stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {/* Survey Stage */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>1. Site Survey &amp; Geo-tagging</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-xs)' }}>3,086 / 3,086 (100%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '100%', background: 'var(--ax-viz-emerald)' }} /></div></div>
            </div>

            {/* Material Dispatch Stage */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>2. Material Dispatch</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-cyan)', fontSize: 'var(--ax-text-xs)' }}>20,936 KW (91.0%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '91.0%', background: 'var(--ax-viz-cyan)' }} /></div></div>
            </div>

            {/* Physical Installation Stage */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>3. Rooftop Module &amp; Inverter Mount</span>
                <b className="ax-num" style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-xs)' }}>17,469 KW (76.0%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '76.0%', background: 'var(--ax-accent)' }} /></div></div>
            </div>

            {/* Net Metering Stage */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>4. JPDCL Net Metering Commissioned</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-amber)', fontSize: 'var(--ax-text-xs)' }}>6,159 KW (26.8%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '26.8%', background: 'var(--ax-viz-amber)' }} /></div></div>
            </div>

            {/* RMS Gateway Stage */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>5. RMS Telemetry Online to MNRE</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-violet)', fontSize: 'var(--ax-text-xs)' }}>9,287 KW (40.4%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '40.4%', background: 'var(--ax-viz-violet)' }} /></div></div>
            </div>

            {/* 70% Subsidy Disbursal */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>6. Payment 70% Subsidy Disbursal</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-xs)' }}>20,936 KW (91.0%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '91.0%', background: 'var(--ax-viz-emerald)' }} /></div></div>
            </div>

            {/* 10% Final Settlement */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>7. Payment 10% Retention Settlement</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-pink)', fontSize: 'var(--ax-text-xs)' }}>413 KW (1.8%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '1.8%', background: 'var(--ax-viz-pink)' }} /></div></div>
            </div>
          </div>
        </section>

        {/* 7. Solar Material / Inventory Tracking Section */}
        <section className="ax-card ax-col--12" role="region" aria-label="Solar Material Tracking">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Supply Chain &amp; Warehousing</span>
              <h2 className="ax-card__title">Solar Material &amp; Equipment Tracking</h2>
              <p className="ax-card__subtitle">Procurement, warehouse supply, installation consumption &amp; transit statuses</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search material..."
                  size="sm"
                  style={{ minWidth: 170 }}
                />
                <select
                  className="ax-input ax-input--sm"
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  style={{ minWidth: 140 }}
                >
                  <option value="All">All Categories</option>
                  <option value="Solar Panels">Solar Panels</option>
                  <option value="Inverter">Inverter</option>
                  <option value="Mounting Structure">Mounting Structure</option>
                  <option value="Metering">Metering</option>
                  <option value="RMS / Telemetry">RMS / Telemetry</option>
                  <option value="Cables">Cables</option>
                  <option value="Junction Box">Junction Box</option>
                  <option value="Safety & Protection">Safety &amp; Protection</option>
                </select>
                <ExportButton
                  data={filteredMaterials}
                  columns={MATERIAL_EXPORT_COLUMNS}
                  filename={`Jammu_Solar_Materials_${new Date().toISOString().slice(0, 10)}`}
                  label="Export Excel/CSV"
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Material &amp; Specification</th>
                  <th className="ax-table__th" scope="col">Category</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Required</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Supplied</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">In Transit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterials.map((mat) => (
                  <tr key={mat.id} className="ax-table__row">
                    <td className="ax-table__td">
                      <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{mat.name}</div>
                      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{mat.specification}</div>
                    </td>
                    <td className="ax-table__td">
                      <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{mat.category}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">{mat.required.toLocaleString()} {mat.unit}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{mat.supplied.toLocaleString()}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{mat.installed.toLocaleString()}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{mat.inTransit.toLocaleString()}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: mat.pending > 0 ? 'var(--ax-text-muted)' : 'var(--ax-text-subtle)' }}>{mat.pending.toLocaleString()}</td>
                    <td className="ax-table__td">
                      <span className={`ax-badge ax-badge--soft ax-badge--${mat.statusTone} ax-badge--pill`}>
                        <span className="ax-badge__dot" />
                        {mat.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Working Pagination from Common Folder */}
          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <Pagination
              currentPage={materialPage}
              totalItems={totalMaterialItems}
              pageSize={materialPageSize}
              onPageChange={setMaterialPage}
              onPageSizeChange={setMaterialPageSize}
              pageSizeOptions={[5, 8, 15, 25]}
            />
          </div>
        </section>

        {/* 7.5. File Upload & Dynamic Spreadsheet Viewer (matching forms/file-upload) */}
        <section className="ax-card ax-col--12" role="region" aria-label="File dropzone and document spreadsheet hub">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Drag &amp; drop</span>
              <h2 className="ax-card__title">Upload documents</h2>
              <p className="ax-card__subtitle">PDF, DOCX, XLSX or images up to 25 MB each.</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                  {files.length + ' file' + (files.length === 1 ? '' : 's')}
                </span>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={clearAll}
                  title="Clear all uploaded documents and table"
                >
                  <span className="ax-btn__label">Clear all</span>
                </button>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleLoadSampleData}
                  title="Reload sample solar survey dataset"
                >
                  <span className="ax-btn__label">Load Sample Solar Dataset</span>
                </button>
              </div>
            </div>
          </div>

          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {/* Primary Dropzone */}
            <div className="ax-dropzone">
              <div
                className={`ax-dropzone__area${dragging ? ' is-dragover' : ''}`}
                role="button"
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragging(false);
                }}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fileInputRef.current?.click();
                  else if (e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Drop files here or click to browse"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
                  <path d="M9 15l3 -3l3 3" />
                  <path d="M12 12l0 9" />
                </svg>
                <div style={{ fontWeight: 500, color: 'var(--ax-text-strong)' }}>
                  {dragging ? 'Drop to upload' : 'Drag files here or click to browse'}
                </div>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                  Maximum 25 MB per file · up to 20 files
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".xlsx,.xls,.csv,.txt,.pdf,.docx,.jpg,.png"
                  className="visually-hidden"
                  onChange={onPick}
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>

              {/* Upload Error Banner if any */}
              {uploadError && (
                <div style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-xs)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b>Error:</b> {uploadError}
                </div>
              )}

              {/* Files Queue List */}
              <ul className="ax-dropzone__list" aria-live="polite">
                {files.map((f, i) => (
                  <li key={f.id} className="ax-dropzone__file" style={{ alignItems: 'flex-start' }}>
                    <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${f.c} 18%,transparent)`, color: f.c, marginTop: 2 }}>
                      <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {FILE_ICONS[f.icon]}
                      </svg>
                    </span>
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div className="ax-cluster" style={{ justifyContent: 'space-between', gap: 'var(--ax-space-3)' }}>
                        <span className="ax-truncate" style={{ fontWeight: 500, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>
                          {f.name}
                        </span>
                        <span className="ax-num" style={{ flex: '0 0 auto', fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: f.status === 'error' ? 'var(--ax-danger-500)' : 'var(--ax-text-subtle)' }}>
                          {f.status === 'done' ? f.size : f.status === 'error' ? 'Failed' : f.progress + '%'}
                        </span>
                      </div>
                      {f.status === 'uploading' && (
                        <div className="ax-progress ax-progress--xs" style={{ marginTop: 6 }}>
                          <div className="ax-progress__track">
                            <div className="ax-progress__fill" style={{ width: f.progress + '%' }} />
                          </div>
                        </div>
                      )}
                      {f.status === 'done' && (
                        <div className="ax-cluster" style={{ gap: 5, marginTop: 4, fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-viz-emerald)' }}>
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12l5 5l10 -10" />
                          </svg>
                          <span>{f.size + ' · uploaded'}</span>
                          {uploadedData && uploadedData.fileName === f.name && (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontSize: '10px', padding: '1px 6px', marginLeft: 4 }}>
                              Active in Table
                            </span>
                          )}
                        </div>
                      )}
                      {f.status === 'error' && (
                        <div className="ax-cluster" style={{ gap: 5, marginTop: 4, fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-danger-500)' }}>
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                            <path d="M10.24 3.957l-8.422 14.06a1.989 1.989 0 0 0 1.7 2.983h16.845a1.989 1.989 0 0 0 1.7 -2.983l-8.423 -14.06a1.989 1.989 0 0 0 -3.4 0" />
                          </svg>
                          <span>{f.error}</span>
                        </div>
                      )}
                    </div>
                    {f.status === 'error' && (
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => retry(i)} aria-label="Retry upload">
                        {ICON_REFRESH}
                      </button>
                    )}
                    <button type="button" className="ax-dropzone__remove" onClick={() => removeFile(f.id)} aria-label={'Remove ' + f.name}>
                      <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
                {!files.length && (
                  <li style={{ textAlign: 'center', padding: 'var(--ax-space-5)', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-sm)' }}>
                    No files queued yet. Drag &amp; drop or click to browse files.
                  </li>
                )}
              </ul>
            </div>

            {/* Dropzone Footer Info */}
            <div
              className="ax-card__footer"
              style={{
                justifyContent: 'space-between',
                paddingInline: 0,
                marginTop: 'var(--ax-space-3)',
                paddingBlock: 'var(--ax-space-2)',
                borderTop: '1px solid var(--ax-border-subtle)',
                background: 'transparent',
              }}
            >
              <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                {'Total ' + totalSize()}
              </span>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                {doneCount() + ' of ' + files.length + ' complete'}
              </span>
            </div>

            {/* Dynamic Spreadsheet Viewer when spreadsheet data is present */}
            {uploadedData && (
              <div style={{ marginTop: 'var(--ax-space-4)', borderTop: '1px dashed var(--ax-border-subtle)', paddingTop: 'var(--ax-space-4)' }}>
                {/* Table Header & Search Filter Bar */}
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--ax-radius-md)',
                    background: 'rgba(var(--ax-accent-rgb), 0.04)',
                    border: '1px solid var(--ax-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--ax-space-2)',
                    marginBottom: 'var(--ax-space-3)',
                  }}
                >
                  <div className="ax-cluster" style={{ gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                      <span className="ax-badge__dot" /> Active Spreadsheet
                    </span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      {uploadedData.fileName}
                    </span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                      ({uploadedData.fileSize} · Loaded {uploadedData.uploadDate})
                    </span>
                  </div>

                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="search"
                      className="ax-input ax-input--sm"
                      placeholder={`Search ${uploadedData.rows.length} records...`}
                      style={{ minWidth: 170, height: 30 }}
                      value={uploadSearchQuery}
                      onChange={(e) => setUploadSearchQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={exportUploadedDataToCSV}
                      title="Export current spreadsheet table data to CSV"
                    >
                      {ICON_DOWNLOAD}
                      <span className="ax-btn__label">Export Table</span>
                    </button>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      onClick={() => {
                        setUploadedData(null);
                        setUploadSearchQuery('');
                      }}
                      title="Clear table viewer"
                    >
                      {ICON_TRASH}
                      <span className="ax-btn__label">Clear Table</span>
                    </button>
                    <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                      {uploadedData.headers.length} Cols
                    </span>
                    <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">
                      {filteredUploadedRows.length} of {uploadedData.rows.length} Rows
                    </span>
                  </div>
                </div>

                {/* Spreadsheet Table */}
                <div className="ax-table-wrap" style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--ax-border-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                  <table className="ax-table ax-table--hover">
                    <thead className="ax-table__head" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--ax-bg-surface)' }}>
                      <tr>
                        <th className="ax-table__th" style={{ width: 44 }}>#</th>
                        {uploadedData.headers.map((colName, idx) => (
                          <th key={idx} className="ax-table__th" scope="col">
                            {colName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUploadedRows.length === 0 ? (
                        <tr>
                          <td colSpan={uploadedData.headers.length + 1} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ax-text-muted)' }}>
                            No records match search term "{uploadSearchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredUploadedRows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="ax-table__row">
                            <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}>
                              {rowIdx + 1}
                            </td>
                            {uploadedData.headers.map((colName, colIdx) => (
                              <td key={colIdx} className="ax-table__td" style={{ fontSize: 'var(--ax-text-xs)' }}>
                                {row[colName] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 8. Report-Wise Bifurcation (Phase Details, Phase Wise, District Wise, Vendor Wise, Work Order Wise) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Report Wise Bifurcation">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">Report Wise Bifurcation</h2>
              <p className="ax-card__subtitle">Complete breakdown across phases, districts, EPC vendors and work orders</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-btn-group ax-btn-group--segmented" role="tablist" aria-label="Report Views">
                <button
                  type="button"
                  className={`ax-btn ax-btn--sm ${activeTab === 'phaseDetails' ? 'is-selected' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'phaseDetails'}
                  onClick={() => setActiveTab('phaseDetails')}
                >
                  Phase Details
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--sm ${activeTab === 'phaseWise' ? 'is-selected' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'phaseWise'}
                  onClick={() => setActiveTab('phaseWise')}
                >
                  Phase Wise
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--sm ${activeTab === 'districtWise' ? 'is-selected' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'districtWise'}
                  onClick={() => setActiveTab('districtWise')}
                >
                  District Wise
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--sm ${activeTab === 'vendorWise' ? 'is-selected' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'vendorWise'}
                  onClick={() => setActiveTab('vendorWise')}
                >
                  Vendor Wise
                </button>
                <button
                  type="button"
                  className={`ax-btn ax-btn--sm ${activeTab === 'workOrderWise' ? 'is-selected' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'workOrderWise'}
                  onClick={() => setActiveTab('workOrderWise')}
                >
                  Work Order Wise
                </button>
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            {activeTab === 'phaseDetails' ? (
              /* Phase Details Table */
              <table className="ax-table ax-table--hover">
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col">Sr No</th>
                    <th className="ax-table__th" scope="col">Phase</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Material Yet to Dispatch</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Site Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Site Not Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Meter Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Meter Not Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">RMS Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">RMS Not Installed</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Image Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {PHASE_DETAILS_DATA.map((row) => (
                    <tr key={row.srNo} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{row.phase}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.materialYetToDispatch > 0 ? 'var(--ax-viz-amber)' : 'var(--ax-text-muted)' }}>{row.materialYetToDispatch.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{row.siteInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.siteNotInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{row.meterInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.meterNotInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet)' }}>{row.rmsInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.rmsNotInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.imagePending > 0 ? 'var(--ax-viz-pink)' : 'var(--ax-text-muted)' }}>{row.imagePending}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" colSpan={2} style={{ color: 'var(--ax-text-strong)' }}>Total</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>2,058</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>1,568</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>876</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>604</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>1,840</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet)' }}>820</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>1,624</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink)' }}>496</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* Phase / District / Vendor / Work Order Bifurcation Table */
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col">Sr No</th>
                    <th className="ax-table__th" scope="col">{activeTab === 'districtWise' ? 'District' : activeTab === 'vendorWise' ? 'Vendor / EPC' : activeTab === 'workOrderWise' ? 'Work Order' : 'Phase'}</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Sites</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Total Cap (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Mat Disp (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Disp Pend (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Inst Comp (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Inst Pend (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Meter Inst</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Meter Pend</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">RMS Inst</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">RMS Pend</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Pay 70% Done (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Pay 70% Pend (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Pay 10% Done (KW)</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Pay 10% Pend (KW)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBifurcationData.map((row) => (
                    <tr key={row.srNo} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{row.name}</td>
                      <td className="ax-table__td ax-table__td--num ax-num">{row.sites.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{row.totalCapacityKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{row.materialDispatchKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.materialPendingKw > 0 ? 'var(--ax-viz-amber)' : 'var(--ax-text-muted)' }}>{row.materialPendingKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{row.installationCompleteKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.installationPendingKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{row.meterInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.meterPending.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet)' }}>{row.rmsInstalled.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.rmsPending.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>{row.pay70DoneKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.pay70PendingKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink)' }}>{row.pay10DoneKw.toLocaleString()}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{row.pay10PendingKw.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" colSpan={2} style={{ color: 'var(--ax-text-strong)' }}>Total</td>
                    <td className="ax-table__td ax-table__td--num ax-num">2,444</td>
                    <td className="ax-table__td ax-table__td--num ax-num">22,994</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>20,936</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>2,058</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>17,469</td>
                    <td className="ax-table__td ax-table__td--num ax-num">5,525</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>604</td>
                    <td className="ax-table__td ax-table__td--num ax-num">1,840</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet)' }}>820</td>
                    <td className="ax-table__td ax-table__td--num ax-num">1,624</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>20,936</td>
                    <td className="ax-table__td ax-table__td--num ax-num">2,058</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink)' }}>413</td>
                    <td className="ax-table__td ax-table__td--num ax-num">22,581</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 9. Recent Solar Projects Table & Field Operations */}
        {/* Recent Projects Table */}
        <section className="ax-card ax-col--8" role="region" aria-label="Recent Solar Projects">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Site Operations</span>
              <h2 className="ax-card__title">Recent Rooftop Projects</h2>
              <p className="ax-card__subtitle">Project status, capacity &amp; milestone execution in Jammu</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#view-all">View all 2,444 sites</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Project ID &amp; Name</th>
                  <th className="ax-table__th" scope="col">District / Phase</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Capacity</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col">Status</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Target Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="ax-table__row">
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>{p.id}</span>
                        <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{p.name}</div>
                      </div>
                      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 2 }}>{p.consumer} · {p.leadEngineer}</div>
                    </td>
                    <td className="ax-table__td">
                      <div style={{ color: 'var(--ax-text-strong)', fontWeight: 500 }}>{p.district}</div>
                      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{p.phase}</div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{p.capacityKw} KW</td>
                    <td className="ax-table__td">
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap' }}>
                        <div className="ax-progress ax-progress--sm" style={{ minWidth: 80, width: 80 }}>
                          <div className="ax-progress__track">
                            <div className="ax-progress__fill" style={{ width: `${p.progress}%`, background: p.progress === 100 ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }} />
                          </div>
                        </div>
                        <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td className="ax-table__td">
                      <span className={`ax-badge ax-badge--soft ax-badge--${p.statusTone} ax-badge--pill`}>
                        <span className="ax-badge__dot" />
                        {p.status}
                      </span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{p.targetDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Operations Timeline & Field Workforce */}
        <section className="ax-card ax-col--4" role="region" aria-label="Recent Operational Activity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Real-Time Telemetry</span>
              <h2 className="ax-card__title">Operations Activity</h2>
              <p className="ax-card__subtitle">Field milestones &amp; dispatch updates</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-timeline">
              {RECENT_OPERATIONS_ACTIVITY.map((act) => (
                <li key={act.id} className={`ax-timeline__item ax-timeline__item--${act.tone}`}>
                  <span className="ax-timeline__marker">
                    <i style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  </span>
                  <div className="ax-timeline__content">
                    <p className="ax-timeline__title">
                      <b style={{ color: 'var(--ax-text-strong)' }}>{act.title}</b>
                    </p>
                    <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginBlock: '2px 4px' }}>
                      {act.description}
                    </p>
                    <div className="ax-cluster" style={{ justifyContent: 'space-between', fontSize: '11px', color: 'var(--ax-text-subtle)' }}>
                      <span>District: {act.district}</span>
                      <span>{act.date} · {act.time}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Field Workforce mini summary */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  {ICON_USERS} Field Workforce Status
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                  {WORKFORCE_STATS.totalFieldPersonnel} Active
                </span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Site Engineers</span>
                  <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{WORKFORCE_STATS.siteEngineers} on-site</b>
                </div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Active Installation Gangs</span>
                  <b className="ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{WORKFORCE_STATS.activeInstallationGangs} Teams</b>
                </div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>Quality &amp; Safety Supervisors</span>
                  <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{WORKFORCE_STATS.qualitySupervisors}</b>
                </div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)' }}>
                  <span style={{ color: 'var(--ax-text-muted)' }}>JPDCL Liaison Officers</span>
                  <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{WORKFORCE_STATS.jpdclLiaisonOfficers} Officers</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Financial & Subsidy Settlement Overview */}
        <section className="ax-card ax-card--filled ax-col--12" role="region" aria-label="Financial Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">MNRE Subsidy Tranche Tracking</span>
              <h2 className="ax-card__title">Financial &amp; Subsidy Settlement Overview</h2>
              <p className="ax-card__subtitle">Project valuation, discom disbursement status &amp; retention funds</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">All figures in INR Crores</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
              <div className="ax-statgroup__cell">
                <span className="ax-statgroup__icon ax-statgroup__icon--c1">{ICON_CURRENCY}</span>
                <span className="ax-statgroup__text">
                  <span className="ax-statgroup__label">Total Project Value</span>
                  <span className="ax-statgroup__value ax-num">₹{JAMMU_SOLAR_OVERVIEW.totalProjectValueCr} Cr</span>
                </span>
                <span className="ax-statgroup__delta ax-statgroup__delta--up">22.99 MW</span>
              </div>

              <div className="ax-statgroup__cell">
                <span className="ax-statgroup__icon ax-statgroup__icon--c2">{ICON_CURRENCY}</span>
                <span className="ax-statgroup__text">
                  <span className="ax-statgroup__label">70% Subsidy Disbursed</span>
                  <span className="ax-statgroup__value ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>₹{JAMMU_SOLAR_OVERVIEW.subsidy70CrReleased} Cr</span>
                </span>
                <span className="ax-statgroup__delta ax-statgroup__delta--up">2,060 Sites</span>
              </div>

              <div className="ax-statgroup__cell">
                <span className="ax-statgroup__icon ax-statgroup__icon--c4">{ICON_SHIELD}</span>
                <span className="ax-statgroup__text">
                  <span className="ax-statgroup__label">10% Final Retention Settled</span>
                  <span className="ax-statgroup__value ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>₹{JAMMU_SOLAR_OVERVIEW.subsidy10CrReleased} Cr</span>
                </span>
                <span className="ax-statgroup__delta ax-statgroup__delta--up">53 Sites</span>
              </div>

              <div className="ax-statgroup__cell">
                <span className="ax-statgroup__icon ax-statgroup__icon--c3">{ICON_CURRENCY}</span>
                <span className="ax-statgroup__text">
                  <span className="ax-statgroup__label">Pending Discom Claims</span>
                  <span className="ax-statgroup__value ax-num" style={{ color: 'var(--ax-viz-amber)' }}>₹{JAMMU_SOLAR_OVERVIEW.outstandingPaymentCr} Cr</span>
                </span>
                <span className="ax-statgroup__delta" style={{ color: 'var(--ax-text-muted)' }}>Under Audit</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export { JammuDashboard as SolarErp };
export default JammuDashboard;

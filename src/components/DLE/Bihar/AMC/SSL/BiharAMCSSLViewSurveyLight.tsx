import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
// Bihar AMC light API: GET /api/bihar/amc/light/get (dleService.getBiharAmcLight)
import { dleService, filterByCompanyStrict } from '../../../../../services/dleServices';
import { authService } from '../../../../../services/authService';

/* ---------- Types ---------- */
interface ImageItem { label: string; url: string; raw: string; }
interface LightRow {
  id: string;
  district: string;
  block: string;
  panchayat: string;
  sslId: string;
  beneficiary: string;
  contact: string;
  amcDate: string;
  nextAmcDate: string;
  quarter: string;
  lightWorking: boolean | null;
  complaint: string;
  approval: string;
  ward: string;
  pole: string;
  remarks: string;
  approvalRemarks: string;
  lat: number | null;
  lng: number | null;
  images: ImageItem[];
}

/* ---------- Fake data (jab API fail ho ya empty aaye) ---------- */
const FAKE_API_ROWS = [
  { id: 1, district: 'VAISHALI', block: 'Patepur', panchayat: 'Nirpur', ssl_id: '702656', beneficiary_name: 'Rabin Sahni', beneficiary_contact: '10', amc_date: '2026-09-25', next_amc_date: '2026-12-25', quarter_no: 1, light_working: 'Yes', complaint_raised: 0, approval_status: 0 },
];

/* ---------- Helpers ---------- */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const truthy = (v: unknown): boolean | null => {
  if (v === null || v === undefined || v === '') return null;
  return v === true || v === 1 || ['true', '1', 'yes', 'y', 'working', 'raised'].includes(String(v).trim().toLowerCase());
};

// .env: VITE_R2_PUBLIC_URL=https://<r2-public-domain>   (r2:lightamc/x.jpg jaise paths ke liye)
//       VITE_UPLOADS_BASE_URL=https://<api-domain>        (/uploads/light-amc/x.jpg jaise paths ke liye; khali = same origin / Vite proxy)
const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
const UPLOADS_BASE = ((import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '');
const resolveImg = (u: string): string => {
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  if (u.startsWith('r2:')) return R2_BASE ? `${R2_BASE}/${u.slice(3).replace(/^\/+/, '')}` : '';
  if (u.startsWith('/')) return `${UPLOADS_BASE}${u}`;
  return R2_BASE ? `${R2_BASE}/${u}` : `${UPLOADS_BASE}/${u}`;
};

// 2026-09-25 / 2026-09-25T06:12:21.000Z -> 25-09-2026
const fmtDate = (v: unknown): string => {
  const s = str(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

const approvalLabel = (v: unknown): string => {
  const s = str(v).trim().toLowerCase();
  if (s === '' || s === '0' || s === 'pending') return 'Pending';
  if (s === '1' || s === 'approved' || s === 'approve') return 'Approved';
  if (s === '2' || s === 'rejected' || s === 'reject') return 'Rejected';
  return str(v);
};

/* Backend keys alag hon to sirf yahin mapping badalni hai */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (r: any, i: number): LightRow => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromArray: ImageItem[] = Array.isArray(r?.images)
    ? r.images
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((im: any, k: number) =>
          typeof im === 'string'
            ? { label: `Photo ${k + 1}`, url: resolveImg(im), raw: im }
            : { label: str(im?.label) || `Photo ${k + 1}`, url: resolveImg(str(im?.url ?? im?.path)), raw: str(im?.url ?? im?.path) })
    : [];
  const single: ImageItem[] = [
    ['Image 1', r?.image_1 ?? r?.image1 ?? r?.light_image ?? r?.before_image],
    ['Image 2', r?.image_2 ?? r?.image2 ?? r?.after_image ?? r?.image],
  ].map(([label, u]) => ({ label: label as string, url: resolveImg(str(u)), raw: str(u) }));
  const lw = truthy(r?.light_working ?? r?.is_light_working ?? r?.lightWorking);
  const cpTruthy = truthy(r?.complaint_raised ?? r?.complaint ?? r?.complaint_status ?? r?.is_complaint);
  const num = (v: unknown): number | null => {
    const n = Number(v);
    return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n;
  };
  return {
    id: str(r?.id ?? r?._id ?? i),
    district: str(r?.district ?? r?.district_name),
    block: str(r?.block ?? r?.block_name),
    panchayat: str(r?.panchayat ?? r?.panchayat_name),
    sslId: str(r?.ssl_id ?? r?.sslId ?? r?.unique_id),
    beneficiary: str(r?.beneficiary_name ?? r?.beneficiary),
    contact: str(r?.beneficiary_contact ?? r?.contact ?? r?.mobile),
    amcDate: fmtDate(r?.amc_date ?? r?.amcDate),
    nextAmcDate: fmtDate(r?.next_amc_date ?? r?.nextAmcDate),
    quarter: str(r?.quarter_no ?? r?.quarter),
    lightWorking: lw,
    complaint: cpTruthy ? 'Raised' : 'No',
    approval: approvalLabel(r?.approval_status ?? r?.approval),
    ward: str(r?.ward_no),
    pole: str(r?.pole_no),
    remarks: str(r?.remarks),
    approvalRemarks: str(r?.approval_remarks),
    lat: num(r?.latitude ?? r?.lat),
    lng: num(r?.longitude ?? r?.lng),
    images: [...fromArray, ...single].filter((im) => im.raw),
  };
};

const approvalClass = (s: string) =>
  s === 'Approved' ? 'ax-badge--success' : s === 'Rejected' ? 'ax-badge--danger' : s === 'Pending' ? 'ax-badge--warning' : 'ax-badge--neutral';

// dd-mm-yyyy ya ISO dono handle
const parseDMY = (s: string) => {
  if (!s) return 0;
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};

type SortKey = 'district' | 'block' | 'panchayat' | 'sslId' | 'beneficiary' | 'amcDate' | 'nextAmcDate' | 'approval';
const SORTABLE: string[] = ['district', 'block', 'panchayat', 'sslId', 'beneficiary', 'amcDate', 'nextAmcDate', 'approval'];
const DATE_KEYS: string[] = ['amcDate', 'nextAmcDate'];

const yesNo = (v: boolean | null) => (v === null ? '' : v ? 'Yes' : 'No');

const CSV_COLS: { header: string; get: (r: LightRow) => string }[] = [
  { header: 'District', get: (r) => r.district },
  { header: 'Block', get: (r) => r.block },
  { header: 'Panchayat', get: (r) => r.panchayat },
  { header: 'SSL ID', get: (r) => r.sslId },
  { header: 'Beneficiary Name', get: (r) => r.beneficiary },
  { header: 'Contact', get: (r) => r.contact },
  { header: 'AMC Date', get: (r) => r.amcDate },
  { header: 'Next AMC Date', get: (r) => r.nextAmcDate },
  { header: 'Quarter', get: (r) => r.quarter },
  { header: 'Light Working', get: (r) => yesNo(r.lightWorking) },
  { header: 'Complaint', get: (r) => r.complaint },
  { header: 'Approval Status', get: (r) => r.approval },
];

const exportCsv = (rows: LightRow[], filename: string) => {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [CSV_COLS.map((c) => esc(c.header)).join(',')];
  rows.forEach((r) => lines.push(CSV_COLS.map((c) => esc(c.get(r))).join(',')));
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const mono = { fontFamily: 'var(--ax-font-mono)' } as const;

/* ---------- Icons ---------- */
const svg = (children: ReactElement | ReactElement[]) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICON = {
  refresh: svg([<path key="a" d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />, <path key="b" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />]),
  search: svg([<path key="a" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />, <path key="b" d="M21 21l-6 -6" />]),
  chevL: svg(<path d="M15 6l-6 6l6 6" />),
  chevR: svg(<path d="M9 6l6 6l-6 6" />),
  down: svg(<path d="M6 9l6 6l6 -6" />),
  close: svg([<path key="a" d="M18 6l-12 12" />, <path key="b" d="M6 6l12 12" />]),
  eye: svg([<path key="a" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />, <path key="b" d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />]),
  photo: svg([<path key="a" d="M15 8h.01" />, <path key="b" d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />, <path key="c" d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />, <path key="d" d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />]),
  sortDef: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>,
  sortAsc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>,
  sortDesc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>,
};

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'district', label: 'District', visible: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'panchayat', label: 'Panchayat', visible: true },
  { key: 'sslId', label: 'SSL ID', visible: true },
  { key: 'beneficiary', label: 'Beneficiary Name', visible: true },
  { key: 'contact', label: 'Contact', visible: true },
  { key: 'amcDate', label: 'AMC Date', visible: true },
  { key: 'nextAmcDate', label: 'Next AMC Date', visible: true },
  { key: 'quarter', label: 'Quarter', visible: true },
  { key: 'lightWorking', label: 'Light Working', visible: true },
  { key: 'complaint', label: 'Complaint', visible: true },
  { key: 'images', label: 'Images', visible: true },
  { key: 'approval', label: 'Approval Status', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

/* ---------- Image tile (load fail hone par reason + raw path dikhata hai) ---------- */
function ImageTile({ im }: { im: ImageItem }) {
  const [failed, setFailed] = useState(false);
  const ok = !!im.url && !failed;
  return (
    <div>
      {ok ? (
        <a href={im.url} target="_blank" rel="noreferrer">
          <img src={im.url} alt={im.label} loading="lazy" onError={() => { console.warn('[AMC light] image load failed:', im.url); setFailed(true); }}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }} />
        </a>
      ) : (
        <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--ax-space-3)', background: 'var(--ax-surface-subtle)', border: '1px dashed var(--ax-border)', borderRadius: 'var(--ax-radius-md)', color: 'var(--ax-danger-500)', fontSize: 'var(--ax-text-xs)' }}>
          {im.url ? 'Image load nahi hui' : 'Image URL set nahi hai (.env: VITE_R2_PUBLIC_URL)'}
        </div>
      )}
      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginTop: 5 }}>{im.label}</div>
      {!ok && <div style={{ ...mono, fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)', overflowWrap: 'anywhere' }}>{im.raw}</div>}
    </div>
  );
}

/* ---------- Detail modal ---------- */
function LightModal({ open, onClose, row }: { open: boolean; onClose: () => void; row: LightRow | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  const label2: [string, string][] = [
    ['SSL ID', row.sslId], ['Beneficiary', row.beneficiary], ['Contact', row.contact],
    ['District', row.district], ['Block', row.block], ['Panchayat', row.panchayat],
    ['AMC Date', row.amcDate], ['Next AMC Date', row.nextAmcDate], ['Quarter', row.quarter],
    ['Ward No.', row.ward], ['Pole No.', row.pole],
    ['Light Working', yesNo(row.lightWorking)], ['Complaint', row.complaint], ['Approval Status', row.approval],
    ['Remarks', row.remarks], ['Approval Remarks', row.approvalRemarks],
  ];
  const cap = { fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' } as const;

  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby="amc-detail-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={ref} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="amc-detail-title">AMC light · {row.sslId}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{ICON.close}</button>
        </div>
        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--ax-space-3)' }}>
            {label2.map(([k, v]) => (
              <div key={k} style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                <div style={cap}>{k}</div>
                <div style={{ marginTop: 4, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)', fontWeight: 500, overflowWrap: 'anywhere' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ ...cap, marginBottom: 8 }}>Location</div>
            {row.lat !== null && row.lng !== null ? (
              <a className="ax-btn ax-btn--secondary ax-btn--sm" href={`https://www.google.com/maps?q=${row.lat},${row.lng}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
            ) : (
              <span style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Location coordinates unavailable</span>
            )}
          </div>
          <div>
            <div style={{ ...cap, marginBottom: 8 }}>Images</div>
            {row.images.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 'var(--ax-space-3)' }}>
                {row.images.map((im) => <ImageTile key={im.raw} im={im} />)}
              </div>
            ) : (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>No images available for this record.</div>
            )}
          </div>
        </div>
        <div className="ax-modal__footer">
          <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Row action dropdown ---------- */
function RowAction({ onView }: { onView: () => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <div ref={wrap} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ax-btn__label">Action</span>
        <span className="ax-btn__icon">{ICON.down}</span>
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 4px)', zIndex: 20, minWidth: 160, background: 'var(--ax-surface-solid)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', padding: 'var(--ax-space-1)' }}>
          <button type="button" role="menuitem" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { setOpen(false); onView(); }}>
            <span className="ax-btn__icon">{ICON.eye}</span>
            <span className="ax-btn__label">View details</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export function BiharAMCSSLViewSurveyLight() {
  const [rows, setRows] = useState<LightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [demoReason, setDemoReason] = useState('');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('amcDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [preview, setPreview] = useState<LightRow | null>(null);
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const visibleCols = columns.filter((c) => c.visible);
  const toggleColumn = (key: string) =>
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const useDemo = (reason: string) => {
      setRows(FAKE_API_ROWS.map(normalize));
      setUsingDemo(true);
      setDemoReason(reason);
    };
  try {
  const json: any = await dleService.getBiharAmcLight(undefined, signal);
  let raw: any = Array.isArray(json) ? json : json?.data ?? json?.rows ?? json?.records ?? json;
  if (raw?.data && Array.isArray(raw.data)) raw = raw.data; // paginated response
  const list: any[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];

  console.info('[Bihar AMC light] rows:', list.length, 'first record:', list[0]);
  console.info('[Bihar AMC light] my company_id:', authService.getCompanyId());

  if (!list.length) {
    // API se sach mein kuch nahi aaya → demo
    useDemo('API se koi record nahi aaya');
  } else {
    // 1) company_id same ho (null wale hide)
    // 2) approval_status approved ho
    const allowed = filterByCompanyStrict(list).filter(
      (r: any) => approvalLabel(r?.approval_status ?? r?.approval) === 'Approved'
    );

    console.info('[Bihar AMC light] after filter:', allowed.length);

    setRows(allowed.map(normalize));
    setUsingDemo(false);
  }
} catch (e) {
      if ((e as Error).name === 'AbortError') return;
      useDemo((e as Error).message || 'API se data load nahi hua');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? rows.filter((r) =>
          [r.district, r.block, r.panchayat, r.sslId, r.beneficiary, r.contact, r.amcDate, r.nextAmcDate, r.approval]
            .some((v) => v.toLowerCase().includes(term)))
      : rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      DATE_KEYS.includes(sortKey)
        ? (parseDMY(a[sortKey]) - parseDMY(b[sortKey])) * dir
        : a[sortKey].localeCompare(b[sortKey], undefined, { numeric: true }) * dir);
  }, [rows, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);
  const rangeStart = filtered.length ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * perPage, filtered.length);

  const pageList: (number | '…')[] = useMemo(() => {
    const out: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) out.push(i); return out; }
    out.push(1);
    if (curPage > 3) out.push('…');
    for (let i = Math.max(2, curPage - 1); i <= Math.min(totalPages - 1, curPage + 1); i++) out.push(i);
    if (curPage < totalPages - 2) out.push('…');
    out.push(totalPages);
    return out;
  }, [totalPages, curPage]);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };
  const ariaSort = (k: SortKey): 'ascending' | 'descending' | 'none' =>
    sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
  const glyph = (k: SortKey) => (sortKey !== k ? ICON.sortDef : sortDir === 'asc' ? ICON.sortAsc : ICON.sortDesc);

  const pendingCount = useMemo(() => rows.filter((r) => r.approval === 'Pending').length, [rows]);

  const cellText = (r: LightRow, key: string): string => {
    switch (key) {
      case 'lightWorking': return yesNo(r.lightWorking);
      case 'images': return String(r.images.length);
      default: return String((r as unknown as Record<string, unknown>)[key] ?? '');
    }
  };
  const handleCopy = async () => {
    const cols = visibleCols.filter((c) => c.key !== 'action' && c.key !== 'images');
    await navigator.clipboard.writeText(filtered.map((r) => cols.map((c) => cellText(r, c.key)).join('\t')).join('\n'));
  };
  const handleExport = () => exportCsv(filtered, 'bihar-amc-light');

  const renderCell = (key: string, r: LightRow) => {
    switch (key) {
      case 'sslId':
        return <td key={key} className="ax-table__td ax-num" style={{ ...mono, color: 'var(--ax-accent)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.sslId || '—'}</td>;
      case 'beneficiary':
        return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.beneficiary || '—'}</td>;
      case 'contact':
        return <td key={key} className="ax-table__td ax-num" style={mono}>{r.contact || '—'}</td>;
      case 'amcDate':
      case 'nextAmcDate':
        return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{(r as unknown as Record<string, string>)[key] || '—'}</td>;
      case 'quarter':
        return <td key={key} className="ax-table__td ax-num">{r.quarter || '—'}</td>;
      case 'lightWorking':
        return (
          <td key={key} className="ax-table__td">
            {r.lightWorking === null ? '—' : (
              <span className={`ax-badge ax-badge--soft ax-badge--pill ${r.lightWorking ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                <span className="ax-badge__dot" />{yesNo(r.lightWorking)}
              </span>
            )}
          </td>
        );
      case 'complaint':
        return (
          <td key={key} className="ax-table__td">
            <span className={`ax-badge ax-badge--soft ax-badge--pill ${r.complaint === 'Raised' ? 'ax-badge--danger' : 'ax-badge--success'}`}>
              <span className="ax-badge__dot" />{r.complaint}
            </span>
          </td>
        );
      case 'images':
        return (
          <td key={key} className="ax-table__td">
            {r.images.length ? (
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-1)' }}>
                {r.images.slice(0, 2).map((im, k) => (
                  <button key={im.raw + k} type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" style={{ color: 'var(--ax-accent)' }} onClick={() => setPreview(r)} aria-label={`View ${im.label}`}>
                    <span className="ax-btn__icon">{ICON.photo}</span>
                  </button>
                ))}
              </span>
            ) : <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>}
          </td>
        );
      case 'approval':
        return (
          <td key={key} className="ax-table__td">
            <span className={`ax-badge ax-badge--soft ax-badge--pill ${approvalClass(r.approval)}`}>
              <span className="ax-badge__dot" />{r.approval || '—'}
            </span>
          </td>
        );
      case 'action':
        return <td key={key} className="ax-table__td" style={{ textAlign: 'center' }}><RowAction onView={() => setPreview(r)} /></td>;
      default:
        return <td key={key} className="ax-table__td">{cellText(r, key) || '—'}</td>;
    }
  };

  return (
    <>
      <PageHead
        title="Bihar AMC Light"
        subtitle="Quarterly AMC visits with light status, complaints, photos and approval."
        actions={
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={() => load()} aria-label="Refresh data" aria-busy={loading}>
            <span className="ax-btn__icon">{ICON.refresh}</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        {usingDemo && !loading && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--warning" role="status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <span>Demo data dikh raha hai ({demoReason}).</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry API</button>
            </div>
          </div>
        )}

        <section className="ax-card ax-col--12" role="region" aria-label="AMC light records">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">AMC Light</h2>
              <p className="ax-card__subtitle ax-num" style={mono}>{filtered.length} results · {pendingCount}/{rows.length} pending approval</p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div style={{ position: 'relative', width: 250 }}>
                <span style={{ position: 'absolute', insetInlineStart: 10, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'var(--ax-text-subtle)', display: 'inline-flex' }}>{ICON.search}</span>
                <input type="search" className="ax-input ax-input--sm" placeholder="Search records…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ paddingInlineStart: 34 }} aria-label="Search records" />
              </div>
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExport}
                onExportExcel={handleExport}
                onExportPDF={handleExport}
                columns={columns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1700 }}>
              <caption className="ax-visually-hidden">AMC light records, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) =>
                    SORTABLE.includes(c.key) ? (
                      <th key={c.key} className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort(c.key as SortKey)} onClick={() => sortBy(c.key as SortKey)}>
                        {c.label} {glyph(c.key as SortKey)}
                      </th>
                    ) : (
                      <th key={c.key} className="ax-table__th" scope="col" style={c.key === 'action' ? { textAlign: 'center' } : undefined}>{c.label}</th>
                    ))}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading
                  ? [0, 1, 2, 3, 4, 5].map((n) => (
                      <tr key={n} className="ax-table__row">
                        <td className="ax-table__td" colSpan={visibleCols.length}><div className="ax-skeleton ax-skeleton--line" style={{ width: '100%' }} /></td>
                      </tr>
                    ))
                  : paged.map((r, i) => (
                      <tr key={`${r.id}-${start + i}`} className="ax-table__row">
                        {visibleCols.map((c) => renderCell(c.key, r))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No records found</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>No rows match your search. Try a different term.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setPage(1); }}>Clear search</button>
            </div>
          )}

          {!loading && !!filtered.length && (
            <div className="ax-card__footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-pagination__summary ax-num" style={{ ...mono, fontSize: 'var(--ax-text-xs)' }}>Showing {rangeStart}–{rangeEnd} of {filtered.length}</span>
                <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Rows
                  <select className="ax-select ax-select--sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page" style={{ minWidth: 72 }}>
                    {[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(Math.max(1, curPage - 1))} aria-label="Previous page">{ICON.chevL}</button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p, i) => (
                    <li key={`${p}-${i}`}>
                      {p === '…' ? <span className="ax-pagination__ellipsis">…</span> : (
                        <button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => setPage(p)}>{p}</button>
                      )}
                    </li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(Math.min(totalPages, curPage + 1))} aria-label="Next page">{ICON.chevR}</button>
              </nav>
            </div>
          )}
        </section>
      </div>

      <LightModal open={!!preview} row={preview} onClose={() => setPreview(null)} />
    </>
  );
}

export default BiharAMCSSLViewSurveyLight;
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import SearchInput from '../../../../../common/search/SearchInput';
import { Pagination } from '../../../../../common/pagination/Pagination';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { dleService, filterByCompanyStrict } from '../../../../../services/dleServices';
import { exportDataToExcel, printTableData } from '../../../../../common/export/exportUtils';

/* ---------- Types ---------- */
interface Visit { status: string; at: string; }
interface ImageItem { label: string; url: string; }

interface UlaRow {
  id: string;
  companyId: string;
  caNo: string;
  caName: string;
  beneficiary: string;
  contact: string;
  state: string;
  district: string;
  block: string;
  panchayat: string;
  village: string;
  surveyDate: string;
  panel1: string;
  panel2: string;
  inverter: string;
  surveyor: string;
  surveyor2: string;
  userId: string;
  userName: string;
  userId2: string;
  userName2: string;
  visit1: Visit;
  visit2: Visit;
  visit1Note: string;
  visit2Note: string;
  secondVisitAt: string;
  modification: string;
  remarks: string;
  lat: number | null;
  lng: number | null;
  lat2: number | null;
  lng2: number | null;
  firstVisitComplete: boolean;
  secondVisitComplete: boolean;
  images: ImageItem[];
}

/* ---------- Fake data (jab API fail ho ya empty aaye) ---------- */
const FAKE_API_ROWS = [
  { id: 1, ca_no: '122205346656', ca_name: 'Manoj mahto', beneficiary_name: 'Manoj mahto', contact: '9162805002', state: 'Bihar', district: 'SITAMARHI', block: 'Charaut', panchayat: 'YADUPATTI', village: 'Damodar pati simri', survey_date: '30-09-2026', panel_1_no: 'SGMJ550072662877', panel_2_no: 'SGMJ550072663622', inverter_no: '114191234388', surveyor: 'NIRAJ KUMAR', first_visit: 'Completed', second_visit: 'Completed', visit1_at: '30-09-2026 12:41 PM', visit2_at: '30-09-2026 12:41 PM', images: [] },
  { id: 2, ca_no: '122205346692', ca_name: 'Shankar Mahto', beneficiary_name: 'Shankar Mahto', contact: '9801295143', state: 'Bihar', district: 'SITAMARHI', block: 'Charaut', panchayat: 'YADUPATTI', village: 'Yadupatti simri', survey_date: '30-09-2026', panel_1_no: 'SGMJ550072662867', panel_2_no: 'SGMJ550072662967', inverter_no: '114191558507', surveyor: 'Vikash kumar', first_visit: 'Completed', second_visit: 'Completed', visit1_at: '30-09-2026 12:40 PM', visit2_at: '30-09-2026 12:40 PM', images: [] },
  { id: 3, ca_no: '122205346618', ca_name: 'Bhuli devi', beneficiary_name: 'Bhuli devi', contact: '8521447239', state: 'Bihar', district: 'SITAMARHI', block: 'Charaut', panchayat: 'YADUPATTI', village: 'Damodar pati simri', survey_date: '30-09-2026', panel_1_no: 'SGMJ550072663236', panel_2_no: 'SGMJ550072662780', inverter_no: '114190161279', surveyor: 'NIRAJ KUMAR', first_visit: 'Completed', second_visit: 'Completed', visit1_at: '30-09-2026 12:35 PM', visit2_at: '30-09-2026 12:35 PM', images: [] },
  { id: 4, ca_no: '12220534666', ca_name: 'Nagina devi', beneficiary_name: 'Nagina devi', contact: '9708326915', state: 'Bihar', district: 'SITAMARHI', block: 'Charaut', panchayat: 'YADUPATTI', village: 'Yadupatti simri', survey_date: '30-09-2026', panel_1_no: 'SGMJ550072663288', panel_2_no: 'SGMJ550072662818', inverter_no: '114190164719', surveyor: 'Vikash kumar', first_visit: 'Completed', second_visit: 'Pending', visit1_at: '30-09-2026 12:33 PM', visit2_at: '', images: [] },
];

/* ---------- Helpers ---------- */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

const numOrNull = (v: unknown): number | null => {
  const n = Number(v);
  return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n;
};

const boolValue = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  return ['true', '1', 'yes', 'completed', 'complete'].includes(str(v).trim().toLowerCase());
};

const parseRemarks = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  try {
    const parsed = JSON.parse(str(value));
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

// Flag (true/1/yes/completed) mile to usse status banao, warna text field use karo
const visitStatus = (flag: unknown, text: unknown): string => {
  if (flag !== undefined && flag !== null && flag !== '') {
    const ok = flag === true || flag === 1 || ['true', '1', 'yes', 'completed', 'complete'].includes(String(flag).trim().toLowerCase());
    return ok ? 'Completed' : 'Pending';
  }
  return str(text) || 'Pending';
};

// Relative image path aaye to R2 public URL lagao (.env: VITE_R2_PUBLIC_URL=https://...)
const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
const resolveImg = (u: string): string => {
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  return R2_BASE ? `${R2_BASE}/${u.replace(/^\/+/, '')}` : u;
};

/* Backend keys alag hon to sirf yahin mapping badalni hai */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (r: any, i: number): UlaRow => {
  const remarks = parseRemarks(r?.remarks);

  const imageSources: Array<{ label: string; value: unknown }> = [
    { label: 'Panel 1', value: r?.panel_one_img_url ?? r?.panel_one_img },
    { label: 'Panel 2', value: r?.panel_two_img_url ?? r?.panel_two_img },
    { label: 'Inverter', value: r?.inverter_img_url ?? r?.inverter_img },
    { label: 'Smart Meter', value: r?.smart_meter_img_url ?? r?.smart_meter_img },
    { label: 'ACDB', value: r?.acdb_img_url ?? r?.acdb_img },
    { label: 'System', value: r?.system_img_url ?? r?.system_img },
    { label: 'Solar Meter', value: r?.solar_meter_img_url ?? r?.solar_meter_img },
    { label: 'Solar Meter 2', value: r?.solar_meter_img2_url ?? r?.solar_meter_img2 },
    { label: 'System 2', value: r?.system_img2_url ?? r?.system_img2 },
    { label: 'Structure', value: r?.structure_img_url ?? r?.structure_img ?? remarks?.structure_img },
  ];

  if (Array.isArray(r?.images)) {
    r.images.forEach((im: any, k: number) => {
      imageSources.push({
        label: str(im?.label) || `Photo ${k + 1}`,
        value: typeof im === 'string' ? im : im?.url ?? im?.path,
      });
    });
  }

  const seen = new Set<string>();
  const images: ImageItem[] = imageSources
    .map(({ label, value }) => ({ label, url: resolveImg(str(value)) }))
    .filter((im) => {
      if (!im.url || seen.has(im.url)) return false;
      seen.add(im.url);
      return true;
    });

  const firstVisitComplete = boolValue(r?.first_visit_complete);
  const secondVisitComplete = boolValue(r?.second_visit_complete);

  return {
    id: str(r?.id ?? r?._id ?? i),
    companyId: str(r?.company_id ?? r?.companyId),
    caNo: str(r?.ca_no ?? r?.caNo),
    caName: str(r?.ca_name ?? r?.caName),
    beneficiary: str(r?.beneficiary_name ?? r?.beneficiaryName),
    contact: str(r?.beneficiary_contact ?? r?.contact ?? r?.mobile),
    state: str(r?.state),
    district: str(r?.district),
    block: str(r?.block),
    panchayat: str(r?.panchayat),
    village: str(r?.village),
    surveyDate: str(r?.survey_date ?? r?.surveyDate),
    panel1: str(r?.panel_one_no ?? r?.panel1),
    panel2: str(r?.panel_two_no ?? r?.panel2),
    inverter: str(r?.inverter_no ?? r?.inverter),
    surveyor: str(r?.first_visit_surveyor ?? r?.surveyor_name ?? r?.user_name ?? r?.surveyor),
    surveyor2: str(r?.second_visit_surveyor ?? r?.user_name2),
    userId: str(r?.user_id),
    userName: str(r?.user_name),
    userId2: str(r?.user_id2),
    userName2: str(r?.user_name2),
    visit1: {
      status: visitStatus(r?.first_visit_complete, r?.first_visit ?? r?.visit1_status),
      at: str(r?.visit1_at ?? r?.survey_date),
    },
    visit2: {
      status: visitStatus(r?.second_visit_complete, r?.second_visit ?? r?.visit2_status),
      at: str(r?.visit2_at ?? r?.second_visit_at),
    },
    visit1Note: str(r?.visit1_note ?? remarks?.visit1_note),
    visit2Note: str(r?.visit2_note ?? remarks?.visit2_note),
    secondVisitAt: str(r?.second_visit_at),
    modification: str(r?.modification),
    remarks: typeof r?.remarks === 'string' ? r.remarks : JSON.stringify(r?.remarks ?? ''),
    lat: numOrNull(r?.latitude ?? r?.lat),
    lng: numOrNull(r?.longitude ?? r?.lng),
    lat2: numOrNull(r?.latitude2),
    lng2: numOrNull(r?.longitude2),
    firstVisitComplete,
    secondVisitComplete,
    images,
  };
};

const visitClass = (s: string) =>
  s.toLowerCase() === 'completed' ? 'ax-badge--success' : s.toLowerCase() === 'pending' ? 'ax-badge--warning' : 'ax-badge--neutral';

// dd-mm-yyyy ya ISO (yyyy-mm-dd...) dono handle
const parseDMY = (s: string) => {
  if (!s) return 0;
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};

type SortKey = 'caNo' | 'caName' | 'district' | 'block' | 'surveyDate' | 'surveyor';

const CSV_COLS: { header: string; get: (r: UlaRow) => string }[] = [
  { header: 'ID', get: (r) => r.id },
  { header: 'Company ID', get: (r) => r.companyId },
  { header: 'CA No.', get: (r) => r.caNo },
  { header: 'CA Name', get: (r) => r.caName },
  { header: 'Beneficiary Name', get: (r) => r.beneficiary },
  { header: 'Beneficiary Contact', get: (r) => r.contact },
  { header: 'State', get: (r) => r.state },
  { header: 'District', get: (r) => r.district },
  { header: 'Block', get: (r) => r.block },
  { header: 'Panchayat', get: (r) => r.panchayat },
  { header: 'Village', get: (r) => r.village },
  { header: 'Survey Date', get: (r) => r.surveyDate },
  { header: 'Panel 1 No.', get: (r) => r.panel1 },
  { header: 'Panel 2 No.', get: (r) => r.panel2 },
  { header: 'Inverter No.', get: (r) => r.inverter },
  { header: '1st Surveyor', get: (r) => r.surveyor },
  { header: '2nd Surveyor', get: (r) => r.surveyor2 },
  { header: 'User ID', get: (r) => r.userId },
  { header: 'User Name', get: (r) => r.userName },
  { header: '1st Visit', get: (r) => r.visit1.status },
  { header: '2nd Visit', get: (r) => r.visit2.status },
  { header: '1st Visit Note', get: (r) => r.visit1Note },
  { header: '2nd Visit Note', get: (r) => r.visit2Note },
  { header: 'Second Visit At', get: (r) => r.secondVisitAt },
  { header: 'Modification', get: (r) => r.modification },
  { header: 'Latitude', get: (r) => str(r.lat) },
  { header: 'Longitude', get: (r) => str(r.lng) },
  { header: 'Latitude 2', get: (r) => str(r.lat2) },
  { header: 'Longitude 2', get: (r) => str(r.lng2) },
  { header: 'Image Count', get: (r) => String(r.images.length) },
  { header: 'Remarks', get: (r) => r.remarks },
];

const exportCsv = (rows: UlaRow[], filename: string) => {
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

const SortIcon = ({ dir }: { dir: 'asc' | 'desc' | null }) => (
  <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={dir ? undefined : { opacity: 0.4 }}>
    {dir === 'asc' ? <path d="M6 15l6 -6l6 6" /> : dir === 'desc' ? <path d="M6 9l6 6l6 -6" /> : (<><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></>)}
  </svg>
);

const mono = { fontFamily: 'var(--ax-font-mono)' } as const;


/* ---------- Assam-style table template helpers ---------- */
const svg = (children: ReactElement | ReactElement[]) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICON = {
  refresh: svg([
    <path key="a" d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />,
    <path key="b" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />,
  ]),
  search: svg([
    <path key="a" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />,
    <path key="b" d="M21 21l-6 -6" />,
  ]),
  chevL: svg(<path d="M15 6l-6 6l6 6" />),
  chevR: svg(<path d="M9 6l6 6l-6 6" />),
  down: svg(<path d="M6 9l6 6l6 -6" />),
  close: svg([
    <path key="a" d="M18 6l-12 12" />,
    <path key="b" d="M6 6l12 12" />,
  ]),
  eye: svg([
    <path key="a" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />,
    <path key="b" d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />,
  ]),
  download: svg([
    <path key="a" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />,
    <path key="b" d="M7 11l5 5l5 -5" />,
    <path key="c" d="M12 4l0 12" />,
  ]),
  sortDef: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ opacity: 0.4 }}>
    <path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" />
  </svg>,
  sortAsc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 15l6 -6l6 6" />
  </svg>,
  sortDesc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6l6 -6" />
  </svg>,
};

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', visible: true },
  { key: 'caNo', label: 'CA No.', visible: true },
  { key: 'caName', label: 'CA Name', visible: true },
  { key: 'beneficiary', label: 'Beneficiary', visible: true },
  { key: 'contact', label: 'Contact', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'district', label: 'District', visible: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'panchayat', label: 'Panchayat', visible: true },
  { key: 'village', label: 'Village', visible: true },
  { key: 'surveyDate', label: 'Survey Date', visible: true },
  { key: 'panel1', label: 'Panel 1 No.', visible: true },
  { key: 'panel2', label: 'Panel 2 No.', visible: true },
  { key: 'inverter', label: 'Inverter No.', visible: true },
  { key: 'surveyor', label: 'Surveyor', visible: true },
  { key: 'visit1', label: '1st Visit', visible: true },
  { key: 'visit2', label: '2nd Visit', visible: true },
  { key: 'location', label: 'Location', visible: true },
  { key: 'images', label: 'Images', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

type TableSortKey = SortKey;
const SORTABLE: string[] = ['caNo', 'caName', 'district', 'block', 'surveyDate', 'surveyor'];

function UlaModal({
  open,
  onClose,
  row,
}: {
  open: boolean;
  onClose: () => void;
  row: UlaRow | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby="ula-detail-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={ref} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="ula-detail-title">
            Installation details · {row.caNo}
          </h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {ICON.close}
          </button>
        </div>

        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: 'var(--ax-space-3)'
          }}>
            {([
              ['ID', row.id],
              ['Company ID', row.companyId],
              ['CA No.', row.caNo],
              ['CA Name', row.caName],
              ['Beneficiary', row.beneficiary],
              ['Beneficiary Contact', row.contact],
              ['State', row.state],
              ['District', row.district],
              ['Block', row.block],
              ['Panchayat', row.panchayat],
              ['Village', row.village],
              ['Survey Date', row.surveyDate],
              ['1st Surveyor', row.surveyor],
              ['2nd Surveyor', row.surveyor2],
              ['User ID', row.userId],
              ['User Name', row.userName],
              ['User ID 2', row.userId2],
              ['User Name 2', row.userName2],
              ['Panel 1 No.', row.panel1],
              ['Panel 2 No.', row.panel2],
              ['Inverter No.', row.inverter],
              ['Latitude', str(row.lat)],
              ['Longitude', str(row.lng)],
              ['Latitude 2', str(row.lat2)],
              ['Longitude 2', str(row.lng2)],
              ['Second Visit At', row.secondVisitAt],
              ['Modification', row.modification],
              ['1st Visit Complete', row.firstVisitComplete ? 'Yes' : 'No'],
              ['2nd Visit Complete', row.secondVisitComplete ? 'Yes' : 'No'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{
                padding: 'var(--ax-space-3) var(--ax-space-4)',
                background: 'var(--ax-surface-subtle)',
                border: '1px solid var(--ax-border)',
                borderRadius: 'var(--ax-radius-md)'
              }}>
                <div style={{
                  fontSize: 'var(--ax-text-2xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  color: 'var(--ax-text-subtle)'
                }}>{k}</div>
                <div style={{
                  marginTop: 4,
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-sm)',
                  fontWeight: 500,
                  overflowWrap: 'anywhere'
                }}>{v || '—'}</div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 'var(--ax-space-3)'
          }}>
            {[['1st Visit', row.visit1], ['2nd Visit', row.visit2]].map(([label, visit]) => {
              const v = visit as Visit;
              return (
                <div key={label as string} style={{
                  padding: 'var(--ax-space-4)',
                  border: '1px solid var(--ax-border)',
                  borderRadius: 'var(--ax-radius-md)'
                }}>
                  <div style={{
                    fontSize: 'var(--ax-text-2xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    color: 'var(--ax-text-subtle)',
                    marginBottom: 8
                  }}>{label as string}</div>
                  <span className={`ax-badge ax-badge--soft ax-badge--pill ${visitClass(v.status)}`}>
                    <span className="ax-badge__dot" />
                    {v.status}
                  </span>
                  {v.at && (
                    <div className="ax-num" style={{
                      fontSize: 'var(--ax-text-xs)',
                      color: 'var(--ax-text-subtle)',
                      marginTop: 8
                    }}>{v.at}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 'var(--ax-space-3)'
          }}>
            {[
              ['1st Visit Note', row.visit1Note],
              ['2nd Visit Note', row.visit2Note],
              ['Remarks', row.remarks],
            ].map(([label, value]) => (
              <div key={label} style={{
                padding: 'var(--ax-space-3) var(--ax-space-4)',
                background: 'var(--ax-surface-subtle)',
                border: '1px solid var(--ax-border)',
                borderRadius: 'var(--ax-radius-md)'
              }}>
                <div style={{
                  fontSize: 'var(--ax-text-2xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  color: 'var(--ax-text-subtle)',
                  marginBottom: 6
                }}>{label}</div>
                <div style={{
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-sm)',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere'
                }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{
              fontSize: 'var(--ax-text-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--ax-text-subtle)',
              marginBottom: 8
            }}>Location</div>
            {row.lat !== null && row.lng !== null ? (
              <a
                className="ax-btn ax-btn--secondary ax-btn--sm"
                href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            ) : (
              <span style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
                Location coordinates unavailable
              </span>
            )}
          </div>

          <div>
            <div style={{
              fontSize: 'var(--ax-text-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--ax-text-subtle)',
              marginBottom: 8
            }}>Images</div>

            {row.images.length ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
                gap: 'var(--ax-space-3)'
              }}>
                {row.images.map((im) => (
                  <a key={im.url} href={im.url} target="_blank" rel="noreferrer">
                    <img
                      src={im.url}
                      alt={im.label}
                      loading="lazy"
                      style={{
                        width: '100%',
                        aspectRatio: '4/3',
                        objectFit: 'cover',
                        borderRadius: 'var(--ax-radius-md)',
                        border: '1px solid var(--ax-border)'
                      }}
                    />
                    <div style={{
                      fontSize: 'var(--ax-text-xs)',
                      color: 'var(--ax-text-muted)',
                      marginTop: 5
                    }}>{im.label}</div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
                No images available for this record.
              </div>
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

/* ---------- Page ---------- */

export function BiharULAInstallationViewData({ id: idProp }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const id = idProp ?? params.id ?? '';

  const [rows, setRows] = useState<UlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [demoReason, setDemoReason] = useState('');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('surveyDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<UlaRow | null>(null);
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [perPage, setPerPage] = useState(100);
  const visibleCols = columns.filter((c) => c.visible);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadImages = async (r: UlaRow) => {
    if (downloadingId) return;
    setDownloadingId(r.id);
    try {
      await dleService.downloadUlaImagesZip(r.id);
    } catch (e) {
      console.error((e as Error).message || 'Failed to download images');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleColumn = (key: string) =>
    setColumns((prev) => prev.map((c) => c.key === key ? { ...c, visible: !c.visible } : c));

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const useDemo = (reason: string) => {
      setRows(FAKE_API_ROWS.map(normalize));
      setUsingDemo(true);
      setDemoReason(reason);
    };
    try {
      const json: any = id
        ? await dleService.getBiharUlaDetail(id, signal)
        : await dleService.getBiharUlaList(signal);

      let raw: any = Array.isArray(json) ? json : json?.data ?? json?.rows ?? json?.records ?? json;
      if (raw?.data && Array.isArray(raw.data)) raw = raw.data;
      const list: any[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
      const mine = filterByCompanyStrict(list);

      console.info('[ULA view] rows:', list.length, '→ my company:', mine.length, 'first record:', list[0]);

      if (!list.length) {
        useDemo('No records returned from API');
      } else {
        setRows(mine.map(normalize));
        setUsingDemo(false);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      useDemo((e as Error).message || 'Failed to load data from API');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const dashboardDistrict = searchParams.get('district') || 'All';
  const dashboardSurveyor = searchParams.get('surveyor') || 'All';
  const dashboardVisitStatus = searchParams.get('visitStatus') || 'All';
  const dashboardToday = searchParams.get('today') === '1';
  const dashboardActive = searchParams.get('active') === '1';
  const dashboardDate = searchParams.get('date') || '';

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = new Date();

    const list = rows.filter((r) => {
      const districtMatch = dashboardDistrict === 'All' || r.district.toLowerCase() === dashboardDistrict.toLowerCase();
      const surveyorMatch =
        dashboardSurveyor === 'All' ||
        r.surveyor.toLowerCase() === dashboardSurveyor.toLowerCase() ||
        r.surveyor2.toLowerCase() === dashboardSurveyor.toLowerCase();

      const firstDone = r.visit1.status.toLowerCase() === 'completed';
      const secondDone = r.visit2.status.toLowerCase() === 'completed';

      const statusMatch =
        dashboardVisitStatus === 'All' ||
        (dashboardVisitStatus === 'firstCompleted' && firstDone) ||
        (dashboardVisitStatus === 'secondCompleted' && secondDone) ||
        (dashboardVisitStatus === 'secondPending' && firstDone && !secondDone) ||
        (dashboardVisitStatus === 'firstPending' && !firstDone);

      const todayMatch =
        !dashboardToday ||
        [r.visit1.at, r.visit2.at, r.surveyDate].some((d) => {
          if (!d) return false;
          const t = parseDMY(d);
          return t ? new Date(t).toDateString() === now.toDateString() : String(d).includes(`${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`);
        });

      const activeMatch =
        !dashboardActive ||
        (dashboardToday && (firstDone || secondDone));

      const dateMatch =
        !dashboardDate ||
        [r.visit1.at, r.visit2.at, r.surveyDate].some((d) => {
          if (!d) return false;
          const t = parseDMY(d);
          if (!t) return String(d).includes(dashboardDate);
          const dt = new Date(t);
          const label = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
          return label === dashboardDate;
        });

      const textMatch =
        !term ||
        [r.caNo, r.caName, r.beneficiary, r.contact, r.district, r.block, r.panchayat, r.village, r.panel1, r.panel2, r.inverter, r.surveyor]
          .some((v) => v.toLowerCase().includes(term));

      return districtMatch && surveyorMatch && statusMatch && todayMatch && activeMatch && dateMatch && textMatch;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortKey === 'surveyDate'
        ? (parseDMY(a.surveyDate) - parseDMY(b.surveyDate)) * dir
        : a[sortKey].localeCompare(b[sortKey]) * dir);
  }, [rows, q, sortKey, sortDir, dashboardDistrict, dashboardSurveyor, dashboardVisitStatus, dashboardToday, dashboardActive, dashboardDate]);

  useEffect(() => {
    setPage(1);
  }, [dashboardDistrict, dashboardSurveyor, dashboardVisitStatus, dashboardToday, dashboardActive, dashboardDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };

  const fullyVisited = useMemo(
    () => rows.filter((r) => r.visit1.status === 'Completed' && r.visit2.status === 'Completed').length,
    [rows],
  );


  const cellText = (r: UlaRow, i: number, key: string): string => {
    switch (key) {
      case 'srNo': return String(start + i + 1);
      case 'visit1': return r.visit1.status;
      case 'visit2': return r.visit2.status;
      case 'location': return r.lat !== null && r.lng !== null ? `${r.lat}, ${r.lng}` : '';
      case 'images': return String(r.images.length);
      default: return String((r as unknown as Record<string, unknown>)[key] ?? '');
    }
  };

  const handleCopy = async () => {
    const cols = visibleCols.filter((c) => !['action', 'location', 'images'].includes(c.key));
    await navigator.clipboard.writeText(
      filtered.map((r, i) => cols.map((c) => cellText(r, i, c.key)).join('\t')).join('\n')
    );
  };

  const handleExportCSV = () => {
    exportCsv(filtered, `ula-installations-${id || 'all'}`);
  };

  const handleExportExcel = () => {
    const cols = visibleCols.filter((c) => !['action', 'location', 'images'].includes(c.key));
    exportDataToExcel(
      `ula-installations-${id || 'all'}`,
      filtered,
      cols.map((c) => ({
        header: c.label,
        accessor: (r: UlaRow) => cellText(r, 0, c.key),
      }))
    );
  };

  const handleExportPDF = () => {
    const cols = visibleCols.filter((c) => !['action', 'location', 'images'].includes(c.key));
    printTableData(
      'ULA Installation Records',
      filtered,
      cols.map((c) => ({
        header: c.label,
        accessor: (r: UlaRow) => cellText(r, 0, c.key),
      }))
    );
  };

  const triggerRefresh = () => {
    load();
  };

  const ariaSort = (k: TableSortKey): 'ascending' | 'descending' | 'none' =>
    sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';

  const glyph = (k: TableSortKey) =>
    sortKey !== k ? ICON.sortDef : sortDir === 'asc' ? ICON.sortAsc : ICON.sortDesc;

  const renderCell = (key: string, r: UlaRow, i: number) => {
    switch (key) {
      case 'srNo':
        return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{start + i + 1}</td>;
      case 'caNo':
        return <td key={key} className="ax-table__td ax-num" style={{ ...mono, color: 'var(--ax-accent)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.caNo || '—'}</td>;
      case 'caName':
        return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.caName || '—'}</td>;
      case 'beneficiary':
        return <td key={key} className="ax-table__td">{r.beneficiary || '—'}</td>;
      case 'contact':
        return <td key={key} className="ax-table__td ax-num" style={mono}>{r.contact || '—'}</td>;
      case 'state':
        return <td key={key} className="ax-table__td">{r.state || '—'}</td>;
      case 'district':
        return <td key={key} className="ax-table__td">{r.district || '—'}</td>;
      case 'block':
        return <td key={key} className="ax-table__td">{r.block || '—'}</td>;
      case 'panchayat':
        return <td key={key} className="ax-table__td">{r.panchayat || '—'}</td>;
      case 'village':
        return <td key={key} className="ax-table__td">{r.village || '—'}</td>;
      case 'surveyDate':
        return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{r.surveyDate || '—'}</td>;
      case 'panel1':
        return <td key={key} className="ax-table__td ax-num" style={mono}>{r.panel1 || '—'}</td>;
      case 'panel2':
        return <td key={key} className="ax-table__td ax-num" style={mono}>{r.panel2 || '—'}</td>;
      case 'inverter':
        return <td key={key} className="ax-table__td ax-num" style={mono}>{r.inverter || '—'}</td>;
      case 'surveyor':
        return <td key={key} className="ax-table__td">{r.surveyor || '—'}</td>;
      case 'visit1':
      case 'visit2': {
        const v = key === 'visit1' ? r.visit1 : r.visit2;
        return (
          <td key={key} className="ax-table__td">
            <span className={`ax-badge ax-badge--soft ax-badge--pill ${visitClass(v.status)}`}>
              <span className="ax-badge__dot" />
              {v.status}
            </span>
            {v.at && (
              <div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 4 }}>
                {v.at}
              </div>
            )}
          </td>
        );
      }
      case 'location':
        return (
          <td key={key} className="ax-table__td">
            {r.lat !== null && r.lng !== null ? (
              <a className="ax-btn ax-btn--ghost ax-btn--sm"
                href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                target="_blank" rel="noreferrer">
                Map
              </a>
            ) : <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>}
          </td>
        );
      case 'images':
        return (
          <td key={key} className="ax-table__td">
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm"
              disabled={!r.images.length} onClick={() => setPreview(r)}>
              <span className="ax-btn__icon">{ICON.eye}</span>
              <span className="ax-btn__label">{r.images.length ? `${r.images.length} photos` : 'None'}</span>
            </button>
          </td>
        );
     case 'action': {
  const busy = downloadingId === r.id;
  return (
    <td key={key} className="ax-table__td" style={{ textAlign: 'center' }}>
      <button
        type="button"
        className="ax-btn ax-btn--secondary ax-btn--sm"
        onClick={() => downloadImages(r)}
        disabled={busy || !r.images.length}
        title={r.images.length ? 'Download all images in ZIP' : 'No images available for this record'}
      >
        <span className="ax-btn__icon">{ICON.download}</span>
        <span className="ax-btn__label">{busy ? 'Downloading…' : 'Download Images'}</span>
      </button>
    </td>
  );
}
      default:
        return <td key={key} className="ax-table__td">—</td>;
    }
  };

  return (
    <>
      <PageHead
        title="ULA Installation Data"
        subtitle="Beneficiary-wise survey, panel and inverter records with visit status and location."
        actions={
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={triggerRefresh} aria-label="Refresh data" aria-busy={loading}>
            <span className="ax-btn__icon">{ICON.refresh}</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        {usingDemo && !loading && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--warning" role="status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <span>Showing demo data: {demoReason}.</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry API</button>
            </div>
          </div>
        )}

        <section className="ax-card ax-col--12" role="region" aria-label="ULA installation records">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">ULA Installation Records</h2>
              <p className="ax-card__subtitle ax-num" style={mono}>
                {filtered.length} results · {fullyVisited}/{rows.length} fully visited
              </p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <SearchInput
                value={q}
                onChange={(value) => {
                  setQ(value);
                  setPage(1);
                }}
                placeholder="Search records…"
                size="sm"
                ariaLabel="Search records"
                showClear
                style={{
                  width: 250,
                  maxWidth: 350,
                  flex: '0 0 auto',
                  marginLeft: 'auto',
                }}
              />
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                columns={columns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 2200 }}>
              <caption className="ax-visually-hidden">ULA installation records, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => {
                    const isSortable = SORTABLE.includes(c.key);
                    return isSortable ? (
                      <th
                        key={c.key}
                        className="ax-table__th ax-table__th--sortable"
                        scope="col"
                        aria-sort={ariaSort(c.key as TableSortKey)}
                        onClick={() => sortBy(c.key as TableSortKey)}
                      >
                        {c.label} {glyph(c.key as TableSortKey)}
                      </th>
                    ) : (
                      <th
                        key={c.key}
                        className="ax-table__th"
                        scope="col"
                        style={c.key === 'action' ? { textAlign: 'center' } : undefined}
                      >
                        {c.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody aria-busy={loading}>
                {loading
                  ? [0, 1, 2, 3, 4, 5].map((n) => (
                      <tr key={n} className="ax-table__row">
                        <td className="ax-table__td" colSpan={visibleCols.length}>
                          <div className="ax-skeleton ax-skeleton--line" style={{ width: '100%' }} />
                        </td>
                      </tr>
                    ))
                  : paged.map((r, i) => (
                      <tr key={`${r.id}-${start + i}`} className="ax-table__row">
                        {visibleCols.map((c) => renderCell(c.key, r, i))}
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
            <div style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', borderTop: '1px solid var(--ax-border)' }}>
              <Pagination
                currentPage={curPage}
                totalItems={filtered.length}
                pageSize={perPage}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPerPage(size);
                  setPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </section>
      </div>

      <UlaModal open={!!preview} row={preview} onClose={() => setPreview(null)} />
    </>
  );
}

export default BiharULAInstallationViewData;

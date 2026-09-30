import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

/* ---------- Types ---------- */
interface Visit { status: string; at: string; }
interface ImageItem { label: string; url: string; }

interface UlaRow {
  id: string;
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
  visit1: Visit;
  visit2: Visit;
  lat: number | null;
  lng: number | null;
  images: ImageItem[];
}



/* ---------- Helpers ---------- */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const numOrNull = (v: unknown): number | null => {
  const n = Number(v);
  return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n;
};

/* Backend keys alag hon to sirf yahin mapping badalni hai */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (r: any, i: number): UlaRow => ({
  id: str(r?.id ?? r?._id ?? i),
  caNo: str(r?.ca_no ?? r?.caNo),
  caName: str(r?.ca_name ?? r?.caName),
  beneficiary: str(r?.beneficiary_name ?? r?.beneficiaryName),
  contact: str(r?.contact ?? r?.mobile),
  state: str(r?.state),
  district: str(r?.district),
  block: str(r?.block),
  panchayat: str(r?.panchayat),
  village: str(r?.village),
  surveyDate: str(r?.survey_date ?? r?.surveyDate),
  panel1: str(r?.panel_1_no ?? r?.panel1),
  panel2: str(r?.panel_2_no ?? r?.panel2),
  inverter: str(r?.inverter_no ?? r?.inverter),
  surveyor: str(r?.surveyor),
  visit1: { status: str(r?.first_visit ?? r?.visit1_status) || 'Pending', at: str(r?.visit1_at) },
  visit2: { status: str(r?.second_visit ?? r?.visit2_status) || 'Pending', at: str(r?.visit2_at) },
  lat: numOrNull(r?.latitude ?? r?.lat),
  lng: numOrNull(r?.longitude ?? r?.lng),
  images: Array.isArray(r?.images)
    ? r.images
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((im: any, k: number) => (typeof im === 'string' ? { label: `Photo ${k + 1}`, url: im } : { label: str(im?.label) || `Photo ${k + 1}`, url: str(im?.url) }))
        .filter((im: ImageItem) => im.url)
    : [],
});

const visitClass = (s: string) =>
  s.toLowerCase() === 'completed' ? 'ax-badge--success' : s.toLowerCase() === 'pending' ? 'ax-badge--warning' : 'ax-badge--neutral';

const parseDMY = (s: string) => {
  const [d, m, y] = s.split('-').map(Number);
  return y ? new Date(y, m - 1, d).getTime() : 0;
};

type SortKey = 'caNo' | 'caName' | 'district' | 'block' | 'surveyDate' | 'surveyor';

const CSV_COLS: { header: string; get: (r: UlaRow) => string }[] = [
  { header: 'CA No.', get: (r) => r.caNo },
  { header: 'CA Name', get: (r) => r.caName },
  { header: 'Beneficiary Name', get: (r) => r.beneficiary },
  { header: 'Contact', get: (r) => r.contact },
  { header: 'State', get: (r) => r.state },
  { header: 'District', get: (r) => r.district },
  { header: 'Block', get: (r) => r.block },
  { header: 'Panchayat', get: (r) => r.panchayat },
  { header: 'Village', get: (r) => r.village },
  { header: 'Survey Date', get: (r) => r.surveyDate },
  { header: 'Panel 1 No.', get: (r) => r.panel1 },
  { header: 'Panel 2 No.', get: (r) => r.panel2 },
  { header: 'Inverter No.', get: (r) => r.inverter },
  { header: 'Surveyor', get: (r) => r.surveyor },
  { header: '1st Visit', get: (r) => r.visit1.status },
  { header: '2nd Visit', get: (r) => r.visit2.status },
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

/* ---------- Page ---------- */
export function BiharULAInstallationViewData({ id: idProp }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const id = idProp ?? params.id ?? '';

  const [rows, setRows] = useState<UlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [demoReason, setDemoReason] = useState('');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('surveyDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [preview, setPreview] = useState<UlaRow | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/bihar/ula/${id}`, { signal, credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`API ne ${res.status} diya`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json?.data ?? json?.rows ?? json?.records ?? [];
      const list = Array.isArray(raw) ? raw : [];
      if (!list.length) {
      } else {
        setRows(list.map(normalize));
        setUsingDemo(false);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? rows.filter((r) =>
          [r.caNo, r.caName, r.beneficiary, r.contact, r.district, r.block, r.panchayat, r.village, r.panel1, r.panel2, r.inverter, r.surveyor]
            .some((v) => v.toLowerCase().includes(term)))
      : rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortKey === 'surveyDate'
        ? (parseDMY(a.surveyDate) - parseDMY(b.surveyDate)) * dir
        : a[sortKey].localeCompare(b[sortKey]) * dir);
  }, [rows, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const rangeStart = filtered.length ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * pageSize, filtered.length);

  // max 7 page buttons ek window mein
  const pageList = useMemo(() => {
    const win = 7;
    const from = Math.max(1, Math.min(curPage - 3, totalPages - win + 1));
    const to = Math.min(totalPages, from + win - 1);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [curPage, totalPages]);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };
  const sortable = (k: SortKey, label: string) => (
    <th className="ax-table__th ax-table__th--sortable" scope="col" onClick={() => sortBy(k)}
        aria-sort={sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {label} <SortIcon dir={sortKey === k ? sortDir : null} />
    </th>
  );

  const fullyVisited = useMemo(
    () => rows.filter((r) => r.visit1.status === 'Completed' && r.visit2.status === 'Completed').length,
    [rows],
  );

  return (
    <>
      <PageHead
        title="ULA Installation Data"
        subtitle="Beneficiary-wise survey, panel and inverter records with visit status and location."
        actions={
          <button type="button" className="ax-btn ax-btn--primary" disabled={!filtered.length} onClick={() => exportCsv(filtered, `ula-installations-${id || 'all'}`)}>
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
            <span className="ax-btn__label">Export CSV</span>
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

        <section className="ax-card ax-col--12" role="region" aria-label="ULA installation records">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">ULA Installation Records</h2>
              <p className="ax-card__subtitle ax-num" style={mono}>
                {filtered.length} results · {fullyVisited}/{rows.length} fully visited
              </p>
            </div>
            <div className="ax-card__actions" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
    
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                <input type="search" className="ax-input ax-input--sm" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ paddingInlineStart: 34 }} aria-label="Search records" />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1900 }}>
              <caption className="ax-visually-hidden">ULA installation records, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th ax-table__th--num" scope="col">Sr. No.</th>
                  {sortable('caNo', 'CA No.')}
                  {sortable('caName', 'CA Name')}
                  <th className="ax-table__th" scope="col">Beneficiary</th>
                  <th className="ax-table__th" scope="col">Contact</th>
                  <th className="ax-table__th" scope="col">State</th>
                  {sortable('district', 'District')}
                  {sortable('block', 'Block')}
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  {sortable('surveyDate', 'Survey Date')}
                  <th className="ax-table__th" scope="col">Panel 1 No.</th>
                  <th className="ax-table__th" scope="col">Panel 2 No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  {sortable('surveyor', 'Surveyor')}
                  <th className="ax-table__th" scope="col">1st Visit</th>
                  <th className="ax-table__th" scope="col">2nd Visit</th>
                  <th className="ax-table__th" scope="col">Location</th>
                  <th className="ax-table__th" scope="col">Images</th>
                  <th className="ax-table__th" scope="col"><span className="ax-visually-hidden">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td className="ax-table__td" colSpan={20} style={{ textAlign: 'center', padding: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>Loading records…</td></tr>
                )}
                {!loading && paged.map((r, i) => (
                  <tr key={`${r.id}-${start + i}`} className="ax-table__row">
                    <td className="ax-table__td ax-table__td--num ax-num">{start + i + 1}</td>
                    <td className="ax-table__td ax-num" style={{ ...mono, color: 'var(--ax-accent)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.caNo}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.caName}</td>
                    <td className="ax-table__td">{r.beneficiary}</td>
                    <td className="ax-table__td ax-num" style={mono}>{r.contact}</td>
                    <td className="ax-table__td">{r.state}</td>
                    <td className="ax-table__td">{r.district}</td>
                    <td className="ax-table__td">{r.block}</td>
                    <td className="ax-table__td">{r.panchayat}</td>
                    <td className="ax-table__td">{r.village}</td>
                    <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{r.surveyDate}</td>
                    <td className="ax-table__td ax-num" style={mono}>{r.panel1}</td>
                    <td className="ax-table__td ax-num" style={mono}>{r.panel2}</td>
                    <td className="ax-table__td ax-num" style={mono}>{r.inverter}</td>
                    <td className="ax-table__td">{r.surveyor}</td>
                    {[r.visit1, r.visit2].map((v, k) => (
                      <td key={k} className="ax-table__td">
                        <span className={`ax-badge ax-badge--soft ${visitClass(v.status)}`}>{v.status}</span>
                        {v.at && <div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 4 }}>{v.at}</div>}
                      </td>
                    ))}
                    <td className="ax-table__td">
                      {r.lat !== null && r.lng !== null ? (
                        <a className="ax-btn ax-btn--ghost ax-btn--sm" href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">Map</a>
                      ) : <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>}
                    </td>
                    <td className="ax-table__td">
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" disabled={!r.images.length} onClick={() => setPreview(r)}>
                        {r.images.length ? `${r.images.length} photos` : 'None'}
                      </button>
                    </td>
                    <td className="ax-table__td">
                      <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setPreview(r)}>View</button>
                    </td>
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
            <div className="ax-card__footer ax-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <span className="ax-pagination__summary ax-num" style={{ ...mono, fontSize: 'var(--ax-text-xs)' }}>
                Showing {rangeStart} to {rangeEnd} of {filtered.length}
              </span>
            
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(Math.max(1, curPage - 1))} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p) => (
                    <li key={p}>
                      <button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} onClick={() => setPage(p)}>{p}</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(Math.min(totalPages, curPage + 1))} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
              </nav>
            </div>
          )}
        </section>
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label={`Details for ${preview.beneficiary}`} onClick={() => setPreview(null)}
             style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 'var(--ax-space-4)' }}>
          <div className="ax-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">{preview.beneficiary}</h2>
                <p className="ax-card__subtitle ax-num" style={mono}>CA {preview.caNo} · {preview.village}</p>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setPreview(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 'var(--ax-space-3)', padding: 'var(--ax-space-4)' }}>
              {preview.images.length ? preview.images.map((im) => (
                <a key={im.url} href={im.url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <img src={im.url} alt={im.label} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--ax-radius-md)' }} />
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{im.label}</span>
                </a>
              )) : <p style={{ color: 'var(--ax-text-muted)' }}>Is record ke saath koi image nahi hai.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BiharULAInstallationViewData;
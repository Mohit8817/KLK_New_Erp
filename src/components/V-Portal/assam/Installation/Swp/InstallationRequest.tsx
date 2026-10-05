/*
 * Installation Request — Assam SWP assigned installations.
 * Built only from template components: Data Table, Pagination, Modal, Badges.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import { useClickOutside } from '../../../../../hooks/useClickOutside';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  ASSET_BASE_URL,
  SAMPLE_INSTALLATION_REQUESTS,
  type InstallationRequestRecord as Rec,
} from '../../../../../data/demo/assamInstallationRequests';

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
  download: svg([<path key="a" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />, <path key="b" d="M7 11l5 5l5 -5" />, <path key="c" d="M12 4l0 12" />]),
  sortDef: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>,
  sortAsc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>,
  sortDesc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>,
};

/* Modal — same pattern as the template Modals page */
function Modal({ open, onClose, labelledBy, dialogClass = '', children }: {
  open: boolean; onClose: () => void; labelledBy: string; dialogClass?: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={ref} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>{children}</div>
    </div>,
    document.body,
  );
}

/* status code -> label + badge tone (only "2" = Accepted is confirmed) */
const STATUS: Record<string, { label: string; tone: string }> = {
  '0': { label: 'Pending', tone: 'warning' },
  '1': { label: 'Assigned', tone: 'info' },
  '2': { label: 'Accepted', tone: 'success' },
  '3': { label: 'Rejected', tone: 'danger' },
};
const statusOf = (s: string) => STATUS[s] ?? { label: s || '—', tone: 'neutral' };

/* "2026-05-13 13:37:00" -> "13-05-2026" */
const fmtDate = (s: string) => {
  const [y, m, d] = (s || '').slice(0, 10).split('-');
  return y && m && d ? `${d}-${m}-${y}` : '—';
};
const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fileUrl = (p: string) => (p ? `${ASSET_BASE_URL}${p}` : '');
const fileExt = (p: string) => (p.split('.').pop() || '').toLowerCase();
const namesText = (r: Rec) => r.names.map((n) => `${n.farmer_name ?? '-'} - ${n.father_name ?? '-'}`).join('; ');

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', visible: true },
  { key: 'vendorName', label: 'Vendor', visible: true },
  { key: 'assignDate', label: 'Assign Date', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'district', label: 'District', visible: true },
  { key: 'names', label: 'Farmer Name - Father Name', visible: true },
  { key: 'siteCount', label: 'Count', visible: true },
  { key: 'deadlineDate', label: 'Deadline Date', visible: true },
  { key: 'file', label: 'File', visible: true },
  { key: 'view', label: 'View', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

type SortKey = 'vendorName' | 'assignDate' | 'state' | 'district' | 'siteCount' | 'deadlineDate' | 'status';
const SORTABLE: string[] = ['vendorName', 'assignDate', 'state', 'district', 'siteCount', 'deadlineDate', 'status'];

/* File thumbnail; falls back to a download link if it isn't a loadable image */
function FileThumb({ path }: { path: string }) {
  const [failed, setFailed] = useState(false);
  const url = fileUrl(path);
  if (!path) return <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>;
  if (failed) {
    return (
      <a className="ax-link" href={url} target="_blank" rel="noopener noreferrer" download style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{ICON.download}</span>{fileExt(path)}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open file" style={{ display: 'inline-flex' }}>
      <img src={url} alt="Assignment file" onError={() => setFailed(true)} style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border)' }} />
    </a>
  );
}

function RowActions({ item }: { item: Rec }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <span className="ax-btn__label">Action</span>
        <span className="ax-btn__icon">{ICON.down}</span>
      </button>
      {open && (
        <div className="ax-dropdown" role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', zIndex: 30, minWidth: 160, padding: 'var(--ax-space-2)' }}>
          <Link to="/assam/swp/installation-site" className="ax-menu__item" role="menuitem" onClick={() => setOpen(false)}>Add Installation Site</Link>
          <a className="ax-menu__item" role="menuitem" href={fileUrl(item.file)} target="_blank" rel="noopener noreferrer" download onClick={() => setOpen(false)}>Download File</a>
        </div>
      )}
    </div>
  );
}

export function InstallationRequest() {
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('assignDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [detail, setDetail] = useState<Rec | null>(null);

  const all = SAMPLE_INSTALLATION_REQUESTS;
  const visibleCols = columns.filter((c) => c.visible);
  const toggleColumn = (key: string) => setColumns((p) => p.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = all.filter((x) => !t || [x.vendorName, x.state, x.district, x.remarks, namesText(x), statusOf(x.status).label].some((v) => (v || '').toLowerCase().includes(t)));
    const dir = sortDir === 'asc' ? 1 : -1;
    r = [...r].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return r;
  }, [q, all, sortKey, sortDir]);

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
  const ariaSort = (k: SortKey): 'ascending' | 'descending' | 'none' => (sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
  const glyph = (k: SortKey) => (sortKey !== k ? ICON.sortDef : sortDir === 'asc' ? ICON.sortAsc : ICON.sortDesc);

  /* export */
  const cellText = (r: Rec, i: number, key: string): string => {
    switch (key) {
      case 'srNo': return String(i + 1);
      case 'assignDate': return fmtDate(r.assignDate);
      case 'deadlineDate': return fmtDate(r.deadlineDate);
      case 'state': return capital(r.state);
      case 'names': return namesText(r);
      case 'file': return fileUrl(r.file);
      case 'status': return statusOf(r.status).label;
      default: return String((r as unknown as Record<string, unknown>)[key] ?? '');
    }
  };
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const handleExportCSV = () => {
    const cols = columns.filter((c) => c.visible && c.key !== 'action' && c.key !== 'view');
    const rows = filtered.map((r, i) => cols.map((c) => esc(cellText(r, i, c.key))).join(','));
    const blob = new Blob(['\uFEFF' + [cols.map((c) => esc(c.label)).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assam_SWP_Installation_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(filtered.map((r, i) => [i + 1, r.vendorName, fmtDate(r.assignDate), capital(r.state), r.district, r.siteCount, fmtDate(r.deadlineDate), statusOf(r.status).label].join('\t')).join('\n'));
  };
  const triggerRefresh = () => { setLoading(true); setTimeout(() => setLoading(false), 500); };

  const renderCell = (key: string, r: Rec, i: number) => {
    switch (key) {
      case 'srNo': return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{start + i + 1}</td>;
      case 'vendorName': return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.vendorName}</td>;
      case 'assignDate': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.assignDate)}</td>;
      case 'state': return <td key={key} className="ax-table__td">{capital(r.state)}</td>;
      case 'district': return <td key={key} className="ax-table__td">{r.district || '—'}</td>;
      case 'names':
        return (
          <td key={key} className="ax-table__td">
            <ul style={{ margin: 0, paddingInlineStart: 'var(--ax-space-4)', fontSize: 'var(--ax-text-xs)' }}>
              {r.names.map((n, k) => <li key={k}>{n.farmer_name ?? '-'} - {n.father_name ?? '-'}</li>)}
            </ul>
          </td>
        );
      case 'siteCount': return <td key={key} className="ax-table__td ax-table__td--num">{r.siteCount}</td>;
      case 'deadlineDate': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.deadlineDate)}</td>;
      case 'file': return <td key={key} className="ax-table__td"><FileThumb path={r.file} /></td>;
      case 'view':
        return (
          <td key={key} className="ax-table__td">
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setDetail(r)}>
              <span className="ax-btn__icon">{ICON.eye}</span>
              <span className="ax-btn__label">View</span>
            </button>
          </td>
        );
      case 'remarks': return <td key={key} className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)', maxWidth: 200, whiteSpace: 'normal' }}>{r.remarks || '—'}</td>;
      case 'status': {
        const s = statusOf(r.status);
        return <td key={key} className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${s.tone}`}><span className="ax-badge__dot" />{s.label}</span></td>;
      }
      case 'action': return <td key={key} className="ax-table__td" style={{ textAlign: 'center' }}><RowActions item={r} /></td>;
      default: return <td key={key} className="ax-table__td" />;
    }
  };

  return (
    <>
      <PageHead
        title="View Assigned SWP Installation"
        subtitle="Assam installation requests assigned to vendors"
        actions={
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={triggerRefresh} aria-label="Refresh data" aria-busy={loading}>
            <span className="ax-btn__icon">{ICON.refresh}</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned SWP installation requests">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Assigned SWP Site</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{filtered.length} of {all.length} records</p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <TableExportToolbar
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportCSV}
                onExportPDF={handleExportCSV}
                columns={columns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1100 }}>
              <caption className="ax-visually-hidden">Assigned SWP installation requests, sortable</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => {
                    const sortable = SORTABLE.includes(c.key);
                    return sortable ? (
                      <th key={c.key} className="ax-table__th ax-table__th--sortable" scope="col" aria-sort={ariaSort(c.key as SortKey)} onClick={() => sortBy(c.key as SortKey)}>
                        {c.label} {glyph(c.key as SortKey)}
                      </th>
                    ) : (
                      <th key={c.key} className="ax-table__th" scope="col" style={c.key === 'action' ? { textAlign: 'center' } : undefined}>{c.label}</th>
                    );
                  })}
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
                      <tr key={r.id} className="ax-table__row">{visibleCols.map((c) => renderCell(c.key, r, i))}</tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}>
                <span className="ax-avatar__icon" style={{ width: 28, height: 28, display: 'inline-flex' }}>{ICON.search}</span>
              </span>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No requests found</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>There are no installation requests to show.</p>
              {q && <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setPage(1); }}>Clear filter</button>}
            </div>
          )}

          {!!filtered.length && (
            <div className="ax-card__footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>
                  Showing {rangeStart}–{rangeEnd} of {filtered.length}
                </span>
                <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Rows
                  <select className="ax-select ax-select--sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page" style={{ minWidth: 72 }}>
                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                  </select>
                </label>
              </div>
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(Math.max(1, curPage - 1))} aria-label="Previous page">{ICON.chevL}</button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p, i) => (
                    <li key={`${p}-${i}`}>
                      {p === '…'
                        ? <span className="ax-pagination__ellipsis">…</span>
                        : <button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => setPage(p)}>{p}</button>}
                    </li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(Math.min(totalPages, curPage + 1))} aria-label="Next page">{ICON.chevR}</button>
              </nav>
            </div>
          )}
        </section>
      </div>

      {/* VIEW DETAILS MODAL */}
      <Modal open={!!detail} onClose={() => setDetail(null)} labelledBy="req-detail-title" dialogClass="ax-modal__dialog--lg">
        {detail && (
          <>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="req-detail-title">Assignment details · #{detail.id}</h2>
              <button type="button" className="ax-modal__close" onClick={() => setDetail(null)} aria-label="Close dialog">{ICON.close}</button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 'var(--ax-space-3)' }}>
                {([
                  ['Vendor', detail.vendorName],
                  ['State', capital(detail.state)],
                  ['District', detail.district || '—'],
                  ['Sites', String(detail.siteCount)],
                  ['Assign date', fmtDate(detail.assignDate)],
                  ['Deadline', fmtDate(detail.deadlineDate)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' }}>{k}</div>
                    <div style={{ marginTop: 4, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Status</span>
                <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${statusOf(detail.status).tone}`}><span className="ax-badge__dot" />{statusOf(detail.status).label}</span>
              </div>

              <div className="ax-table-wrap">
                <table className="ax-table ax-table--compact">
                  <caption className="ax-visually-hidden">Farmers in this assignment</caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">#</th>
                      <th className="ax-table__th" scope="col">Farmer Name</th>
                      <th className="ax-table__th" scope="col">Father Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.names.map((n, i) => (
                      <tr key={i} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{i + 1}</td>
                        <td className="ax-table__td">{n.farmer_name ?? '—'}</td>
                        <td className="ax-table__td">{n.father_name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', marginBottom: 4 }}>Remarks</div>
                <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{detail.remarks || '—'}</div>
              </div>
            </div>

            <div className="ax-modal__footer">
              <a className="ax-btn ax-btn--secondary" href={fileUrl(detail.file)} target="_blank" rel="noopener noreferrer" download>
                <span className="ax-btn__icon">{ICON.download}</span>
                <span className="ax-btn__label">Download file</span>
              </a>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setDetail(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default InstallationRequest;
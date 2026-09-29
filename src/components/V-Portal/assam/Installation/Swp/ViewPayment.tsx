/*
 * View Payment — SWP installation claims & payments.
 * Template components only: Data Table, Pagination, Modal, Form elements, Badges.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import { useClickOutside } from '../../../../../hooks/useClickOutside';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { ASSET_BASE_URL } from '../../../../../data/demo/assamInstallationRequests';
import {
  SAMPLE_PAYMENTS,
  SAMPLE_PAYMENT_SITES,
  type PaymentRecord as Rec,
} from '../../../../../data/demo/assamPayments';

const svg = (children: ReactElement | ReactElement[]) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICON = {
  plus: svg([<path key="a" d="M12 5l0 14" />, <path key="b" d="M5 12l14 0" />]),
  refresh: svg([<path key="a" d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />, <path key="b" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />]),
  search: svg([<path key="a" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />, <path key="b" d="M21 21l-6 -6" />]),
  chevL: svg(<path d="M15 6l-6 6l6 6" />),
  chevR: svg(<path d="M9 6l6 6l-6 6" />),
  down: svg(<path d="M6 9l6 6l6 -6" />),
  close: svg([<path key="a" d="M18 6l-12 12" />, <path key="b" d="M6 6l12 12" />]),
  check: svg(<path d="M5 12l5 5l10 -10" />),
  upload: svg([<path key="a" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />, <path key="b" d="M7 9l5 -5l5 5" />, <path key="c" d="M12 4l0 12" />]),
  download: svg([<path key="a" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />, <path key="b" d="M7 11l5 5l5 -5" />, <path key="c" d="M12 4l0 12" />]),
  sortDef: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>,
  sortAsc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>,
  sortDesc: <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>,
};

/* Modal — same pattern as the template Modals page */
function Modal({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
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
      <div ref={ref} className="ax-modal__dialog">{children}</div>
    </div>,
    document.body,
  );
}

const CLAIM: Record<number, { label: string; tone: string }> = {
  0: { label: 'Not Raised', tone: 'neutral' },
  1: { label: 'Pending', tone: 'warning' },
  2: { label: 'Approved', tone: 'success' },
  3: { label: 'Rejected', tone: 'danger' },
};
const PAY: Record<number, { label: string; tone: string }> = {
  0: { label: 'Pending', tone: 'warning' },
  1: { label: 'Partially', tone: 'info' },
  2: { label: 'Complete', tone: 'success' },
};
const pick = (m: Record<number, { label: string; tone: string }>, k: number) => m[k] ?? { label: String(k), tone: 'neutral' };

const fmtDate = (s: string | null) => {
  const [y, m, d] = (s || '').slice(0, 10).split('-');
  return y && m && d ? `${d}-${m}-${y}` : '';
};
const money = (n: number | null) => (n === null || n === undefined ? '' : String(n));
const fileUrl = (p: string) => (!p ? '' : p.startsWith('blob:') ? p : `${ASSET_BASE_URL}${p}`);
const siteLabel = (id: string) => SAMPLE_PAYMENT_SITES.find((s) => s.id === id)?.label ?? `Site #${id}`;

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'S.No.', visible: true },
  { key: 'date', label: 'Date', visible: true },
  { key: 'sites', label: 'Sites', visible: true },
  { key: 'file', label: 'Invoice', visible: true },
  { key: 'amount', label: 'Amount', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
  { key: 'claimStatus', label: 'Claim Status', visible: true },
  { key: 'paymentAmount', label: 'Payment Amount', visible: true },
  { key: 'paymentBalance', label: 'Payment Balance', visible: true },
  { key: 'paymentDate', label: 'Payment Date', visible: true },
  { key: 'paymentRemarks', label: 'Payment Remarks', visible: true },
  { key: 'payStatus', label: 'Payment Status', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

type SortKey = 'date' | 'amount' | 'claimStatus' | 'payStatus';
const SORTABLE = ['date', 'amount', 'claimStatus', 'payStatus'];

function Invoice({ path }: { path: string }) {
  const [failed, setFailed] = useState(false);
  const url = fileUrl(path);
  if (!path) return <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>;
  if (failed) {
    return (
      <a className="ax-link" href={url} target="_blank" rel="noopener noreferrer" download style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{ICON.download}</span>file
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open invoice" style={{ display: 'inline-flex' }}>
      <img src={url} alt="Invoice" onError={() => setFailed(true)} style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border)' }} />
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
        <div className="ax-dropdown" role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', zIndex: 30, minWidth: 150, padding: 'var(--ax-space-2)' }}>
          <a className="ax-menu__item" role="menuitem" href={fileUrl(item.file)} target="_blank" rel="noopener noreferrer" download onClick={() => setOpen(false)}>Download Invoice</a>
        </div>
      )}
    </div>
  );
}

export function ViewPayment() {
  const [rows, setRows] = useState<Rec[]>(SAMPLE_PAYMENTS);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState(false);

  /* Add Payment modal */
  const [modal, setModal] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [invoice, setInvoice] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const visibleCols = columns.filter((c) => c.visible);
  const toggleColumn = (key: string) => setColumns((p) => p.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const sitesText = (r: Rec) => r.siteIds.map(siteLabel).join(', ');
  const balance = (r: Rec) => (r.paymentAmount === null ? null : r.amount - r.paymentAmount);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = rows.filter((x) => !t || [sitesText(x), x.remarks, x.paymentRemarks ?? '', String(x.amount), pick(CLAIM, x.claimStatus).label, pick(PAY, x.payStatus).label].some((v) => v.toLowerCase().includes(t)));
    const dir = sortDir === 'asc' ? 1 : -1;
    r = [...r].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, rows, sortKey, sortDir]);

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
      case 'date': return fmtDate(r.date);
      case 'sites': return sitesText(r);
      case 'file': return fileUrl(r.file);
      case 'claimStatus': return pick(CLAIM, r.claimStatus).label;
      case 'payStatus': return pick(PAY, r.payStatus).label;
      case 'paymentAmount': return money(r.paymentAmount);
      case 'paymentBalance': return money(balance(r));
      case 'paymentDate': return fmtDate(r.paymentDate);
      case 'paymentRemarks': return r.paymentRemarks ?? '';
      default: return String((r as unknown as Record<string, unknown>)[key] ?? '');
    }
  };
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const handleExportCSV = () => {
    const cols = columns.filter((c) => c.visible && c.key !== 'action');
    const lines = filtered.map((r, i) => cols.map((c) => esc(cellText(r, i, c.key))).join(','));
    const blob = new Blob(['\uFEFF' + [cols.map((c) => esc(c.label)).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assam_SWP_Payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(filtered.map((r, i) => [i + 1, fmtDate(r.date), sitesText(r), r.amount, r.remarks, pick(CLAIM, r.claimStatus).label, pick(PAY, r.payStatus).label].join('\t')).join('\n'));
  };
  const triggerRefresh = () => { setLoading(true); setTimeout(() => setLoading(false), 500); };

  /* modal handlers */
  const resetForm = () => { setSiteId(''); setAmount(''); setRemarks(''); setInvoice(null); };
  const closeModal = () => { setModal(false); resetForm(); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setSaving(true);
    setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setRows((rs) => [...rs, {
        id: Date.now(), date, siteIds: [siteId], file: URL.createObjectURL(invoice), amount: Number(amount),
        remarks, claimStatus: 1, payStatus: 0, paymentAmount: null, paymentDate: null, paymentRemarks: null,
      }]);
      setSaving(false);
      closeModal();
      setToast(true);
    }, 600);
  };

  const renderCell = (key: string, r: Rec, i: number) => {
    switch (key) {
      case 'srNo': return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{start + i + 1}</td>;
      case 'date': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.date)}</td>;
      case 'sites':
        return (
          <td key={key} className="ax-table__td">
            <ul style={{ margin: 0, paddingInlineStart: 'var(--ax-space-4)', fontSize: 'var(--ax-text-xs)' }}>
              {r.siteIds.map((id) => <li key={id}>{siteLabel(id)}</li>)}
            </ul>
          </td>
        );
      case 'file': return <td key={key} className="ax-table__td"><Invoice path={r.file} /></td>;
      case 'amount': return <td key={key} className="ax-table__td ax-table__td--num" style={{ color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>{r.amount.toLocaleString('en-IN')}</td>;
      case 'remarks': return <td key={key} className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)', maxWidth: 180, whiteSpace: 'normal' }}>{r.remarks || '—'}</td>;
      case 'claimStatus': { const s = pick(CLAIM, r.claimStatus); return <td key={key} className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${s.tone}`}><span className="ax-badge__dot" />{s.label}</span></td>; }
      case 'paymentAmount': return <td key={key} className="ax-table__td ax-table__td--num">{money(r.paymentAmount)}</td>;
      case 'paymentBalance': return <td key={key} className="ax-table__td ax-table__td--num">{money(balance(r))}</td>;
      case 'paymentDate': return <td key={key} className="ax-table__td ax-num">{fmtDate(r.paymentDate)}</td>;
      case 'paymentRemarks': return <td key={key} className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)', maxWidth: 180, whiteSpace: 'normal' }}>{r.paymentRemarks ?? ''}</td>;
      case 'payStatus': { const s = pick(PAY, r.payStatus); return <td key={key} className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${s.tone}`}><span className="ax-badge__dot" />{s.label}</span></td>; }
      case 'action': return <td key={key} className="ax-table__td" style={{ textAlign: 'center' }}><RowActions item={r} /></td>;
      default: return <td key={key} className="ax-table__td" />;
    }
  };

  return (
    <>
      <PageHead
        title="View SWP Installation Claim"
        subtitle="Installation claims, invoices and payment status"
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={triggerRefresh} aria-label="Refresh data" aria-busy={loading}>
              <span className="ax-btn__icon">{ICON.refresh}</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setModal(true)}>
              <span className="ax-btn__icon">{ICON.plus}</span>
              <span className="ax-btn__label">Add Payment</span>
            </button>
          </>
        }
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 60 }}>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-overlay)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', boxShadow: 'var(--ax-shadow-lg)' }}>
            <span style={{ color: 'var(--ax-viz-emerald)', width: 18, height: 18, display: 'inline-flex' }}>{ICON.check}</span>
            <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>Payment added successfully</span>
          </div>
        </div>
      )}

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="SWP installation payment table">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">SWP Installation Payment</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{filtered.length} of {rows.length} records</p>
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
            <table className="ax-table ax-table--hover" style={{ minWidth: 1200 }}>
              <caption className="ax-visually-hidden">SWP installation payments, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) =>
                    SORTABLE.includes(c.key) ? (
                      <th key={c.key} className={`ax-table__th ax-table__th--sortable${c.key === 'amount' ? ' ax-table__th--num' : ''}`} scope="col" aria-sort={ariaSort(c.key as SortKey)} onClick={() => sortBy(c.key as SortKey)}>
                        {c.label} {glyph(c.key as SortKey)}
                      </th>
                    ) : (
                      <th key={c.key} className={`ax-table__th${['paymentAmount', 'paymentBalance'].includes(c.key) ? ' ax-table__th--num' : ''}`} scope="col" style={c.key === 'action' ? { textAlign: 'center' } : undefined}>{c.label}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading
                  ? [0, 1, 2, 3].map((n) => (
                      <tr key={n} className="ax-table__row">
                        <td className="ax-table__td" colSpan={visibleCols.length}><div className="ax-skeleton ax-skeleton--line" style={{ width: '100%' }} /></td>
                      </tr>
                    ))
                  : paged.map((r, i) => <tr key={r.id} className="ax-table__row">{visibleCols.map((c) => renderCell(c.key, r, i))}</tr>)}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}>
                <span className="ax-avatar__icon" style={{ width: 28, height: 28, display: 'inline-flex' }}>{ICON.search}</span>
              </span>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>{rows.length ? 'No matches' : 'No payments yet'}</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>{rows.length ? 'No payments match your search.' : 'Add your first payment to see it here.'}</p>
              {rows.length
                ? <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setPage(1); }}>Clear search</button>
                : <button type="button" className="ax-btn ax-btn--primary" onClick={() => setModal(true)}>Add Payment</button>}
            </div>
          )}

          {!!filtered.length && (
            <div className="ax-card__footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>Showing {rangeStart}–{rangeEnd} of {filtered.length}</span>
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

      {/* ADD PAYMENT MODAL */}
      <Modal open={modal} onClose={closeModal} labelledBy="add-payment-title">
        <form onSubmit={submit}>
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="add-payment-title">Add Payment</h2>
            <button type="button" className="ax-modal__close" onClick={closeModal} aria-label="Close dialog">{ICON.close}</button>
          </div>
          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div className="ax-field">
              <label className="ax-label" htmlFor="ap-site">Select Site <span className="ax-field__required" aria-hidden="true">*</span></label>
              <select id="ap-site" className="ax-select" value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                <option value="">-- Select Site --</option>
                {SAMPLE_PAYMENT_SITES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--ax-space-4)' }}>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ap-invoice">Invoice <span className="ax-field__required" aria-hidden="true">*</span></label>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                  <label className="ax-btn ax-btn--secondary" style={{ cursor: 'pointer', flex: '0 0 auto' }}>
                    <span className="ax-btn__icon">{ICON.upload}</span>
                    <span className="ax-btn__label">Choose file</span>
                    <input id="ap-invoice" type="file" accept="image/*,.pdf" required className="ax-visually-hidden" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} onChange={(e) => setInvoice(e.target.files?.[0] ?? null)} />
                  </label>
                  <span className="ax-truncate" style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-subtle)' }}>{invoice ? invoice.name : 'No file selected'}</span>
                </div>
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ap-amount">Amount <span className="ax-field__required" aria-hidden="true">*</span></label>
                <input id="ap-amount" type="number" min="1" step="0.01" inputMode="decimal" className="ax-input ax-mono" placeholder="Enter Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>

            <div className="ax-field">
              <label className="ax-label" htmlFor="ap-remarks">Remarks</label>
              <textarea id="ap-remarks" className="ax-textarea" rows={3} placeholder="Enter Remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={closeModal}>
              <span className="ax-btn__icon">{ICON.close}</span>
              <span className="ax-btn__label">Close</span>
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={saving} aria-busy={saving}>
              <span className="ax-btn__icon">{ICON.check}</span>
              <span className="ax-btn__label">{saving ? 'Saving…' : 'Save'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default ViewPayment;
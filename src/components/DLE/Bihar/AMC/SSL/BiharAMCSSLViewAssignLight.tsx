import { useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../../common';
import { biharSslAmc, toArray } from '../../../../../services/Sslamcservice';
import { dleService } from '../../../../../services/dleServices';

interface AssignRow {
  id: string | number;
  user: string;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  date: string;
  remarks: string;
}

const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '') return o[k];
  return '';
};

const fmtDate = (v: unknown) => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v ?? '') || '—';
};
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const panList = (v: any): string[] => {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x?.name ?? x?.panchayat_name ?? '')).filter(Boolean);
  const s = String(v ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(String).filter(Boolean); } catch { /* fallthrough */ }
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean);
};

const buildUserMap = (json: any): Record<string, string> => {
  const map: Record<string, string> = {};
  toArray(json).forEach((u: any) => {
    const id = pick(u, 'id', 'user_id', 'value');
    const name = pick(u, 'name', 'user_name', 'full_name', 'username', 'label') || pick(u, 'email');
    if (id !== '') map[String(id)] = String(name || id);
  });
  return map;
};

/* ───────── Responsive CSS (ULA / DLE dashboard jaisa) ───────── */
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
    min-width: 240px;
    max-width: 260px;
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
  .solar-erp-page .ula-table--wide { min-width: 900px; }

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
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
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

export function BiharAMCSSLViewAssignLight() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [assign, usersRes] = await Promise.all([
          biharSslAmc.viewAssignLight(ac.signal),
          dleService.getAdminUsers(ac.signal).catch(() => null), // naam na mile to bhi page chale
        ]);
        const list = toArray(assign);
        console.info('[Bihar assign] rows:', list.length, 'first:', list[0]);
        setRows(list);
        if (usersRes) setUsers(buildUserMap(usersRes));
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Data load nahi hua');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const data = useMemo<AssignRow[]>(() => rows.map((r, i) => {
    const uid = String(pick(r, 'user_id', 'assign_user_id'));
    return {
      id: r.id ?? i,
      user: String(pick(r, 'user_name', 'assign_user', 'name') || users[uid] || (uid ? `User #${uid}` : '—')),
      state: cap(String(pick(r, 'state', 'state_name'))),
      volume: String(pick(r, 'volume', 'volume_name') || '—'),
      district: String(pick(r, 'district_name', 'district') || '—'),
      block: String(pick(r, 'block_name', 'block') || '—'),
      panchayat: panList(pick(r, 'panchayat_names', 'panchayats', 'panchayat_name', 'panchayat')),
      date: fmtDate(pick(r, 'sdate', 'assign_date', 'created_at', 'date')),
      remarks: String(pick(r, 'remark', 'remarks') || '—'),
    };
  }), [rows, users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? data.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(s)) : data;
  }, [data, q]);

  /* ───────── Pagination (common) ───────── */
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 10 });

  // Search badalne par page 1 par wapas jao
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* ───────── Export (Copy / CSV / Excel / PDF + column toggle) ───────── */
  const exportCols: ExportColumn<AssignRow>[] = [
    { header: 'Assign User', accessor: 'user' },
    { header: 'State', accessor: 'state' },
    { header: 'Volume', accessor: 'volume' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: (r) => r.panchayat.join(', ') },
    { header: 'Assign Date', accessor: 'date' },
    { header: 'Remarks', accessor: 'remarks' },
  ];

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
    const text = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
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

  const COLS = 9;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead title="View Bihar SSL AMC Assign" subtitle="All SSL AMC site assignments." />
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="View Bihar SSL AMC Assign">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Assign SSL Site</h2>
              <p className="ax-card__subtitle"><span className="ax-num">{filtered.length}</span> assignments.</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={q} onChange={setQ} placeholder="Search…" size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(filtered, activeCols)}
                  onExportCSV={() => exportToCSV(filtered, activeCols, `Bihar_SSL_AMC_Assign_${stamp}`)}
                  onExportExcel={() => exportToExcel(filtered, activeCols, `Bihar_SSL_AMC_Assign_${stamp}`)}
                  onExportPDF={() => exportToPDF(filtered, activeCols, 'Bihar SSL AMC Assign')}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
              <caption className="ax-visually-hidden">View Bihar SSL AMC Assign</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Assign User</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Volume</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && <tr><td className="ax-table__td" colSpan={COLS} style={centerCell}>Loading…</td></tr>}
                {!loading && error && <tr><td className="ax-table__td" colSpan={COLS} style={{ ...centerCell, color: 'var(--ax-danger-500)' }}>{error}</td></tr>}
                {!loading && !error && !paginatedData.length && <tr><td className="ax-table__td" colSpan={COLS} style={centerCell}>No Assignment Found</td></tr>}
                {paginatedData.map((r, i) => (
                  <tr key={r.id} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.user}</td>
                    <td className="ax-table__td">{r.state}</td>
                    <td className="ax-table__td">{r.volume}</td>
                    <td className="ax-table__td">{r.district}</td>
                    <td className="ax-table__td">{r.block}</td>
                    <td className="ax-table__td">
                      <span className="ax-cluster" style={{ gap: 'var(--ax-space-1)', flexWrap: 'wrap' }}>
                        {r.panchayat.length ? r.panchayat.map((p: string) => <span key={p} className="ax-badge ax-badge--soft ax-badge--neutral">{p}</span>) : '—'}
                      </span>
                    </td>
                    <td className="ax-table__td ax-num">{r.date}</td>
                    <td className="ax-table__td">{r.remarks}</td>
                  </tr>
                ))}
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
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
export default BiharAMCSSLViewAssignLight;
import { useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { biharSslAmc, toArray } from '../../../../../services/Sslamcservice';
import { dleService } from '../../../../../services/dleServices';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import SearchInput from '../../../../../common/search/SearchInput';
import { Pagination } from '../../../../../common/pagination/Pagination';
import { exportDataToCSV, exportDataToExcel, printTableData, copyTableDataToClipboard } from '../../../../../common/export/exportUtils';

const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== '') return o[k];
  return '';
};

const fmtDate = (v: unknown) => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v ?? '') || '—';
};
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

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

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', visible: true },
  { key: 'user', label: 'Assign User', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'volume', label: 'Volume', visible: true },
  { key: 'district', label: 'District', visible: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'panchayat', label: 'Panchayat', visible: true },
  { key: 'date', label: 'Assign Date', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
];

export function BiharAMCSSLViewAssignLight() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);

  const visibleCols = useMemo(() => columns.filter((c) => c.visible), [columns]);

  const toggleColumn = (key: string) =>
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [assign, usersRes] = await Promise.all([
          biharSslAmc.viewAssignLight(ac.signal),
          dleService.getAdminUsers(ac.signal).catch(() => null),
        ]);
        const list = toArray(assign);
        console.info('[Bihar assign] rows:', list.length, 'first:', list[0]);
        setRows(list);
        if (usersRes) setUsers(buildUserMap(usersRes));
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const data = useMemo(() => rows.map((r, i) => {
    const uid = String(pick(r, 'user_id', 'assign_user_id'));
    return {
      id: r.id ?? i,
      srNo: i + 1,
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

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * perPage, cur * perPage);

  const exportCols = useMemo(
    () =>
      visibleCols.map((c) => ({
        header: c.label,
        accessor: (r: any) => {
          if (c.key === 'panchayat') return Array.isArray(r.panchayat) ? r.panchayat.join(', ') : r.panchayat;
          return r[c.key] ?? '';
        },
      })),
    [visibleCols]
  );

  const handleCopy = async () => {
    await copyTableDataToClipboard(filtered, exportCols);
  };

  const handleExportCSV = () => {
    exportDataToCSV('bihar-ssl-amc-assignments', filtered, exportCols);
  };

  const handleExportExcel = () => {
    exportDataToExcel('bihar-ssl-amc-assignments', filtered, exportCols, 'Assignments');
  };

  const handleExportPDF = () => {
    printTableData('Bihar SSL AMC Assignments', filtered, exportCols);
  };

  const renderCell = (key: string, r: any, index: number) => {
    switch (key) {
      case 'srNo':
        return <td key={key} className="ax-table__td ax-num">{(cur - 1) * perPage + index + 1}</td>;
      case 'user':
        return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.user}</td>;
      case 'state':
        return <td key={key} className="ax-table__td">{r.state}</td>;
      case 'volume':
        return <td key={key} className="ax-table__td">{r.volume}</td>;
      case 'district':
        return <td key={key} className="ax-table__td">{r.district}</td>;
      case 'block':
        return <td key={key} className="ax-table__td">{r.block}</td>;
      case 'panchayat':
        return (
          <td key={key} className="ax-table__td">
            <span className="ax-cluster" style={{ gap: 'var(--ax-space-1)', flexWrap: 'wrap' }}>
              {r.panchayat.length ? r.panchayat.map((p: string) => <span key={p} className="ax-badge ax-badge--soft ax-badge--neutral">{p}</span>) : '—'}
            </span>
          </td>
        );
      case 'date':
        return <td key={key} className="ax-table__td ax-num">{r.date}</td>;
      case 'remarks':
        return <td key={key} className="ax-table__td">{r.remarks}</td>;
      default:
        return <td key={key} className="ax-table__td">{r[key] || '—'}</td>;
    }
  };

  return (
    <>
      <PageHead title="View Bihar SSL AMC Assign" subtitle="All SSL AMC site assignments." />
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="View Bihar SSL AMC Assign">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Assign SSL Site</h2>
              <p className="ax-card__subtitle"><span className="ax-num">{filtered.length}</span> assignments.</p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <SearchInput
                value={q}
                onChange={(val) => { setQ(val); setPage(1); }}
                placeholder="Search assignments…"
                size="sm"
                ariaLabel="Search assignments"
                showClear
                style={{ width: 250, maxWidth: 350, flex: '0 0 auto', marginLeft: 'auto' }}
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
            <table className="ax-table ax-table--hover" style={{ minWidth: 900 }}>
              <caption className="ax-visually-hidden">View Bihar SSL AMC Assign</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => (
                    <th key={c.key} className="ax-table__th" scope="col">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && <tr><td className="ax-table__td" colSpan={visibleCols.length} style={{ textAlign: 'center' }}>Loading…</td></tr>}
                {!loading && error && <tr><td className="ax-table__td" colSpan={visibleCols.length} style={{ textAlign: 'center', color: 'var(--ax-danger-500)' }}>{error}</td></tr>}
                {!loading && !error && !slice.length && <tr><td className="ax-table__td" colSpan={visibleCols.length} style={{ textAlign: 'center' }}>No assignments found</td></tr>}
                {slice.map((r, i) => (
                  <tr key={r.id} className="ax-table__row">
                    {visibleCols.map((c) => renderCell(c.key, r, i))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', borderTop: '1px solid var(--ax-border)' }}>
            <Pagination
              currentPage={cur}
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
        </section>
      </div>
    </>
  );
}
export default BiharAMCSSLViewAssignLight;
import { useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { biharSslAmc, toArray } from '../../../../../services/Sslamcservice';

import { dleService } from '../../../../../services/dleServices';


const PAGE_SIZE = 10;

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

export function BiharAMCSSLViewAssignLight() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

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

  const data = useMemo(() => rows.map((r, i) => {
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

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const COLS = 9;

  return (
    <>
      <PageHead title="View Bihar SSL AMC Assign" subtitle="All SSL AMC site assignments." />
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="View Bihar SSL AMC Assign">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles"><h2 className="ax-card__title">View Assign SSL Site</h2><p className="ax-card__subtitle"><span className="ax-num">{filtered.length}</span> assignments.</p></div>
            <div className="ax-card__actions">
              <input type="search" className="ax-input ax-input--sm" placeholder="Search…" aria-label="Search assignments" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 900 }}>
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
                {loading && <tr><td className="ax-table__td" colSpan={COLS} style={{ textAlign: 'center' }}>Loading…</td></tr>}
                {!loading && error && <tr><td className="ax-table__td" colSpan={COLS} style={{ textAlign: 'center', color: 'var(--ax-danger-500)' }}>{error}</td></tr>}
                {!loading && !error && !slice.length && <tr><td className="ax-table__td" colSpan={COLS} style={{ textAlign: 'center' }}>No Assignment Found</td></tr>}
                {slice.map((r, i) => (
                  <tr key={r.id} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(cur - 1) * PAGE_SIZE + i + 1}</td>
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

          <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <span className="ax-pagination__summary ax-num" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Showing {filtered.length ? (cur - 1) * PAGE_SIZE + 1 : 0} to {Math.min(cur * PAGE_SIZE, filtered.length)} of {filtered.length} entries
            </span>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><span className="ax-btn__label">Previous</span></button>
              <span className="ax-num" style={{ fontSize: 'var(--ax-text-sm)' }}>{cur} / {pages}</span>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}><span className="ax-btn__label">Next</span></button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
export default BiharAMCSSLViewAssignLight;
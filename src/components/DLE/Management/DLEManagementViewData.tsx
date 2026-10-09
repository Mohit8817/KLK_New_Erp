import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PageHead } from '../../shell/PageHead';
import { TableExportToolbar, type ColumnDef, Pagination, SearchInput } from '../../../common';
import { dleService, extractList, filterByCompany, getLoginCompanyId } from '../../../services/dleServices';

/* ---------- Types ---------- */
interface UserRow {
  id: string;
  companyId: string;
  state: string;
  name: string;
  email: string;
  contact: string;
  emergency: string;
  district: string;
  block: string;
  panchayat: string;
  address: string;
  police: string;
  documents: { label: string; url: string }[];
  approval: string;
  status: string;
  createdAt: string;
  createdTs: number;
}

/* ---------- Helpers ---------- */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

const toTs = (v: unknown): number => {
  const s = str(v);
  if (!s) return 0;
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
};
const fmtDate = (ts: number, fallback: string) => {
  if (!ts) return fallback;
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

/* approval_status is a number in the API: 1 = Approved, 2 = Rejected, 0/null = Pending (assumption) */
const approvalLabel = (v: unknown): string => {
  const s = str(v).toLowerCase();
  if (s === '1' || s === 'approved') return 'Approved';
  if (s === '2' || s === 'rejected') return 'Rejected';
  return 'Pending';
};
const statusLabel = (v: unknown): string => {
  const s = str(v).toLowerCase();
  return s === '1' || s === 'active' || s === 'true' ? 'Active' : 'Inactive';
};

/*
 * Keep relative paths (/uploads/...) so requests go through the Vite proxy, which adds the API key.
 * API returns values like "r2:userdocuments/xxx.jpg" -> strip the "r2:" prefix.
 * NOTE: "/uploads/" is a guess — change it to whatever route your backend/proxy uses to serve R2 files.
 */
const fileUrl = (p: string): string => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('r2:')) return `/uploads/${p.slice(3)}`;
  return p.startsWith('/') ? p : '/' + p;
};

const DOC_FIELDS: [string, string][] = [
  ['educational_document', 'Educational document'],
  ['aadhaar_voter_id', 'Aadhaar / Voter ID'],
  ['pan_card', 'PAN card'],
  ['driving_license', 'Driving license'],
  ['police_verification', 'Police verification'],
  ['cancelled_cheque', 'Cancelled cheque'],
  ['rent_agreement_electricity_bill', 'Rent agreement / Electricity bill'],
  ['profile_image', 'Profile photo'],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (r: any, i: number): UserRow => {
  const ts = toTs(r?.created_at ?? r?.createdAt);
  return {
    id: str(r?.id ?? r?._id ?? i),
    companyId: str(r?.company_id),
    state: str(r?.state),
    name: str(r?.name ?? r?.full_name),
    email: str(r?.email),
    contact: str(r?.contact_no ?? r?.contact ?? r?.phone),
    emergency: str(r?.emergency_contact_no ?? r?.emergency_contact),
    district: str(r?.district),
    block: str(r?.block),
    panchayat: str(r?.panchayat),
    address: str(r?.address),
    police: str(r?.police_verification_validity),
    documents: DOC_FIELDS.map(([k, label]) => ({ label, url: fileUrl(str(r?.[k])) })).filter((d) => d.url),
    approval: approvalLabel(r?.approval_status),
    status: statusLabel(r?.status),
    createdAt: fmtDate(ts, str(r?.created_at)),
    createdTs: ts,
  };
};

const approvalClass = (s: string) => (({ Approved: 'ax-badge--success', Pending: 'ax-badge--warning', Rejected: 'ax-badge--danger' } as Record<string, string>)[s] || 'ax-badge--neutral');

type SortKey = 'state' | 'name' | 'district' | 'block' | 'approval' | 'status' | 'createdTs';

/* Table + export columns — this single list drives both the column toggle and the export */
const COLUMN_DEFS: { key: string; label: string; get: (r: UserRow) => string }[] = [
  { key: 'name', label: 'Name', get: (r) => r.name },
  { key: 'email', label: 'Email', get: (r) => r.email },
  { key: 'contact', label: 'Contact', get: (r) => r.contact },
  { key: 'district', label: 'District', get: (r) => r.district },
  { key: 'panchayat', label: 'Panchayat', get: (r) => r.panchayat },
  { key: 'approval', label: 'Approval Status', get: (r) => r.approval },
  { key: 'documents', label: 'Documents', get: (r) => r.documents.map((d) => d.url).join(' | ') },
];

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const htmlTable = (heads: string[], data: string[][]) =>
  `<table border="1" cellspacing="0" cellpadding="4"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${data
    .map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
const download = (content: string, mime: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const SortIcon = ({ dir }: { dir: 'asc' | 'desc' | null }) => (
  <svg className="ax-table__sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={dir ? undefined : { opacity: 0.4 }}>
    {dir === 'asc' ? <path d="M6 15l6 -6l6 6" /> : dir === 'desc' ? <path d="M6 9l6 6l6 -6" /> : (<><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></>)}
  </svg>
);

const mono = { fontFamily: 'var(--ax-font-mono)' } as const;
const APPROVALS = ['All', 'Pending', 'Approved', 'Rejected'];

/* ---------- Page ---------- */
export function DleUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [approval, setApproval] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('createdTs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [colVis, setColVis] = useState<Record<string, boolean>>({});
  // Approve flow: user for whom the remark modal is open + the remark text
  const [approveFor, setApproveFor] = useState<UserRow | null>(null);
  const [remark, setRemark] = useState('Approved');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  // true = editing an already Approved/Rejected user (PATCH /approve/:id)
  const [editMode, setEditMode] = useState(false);

  const vis = (k: string) => colVis[k] !== false;

  // Convert query params coming from the dashboard into View Data filters.
  useEffect(() => {
    const approvalParam = searchParams.get('approval');
    if (approvalParam && APPROVALS.includes(approvalParam)) setApproval(approvalParam);
  }, [searchParams]);

  const load = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!silent) setLoading(true);

    try {
      const json = await dleService.getAdminUsers(signal);
      const list = extractList(json);

      if (!list.length) {
        setRows([]);
      } else {
        // Match logged-in user's company_id before normalize
        const mine = filterByCompany(list);
        setRows(mine.map(normalize));
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;

      console.error('Failed to load DLE users:', e);

      // Real ERP: never show fake/demo data
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const urlState = searchParams.get('state') || 'All';
  const urlDistrict = searchParams.get('district') || 'All';
  const urlActivity = searchParams.get('activity') || 'All';
  const urlCreated = searchParams.get('created') || 'All';

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = new Date();
    const activeCutoff = now.getTime() - 30 * 86400000;

    const list = rows.filter((r) => {
      const matchesState = urlState === 'All' || r.state === urlState;
      const matchesDistrict = urlDistrict === 'All' || r.district === urlDistrict;

      const matchesActivity =
        urlActivity !== 'active' ||
        (r.createdTs > 0 && r.createdTs >= activeCutoff);

      const matchesCreated =
        urlCreated !== 'today' ||
        (r.createdTs > 0 &&
          new Date(r.createdTs).toDateString() === now.toDateString());

      return (
        matchesState &&
        matchesDistrict &&
        matchesActivity &&
        matchesCreated &&
        (approval === 'All' || r.approval === approval) &&
        (!term || [r.name, r.email, r.contact, r.emergency, r.state, r.district, r.block, r.panchayat, r.address]
          .some((v) => v.toLowerCase().includes(term)))
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortKey === 'createdTs' ? (a.createdTs - b.createdTs) * dir : a[sortKey].localeCompare(b[sortKey]) * dir);
  }, [rows, q, approval, sortKey, sortDir, urlState, urlDistrict, urlActivity, urlCreated]);

  useEffect(() => {
    setPage(1);
  }, [urlState, urlDistrict, urlActivity, urlCreated, approval]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const rangeStart = filtered.length ? start + 1 : 0;
  const rangeEnd = Math.min(curPage * pageSize, filtered.length);

  const counts = useMemo(() => ({
    Pending: rows.filter((r) => r.approval === 'Pending').length,
    Approved: rows.filter((r) => r.approval === 'Approved').length,
    Rejected: rows.filter((r) => r.approval === 'Rejected').length,
  }), [rows]);

  /* ---------- Export toolbar (common/TableExportToolbar) ---------- */
  // NOTE: assumes the ColumnDef shape is { key, label, visible } — adjust the mapping here if your type differs
  const columns = useMemo(
    () => COLUMN_DEFS.map((c) => ({ key: c.key, label: c.label, visible: colVis[c.key] !== false })) as unknown as ColumnDef[],
    [colVis],
  );
  const toggleColumn = (k: string | number) => {
    const key = typeof k === 'number' ? COLUMN_DEFS[k]?.key : k;
    if (!key) return;
    setColVis((v) => ({ ...v, [key]: v[key] === false }));
  };

  // All filtered rows (not just the current page) + visible columns only
  const exportData = () => {
    const cols = COLUMN_DEFS.filter((c) => vis(c.key));
    return { heads: cols.map((c) => c.label), data: filtered.map((r) => cols.map((c) => c.get(r))) };
  };
  const guardEmpty = () => {
    if (filtered.length) return false;
    setToast({ type: 'err', msg: 'There are no rows to export' });
    return true;
  };

  const handleCopy = async () => {
    if (guardEmpty()) return;
    const { heads, data } = exportData();
    const tsv = [heads, ...data].map((row) => row.map((c) => c.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setToast({ type: 'ok', msg: `${data.length} rows copied` });
    } catch {
      setToast({ type: 'err', msg: 'Could not copy — the browser blocked clipboard access' });
    }
  };
  const handleExportCSV = () => {
    if (guardEmpty()) return;
    const { heads, data } = exportData();
    const q2 = (v: string) => `"${v.replace(/"/g, '""')}"`;
    download('\uFEFF' + [heads, ...data].map((row) => row.map(q2).join(',')).join('\n'), 'text/csv;charset=utf-8;', 'dle-users.csv');
  };
  const handleExportExcel = () => {
    if (guardEmpty()) return;
    const { heads, data } = exportData();
    download(`<html><head><meta charset="utf-8" /></head><body>${htmlTable(heads, data)}</body></html>`, 'application/vnd.ms-excel;charset=utf-8;', 'dle-users.xls');
  };
  const handleExportPDF = () => {
    if (guardEmpty()) return;
    const { heads, data } = exportData();
    const w = window.open('', '_blank');
    if (!w) { setToast({ type: 'err', msg: 'Popup blocked — allow popups and try again' }); return; }
    w.document.write(`<html><head><title>DLE Users</title><style>body{font:12px system-ui,sans-serif;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}</style></head><body><h2>DLE Users</h2>${htmlTable(heads, data)}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  /* ---------- Toast / menu / approve ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, r: UserRow) => {
    if (menu?.id === r.id) { setMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const w = 176, h = 92;
    const left = Math.max(8, Math.min(rect.right - w, window.innerWidth - w - 8));
    const top = rect.bottom + 4 + h > window.innerHeight ? rect.top - h - 4 : rect.bottom + 4;
    setMenu({ id: r.id, top, left });
  };

  // Step 1: "Approve" / "Reject" in the dropdown opens the remark modal
  // Only Pending users can be acted on — Approved and Rejected are both locked.
  const openAction = (u: UserRow, type: 'approve' | 'reject') => {
    setMenu(null);
    if (u.approval !== 'Pending' || busyId) return;
    setEditMode(false);
    setActionType(type);
    setRemark(type === 'approve' ? 'Approved' : '');
    setApproveFor(u);
  };

  // Edit a locked (Approved / Rejected) user: switch the decision to the opposite one
  const openEdit = (u: UserRow) => {
    setMenu(null);
    if (u.approval === 'Pending' || busyId) return;
    const type: 'approve' | 'reject' = u.approval === 'Approved' ? 'reject' : 'approve';
    setEditMode(true);
    setActionType(type);
    setRemark(type === 'approve' ? 'Approved' : '');
    setApproveFor(u);
  };

  // Step 2: "Approve" in the modal sends status + remark to the API
  const submitAction = async (u: UserRow, remarkText: string) => {
    if ((!editMode && u.approval !== 'Pending') || busyId) return;
    const isApprove = actionType === 'approve';
    const text = remarkText.trim();
    if (!text) {
      setToast({ type: 'err', msg: 'Remark is required' });
      return;
    }
    setBusyId(u.id);
    try {
      // company_id of the /admin/users row; if it is null, use the logged-in user's company_id
      const companyId = u.companyId || getLoginCompanyId();
      const payload = {
        status: isApprove ? 1 : 2, // backend reads "status": 0 = Pending, 1 = Approved, 2 = Rejected
        approval_remarks: text,
        ...(companyId ? { company_id: companyId } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = editMode
        ? await dleService.editApproval(u.id, payload) // PATCH /api/admin/approve/:id
        : await dleService.updateApprovalStatus({ id: u.id, ...payload }); // POST /api/admin/approval/status
      if (json?.success === false) {
        const detail = json?.errors ? Object.values(json.errors).flat().join(', ') : '';
        throw new Error(str(json?.message ?? json?.error) || detail || `Could not ${isApprove ? 'approve' : 'reject'} the user`);
      }

      const done = (x: UserRow): UserRow => (x.id === u.id ? { ...x, approval: isApprove ? 'Approved' : 'Rejected', status: isApprove ? 'Active' : 'Inactive' } : x);
      setRows((rs) => rs.map(done));
      setSelected((s) => (s ? done(s) : s));
      setApproveFor(null);
      setToast({ type: 'ok', msg: `${u.name} ${isApprove ? 'approved' : 'rejected'}` });
      // Re-sync with the server so the lock always reflects what is actually saved in the DB
      load(undefined, true);
    } catch (e) {
      setToast({ type: 'err', msg: (e as Error).message || `Could not ${isApprove ? 'approve' : 'reject'} the user` });
      load(undefined, true); // state may have changed on the server (e.g. already approved)
    } finally {
      setBusyId(null);
    }
  };

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
  const plainTh = (label: string) => <th className="ax-table__th" scope="col">{label}</th>;

  const skeletonCols = COLUMN_DEFS.filter((c) => vis(c.key)).length + 2; // + Sr. No. + Action

  return (
    <>
      <PageHead
        title="DLE Users"
        subtitle="Registered field users with contact details, verification and approval status."
        actions={
          <TableExportToolbar
            onCopy={handleCopy}
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            columns={columns}
            onToggleColumn={toggleColumn}
          />
        }
      />

      <div className="ax-dash-grid">

        <section className="ax-card ax-col--12" role="region" aria-label="DLE users">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">DLE Users</h2>
              <p className="ax-card__subtitle ax-num" style={mono}>
                {filtered.length} results · {counts.Pending} pending · {counts.Approved} approved · {counts.Rejected} rejected
                {(urlState !== 'All' || urlDistrict !== 'All' || urlActivity !== 'All' || urlCreated !== 'All') ? ' · Dashboard filter applied' : ''}
              </p>
            </div>
            <div className="ax-card__actions" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <select
                className="ax-select ax-select--sm"
                value={approval}
                onChange={(e) => {
                  const value = e.target.value;
                  setApproval(value);
                  setPage(1);
                  const next = new URLSearchParams(searchParams);
                  if (value === 'All') next.delete('approval');
                  else next.set('approval', value);
                  setSearchParams(next);
                }}
                aria-label="Filter by approval status"
              >
                {APPROVALS.map((a) => <option key={a} value={a}>{a === 'All' ? 'All approvals' : a}</option>)}
              </select>
              {(urlState !== 'All' || urlDistrict !== 'All' || urlActivity !== 'All' || urlCreated !== 'All') && (
                <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {urlState !== 'All' && <span className="ax-badge ax-badge--soft ax-badge--neutral">State: {urlState}</span>}
                  {urlDistrict !== 'All' && <span className="ax-badge ax-badge--soft ax-badge--neutral">District: {urlDistrict}</span>}
                  {urlActivity === 'active' && <span className="ax-badge ax-badge--soft ax-badge--success">Active</span>}
                  {urlCreated === 'today' && <span className="ax-badge ax-badge--soft ax-badge--neutral">Today</span>}
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearchParams({});
                      setApproval('All');
                      setPage(1);
                    }}
                  >
                    Clear dashboard filter
                  </button>
                </div>
              )}
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 11, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                <input type="search" className="ax-input ax-input--sm" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ paddingInlineStart: 34 }} aria-label="Search users" />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: Math.max(720, skeletonCols * 140) }} aria-busy={loading}>
              <caption className="ax-visually-hidden">DLE users, sortable and searchable</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th ax-table__th--num" scope="col">Sr. No.</th>
                  {vis('name') && sortable('name', 'Name')}
                  {vis('email') && plainTh('Email')}
                  {vis('contact') && plainTh('Contact')}
                  {vis('district') && sortable('district', 'District')}
                  {vis('panchayat') && plainTh('Panchayat')}
                  {vis('approval') && sortable('approval', 'Approval Status')}
                  {vis('documents') && plainTh('Documents')}
                  <th className="ax-table__th" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }, (_, i) => (
                  <tr key={`sk-${i}`} className="ax-table__row" aria-hidden="true">
                    {Array.from({ length: skeletonCols }, (_, c) => (
                      <td key={c} className="ax-table__td"><span className={`block h-3 animate-pulse rounded-md bg-current opacity-10 motion-reduce:animate-none ${c === 3 || c === 9 ? 'w-40' : 'w-16'}`} /></td>
                    ))}
                  </tr>
                ))}
                {!loading && paged.map((r, i) => (
                  <tr key={`${r.id}-${start + i}`} className="ax-table__row">
                    <td className="ax-table__td ax-table__td--num ax-num">{start + i + 1}</td>
                    {vis('name') && <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.name}</td>}
                    {vis('email') && <td className="ax-table__td">{r.email}</td>}
                    {vis('contact') && <td className="ax-table__td ax-num" style={mono}>{r.contact}</td>}
                    {vis('district') && <td className="ax-table__td">{r.district}</td>}
                    {vis('panchayat') && <td className="ax-table__td">{r.panchayat}</td>}
                    {vis('approval') && <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ${approvalClass(r.approval)}`}>{r.approval}</span></td>}
                    {vis('documents') && (
                      <td className="ax-table__td">
                        {r.documents.length
                          ? <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSelected(r)}>{r.documents.length} files</button>
                          : <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>}
                      </td>
                    )}
                    <td className="ax-table__td">
                      {(() => {
                        const locked = r.approval !== 'Pending';
                        const busy = busyId === r.id;
                        return (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            disabled={locked || busy}
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === r.id}
                            onClick={(e) => openMenu(e, r)}
                            title={locked ? `${r.approval} — action locked` : undefined}
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: locked || busy ? 'not-allowed' : 'pointer' }}
                          >
                            {locked ? (
                              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M8 11v-4a4 4 0 1 1 8 0v4" /></svg>
                            ) : null}
                            <span>{locked ? 'Locked' : busy ? 'Processing…' : 'Action'}</span>
                            {!locked && !busy ? (
                              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
                            ) : null}
                          </button>
                          {/* {locked ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              disabled={busy}
                              onClick={() => openEdit(r)}
                              title={`Change decision (currently ${r.approval})`}
                            >
                              Edit
                            </button>
                          ) : null} */}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No users found</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>No users match your search or filters.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setApproval('All'); setPage(1); }}>Clear filters</button>
            </div>
          )}

          {!loading && !!filtered.length && (
            <Pagination
              currentPage={curPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              setPage={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              showSummary
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
            />
          )}
        </section>
      </div>

      {/* Action dropdown — portal + inline styles (does not depend on Tailwind) */}
      {menu && (() => {
        const u = rows.find((x) => x.id === menu.id);
        if (!u) return null;
        return createPortal(
          <>
            <div
              onClick={() => setMenu(null)}
              aria-hidden="true"
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            />
            <div
              role="menu"
              aria-label={`Actions for ${u.name}`}
              style={{
                position: 'fixed',
                top: menu.top,
                left: menu.left,
                width: 176,
                zIndex: 9999,
                padding: 4,
                borderRadius: 8,
                background: 'var(--ax-surface-solid, #fff)',
                border: '1px solid rgb(0 0 0 / 0.12)',
                boxShadow: '0 10px 30px rgb(0 0 0 / 0.2)',
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => openAction(u, 'approve')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 0,
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--ax-text-strong, #111)',
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(16 185 129 / 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                Approve
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => openAction(u, 'reject')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 0,
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--ax-text-strong, #111)',
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(220 38 38 / 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                Reject
              </button>
            </div>
          </>,
          document.body,
        );
      })()}

      {/* Approve remark modal */}
      {approveFor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${actionType === 'approve' ? 'Approve' : 'Reject'} ${approveFor.name}`}
          onClick={() => { if (!busyId) setApproveFor(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 'var(--ax-space-4)' }}
        >
          <div className="ax-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, width: '100%' }}>
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">
                  {editMode
                    ? `Change to ${actionType === 'approve' ? 'Approved' : 'Rejected'}`
                    : actionType === 'approve' ? 'Approve user' : 'Reject user'}
                </h2>
                <p className="ax-card__subtitle">{approveFor.name} · {approveFor.contact}</p>
              </div>
            </div>
            <div style={{ padding: 'var(--ax-space-4)', display: 'grid', gap: 'var(--ax-space-3)' }}>
              <label htmlFor="approve-remark" style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                Remark <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                id="approve-remark"
                className="ax-input"
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={actionType === 'approve' ? 'Enter remark…' : 'Enter rejection reason…'}
                autoFocus
                style={{ width: '100%', resize: 'vertical' }}
              />
              <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                {editMode
                  ? `Current status: ${approveFor.approval}. This will overwrite it.`
                  : `This action will be locked after ${actionType === 'approve' ? 'approval' : 'rejection'}.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ax-space-2)' }}>
                <button type="button" className="ax-btn ax-btn--ghost" disabled={!!busyId} onClick={() => setApproveFor(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ax-btn ax-btn--primary"
                  disabled={!!busyId || !remark.trim()}
                  onClick={() => submitAction(approveFor, remark)}
                  style={actionType === 'reject' ? { background: '#dc2626', borderColor: '#dc2626', color: '#fff' } : undefined}
                >
                  {busyId === approveFor.id ? 'Processing…' : actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: 10000, maxWidth: 360,
            padding: '12px 16px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 500,
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.25)',
            background: toast.type === 'ok' ? '#059669' : '#dc2626',
          }}
        >
          {toast.msg}
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={`Details for ${selected.name}`} onClick={() => setSelected(null)}
             style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 'var(--ax-space-4)' }}>
          <div className="ax-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">{selected.name}</h2>
                <p className="ax-card__subtitle">{selected.email}</p>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--ax-space-2) var(--ax-space-5)', padding: 'var(--ax-space-4)', margin: 0, fontSize: 'var(--ax-text-sm)' }}>
              {([
                ['Contact', selected.contact], ['Emergency contact', selected.emergency || '—'],
                ['Location', [selected.panchayat, selected.block, selected.district, selected.state].filter(Boolean).join(', ')],
                ['Address', selected.address || '—'], ['Police verification', selected.police || '—'],
                ['Approval', selected.approval], ['Status', selected.status], ['Created', selected.createdAt],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt style={{ color: 'var(--ax-text-muted)' }}>{k}</dt>
                  <dd style={{ margin: 0, color: 'var(--ax-text-strong)' }}>{v}</dd>
                </div>
              ))}
              <dt style={{ color: 'var(--ax-text-muted)' }}>Documents</dt>
              <dd style={{ margin: 0 }}>
                {selected.documents.length
                  ? selected.documents.map((d) => <div key={d.url}><a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)' }}>{d.label}</a></div>)
                  : <span style={{ color: 'var(--ax-text-subtle)' }}>No documents uploaded</span>}
              </dd>
            </dl>
          </div>
        </div>
      )}
    </>
  );
}

export default DleUsers;
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../common/TableExportToolbar';

/* ---------- Config ---------- */
const BASE_URL = 'https://klkdle.klkventures.cloud';
const API_URL = `${BASE_URL}/api/admin/users`;
const APPROVAL_URL = `${BASE_URL}/api/admin/approval/status`;

/* Approval request ka method + body — backend ke hisaab se sirf yahin badalna hai */
const approvalRequest = (u: { id: string }) => ({
  method: 'POST' as 'POST' | 'PUT' | 'PATCH',
  body: { user_id: u.id, id: u.id, approval_status: 1 }, // 1 = Approved
});

/* Auth token kahan rakha hai — apne app ke hisaab se key badal lena */
const getToken = (): string | null => {
  try {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
  } catch {
    return null;
  }
};

/* ---------- Types ---------- */
interface UserRow {
  id: string;
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

/* ---------- Fake data (API fail / empty par) — real API ki shape mein ---------- */
const FAKE = [
  { id: '130', state: 'Bihar', district: 'Muzaffarpur ', block: 'Saraiya ', panchayat: 'Bahilwara rupnath south ', name: 'Rakesh Kumar Chaudhary ', email: 'rakeshkumarchaudhary489@gmail.com', contact_no: '9708494537', emergency_contact_no: '6203975750', police_verification_validity: '', address: 'Village:- Bahilwara Gangauliya, Post office:- Azizpur, police station:-saraiya, district:- Muzaffarpur ', educational_document: '/uploads/user/documents/1789784821620-891887534.jpg', aadhaar_voter_id: '/uploads/user/aadhaar/1789784821687-698813235.jpg', pan_card: '/uploads/user/pan/1789784821696-917889325.jpg', profile_image: null, status: 0, approval_status: 0, created_at: '2026-09-19T02:27:02.000Z' },
  { id: '129', state: 'Bihar', district: 'MUZAFFARPUR ', block: 'SAKRA ', panchayat: 'RAMPUR KRISHN', name: 'DEEPAK KUMAR ', email: 'deepakkumarmuz690@gmail.com', contact_no: '8084250954', emergency_contact_no: '9973913502', police_verification_validity: '1', address: 'Vill-Repura P.S-sakra P.O-Mahmmadpur susta ', educational_document: '/uploads/user/documents/1789782275036-779144256.jpg', aadhaar_voter_id: '/uploads/user/aadhaar/1789782275041-410924547.pdf', profile_image: null, status: 0, approval_status: 0, created_at: '2026-09-19T01:44:35.000Z' },
  { id: '128', state: 'Bihar', district: 'Belsand', block: 'Belsand ', panchayat: 'Patahi ', name: 'Abhay Kashyap ', email: 'kashyapabhay9534@gmail.com', contact_no: '9534394566', emergency_contact_no: '9304550858', police_verification_validity: '26/09/27', address: 'Bhorhanmal', educational_document: '/uploads/user/documents/1789781272273-866414022.jpg', profile_image: null, status: 1, approval_status: 1, created_at: '2026-09-19T01:27:53.000Z' },
  { id: '127', state: 'Bihar', district: 'Muzaffarpur ', block: 'Sakra', panchayat: 'Rampur krishna', name: 'Keshav kumar', email: 'keshavmfp98@gmail.com', contact_no: '9709895610', emergency_contact_no: '8084845609', police_verification_validity: '1', address: 'Vill-Repura, Sakra, muzaffarpur,bihar', profile_image: null, status: 1, approval_status: 1, created_at: '2026-09-18T18:27:35.000Z' },
];

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

/* approval_status API mein number hai: 1 = Approved, 2 = Rejected, 0/null = Pending (assumption) */
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

/* API relative path deti hai (/uploads/...), isliye base URL lagana zaroori hai */
const fileUrl = (p: string): string => (!p ? '' : /^https?:\/\//i.test(p) ? p : BASE_URL + (p.startsWith('/') ? '' : '/') + p);

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
const statusClass = (s: string) => (s === 'Active' ? 'ax-badge--success' : 'ax-badge--neutral');

type SortKey = 'state' | 'name' | 'district' | 'block' | 'approval' | 'status' | 'createdTs';

/* Table + export ke columns — yahi list column-toggle aur export dono ko drive karti hai */
const COLUMN_DEFS: { key: string; label: string; get: (r: UserRow) => string }[] = [
  { key: 'state', label: 'State', get: (r) => r.state },
  { key: 'name', label: 'Name', get: (r) => r.name },
  { key: 'email', label: 'Email', get: (r) => r.email },
  { key: 'contact', label: 'Contact', get: (r) => r.contact },
  { key: 'emergency', label: 'Emergency Contact', get: (r) => r.emergency },
  { key: 'district', label: 'District', get: (r) => r.district },
  { key: 'block', label: 'Block', get: (r) => r.block },
  { key: 'panchayat', label: 'Panchayat', get: (r) => r.panchayat },
  { key: 'address', label: 'Address', get: (r) => r.address },
  { key: 'police', label: 'Police Verification', get: (r) => r.police },
  { key: 'documents', label: 'Documents', get: (r) => r.documents.map((d) => d.url).join(' | ') },
  { key: 'approval', label: 'Approval Status', get: (r) => r.approval },
  { key: 'status', label: 'Status', get: (r) => r.status },
  { key: 'created', label: 'Created At', get: (r) => r.createdAt },
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
const PAGE_SIZE = 100;

/* ---------- Page ---------- */
export function DleUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoReason, setDemoReason] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [approval, setApproval] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('createdTs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [colVis, setColVis] = useState<Record<string, boolean>>({});

  const vis = (k: string) => colVis[k] !== false;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const useDemo = (reason: string) => { setRows(FAKE.map(normalize)); setDemoReason(reason); };
    try {
      const token = getToken();
      const res = await fetch(API_URL, {
        signal,
        credentials: 'include',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'Login/token ki zarurat hai (401/403)' : `API ne ${res.status} diya`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json?.data?.users ?? json?.data ?? json?.users ?? json?.rows ?? json?.records ?? [];
      const list = Array.isArray(raw) ? raw : [];
      if (!list.length) useDemo('API se koi user nahi aaya');
      else { setRows(list.map(normalize)); setDemoReason(null); }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      const msg = (e as Error).message;
      useDemo(msg === 'Failed to fetch' ? 'Network/CORS error — API browser se block ho rahi hai' : msg || 'API load nahi hui');
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
    const list = rows.filter((r) =>
      (approval === 'All' || r.approval === approval) &&
      (!term || [r.name, r.email, r.contact, r.emergency, r.state, r.district, r.block, r.panchayat, r.address].some((v) => v.toLowerCase().includes(term))));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) =>
      sortKey === 'createdTs' ? (a.createdTs - b.createdTs) * dir : a[sortKey].localeCompare(b[sortKey]) * dir);
  }, [rows, q, approval, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);
  const pageList = useMemo(() => {
    const from = Math.max(1, Math.min(curPage - 3, totalPages - 6));
    const to = Math.min(totalPages, from + 6);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [curPage, totalPages]);

  const counts = useMemo(() => ({
    Pending: rows.filter((r) => r.approval === 'Pending').length,
    Approved: rows.filter((r) => r.approval === 'Approved').length,
    Rejected: rows.filter((r) => r.approval === 'Rejected').length,
  }), [rows]);

  /* ---------- Export toolbar (common/TableExportToolbar) ---------- */
  // NOTE: ColumnDef ka shape { key, label, visible } maana hai — tumhare type se alag ho to yahin map badalna
  const columns = useMemo(
    () => COLUMN_DEFS.map((c) => ({ key: c.key, label: c.label, visible: colVis[c.key] !== false })) as unknown as ColumnDef[],
    [colVis],
  );
  const toggleColumn = (k: string | number) => {
    const key = typeof k === 'number' ? COLUMN_DEFS[k]?.key : k;
    if (!key) return;
    setColVis((v) => ({ ...v, [key]: v[key] === false }));
  };

  // filtered saari rows (sirf current page nahi) + sirf visible columns
  const exportData = () => {
    const cols = COLUMN_DEFS.filter((c) => vis(c.key));
    return { heads: cols.map((c) => c.label), data: filtered.map((r) => cols.map((c) => c.get(r))) };
  };
  const guardEmpty = () => {
    if (filtered.length) return false;
    setToast({ type: 'err', msg: 'Export karne ke liye koi row nahi hai' });
    return true;
  };

  const handleCopy = async () => {
    if (guardEmpty()) return;
    const { heads, data } = exportData();
    const tsv = [heads, ...data].map((row) => row.map((c) => c.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setToast({ type: 'ok', msg: `${data.length} rows copy ho gayi` });
    } catch {
      setToast({ type: 'err', msg: 'Copy nahi ho paya — browser ne clipboard block kiya' });
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
    if (!w) { setToast({ type: 'err', msg: 'Popup block hua — allow karke dobara try karo' }); return; }
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
    const w = 176, h = 52;
    const left = Math.max(8, Math.min(rect.right - w, window.innerWidth - w - 8));
    const top = rect.bottom + 4 + h > window.innerHeight ? rect.top - h - 4 : rect.bottom + 4;
    setMenu({ id: r.id, top, left });
  };

  const approveUser = async (u: UserRow) => {
    setMenu(null);
    if (u.approval === 'Approved' || busyId) return;
    if (!window.confirm(`"${u.name}" ko approve karna hai? Approve ke baad ye action lock ho jayega.`)) return;
    setBusyId(u.id);
    try {
      if (!demoReason) {
        const token = getToken();
        const req = approvalRequest(u);
        const res = await fetch(APPROVAL_URL, {
          method: req.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(req.body),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let json: any = null;
        try { json = await res.json(); } catch { /* body optional */ }
        if (!res.ok || json?.success === false) throw new Error(str(json?.message ?? json?.error) || `API ne ${res.status} diya`);
      }
      const done = (x: UserRow): UserRow => (x.id === u.id ? { ...x, approval: 'Approved', status: 'Active' } : x);
      setRows((rs) => rs.map(done));
      setSelected((s) => (s ? done(s) : s));
      setToast({ type: 'ok', msg: demoReason ? `${u.name} approve hua (demo mode, API call nahi hui)` : `${u.name} approve ho gaya` });
    } catch (e) {
      const msg = (e as Error).message;
      setToast({ type: 'err', msg: msg === 'Failed to fetch' ? 'Network/CORS error — approve nahi hua' : msg || 'Approve nahi ho paya' });
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
        {demoReason && !loading && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--warning" role="status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <span>Demo data dikh raha hai: {demoReason}.</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry API</button>
            </div>
          </div>
        )}

        <section className="ax-card ax-col--12" role="region" aria-label="DLE users">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">DLE Users</h2>
              <p className="ax-card__subtitle ax-num" style={mono}>
                {filtered.length} results · {counts.Pending} pending · {counts.Approved} approved · {counts.Rejected} rejected
              </p>
            </div>
            <div className="ax-card__actions" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <select className="ax-select ax-select--sm" value={approval} onChange={(e) => { setApproval(e.target.value); setPage(1); }} aria-label="Filter by approval status">
                {APPROVALS.map((a) => <option key={a} value={a}>{a === 'All' ? 'All approvals' : a}</option>)}
              </select>
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
                  {vis('state') && sortable('state', 'State')}
                  {vis('name') && sortable('name', 'Name')}
                  {vis('email') && plainTh('Email')}
                  {vis('contact') && plainTh('Contact')}
                  {vis('emergency') && plainTh('Emergency Contact')}
                  {vis('district') && sortable('district', 'District')}
                  {vis('block') && sortable('block', 'Block')}
                  {vis('panchayat') && plainTh('Panchayat')}
                  {vis('address') && plainTh('Address')}
                  {vis('police') && plainTh('Police Verification')}
                  {vis('documents') && plainTh('Documents')}
                  {vis('approval') && sortable('approval', 'Approval Status')}
                  {vis('status') && sortable('status', 'Status')}
                  {vis('created') && sortable('createdTs', 'Created At')}
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
                    {vis('state') && <td className="ax-table__td">{r.state}</td>}
                    {vis('name') && <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.name}</td>}
                    {vis('email') && <td className="ax-table__td">{r.email}</td>}
                    {vis('contact') && <td className="ax-table__td ax-num" style={mono}>{r.contact}</td>}
                    {vis('emergency') && <td className="ax-table__td ax-num" style={mono}>{r.emergency || '—'}</td>}
                    {vis('district') && <td className="ax-table__td">{r.district}</td>}
                    {vis('block') && <td className="ax-table__td">{r.block}</td>}
                    {vis('panchayat') && <td className="ax-table__td">{r.panchayat}</td>}
                    {vis('address') && <td className="ax-table__td" style={{ maxWidth: 260, whiteSpace: 'normal' }}>{r.address || '—'}</td>}
                    {vis('police') && <td className="ax-table__td">{r.police || '—'}</td>}
                    {vis('documents') && (
                      <td className="ax-table__td">
                        {r.documents.length
                          ? <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSelected(r)}>{r.documents.length} files</button>
                          : <span style={{ color: 'var(--ax-text-subtle)' }}>—</span>}
                      </td>
                    )}
                    {vis('approval') && <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ${approvalClass(r.approval)}`}>{r.approval}</span></td>}
                    {vis('status') && <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ${statusClass(r.status)}`}>{r.status}</span></td>}
                    {vis('created') && <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{r.createdAt}</td>}
                    <td className="ax-table__td">
                      {(() => {
                        const locked = r.approval === 'Approved';
                        const busy = busyId === r.id;
                        return (
                          <button
                            type="button"
                            disabled={locked || busy}
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === r.id}
                            onClick={(e) => openMenu(e, r)}
                            title={locked ? 'Approved — action locked' : undefined}
                            className="ax-btn ax-btn--secondary ax-btn--sm inline-flex items-center gap-1.5 disabled:cursor-not-allowed"
                          >
                            {locked ? (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M8 11v-4a4 4 0 1 1 8 0v4" /></svg>
                            ) : null}
                            <span>{locked ? 'Locked' : busy ? 'Approving…' : 'Action'}</span>
                            {!locked && !busy ? (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
                            ) : null}
                          </button>
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
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>Search ya filter se koi user match nahi hua.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setApproval('All'); setPage(1); }}>Clear filters</button>
            </div>
          )}

          {!loading && !!filtered.length && (
            <div className="ax-card__footer ax-flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <span className="ax-pagination__summary ax-num" style={{ ...mono, fontSize: 'var(--ax-text-xs)' }}>
                Showing {start + 1} to {Math.min(curPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <nav className="ax-pagination" aria-label="Pagination">
                <button type="button" className="ax-pagination__prev" disabled={curPage === 1} aria-disabled={curPage === 1} onClick={() => setPage(curPage - 1)} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                <ul className="ax-pagination__pages">
                  {pageList.map((p) => (
                    <li key={p}><button type="button" className={`ax-pagination__page${curPage === p ? ' is-active' : ''}`} aria-current={curPage === p ? 'page' : undefined} onClick={() => setPage(p)}>{p}</button></li>
                  ))}
                </ul>
                <button type="button" className="ax-pagination__next" disabled={curPage === totalPages} aria-disabled={curPage === totalPages} onClick={() => setPage(curPage + 1)} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
              </nav>
            </div>
          )}
        </section>
      </div>

      {menu && (() => {
        const u = rows.find((x) => x.id === menu.id);
        if (!u) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} aria-hidden="true" />
            <div role="menu" aria-label={`Actions for ${u.name}`} style={{ top: menu.top, left: menu.left }}
                 className="fixed z-50 w-44 rounded-lg border border-black/10 bg-[var(--ax-surface-solid)] p-1 shadow-xl dark:border-white/10">
              <button type="button" role="menuitem" onClick={() => approveUser(u)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--ax-text-strong)] hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:bg-emerald-500/10 focus-visible:outline-none">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
                Approve
              </button>
            </div>
          </>
        );
      })()}

      {toast && (
        <div role="status" className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
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
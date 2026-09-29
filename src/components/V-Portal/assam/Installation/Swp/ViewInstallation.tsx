
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { TableExportToolbar, type ColumnDef } from '../../../../../common/TableExportToolbar';
import { useClickOutside } from '../../../../../hooks/useClickOutside';
import {
  ASSAM_DASHBOARD_DATA,
  SAMPLE_INSTALLATION_RECORDS,
  type InstallationRecord,
} from '../../../../../data/demo/assamSwpData';
import { ASSAM_SWP_VIEW_INSTALL_SITE_URL } from '../../../V_Portal_APIS/Assam_API';
import { authService } from '../../../../../services/authService';

const svg = (children: ReactElement | ReactElement[]) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICON = {
  refresh: svg([<path key="a" d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />, <path key="b" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />]),
  plus: svg([<path key="a" d="M12 5l0 14" />, <path key="b" d="M5 12l14 0" />]),
  layers: svg([<path key="a" d="M12 2l8 4l-8 4l-8 -4z" />, <path key="b" d="M4 10l8 4l8 -4" />, <path key="c" d="M4 14l8 4l8 -4" />]),
  bookmark: svg(<path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" />),
  shield: svg([<path key="a" d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />, <path key="b" d="M9 12l2 2l4 -4" />]),
  doc: svg([<path key="a" d="M14 3v4a1 1 0 0 0 1 1h4" />, <path key="b" d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />, <path key="c" d="M9 13l6 0" />, <path key="d" d="M9 17l6 0" />]),
  claim: svg([<path key="a" d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" />, <path key="b" d="M20 12v4h-4a2 2 0 0 1 0 -4h4" />]),
  pay: svg([<path key="a" d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" />, <path key="b" d="M12 3v3m0 12v3" />]),
  chevL: svg(<path d="M15 6l-6 6l6 6" />),
  chevR: svg(<path d="M9 6l6 6l-6 6" />),
  down: svg(<path d="M6 9l6 6l6 -6" />),
  close: svg([<path key="a" d="M18 6l-12 12" />, <path key="b" d="M6 6l12 12" />]),
  search: svg([<path key="a" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />, <path key="b" d="M21 21l-6 -6" />]),
};

const INITIAL_COLUMNS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', visible: true },
  { key: 'state', label: 'State', visible: true },
  { key: 'district', label: 'District', visible: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'village', label: 'Village', visible: true },
  { key: 'applicantName', label: 'Applicant Name', visible: true },
  { key: 'vfdNo', label: 'VFD No.', visible: true },
  { key: 'inverterNo', label: 'Inverter No.', visible: true },
  { key: 'moduleSerialNos', label: 'Module Serial No.', visible: true },
  { key: 'farmerWithModuleImg', label: 'Farmer With Module Image', visible: true },
  { key: 'inverterVfdFarmerImg', label: 'Inverter & VFD with Farmer', visible: true },
  { key: 'runningWaterFarmerImg', label: 'Running Water with Farmer', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
  { key: 'verifyStatus', label: 'Verify Status', visible: true },
  { key: 'verifyRemarks', label: 'Verify Remarks', visible: true },
  { key: 'documentStatus', label: 'Document Status', visible: true },
  { key: 'docVerifyRemarks', label: 'Doc Verify Remarks', visible: true },
  { key: 'claimStatus', label: 'Claim Status', visible: true },
  { key: 'paymentStatus', label: 'Payment Status', visible: true },
  { key: 'action', label: 'Action', visible: true },
];

const IMG_COLS: Record<string, string> = {
  farmerWithModuleImg: 'Farmer With Module',
  inverterVfdFarmerImg: 'Inverter & VFD',
  runningWaterFarmerImg: 'Running Water',
};

/* Badge tone from status text (template badge variants only) */
const tone = (s: string) => {
  const v = (s || '').toLowerCase();
  if (/(approv|complete|paid|done|verified)/.test(v)) return 'success';
  if (/(reject|fail|declin)/.test(v)) return 'danger';
  if (/(submit)/.test(v)) return 'info';
  return 'warning';
};

/* Row action menu — template ax-dropdown pattern */
function RowActions({ item }: { item: InstallationRecord }) {
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
        <div className="ax-dropdown" role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', zIndex: 30, minWidth: 140, padding: 'var(--ax-space-2)' }}>
          <Link to="/assam/swp/installation-site" className="ax-menu__item" role="menuitem" onClick={() => setOpen(false)}>Edit Site</Link>
          <button type="button" className="ax-menu__item" role="menuitem" onClick={() => { alert(`Verifying site ${item.applicantName}`); setOpen(false); }}>Verify Site</button>
        </div>
      )}
    </div>
  );
}

/* Helper to resolve server-relative image paths */
const resolveImg = (img?: string) => {
  if (!img) return 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=60';
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  const baseUrl = ASSAM_SWP_VIEW_INSTALL_SITE_URL.replace(/\/api\/.*$/, '').replace(/\/+$/, '');
  const cleanPath = img.replace(/^\/+/, '');
  return `${baseUrl}/uploads/${cleanPath}`;
};

/* Helper to parse module serial numbers safely */
const parseModuleSerials = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export function ViewInstallation() {
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>(INITIAL_COLUMNS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [preview, setPreview] = useState<{ title: string; src: string } | null>(null);

  const swp = ASSAM_DASHBOARD_DATA.swp;
  const [sites, setSites] = useState<InstallationRecord[]>(SAMPLE_INSTALLATION_RECORDS);
  const [installDetail, setInstallDetail] = useState<{
    total?: number;
    complete?: number;
    pending?: number;
    verify_approved?: number;
    verify_pending?: number;
    verify_reject?: number;
    doc_approved?: number;
    doc_pending?: number;
    doc_reject?: number;
    claim_approved?: number;
    claim_pending?: number;
    claim_reject?: number;
    paid?: number;
    partially?: number;
  }>({
    total: swp.site_count,
    complete: swp.complete,
    pending: swp.pending,
    verify_approved: swp.verify_approved,
    verify_pending: swp.verify_pending,
    verify_reject: swp.verify_reject,
    doc_approved: swp.doc_approved,
    doc_pending: swp.doc_pending,
    doc_reject: swp.doc_reject,
    claim_approved: swp.inst_claim_approved,
    claim_pending: swp.inst_claim_raised,
    claim_reject: swp.inst_claim_reject,
    paid: swp.inst_pay_complete,
    partially: swp.inst_pay_partially,
  });

  const loadInstalledSites = useCallback(async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const res = await fetch(ASSAM_SWP_VIEW_INSTALL_SITE_URL, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.status || json.success) && json.data) {
          if (json.data.install_detail) {
            setInstallDetail(json.data.install_detail);
          }
          if (Array.isArray(json.data.sites) && json.data.sites.length > 0) {
            const mapped: InstallationRecord[] = json.data.sites.map((s: any, idx: number) => ({
              id: String(s.id || idx + 1),
              srNo: idx + 1,
              state: 'Assam',
              district: s.district || 'Assam',
              block: s.block || '—',
              village: s.village || '—',
              applicantName: s.farmer_name || `Farmer #${s.id}`,
              vfdNo: s.vfd_no || '—',
              inverterNo: s.inverter_no || '—',
              moduleSerialNos: parseModuleSerials(s.module_serial_no),
              latitude: s.latitude || '—',
              longitude: s.longitude || '—',
              farmerWithModuleImg: resolveImg(s.farmer_with_module_img),
              inverterVfdFarmerImg: resolveImg(s.inverter_vfd_farmer_img),
              runningWaterFarmerImg: resolveImg(s.running_water_farmer_img),
              remarks: s.inst_remarks || '—',
              verifyStatus: (s.inst_verify === 'Approved' ? 'Complete' : s.inst_verify === 'Reject' ? 'Reject' : 'Pending') as any,
              verifyRemarks: s.inst_verify_remarks || '',
              documentStatus: (s.doc_verify === 'Approved' ? 'Approved' : s.doc_verify === 'Reject' ? 'Reject' : 'Pending') as any,
              docVerifyRemarks: s.doc_verify_remarks || '',
              claimStatus: (s.inst_claim === 'Approved' ? 'Approved' : s.inst_claim === 'Reject' ? 'Reject' : s.inst_claim === 'Raised' ? 'Raised' : 'Pending') as any,
              paymentStatus: (s.inst_pay === 'Complete' ? 'Complete' : s.inst_pay === 'Partially' ? 'Partially' : 'Pending') as any,
            }));
            setSites(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Assam installed sites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstalledSites();
  }, [loadInstalledSites]);

  const visibleCols = columns.filter((c) => c.visible);
  const toggleColumn = (key: string) => setColumns((p) => p.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return sites;
    return sites.filter((r) =>
      [r.applicantName, r.district, r.village, r.block, r.vfdNo, r.inverterNo, r.remarks].some((v) => (v || '').toLowerCase().includes(t)),
    );
  }, [q, sites]);

  /* paging */
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

  /* export */
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const handleExportCSV = () => {
    const cols = columns.filter((c) => c.visible && c.key !== 'action');
    const rows = filtered.map((r) =>
      cols.map((c) => esc(c.key === 'moduleSerialNos' ? r.moduleSerialNos.join(', ') : (r as unknown as Record<string, unknown>)[c.key])).join(','),
    );
    const blob = new Blob(['\uFEFF' + [cols.map((c) => esc(c.label)).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assam_SWP_Installations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCopy = () => {
    const text = filtered.map((r) => [r.srNo, r.applicantName, r.district, r.vfdNo, r.inverterNo, r.verifyStatus].join('\t')).join('\n');
    navigator.clipboard.writeText(text);
  };

  const triggerRefresh = () => {
    loadInstalledSites();
  };

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
const DOT: Record<Tone, string> = {
  success: 'var(--ax-success-500)',
  warning: 'var(--ax-warning-500)',
  danger: 'var(--ax-danger-500)',
  info: 'var(--ax-accent)',
  neutral: 'var(--ax-text-subtle)',
};

const kpis: { cls: string; icon: ReactElement; label: string; parts: { label: string; value: number | string; tone: Tone }[] }[] = [
  { cls: 'c1', icon: ICON.layers, label: 'Total Sites', parts: [
    { label: 'Total Assign', value: installDetail.total ?? swp.site_count, tone: 'info' },
  ] },
  { cls: 'c2', icon: ICON.bookmark, label: 'Installation Status', parts: [
    { label: 'Complete', value: installDetail.complete ?? swp.complete, tone: 'success' },
    { label: 'Pending', value: installDetail.pending ?? swp.pending, tone: 'warning' },
  ] },
  { cls: 'c3', icon: ICON.shield, label: 'Installation Verify', parts: [
    { label: 'Complete', value: installDetail.verify_approved ?? swp.verify_approved, tone: 'success' },
    { label: 'Pending', value: installDetail.verify_pending ?? swp.verify_pending, tone: 'warning' },
    { label: 'Reject', value: installDetail.verify_reject ?? swp.verify_reject, tone: 'danger' },
  ] },
  { cls: 'c4', icon: ICON.doc, label: 'Document Verify', parts: [
    { label: 'Complete', value: installDetail.doc_approved ?? swp.doc_approved, tone: 'success' },
    { label: 'Pending', value: installDetail.doc_pending ?? swp.doc_pending, tone: 'warning' },
    { label: 'Reject', value: installDetail.doc_reject ?? swp.doc_reject, tone: 'danger' },
  ] },
  { cls: 'c1', icon: ICON.claim, label: 'Claim Verify', parts: [
    { label: 'Complete', value: installDetail.claim_approved ?? swp.inst_claim_approved, tone: 'success' },
    { label: 'Pending', value: installDetail.claim_pending ?? swp.inst_claim_raised, tone: 'warning' },
    { label: 'Reject', value: installDetail.claim_reject ?? swp.inst_claim_reject, tone: 'danger' },
  ] },
  { cls: 'c2', icon: ICON.pay, label: 'Payment Status', parts: [
    { label: 'Complete', value: installDetail.paid ?? swp.inst_pay_complete, tone: 'success' },
    { label: 'Partially', value: installDetail.partially ?? swp.inst_pay_partially, tone: 'info' },
    { label: 'Pending', value: Math.max(0, (installDetail.total ?? swp.site_count) - ((installDetail.paid ?? 0) + (installDetail.partially ?? 0))), tone: 'warning' },
  ] },
];

  const renderCell = (key: string, r: InstallationRecord) => {
    switch (key) {
      case 'srNo': return <td key={key} className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{r.srNo}</td>;
      case 'district': return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{r.district}</td>;
      case 'applicantName': return <td key={key} className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{r.applicantName}</td>;
      case 'vfdNo':
      case 'inverterNo': return <td key={key} className="ax-table__td ax-mono" style={{ color: 'var(--ax-text-muted)' }}>{r[key]}</td>;
      case 'moduleSerialNos':
        return (
          <td key={key} className="ax-table__td">
            <ul className="ax-mono" style={{ margin: 0, paddingInlineStart: 'var(--ax-space-4)', fontSize: 'var(--ax-text-xs)' }}>
              {r.moduleSerialNos.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </td>
        );
      case 'farmerWithModuleImg':
      case 'inverterVfdFarmerImg':
      case 'runningWaterFarmerImg': {
        const src = r[key] as string;
        const title = `${IMG_COLS[key]} — ${r.applicantName}`;
        return (
          <td key={key} className="ax-table__td">
            <button type="button" onClick={() => setPreview({ title, src })} aria-label={`View ${title}`} style={{ padding: 0, border: 0, background: 'none', cursor: 'zoom-in', display: 'inline-flex' }}>
              <img src={src} alt={IMG_COLS[key]} style={{ width: 84, height: 72, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
            </button>
          </td>
        );
      }
      case 'remarks':
      case 'verifyRemarks':
      case 'docVerifyRemarks':
        return <td key={key} className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)', maxWidth: 200, whiteSpace: 'normal' }}>{r[key] || '—'}</td>;
      case 'verifyStatus':
      case 'documentStatus':
      case 'claimStatus':
      case 'paymentStatus':
        return <td key={key} className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${tone(r[key] as string)}`}><span className="ax-badge__dot" />{r[key]}</span></td>;
      case 'action': return <td key={key} className="ax-table__td" style={{ textAlign: 'center' }}><RowActions item={r} /></td>;
      default: return <td key={key} className="ax-table__td">{(r as unknown as Record<string, string>)[key]}</td>;
    }
  };

  return (
    <>
      <PageHead
        title="View Assam SWP Installation"
        subtitle="Installation records, verification, claim and payment status"
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={triggerRefresh} aria-label="Refresh data" aria-busy={loading}>
              <span className="ax-btn__icon">{ICON.refresh}</span>
            </button>
            <Link to="/assam/swp/installation-site" className="ax-btn ax-btn--primary">
              <span className="ax-btn__icon">{ICON.plus}</span>
              <span className="ax-btn__label">Add SWP Install Site</span>
            </Link>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI CARDS */}
    {/* KPI CARDS */}
{kpis.map((k) => (
  <div
    key={k.label}
    className="ax-card ax-kpi ax-col--4"
    role="region"
    aria-label={`${k.label}: ${k.parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}
  >
    <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
        <span className={`ax-kpi__icon ax-kpi__icon--${k.cls}`}>{k.icon}</span>
        <div className="ax-kpi__label" style={{ margin: 0 }}>{k.label}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${k.parts.length}, minmax(0, 1fr))`, gap: 'var(--ax-space-3)' }}>
        {k.parts.map((p) => (
          <div
            key={p.label}
            style={{ padding: 'var(--ax-space-3)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', minWidth: 0 }}
          >
            <div
              className="ax-num"
              style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', lineHeight: 1.1 }}
            >
              {p.value ?? 0}
            </div>
            <div className="ax-cluster" style={{ gap: 6, marginTop: 6, flexWrap: 'nowrap', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <i style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[p.tone], flex: '0 0 auto' }} />
              <span className="ax-truncate">{p.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
))}

        {/* DATA TABLE */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assam SWP installation table">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Assam SWP Installation</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{filtered.length} of {sites.length} records</p>
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
              <caption className="ax-visually-hidden">Assam SWP installation records</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => (
                    <th key={c.key} className="ax-table__th" scope="col" style={c.key === 'action' ? { textAlign: 'center' } : undefined}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading ? (
                  [0, 1, 2, 3, 4, 5].map((n) => (
                    <tr key={n} className="ax-table__row">
                      <td className="ax-table__td" colSpan={visibleCols.length}>
                        <div className="ax-skeleton ax-skeleton--line" style={{ width: '100%' }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  paged.map((item) => (
                    <tr key={item.id} className="ax-table__row">
                      {visibleCols.map((c) => renderCell(c.key, item))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
              <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}>
                <span className="ax-avatar__icon" style={{ width: 28, height: 28, display: 'inline-flex' }}>{ICON.search}</span>
              </span>
              <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No matches</h3>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>No installation records match your search.</p>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => { setQ(''); setPage(1); }}>Clear search</button>
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

      {/* IMAGE PREVIEW (template card inside a token-based backdrop) */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          onClick={() => setPreview(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setPreview(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: 'var(--ax-space-5)', background: 'color-mix(in oklab, var(--ax-text-strong) 55%, transparent)' }}
        >
          <section className="ax-card" style={{ maxWidth: 640, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-card__header">
              <div className="ax-card__titles"><h2 className="ax-card__title">{preview.title}</h2></div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setPreview(null)} aria-label="Close preview" autoFocus>
                <span className="ax-btn__icon">{ICON.close}</span>
              </button>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, textAlign: 'center' }}>
              <img src={preview.src} alt={preview.title} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 'var(--ax-radius-md)' }} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default ViewInstallation;
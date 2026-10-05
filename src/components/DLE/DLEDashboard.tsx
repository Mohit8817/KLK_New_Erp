import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../shell/PageHead';
import { ApexChart } from '../charts/ApexChart';
import { Pagination, usePagination,  TableExportToolbar, type ExportColumn } from '../../common';
import { SearchInput } from '../../common/search/SearchInput';
// Company-filtered DLE service (path apne folder structure ke hisaab se adjust karna)
import { dleService, extractList, filterByCompany } from '../../services/dleServices';

/* ───────── Config ───────── */
// A DLE is "Active" if it was created/updated in the last N days
const ACTIVE_WINDOW_DAYS = 30;
// approval_status: 0 = pending, 1 = approved, 2 = rejected
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;

// Light shades for bar charts
const LIGHT_BLUE = '#2f7df2';
const LIGHT_GREEN = '#86DDB2';

// A registered DLE from /api/admin/users
interface UserRow {
  id: string;
  user_id: string;
  name: string;
  state: string;
  district: string;
  approval_status: number;
  created_at: string;
  updated_at: string;
}
interface StateStat { state: string; dles: number; activeDles: number; pending: number; approved: number; rejected: number }
interface DistrictStat { state: string; district: string; activeDles: number; totalDles: number }

// Takes an already-extracted (and company-filtered) list
const toUsers = (list: any[]): UserRow[] =>
  list
    .map((u: any) => ({
      id: String(u.id ?? u.user_id ?? ''),
      user_id: String(u.user_id ?? u.id ?? ''),
      name: String(u.name ?? ''),
      state: String(u.state ?? u.state_name ?? 'Unknown').trim(),
      district: String(u.district ?? u.district_name ?? 'Unknown').trim().toUpperCase(),
      approval_status: Number(u.approval_status ?? 0),
      created_at: String(u.created_at ?? ''),
      updated_at: String(u.updated_at ?? u.created_at ?? ''),
    }))
    .filter((u) => u.id !== '');

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const num = (x: number) => x.toLocaleString('en-IN');
const pad = (x: number) => String(x).padStart(2, '0');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Responsive chart height (smaller on phones)
const useChartHeight = (desktop: number, mobile: number) => {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pick);
  useEffect(() => {
    const onResize = () => setH(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, mobile]);
  return h;
};

// Scoped styling: spacing + responsive layout + right-aligned card actions
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Card header: title left, actions (search / export) in RIGHT corner */
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: wrap; align-items: flex-start;
    justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 0; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: wrap; gap: 8px; max-width: 100%;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-end; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ax-table { min-width: 480px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  /* Filter bar */
  .solar-erp-page .dle-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .dle-filter-item select { width: 165px; }

  /* Tablet */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
  }

  /* Mobile */
  @media (max-width: 760px) {
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .dle-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .dle-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: flex-end; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; justify-content: flex-end; }

         .ax-card__title {
    font-family: var(--ax-font-display);
    font-size: var(--ax-text-md);
    line-height: var(--ax-leading-md);
  }
  }

  /* Small phones: KPI cards 1 column */
  @media (max-width: 420px) {
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons (Tabler style) ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);

/* ───────── KPI card ───────── */
interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  onClick?: () => void;
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};
function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, onClick }: KpiProps) {
  const t = TONE[tone];
  return (
    <div
      className="ax-card ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg)',
        background: 'var(--ax-bg-surface)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {spark && spark.length > 1 && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <ApexChart key={`${label}-${spark.join(',')}`} type="line" sparkline tooltip={false} height={26} color={t.apex} series={[{ name: label, data: spark }]} style={{ minHeight: 26, width: 68 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

// Dashboard click-through target: make sure your router registers this component at /dle/users.
const DLE_USERS_ROUTE = '/dle/users';

export function DleDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [selectedState, setSelectedState] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [query, setQuery] = useState('');
  const [hiddenStateColumns, setHiddenStateColumns] = useState<string[]>([]);
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // Login user ki company_id se match hone wale DLE users hi load hote hain
  const load = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await dleService.getAdminUsers();
      setUsers(toUsers(filterByCompany(extractList(res))));
    } catch (e: any) {
      setUsers([]);
      setErrors([`DLE Users: ${e?.message ?? 'failed to load'}`]);
    }
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ───────── Filter options & filtered rows ───────── */
  const stateOptions = useMemo(
    () => [...new Set(users.map((u) => u.state))].sort(),
    [users]
  );
  const districtOptions = useMemo(
    () => [...new Set(users.filter((u) => selectedState === 'All' || u.state === selectedState).map((u) => u.district))].sort(),
    [users, selectedState]
  );
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (selectedState === 'All' || u.state === selectedState) &&
          (selectedDistrict === 'All' || u.district === selectedDistrict)
      ),
    [users, selectedState, selectedDistrict]
  );
  const filtersActive = selectedState !== 'All' || selectedDistrict !== 'All';

  /* Dashboard -> View Data navigation.
     Currently selected State/District filters are carried over automatically,
     explicit params override them. Query params keep refresh/back/share working. */
  const openUsers = (params: Record<string, string> = {}) => {
    const merged: Record<string, string> = { state: selectedState, district: selectedDistrict, ...params };
    const search = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== 'All') search.set(key, value);
    });
    const qs = search.toString();
    navigate(`${DLE_USERS_ROUTE}${qs ? `?${qs}` : ''}`);
  };

  const openState = (state: string) => openUsers({ state, district: 'All' });
  const openDistrict = (state: string, district: string) => openUsers({ state, district });
  const openApproval = (approval: string) => openUsers({ approval });

  /* ───────── Derived stats ───────── */
  const { kpis, stateStats, districtStats, daily, recent } = useMemo(() => {
    const now = new Date();
    const cutoff = Date.now() - ACTIVE_WINDOW_DAYS * 86400000;
    const createdTs = (u: UserRow) => {
      const t = Date.parse(u.created_at);
      return Number.isNaN(t) ? null : t;
    };
    // Active = created/updated in last N days
    const isActive = (u: UserRow) => {
      const t = Date.parse(u.updated_at || u.created_at);
      return !Number.isNaN(t) && t >= cutoff;
    };
    const isApproved = (u: UserRow) => u.approval_status === STATUS_APPROVED;
    const isRejected = (u: UserRow) => u.approval_status === STATUS_REJECTED;
    const isPending = (u: UserRow) => !isApproved(u) && !isRejected(u);

    const stateMap = new Map<string, StateStat>();
    const distMap = new Map<string, DistrictStat>();

    filteredUsers.forEach((u) => {
      let s = stateMap.get(u.state);
      if (!s) {
        s = { state: u.state, dles: 0, activeDles: 0, pending: 0, approved: 0, rejected: 0 };
        stateMap.set(u.state, s);
      }
      const dk = `${u.state}|${u.district}`;
      let d = distMap.get(dk);
      if (!d) {
        d = { state: u.state, district: u.district, activeDles: 0, totalDles: 0 };
        distMap.set(dk, d);
      }

      s.dles += 1;
      d.totalDles += 1;
      if (isActive(u)) {
        s.activeDles += 1;
        d.activeDles += 1;
      }
      if (isApproved(u)) s.approved += 1;
      else if (isRejected(u)) s.rejected += 1;
      else s.pending += 1;
    });

    const stateStats: StateStat[] = [...stateMap.values()].sort((a, b) => b.dles - a.dles);
    const districtStats: DistrictStat[] = [...distMap.values()].sort(
      (a, b) => b.activeDles - a.activeDles || b.totalDles - a.totalDles
    );

    // Last 14 days daily series (sparklines)
    const daily = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - i));
      const dr = filteredUsers.filter((u) => {
        const t = createdTs(u);
        return t !== null && sameDay(new Date(t), d);
      });
      // Users whose last activity (updated_at) fell on this day
      const activeCount = filteredUsers.filter((u) => {
        const t = Date.parse(u.updated_at || u.created_at);
        return !Number.isNaN(t) && sameDay(new Date(t), d);
      }).length;
      return {
        dles: dr.length,
        active: activeCount,
        approved: dr.filter(isApproved).length,
        rejected: dr.filter(isRejected).length,
        pending: dr.filter(isPending).length,
      };
    });

    const recent = filteredUsers
      .map((u) => ({ u, t: createdTs(u) }))
      .filter((x): x is { u: UserRow; t: number } => x.t !== null)
      .sort((a, b) => b.t - a.t)
      .slice(0, 6);

    const approved = filteredUsers.filter(isApproved).length;
    const rejected = filteredUsers.filter(isRejected).length;

    return {
      stateStats,
      districtStats,
      daily,
      recent,
      kpis: {
        states: stateStats.length,
        dles: filteredUsers.length,
        activeDles: filteredUsers.filter(isActive).length,
        pending: filteredUsers.length - approved - rejected,
        approved,
        rejected,
        districts: distMap.size,
        todayDles: daily[13].dles,
      },
    };
  }, [filteredUsers]);

  /* ───────── District table (search + pagination) ───────── */
  const tableDistricts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return districtStats.filter(
      (d) => !q || d.district.toLowerCase().includes(q) || d.state.toLowerCase().includes(q)
    );
  }, [districtStats, query]);
  const {
    paginatedData: pagedDistricts,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 15 });

  // Filter / search badalne par page 1 par wapas jao
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedState, selectedDistrict]);

  const chartDistricts = districtStats.slice(0, 15);

  const districtCols: ExportColumn<DistrictStat>[] = [
    { header: 'District', accessor: 'district' },
    { header: 'State', accessor: 'state' },
    { header: 'Active DLE', accessor: 'activeDles' },
    { header: 'Total DLE', accessor: 'totalDles' },
  ];
  const stateCols: ExportColumn<StateStat>[] = [
    { header: 'State', accessor: 'state' },
    { header: 'Total DLE', accessor: 'dles' },
    { header: 'Active DLE', accessor: 'activeDles' },
    { header: 'Pending', accessor: 'pending' },
    { header: 'Approved', accessor: 'approved' },
    { header: 'Rejected', accessor: 'rejected' },
  ];

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((column, index) => ({
      key: `${column.header}-${index}`,
      label: column.header,
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const escapeExportValue = (value: unknown) => String(value ?? '');

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) =>
    typeof column.accessor === 'function'
      ? column.accessor(row)
      : (row as Record<string, unknown>)[column.accessor as string];

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

  const exportToCSV = <T,>(data: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const csvRows = [
      columns.map((column) => column.header),
      ...data.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = csvRows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(data: T[], columns: ExportColumn<T>[]) => {
    if (!data.length || !columns.length) return;
    const textToCopy = [
      columns.map((column) => column.header).join('\t'),
      ...data.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const exportToExcel = <T,>(data: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(data: T[], columns: ExportColumn<T>[], title: string) => {
    if (!data.length || !columns.length) return;
    const pdfRows = data.map((row) => columns.map((column) => escapeHtml(escapeExportValue(getExportValue(row, column)))));
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${pdfRows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const stateToolbarColumns = makeToolbarColumns(stateCols, hiddenStateColumns);
  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);

  const stamp = new Date().toISOString().slice(0, 10);
  const dash = (v: number) => (loading && !users.length ? '…' : num(v));
  const pctApproved = pctOf(kpis.approved, kpis.dles);
  const pctPending = pctOf(kpis.pending, kpis.dles);
  const pctRejected = pctOf(kpis.rejected, kpis.dles);
  const pctActive = pctOf(kpis.activeDles, kpis.dles);
  const stateNames = stateStats.map((s) => s.state).join(', ') || 'States covered';

  const milestones = [
    { label: '1. Registered DLEs', v: kpis.dles, of: kpis.dles, color: 'var(--ax-viz-emerald)' },
    { label: '2. Approved', v: kpis.approved, of: kpis.dles, color: 'var(--ax-accent)' },
    { label: '3. Pending Approval', v: kpis.pending, of: kpis.dles, color: 'var(--ax-viz-amber)' },
    { label: '4. Rejected', v: kpis.rejected, of: kpis.dles, color: 'var(--ax-viz-red)' },
    { label: `5. Active DLE (last ${ACTIVE_WINDOW_DAYS} days)`, v: kpis.activeDles, of: kpis.dles, color: 'var(--ax-viz-cyan)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="DLE Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            DLE registrations across states · Active = updated in last {ACTIVE_WINDOW_DAYS} days
            {updatedAt ? ` · last updated ${fmtTime(updatedAt)}` : ''}
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> States: {dash(kpis.states)}
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={load} disabled={loading}>
              {ICON_REFRESH}
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {errors.length > 0 && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Some data could not be loaded.</b> {errors.join(' · ')}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={load}>Retry</button>
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="DLE Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)', borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="dle-state-select" style={labelStyle}>State:</label>
                <select
                  id="dle-state-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict('All'); }}
                >
                  <option value="All">All States ({stateOptions.length})</option>
                  {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="dle-district-select" style={labelStyle}>District:</label>
                <select
                  id="dle-district-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {filtersActive && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => { setSelectedState('All'); setSelectedDistrict('All'); }}>
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(kpis.dles)}</b> DLEs · Active window: <b style={{ color: 'var(--ax-text-strong)' }}>{ACTIVE_WINDOW_DAYS} days</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="DLE Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">DLE Management System</p>
              <h2 className="ax-card__title">Welcome to DLE Dashboard</h2>
              <p className="ax-welcome__lede">
                DLE overview: <b>{dash(kpis.dles)} DLEs</b> across <b>{dash(kpis.states)} states</b> and <b>{dash(kpis.districts)} districts</b>.
                <b> {dash(kpis.activeDles)} ({pctActive}%)</b> active in the last {ACTIVE_WINDOW_DAYS} days, with <b>{dash(kpis.approved)}</b> of <b>{dash(kpis.dles)}</b> DLEs approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total States</dt>
                <dd className="ax-num">{dash(kpis.states)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(kpis.districts)} Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Total DLE</dt>
                <dd className="ax-num">{dash(kpis.dles)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>Registered DLEs</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Active DLE</dt>
                <dd className="ax-num">{dash(kpis.activeDles)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{pctActive}% of DLEs</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Pending</dt>
                <dd className="ax-num">{dash(kpis.pending)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(kpis.approved)} Approved</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. KPI Cards */}
        <KpiCard icon={I_PIN} tone="accent" label="Total States" value={dash(kpis.states)} sub={stateNames} onClick={() => openUsers()} />
        <KpiCard icon={I_USERS} tone="cyan" label="Total DLE" value={dash(kpis.dles)} unit="Nos." sub="Registered DLEs" spark={daily.map((d) => d.dles)} onClick={() => openUsers()} />
        <KpiCard icon={I_BOLT} tone="cyan" label="Active DLE" value={dash(kpis.activeDles)} unit="Nos." sub={`Active in last ${ACTIVE_WINDOW_DAYS} days`} badge={`${pctActive}%`} spark={daily.map((d) => d.active)} onClick={() => openUsers({ activity: 'active' })} />
        <KpiCard icon={I_LIST} tone="accent" label="Registered Today" value={dash(kpis.todayDles)} unit="Nos." sub="New DLEs today" spark={daily.map((d) => d.dles)} onClick={() => openUsers({ created: 'today' })} />
        <KpiCard icon={I_CLOCK} tone="amber" label="Pending" value={dash(kpis.pending)} unit="Nos." sub="Awaiting approval" badge={`${pctPending}%`} spark={daily.map((d) => d.pending)} onClick={() => openApproval('Pending')} />
        <KpiCard icon={I_DONE} tone="emerald" label="Approved" value={dash(kpis.approved)} unit="Nos." sub="Approved DLEs" badge={`${pctApproved}%`} spark={daily.map((d) => d.approved)} onClick={() => openApproval('Approved')} />
        <KpiCard icon={I_X} tone="red" label="Rejected" value={dash(kpis.rejected)} unit="Nos." sub="Rejected DLEs" badge={`${pctRejected}%`} spark={daily.map((d) => d.rejected)} onClick={() => openApproval('Rejected')} />
        <KpiCard icon={I_PIN} tone="violet" label="Districts" value={dash(kpis.districts)} sub="With registered DLEs" onClick={() => openUsers()} />

        {/* 5. Charts: DLE State Wise + Approval Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="DLE state wise">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">DLE State Wise</h2>
              <p className="ax-card__subtitle">{dash(kpis.dles)} DLE across {dash(kpis.states)} states</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'DLE', c: LIGHT_BLUE },
                  { l: 'Active DLE', c: LIGHT_GREEN },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`state-${chartH}-${stateStats.map((s) => `${s.state}${s.dles}${s.activeDles}`).join('-')}`}
              type="bar"
              height={chartH}
              legend="none"
              ariaLabel="DLE and Active DLE by state"
              series={[
                { name: 'DLE', data: stateStats.map((s) => s.dles) },
                { name: 'Active DLE', data: stateStats.map((s) => s.activeDles) },
              ]}
              apex={{
                colors: [LIGHT_BLUE, LIGHT_GREEN],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                xaxis: { categories: stateStats.map((s) => s.state) },
                yaxis: { title: { text: 'Count', style: { color: 'var(--ax-text-muted)' } } },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const index = opts?.dataPointIndex;
                      const state = stateStats[index]?.state;
                      if (state) openState(state);
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Approval split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">DLE Distribution</span>
              <h2 className="ax-card__title">Approval Status</h2>
              <p className="ax-card__subtitle">Total {dash(kpis.dles)} DLEs</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`donut-${donutH}-${kpis.pending}-${kpis.approved}-${kpis.rejected}`}
              type="donut"
              height={donutH}
              legend="none"
              ariaLabel="Pending, approved and rejected DLEs"
              series={[kpis.pending, kpis.approved, kpis.rejected]}
              apex={{
                labels: ['Pending', 'Approved', 'Rejected'],
                colors: [cv('--ax-viz-amber'), cv('--ax-viz-emerald'), cv('--ax-viz-red')],
                stroke: { width: 0 },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const labels = ['Pending', 'Approved', 'Rejected'];
                      const label = labels[opts?.dataPointIndex];
                      if (label) openApproval(label);
                    },
                  },
                },
                plotOptions: {
                  pie: { donut: { size: '72%', labels: { show: true, name: { fontFamily: cv('--ax-font-sans') }, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'DLEs', formatter: () => num(kpis.dles) } } } },
                },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Pending', sub: 'Awaiting approval', v: kpis.pending, p: pctPending, color: 'var(--ax-viz-amber)' },
                { label: 'Approved', sub: 'Approved DLEs', v: kpis.approved, p: pctApproved, color: 'var(--ax-viz-emerald)' },
                { label: 'Rejected', sub: 'Rejected DLEs', v: kpis.rejected, p: pctRejected, color: 'var(--ax-viz-red)' },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)} ({s.p}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. District chart + Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise active DLE">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Active DLE</h2>
              <p className="ax-card__subtitle">Top 15 districts by active DLE · full list below</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(kpis.districts)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              key={`dist-${chartH}-${chartDistricts.map((d) => `${d.district}${d.activeDles}${d.totalDles}`).join('-')}`}
              type="bar"
              height={chartH}
              legend="top"
              ariaLabel="Active DLE by district"
              series={[
                { name: 'Active DLE', data: chartDistricts.map((d) => d.activeDles) },
                { name: 'Total DLE', data: chartDistricts.map((d) => d.totalDles) },
              ]}
              apex={{
                colors: [LIGHT_GREEN, LIGHT_BLUE],
                plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } },
                xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                yaxis: { title: { text: 'DLE (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                chart: {
                  events: {
                    dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                      const district = chartDistricts[opts?.dataPointIndex];
                      if (district) openDistrict(district.state, district.district);
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="DLE Progress">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">DLE Milestones</h2>
              <p className="ax-card__subtitle">Progress by approval stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = pctOf(m.v, m.of);
              return (
                <div key={m.label}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{num(m.v)} / {num(m.of)} ({p}%)</b>
                  </div>
                  <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} /></div></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. State summary table */}
        <section className="ax-card ax-col--12" role="region" aria-label="State summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Summary</span>
              <h2 className="ax-card__title">State Wise Summary</h2>
              <p className="ax-card__subtitle">DLE and approval status per state</p>
            </div>
            <div className="ax-card__actions">
                  <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search district or state…"
                  ariaLabel="Search districts"
                />
              <TableExportToolbar
                onCopy={() => copyToClipboard(stateStats, visibleColumns(stateCols, hiddenStateColumns))}
                onExportCSV={() => exportToCSV(stateStats, visibleColumns(stateCols, hiddenStateColumns), `DLE_State_Wise_${stamp}`)}
                onExportExcel={() => exportToExcel(stateStats, visibleColumns(stateCols, hiddenStateColumns), `DLE_State_Wise_${stamp}`)}
                onExportPDF={() => exportToPDF(stateStats, visibleColumns(stateCols, hiddenStateColumns), 'DLE State Wise')}
                columns={stateToolbarColumns}
                onToggleColumn={(key) =>
                  setHiddenStateColumns((prev) =>
                    prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
                  )
                }
              />
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total DLE</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Active DLE</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {stateStats.map((s) => (
                  <tr
                    key={s.state}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openState(s.state)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openState(s.state); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{s.state}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(s.dles)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{num(s.activeDles)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{num(s.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{num(s.approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red)' }}>{num(s.rejected)}</td>
                  </tr>
                ))}
                {!loading && stateStats.length === 0 && (
                  <tr><td className="ax-table__td" colSpan={6} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>No DLE data available.</td></tr>
                )}
                {stateStats.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(kpis.dles)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{num(kpis.activeDles)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{num(kpis.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{num(kpis.approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red)' }}>{num(kpis.rejected)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. District table + Recent activity */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Detail</span>
              <h2 className="ax-card__title">District Wise DLE</h2>
              <p className="ax-card__subtitle">Active and total DLE per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search district or state…"
                  ariaLabel="Search districts"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `DLE_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `DLE_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'DLE District Wise')}
                  columns={districtToolbarColumns}
                  onToggleColumn={(key) =>
                    setHiddenDistrictColumns((prev) =>
                      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
                    )
                  }
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Active DLE</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total DLE</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr
                    key={`${d.state}-${d.district}`}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDistrict(d.state, d.district)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDistrict(d.state, d.district); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{d.district}</td>
                    <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{d.state}</span></td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{num(d.activeDles)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(d.totalDles)}</td>
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr><td className="ax-table__td" colSpan={4} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>No districts match the filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left"><Pagination currentPage={currentPage} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[15, 25, 50, 100]} /></div>
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Recent Operational Activity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Recent Activity</span>
              <h2 className="ax-card__title">Recent DLE Activity</h2>
              <p className="ax-card__subtitle">Latest DLE registrations</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {recent.length === 0 ? (
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>{loading ? 'Loading…' : 'No recent activity.'}</div>
            ) : (
              <ul className="ax-timeline">
                {recent.map(({ u, t }) => {
                  const tone = u.approval_status === STATUS_APPROVED ? 'success' : u.approval_status === STATUS_REJECTED ? 'danger' : 'warning';
                  const status = u.approval_status === STATUS_APPROVED ? 'approved' : u.approval_status === STATUS_REJECTED ? 'rejected' : 'pending';
                  const d = new Date(t);
                  return (
                    <li key={`${u.id}-${t}`} className={`ax-timeline__item ax-timeline__item--${tone}`}>
                      <span className="ax-timeline__marker">
                        <i style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      </span>
                      <div className="ax-timeline__content">
                        <p className="ax-timeline__title">
                          <b style={{ color: 'var(--ax-text-strong)' }}>DLE {status}</b>
                        </p>
                        <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', marginBlock: '2px 4px' }}>
                          {u.name || `DLE #${u.user_id}`} · {u.state}
                        </p>
                        <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: '11px', color: 'var(--ax-text-subtle)' }}>
                          <span>District: {u.district}</span>
                          <span>{fmtDate(d)} · {fmtTime(d)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* State-wise DLE mini summary */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, verticalAlign: 'text-bottom', marginRight: 6 }}>{I_USERS}</span>
                  DLE Workforce Status
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{dash(kpis.activeDles)} Active</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {stateStats.map((s) => (
                  <button
                    key={s.state}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openState(s.state)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '4px 0', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)' }}>{s.state}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{num(s.activeDles)} / {num(s.dles)} DLE</b>
                  </button>
                ))}
                {stateStats.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading…' : 'No data.'}</span>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DleDashboard;
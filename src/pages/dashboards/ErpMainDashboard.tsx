import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import type { Layer, Map as LeafletMap, Path, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageHead } from '../../components/shell/PageHead';
import { SearchInput } from '../../common/search/SearchInput';
import { ApexChart } from '../../components/charts/ApexChart';
import { dleService } from '../../services/dleServices';

const num = (x: number) => x.toLocaleString('en-IN');

type Region = 'North' | 'East' | 'West' | 'South' | 'North-East';

interface StateItem {
  id: string;
  name: string;
  code: string;
  region: Region;
  dles: number;
  vendors: number;
  lat: number;
  lng: number;
  route: string;
}

const STATES_DATA: StateItem[] = [
  { id: 'kashmir', name: 'Kashmir', code: 'JK', region: 'North', dles: 8, vendors: 14, lat: 34.08, lng: 74.8, route: '/dle/dashboard' },
  { id: 'jammu', name: 'Jammu', code: 'JM', region: 'North', dles: 12, vendors: 22, lat: 32.73, lng: 74.86, route: '/dle/dashboard' },
  { id: 'himachal', name: 'Himachal Pradesh', code: 'HP', region: 'North', dles: 6, vendors: 11, lat: 31.1, lng: 77.17, route: '/dle/dashboard' },
  { id: 'haryana', name: 'Haryana', code: 'HR', region: 'North', dles: 14, vendors: 19, lat: 29.06, lng: 76.09, route: '/dle/dashboard' },
  { id: 'punjab', name: 'Punjab', code: 'PB', region: 'North', dles: 11, vendors: 18, lat: 31.15, lng: 75.34, route: '/dle/dashboard' },
  { id: 'up', name: 'Uttar Pradesh', code: 'UP', region: 'North', dles: 45, vendors: 68, lat: 26.85, lng: 80.95, route: '/dle/up/ssl/amc/view-assign-light' },
  { id: 'bihar', name: 'Bihar', code: 'BR', region: 'East', dles: 35, vendors: 42, lat: 25.6, lng: 85.14, route: '/dle/bihar/ssl/amc/view-assign-light' },
  { id: 'jharkhand', name: 'Jharkhand', code: 'JH', region: 'East', dles: 7, vendors: 12, lat: 23.61, lng: 85.28, route: '/dle/dashboard' },
  { id: 'goa', name: 'Goa', code: 'GA', region: 'West', dles: 3, vendors: 5, lat: 15.3, lng: 74.12, route: '/dle/dashboard' },
  { id: 'karnataka', name: 'Karnataka', code: 'KA', region: 'South', dles: 9, vendors: 16, lat: 15.32, lng: 75.71, route: '/dle/dashboard' },
  { id: 'assam', name: 'Assam', code: 'AS', region: 'North-East', dles: 18, vendors: 25, lat: 26.2, lng: 92.94, route: '/dle/dashboard' },
  { id: 'tripura', name: 'Tripura', code: 'TR', region: 'North-East', dles: 4, vendors: 6, lat: 23.94, lng: 91.99, route: '/dle/dashboard' },
  { id: 'arunachal', name: 'Arunachal Pradesh', code: 'AR', region: 'North-East', dles: 5, vendors: 8, lat: 28.22, lng: 94.73, route: '/dle/dashboard' },
];

/* TODO: replace with real per-state user counts from API */
const USERS_BY_STATE: Record<string, number> = {
  kashmir: 20, jammu: 30, himachal: 16, haryana: 34, punjab: 28,
  up: 120, bihar: 85, jharkhand: 18, goa: 8, karnataka: 22,
  assam: 40, tripura: 10, arunachal: 12,
};

/* TODO: replace with real per-state complaint counts from API */
const COMPLAINTS_BY_STATE: Record<string, number> = {
  kashmir: 12, jammu: 27, himachal: 8, haryana: 31, punjab: 19,
  up: 95, bihar: 74, jharkhand: 11, goa: 4, karnataka: 17,
  assam: 38, tripura: 7, arunachal: 6,
};

/* TODO: replace with real monthly complaint data from API */
/* months: Jan–Oct 2026 */
const MONTHLY_COMPLAINTS: Record<string, number[]> = {
  kashmir:    [2, 1, 2, 1, 1, 2, 1, 1, 1, 0],
  jammu:      [3, 4, 3, 2, 3, 3, 2, 3, 3, 1],
  himachal:   [1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
  haryana:    [4, 3, 4, 3, 3, 4, 3, 3, 3, 1],
  punjab:     [2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  up:         [10,12, 9,11,10,10, 9,10, 9, 5],
  bihar:      [8, 9, 8, 8, 7, 8, 8, 7, 7, 2],
  jharkhand:  [1, 1, 1, 1, 1, 1, 1, 1, 2, 0],
  goa:        [0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
  karnataka:  [2, 2, 2, 1, 2, 2, 1, 2, 2, 1],
  assam:      [4, 5, 4, 4, 4, 4, 4, 4, 5, 0],
  tripura:    [1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
  arunachal:  [1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
};

const COMPLAINT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const REGIONS: Array<'All' | Region> = ['All', 'North', 'East', 'West', 'South', 'North-East'];
const RECENT_KEY = 'klk_erp_recent_states';
const GALLERY_COUNT = 246;
const OPEN_COMPLAINTS = 18;
const MAP_HEIGHT = 640;

type ModuleKey = 'dle' | 'vendor' | 'gallery' | 'complaints';

/* ───────── Access Settings ───────── */
const ACCESS: { role: string; states: string[]; modules: Record<ModuleKey, boolean> } = {
  role: 'Operations Manager',
  states: ['up', 'bihar', 'haryana', 'punjab', 'jharkhand', 'assam', 'kashmir', 'goa', 'karnataka'],
  modules: { dle: true, vendor: true, gallery: true, complaints: false },
};
const hasStateAccess = (id: string) => ACCESS.states.includes(id);

type AccessFilter = 'all' | 'granted' | 'restricted';
const ACCESS_FILTERS: Array<{ key: AccessFilter; label: string }> = [
  { key: 'all', label: 'All Territories' },
  { key: 'granted', label: 'My Access' },
  { key: 'restricted', label: 'Restricted' },
];

/* ───────── 13 Distinct, Rich & Vibrant Colors (One per state) ───────── */
const STATE_COLORS: Record<string, string> = {
  kashmir: '#2563eb',
  jammu: '#0284c7',
  himachal: '#7c3aed',
  haryana: '#d97706',
  punjab: '#ea580c',
  up: '#db2777',
  bihar: '#0d9488',
  jharkhand: '#4f46e5',
  goa: '#e11d48',
  karnataka: '#16a34a',
  assam: '#0891b2',
  tripura: '#9333ea',
  arunachal: '#c026d3',
};
const stateColor = (id: string) => STATE_COLORS[id] ?? '#64748b';

/* ───────── Map Helpers ───────── */
const GEO_URL = '/geo/india-states.json';
const GEO_NAME: Record<string, string> = {
  kashmir: 'Jammu and Kashmir',
  jammu: 'Jammu and Kashmir',
  himachal: 'Himachal Pradesh',
  haryana: 'Haryana',
  punjab: 'Punjab',
  up: 'Uttar Pradesh',
  bihar: 'Bihar',
  jharkhand: 'Jharkhand',
  goa: 'Goa',
  karnataka: 'Karnataka',
  assam: 'Assam',
  tripura: 'Tripura',
  arunachal: 'Arunachal Pradesh',
};

const norm = (x?: string) => (x ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
const featName = (f: Feature) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = f.properties ?? {};
  return norm(p.NAME_1 ?? p.ST_NM ?? p.st_nm ?? p.name ?? p.NAME);
};
const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || 'currentColor';

interface GeoWork {
  names: string[];
  ids: string[];
  dles: number;
  vendors: number;
  open: boolean;
  color: string;
}

/* ───────── Icons (Tabler Clean SVGs) ───────── */
const svg = (children: ReactNode, cls?: string) => (
  <svg className={cls} style={cls ? undefined : { width: '100%', height: '100%' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const I_REFRESH = svg(<><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>, 'ax-btn__icon');
const I_GRID = svg(<><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M14 14h6v6h-6z" /></>, 'ax-btn__icon');
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>, 'ax-btn__icon');
const I_CHEV_R = svg(<path d="M9 6l6 6l-6 6" />, 'ax-btn__icon');
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_IMAGE = svg(<><path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M12 11v4" /><path d="M12 8h.01" /></>);
const I_LOCK = svg(<><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -6" /><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M8 11v-4a4 4 0 1 1 8 0v4" /></>);
const I_CLOSE = svg(<><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></>, 'ax-btn__icon');
const I_ARROW_UP_RIGHT = svg(<><path d="M17 7l-10 10" /><path d="M8 7l9 0l0 9" /></>);
const I_CHECK_CIRCLE = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_CHART = svg(<><path d="M3 3v18h18" /><path d="M9 9l3 3l4 -4l5 5" /></>);

const Icon = ({ size = 16, children, style }: { size?: number; children: ReactNode; style?: React.CSSProperties }) => (
  <span style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0, ...style }}>{children}</span>
);

const readRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && hasStateAccess(x)) : [];
  } catch {
    return [];
  }
};

/* shared inline styles for hero stat cards */
const HERO_STAT: React.CSSProperties = { background: 'var(--ax-bg-surface)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' };
const HERO_LABEL: React.CSSProperties = { fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 600, display: 'block' };
const HERO_VALUE: React.CSSProperties = { fontSize: '1.6rem', fontWeight: 800, color: 'var(--ax-text-strong)', display: 'block', lineHeight: 1.15, marginTop: 4 };
const HERO_SUB: React.CSSProperties = { fontSize: '10px', color: 'var(--ax-text-subtle)' };

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE DESIGN SYSTEM SPECIFICATION FOR ERP MAIN DASHBOARD
   Seamless adaptation across: Mobile (<640px) · Tablet (640-1024px) · Desktop (>1024px)
   ═══════════════════════════════════════════════════════════════ */
const DASHBOARD_RESPONSIVE_CSS = `
  /* Responsive grid container margin & gap */
  @media (max-width: 768px) {
    .ax-erp-main-grid {
      margin-top: -12px !important;
      gap: var(--ax-space-4) !important;
    }
  }

  /* 1. Executive Hero Command Banner */
  .ax-erp-hero-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: var(--ax-space-6);
    align-items: center;
  }
  .ax-erp-hero-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--ax-space-3);
  }

  @media (max-width: 1024px) {
    .ax-erp-hero-grid {
      grid-template-columns: 1fr;
      gap: var(--ax-space-4);
    }
  }

  @media (max-width: 640px) {
    .ax-erp-hero-banner {
      padding: var(--ax-space-4) var(--ax-space-4) !important;
    }
    .ax-erp-hero-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--ax-space-2);
    }
    .ax-erp-hero-stat-card {
      padding: var(--ax-space-3) var(--ax-space-3) !important;
    }
    .ax-erp-hero-stat-num {
      font-size: 1.35rem !important;
    }
  }

  @media (max-width: 400px) {
    .ax-erp-hero-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
  }

  /* 2. Core ERP Module Cards */
  .ax-erp-module-tile {
    min-height: 200px;
  }
  @media (max-width: 768px) {
    .ax-erp-module-tile {
      min-height: auto;
      padding: var(--ax-space-4) !important;
    }
  }

  /* 3. Territory Command Split: Map + State Directory */
  .ax-erp-map-split {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: var(--ax-space-5);
    align-items: start;
  }
  .ax-erp-leaflet-container {
    height: 620px;
    width: 100%;
  }
  .ax-erp-state-scroll {
    min-width: 0;
    max-height: 620px;
    overflow-y: auto;
    padding-right: 6px;
  }
  .ax-erp-state-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: var(--ax-space-3);
  }

  @media (max-width: 1024px) {
    .ax-erp-map-split {
      grid-template-columns: 1fr;
      gap: var(--ax-space-4);
    }
    .ax-erp-leaflet-container {
      height: 480px;
    }
    .ax-erp-state-scroll {
      max-height: 500px;
      padding-right: 0;
    }
  }

  @media (max-width: 640px) {
    .ax-erp-leaflet-container {
      height: 380px;
    }
    .ax-erp-state-scroll {
      max-height: 440px;
    }
  }

  @media (max-width: 460px) {
    .ax-erp-leaflet-container {
      height: 320px;
    }
    .ax-erp-state-cards-grid {
      grid-template-columns: 1fr;
      gap: var(--ax-space-2);
    }
  }

  /* 4. Quick Overview Rows */
  .ax-erp-quick-row {
    display: grid;
    grid-template-columns: 26px minmax(90px, 130px) 75px 1fr 50px 20px;
    align-items: center;
    gap: 12px;
    padding: var(--ax-space-3) var(--ax-space-3);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .ax-erp-quick-bar {
    display: block;
  }
  .ax-erp-quick-sub {
    display: inline;
  }

  @media (max-width: 768px) {
    .ax-erp-quick-row {
      grid-template-columns: 22px minmax(80px, 1fr) auto 40px 18px;
      gap: 8px;
    }
    .ax-erp-quick-bar {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .ax-erp-quick-row {
      grid-template-columns: 20px 1fr auto 16px;
      gap: 6px;
      padding: var(--ax-space-2) var(--ax-space-2);
    }
    .ax-erp-quick-sub {
      display: none;
    }
  }

  /* 5. Complaints Wave KPIs */
  .ax-erp-wave-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--ax-space-3);
    padding: var(--ax-space-3) 0 var(--ax-space-4);
  }

  @media (max-width: 860px) {
    .ax-erp-wave-kpis {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--ax-space-2);
    }
  }

  @media (max-width: 440px) {
    .ax-erp-wave-kpis {
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .ax-erp-wave-kpi-item {
      padding: 8px 10px !important;
    }
  }

  /* 6. Card Header Responsive */
  @media (max-width: 640px) {
    .ax-erp-card-header-responsive {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: var(--ax-space-3) !important;
    }
    .ax-erp-header-actions-wrap {
      flex-wrap: wrap !important;
      gap: var(--ax-space-2) !important;
      width: 100% !important;
    }
    .ax-erp-header-actions-wrap > * {
      max-width: 100%;
    }
  }
`;

export function ErpMainDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<'All' | Region>('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [recentIds, setRecentIds] = useState<string[]>(readRecent);
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const [selectedComplaintState, setSelectedComplaintState] = useState<string>('all');

  /* total users (from /api/admin/users) */
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);

  /* hover link: state cards/rows <-> map */
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [tick, setTick] = useState(0);
  const layersRef = useRef<Map<string, Path[]>>(new Map());

  const notify = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4500);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  /* fetch total users */
  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;

    dleService
      .getCompanyAdminUsers(ctrl.signal) // login user ki company_id ke hisaab se filtered array
      .then((list) => { if (alive) setTotalUsers(list.length); })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        if (alive) setUsersError(true);
      })
      .finally(() => { if (alive) setUsersLoading(false); });

    return () => { alive = false; ctrl.abort(); };
  }, []);

  const workByGeo = useMemo(() => {
    const m = new Map<string, GeoWork>();
    STATES_DATA.forEach((s) => {
      const k = norm(GEO_NAME[s.id]);
      const c = m.get(k) ?? { names: [], ids: [], dles: 0, vendors: 0, open: false, color: stateColor(s.id) };
      c.names.push(s.name);
      c.ids.push(s.id);
      c.open = c.open || hasStateAccess(s.id);
      c.dles += s.dles;
      c.vendors += s.vendors;
      m.set(k, c);
    });
    return m;
  }, []);

  const totals = useMemo(
    () => ({
      states: workByGeo.size,
      dles: STATES_DATA.reduce((a, s) => a + s.dles, 0),
      vendors: STATES_DATA.reduce((a, s) => a + s.vendors, 0),
    }),
    [workByGeo]
  );

  const access = useMemo(() => {
    const granted = STATES_DATA.filter((s) => hasStateAccess(s.id));
    const geoOpen = [...workByGeo.values()].filter((w) => w.open).length;
    return {
      grantedCount: granted.length,
      restrictedCount: STATES_DATA.length - granted.length,
      geoOpen,
      modulesOpen: Object.values(ACCESS.modules).filter(Boolean).length,
      modulesTotal: Object.keys(ACCESS.modules).length,
    };
  }, [workByGeo]);

  const regionCount = useMemo(() => {
    const m: Record<string, number> = { All: STATES_DATA.length };
    STATES_DATA.forEach((s) => { m[s.region] = (m[s.region] ?? 0) + 1; });
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATES_DATA
      .filter((s) => {
        const ok = hasStateAccess(s.id);
        return (region === 'All' || s.region === region)
          && (accessFilter === 'all' || (accessFilter === 'granted' ? ok : !ok))
          && (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
      })
      .sort((a, b) => Number(hasStateAccess(b.id)) - Number(hasStateAccess(a.id)) || (b.dles + b.vendors) - (a.dles + a.vendors));
  }, [query, region, accessFilter]);

  const recentStates = useMemo(
    () => recentIds.map((id) => STATES_DATA.find((s) => s.id === id)).filter((s): s is StateItem => !!s).slice(0, 4),
    [recentIds]
  );

  const borderCol = useMemo(() => cssVar('--ax-border'), []);

  useEffect(() => {
    let alive = true;
    fetch(GEO_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: FeatureCollection) => { if (alive) setGeo(d); })
      .catch(() => { if (alive) { setGeo(null); setGeoFailed(true); } });
    return () => { alive = false; };
  }, []);

  const openState = useCallback((s: StateItem) => {
    if (!hasStateAccess(s.id)) {
      notify(`${s.name}: Access restricted. Contact system administrator.`);
      return;
    }
    const next = [s.id, ...recentIds.filter((id) => id !== s.id)].slice(0, 4);
    setRecentIds(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    navigate(s.route);
  }, [navigate, recentIds, notify]);

  const openModule = useCallback((key: ModuleKey, label: string, route: string) => {
    if (!ACCESS.modules[key]) {
      notify(`${label}: Access restricted. Contact system administrator.`);
      return;
    }
    navigate(route);
  }, [navigate, notify]);

  const openRef = useRef(openState);
  openRef.current = openState;

  // Map polygon style - Clean subtle borders
  const styleOfWork = useCallback((w?: GeoWork): PathOptions => {
    if (!w) return { color: 'rgba(148, 163, 184, 0.4)', weight: 0.8, fillColor: 'transparent', fillOpacity: 0 };
    return w.open
      ? { color: w.color, weight: 1.2, fillColor: w.color, fillOpacity: 0.38 }
      : { color: 'rgba(148, 163, 184, 0.35)', weight: 0.8, dashArray: '3 3', fillColor: w.color, fillOpacity: 0.12 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borderCol]);

  const geoStyle = useCallback(
    (f?: Feature): PathOptions => styleOfWork(f ? workByGeo.get(featName(f)) : undefined),
    [workByGeo, styleOfWork]
  );

  const onEachFeature = useCallback((f: Feature, layer: Layer) => {
    const key = featName(f);
    const w = workByGeo.get(key);
    if (!w) return;
    const list = layersRef.current.get(key) ?? [];
    list.push(layer as Path);
    layersRef.current.set(key, list);
    layer.on({
      mouseover: () => setHoverId(w.ids[0]),
      mouseout: () => setHoverId(null),
      click: () => {
        if (!w.open) { notify(`${w.names.join(' + ')}: Access restricted.`); return; }
        const s = STATES_DATA.find((x) => x.id === w.ids[0]);
        if (s) openRef.current(s);
      },
    });
  }, [workByGeo, notify]);

  const hoverState = useMemo(() => STATES_DATA.find((s) => s.id === hoverId) ?? null, [hoverId]);
  const hoverKey = hoverState ? norm(GEO_NAME[hoverState.id]) : null;

  /* map glow on hover */
  useEffect(() => {
    layersRef.current.forEach((layers, key) => {
      const w = workByGeo.get(key);
      if (!w) return;
      const hot = key === hoverKey;
      layers.forEach((layer) => {
        layer.setStyle(hot ? (w.open ? { color: w.color, weight: 2.2, fillOpacity: 0.65 } : { fillOpacity: 0.35 }) : styleOfWork(w));
        if (hot) layer.bringToFront();
      });
    });
  }, [hoverKey, geo, workByGeo, styleOfWork]);

  /* keep popup position in sync on zoom/move */
  useEffect(() => {
    if (!map) return;
    const f = () => setTick((t) => t + 1);
    map.on('zoomend moveend', f);
    return () => { map.off('zoomend moveend', f); };
  }, [map]);

  const popPos = useMemo(() => {
    if (!map || !hoverState) return null;
    const p = map.latLngToContainerPoint([hoverState.lat, hoverState.lng]);
    const size = map.getSize();
    return {
      x: Math.min(Math.max(p.x, 120), size.x - 120),
      y: Math.min(Math.max(p.y, 20), size.y - 20),
      below: p.y < 200,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hoverState, tick]);

  // KLK Logo map marker factory
  const createKlkMarkerIcon = useCallback((s: StateItem, isHot: boolean) => {
    const c = stateColor(s.id);
    const isLocked = !hasStateAccess(s.id);
    const size = isHot ? 32 : 26;
    const scale = isHot ? 'scale(1.18)' : 'scale(1)';
    const halo = isHot ? `0 0 0 4px color-mix(in oklab, ${c} 35%, transparent), 0 4px 12px rgba(0,0,0,0.3)` : '0 2px 6px rgba(0,0,0,0.2)';

    const html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #ffffff;
        border: 2px solid ${c};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${halo};
        transform: ${scale};
        transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
        cursor: ${isLocked ? 'not-allowed' : 'pointer'};
        opacity: ${isLocked ? 0.7 : 1};
      ">
        <img src="/logo-abbr.png" alt="KLK" style="width: 70%; height: 70%; object-fit: contain; pointer-events: none;" />
      </div>
    `;

    return divIcon({
      html,
      className: 'klk-map-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  // Top active states for distribution comparison chart
  const sortedChartStates = useMemo(() => {
    return [...STATES_DATA].sort((a, b) => (b.dles + b.vendors) - (a.dles + a.vendors));
  }, []);

  const chartStateCategories = useMemo(() => sortedChartStates.map((s) => s.code), [sortedChartStates]);
  const chartDleSeries = useMemo(() => sortedChartStates.map((s) => s.dles), [sortedChartStates]);
  const chartVendorSeries = useMemo(() => sortedChartStates.map((s) => s.vendors), [sortedChartStates]);
  const chartUserSeries = useMemo(
    () => sortedChartStates.map((s) => USERS_BY_STATE[s.id] ?? 0),
    [sortedChartStates]
  );
  const chartSeries = useMemo(
    () => [
      { name: 'DLE Partners', type: 'column' as const, data: chartDleSeries },
      { name: 'Vendors', type: 'column' as const, data: chartVendorSeries },
      { name: 'Users', type: 'column' as const, data: chartUserSeries },
    ],
    [chartDleSeries, chartVendorSeries, chartUserSeries]
  );

  const waveSeries = useMemo(() => {
    if (selectedComplaintState === 'all') {
      return sortedChartStates.slice(0, 6).map((s) => ({
        name: s.name,
        data: MONTHLY_COMPLAINTS[s.id] ?? Array(10).fill(0),
      }));
    }
    if (selectedComplaintState === 'all-13') {
      return sortedChartStates.map((s) => ({
        name: s.name,
        data: MONTHLY_COMPLAINTS[s.id] ?? Array(10).fill(0),
      }));
    }
    if (selectedComplaintState === 'total') {
      const totalPerMonth = COMPLAINT_MONTHS.map((_, i) =>
        Object.values(MONTHLY_COMPLAINTS).reduce((acc, arr) => acc + (arr[i] ?? 0), 0)
      );
      return [{ name: 'National Total Complaints', data: totalPerMonth }];
    }
    const stateObj = STATES_DATA.find((s) => s.id === selectedComplaintState);
    return [
      {
        name: stateObj ? stateObj.name : 'Complaints',
        data: MONTHLY_COMPLAINTS[selectedComplaintState] ?? Array(10).fill(0),
      },
    ];
  }, [selectedComplaintState, sortedChartStates]);

  return (
    <>
      <PageHead
        title="KLK ERP Central Dashboard"
        subtitle="National Clean Energy Operations, Field Partner Network & Supply Chain Hub"
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
            <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">
              <Icon size={12} style={{ marginRight: 4 }}>{I_CHECK_CIRCLE}</Icon>
              {ACCESS.role}
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh data" onClick={() => window.location.reload()}>
              {I_REFRESH}
            </button>
          </div>
        }
      />

      <style>{DASHBOARD_RESPONSIVE_CSS}</style>

      <div className="ax-dash-grid ax-erp-main-grid" style={{ marginTop: '-30px' }}>

        {/* ═══════ 1. EXECUTIVE HERO COMMAND BANNER ═══════ */}
        <section
          className="ax-card ax-col--12 ax-erp-hero-banner"
          role="region"
          aria-label="Executive Overview"
          style={{
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--ax-surface) 90%, var(--ax-accent) 10%), var(--ax-surface))',
            borderColor: 'var(--ax-border)',
            padding: 'var(--ax-space-5) var(--ax-space-6)',
          }}
        >
          <div className="ax-erp-hero-grid">
            <div>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-2)' }}>
                <span className="ax-badge ax-badge--solid ax-badge--pill" style={{ background: 'var(--ax-accent)', color: '#fff', fontSize: '11px', padding: '2px 8px' }}>
                  KLK Command Center
                </span>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 600 }}>
                  Active Territory Operations
                </span>
              </div>
              <h1 style={{ fontSize: 'var(--ax-text-2xl, 1.75rem)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                Enterprise Operations Portal
              </h1>
              <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0, lineHeight: 1.5, maxWidth: 580 }}>
                Centralized real-time access to <b>DLE installation teams</b>, <b>verified vendor network</b>, <b>service complaints desk</b>, and <b>state operations across {num(totals.states)} states</b>.
              </p>
            </div>

            <div className="ax-erp-hero-stats">
              <div className="ax-erp-hero-stat-card" style={HERO_STAT}>
                <span style={HERO_LABEL}>Active DLEs</span>
                <span className="ax-num ax-erp-hero-stat-num" style={HERO_VALUE}>{num(totals.dles)}</span>
                <small style={HERO_SUB}>Field Partners</small>
              </div>

              <div className="ax-erp-hero-stat-card" style={HERO_STAT}>
                <span style={HERO_LABEL}>Vendors</span>
                <span className="ax-num ax-erp-hero-stat-num" style={HERO_VALUE}>{num(totals.vendors)}</span>
                <small style={HERO_SUB}>Approved Network</small>
              </div>

              <div className="ax-erp-hero-stat-card" style={HERO_STAT}>
                <span style={HERO_LABEL}>Total States</span>
                <span className="ax-num ax-erp-hero-stat-num" style={HERO_VALUE}>{num(totals.states)}</span>
                <small style={HERO_SUB}>{access.geoOpen} Authorized</small>
              </div>

              {/* Total Users (from /api/admin/users) */}
              <div className="ax-erp-hero-stat-card" style={HERO_STAT}>
                <span style={HERO_LABEL}>Total Users</span>
                <span className="ax-num ax-erp-hero-stat-num" style={HERO_VALUE}>
                  {usersLoading ? '…' : usersError || totalUsers === null ? '—' : num(totalUsers)}
                </span>
                <small style={HERO_SUB}>{usersError ? 'Unavailable' : 'Registered Users'}</small>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ 2. CORE ERP MODULE TILES ═══════ */}

        {/* 2.1 DLE Module Card */}
        <div
          className="ax-card ax-col--3 ax-erp-module-tile"
          role="button"
          tabIndex={0}
          onClick={() => openModule('dle', 'DLE Management', '/dle/dashboard')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule('dle', 'DLE Management', '/dle/dashboard'); } }}
          style={{
            cursor: ACCESS.modules.dle ? 'pointer' : 'not-allowed',
            border: ACCESS.modules.dle ? '1px solid var(--ax-border)' : '1px dashed var(--ax-border)',
            borderRadius: 'var(--ax-radius-xl)',
            padding: 'var(--ax-space-5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--ax-bg-surface)',
            transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
            minHeight: 200,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-4)' }}>
              <span style={{ width: 48, height: 48, borderRadius: 'var(--ax-radius-lg)', background: 'color-mix(in oklab, var(--ax-viz-cyan) 16%, transparent)', color: 'var(--ax-viz-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26}>{I_BOLT}</Icon>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontWeight: 600 }}>Active Portal</span>
            </div>
            <h3 style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 6px' }}>
              DLE Operations
            </h3>
            <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', margin: 0, lineHeight: 1.4 }}>
              Light installation records, field staff survey verification & regular AMC support.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)', marginTop: 'var(--ax-space-4)' }}>
            <span className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)' }}>
              {num(totals.dles)} <small style={{ fontWeight: 400, color: 'var(--ax-text-muted)', fontSize: '11px' }}>Partners</small>
            </span>
            <span style={{ color: 'var(--ax-viz-cyan)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
              Launch Module <Icon size={14}>{I_ARROW_UP_RIGHT}</Icon>
            </span>
          </div>
        </div>

        {/* 2.2 Vendor Module Card */}
        <div
          className="ax-card ax-col--3 ax-erp-module-tile"
          role="button"
          tabIndex={0}
          onClick={() => openModule('vendor', 'Vendor Portal', '/vendor/dashboard')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule('vendor', 'Vendor Portal', '/vendor/dashboard'); } }}
          style={{
            cursor: ACCESS.modules.vendor ? 'pointer' : 'not-allowed',
            border: ACCESS.modules.vendor ? '1px solid var(--ax-border)' : '1px dashed var(--ax-border)',
            borderRadius: 'var(--ax-radius-xl)',
            padding: 'var(--ax-space-5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--ax-bg-surface)',
            transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
            minHeight: 200,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-4)' }}>
              <span style={{ width: 48, height: 48, borderRadius: 'var(--ax-radius-lg)', background: 'color-mix(in oklab, var(--ax-viz-violet) 16%, transparent)', color: 'var(--ax-viz-violet)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26}>{I_USERS}</Icon>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ background: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', color: 'var(--ax-viz-violet)', fontWeight: 600 }}>Active Portal</span>
            </div>
            <h3 style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 6px' }}>
              Vendor Network
            </h3>
            <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', margin: 0, lineHeight: 1.4 }}>
              Certified vendor onboarding, supplier documents, and state-wise stock allocation.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)', marginTop: 'var(--ax-space-4)' }}>
            <span className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)' }}>
              {num(totals.vendors)} <small style={{ fontWeight: 400, color: 'var(--ax-text-muted)', fontSize: '11px' }}>Vendors</small>
            </span>
            <span style={{ color: 'var(--ax-viz-violet)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
              Launch Module <Icon size={14}>{I_ARROW_UP_RIGHT}</Icon>
            </span>
          </div>
        </div>

        {/* 2.3 Complaints Module Card */}
        <div
          className="ax-card ax-col--3 ax-erp-module-tile"
          role="button"
          tabIndex={0}
          onClick={() => openModule('complaints', 'Complaints Desk', '/complaints')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule('complaints', 'Complaints Desk', '/complaints'); } }}
          style={{
            cursor: ACCESS.modules.complaints ? 'pointer' : 'not-allowed',
            border: ACCESS.modules.complaints ? '1px solid var(--ax-border)' : '1px dashed var(--ax-border)',
            borderRadius: 'var(--ax-radius-xl)',
            padding: 'var(--ax-space-5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--ax-bg-surface)',
            transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
            minHeight: 200,
            opacity: ACCESS.modules.complaints ? 1 : 0.85,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-4)' }}>
              <span style={{ width: 48, height: 48, borderRadius: 'var(--ax-radius-lg)', background: 'color-mix(in oklab, var(--ax-viz-red) 16%, transparent)', color: 'var(--ax-viz-red)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26}>{I_SHIELD}</Icon>
              </span>
              {ACCESS.modules.complaints ? (
                <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill" style={{ fontWeight: 600 }}>{OPEN_COMPLAINTS} Issues</span>
              ) : (
                <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"><Icon size={11} style={{ marginRight: 3 }}>{I_LOCK}</Icon>Restricted</span>
              )}
            </div>
            <h3 style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 6px' }}>
              Complaints & AMC
            </h3>
            <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', margin: 0, lineHeight: 1.4 }}>
              Field service complaints, breakdown tickets, maintenance history and resolution.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)', marginTop: 'var(--ax-space-4)' }}>
            <span className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)' }}>
              {OPEN_COMPLAINTS} <small style={{ fontWeight: 400, color: 'var(--ax-text-muted)', fontSize: '11px' }}>Open Tickets</small>
            </span>
            <span style={{ color: ACCESS.modules.complaints ? 'var(--ax-viz-red)' : 'var(--ax-text-subtle)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
              {ACCESS.modules.complaints ? <>Resolve Tickets <Icon size={14}>{I_ARROW_UP_RIGHT}</Icon></> : 'Locked'}
            </span>
          </div>
        </div>

        {/* 2.4 Gallery Module Card */}
        <div
          className="ax-card ax-col--3 ax-erp-module-tile"
          role="button"
          tabIndex={0}
          onClick={() => openModule('gallery', 'Gallery & Media', '/apps/gallery')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule('gallery', 'Gallery & Media', '/apps/gallery'); } }}
          style={{
            cursor: ACCESS.modules.gallery ? 'pointer' : 'not-allowed',
            border: ACCESS.modules.gallery ? '1px solid var(--ax-border)' : '1px dashed var(--ax-border)',
            borderRadius: 'var(--ax-radius-xl)',
            padding: 'var(--ax-space-5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--ax-bg-surface)',
            transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
            minHeight: 200,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-4)' }}>
              <span style={{ width: 48, height: 48, borderRadius: 'var(--ax-radius-lg)', background: 'color-mix(in oklab, var(--ax-viz-pink) 16%, transparent)', color: 'var(--ax-viz-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26}>{I_IMAGE}</Icon>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ background: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', color: 'var(--ax-viz-pink)', fontWeight: 600 }}>Active Media</span>
            </div>
            <h3 style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 6px' }}>
              Media & Gallery
            </h3>
            <p style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', margin: 0, lineHeight: 1.4 }}>
              Live photo verification, drone survey imagery & plant manufacturing media records.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)', marginTop: 'var(--ax-space-4)' }}>
            <span className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-base)', color: 'var(--ax-text-strong)' }}>
              {GALLERY_COUNT} <small style={{ fontWeight: 400, color: 'var(--ax-text-muted)', fontSize: '11px' }}>Files</small>
            </span>
            <span style={{ color: 'var(--ax-viz-pink)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
              Browse Media <Icon size={14}>{I_ARROW_UP_RIGHT}</Icon>
            </span>
          </div>
        </div>

        {/* ═══════ 3. TERRITORY COMMAND & STATE HUBS ═══════ */}
        <section className="ax-card ax-col--12" role="region" aria-label="States Command Hub">
          <div className="ax-card__header ax-erp-card-header-responsive">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">National Geographic Footprint</span>
              <h2 className="ax-card__title">State Operations & Territory Management</h2>
              <p className="ax-card__subtitle">Select any operational state below or via the map to directly jump into that state's dedicated workspace.</p>
            </div>
            <div className="ax-card__actions ax-erp-header-actions-wrap">
              <SearchInput value={query} onChange={setQuery} placeholder="Search state name or code..." ariaLabel="Search states" />
              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="View switch">
                <button type="button" className={`ax-btn ax-btn--sm ax-btn--icon${view === 'grid' ? ' is-selected' : ''}`} role="radio" aria-checked={view === 'grid'} aria-label="Cards Grid" onClick={() => setView('grid')}>{I_GRID}</button>
                <button type="button" className={`ax-btn ax-btn--sm ax-btn--icon${view === 'list' ? ' is-selected' : ''}`} role="radio" aria-checked={view === 'list'} aria-label="Table List" onClick={() => setView('list')}>{I_LIST}</button>
              </div>
            </div>
          </div>

          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>

            {/* Filter Ribbons */}
            <div className="ax-cluster" style={{ justifyContent: 'space-between', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }} role="radiogroup" aria-label="Filter by region">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={region === r}
                    className={`ax-btn ax-btn--sm ax-btn--pill ${region === r ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                    onClick={() => setRegion(r)}
                  >
                    <span className="ax-btn__label">{r} ({regionCount[r] ?? 0})</span>
                  </button>
                ))}
              </div>

              <div className="ax-btn-group ax-btn-group--segmented" role="radiogroup" aria-label="Filter by access permission">
                {ACCESS_FILTERS.map((f) => {
                  const count = f.key === 'all' ? STATES_DATA.length : f.key === 'granted' ? access.grantedCount : access.restrictedCount;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      role="radio"
                      aria-checked={accessFilter === f.key}
                      className={`ax-btn ax-btn--sm${accessFilter === f.key ? ' is-selected' : ''}`}
                      onClick={() => setAccessFilter(f.key)}
                    >
                      {f.key === 'restricted' && <Icon size={12} style={{ marginRight: 4 }}>{I_LOCK}</Icon>}
                      <span className="ax-btn__label">{f.label} ({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Jump Bar */}
            {recentStates.length > 0 && !query && region === 'All' && accessFilter !== 'restricted' && (
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', background: 'var(--ax-surface-subtle)', padding: 'var(--ax-space-2) var(--ax-space-3)', borderRadius: 'var(--ax-radius-md)' }}>
                <span className="ax-cluster" style={{ gap: 6, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 600, flexWrap: 'nowrap' }}>
                  <Icon size={14}>{I_CLOCK}</Icon> Quick Jump (Recently Visited):
                </span>
                {recentStates.map((s) => (
                  <button key={s.id} type="button" className="ax-btn ax-btn--sm ax-btn--secondary ax-btn--pill" onClick={() => openState(s)}>
                    <span className="ax-btn__label">{s.name} ({s.code})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Map & State Explorer Split Grid */}
            <div className="ax-erp-map-split">

              {/* Left: Leaflet India Interactive Map */}
              <div style={{ minWidth: 0 }}>
                <div style={{ position: 'relative', isolation: 'isolate', borderRadius: 'var(--ax-radius-xl)', overflow: 'hidden', border: '1px solid var(--ax-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <MapContainer
                    ref={setMap}
                    center={[22.5, 80.5]}
                    zoom={4.3}
                    minZoom={4.0}
                    maxZoom={7}
                    maxBounds={[[6, 67], [37.5, 98.5]]}
                    scrollWheelZoom={false}
                    className="ax-erp-leaflet-container"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {geo && <GeoJSON data={geo} style={geoStyle} onEachFeature={onEachFeature} />}

                    {/* KLK Logo Markers for every state */}
                    {STATES_DATA.map((s) => {
                      const isHot = hoverId === s.id;
                      return (
                        <Marker
                          key={s.id}
                          position={[s.lat, s.lng]}
                          icon={createKlkMarkerIcon(s, isHot)}
                          eventHandlers={{
                            mouseover: () => setHoverId(s.id),
                            mouseout: () => setHoverId(null),
                            click: () => openState(s),
                          }}
                        />
                      );
                    })}
                  </MapContainer>

                  {/* Interactive Map Detail Modal on Hover */}
                  {hoverState && popPos && (() => {
                    const locked = !hasStateAccess(hoverState.id);
                    const c = stateColor(hoverState.id);
                    return (
                      <div
                        className="ax-card"
                        role="status"
                        style={{
                          position: 'absolute',
                          left: popPos.x,
                          top: popPos.y,
                          transform: popPos.below ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))',
                          width: 230,
                          zIndex: 1000,
                          pointerEvents: 'none',
                          borderTop: `3px solid ${c}`,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                          borderRadius: 'var(--ax-radius-lg)',
                          padding: 'var(--ax-space-3) var(--ax-space-4)',
                          background: 'var(--ax-surface)',
                          border: `1px solid var(--ax-border)`,
                          borderTopColor: c,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>{hoverState.name}</div>
                          {locked ? (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 10, padding: '1px 6px' }}>
                              <Icon size={10} style={{ marginRight: 2 }}>{I_LOCK}</Icon>Locked
                            </span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontSize: 10, padding: '1px 6px' }}>
                              Authorized
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginBottom: 'var(--ax-space-2)' }}>
                          {hoverState.code} · {hoverState.region} Region
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ax-space-1)', textAlign: 'center', background: 'var(--ax-surface-subtle)', padding: '6px 4px', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }}>
                          <div>
                            <div className="ax-num" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ax-text-strong)' }}>{num(hoverState.dles)}</div>
                            <small style={{ fontSize: 9.5, color: 'var(--ax-text-muted)', fontWeight: 600 }}>DLEs</small>
                          </div>
                          <div>
                            <div className="ax-num" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ax-text-strong)' }}>{num(hoverState.vendors)}</div>
                            <small style={{ fontSize: 9.5, color: 'var(--ax-text-muted)', fontWeight: 600 }}>Vendors</small>
                          </div>
                          <div>
                            <div className="ax-num" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ax-text-strong)' }}>{num(hoverState.dles + hoverState.vendors)}</div>
                            <small style={{ fontSize: 9.5, color: 'var(--ax-text-muted)', fontWeight: 600 }}>Total</small>
                          </div>
                        </div>

                        <div style={{ marginTop: 'var(--ax-space-2)', fontSize: '11px', fontWeight: 700, color: locked ? 'var(--ax-text-subtle)' : c, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          {locked ? 'Access restricted' : <>Open Workspace <Icon size={12}>{I_ARROW_UP_RIGHT}</Icon></>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginTop: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-cluster" style={{ gap: 6 }}>
                    <img src="/logo-abbr.png" alt="KLK" style={{ width: 14, height: 14, objectFit: 'contain' }} /> State Operational Hubs
                  </span>
                  <span className="ax-cluster" style={{ gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, border: '1px dashed var(--ax-text-subtle)', background: 'var(--ax-border)' }} /> Restricted (faded)
                  </span>
                </div>
                {geoFailed && (
                  <div style={{ marginTop: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Failed to load map data.
                  </div>
                )}
              </div>

              {/* Right: State Directory Cards or Table */}
              <div className="ax-erp-state-scroll">
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)', color: 'var(--ax-text-muted)' }}>
                    <p style={{ margin: '0 0 var(--ax-space-3)' }}>No state found matching your search filter.</p>
                    <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => { setQuery(''); setRegion('All'); setAccessFilter('all'); }}>
                      <span className="ax-btn__label">Reset Filters</span>
                    </button>
                  </div>
                ) : view === 'grid' ? (
                  <div className="ax-erp-state-cards-grid">
                    {filtered.map((s) => {
                      const locked = !hasStateAccess(s.id);
                      const isHot = hoverId === s.id;
                      const c = stateColor(s.id);
                      return (
                        <div
                          key={s.id}
                          className="ax-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => openState(s)}
                          onMouseEnter={() => setHoverId(s.id)}
                          onMouseLeave={() => setHoverId(null)}
                          onFocus={() => setHoverId(s.id)}
                          onBlur={() => setHoverId(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openState(s); } }}
                          style={{
                            cursor: locked ? 'not-allowed' : 'pointer',
                            border: locked ? '1px dashed var(--ax-border)' : isHot ? `1.5px solid ${c}` : '1px solid var(--ax-border)',
                            borderRadius: 'var(--ax-radius-xl)',
                            padding: 'var(--ax-space-4)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: isHot ? `color-mix(in oklab, ${c} 8%, var(--ax-bg-surface))` : 'var(--ax-bg-surface)',
                            transition: 'all 180ms ease',
                            boxShadow: isHot ? `0 4px 14px color-mix(in oklab, ${c} 20%, transparent)` : undefined,
                            minHeight: 145,
                            opacity: locked ? 0.72 : 1,
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ax-space-3)' }}>
                              <span
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 'var(--ax-radius-lg)',
                                  background: `color-mix(in oklab, ${c} 16%, transparent)`,
                                  color: c,
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: `1px solid color-mix(in oklab, ${c} 30%, transparent)`,
                                }}
                              >
                                {s.code}
                              </span>

                              {locked ? (
                                <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                                  <Icon size={11} style={{ marginRight: 3 }}>{I_LOCK}</Icon>Locked
                                </span>
                              ) : (
                                <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ background: `color-mix(in oklab, ${c} 12%, transparent)`, color: c }}>
                                  {s.region}
                                </span>
                              )}
                            </div>

                            <h4 style={{ fontSize: 'var(--ax-text-md)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 2px' }}>
                              {s.name}
                            </h4>
                            <p style={{ fontSize: '11px', color: 'var(--ax-text-muted)', margin: 0 }}>
                              National operations & field grid
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border)', marginTop: 'var(--ax-space-3)' }}>
                            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                              <span className="ax-num" style={{ fontWeight: 800, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>
                                {num(s.dles)} <small style={{ fontWeight: 500, color: 'var(--ax-text-muted)', fontSize: '10.5px' }}>DLEs</small>
                              </span>
                              <span style={{ color: 'var(--ax-border)' }}>·</span>
                              <span className="ax-num" style={{ fontWeight: 800, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>
                                {num(s.vendors)} <small style={{ fontWeight: 500, color: 'var(--ax-text-muted)', fontSize: '10.5px' }}>Ven</small>
                              </span>
                            </div>

                            <span style={{ color: locked ? 'var(--ax-text-subtle)' : c, display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
                              {locked ? 'Locked' : <>Open <Icon size={12}>{I_ARROW_UP_RIGHT}</Icon></>}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ax-table-wrap">
                    <table className="ax-table ax-table--compact ax-table--hover">
                      <thead className="ax-table__head">
                        <tr>
                          <th className="ax-table__th" scope="col">State</th>
                          <th className="ax-table__th" scope="col">Region</th>
                          <th className="ax-table__th" scope="col">Status</th>
                          <th className="ax-table__th ax-table__th--num" scope="col">DLEs</th>
                          <th className="ax-table__th ax-table__th--num" scope="col">Vendors</th>
                          <th className="ax-table__th" scope="col" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => {
                          const locked = !hasStateAccess(s.id);
                          const c = stateColor(s.id);
                          return (
                            <tr
                              key={s.id}
                              className="ax-table__row"
                              role="button"
                              tabIndex={0}
                              aria-disabled={locked || undefined}
                              onClick={() => openState(s)}
                              onMouseEnter={() => setHoverId(s.id)}
                              onMouseLeave={() => setHoverId(null)}
                              onFocus={() => setHoverId(s.id)}
                              onBlur={() => setHoverId(null)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openState(s); } }}
                              style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
                            >
                              <td className="ax-table__td">
                                <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                                  <span className="ax-avatar" style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-sm)', background: c, color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>{s.code}</span>
                                  <span style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>{s.name}</span>
                                </div>
                              </td>
                              <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{s.region}</span></td>
                              <td className="ax-table__td">
                                {locked ? (
                                  <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"><Icon size={11} style={{ marginRight: 3 }}>{I_LOCK}</Icon>Restricted</span>
                                ) : (
                                  <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill"><Icon size={11} style={{ marginRight: 3 }}>{I_CHECK_CIRCLE}</Icon>Authorized</span>
                                )}
                              </td>
                              <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 800, color: 'var(--ax-text-strong)' }}>{num(s.dles)}</td>
                              <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 800, color: 'var(--ax-text-strong)' }}>{num(s.vendors)}</td>
                              <td className="ax-table__td" style={{ textAlign: 'right' }}>
                                <span style={{ color: locked ? 'var(--ax-text-subtle)' : 'var(--ax-accent)', fontWeight: 700, fontSize: 'var(--ax-text-xs)' }}>
                                  {locked ? 'Locked' : 'Open ›'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ 4. QUICK OVERVIEW + QUICK PORTALS ═══════ */}
        <section className="ax-card ax-col--8" role="region" aria-label="Quick Overview" style={{ background: 'linear-gradient(135deg, var(--ax-surface) 0%, color-mix(in oklab, var(--ax-accent) 3%, var(--ax-surface)) 100%)' }}>
          <div className="ax-card__header" style={{ paddingBottom: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 800 }}>Quick Overview</h2>
              <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Top 5 states by active projects</p>
            </div>
            <div className="ax-card__actions">
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: 'var(--ax-accent)', fontWeight: 700 }} onClick={() => navigate('/dle/dashboard')}>
                <span className="ax-btn__label">View All</span>
                <Icon size={14}>{I_ARROW_UP_RIGHT}</Icon>
              </button>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(() => {
              const top5 = [...STATES_DATA]
                .sort((a, b) => (b.dles + b.vendors) - (a.dles + a.vendors))
                .slice(0, 5);
              const maxTotal = top5[0].dles + top5[0].vendors;
              return top5.map((s, idx) => {
                const total = s.dles + s.vendors;
                const barWidth = Math.round((total / maxTotal) * 100);
                return (
                  <div
                    key={s.id}
                    className="ax-erp-quick-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openState(s)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openState(s); } }}
                    style={{
                      borderBottom: idx < 4 ? '1px solid color-mix(in oklab, var(--ax-border) 50%, transparent)' : 'none',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in oklab, var(--ax-accent) 4%, transparent)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ax-text-muted)' }}>{idx + 1}.</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span className="ax-erp-quick-sub" style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>{total} Sites</span>
                    <div className="ax-erp-quick-bar" style={{ height: 10, borderRadius: 99, background: 'color-mix(in oklab, var(--ax-border) 40%, transparent)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        borderRadius: 99,
                        background: 'linear-gradient(90deg, #0d9488, #10b981)',
                        transition: 'width 0.8s cubic-bezier(0, 0, 0.2, 1)',
                      }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', textAlign: 'right' }}>{total}</span>
                    <span style={{ width: 16, height: 16, display: 'inline-flex', color: '#10b981' }}>{I_ARROW_UP_RIGHT}</span>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Portal Shortcuts">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Instant Navigation</span>
              <h2 className="ax-card__title">Direct Portals</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--block"
              style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) var(--ax-space-4)', height: 'auto', borderRadius: 'var(--ax-radius-lg)' }}
              onClick={() => navigate('/dle/dashboard')}
            >
              <span className="ax-cluster" style={{ gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', color: 'var(--ax-viz-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18}>{I_BOLT}</Icon>
                </span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--ax-text-strong)' }}>DLE Installation Portal</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--ax-text-muted)' }}>Solar street lights, surveys & maintenance</span>
                </span>
              </span>
              <Icon size={14}>{I_CHEV_R}</Icon>
            </button>

            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--block"
              style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) var(--ax-space-4)', height: 'auto', borderRadius: 'var(--ax-radius-lg)' }}
              onClick={() => navigate('/vendor/dashboard')}
            >
              <span className="ax-cluster" style={{ gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', color: 'var(--ax-viz-violet)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18}>{I_USERS}</Icon>
                </span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--ax-text-strong)' }}>Vendor Partner Portal</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--ax-text-muted)' }}>Material dispatch, approvals & stock</span>
                </span>
              </span>
              <Icon size={14}>{I_CHEV_R}</Icon>
            </button>

            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--block"
              style={{ justifyContent: 'space-between', padding: 'var(--ax-space-3) var(--ax-space-4)', height: 'auto', borderRadius: 'var(--ax-radius-lg)' }}
              onClick={() => navigate('/apps/gallery')}
            >
              <span className="ax-cluster" style={{ gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', color: 'var(--ax-viz-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18}>{I_IMAGE}</Icon>
                </span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--ax-text-strong)' }}>Site Photo Verification</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--ax-text-muted)' }}>Inspect live project photos & audits</span>
                </span>
              </span>
              <Icon size={14}>{I_CHEV_R}</Icon>
            </button>
          </div>
        </section>

        {/* ═══════ 5. DISTRIBUTION CHART + VIDEO (Side-by-Side: col-6 + col-6) ═══════ */}
        <section className="ax-card ax-card--chart ax-col--6" role="region" aria-label="Territory Distribution Analytics">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Territory Network Breakdown</span>
              <h2 className="ax-card__title">State-wise DLE &amp; Vendor Distribution</h2>
              <p className="ax-card__subtitle">Field partner teams vs approved vendor suppliers vs registered users.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ background: 'color-mix(in oklab, var(--ax-accent) 15%, transparent)', color: 'var(--ax-accent)' }}>
                <Icon size={13} style={{ marginRight: 4 }}>{I_CHART}</Icon> Pillars
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={320}
              series={[
                { name: 'DLE Partners', data: chartDleSeries },
                { name: 'Vendors', data: chartVendorSeries },
                { name: 'Users', data: chartUserSeries },
              ]}
              apex={{
                chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                plotOptions: {
                  bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 },
                },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ['transparent'] },
                xaxis: {
                  categories: chartStateCategories,
                  labels: { style: { fontSize: '11px', fontWeight: 600 } },
                },
                yaxis: { title: { text: 'Count', style: { fontSize: '11px', fontWeight: 600 } } },
                fill: { opacity: 1 },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: {
                    formatter: (val: number, opts?: { seriesIndex?: number }) =>
                      opts?.seriesIndex === 2 ? `${val} users` : opts?.seriesIndex === 1 ? `${val} vendors` : `${val} partners`,
                  },
                },
                colors: ['#0284c7', '#8b5cf6', '#f59e0b'],
                legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 600 },
                grid: { borderColor: 'var(--ax-border)' },
                responsive: [
                  {
                    breakpoint: 1024,
                    options: {
                      chart: { height: 320 },
                      plotOptions: { bar: { columnWidth: '68%' } },
                      xaxis: { labels: { rotate: -45, style: { fontSize: '10px' } } },
                      legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px' },
                    },
                  },
                  {
                    breakpoint: 640,
                    options: {
                      chart: { height: 280 },
                      plotOptions: { bar: { columnWidth: '78%' } },
                      xaxis: { labels: { rotate: -60, style: { fontSize: '9px' } } },
                      legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '10px', itemMargin: { horizontal: 6, vertical: 2 } },
                    },
                  },
                ],
              }}
            />
          </div>
        </section>

        <section className="ax-card ax-col--6" role="region" aria-label="KLK Corporate Video Showcase">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Production &amp; Field Operations</span>
              <h2 className="ax-card__title">KLK Ventures Infrastructure</h2>
              <p className="ax-card__subtitle">
                Solar pannel street lights, lithium batteries and infrastructure plant tour.
              </p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">HQ &amp; Manufacturing</span>
            </div>
          </div>

          <div className="ax-card__body" style={{ padding: 'var(--ax-space-4)' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: 'var(--ax-radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--ax-border)',
                background: '#000',
              }}
            >
              <iframe
                src="https://www.youtube.com/embed/HxSPgWlFAHg?autoplay=1&mute=1&loop=1&playlist=HxSPgWlFAHg&controls=1&rel=0"
                title="KLK Ventures Infrastructure"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        </section>

        {/* ═══════ 6. MONTHLY COMPLAINTS WAVE / AREA CHART (Full Width: col-12) ═══════ */}
        <section className="ax-card ax-card--chart ax-col--12" role="region" aria-label="Monthly Complaints Wave Analytics">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Month-by-Month State Trend (Wave Curve)</span>
              <h2 className="ax-card__title">Monthly Complaints by State (Wave Trend)</h2>
              <p className="ax-card__subtitle">
                Inspect how complaints trend across months for each state with smooth wave curves.
              </p>
            </div>
            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="complaint-state-select" style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-muted)' }}>
                  State:
                </label>
                <select
                  id="complaint-state-select"
                  className="ax-select ax-select--sm"
                  value={selectedComplaintState}
                  onChange={(e) => setSelectedComplaintState(e.target.value)}
                  style={{ minWidth: 180, fontWeight: 600 }}
                >
                  <option value="all">Top 6 States (Comparison)</option>
                  <option value="all-13">All 13 States</option>
                  <option value="total">National Total (Combined)</option>
                  <optgroup label="Select Specific State">
                    {sortedChartStates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) — {COMPLAINTS_BY_STATE[s.id] ?? 0} total
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill">
                <Icon size={13} style={{ marginRight: 4 }}>{I_CHART}</Icon> Wave Chart
              </span>
            </div>
          </div>

          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {/* Quick KPI stats strip */}
            <div className="ax-erp-wave-kpis">
              <div className="ax-erp-wave-kpi-item" style={{ background: 'var(--ax-surface-subtle)', padding: '10px 14px', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Annual Complaints</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#e11d48', marginTop: 2 }}>
                  {Object.values(COMPLAINTS_BY_STATE).reduce((a, b) => a + b, 0)}
                </div>
              </div>
              <div className="ax-erp-wave-kpi-item" style={{ background: 'var(--ax-surface-subtle)', padding: '10px 14px', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Highest Volume</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 2 }}>
                  UP (95)
                </div>
              </div>
              <div className="ax-erp-wave-kpi-item" style={{ background: 'var(--ax-surface-subtle)', padding: '10px 14px', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Active Tracking</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                  10 Months (Jan–Oct)
                </div>
              </div>
              <div className="ax-erp-wave-kpi-item" style={{ background: 'var(--ax-surface-subtle)', padding: '10px 14px', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Selected View</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {selectedComplaintState === 'all'
                    ? 'Top 6 States'
                    : selectedComplaintState === 'all-13'
                    ? 'All 13 States'
                    : selectedComplaintState === 'total'
                    ? 'National Total'
                    : STATES_DATA.find((s) => s.id === selectedComplaintState)?.name || selectedComplaintState}
                </div>
              </div>
            </div>

            <ApexChart
              type="area"
              height={320}
              series={waveSeries}
              apex={{
                chart: {
                  type: 'area',
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                  zoom: { enabled: false },
                },
                dataLabels: { enabled: false },
                stroke: {
                  curve: 'smooth',
                  width: selectedComplaintState !== 'all' && selectedComplaintState !== 'all-13' ? 3 : 2,
                },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [0, 90, 100],
                  },
                },
                xaxis: {
                  categories: COMPLAINT_MONTHS,
                  labels: { style: { fontSize: '12px', fontWeight: 600 } },
                  axisBorder: { show: false },
                },
                yaxis: {
                  title: { text: 'Monthly Complaints', style: { fontSize: '11px', fontWeight: 600 } },
                  labels: { formatter: (v: number) => Math.round(v).toString() },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: {
                    formatter: (val: number) => `${val} complaints`,
                  },
                },
                legend: {
                  position: 'top',
                  horizontalAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  itemMargin: { horizontal: 10, vertical: 4 },
                },
                grid: { borderColor: 'var(--ax-border)', strokeDashArray: 4 },
                colors: [
                  '#e11d48', '#2563eb', '#8b5cf6', '#d97706', '#059669',
                  '#0891b2', '#ea580c', '#4f46e5', '#db2777', '#16a34a',
                  '#6366f1', '#a855f7', '#64748b',
                ],
                responsive: [
                  {
                    breakpoint: 1024,
                    options: {
                      chart: { height: 310 },
                      legend: { position: 'top', horizontalAlign: 'left', fontSize: '11px' },
                    },
                  },
                  {
                    breakpoint: 640,
                    options: {
                      chart: { height: 260 },
                      xaxis: { labels: { style: { fontSize: '10px' } } },
                      legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '10px', itemMargin: { horizontal: 5, vertical: 2 } },
                    },
                  },
                ],
              }}
            />
          </div>
        </section>

        {/* ═══════ 7. CONSOLIDATED STATE-WISE SUMMARY TABLE (Full Width: col-12) ═══════ */}
        <section className="ax-card ax-col--12" role="region" aria-label="State-wise Network Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Complete Operations Matrix</span>
              <h2 className="ax-card__title">State-wise Operations, Distribution &amp; Complaints</h2>
              <p className="ax-card__subtitle">
                Field partner teams (DLE), approved vendors, registered users, and logged complaints per state.
              </p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {sortedChartStates.length} States Monitored
              </span>
            </div>
          </div>
          <div className="ax-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="ax-table ax-table--hover ax-table--bordered" style={{ minWidth: 700, width: '100%' }}>
              <caption className="ax-visually-hidden">State-wise DLE, Vendor, User and Complaint counts</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 44 }}>Sr.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Region</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ textAlign: 'right' }}>DLE Partners</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ textAlign: 'right' }}>Vendors</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ textAlign: 'right' }}>Users</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ textAlign: 'right' }}>Complaints</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ textAlign: 'right' }}>Total Active</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedChartStates.map((s, idx) => {
                  const users = USERS_BY_STATE[s.id] ?? 0;
                  const complaints = COMPLAINTS_BY_STATE[s.id] ?? 0;
                  const total = s.dles + s.vendors + users;
                  return (
                    <tr key={s.id} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {s.name} <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>({s.code})</span>
                      </td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">{s.region}</span>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right' }}>{num(s.dles)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right' }}>{num(s.vendors)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right' }}>{num(users)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right' }}>{num(complaints)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(total)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => openState(s)}
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          View Hub →
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Grand Total Row */}
                <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)' }}>
                  <td className="ax-table__td" colSpan={3} style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>Grand Total</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {num(sortedChartStates.reduce((a, s) => a + s.dles, 0))}
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {num(sortedChartStates.reduce((a, s) => a + s.vendors, 0))}
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {num(sortedChartStates.reduce((a, s) => a + (USERS_BY_STATE[s.id] ?? 0), 0))}
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {num(sortedChartStates.reduce((a, s) => a + (COMPLAINTS_BY_STATE[s.id] ?? 0), 0))}
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    {num(sortedChartStates.reduce((a, s) => a + s.dles + s.vendors + (USERS_BY_STATE[s.id] ?? 0), 0))}
                  </td>
                  <td className="ax-table__td" style={{ textAlign: 'center', fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                    All Hubs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Access Permission Toast */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="ax-card"
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000, maxWidth: 380, boxShadow: 'var(--ax-shadow-md)', borderLeft: '3px solid var(--ax-viz-amber)' }}
        >
          <div className="ax-card__body ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <Icon size={18} style={{ color: 'var(--ax-viz-amber)', marginTop: 1 }}>{I_LOCK}</Icon>
            <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', lineHeight: 1.45 }}>{notice}</span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Dismiss" onClick={() => setNotice(null)}>{I_CLOSE}</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ErpMainDashboard;
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import type { Layer, Map as LeafletMap, Path, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageHead } from '../../components/shell/PageHead';
import { SearchInput } from '../../common/search/SearchInput';
import { ApexChart } from '../../components/charts/ApexChart';


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

const REGIONS: Array<'All' | Region> = ['All', 'North', 'East', 'West', 'South', 'North-East'];
const RECENT_KEY = 'klk_erp_recent_states';
const GALLERY_COUNT = 246;
const OPEN_COMPLAINTS = 18;
const MAP_HEIGHT = 640;

type ModuleKey = 'dle' | 'vendor' | 'gallery' | 'complaints';
type ActivityTone = 'info' | 'success' | 'danger' | 'warning';

const ACTIVITIES: Array<{ when: string; module: ModuleKey; label: string; tone: ActivityTone; details: string; user: string }> = [
  { when: '07 Oct, 11:24 AM', module: 'dle', label: 'DLE', tone: 'info', details: 'New DLE registered - Green Solar Projects', user: 'Harsh Rajput' },
  { when: '07 Oct, 10:05 AM', module: 'vendor', label: 'Vendor', tone: 'success', details: 'Vendor details updated - SunTech Energy', user: 'Priya Sharma' },
  { when: '06 Oct, 04:32 PM', module: 'complaints', label: 'Complaints', tone: 'danger', details: 'New complaint raised - UP (Installation)', user: 'Amit Kumar' },
  { when: '06 Oct, 12:18 PM', module: 'gallery', label: 'Gallery', tone: 'warning', details: '5 new site images uploaded - Karnataka', user: 'Neha Verma' },
  { when: '05 Oct, 03:41 PM', module: 'dle', label: 'DLE', tone: 'info', details: 'DLE approved - MP Solar Infra', user: 'Rohit Singh' },
  { when: '05 Oct, 11:15 AM', module: 'vendor', label: 'Vendor', tone: 'success', details: 'Compliance documents verified - Apex Power', user: 'Priya Sharma' },
];

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
  kashmir: '#2563eb',    // Deep Royal Blue
  jammu: '#0284c7',      // Sky Cyan
  himachal: '#7c3aed',   // Vivid Violet
  haryana: '#d97706',    // Rich Amber/Gold
  punjab: '#ea580c',     // Sunset Orange
  up: '#db2777',         // Crimson Pink
  bihar: '#0d9488',      // Rich Teal
  jharkhand: '#4f46e5',  // Indigo Blue
  goa: '#e11d48',        // Coral Rose
  karnataka: '#16a34a',  // Emerald Green
  assam: '#0891b2',      // Deep Aqua
  tripura: '#9333ea',    // Royal Purple
  arunachal: '#c026d3',  // Vivid Magenta
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

  const visibleActivities = useMemo(() => ACTIVITIES.filter((a) => ACCESS.modules[a.module]), []);

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

  // Map polygon style - Clean subtle borders, without harsh dark black outlines
  const styleOfWork = useCallback((w?: GeoWork): PathOptions => {
    if (!w) return { color: 'rgba(148, 163, 184, 0.4)', weight: 0.8, fillColor: 'transparent', fillOpacity: 0 };
    return w.open
      ? { color: w.color, weight: 1.2, fillColor: w.color, fillOpacity: 0.38 }
      : { color: 'rgba(148, 163, 184, 0.35)', weight: 0.8, dashArray: '3 3', fillColor: w.color, fillOpacity: 0.12 };
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

  const chartStateCategories = useMemo(() => sortedChartStates.map(s => s.code), [sortedChartStates]);
  const chartDleSeries = useMemo(() => sortedChartStates.map(s => s.dles), [sortedChartStates]);
  const chartVendorSeries = useMemo(() => sortedChartStates.map(s => s.vendors), [sortedChartStates]);

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

      <div className="ax-dash-grid" style={{ marginTop: '-30px' }}>

        {/* ═══════ 1. EXECUTIVE HERO COMMAND BANNER ═══════ */}
        <section
          className="ax-card ax-col--12"
          role="region"
          aria-label="Executive Overview"
          style={{
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--ax-surface) 90%, var(--ax-accent) 10%), var(--ax-surface))',
            borderColor: 'var(--ax-border)',
            padding: 'var(--ax-space-5) var(--ax-space-6)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--ax-space-6)', alignItems: 'center' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--ax-space-3)' }}>
              <div style={{ background: 'var(--ax-bg-surface)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 600, display: 'block' }}>Active DLEs</span>
                <span className="ax-num" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ax-text-strong)', display: 'block', lineHeight: 1.15, marginTop: 4 }}>
                  {num(totals.dles)}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>Field Partners</small>
              </div>

              <div style={{ background: 'var(--ax-bg-surface)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 600, display: 'block' }}>Vendors</span>
                <span className="ax-num" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ax-text-strong)', display: 'block', lineHeight: 1.15, marginTop: 4 }}>
                  {num(totals.vendors)}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>Approved Network</small>
              </div>

              <div style={{ background: 'var(--ax-bg-surface)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 600, display: 'block' }}>Total States</span>
                <span className="ax-num" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ax-text-strong)', display: 'block', lineHeight: 1.15, marginTop: 4 }}>
                  {num(totals.states)}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>{access.geoOpen} Authorized</small>
              </div>

              <div style={{ background: 'var(--ax-bg-surface)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', fontWeight: 600, display: 'block' }}>Complaints</span>
                <span className="ax-num" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ax-text-strong)', display: 'block', lineHeight: 1.15, marginTop: 4 }}>
                  {OPEN_COMPLAINTS}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--ax-text-subtle)' }}>Service Tickets</small>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ 2. CORE ERP MODULE TILES ═══════ */}

        {/* 2.1 DLE Module Card */}
        <div
          className="ax-card ax-col--3"
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
          className="ax-card ax-col--3"
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
          className="ax-card ax-col--3"
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
          className="ax-card ax-col--3"
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
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">National Geographic Footprint</span>
              <h2 className="ax-card__title">State Operations & Territory Management</h2>
              <p className="ax-card__subtitle">Select any operational state below or via the map to directly jump into that state's dedicated workspace.</p>
            </div>
            <div className="ax-card__actions">
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
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(360px, 1.05fr)', gap: 'var(--ax-space-5)', alignItems: 'start' }}>

              {/* Left: Leaflet India Interactive Map (Subtle borders + KLK logo markers) */}
              <div style={{ minWidth: 0 }}>
                <div style={{ position: 'relative', isolation: 'isolate', borderRadius: 'var(--ax-radius-xl)', overflow: 'hidden', border: '1px solid var(--ax-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <MapContainer
                    ref={setMap}
                    center={[22.5, 80.5]}
                    zoom={4.3}
                    minZoom={4.0}
                    maxZoom={7}
                    maxBounds={[[6, 67], [37.5, 98.5]]}
                    scrollWheelZoom={true}
                    style={{ height: MAP_HEIGHT, width: '100%' }}
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
                    Map data load nahi ho paya.
                  </div>
                )}
              </div>

              {/* Right: State Directory Cards or Table */}
              <div style={{ minWidth: 0, maxHeight: MAP_HEIGHT, overflowY: 'auto', paddingRight: 6 }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)', color: 'var(--ax-text-muted)' }}>
                    <p style={{ margin: '0 0 var(--ax-space-3)' }}>No state found matching your search filter.</p>
                    <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => { setQuery(''); setRegion('All'); setAccessFilter('all'); }}>
                      <span className="ax-btn__label">Reset Filters</span>
                    </button>
                  </div>
                ) : view === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--ax-space-3)' }}>
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
                            {/* Card Header: Avatar & Access pill */}
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

                            {/* State Name */}
                            <h4 style={{ fontSize: 'var(--ax-text-md)', fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 2px' }}>
                              {s.name}
                            </h4>
                            <p style={{ fontSize: '11px', color: 'var(--ax-text-muted)', margin: 0 }}>
                              National operations & field grid
                            </p>
                          </div>

                          {/* Footer Info: Counters & Action link */}
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
                    role="button"
                    tabIndex={0}
                    onClick={() => openState(s)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openState(s); }}}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 140px 90px 1fr 70px 22px',
                      alignItems: 'center',
                      gap: 12,
                      padding: 'var(--ax-space-4) var(--ax-space-3)',
                      borderBottom: idx < 4 ? '1px solid color-mix(in oklab, var(--ax-border) 50%, transparent)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in oklab, var(--ax-accent) 4%, transparent)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* 1. Rank */}
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ax-text-muted)' }}>{idx + 1}.</span>

                    {/* 2. State Name */}
                    <span style={{ fontWeight: 700, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>

                    {/* 3. Sites Count */}
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>{total} Sites</span>

                    {/* 4. Progress Bar */}
                    <div style={{ height: 10, borderRadius: 99, background: 'color-mix(in oklab, var(--ax-border) 40%, transparent)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        borderRadius: 99,
                        background: 'linear-gradient(90deg, #0d9488, #10b981)',
                        transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                      }} />
                    </div>

                    {/* 5. Completed Count */}
                    <span style={{ fontWeight: 800, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', textAlign: 'right' }}>{total}</span>

                    {/* 6. Up Arrow */}
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

        {/* ═══════ 5. SPLIT SECTION (6 COLS VIDEO + 6 COLS DISTRIBUTION CHART) ═══════ */}

   
   

        {/* 5.2 State-wise Operations & Network Distribution Chart (Right - 6 cols) */}
        <section className="ax-card ax-card--chart ax-col--6" role="region" aria-label="Territory Distribution Analytics">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Territory Network Breakdown</span>
              <h2 className="ax-card__title">State-wise DLE & Vendor Distribution</h2>
              <p className="ax-card__subtitle">Field partner teams vs approved vendor suppliers per state.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ background: 'color-mix(in oklab, var(--ax-accent) 15%, transparent)', color: 'var(--ax-accent)' }}>
                <Icon size={13} style={{ marginRight: 4 }}>{I_CHART}</Icon> National Network
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={300}
              series={[
                { name: 'DLE Partners', data: chartDleSeries },
                { name: 'Vendors', data: chartVendorSeries },
              ]}
              apex={{
                chart: {
                  type: 'bar',
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                },
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4,
                  },
                },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ['transparent'] },
                xaxis: {
                  categories: chartStateCategories,
                  labels: {
                    style: { fontSize: '11px', fontWeight: 600 },
                  },
                },
                yaxis: {
                  title: { text: 'Active Count', style: { fontSize: '11px', fontWeight: 600 } },
                },
                fill: { opacity: 1 },
                tooltip: {
                  y: {
                    formatter: (val) => `${val} partners`,
                  },
                },
                colors: ['#0284c7', '#8b5cf6'],
                legend: {
                  position: 'top',
                  horizontalAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 600,
                },
              }}
            />
          </div>
        </section>


<section
  className="ax-card ax-col--6"
  role="region"
  aria-label="KLK Corporate Video Showcase"
>
  <div className="ax-card__header">
    <div className="ax-card__titles">
      <span className="ax-card__eyebrow">
        Production & Field Operations
      </span>

      <h2 className="ax-card__title">
        KLK Ventures Infrastructure
      </h2>

      <p className="ax-card__subtitle">
        Solar pannel street lights, lithium batteries and infrastructure plant tour.
      </p>
    </div>

    <div className="ax-card__actions">
      <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">
        HQ & Manufacturing
      </span>
    </div>
  </div>

  <div
    className="ax-card__body"
    style={{
      padding: 'var(--ax-space-4)',
    }}
  >
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
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
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
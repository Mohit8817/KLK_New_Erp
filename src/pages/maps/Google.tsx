/*
 * Vireo React — Google Maps (maps/google).
 *
 * Faithful re-expression of src/html/maps/google.html. The reference embeds a
 * keyless Google Maps iframe that recenters on the active location; the Alpine
 * search/active/map-type state is re-built with React state. KPIs, route planner
 * and pin legend are static. DOM/classes/ARIA match the reference 1:1.
 */
import { useMemo, useState } from 'react';
import { PageHead } from '../../components/shell/PageHead';

interface Place { id: string; name: string; addr: string; type: string; open: boolean; dist: string; c: string; ll: string }
const PLACES: Place[] = [
  { id: 'loc-1', name: 'Aperture Goods — Flagship', addr: '214 Market St, San Francisco, CA', type: 'Retail store', open: true, dist: '0.4 mi', c: '--ax-accent', ll: '37.7929,-122.3971' },
  { id: 'loc-2', name: 'Northwind Labs HQ', addr: '88 Spear St, Floor 12, San Francisco, CA', type: 'Office', open: true, dist: '0.9 mi', c: '--ax-viz-violet', ll: '37.7919,-122.3934' },
  { id: 'loc-3', name: 'Mission Fulfilment Center', addr: '1500 Bryant St, San Francisco, CA', type: 'Warehouse', open: true, dist: '1.6 mi', c: '--ax-viz-cyan', ll: '37.7690,-122.4106' },
  { id: 'loc-4', name: 'Aperture Goods — Embarcadero', addr: '1 Ferry Building, San Francisco, CA', type: 'Retail store', open: false, dist: '2.1 mi', c: '--ax-viz-amber', ll: '37.7955,-122.3937' },
  { id: 'loc-5', name: 'Bayside Pickup Point', addr: 'Pier 39, Beach St, San Francisco, CA', type: 'Locker', open: true, dist: '2.8 mi', c: '--ax-viz-emerald', ll: '37.8087,-122.4098' },
  { id: 'loc-6', name: 'Sunset Service Depot', addr: '1290 Irving St, San Francisco, CA', type: 'Service', open: false, dist: '3.5 mi', c: '--ax-viz-pink', ll: '37.7640,-122.4682' },
];

type MapType = 'map' | 'satellite' | 'terrain';

export function Google() {
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState('loc-1');
  const [mapType, setMapType] = useState<MapType>('map');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? PLACES.filter((p) => (p.name + ' ' + p.addr + ' ' + p.type).toLowerCase().includes(t)) : PLACES;
  }, [q]);
  const active = PLACES.find((p) => p.id === activeId) || PLACES[0];
  const embedSrc = `https://www.google.com/maps?q=${active.ll}&z=14&hl=en&output=embed${mapType === 'satellite' ? '&t=k' : mapType === 'terrain' ? '&t=p' : ''}`;

  return (
    <>
      <PageHead
        title="Google Maps"
        subtitle="Styled Google-Maps integration — searchable locations, custom accent pins, info windows and route overlays."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /><path d="M12 2l0 2" /><path d="M12 20l0 2" /><path d="M20 12l2 0" /><path d="M2 12l2 0" /></svg>
              <span className="ax-btn__label">San Francisco</span>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
            </button>
            <button type="button" className="ax-btn ax-btn--ghost">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
              <span className="ax-btn__label">Export pins</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              <span className="ax-btn__label">Add location</span>
            </button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* MAP CANVAS (hero) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Map of company locations in San Francisco" style={{ overflow: 'hidden' }}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Live map</span>
              <h2 className="ax-card__title">Locations — San Francisco</h2>
              <p className="ax-card__subtitle">6 places · centered on the Financial District</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-segment" role="group" aria-label="Map type">
                {(['map', 'satellite', 'terrain'] as MapType[]).map((t) => (
                  <button key={t} type="button" className={`ax-segment__option${mapType === t ? ' is-active' : ''}`} aria-pressed={mapType === t} onClick={() => setMapType(t)}>{t === 'map' ? 'Map' : t === 'satellite' ? 'Satellite' : 'Terrain'}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div aria-label="Google map of San Francisco company locations" style={{ position: 'relative', height: 440, borderRadius: 'var(--ax-radius-lg)', overflow: 'hidden', border: '1px solid var(--ax-border)', background: 'var(--ax-surface-subtle)' }}>
              <iframe src={embedSrc} title="Google map of company locations" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
              <div style={{ position: 'absolute', left: 'var(--ax-space-4)', top: 'var(--ax-space-4)', minWidth: 240, maxWidth: 280, background: 'var(--ax-surface-overlay)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', boxShadow: 'var(--ax-shadow-md)', padding: 'var(--ax-space-4)', zIndex: 6, pointerEvents: 'none' }}>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-1)', flexWrap: 'nowrap' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${active.c})`, flex: 'none' }} />
                  <b style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{active.name}</b>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{active.addr}</p>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginTop: 'var(--ax-space-3)' }}>
                  <span className={`ax-badge ax-badge--soft ax-badge--pill ${active.open ? 'ax-badge--success' : 'ax-badge--danger'}`}><span className="ax-badge__dot" /><span>{active.open ? 'Open now' : 'Closed'}</span></span>
                  <span className="ax-badge ax-badge--soft ax-badge--pill ax-num">{active.dist}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOCATIONS RAIL */}
        <section className="ax-card ax-col--4" role="region" aria-label="Searchable list of locations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Locations</h2>
              <p className="ax-card__subtitle"><span className="ax-num">{filtered.length}</span> shown · click to focus the map</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-field__control">
              <span className="ax-field__affix ax-field__affix--leading" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
              </span>
              <input type="search" className="ax-input ax-input--with-leading-icon" placeholder="Search places…" aria-label="Search locations" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <ul className="ax-list ax-list--compact" style={{ maxHeight: 392, overflow: 'auto' }}>
              {filtered.map((p) => (
                <li key={p.id} className={`ax-list__row${activeId === p.id ? ' is-selected' : ''}`} role="button" tabIndex={0} onClick={() => setActiveId(p.id)} onKeyDown={(e) => { if (e.key === 'Enter') setActiveId(p.id); }} style={{ cursor: 'pointer', borderRadius: 'var(--ax-radius-sm)' }}>
                  <span className="ax-list__leading">
                    <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab, var(${p.c}) 18%, transparent)`, color: `var(${p.c})` }}>
                      <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></svg>
                    </span>
                  </span>
                  <span className="ax-list__content" style={{ minWidth: 0 }}>
                    <span className="ax-list__title ax-truncate" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{p.name}</span>
                    <span className="ax-truncate" style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{p.type + ' · ' + p.addr}</span>
                  </span>
                  <span className="ax-list__trailing" style={{ textAlign: 'end' }}>
                    <span className="ax-num" style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{p.dist}</span>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginTop: 4, background: `var(${p.open ? '--ax-success-500' : '--ax-danger-500'})` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* COVERAGE KPIs */}
        {[
          { region: 'Active locations 6', icon: 'c1', label: 'Active locations', value: '6', trailing: <span className="ax-kpi__delta ax-kpi__delta--up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>2</span>, iconPaths: <><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></> },
          { region: 'Open now 4', icon: 'c2', label: 'Open now', value: '4', trailing: <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill"><span className="ax-badge__dot" />Live</span>, iconPaths: <><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 7v5l3 3" /></> },
          { region: 'Average distance 1.9 miles', icon: 'c3', label: 'Avg. distance', value: '1.9 mi', trailing: <span className="ax-kpi__delta ax-kpi__delta--down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>0.3</span>, iconPaths: <><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></> },
          { region: 'Pickups today 138', icon: 'c4', label: 'Pickups today', value: '138', trailing: <span className="ax-kpi__delta ax-kpi__delta--up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>9.4%</span>, iconPaths: <><path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /></> },
        ].map((k) => (
          <div key={k.label} className="ax-card ax-kpi ax-col--3" role="region" aria-label={k.region}>
            <div className="ax-card__body">
              <div className="ax-kpi__top">
                <span className={`ax-kpi__icon ax-kpi__icon--${k.icon}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{k.iconPaths}</svg></span>
                {k.trailing}
              </div>
              <div className="ax-kpi__label">{k.label}</div>
              <div className="ax-kpi__value ax-num">{k.value}</div>
            </div>
          </div>
        ))}

        {/* ROUTE PLANNER */}
        <section className="ax-card ax-col--7" role="region" aria-label="Route planner">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Directions</span>
              <h2 className="ax-card__title">Route planner</h2>
              <p className="ax-card__subtitle">Fastest path overlaid on the map · 3 stops</p>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21v-4" /><path d="M12 13v-4" /><path d="M12 5v-2" /><path d="M10 21h4" /><path d="M8 5v4h11l2 -2l-2 -2l-11 0" /><path d="M14 13v4h-8l-2 -2l2 -2l8 0" /></svg>
              <span className="ax-btn__label">Reroute</span>
            </button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-timeline">
              <li className="ax-timeline__item ax-timeline__item--success">
                <span className="ax-timeline__marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Northwind Labs HQ</b> — depart</p>
                  <span className="ax-timeline__time">88 Spear St · 9:05 AM</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-cyan)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Aperture Goods — Flagship</b> — restock drop</p>
                  <span className="ax-timeline__time">214 Market St · 9:18 AM · <span className="ax-num">1.3 mi</span></span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-amber)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Mission Fulfilment Center</b> — arrive</p>
                  <span className="ax-timeline__time">1500 Bryant St · 9:41 AM · <span className="ax-num">3.0 mi total</span></span>
                </div>
              </li>
            </ul>
          </div>
          <div className="ax-card__footer">
            <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Total <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>36 min</b> · <span className="ax-num">3.0 mi</span> · light traffic</span>
          </div>
        </section>

        {/* PIN LEGEND */}
        <section className="ax-card ax-col--5" role="region" aria-label="Pin legend and map options">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Pin legend</h2>
              <p className="ax-card__subtitle">Marker colours by location type</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            {[
              { c: 'var(--ax-accent)', label: 'Retail store', n: '2' },
              { c: 'var(--ax-viz-violet)', label: 'Office', n: '1' },
              { c: 'var(--ax-viz-cyan)', label: 'Warehouse', n: '1' },
              { c: 'var(--ax-viz-emerald)', label: 'Locker / pickup', n: '1' },
            ].map((r) => (
              <div key={r.label} className="ax-cluster" style={{ justifyContent: 'space-between' }}><span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 10, height: 10, borderRadius: '50% 50% 50% 2px', transform: 'rotate(45deg)', background: r.c }} /><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{r.label}</span></span><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{r.n}</b></div>
            ))}
            <div className="ax-divider" style={{ margin: 'var(--ax-space-2) 0' }} />
            <label className="ax-cluster" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Marker clustering</span>
              <input type="checkbox" className="ax-switch" defaultChecked aria-label="Toggle marker clustering" />
            </label>
            <label className="ax-cluster" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Show traffic layer</span>
              <input type="checkbox" className="ax-switch" aria-label="Toggle traffic layer" />
            </label>
            <label className="ax-cluster" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Auto-fit bounds</span>
              <input type="checkbox" className="ax-switch" defaultChecked aria-label="Toggle auto-fit bounds" />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}

export default Google;

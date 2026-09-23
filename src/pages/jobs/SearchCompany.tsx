/*
 * Vireo React — Search Companies (route "jobs/search-company").
 *
 * Faithful re-expression of src/html/jobs/search-company.html: a hero search
 * bar, a sticky filters sidebar (industry, size, min-open roles, min-rating,
 * remote-first), a result toolbar with chips + sort + grid/list segment, paged
 * company cards or list rows, empty state and pagination. The Alpine
 * axSearchCompany() state is ported to React; classes + ARIA match 1:1.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const C = { cyan: 'var(--ax-viz-cyan)', violet: 'var(--ax-viz-violet)', pink: 'var(--ax-viz-pink)', amber: 'var(--ax-viz-amber)', emerald: 'var(--ax-viz-emerald)' };
const INDUSTRIES = [
  { id: 'SaaS', label: 'SaaS', count: 74 },
  { id: 'Fintech', label: 'Fintech', count: 58 },
  { id: 'E-commerce', label: 'E-commerce', count: 46 },
  { id: 'Healthcare', label: 'Healthcare', count: 39 },
  { id: 'Manufacturing', label: 'Manufacturing', count: 31 },
  { id: 'Agency', label: 'Agency', count: 28 },
];
const SIZES = [
  { id: 'startup', label: '1–50', count: 96 },
  { id: 'mid', label: '51–250', count: 118 },
  { id: 'large', label: '251–1,000', count: 64 },
  { id: 'enterprise', label: '1,000+', count: 34 },
];

interface Co {
  id: string; name: string; mark: string; c: string; verified: boolean; domain: string; industry: string;
  size: number; sizeLabel: string; sizeBand: string; hq: string; remote: boolean; rating: number; openings: number;
  following: boolean; tagline: string;
}
const ROWS: Co[] = [
  { id: 'co01', name: 'Northwind Labs', mark: 'NW', c: C.cyan, verified: true, domain: 'northwind.io', industry: 'SaaS', size: 240, sizeLabel: '240', sizeBand: 'mid', hq: 'Berlin, DE', remote: true, rating: 4.7, openings: 18, following: true, tagline: 'Analytics platform helping product teams ship with confidence. Backed by a strong design-system culture and a remote-first team across the EU.' },
  { id: 'co02', name: 'Brightline Capital', mark: 'BC', c: C.amber, verified: true, domain: 'brightline.co', industry: 'Fintech', size: 118, sizeLabel: '118', sizeBand: 'mid', hq: 'New York, US', remote: false, rating: 4.4, openings: 9, following: false, tagline: 'Mid-market lending infrastructure with a sharp go-to-market team. Hiring across sales, risk, and platform engineering this quarter.' },
  { id: 'co03', name: 'Crate & Co', mark: 'CC', c: C.violet, verified: false, domain: 'crateco.com', industry: 'E-commerce', size: 64, sizeLabel: '64', sizeBand: 'mid', hq: 'Amsterdam, NL', remote: false, rating: 4.2, openings: 5, following: false, tagline: 'Modern homewares brand with a beloved checkout experience. Small, design-led team that ships fast and obsesses over the unboxing moment.' },
  { id: 'co04', name: 'Meridian Health', mark: 'MH', c: C.pink, verified: true, domain: 'meridianhealth.org', industry: 'Healthcare', size: 512, sizeLabel: '512', sizeBand: 'large', hq: 'Remote · US', remote: true, rating: 4.6, openings: 24, following: true, tagline: 'Clinical-risk prediction at scale. Mission-driven org pairing rigorous data science with a genuinely supportive engineering culture.' },
  { id: 'co05', name: 'Loop Robotics', mark: 'LR', c: C.emerald, verified: true, domain: 'looprobotics.com', industry: 'Manufacturing', size: 340, sizeLabel: '340', sizeBand: 'large', hq: 'Tokyo, JP', remote: false, rating: 4.5, openings: 12, following: false, tagline: 'Warehouse automation hardware + software. Tight-knit robotics team solving gnarly real-world problems with elegant control systems.' },
  { id: 'co06', name: 'Studioform', mark: 'SF', c: C.violet, verified: false, domain: 'studioform.de', industry: 'Agency', size: 28, sizeLabel: '28', sizeBand: 'startup', hq: 'Munich, DE', remote: true, rating: 4.8, openings: 4, following: false, tagline: 'Boutique product design studio for ambitious B2B founders. Senior team, no juniors, every project shipped is portfolio-grade.' },
  { id: 'co07', name: 'Clearbox', mark: 'CB', c: C.cyan, verified: true, domain: 'clearbox.app', industry: 'SaaS', size: 92, sizeLabel: '92', sizeBand: 'mid', hq: 'Remote · EU', remote: true, rating: 4.6, openings: 16, following: false, tagline: 'Event-driven automation engine for ops teams. Engineering-first culture with thoughtful APIs and an unusually low meeting load.' },
  { id: 'co08', name: 'Ridgeline Energy', mark: 'RE', c: C.pink, verified: true, domain: 'ridgeline.energy', industry: 'Manufacturing', size: 780, sizeLabel: '780', sizeBand: 'large', hq: 'Austin, US', remote: false, rating: 4.3, openings: 31, following: false, tagline: 'Grid-optimisation software for renewable operators. Scaling fast — building out product, platform, and data teams across three offices.' },
  { id: 'co09', name: 'Pulse Media', mark: 'PM', c: C.amber, verified: false, domain: 'pulse.media', industry: 'Agency', size: 46, sizeLabel: '46', sizeBand: 'startup', hq: 'London, UK', remote: true, rating: 4.1, openings: 3, following: false, tagline: 'Performance marketing collective for DTC brands. Lean, senior, and data-obsessed with a transparent, async-first way of working.' },
  { id: 'co10', name: 'Harbor Freight Co', mark: 'HF', c: C.emerald, verified: true, domain: 'harborfreight.co', industry: 'E-commerce', size: 156, sizeLabel: '156', sizeBand: 'mid', hq: 'Remote · UK', remote: true, rating: 4.4, openings: 8, following: false, tagline: 'B2B marketplace for industrial supplies. Profitable, calm, and quietly excellent — a place engineers tend to stay for years.' },
  { id: 'co11', name: 'Postoak Insurance', mark: 'PI', c: C.violet, verified: true, domain: 'postoak.com', industry: 'Fintech', size: 430, sizeLabel: '430', sizeBand: 'large', hq: 'Chicago, US', remote: false, rating: 4.0, openings: 14, following: false, tagline: 'Digital-first commercial insurance. Modernising a century-old industry with clean software and a refreshingly human claims experience.' },
  { id: 'co12', name: 'Meadow Foods', mark: 'MF', c: C.cyan, verified: false, domain: 'meadowfoods.co', industry: 'E-commerce', size: 210, sizeLabel: '210', sizeBand: 'mid', hq: 'Dublin, IE', remote: false, rating: 4.2, openings: 6, following: false, tagline: 'Sustainable grocery brand with a loyal subscriber base. Values-led team scaling supply chain, growth, and a small but mighty product crew.' },
];

const X12 = (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
);
const VERIFIED = (
  <span style={{ color: 'var(--ax-viz-cyan)', display: 'inline-flex' }} title="Verified"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></svg></span>
);

export function SearchCompany() {
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [sort, setSort] = useState('openings');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [minOpen, setMinOpen] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fIndustry, setFIndustry] = useState<string[]>([]);
  const [fSize, setFSize] = useState<string[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>(() => Object.fromEntries(ROWS.map((r) => [r.id, r.following])));

  const reset = () => { setQ(''); setLoc(''); setMinOpen(0); setMinRating(0); setRemoteOnly(false); setFIndustry([]); setFSize([]); setSort('openings'); setPage(1); };

  const activeChips = useMemo(() => {
    const out: { k: string; label: string; clear: () => void }[] = [];
    if (minOpen > 0) out.push({ k: 'op', label: minOpen + '+ roles', clear: () => { setMinOpen(0); setPage(1); } });
    if (minRating > 0) out.push({ k: 'rt', label: minRating.toFixed(1) + '★ & up', clear: () => { setMinRating(0); setPage(1); } });
    if (remoteOnly) out.push({ k: 'rm', label: 'Remote-first', clear: () => { setRemoteOnly(false); setPage(1); } });
    fIndustry.forEach((id) => out.push({ k: 'i' + id, label: id, clear: () => { setFIndustry((p) => p.filter((x) => x !== id)); setPage(1); } }));
    fSize.forEach((id) => { const s = SIZES.find((x) => x.id === id); if (s) out.push({ k: 'z' + id, label: s.label, clear: () => { setFSize((p) => p.filter((x) => x !== id)); setPage(1); } }); });
    return out;
  }, [minOpen, minRating, remoteOnly, fIndustry, fSize]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase(), l = loc.trim().toLowerCase();
    const r = ROWS.filter((x) => {
      if (t && !(x.name.toLowerCase().includes(t) || x.industry.toLowerCase().includes(t) || x.tagline.toLowerCase().includes(t) || x.domain.toLowerCase().includes(t))) return false;
      if (l && !x.hq.toLowerCase().includes(l)) return false;
      if (fIndustry.length && !fIndustry.includes(x.industry)) return false;
      if (fSize.length && !fSize.includes(x.sizeBand)) return false;
      if (minOpen > 0 && x.openings < minOpen) return false;
      if (minRating > 0 && x.rating < minRating) return false;
      if (remoteOnly && !x.remote) return false;
      return true;
    });
    if (sort === 'rating') return [...r].sort((a, b) => b.rating - a.rating);
    if (sort === 'size') return [...r].sort((a, b) => b.size - a.size);
    if (sort === 'name') return [...r].sort((a, b) => a.name.localeCompare(b.name));
    return [...r].sort((a, b) => b.openings - a.openings);
  }, [q, loc, fIndustry, fSize, minOpen, minRating, remoteOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paged = filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage);
  const rangeStart = filtered.length ? (page - 1) * perPage + 1 : 0;
  const rangeEnd = Math.min(page * perPage, filtered.length);
  const pageList = (): (number | '…')[] => { const tp = totalPages, p = page, out: (number | '…')[] = []; if (tp <= 7) { for (let i = 1; i <= tp; i++) out.push(i); return out; } out.push(1); if (p > 3) out.push('…'); for (let i = Math.max(2, p - 1); i <= Math.min(tp - 1, p + 1); i++) out.push(i); if (p < tp - 2) out.push('…'); out.push(tp); return out; };

  return (
    <>
      <PageHead
        title="Search Companies"
        subtitle="312 companies hiring now — 1,284 open roles across 38 industries."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4" /></svg>
              <span className="ax-btn__label">Followed (12)</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5a5 5 0 1 0 0 10a5 5 0 0 0 0 -10" /><path d="M21 21l-6 -6" /><path d="M5 10h10" /></svg>
              <span className="ax-btn__label">Create alert</span>
            </button>
          </>
        }
      />

      {/* SEARCH BAR */}
      <section className="ax-card" role="search" aria-label="Company search" style={{ marginBottom: 'var(--ax-space-6)' }}>
        <div className="ax-card__body ax-jobs-search" style={{ display: 'grid', gap: 'var(--ax-space-3)', alignItems: 'end' }}>
          <div className="ax-field" style={{ margin: 0 }}>
            <label className="ax-label" htmlFor="sco-keyword">Company or keyword</label>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={SEARCH_ICON}><path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /><path d="M9 9l0 .01" /><path d="M9 12l0 .01" /><path d="M9 15l0 .01" /><path d="M9 18l0 .01" /></svg>
              <input id="sco-keyword" type="search" className="ax-input" placeholder="e.g. Northwind Labs, fintech, design…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ paddingInlineStart: 38 }} aria-label="Search companies" />
            </div>
          </div>
          <div className="ax-field" style={{ margin: 0 }}>
            <label className="ax-label" htmlFor="sco-loc">Headquarters</label>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={SEARCH_ICON}><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></svg>
              <input id="sco-loc" type="text" className="ax-input" placeholder="City, country or Remote-first" value={loc} onChange={(e) => { setLoc(e.target.value); setPage(1); }} style={{ paddingInlineStart: 38 }} aria-label="Headquarters location" />
            </div>
          </div>
          <button type="button" className="ax-btn ax-btn--primary" style={{ height: 42 }} onClick={() => setPage(1)}>
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5a5 5 0 1 0 0 10a5 5 0 0 0 0 -10" /><path d="M21 21l-6 -6" /></svg>
            <span className="ax-btn__label">Search</span>
          </button>
        </div>
      </section>

      {/* LAYOUT */}
      <div className="ax-jobs-split" style={{ display: 'grid', gridTemplateColumns: '280px minmax(0,1fr)', gap: 'var(--ax-space-6)', alignItems: 'start' }}>
        {/* FILTERS */}
        <aside className="ax-card" role="region" aria-label="Filters" style={{ position: 'sticky', top: 'var(--ax-space-4)' }}>
          <div className="ax-card__header">
            <div className="ax-card__titles"><h2 className="ax-card__title">Filters</h2></div>
            <button type="button" className="ax-btn ax-btn--link ax-btn--sm" onClick={reset}>Reset</button>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <fieldset style={FS}>
              <legend className="ax-label" style={LEGEND}>Industry</legend>
              <div style={COL}>{INDUSTRIES.map((ind) => <FacetCheck key={ind.id} label={ind.label} count={ind.count} checked={fIndustry.includes(ind.id)} onChange={(c) => { setFIndustry((p) => c ? [...p, ind.id] : p.filter((x) => x !== ind.id)); setPage(1); }} />)}</div>
            </fieldset>
            <hr className="ax-divider" style={{ margin: 0 }} />
            <fieldset style={FS}>
              <legend className="ax-label" style={LEGEND}>Company size</legend>
              <div style={COL}>{SIZES.map((s) => <FacetCheck key={s.id} label={s.label} count={s.count} checked={fSize.includes(s.id)} onChange={(c) => { setFSize((p) => c ? [...p, s.id] : p.filter((x) => x !== s.id)); setPage(1); }} />)}</div>
            </fieldset>
            <hr className="ax-divider" style={{ margin: 0 }} />
            <fieldset style={FS}>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-3)' }}>
                <legend className="ax-label" style={{ padding: 0, margin: 0 }}>Min. open roles</legend>
                <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)' }}>{minOpen}+</b>
              </div>
              <input type="range" className="ax-range ax-range--native" min={0} max={40} step={2} value={minOpen} onChange={(e) => { setMinOpen(Number(e.target.value)); setPage(1); }} aria-label="Minimum number of open roles" style={{ width: '100%' }} />
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginTop: 6 }}><small className="ax-num" style={SMALL}>0</small><small className="ax-num" style={SMALL}>40+</small></div>
            </fieldset>
            <hr className="ax-divider" style={{ margin: 0 }} />
            <fieldset style={FS}>
              <legend className="ax-label" style={LEGEND}>Min. rating</legend>
              <div style={COL}>{[0, 3, 3.5, 4, 4.5].map((r) => (
                <label key={r} className="ax-check" style={{ display: 'flex', gap: 'var(--ax-space-3)', alignItems: 'center', minHeight: 'auto', cursor: 'pointer' }}>
                  <input type="radio" name="sco-rating" className="ax-radio" value={r} checked={minRating === r} onChange={() => { setMinRating(r); setPage(1); }} />
                  <span className="ax-num" style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{r === 0 ? 'Any rating' : r.toFixed(1) + '★ & up'}</span>
                </label>
              ))}</div>
            </fieldset>
            <hr className="ax-divider" style={{ margin: 0 }} />
            <label className="ax-check" style={{ display: 'flex', gap: 'var(--ax-space-3)', alignItems: 'center', justifyContent: 'space-between', minHeight: 'auto', cursor: 'pointer' }}>
              <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Remote-first only</span>
              <input type="checkbox" role="switch" className="ax-switch ax-switch--sm" checked={remoteOnly} onChange={(e) => { setRemoteOnly(e.target.checked); setPage(1); }} aria-label="Remote-first only" />
            </label>
          </div>
        </aside>

        {/* RESULTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
          <section className="ax-card" role="region" aria-label="Results toolbar">
            <div className="ax-card__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ax-space-3)', flexWrap: 'wrap', paddingBlock: 'var(--ax-space-4)' }}>
              <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                <b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{filtered.length}</b> companies match
                {!!activeChips.length && ' ·'}
                {activeChips.map((c) => (
                  <span key={c.k} className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill ax-badge--sm" style={{ marginInlineStart: 6 }}>
                    <span>{c.label}</span>
                    <button type="button" onClick={c.clear} aria-label="Remove filter" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0, marginInlineStart: 4 }}>{X12}</button>
                  </span>
                ))}
              </p>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                <label className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Sort
                  <select className="ax-select ax-select--sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort companies" style={{ minWidth: 150 }}>
                    <option value="openings">Most open roles</option>
                    <option value="rating">Top rated</option>
                    <option value="size">Largest</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </label>
                <div className="ax-segment" role="group" aria-label="View mode">
                  <button type="button" className={`ax-segment__option ax-btn--icon${view === 'grid' ? ' is-active' : ''}`} aria-checked={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view"><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M14 14h6v6h-6z" /></svg></button>
                  <button type="button" className={`ax-segment__option ax-btn--icon${view === 'list' ? ' is-active' : ''}`} aria-checked={view === 'list'} onClick={() => setView('list')} aria-label="List view"><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></svg></button>
                </div>
              </div>
            </div>
          </section>

          {/* GRID VIEW */}
          {view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 'var(--ax-space-5)' }}>
              {paged.map((co) => (
                <article key={co.id} className="ax-card ax-card--interactive" style={{ margin: 0 }} role="region" aria-label={co.name}>
                  <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
                    <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', minWidth: 0 }}>
                        <span className="ax-avatar ax-avatar--lg ax-avatar--squircle" style={{ background: `color-mix(in oklab,${co.c} 18%,transparent)`, color: co.c, fontWeight: 700, flex: '0 0 auto' }}><b style={{ fontSize: 'var(--ax-text-md)' }}>{co.mark}</b></span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ax-cluster" style={{ gap: 6 }}>
                            <a href="#" className="ax-text-truncate" style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 600, color: 'var(--ax-text-strong)', textDecoration: 'none' }}>{co.name}</a>
                            {co.verified && VERIFIED}
                          </div>
                          <div className="ax-num ax-text-truncate" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', fontFamily: 'var(--ax-font-mono)' }}>{co.domain}</div>
                        </div>
                      </div>
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setFollowing((p) => ({ ...p, [co.id]: !p[co.id] }))} aria-pressed={following[co.id]} aria-label={following[co.id] ? 'Unfollow' : 'Follow'} style={following[co.id] ? { color: 'var(--ax-accent)' } : undefined}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill={following[co.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4" /></svg></button>
                    </div>

                    <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>{co.tagline}</p>

                    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                      <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">{co.industry}</span>
                      <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">{co.sizeLabel + ' staff'}</span>
                      {co.remote && <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">Remote-first</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ax-space-3)', paddingTop: 'var(--ax-space-3)', borderTop: '1px solid var(--ax-border)' }}>
                      <div><small style={STAT_LBL}>Open</small><b className="ax-num" style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-md)' }}>{co.openings}</b></div>
                      <div><small style={STAT_LBL}>Rating</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>{co.rating.toFixed(1)}<span style={{ color: 'var(--ax-viz-amber)', fontSize: 'var(--ax-text-sm)' }}> ★</span></b></div>
                      <div><small style={STAT_LBL}>HQ</small><b className="ax-text-truncate" style={{ display: 'block', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)', fontWeight: 'var(--ax-weight-semibold)' }}>{co.hq}</b></div>
                    </div>

                    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                      <Link to="/jobs/search-jobs" className="ax-btn ax-btn--primary ax-btn--sm" style={{ flex: '1 1 auto' }}>View <span>{co.openings}</span> roles</Link>
                      <a href="#" className="ax-btn ax-btn--secondary ax-btn--sm ax-btn--icon" aria-label="Company website"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" /></svg></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              {paged.map((co) => (
                <article key={co.id} className="ax-card ax-card--interactive" role="region" aria-label={co.name}>
                  <div className="ax-card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-4)', flexWrap: 'wrap' }}>
                    <span className="ax-avatar ax-avatar--lg ax-avatar--squircle" style={{ background: `color-mix(in oklab,${co.c} 18%,transparent)`, color: co.c, fontWeight: 700, flex: '0 0 auto' }}><b style={{ fontSize: 'var(--ax-text-md)' }}>{co.mark}</b></span>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div className="ax-cluster" style={{ gap: 6 }}>
                        <a href="#" className="ax-text-truncate" style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 600, color: 'var(--ax-text-strong)', textDecoration: 'none' }}>{co.name}</a>
                        {co.verified && VERIFIED}
                      </div>
                      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', marginTop: 2 }}>
                        <span className="ax-cluster" style={{ gap: 5, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}><svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></svg><span>{co.hq}</span></span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">{co.industry}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 64 }}><small style={STAT_LBL}>Staff</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{co.sizeLabel}</b></div>
                    <div style={{ textAlign: 'center', minWidth: 64 }}><small style={STAT_LBL}>Rating</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)' }}>{co.rating.toFixed(1)}<span style={{ color: 'var(--ax-viz-amber)' }}> ★</span></b></div>
                    <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill"><span className="ax-num">{co.openings}</span>&nbsp;open</span>
                    <Link to="/jobs/search-jobs" className="ax-btn ax-btn--secondary ax-btn--sm">View roles</Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* empty */}
          {!filtered.length && (
            <div className="ax-card">
              <div className="ax-card__body" style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
                <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-subtle)', margin: '0 auto var(--ax-space-4)' }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 28, height: 28 }}><path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /></svg></span>
                <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>No companies found</h3>
                <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>Try a different industry or lower the minimum open-roles threshold.</p>
                <button type="button" className="ax-btn ax-btn--secondary" onClick={reset}>Clear all filters</button>
              </div>
            </div>
          )}

          {/* pagination */}
          {!!filtered.length && (
            <div className="ax-card">
              <div className="ax-card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)', paddingBlock: 'var(--ax-space-4)' }}>
                <span className="ax-pagination__summary ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>Showing <span>{rangeStart}</span>–<span>{rangeEnd}</span> of <span>{filtered.length}</span></span>
                <nav className="ax-pagination" aria-label="Pagination">
                  <button type="button" className="ax-pagination__prev" disabled={page === 1} aria-disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))} aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                  <ul className="ax-pagination__pages">
                    {pageList().map((p, i) => (
                      <li key={i}>{p === '…' ? <span className="ax-pagination__ellipsis">…</span> : <button type="button" className={`ax-pagination__page${page === p ? ' is-active' : ''}`} aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>{p}</button>}</li>
                    ))}
                  </ul>
                  <button type="button" className="ax-pagination__next" disabled={page === totalPages} aria-disabled={page === totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))} aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Track sizing is class-based here rather than inline so the breakpoints
           below can actually win — inline styles outrank every selector. */
        .ax-jobs-search{ grid-template-columns:2fr 1.4fr auto; }
        /* minmax(0,1fr), not 1fr: a bare 1fr track floors at the min-content of
           its items, and the cards' min-content is wider than a phone.
           minmax(0,…) drops that floor so they reflow instead. */
        @media (max-width: 1024px){ .ax-jobs-split{ grid-template-columns:minmax(0,1fr) !important; } .ax-jobs-split > aside{ position:static !important; } }
        @media (max-width: 768px){ .ax-jobs-search{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}

const SEARCH_ICON: React.CSSProperties = { position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--ax-text-subtle)' };
const FS: React.CSSProperties = { border: 0, padding: 0, margin: 0 };
const LEGEND: React.CSSProperties = { marginBottom: 'var(--ax-space-3)', padding: 0 };
const COL: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' };
const SMALL: React.CSSProperties = { fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' };
const STAT_LBL: React.CSSProperties = { display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em' };

function FacetCheck({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="ax-check" style={{ display: 'flex', gap: 'var(--ax-space-3)', alignItems: 'center', justifyContent: 'space-between', minHeight: 'auto', cursor: 'pointer' }}>
      <span className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
        <input type="checkbox" className="ax-checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{label}</span>
      </span>
      <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{count}</span>
    </label>
  );
}

export default SearchCompany;

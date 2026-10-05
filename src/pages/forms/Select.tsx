/*
 * Vireo React — Enhanced Select (route "forms/select").
 *
 * Faithful re-expression of src/html/forms/select.html: a searchable single
 * combobox (grouped), a multi-select with chips, a tag-create input, a tree
 * select with disclosure carets, and a static panel-states card (loading / empty
 * / error). Per-card Alpine x-data is ported to React state; classes + ARIA match
 * the reference 1:1.
 */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';
import { useClickOutside } from '../../hooks/useClickOutside';

const COUNTRY_GROUPS: Record<string, string[]> = {
  Americas: ['United States', 'Canada', 'Brazil', 'Mexico'],
  Europe: ['United Kingdom', 'Germany', 'France', 'Spain', 'Netherlands'],
  'Asia Pacific': ['Japan', 'Singapore', 'Australia', 'India'],
};
const ALL_DEPTS = ['Design', 'Engineering', 'Marketing', 'Sales', 'Support', 'Finance', 'Operations', 'Legal'];
const SUGGESTED = ['responsive', 'accessibility', 'tailwind', 'alpine', 'vite'];
const X = (size = 13) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>;
const CHECK = (size = 16) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>;

function SingleSelect() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [value, setValue] = useState('United States');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const q = query.toLowerCase();
  const filtered: Record<string, string[]> = {};
  for (const [g, items] of Object.entries(COUNTRY_GROUPS)) { const m = items.filter((i) => i.toLowerCase().includes(q)); if (m.length) filtered[g] = m; }
  const empty = Object.keys(filtered).length === 0;
  return (
    <section className="ax-card ax-col--6" role="region" aria-label="Searchable single select">
      <div className="ax-card__header"><div className="ax-card__titles"><span className="ax-card__eyebrow">Combobox</span><h2 className="ax-card__title">Searchable Single</h2><p className="ax-card__subtitle">Type to filter grouped options.</p></div></div>
      <div className="ax-card__body">
        <div className="ax-field">
          <label className="ax-label" id="cs-label">Country</label>
          <div className="ax-combobox" ref={ref}>
            <button type="button" className="ax-combobox__trigger" aria-expanded={open} aria-haspopup="listbox" aria-labelledby="cs-label" onClick={() => setOpen((v) => !v)}>
              <span className="ax-combobox__value">{value}</span>
              <svg className="ax-combobox__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
            </button>
            {open && (
              <div className="ax-combobox__panel" role="listbox" aria-labelledby="cs-label">
                <input type="text" className="ax-combobox__search" placeholder="Search countries…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search countries" />
                {Object.entries(filtered).map(([g, items]) => (
                  <div key={g}>
                    <div className="ax-combobox__group-label">{g}</div>
                    {items.map((item) => (
                      <div key={item} className="ax-combobox__option" role="option" aria-selected={value === item} onClick={() => { setValue(item); setOpen(false); setQuery(''); }}>
                        <span style={{ flex: 1 }}>{item}</span>
                        {value === item && CHECK()}
                      </div>
                    ))}
                  </div>
                ))}
                {empty && <div className="ax-combobox__empty">No countries match "{query}".</div>}
              </div>
            )}
          </div>
          <span className="ax-help">Drives the region label and postal mask elsewhere.</span>
        </div>
      </div>
    </section>
  );
}

function MultiSelect() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(['Design', 'Engineering']);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const filtered = ALL_DEPTS.filter((o) => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase()));
  const toggle = (o: string) => { setSelected((s) => s.includes(o) ? s.filter((x) => x !== o) : [...s, o]); setQuery(''); };
  const remove = (o: string) => setSelected((s) => s.filter((x) => x !== o));
  return (
    <section className="ax-card ax-col--6" role="region" aria-label="Multi select with chips">
      <div className="ax-card__header"><div className="ax-card__titles"><span className="ax-card__eyebrow">Combobox</span><h2 className="ax-card__title">Multi-select Chips</h2><p className="ax-card__subtitle">Choose several; remove with the chip ✕.</p></div></div>
      <div className="ax-card__body">
        <div className="ax-field">
          <label className="ax-label" id="cm-label">Departments</label>
          <div className="ax-combobox" ref={ref}>
            <div className="ax-combobox__trigger" aria-expanded={open} style={{ flexWrap: 'wrap', gap: 'var(--ax-space-1)', minHeight: 'var(--ax-control-h)', height: 'auto', paddingBlock: 'var(--ax-space-1)', alignItems: 'center' }} onClick={() => setOpen(true)}>
              {selected.map((o) => (
                <span key={o} className="ax-badge ax-badge--soft" style={{ gap: 'var(--ax-space-1)' }}>
                  <span>{o}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); remove(o); }} aria-label={'Remove ' + o} style={{ display: 'inline-flex', border: 0, background: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>{X()}</button>
                </span>
              ))}
              {!selected.length && <span style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-sm)' }}>Select departments…</span>}
              <svg className="ax-combobox__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginInlineStart: 'auto' }}><path d="M6 9l6 6l6 -6" /></svg>
            </div>
            {open && (
              <div className="ax-combobox__panel" role="listbox" aria-labelledby="cm-label" aria-multiselectable="true">
                <input type="text" className="ax-combobox__search" placeholder="Filter…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter departments" />
                {filtered.map((o) => (
                  <div key={o} className="ax-combobox__option" role="option" aria-selected="false" onClick={() => toggle(o)}>
                    <span className="ax-checkbox" aria-hidden="true" style={{ pointerEvents: 'none' }} />
                    <span>{o}</span>
                  </div>
                ))}
                {!filtered.length && <div className="ax-combobox__empty">Everything is selected.</div>}
              </div>
            )}
          </div>
          <span className="ax-help"><span className="ax-num">{selected.length}</span> of <span className="ax-num">{ALL_DEPTS.length}</span> selected.</span>
        </div>
      </div>
    </section>
  );
}

function TagCreate() {
  const [tags, setTags] = useState(['aurora', 'glassmorphism', 'dark-mode']);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const add = () => { const v = draft.trim().replace(/,$/, ''); if (v && !tags.includes(v)) setTags((t) => [...t, v]); setDraft(''); };
  const remove = (t: string) => setTags((x) => x.filter((y) => y !== t));
  return (
    <section className="ax-card ax-col--6" role="region" aria-label="Tag creation input">
      <div className="ax-card__header"><div className="ax-card__titles"><span className="ax-card__eyebrow">Tags</span><h2 className="ax-card__title">Create Tags</h2><p className="ax-card__subtitle">Press Enter or comma to add; Backspace removes the last.</p></div></div>
      <div className="ax-card__body">
        <div className="ax-field">
          <label className="ax-label" htmlFor="ct-input">Project tags</label>
          <div className="ax-tags" onClick={() => inputRef.current?.focus()}>
            {tags.map((t) => (
              <span key={t} className="ax-badge ax-badge--soft" style={{ gap: 'var(--ax-space-1)' }}>
                <span>{t}</span>
                <button type="button" onClick={() => remove(t)} aria-label={'Remove ' + t} style={{ display: 'inline-flex', border: 0, background: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>{X()}</button>
              </span>
            ))}
            <input id="ct-input" type="text" className="ax-tags__input" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a tag…"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } else if (e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !draft && tags.length) setTags((t) => t.slice(0, -1)); }} />
          </div>
          <span className="ax-help">Tags are lowercased and de-duplicated automatically.</span>
        </div>
        <div style={{ marginTop: 'var(--ax-space-5)' }}>
          <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Suggested</div>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            {SUGGESTED.map((s) => (
              <button key={s} type="button" className="ax-badge ax-badge--soft ax-badge--pill" style={{ cursor: 'pointer', borderStyle: 'dashed' }} onClick={() => { if (!tags.includes(s)) setTags((t) => [...t, s]); }}>
                <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TreeSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('Lighting');
  const [valuePath, setValuePath] = useState('Home › Decor › Lighting');
  const [expanded, setExpanded] = useState({ home: true, decor: true, apparel: false });
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const pick = (name: string, path: string) => { setValue(name); setValuePath(path); setOpen(false); };
  const caret = (rotated: boolean) => <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={rotated ? { transform: 'rotate(90deg)', transition: '.15s' } : { transition: '.15s' }}><path d="M9 6l6 6l-6 6" /></svg>;
  const leaf = (name: string, path: string) => (
    <div className="ax-combobox__option" role="treeitem" aria-selected={value === name} onClick={() => pick(name, path)}><span style={{ width: 16 }} /><span style={{ flex: 1 }}>{name}</span>{value === name && CHECK()}</div>
  );
  return (
    <section className="ax-card ax-col--6" role="region" aria-label="Tree select">
      <div className="ax-card__header"><div className="ax-card__titles"><span className="ax-card__eyebrow">Tree</span><h2 className="ax-card__title">Tree Select</h2><p className="ax-card__subtitle">Nested categories with disclosure carets.</p></div></div>
      <div className="ax-card__body">
        <div className="ax-field">
          <label className="ax-label" id="ctree-label">Category</label>
          <div className="ax-combobox" ref={ref}>
            <button type="button" className="ax-combobox__trigger" aria-expanded={open} aria-haspopup="tree" aria-labelledby="ctree-label" onClick={() => setOpen((v) => !v)}>
              <span className="ax-combobox__value" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{value}</span>
                <span style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>{valuePath}</span>
              </span>
              <svg className="ax-combobox__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
            </button>
            {open && (
              <div className="ax-combobox__panel" role="tree" aria-labelledby="ctree-label">
                <div role="treeitem" aria-expanded={expanded.home}>
                  <div className="ax-combobox__option" onClick={() => setExpanded((e) => ({ ...e, home: !e.home }))} style={{ fontWeight: 'var(--ax-weight-medium)' }}>
                    {caret(expanded.home)}
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-viz-cyan)' }}><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /></svg>
                    <span>Home</span>
                  </div>
                  {expanded.home && (
                    <div style={{ paddingInlineStart: 'var(--ax-space-5)' }}>
                      <div role="treeitem" aria-expanded={expanded.decor}>
                        <div className="ax-combobox__option" onClick={() => setExpanded((e) => ({ ...e, decor: !e.decor }))} style={{ fontWeight: 'var(--ax-weight-medium)' }}>
                          {caret(expanded.decor)}
                          <span>Decor</span>
                        </div>
                        {expanded.decor && (
                          <div style={{ paddingInlineStart: 'var(--ax-space-5)' }}>
                            {leaf('Lighting', 'Home › Decor › Lighting')}
                            {leaf('Rugs', 'Home › Decor › Rugs')}
                            {leaf('Wall Art', 'Home › Decor › Wall Art')}
                          </div>
                        )}
                      </div>
                      {leaf('Furniture', 'Home › Furniture')}
                    </div>
                  )}
                </div>
                <div role="treeitem" aria-expanded={expanded.apparel}>
                  <div className="ax-combobox__option" onClick={() => setExpanded((e) => ({ ...e, apparel: !e.apparel }))} style={{ fontWeight: 'var(--ax-weight-medium)' }}>
                    {caret(expanded.apparel)}
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-viz-violet)' }}><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /></svg>
                    <span>Apparel</span>
                  </div>
                  {expanded.apparel && (
                    <div style={{ paddingInlineStart: 'var(--ax-space-5)' }}>
                      <div className="ax-combobox__option" role="treeitem" aria-selected={value === 'Outerwear'} onClick={() => pick('Outerwear', 'Apparel › Outerwear')}><span style={{ width: 16 }} /><span style={{ flex: 1 }}>Outerwear</span></div>
                      <div className="ax-combobox__option" role="treeitem" aria-selected={value === 'Footwear'} onClick={() => pick('Footwear', 'Apparel › Footwear')}><span style={{ width: 16 }} /><span style={{ flex: 1 }}>Footwear</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="ax-help">Selected path: <span style={{ color: 'var(--ax-text)' }}>{valuePath}</span></span>
        </div>
      </div>
    </section>
  );
}

export function FormsSelect() {
  return (
    <>
      <PageHead
        title="Enhanced Select"
        subtitle="Searchable, multi-select with chips, tag creation & a tree picker — fully keyboard & ARIA aware."
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/forms/elements">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 9l4 -4l4 4" /><path d="M16 15l-4 4l-4 -4" /></svg>
            <span className="ax-btn__label">Native selects</span>
          </Link>
        }
      />

      <div className="ax-dash-grid">
        <SingleSelect />
        <MultiSelect />
        <TagCreate />
        <TreeSelect />

        {/* States */}
        <section className="ax-card ax-col--12" role="region" aria-label="Select states">
          <div className="ax-card__header"><div className="ax-card__titles"><span className="ax-card__eyebrow">States</span><h2 className="ax-card__title">Panel States</h2><p className="ax-card__subtitle">Loading, empty &amp; error — how remote-backed selects communicate.</p></div></div>
          <div className="ax-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--ax-space-4)' }}>
            <div>
              <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Loading</div>
              <div className="ax-combobox__panel" style={{ position: 'static', maxHeight: 'none' }}>
                <div className="ax-combobox__empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--ax-space-2)' }}>
                  <span className="ax-spinner ax-spinner--sm" aria-hidden="true" />
                  <span>Loading options…</span>
                </div>
              </div>
            </div>
            <div>
              <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>No results</div>
              <div className="ax-combobox__panel" style={{ position: 'static', maxHeight: 'none' }}>
                <input type="text" className="ax-combobox__search" defaultValue="zzqx" readOnly aria-label="Search" />
                <div className="ax-combobox__empty">
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-text-subtle)', marginBottom: 'var(--ax-space-1)' }}><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                  <div>No matches for "zzqx".</div>
                </div>
              </div>
            </div>
            <div>
              <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Error</div>
              <div className="ax-combobox__panel" style={{ position: 'static', maxHeight: 'none' }}>
                <div className="ax-combobox__empty" style={{ color: 'var(--ax-danger-500)' }}>
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 'var(--ax-space-1)' }}><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                  <div>Couldn't load options.</div>
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ marginTop: 'var(--ax-space-2)' }}><span className="ax-btn__label">Retry</span></button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default FormsSelect;

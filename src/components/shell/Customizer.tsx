/*
 * Vireo React — Theme Customizer offcanvas (re-expression of partials/customizer.html).
 *
 * Native React drawer (Alpine axCustomizer re-implementation): color mode,
 * direction, 12 accent presets, custom colors, navigation, shell style, sidebar,
 * header, layout, and the loader toggle. Every control calls a CustomizerContext
 * setter that flips the <html> data-ax-* attribute + persists the ax: key. Same
 * .ax-customizer DOM classes/ARIA as the reference so it renders identically.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCustomizer } from '../../context/CustomizerContext';
import { PRESETS } from '../../lib/theme';
import { CUSTOM_FONT } from '../../lib/fonts';
import type { FontRecord } from '../../lib/google-fonts';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const CHECK = (
  <svg className="ax-swatch__check ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
);

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ax-segmented" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          className={`ax-segmented__btn${value === v ? ' is-active' : ''}`}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
        >
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
}

function SchemeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const schemes = ['light', 'dark', 'brand', 'gradient', 'transparent'];
  return (
    <div className="ax-scheme-row" role="radiogroup" aria-label={label}>
      {schemes.map((s) => (
        <button
          key={s}
          type="button"
          className={`ax-scheme ax-scheme--${s}${value === s ? ' is-active' : ''}`}
          role="radio"
          aria-checked={value === s}
          aria-label={s[0].toUpperCase() + s.slice(1)}
          onClick={() => onChange(s)}
        />
      ))}
    </div>
  );
}

/*
 * FONT — the family in use, plus a search across every Google family.
 * There is no shortlist: the default (Inter) keeps the shipped Inter +
 * Space Grotesk pairing, and anything picked from the catalog drives body
 * AND headings. Webfonts are only fetched once selected, and the searchable
 * catalog is a lazy chunk (lib/google-fonts.ts), so this whole section costs
 * nothing on a page load that never opens the panel.
 */
function FontSection() {
  const c = useCustomizer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FontRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  // The debounce timer, plus the live query the async replies are checked
  // against (state is a render behind inside a promise callback).
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = useRef('');

  const clearSearch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    live.current = '';
    setQuery('');
    setResults([]);
    setSearching(false);
    setSearched(false);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const runSearch = useCallback(() => {
    const q = live.current.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSearched(false);
    void c.searchFonts(q, 24).then((hits) => {
      if (live.current.trim() !== q) return; // a stale reply must not win
      setResults(hits);
      setSearching(false);
      setSearched(true);
    });
  }, [c]);

  const onQuery = (value: string) => {
    setQuery(value);
    live.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(runSearch, 160);
  };

  /** Apply a family by name — a search hit, or whatever was typed. */
  const pickFont = (family: string) => {
    c.pickFont(family);
    clearSearch();
  };

  /** Back to the shipped Inter + Space Grotesk pairing. */
  const resetFont = () => {
    c.resetFont();
    clearSearch();
  };

  /**
   * Enter applies the best match. It re-runs the search rather than trusting
   * `results`, which may still be a debounce behind what was typed — otherwise
   * a fast typist hitting Enter applies their half-finished query as a literal
   * family name.
   */
  const submitSearch = () => {
    const q = live.current.trim();
    if (!q) return;
    if (timer.current) clearTimeout(timer.current);
    void c.searchFonts(q, 24).then((hits) => pickFont(hits.length ? hits[0].family : q));
  };

  const isCustom = c.font === CUSTOM_FONT;

  return (
    <section className="ax-customizer__section">
      <p className="ax-eyebrow">Font</p>

      {/* What is applied right now, printed in its own typeface. */}
      <div className={`ax-font-active${isCustom ? ' is-custom' : ''}`}>
        <span className="ax-font-active__text">
          <span className="ax-font-active__label">Current font</span>
          <span className="ax-font-active__name" style={{ fontFamily: `"${c.fontFamily}", var(--ax-font-sans)` }}>{c.fontFamily}</span>
        </span>
        {isCustom && (
          <button type="button" className="ax-font-active__clear" onClick={resetFont} aria-label="Reset to the default font">Reset</button>
        )}
      </div>

      {/* ANY Google family. The catalog is searched offline against a bundled
          snapshot — no API key, which a static template has nowhere safe to put. */}
      <div className="ax-font-search">
        <svg className="ax-icon ax-font-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
        <input
          type="search"
          className="ax-font-search__input"
          placeholder="Search all Google Fonts…"
          aria-label="Search all Google Fonts"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => c.loadFontCatalog()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitSearch();
              return;
            }
            // Escape clears the search first; only an empty field lets it close the panel.
            if (e.key === 'Escape' && query) {
              e.stopPropagation();
              clearSearch();
            }
          }}
        />
        {query && (
          <button type="button" className="ax-font-search__clear" onClick={clearSearch} aria-label="Clear font search">
            <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {!!query.trim() && (results.length > 0 || searching || searched) && (
        <div className="ax-font-results">
          <div role="listbox" aria-label="Google Fonts results">
            {results.map((f) => (
              <button
                key={f.family}
                type="button"
                className={`ax-font-result${c.fontFamily === f.family ? ' is-active' : ''}`}
                role="option"
                aria-selected={c.fontFamily === f.family}
                style={{ fontFamily: `"${f.family}", var(--ax-font-sans)` }}
                onClick={() => pickFont(f.family)}
              >
                <span className="ax-font-result__name">{f.family}</span>
                <span className="ax-font-result__cat">{f.category}</span>
              </button>
            ))}
          </div>
          {searching && !results.length && <p className="ax-font-results__msg">Searching…</p>}
          {/* The snapshot ages; a family added to Google Fonts since then is still
              usable by name, so never dead-end on "no results". */}
          {searched && !results.length && (
            <p className="ax-font-results__msg">
              No match in the catalog.{' '}
              <button type="button" className="ax-link" onClick={() => pickFont(query)}>Use “<span>{query.trim()}</span>” anyway</button>
            </p>
          )}
        </div>
      )}

      <p className="ax-note">Search any of the ~1,800 Google Fonts families. Sets body text &amp; headings · code keeps JetBrains Mono. The chosen family loads from Google Fonts on demand.</p>
    </section>
  );
}

export function Customizer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useCustomizer();
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, open);

  return (
    <aside
      id="ax-customizer"
      className={`ax-customizer${open ? ' ax-customizer--enter' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ax-customizer-title"
      ref={ref}
      style={{ display: open ? undefined : 'none' }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <button type="button" className="ax-customizer__backdrop" onClick={onClose} aria-label="Close customizer" tabIndex={-1} />

      {/* HEADER */}
      <div className="ax-customizer__head">
        <div className="ax-customizer__head-text">
          <h2 id="ax-customizer-title" className="ax-customizer__title">Theme Customizer</h2>
          <p className="ax-customizer__sub">Live preview — changes save automatically</p>
        </div>
        <button type="button" className="ax-icon-btn ax-customizer__close" onClick={onClose} aria-label="Close customizer">
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
        </button>
      </div>

      {/* BODY */}
      <div className="ax-customizer__body">
        {/* COLOR MODE */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Color Mode</p>
          <Segmented
            label="Color mode"
            value={c.mode}
            onChange={c.setMode}
            options={[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']]}
          />
        </section>

        {/* DIRECTION */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Direction</p>
          <Segmented label="Direction" value={c.dir} onChange={c.setDir} options={[['ltr', 'LTR'], ['rtl', 'RTL']]} />
        </section>

        {/* FONT */}
        <FontSection />

        {/* ACCENT PRESETS */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Accent Presets</p>
          <div className="ax-swatch-grid" role="radiogroup" aria-label="Accent color">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`ax-swatch${c.accent === p.value ? ' is-active' : ''}`}
                role="radio"
                aria-checked={c.accent === p.value}
                style={{ ['--sw' as string]: p.base }}
                aria-label={p.label}
                onClick={() => c.setAccent(p.value)}
              >
                {c.accent === p.value && CHECK}
              </button>
            ))}
          </div>
        </section>

        {/* CUSTOM COLORS */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Custom Colors</p>
          <label className="ax-color-field">
            <span className="ax-color-field__label">Primary</span>
            <span className="ax-color-field__controls">
              <input type="color" className="ax-color-input" value={c.customAccent || '#1E856C'} onChange={(e) => c.setCustomAccent(e.target.value)} aria-label="Custom primary color" />
              <input type="text" className="ax-hex" value={c.customAccent} placeholder="#RRGGBB" onChange={(e) => c.setCustomAccent(e.target.value)} aria-label="Custom primary hex" />
            </span>
          </label>
          <div className="ax-recent-swatches" role="group" aria-label="Recently used colors">
            {c.recentAccents.map((hex) => (
              <button key={hex} type="button" className="ax-recent-swatch" style={{ ['--sw' as string]: hex }} aria-label={hex} onClick={() => c.setCustomAccent(hex)} />
            ))}
          </div>
          <label className="ax-color-field">
            <span className="ax-color-field__label">Background</span>
            <span className="ax-color-field__controls">
              <input type="color" className="ax-color-input" onChange={(e) => c.setCustomBg(e.target.value)} aria-label="Custom background color" />
            </span>
          </label>
          <div className="ax-tint-row" role="group" aria-label="Background presets">
            {[['#FCFBF9', 'Porcelain (default)'], ['#F4F6F8', 'Cool Gray'], ['#F7F3EC', 'Warm Sand'], ['#EFF1F4', 'Slate Mist']].map(([hex, label]) => (
              <button key={hex} type="button" className="ax-tint" style={{ ['--sw' as string]: hex }} aria-label={label} onClick={() => c.setCustomBg(hex)} />
            ))}
          </div>
          {c.bgLowContrast && <p className="ax-note ax-note--warn">Low contrast — text may be hard to read.</p>}
        </section>

        {/* NAVIGATION */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Navigation</p>
          <p className="ax-customizer__label">Orientation</p>
          <Segmented label="Navigation orientation" value={c.nav} onChange={(v) => c.setReg('nav', v)} options={[['vertical', 'Vertical'], ['horizontal', 'Horizontal'], ['hybrid', 'Hybrid']]} />
          <p className="ax-customizer__label">Menu interaction</p>
          <Segmented label="Menu interaction" value={c.menu} onChange={(v) => c.setReg('menu', v)} options={[['click', 'Click'], ['hover', 'Hover']]} />
        </section>

        {/* SHELL STYLE */}
        {c.nav !== 'horizontal' && (
          <section className="ax-customizer__section">
            <p className="ax-eyebrow">Shell Style</p>
            <div className="ax-style-list ax-style-list--pair" role="radiogroup" aria-label="Shell style">
              <button type="button" className={`ax-style${c.shellStyle === 'default' ? ' is-active' : ''}`} role="radio" aria-checked={c.shellStyle === 'default'} onClick={() => c.setReg('shell-style', 'default')}>
                <span className="ax-style__diagram ax-style__diagram--default" aria-hidden="true"></span>
                <span className="ax-style__label">Docked</span>
              </button>
              <button type="button" className={`ax-style${c.shellStyle === 'detached' ? ' is-active' : ''}`} role="radio" aria-checked={c.shellStyle === 'detached'} onClick={() => c.setReg('shell-style', 'detached')}>
                <span className="ax-style__diagram ax-style__diagram--detached" aria-hidden="true"></span>
                <span className="ax-style__label">Detached</span>
              </button>
            </div>
          </section>
        )}

        {/* SIDEBAR */}
        {c.nav !== 'horizontal' && (
          <section className="ax-customizer__section">
            <p className="ax-eyebrow">Sidebar</p>
            <p className="ax-customizer__label">Behavior</p>
            <Segmented label="Sidebar behavior" value={c.sidebarBehavior} onChange={(v) => c.setReg('sidebar-behavior', v)} options={[['collapsible', 'Collapsible'], ['expanded', 'Expanded'], ['compact', 'Compact']]} />
            <p className="ax-customizer__label">Position</p>
            <Segmented label="Sidebar position" value={c.sidebarPos} onChange={(v) => c.setReg('sidebar-position', v)} options={[['fixed', 'Fixed'], ['static', 'Static']]} />
            <p className="ax-customizer__label">Color scheme</p>
            <SchemeRow label="Sidebar color scheme" value={c.sidebarScheme} onChange={(v) => c.setReg('sidebar-scheme', v)} />
          </section>
        )}

        {/* HEADER */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Header</p>
          <p className="ax-customizer__label">Position</p>
          <Segmented label="Header position" value={c.headerPos} onChange={(v) => c.setReg('header-position', v)} options={[['fixed', 'Fixed'], ['static', 'Static']]} />
          <p className="ax-customizer__label">Color scheme</p>
          <SchemeRow label="Header color scheme" value={c.headerScheme} onChange={(v) => c.setReg('header-scheme', v)} />
        </section>

        {/* LAYOUT */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Layout</p>
          <p className="ax-customizer__label">Page style</p>
          <Segmented label="Page style" value={c.page} onChange={(v) => c.setReg('page', v)} options={[['regular', 'Regular'], ['classic', 'Classic'], ['compact', 'Compact']]} />
          <p className="ax-customizer__label">Width</p>
          <Segmented label="Layout width" value={c.width} onChange={(v) => c.setReg('width', v)} options={[['fluid', 'Fluid'], ['full', 'Full']]} />
        </section>

        {/* MISC / LOADER */}
        <section className="ax-customizer__section">
          <p className="ax-eyebrow">Misc</p>
          <label className="ax-toggle">
            <span className="ax-toggle__label">Page loader</span>
            <input type="checkbox" className="ax-toggle__input" checked={c.loader === 'on'} onChange={(e) => c.setReg('loader', e.target.checked ? 'on' : 'off')} />
            <span className="ax-toggle__track" aria-hidden="true"><span className="ax-toggle__thumb"></span></span>
          </label>
        </section>
      </div>

      {/* FOOTER */}
      <div className="ax-customizer__foot">
        <button type="button" className="ax-btn ax-btn--ghost-danger" onClick={c.reset}>Reset</button>
        <button type="button" className="ax-btn ax-btn--ghost" onClick={c.copyConfig}>Copy config</button>
      </div>
    </aside>
  );
}

export default Customizer;

/*
 * Vireo React — Command palette (⌘K).
 *
 * Native re-implementation of core/command-palette.js rendering the shell of
 * partials/command.html: backdrop button, panel, query row (search icon + input
 * + "esc" keycap + close icon-button), the #ax-command-results listbox and the
 * footer key hints. Same DOM classes and ARIA as the reference so shell.css §13
 * paints it identically — including the phone layout, where the esc keycap is
 * swapped for the close button and the foot is hidden.
 *
 * Mounted from <Layout/> AND <AppLayout/> (never from a standalone page), which
 * is this edition's equivalent of the base including {{> command}} on the 163
 * app-shell pages and on none of the 23 standalone ones. It lives at the root of
 * those layouts, NOT inside the header: the header's backdrop-filter makes it a
 * containing block for fixed descendants and would pin the overlay in the bar.
 *
 * SEARCH SEMANTICS — ported from the module, bug fixes included:
 *   · the result group comes from the manifest section on the BRANCH ROOT of the
 *     trail, not the leaf (leaves carry no `section`, so reading it there put
 *     every page in the catch-all "Pages" bucket);
 *   · fuzzy matching runs against the TITLE only — over title+keywords a
 *     subsequence match on a 60-char haystack surfaced "503 Service Unavailable"
 *     and "Breadcrumb" for the query "email";
 *   · scores: title prefix 100, title substring 70, keyword substring 40,
 *     fuzzy title 20; ties break on title; each group shows at most 8 rows.
 *
 * FOCUS — the module has to release its trap and blur BEFORE it sets
 * aria-hidden/hidden, because hiding a subtree that still owns the focused
 * element strands it (and Chrome refuses the attribute outright). Here the
 * dialog is UNMOUNTED instead of hidden, and useFocusTrap hands focus back to
 * the opener in its cleanup — so the hazard cannot arise in the first place.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { manifest, hrefForSlug } from '../../lib/manifest';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCustomizer } from '../../context/CustomizerContext';
import * as store from '../../lib/storage';

const RECENT_KEY = 'ax:cmd-recent';
const RECENT_MAX = 5;

/* Manifest section → result group. Anything unmapped lands in "Pages", which is
   itself in GROUP_ORDER, so a new section can never drop rows silently. */
const GROUPS: Record<string, string> = {
  MAIN: 'Dashboards',
  APPLICATIONS: 'Apps',
  MODULES: 'Modules',
  'UI & FORMS': 'UI & Forms',
  PAGES: 'Pages',
  DOCS: 'Docs',
};
const GROUP_ORDER = ['Dashboards', 'Apps', 'Modules', 'UI & Forms', 'Pages', 'Docs', 'Actions'];

function groupFor(section: string | null | undefined): string {
  return (section && GROUPS[section]) || 'Pages';
}

interface Item {
  group: string;
  title: string;
  slug?: string;
  href?: string;
  crumb: string;
  keywords: string;
  external?: boolean;
  action?: 'toggle-theme' | 'open-customizer';
}
type Row = { groupHeader: string } | Item;

function isHeader(row: Row): row is { groupHeader: string } {
  return (row as { groupHeader?: string }).groupHeader !== undefined;
}

function buildItems(): Item[] {
  const items: Item[] = [];
  for (const node of manifest.nodes) {
    if (node.alias) continue; // canonical entries only
    if (node.parent === null) continue; // skip bare section groups as page rows
    const trail = manifest.trail(node);
    const crumb = trail
      .slice(0, -1)
      .map((n) => n.title)
      .join(' / ');
    items.push({
      // Only the ROOT of each branch carries `section` in the manifest.
      group: groupFor(trail[0] && trail[0].section),
      title: node.title,
      slug: node.slug,
      href: hrefForSlug(node.slug),
      crumb: crumb || 'Home',
      keywords: (node.keywords || []).join(' '),
      external: !!node.external,
    });
  }
  items.push(
    { group: 'Actions', title: 'Toggle dark mode', action: 'toggle-theme', crumb: 'Theme', keywords: 'dark light theme mode' },
    { group: 'Actions', title: 'Open theme customizer', action: 'open-customizer', crumb: 'Settings', keywords: 'customizer settings theme appearance' },
  );
  return items;
}

function fuzzy(hay: string, q: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

function getRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(store.get(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
function pushRecent(slug: string): void {
  const list = getRecent().filter((s) => s !== slug);
  list.unshift(slug);
  store.set(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
}

function search(items: Item[], recent: string[], q: string): Row[] {
  const query = (q || '').trim().toLowerCase();
  if (!query) {
    const base: Row[] = [];
    if (recent.length) {
      base.push({ groupHeader: 'Recent' });
      recent.forEach((slug) => {
        const it = items.find((i) => i.slug === slug);
        if (it) base.push(it);
      });
    }
    // a small default set of top pages + actions when no query
    base.push({ groupHeader: 'Pages' });
    items
      .filter((i) => i.group !== 'Actions')
      .slice(0, 6)
      .forEach((i) => base.push(i));
    base.push({ groupHeader: 'Actions' });
    items.filter((i) => i.group === 'Actions').forEach((i) => base.push(i));
    return base;
  }

  const scored: Array<{ it: Item; score: number }> = [];
  for (const it of items) {
    const hay = (it.title + ' ' + (it.keywords || '')).toLowerCase();
    const titleLc = it.title.toLowerCase();
    let score = -1;
    if (titleLc.startsWith(query)) score = 100;
    else if (titleLc.indexOf(query) !== -1) score = 70;
    else if (hay.indexOf(query) !== -1) score = 40;
    else if (fuzzy(titleLc, query)) score = 20;
    if (score >= 0) scored.push({ it, score });
  }
  scored.sort((a, b) => b.score - a.score || a.it.title.localeCompare(b.it.title));

  const buckets: Record<string, Item[]> = {};
  scored.forEach(({ it }) => {
    (buckets[it.group] = buckets[it.group] || []).push(it);
  });
  const out: Row[] = [];
  GROUP_ORDER.forEach((g) => {
    if (buckets[g] && buckets[g].length) {
      out.push({ groupHeader: g });
      buckets[g].slice(0, 8).forEach((i) => out.push(i));
    }
  });
  return out;
}

export function CommandPalette({
  open,
  onClose,
  onCustomizer,
}: {
  open: boolean;
  onClose: () => void;
  onCustomizer: () => void;
}) {
  const navigate = useNavigate();
  const c = useCustomizer();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const items = useMemo(buildItems, []);
  useFocusTrap(panelRef, open);

  const results = useMemo(() => search(items, recent, q), [items, recent, q]);
  const selectable = useMemo(() => results.filter((r): r is Item => !isHeader(r)), [results]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    setRecent(getRecent());
    // body scroll-lock for as long as the dialog owns the viewport
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  // keep the highlighted row in view (the module's scrollIntoView block:'nearest')
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-ax-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open, results]);

  const go = useCallback(
    (row: Item) => {
      if (row.action === 'toggle-theme') {
        c.toggleTheme();
        onClose();
        return;
      }
      if (row.action === 'open-customizer') {
        onClose();
        onCustomizer();
        return;
      }
      if (row.slug) pushRecent(row.slug);
      if (row.href) {
        if (row.external) window.open(row.href, '_blank', 'noopener');
        else navigate(row.href);
      }
      onClose();
    },
    [c, navigate, onClose, onCustomizer],
  );

  if (!open) return null;

  const step = (i: number) => {
    if (!selectable.length) return;
    setActive((i + selectable.length) % selectable.length);
  };

  const onKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        step(active + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        step(active - 1);
        break;
      case 'Enter': {
        e.preventDefault();
        const row = selectable[active];
        if (row) go(row);
        break;
      }
    }
  };

  let selIndex = -1;

  return (
    <div
      id="ax-command"
      className="ax-command is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ax-command-title"
      onKeyDown={onKey}
    >
      {/* Click-catch scrim, painted behind the panel. */}
      <button
        type="button"
        className="ax-command__backdrop"
        data-ax-command-backdrop
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
      />

      <div className="ax-command__panel" ref={panelRef}>
        <h2 id="ax-command-title" className="ax-visually-hidden">Search or jump to</h2>

        {/* ===== QUERY ROW ===== */}
        <div className="ax-command__input">
          <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true">
            <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path d="M21 21l-6 -6" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            data-ax-command-input
            placeholder="Search pages, apps and actions…"
            aria-label="Search pages, apps and actions"
            aria-controls="ax-command-results"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd className="ax-command__keycap ax-command__keycap--esc">esc</kbd>
          <button
            type="button"
            className="ax-icon-btn ax-command__close"
            data-ax-command-close
            aria-label="Close search"
            onClick={onClose}
          >
            <svg className="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== RESULTS ===== */}
        <div
          id="ax-command-results"
          className="ax-command__results"
          data-ax-command-results
          role="listbox"
          aria-label="Search results"
          ref={listRef}
        >
          {!selectable.length && (
            <p className="ax-command__empty">
              No matches for “{q.trim()}” — try a page name or "settings".
            </p>
          )}
          {results.map((row, i) => {
            if (isHeader(row)) {
              return (
                <p key={`h-${row.groupHeader}-${i}`} className="ax-command__group">
                  {row.groupHeader}
                </p>
              );
            }
            selIndex += 1;
            const idx = selIndex;
            const on = idx === active;
            return (
              <button
                key={`r-${row.slug || row.action}-${i}`}
                type="button"
                className={`ax-command__row${on ? ' is-active' : ''}`}
                role="option"
                aria-selected={on}
                data-ax-index={idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(row)}
              >
                <span className="ax-command__row-title">{row.title}</span>
                <span className="ax-command__crumb">{row.crumb || ''}</span>
              </button>
            );
          })}
        </div>

        {/* ===== KEY HINTS (pointer/keyboard only — hidden on phones) ===== */}
        <div className="ax-command__foot" aria-hidden="true">
          <span className="ax-command__hint"><kbd className="ax-command__keycap">↑</kbd><kbd className="ax-command__keycap">↓</kbd>navigate</span>
          <span className="ax-command__hint"><kbd className="ax-command__keycap">↵</kbd>open</span>
          <span className="ax-command__hint"><kbd className="ax-command__keycap">esc</kbd>close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

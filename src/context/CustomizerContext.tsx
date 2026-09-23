/*
 * Vireo React — Customizer / theme state provider.
 *
 * Single source of UI truth for the theme attribute contract. It mirrors the
 * current <html> data-ax-* attributes into React state and exposes setters that
 * call the pure lib/theme mutators (which set the attribute + persist the ax:
 * key + dispatch ax:change). The anti-flash IIFE in index.html has already
 * painted the correct first frame; this provider just re-reads it on mount and
 * keeps the controls in sync.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as theme from '../lib/theme';
import * as store from '../lib/storage';
import type { FontRecord } from '../lib/google-fonts';

export interface CustomizerState {
  mode: string; // light | dark | system
  themeResolved: string; // light | dark (actual painted)
  dir: string; // ltr | rtl
  lang: string;
  accent: string;
  customAccent: string;
  recentAccents: string[];
  nav: string;
  shellStyle: string;
  sidebarBehavior: string;
  menu: string;
  page: string;
  width: string;
  headerPos: string;
  sidebarPos: string;
  sidebarScheme: string;
  headerScheme: string;
  sidebarImage: string;
  loader: string;
  font: string; // registry value: 'inter' (default) | 'custom'
  fontFamily: string; // the family actually dressing the UI, by name
  collapsed: boolean;
  bgLowContrast: boolean;
}

export interface CustomizerApi extends CustomizerState {
  setMode: (m: string) => void;
  setDir: (d: string) => void;
  setLang: (l: string) => void;
  setAccent: (a: string) => void;
  setCustomAccent: (hex: string) => void;
  setCustomBg: (hex: string) => void;
  setReg: (name: string, value: string) => void;
  /** Back to the shipped Inter + Space Grotesk pairing. */
  resetFont: () => void;
  /** Apply a family by name — a search hit, or whatever was typed. */
  pickFont: (family: string) => void;
  /** Pull the catalog chunk (call on first focus so the first keystroke has it). */
  loadFontCatalog: () => void;
  /** Offline search across the whole Google Fonts snapshot. */
  searchFonts: (query: string, limit?: number) => Promise<FontRecord[]>;
  toggleTheme: () => void;
  toggleCollapsed: () => void;
  reset: () => void;
  copyConfig: () => void;
}

function read(): CustomizerState {
  const D = document.documentElement;
  return {
    mode: theme.currentValueOf('mode'),
    themeResolved: D.getAttribute('data-ax-theme') === 'dark' ? 'dark' : 'light',
    dir: theme.currentValueOf('dir'),
    lang: theme.currentValueOf('lang'),
    accent: theme.currentValueOf('accent'),
    customAccent: store.get('ax:accent-custom') || '',
    recentAccents: theme.recentSwatches(),
    nav: theme.currentValueOf('nav'),
    shellStyle: theme.currentValueOf('shell-style'),
    sidebarBehavior: theme.currentValueOf('sidebar-behavior'),
    menu: theme.currentValueOf('menu'),
    page: theme.currentValueOf('page'),
    width: theme.currentValueOf('width'),
    headerPos: theme.currentValueOf('header-position'),
    sidebarPos: theme.currentValueOf('sidebar-position'),
    sidebarScheme: theme.currentValueOf('sidebar-scheme'),
    headerScheme: theme.currentValueOf('header-scheme'),
    sidebarImage: theme.currentValueOf('sidebar-image'),
    loader: theme.currentValueOf('loader'),
    font: theme.currentValueOf('font'),
    fontFamily: theme.currentFontFamily(),
    collapsed: theme.isCollapsed(),
    bgLowContrast: false,
  };
}

const Ctx = createContext<CustomizerApi | null>(null);

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomizerState>(() => read());
  const sync = useCallback(() => setState(read()), []);

  // Wire the live system-theme listener once; re-sync on any ax:change.
  useEffect(() => {
    theme.listenSystem();
    const onChange = () => sync();
    document.addEventListener('ax:change', onChange);
    return () => document.removeEventListener('ax:change', onChange);
  }, [sync]);

  const api = useMemo<CustomizerApi>(
    () => ({
      ...state,
      setMode: (m) => {
        theme.setMode(m);
        sync();
      },
      setDir: (d) => {
        theme.setDir(d);
        sync();
      },
      setLang: (l) => {
        theme.setLang(l);
        sync();
      },
      setAccent: (a) => {
        theme.setAccent(a);
        sync();
      },
      setCustomAccent: (hex) => {
        const low = theme.isLowContrast(hex);
        theme.setCustomAccent(hex);
        setState((s) => ({ ...read(), bgLowContrast: low ? s.bgLowContrast : s.bgLowContrast }));
      },
      setCustomBg: (hex) => {
        const low = theme.setCustomBg(hex);
        setState({ ...read(), bgLowContrast: low });
      },
      setReg: (name, value) => {
        theme.setByName(name, value);
        sync();
      },
      resetFont: () => {
        theme.resetFont();
        sync();
      },
      pickFont: (family) => {
        if (!theme.setCustomFont(family)) return;
        sync();
      },
      loadFontCatalog: () => {
        void theme.loadFontCatalog();
      },
      searchFonts: (query, limit) => theme.searchFonts(query, limit),
      toggleTheme: () => {
        theme.quickToggleTheme();
        sync();
      },
      toggleCollapsed: () => {
        theme.toggleCollapsed();
        sync();
      },
      reset: () => {
        theme.reset();
        setState({ ...read(), bgLowContrast: false });
      },
      copyConfig: () => {
        theme.copyConfig();
      },
    }),
    [state, sync],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCustomizer(): CustomizerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomizer must be used within CustomizerProvider');
  return ctx;
}

/*
 * Vireo React — entry point.
 *
 * Imports the shared Aurora token core (app.css) ONCE as the single stylesheet,
 * runs the non-blocking theme re-sync (the blocking first-paint copy is the
 * inline IIFE in index.html), then mounts the app. StrictMode is intentionally
 * omitted so effect-guarded chart components mount once (no double-render churn
 * of the imperative ApexCharts instances).
 */
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import { App } from './App';
import { listenSystem } from './lib/theme';

// Wire the live system-theme listener (mirrors core/theme-restore.js init()).
listenSystem();

createRoot(document.getElementById('root')!).render(<App />);

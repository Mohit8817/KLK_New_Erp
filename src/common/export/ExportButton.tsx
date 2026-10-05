import { useState, useRef, useEffect } from 'react';
import {
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
  type ExportColumn,
} from './exportUtils';

const ICON_DOWNLOAD = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <polyline points="7 11 12 16 17 11" />
    <line x1="12" y1="4" x2="12" y2="16" />
  </svg>
);

const ICON_CHEVRON = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
  /** 'button' (single click CSV export) or 'dropdown' (menu with Excel, CSV, Copy, Print) */
  mode?: 'button' | 'dropdown';
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ExportButton<T>({
  data,
  columns,
  filename = 'Export_Data',
  title = 'Table Export',
  mode = 'dropdown',
  label = 'Export',
  className = '',
  size = 'sm',
}: ExportButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleExportCSV = () => {
    exportDataToCSV(filename, data, columns);
    setOpen(false);
  };

  const handleExportExcel = () => {
    exportDataToExcel(filename, data, columns, title);
    setOpen(false);
  };

  const handleCopy = async () => {
    const success = await copyTableDataToClipboard(data, columns);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  const handlePrint = () => {
    printTableData(title, data, columns);
    setOpen(false);
  };

  const isSm = size === 'sm';
  const btnBaseClass = isSm
    ? 'ax-btn ax-btn--secondary ax-btn--sm'
    : 'ax-btn ax-btn--secondary';

  if (mode === 'button') {
    return (
      <button
        type="button"
        onClick={handleExportCSV}
        className={`${btnBaseClass} ${className}`}
        title="Export records to CSV"
        disabled={data.length === 0}
      >
        {ICON_DOWNLOAD}
        <span className="ax-btn__label">{label}</span>
      </button>
    );
  }

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${btnBaseClass} inline-flex items-center gap-1.5 cursor-pointer`}
        aria-expanded={open}
        aria-haspopup="true"
        disabled={data.length === 0}
      >
        {copied ? (
          <span className="text-emerald-600">{ICON_CHECK}</span>
        ) : (
          ICON_DOWNLOAD
        )}
        <span className="ax-btn__label">{copied ? 'Copied!' : label}</span>
        <span className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          {ICON_CHEVRON}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs sm:text-sm animate-fadeIn"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleExportCSV}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-[10px]">
              CSV
            </span>
            <span>Export to CSV (.csv)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleExportExcel}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-[10px]">
              XLS
            </span>
            <span>Export to Excel (.xls)</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy to Clipboard</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handlePrint}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Table</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;

import { useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

export interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
}

export interface TableExportToolbarProps {
  onCopy?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  columns?: ColumnDef[];
  onToggleColumn?: (key: string) => void;
  className?: string;
}

const ICON_COPY = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ICON_CSV = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ICON_EXCEL = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13l3 4" />
    <path d="M11 13l-3 4" />
    <path d="M14 13h3v4h-3z" />
  </svg>
);

const ICON_PDF = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h2a1.5 1.5 0 0 0 0-3H9v6" />
    <path d="M17 12h-3v6" />
  </svg>
);

const ICON_COLUMNS = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

const ICON_CHEVRON = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function TableExportToolbar({
  onCopy,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  columns,
  onToggleColumn,
  className = '',
}: TableExportToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, showColumnsMenu, () => setShowColumnsMenu(false));

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`ax-cluster ${className}`} style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
      {onCopy && (
        <button
          type="button"
          className="ax-btn ax-btn--secondary ax-btn--sm"
          onClick={handleCopyClick}
          title="Copy rows to clipboard"
        >
          {ICON_COPY}
          <span className="ax-btn__label">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      )}

      {onExportCSV && (
        <button
          type="button"
          className="ax-btn ax-btn--secondary ax-btn--sm"
          onClick={onExportCSV}
          title="Export CSV"
        >
          {ICON_CSV}
          <span className="ax-btn__label">CSV</span>
        </button>
      )}

      {onExportExcel && (
        <button
          type="button"
          className="ax-btn ax-btn--secondary ax-btn--sm"
          onClick={onExportExcel}
          title="Export Excel"
        >
          {ICON_EXCEL}
          <span className="ax-btn__label">Excel</span>
        </button>
      )}

      {onExportPDF && (
        <button
          type="button"
          className="ax-btn ax-btn--secondary ax-btn--sm"
          onClick={onExportPDF}
          title="Export PDF"
        >
          {ICON_PDF}
          <span className="ax-btn__label">PDF</span>
        </button>
      )}

      {columns && columns.length > 0 && onToggleColumn && (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            className={`ax-btn ax-btn--secondary ax-btn--sm ${showColumnsMenu ? 'is-active' : ''}`}
            onClick={() => setShowColumnsMenu((prev) => !prev)}
            aria-expanded={showColumnsMenu}
            aria-haspopup="true"
            title="Toggle visible columns"
          >
            {ICON_COLUMNS}
            <span className="ax-btn__label">Columns</span>
            {ICON_CHEVRON}
          </button>

          {showColumnsMenu && (
            <div
              className="ax-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                zIndex: 100,
                minWidth: '180px',
                maxHeight: '260px',
                overflowY: 'auto',
                background: 'var(--ax-surface-overlay)',
                border: '1px solid var(--ax-border)',
                borderRadius: 'var(--ax-radius-md)',
                boxShadow: 'var(--ax-shadow-lg)',
                padding: 'var(--ax-space-2)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 600,
                  color: 'var(--ax-text-muted)',
                  padding: '4px 8px',
                  borderBottom: '1px solid var(--ax-border-subtle)',
                  marginBottom: '4px',
                }}
              >
                Toggle Columns
              </div>
              {columns.map((c) => (
                <label
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px',
                    fontSize: 'var(--ax-text-xs)',
                    color: 'var(--ax-text)',
                    cursor: 'pointer',
                    borderRadius: 'var(--ax-radius-sm)',
                    userSelect: 'none',
                  }}
                  className="ax-dropdown-item"
                >
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={() => onToggleColumn(c.key)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TableExportToolbar;

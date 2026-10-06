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
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ICON_CSV = (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ICON_EXCEL = (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13l3 4" />
    <path d="M11 13l-3 4" />
    <path d="M14 13h3v4h-3z" />
  </svg>
);

const ICON_PDF = (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h2a1.5 1.5 0 0 0 0-3H9v6" />
    <path d="M17 12h-3v6" />
  </svg>
);

const ICON_COLUMNS = (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

const ICON_CHEVRON = (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TOOLBAR_CSS = `
  .ax-export-toolbar {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
    box-sizing: border-box;
  }

  .ax-export-toolbar__button {
    min-width: 0;
    white-space: nowrap;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .ax-export-toolbar__columns {
    position: relative;
    min-width: 0;
    flex: 0 0 auto;
  }

  .ax-export-toolbar__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 1000;
    width: 220px;
    max-width: min(220px, calc(100vw - 24px));
    max-height: min(300px, 60vh);
    overflow-y: auto;
    box-sizing: border-box;
  }

  /* Tablet */
  @media (max-width: 900px) {
    .ax-export-toolbar {
      justify-content: flex-start;
    }
  }

  /* Mobile: export buttons ek row mein, Columns neeche full width */
  @media (max-width: 640px) {
    .ax-export-toolbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
      gap: 8px;
      margin-left: 0;
    }

    .ax-export-toolbar__button {
      width: 100%;
      min-height: 40px;
      padding-inline: 8px !important;
      overflow: hidden;
    }

    .ax-export-toolbar__button .ax-btn__label {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ax-export-toolbar__columns {
      grid-column: 1 / -1;
    }

    /* Columns menu: bottom sheet, thumb se easily reachable */
    .ax-export-toolbar__menu {
      position: fixed;
      left: 12px;
      right: 12px;
      top: auto;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      width: auto;
      max-width: none;
      max-height: 60vh;
    }

    .ax-export-toolbar__item {
      min-height: 44px;
      padding: 10px 8px !important;
      font-size: 14px !important;
    }

    .ax-export-toolbar__item input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }
  }

  /* Very small phones */
  @media (max-width: 380px) {
    .ax-export-toolbar {
      grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
      gap: 6px;
    }

    .ax-export-toolbar__button {
      font-size: 10px !important;    
        padding: 3px 4px !important;
      gap: 2px;
    }


    .ax-export-toolbar__button svg {
      width: 12px !important;
      height: 12px !important;
      flex-shrink: 0;
    }
  }
`;

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

  useClickOutside(
    menuRef,
    showColumnsMenu,
    () => setShowColumnsMenu(false)
  );

  const handleCopyClick = () => {
    if (!onCopy) return;

    onCopy();

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      <style>{TOOLBAR_CSS}</style>

      <div
        className={`ax-export-toolbar ${className}`.trim()}
        role="toolbar"
        aria-label="Export and table controls"
      >
        {onCopy && (
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm ax-export-toolbar__button"
            onClick={handleCopyClick}
            title="Copy rows to clipboard"
          >
            {ICON_COPY}
            <span className="ax-btn__label">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        )}

        {onExportCSV && (
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm ax-export-toolbar__button"
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
            className="ax-btn ax-btn--secondary ax-btn--sm ax-export-toolbar__button"
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
            className="ax-btn ax-btn--secondary ax-btn--sm ax-export-toolbar__button"
            onClick={onExportPDF}
            title="Export PDF"
          >
            {ICON_PDF}
            <span className="ax-btn__label">PDF</span>
          </button>
        )}

        {columns && columns.length > 0 && onToggleColumn && (
          <div
            ref={menuRef}
            className="ax-export-toolbar__columns"
          >
            <button
              type="button"
              className={`
                ax-btn
                ax-btn--secondary
                ax-btn--sm
                ax-export-toolbar__button
                ${showColumnsMenu ? 'is-active' : ''}
              `.trim()}
              onClick={() =>
                setShowColumnsMenu((prev) => !prev)
              }
              aria-expanded={showColumnsMenu}
              aria-haspopup="true"
              title="Toggle visible columns"
            >
              {ICON_COLUMNS}

              <span className="ax-btn__label">
                Columns
              </span>

              {ICON_CHEVRON}
            </button>

            {showColumnsMenu && (
              <div
                className="ax-dropdown-menu ax-export-toolbar__menu"
                style={{
                  background:
                    'var(--ax-surface-overlay, #ffffff)',
                  border:
                    '1px solid var(--ax-border, #d9dee7)',
                  borderRadius:
                    'var(--ax-radius-md, 10px)',
                  boxShadow:
                    'var(--ax-shadow-lg, 0 12px 30px rgba(0,0,0,.12))',
                  padding:
                    'var(--ax-space-2, 8px)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--ax-text-xs, 12px)',
                    fontWeight: 600,
                    color: 'var(--ax-text-muted, #667085)',
                    padding: '6px 8px',
                    borderBottom:
                      '1px solid var(--ax-border-subtle, #eef1f5)',
                    marginBottom: 4,
                  }}
                >
                  Toggle Columns
                </div>

                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="ax-dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 8px',
                      fontSize:
                        'var(--ax-text-xs, 12px)',
                      color:
                        'var(--ax-text, #344054)',
                      cursor: 'pointer',
                      borderRadius:
                        'var(--ax-radius-sm, 6px)',
                      userSelect: 'none',
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() =>
                        onToggleColumn(column.key)
                      }
                      style={{
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />

                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default TableExportToolbar;
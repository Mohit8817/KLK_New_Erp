import { useState } from 'react';

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

  /* Tablet */
  @media (max-width: 900px) {
    .ax-export-toolbar {
      justify-content: flex-start;
    }
  }

  /* Mobile */
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
  }

  @media (max-width: 480px) {
    .ax-export-toolbar {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .ax-export-toolbar__button {
      min-height: 38px;
      font-size: var(--ax-text-xs, 12px) !important;
      padding: 6px 8px !important;
    }

    .ax-export-toolbar__button svg {
      width: 13px !important;
      height: 13px !important;
      flex-shrink: 0;
    }
  }

  @media (max-width: 360px) {
    .ax-export-toolbar {
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
    }

    .ax-export-toolbar__button {
      min-height: 36px;
      font-size: 11px !important;
      padding: 4px 6px !important;
      gap: 4px;
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
  className = '',
}: TableExportToolbarProps) {
  const [copied, setCopied] = useState(false);

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
        aria-label="Export controls"
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
      </div>
    </>
  );
}

export default TableExportToolbar;

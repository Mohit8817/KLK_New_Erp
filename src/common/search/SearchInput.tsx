import { type ChangeEvent, type CSSProperties } from 'react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  style?: CSSProperties;
  inputStyle?: CSSProperties;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  showClear?: boolean;
}

const SEARCH_CSS = `
  .ax-search-input input[type="search"]::-webkit-search-cancel-button,
  .ax-search-input input[type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  /* Mobile: full-width row, parent ke style ko override karta hai */
  @media (max-width: 640px) {
    .ax-search-input {
      width: 100% !important;
      max-width: 100% !important;
      flex: 1 1 100% !important;
      margin-left: 0 !important;
    }
    .ax-search-input input[type="search"] {
      min-height: 40px;
      font-size: 16px; /* iOS auto-zoom rokne ke liye */
    }
  }
`;

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search…',
  size = 'sm',
  style,
  inputStyle,
  className = '',
  disabled = false,
  ariaLabel = 'Search the grid',
  showClear = true,
}: SearchInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    onSearch?.(val);
  };

  const handleClear = () => {
    onChange('');
    onSearch?.('');
  };

  const isSm = size === 'sm';

  return (
    <>
      <style>{SEARCH_CSS}</style>

      <div
        className={`ax-search-input ${className}`.trim()}
        style={{
          position: 'relative',
          marginLeft: 'auto',
          width: '100%',
          maxWidth: 300,
          flex: '0 1 300px',
          ...style,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            position: 'absolute',
            insetInlineStart: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 18,
            color: 'var(--ax-text-subtle)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
        </svg>

        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          className={`ax-input${isSm ? ' ax-input--sm' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
          style={{
            paddingInlineStart: 34,
            paddingInlineEnd: showClear && value ? 34 : undefined,
            width: '100%',
            boxSizing: 'border-box',
            ...inputStyle,
          }}
        />

        {showClear && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              insetInlineEnd: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ax-text-subtle)',
            }}
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

export default SearchInput;
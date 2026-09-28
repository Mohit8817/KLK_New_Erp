import { type ChangeEvent, type CSSProperties } from 'react';

export interface SearchInputProps {
  /** The search text value */
  value: string;
  /** Callback on text change */
  onChange: (value: string) => void;
  /** Optional callback to reset page to 1 on search change */
  onSearch?: (value: string) => void;
  /** Placeholder text (default: 'Search…') */
  placeholder?: string;
  /** Size variant: sm (ax-input--sm) or regular (ax-input) */
  size?: 'sm' | 'md';
  /** Optional container style overrides */
  style?: CSSProperties;
  /** Optional input style overrides */
  inputStyle?: CSSProperties;
  /** Optional container className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** Show clear button when value is present (default: true) */
  showClear?: boolean;
}

/**
 * Universal Search Input matching Grid.js markup and Aurora theme CSS tokens.
 * Uses exact classes: ax-input, ax-input--sm with the embedded SVG search icon.
 */
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
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    onChange('');
    if (onSearch) onSearch('');
  };

  const isSm = size === 'sm';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        flex: '1 1 220px',
        maxWidth: 300,
        ...style,
      }}
    >
      {/* Grid.js Search Icon */}
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
        }}
      >
        <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
        <path d="M21 21l-6 -6" />
      </svg>

      {/* Grid.js Input */}
      <input
        type="search"
        className={`ax-input${isSm ? ' ax-input--sm' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        style={{
          paddingInlineStart: 34,
          paddingInlineEnd: showClear && value ? 28 : undefined,
          width: '100%',
          ...inputStyle,
        }}
      />

      {/* Optional clear button */}
      {showClear && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            insetInlineEnd: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ax-text-subtle)',
          }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchInput;

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type CSSProperties } from 'react';

const ICON_SEARCH = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const ICON_CLEAR = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface SearchInputProps {
  /** The search text value */
  value: string;
  /** Callback on text change */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant: sm (32px high) or md (40px high) */
  size?: 'sm' | 'md';
  /** Optional debounce delay in ms */
  debounceMs?: number;
  /** Optional clear callback */
  onClear?: () => void;
  /** Additional container styling */
  className?: string;
  /** Custom width style */
  style?: CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  size = 'sm',
  debounceMs = 0,
  onClear,
  className = '',
  style,
  disabled = false,
  ariaLabel = 'Search records',
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if prop value changes externally
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Handle debounce
  useEffect(() => {
    if (debounceMs <= 0) return;
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (debounceMs <= 0) {
      onChange(val);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const isSm = size === 'sm';

  return (
    <div
      className={`relative inline-flex items-center text-slate-400 focus-within:text-[#1A66FF] ${className}`}
      style={style}
    >
      {/* Search Icon */}
      <span className="absolute left-3 flex items-center pointer-events-none transition-colors">
        {ICON_SEARCH}
      </span>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="search"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        autoComplete="off"
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-[#1A66FF] focus:ring-2 focus:ring-[#1A66FF]/15 ${
          isSm ? 'h-9 pl-9 pr-8 text-xs sm:text-sm' : 'h-11 pl-10 pr-9 text-sm'
        }`}
      />

      {/* Clear Button */}
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search query"
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {ICON_CLEAR}
        </button>
      )}
    </div>
  );
}

export default SearchInput;

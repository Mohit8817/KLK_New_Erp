export interface TableEmptyStateProps {
  title?: string;
  message?: string;
  onClear?: () => void;
  clearLabel?: string;
}

/**
 * Universal table empty state matching Grid.js markup and Aurora styling.
 */
export function TableEmptyState({
  title = 'No matches',
  message = 'No rows match your search. Try a different term.',
  onClear,
  clearLabel = 'Clear search',
}: TableEmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--ax-space-10) var(--ax-space-5)' }}>
      <span
        className="ax-avatar ax-avatar--xl ax-avatar--squircle"
        style={{
          background: 'var(--ax-surface-subtle)',
          color: 'var(--ax-text-subtle)',
          margin: '0 auto var(--ax-space-4)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg
          className="ax-avatar__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: 28, height: 28 }}
        >
          <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
        </svg>
      </span>
      <h3 style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', marginBottom: 'var(--ax-space-2)' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', marginBottom: 'var(--ax-space-4)' }}>
        {message}
      </p>
      {onClear && (
        <button type="button" className="ax-btn ax-btn--secondary" onClick={onClear}>
          {clearLabel}
        </button>
      )}
    </div>
  );
}

export default TableEmptyState;

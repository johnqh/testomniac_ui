import type { ReactNode } from 'react';

export interface ListCellProps {
  /** Optional leading icon / indicator. */
  leading?: ReactNode;
  /** Primary line (object name). */
  title: ReactNode;
  /** Secondary line (path, description, etc.). */
  subtitle?: ReactNode;
  /** Non-interactive trailing content — badges, status, counts. */
  trailing?: ReactNode;
  /** Interactive trailing content — buttons (Edit/Delete/Remove/menu). */
  actions?: ReactNode;
  /** When provided, the title/subtitle area becomes a clickable button. */
  onClick?: () => void;
  className?: string;
}

/**
 * The canonical list/cell layout shared by every object cell.
 *
 * Renders a bordered row with an optional leading icon, a title over an
 * optional subtitle, and a trailing area for badges (`trailing`) and buttons
 * (`actions`). When `onClick` is set, only the title/subtitle area is the
 * clickable target, so `actions` stay independently clickable without needing
 * to stop event propagation.
 */
export function ListCell({
  leading,
  title,
  subtitle,
  trailing,
  actions,
  onClick,
  className = '',
}: ListCellProps) {
  const main = (
    <>
      {leading != null && (
        <span className="flex shrink-0 items-center text-gray-400 dark:text-gray-500">
          {leading}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
        {subtitle != null && subtitle !== '' && (
          <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 ${
        onClick ? 'transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
      } ${className}`}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {main}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{main}</div>
      )}
      {(trailing != null || actions != null) && (
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          {actions}
        </div>
      )}
    </div>
  );
}

/** Small right-chevron used as a trailing affordance on navigable cells. */
export function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 text-gray-400 dark:text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

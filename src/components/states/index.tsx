import { LoadingState, EmptyState } from '@sudobility/components';

/**
 * Shared list/detail page state components.
 *
 * `LoadingState` and `EmptyState` are re-exported from the shared design system
 * (`@sudobility/components`) so every page renders consistent feedback states
 * instead of hand-rolling the same markup. `ErrorState` is app-local because
 * the design system does not yet ship an equivalent.
 */
export { LoadingState, EmptyState };

interface ErrorStateProps {
  /** The error message to display (rendered after an `Error:` prefix). */
  message: string;
  /** Wrapper padding/className. Defaults to `p-6` for full-page usage. */
  className?: string;
}

/** Full-width error banner used by list and detail pages. */
export function ErrorState({ message, className = 'p-6' }: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {message}</div>
    </div>
  );
}

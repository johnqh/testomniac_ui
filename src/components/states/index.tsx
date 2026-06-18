import { Alert, LoadingState, EmptyState } from '@sudobility/components';

/**
 * Shared list/detail page state components.
 *
 * `LoadingState` and `EmptyState` are re-exported from the shared design system
 * (`@sudobility/components`) so every page renders consistent feedback states
 * instead of hand-rolling the same markup. `ErrorState` keeps the Testomniac
 * page API stable while rendering the shared Alert primitive.
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
      <Alert variant="error" description={message} />
    </div>
  );
}

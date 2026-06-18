import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

export interface NavigateOptions {
  replace?: boolean;
}

/**
 * Host-supplied routing surface. The library never imports `react-router-dom`;
 * the host (web app via react-router, extension via its own state) provides the
 * current route params and a language-aware `navigate`.
 */
export interface TestomniacRouting {
  /** Current route params (entitySlug, envId, runId, …). */
  params: Record<string, string | undefined>;
  /** Current path (used for active-link highlighting). May include the language prefix. */
  pathname: string;
  /**
   * Navigate to an app-relative path (no language prefix). The host is
   * responsible for prepending the active language, e.g. `/en${path}`.
   */
  navigate: (path: string, options?: NavigateOptions) => void;
  /** Active language code (defaults to `'en'`). */
  currentLanguage: string;
  /** Optional: switch the active language while staying on the page. */
  switchLanguage?: (lang: string) => void;
}

const RoutingContext = createContext<TestomniacRouting | null>(null);

export function RoutingProvider({
  children,
  params,
  pathname,
  navigate,
  currentLanguage,
  switchLanguage,
}: TestomniacRouting & { children: ReactNode }) {
  const value = useMemo<TestomniacRouting>(
    () => ({ params, pathname, navigate, currentLanguage, switchLanguage }),
    [params, pathname, navigate, currentLanguage, switchLanguage]
  );
  return <RoutingContext.Provider value={value}>{children}</RoutingContext.Provider>;
}

export function useTestomniacRouting(): TestomniacRouting {
  const ctx = useContext(RoutingContext);
  if (!ctx) {
    throw new Error('Testomniac UI: components must be rendered inside <RoutingProvider>');
  }
  return ctx;
}

/**
 * Drop-in replacement for react-router's `useParams`, backed by the host
 * routing context.
 */
export function useRouteParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  return useTestomniacRouting().params as T;
}

/**
 * Declarative redirect — router-agnostic replacement for react-router's
 * `<Navigate to=… replace />`. Navigates (via the host context) on mount.
 */
export function Redirect({ to, replace = true }: { to: string; replace?: boolean }) {
  const { navigate } = useTestomniacRouting();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

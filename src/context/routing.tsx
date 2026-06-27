import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

export interface NavigateOptions {
  replace?: boolean;
}

type Id = string | number;

/**
 * App-supplied route builders. The library NEVER constructs `/dashboard/...`
 * path strings itself — it asks the host for them through this contract, so the
 * host owns the entire URL topology (and registers the matching routes).
 *
 * All builders return an app-relative path (no language prefix); `navigate`
 * prepends the active language.
 */
export interface TestomniacRoutes {
  // entity / dashboard level
  entityHome(entitySlug: string): string;
  scanNew(entitySlug: string): string;
  productNew(entitySlug: string): string;
  /** Product-level settings: /dashboard/:slug/products/:productId/settings */
  productSettings(entitySlug: string, productId: Id): string;
  environmentNew(entitySlug: string): string;
  /** Legacy run redirect at the entity level: /dashboard/:slug/runs/:runId */
  entityRun(entitySlug: string, runId: Id): string;

  // environment base: /dashboard/:slug/environments/:envId
  environment(entitySlug: string, envId: Id): string;

  // environment-scoped collections + details
  status(entitySlug: string, envId: Id): string;
  bundles(entitySlug: string, envId: Id): string;
  bundle(entitySlug: string, envId: Id, bundleId: Id): string;
  testSurfaces(entitySlug: string, envId: Id): string;
  testSurface(entitySlug: string, envId: Id, surfaceId: Id): string;
  testInteractions(entitySlug: string, envId: Id): string;
  testInteraction(entitySlug: string, envId: Id, elementId: Id): string;
  runs(entitySlug: string, envId: Id): string;
  run(entitySlug: string, envId: Id, runId: Id): string;
  runSurfaceRuns(entitySlug: string, envId: Id, runId: Id): string;
  runSurfaceRun(entitySlug: string, envId: Id, runId: Id, surfaceRunId: Id): string;
  runSurfaceRunInteraction(
    entitySlug: string,
    envId: Id,
    runId: Id,
    surfaceRunId: Id,
    elementId: Id
  ): string;
  runSurfaceRunInteractionRun(
    entitySlug: string,
    envId: Id,
    runId: Id,
    surfaceRunId: Id,
    elementId: Id,
    elementRunId: Id
  ): string;
  runPages(entitySlug: string, envId: Id, runId: Id): string;
  runIssues(entitySlug: string, envId: Id, runId: Id): string;
  runPage(entitySlug: string, envId: Id, runId: Id, pageId: Id): string;
  runPageState(entitySlug: string, envId: Id, runId: Id, pageId: Id, pageStateId: Id): string;
  runProgress(entitySlug: string, envId: Id, runId: Id): string;
  testScenarios(entitySlug: string, envId: Id): string;
  testScenario(entitySlug: string, envId: Id, scenarioId: Id): string;
  issues(entitySlug: string, envId: Id): string;
  schedules(entitySlug: string, envId: Id): string;
  settings(entitySlug: string, envId: Id): string;
  pages(entitySlug: string, envId: Id): string;
  page(entitySlug: string, envId: Id, pageId: Id): string;
  pageState(entitySlug: string, envId: Id, pageId: Id, pageStateId: Id): string;
  graph(entitySlug: string, envId: Id): string;
  pageGraph(entitySlug: string, envId: Id, pageId: Id): string;
  scaffolds(entitySlug: string, envId: Id): string;
  scaffold(entitySlug: string, envId: Id, scaffoldId: Id): string;
  patterns(entitySlug: string, envId: Id): string;
  personas(entitySlug: string, envId: Id): string;
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
  /** App-supplied route builders (the host owns the URL topology). */
  routes: TestomniacRoutes;
}

const RoutingContext = createContext<TestomniacRouting | null>(null);

export function RoutingProvider({
  children,
  params,
  pathname,
  navigate,
  currentLanguage,
  switchLanguage,
  routes,
}: TestomniacRouting & { children: ReactNode }) {
  const value = useMemo<TestomniacRouting>(
    () => ({ params, pathname, navigate, currentLanguage, switchLanguage, routes }),
    [params, pathname, navigate, currentLanguage, switchLanguage, routes]
  );
  return <RoutingContext.Provider value={value}>{children}</RoutingContext.Provider>;
}

/** Convenience hook: the app-supplied route builders. */
export function useRoutes(): TestomniacRoutes {
  return useTestomniacRouting().routes;
}

/**
 * Env-scoped route builders, pre-bound to the current route's `entitySlug` and
 * `envId`. Lets pages navigate without re-threading those params, e.g.
 * `navigate(r.run(runId))` instead of building `${basePath}/runs/${runId}`.
 */
export function useEnvRoutes() {
  const routes = useRoutes();
  const { entitySlug, envId } = useRouteParams<{ entitySlug?: string; envId?: string }>();
  const s = entitySlug ?? '';
  const e = envId ?? '';
  return useMemo(
    () => ({
      base: () => routes.environment(s, e),
      bundles: () => routes.bundles(s, e),
      bundle: (id: Id) => routes.bundle(s, e, id),
      testSurfaces: () => routes.testSurfaces(s, e),
      testSurface: (id: Id) => routes.testSurface(s, e, id),
      testInteractions: () => routes.testInteractions(s, e),
      testInteraction: (id: Id) => routes.testInteraction(s, e, id),
      runs: () => routes.runs(s, e),
      run: (runId: Id) => routes.run(s, e, runId),
      runSurfaceRuns: (runId: Id) => routes.runSurfaceRuns(s, e, runId),
      runSurfaceRun: (runId: Id, surfaceRunId: Id) =>
        routes.runSurfaceRun(s, e, runId, surfaceRunId),
      runSurfaceRunInteraction: (runId: Id, surfaceRunId: Id, elementId: Id) =>
        routes.runSurfaceRunInteraction(s, e, runId, surfaceRunId, elementId),
      runSurfaceRunInteractionRun: (runId: Id, surfaceRunId: Id, elementId: Id, elementRunId: Id) =>
        routes.runSurfaceRunInteractionRun(s, e, runId, surfaceRunId, elementId, elementRunId),
      runPages: (runId: Id) => routes.runPages(s, e, runId),
      runIssues: (runId: Id) => routes.runIssues(s, e, runId),
      runPage: (runId: Id, pageId: Id) => routes.runPage(s, e, runId, pageId),
      runPageState: (runId: Id, pageId: Id, pageStateId: Id) =>
        routes.runPageState(s, e, runId, pageId, pageStateId),
      runProgress: (runId: Id) => routes.runProgress(s, e, runId),
      testScenarios: () => routes.testScenarios(s, e),
      testScenario: (id: Id) => routes.testScenario(s, e, id),
      issues: () => routes.issues(s, e),
      schedules: () => routes.schedules(s, e),
      settings: () => routes.settings(s, e),
      pages: () => routes.pages(s, e),
      page: (pageId: Id) => routes.page(s, e, pageId),
      pageState: (pageId: Id, pageStateId: Id) => routes.pageState(s, e, pageId, pageStateId),
      graph: () => routes.graph(s, e),
      pageGraph: (pageId: Id) => routes.pageGraph(s, e, pageId),
      scaffolds: () => routes.scaffolds(s, e),
      scaffold: (id: Id) => routes.scaffold(s, e, id),
      patterns: () => routes.patterns(s, e),
      personas: () => routes.personas(s, e),
    }),
    [routes, s, e]
  );
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

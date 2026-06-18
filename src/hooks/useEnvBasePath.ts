import { useRouteParams, useRoutes } from '../context/routing';

/**
 * Returns the environment-scoped dashboard base path for the current route,
 * built from the host-supplied route builders (the library never hardcodes the
 * `/dashboard/...` topology).
 *
 * Prefer `useEnvRoutes()` for navigation; this remains for callers that need
 * the raw base path.
 */
export function useEnvBasePath(): string {
  const routes = useRoutes();
  const { entitySlug, envId } = useRouteParams<{
    entitySlug?: string;
    envId?: string;
  }>();
  return routes.environment(entitySlug ?? '', envId ?? '');
}

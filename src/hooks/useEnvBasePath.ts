import { useRouteParams } from '../context/routing';

/**
 * Returns the environment-scoped dashboard base path for the current route:
 * `/dashboard/:entitySlug/environments/:envId`.
 *
 * Append sub-paths as needed, e.g. `` `${basePath}/runs/${runId}` ``.
 */
export function useEnvBasePath(): string {
  const { entitySlug, envId } = useRouteParams<{
    entitySlug?: string;
    envId?: string;
  }>();
  return `/dashboard/${entitySlug}/environments/${envId}`;
}

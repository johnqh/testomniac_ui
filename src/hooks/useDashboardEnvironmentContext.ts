import { useDashboardEnvironmentContextData } from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../context/config.js';
import { useRouteParams } from '../context/routing.js';

export function useDashboardEnvironmentContext() {
  const { entitySlug, envId } = useRouteParams<{ entitySlug: string; envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const numericEnvId = Number(envId);

  const data = useDashboardEnvironmentContextData(
    networkClient,
    baseUrl,
    token ?? '',
    entitySlug ?? '',
    numericEnvId,
    !!entitySlug && !!token
  );

  return {
    entitySlug: entitySlug ?? '',
    envId: numericEnvId,
    environment: data.environment,
    product: data.product,
    productId: data.productId,
    latestRun: data.latestRun,
    environmentRuns: data.environmentRuns,
    primaryRunner: data.primaryRunner,
    token: token ?? '',
    networkClient,
    isLoading: data.isLoading,
    error: data.error,
  };
}

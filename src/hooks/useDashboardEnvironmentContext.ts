import { useDashboardEnvironmentContextData } from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';

export function useDashboardEnvironmentContext() {
  const { entitySlug, envId } = useRouteParams<{ entitySlug: string; envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const numericEnvId = Number(envId);

  const data = useDashboardEnvironmentContextData({
    networkClient,
    baseUrl,
    entitySlug: entitySlug ?? '',
    envId: numericEnvId,
    token: token ?? '',
    enabled: !!entitySlug && !!token,
  });

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

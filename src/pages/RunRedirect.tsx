import { useRun } from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useRoutes, Redirect } from '../context/routing';

export function RunRedirect() {
  const { runId, entitySlug } = useRouteParams<{ runId: string; entitySlug: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const routes = useRoutes();

  const { run, isLoading, error } = useRun({
    networkClient,
    baseUrl,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading run details...</span>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500 py-8">{error || 'Run not found.'}</div>
      </div>
    );
  }

  return <Redirect to={routes.run(entitySlug, run.testEnvironmentId ?? '', runId)} />;
}

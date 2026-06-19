import { useRunScaffolds } from '@sudobility/testomniac_client';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { ScaffoldCell } from '../components/cells';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export function ScaffoldsPage() {
  const { envId } = useRouteParams<{ envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const {
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();
  const r = useEnvRoutes();

  const scaffoldsQuery = useRunScaffolds(networkClient, baseUrl, token ?? '', latestRun?.id ?? 0, {
    enabled: !!envId && !!token && !!latestRun,
  });
  const scaffolds = scaffoldsQuery.data?.data ?? [];
  const isLoading = scaffoldsQuery.isLoading;
  const error = scaffoldsQuery.error?.message ?? null;

  if (contextLoading || isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title="Scaffolds" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Scaffolds</h1>

      {scaffolds.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No scaffolds detected.</p>
      ) : (
        <div className="space-y-2">
          {scaffolds.map(scaffold => {
            const pagePaths = Array.isArray(
              (scaffold as unknown as { pagePaths?: string[] }).pagePaths
            )
              ? (scaffold as unknown as { pagePaths: string[] }).pagePaths
              : [];
            return (
              <ScaffoldCell
                key={scaffold.id}
                scaffold={scaffold}
                pageCount={pagePaths.length}
                onClick={() => navigate(r.scaffold(scaffold.id))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useRunScaffolds } from '@sudobility/testomniac_client';
import { ContentLayout, CardGrid } from '@sudobility/components';
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
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Scaffolds" description="" noIndex />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Scaffolds</h1>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {scaffolds.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No scaffolds detected.</p>
        ) : (
          <CardGrid density="dense">
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
                  variant="tile"
                  onClick={() => navigate(r.scaffold(scaffold.id))}
                />
              );
            })}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

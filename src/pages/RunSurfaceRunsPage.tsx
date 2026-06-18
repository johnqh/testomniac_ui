import { useRunStructure } from '@sudobility/testomniac_client';
import { Card } from '@sudobility/components';
import { formatDate } from '@sudobility/testomniac_lib';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function RunSurfaceRunsPage() {
  const { entitySlug, envId, runId } = useRouteParams<{
    entitySlug: string;
    envId: string;
    runId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const { structure, isLoading, error } = useRunStructure({
    networkClient,
    baseUrl,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const basePath = `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}`;
  const surfaceRuns =
    structure?.surfaces.flatMap(surface =>
      surface.surfaceRuns.map(surfaceRun => ({
        surface,
        surfaceRun,
      }))
    ) ?? [];

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading surface runs..." />;
  }

  return (
    <div className="p-6">
      <SEOHead title={`Run #${runId} Surface Runs`} description="" noIndex />
      <BackLink label={`Back to Run #${runId}`} onClick={() => navigate(basePath)} />
      <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={() => navigate(basePath)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Run #{runId}
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Surface Runs</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Surface Runs</h1>

      {surfaceRuns.length === 0 ? (
        <EmptyState description="No surface runs found for this run." />
      ) : (
        <Card variant="bordered" padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Surface
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Run
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Elements
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Started
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {surfaceRuns.map(({ surface, surfaceRun }) => (
                <tr
                  key={surfaceRun.id}
                  onClick={() => navigate(`${basePath}/surface-runs/${surfaceRun.id}`)}
                  className="cursor-pointer bg-white transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{surface.title}</td>
                  <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                    #{surfaceRun.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={surfaceRun.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {surface.testInteractions.length}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(surfaceRun.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

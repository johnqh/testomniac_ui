import { useRunStructure } from '@sudobility/testomniac_client';
import { Card } from '@sudobility/components';
import { formatDuration } from '@sudobility/testomniac_lib';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function RunTestInteractionRunsPage() {
  const { runId, surfaceRunId, elementId } = useRouteParams<{
    runId: string;
    surfaceRunId: string;
    elementId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const structureQuery = useRunStructure(networkClient, baseUrl, token ?? '', Number(runId), {
    enabled: !!runId && !!token,
  });
  const structure = structureQuery.data?.data;
  const isLoading = structureQuery.isLoading;
  const error = structureQuery.error?.message ?? null;

  const r = useEnvRoutes();
  const surface =
    structure?.surfaces.find(candidate =>
      candidate.surfaceRuns.some(run => run.id === Number(surfaceRunId))
    ) ?? null;
  const testInteraction =
    surface?.testInteractions.find(candidate => candidate.id === Number(elementId)) ?? null;

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (!surface || !testInteraction) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 sm:p-6">
        Test element not found.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title={`${testInteraction.title} Runs`} description="" noIndex />
      <BackLink
        label={`Back to ${surface.title}`}
        onClick={() => navigate(r.runSurfaceRun(runId, surfaceRunId))}
      />
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={() => navigate(r.run(runId))}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Run #{runId}
        </button>
        <span>/</span>
        <button
          onClick={() => navigate(r.runSurfaceRuns(runId))}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Surface Runs
        </button>
        <span>/</span>
        <button
          onClick={() => navigate(r.runSurfaceRun(runId, surfaceRunId))}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {surface.title}
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {testInteraction.title}
        </span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {testInteraction.title}
        </h1>
        <StatusBadge status={testInteraction.testType} />
      </div>

      {testInteraction.interactionRuns.length === 0 ? (
        <EmptyState description="No interaction runs found." />
      ) : (
        <Card variant="bordered" padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Run
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Findings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {testInteraction.interactionRuns.map(elementRun => (
                <tr
                  key={elementRun.id}
                  onClick={() =>
                    navigate(
                      r.runSurfaceRunInteractionRun(runId, surfaceRunId, elementId, elementRun.id)
                    )
                  }
                  className="cursor-pointer bg-white transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                    #{elementRun.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={elementRun.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDuration(elementRun.durationMs)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {elementRun.findings.length}
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

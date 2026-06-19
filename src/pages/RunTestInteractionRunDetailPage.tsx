import { useMemo } from 'react';
import {
  useRunStructure,
  useTestInteractionRun,
  useTestRunFindings,
} from '@sudobility/testomniac_client';
import { formatDate, formatMultilineLog } from '@sudobility/testomniac_lib';
import { Alert, Card, ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';
import { EmptyState } from '../components/states';

export function RunTestInteractionRunDetailPage() {
  const { runId, surfaceRunId, elementId, elementRunId } = useRouteParams<{
    runId: string;
    surfaceRunId: string;
    elementId: string;
    elementRunId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const structureQuery = useRunStructure(networkClient, baseUrl, token ?? '', Number(runId), {
    enabled: !!runId && !!token,
  });
  const structure = structureQuery.data?.data;
  const structureLoading = structureQuery.isLoading;
  const structureError = structureQuery.error?.message ?? null;

  const interactionRunQuery = useTestInteractionRun(
    networkClient,
    baseUrl,
    token ?? '',
    Number(elementRunId),
    { enabled: !!elementRunId && !!token }
  );
  const testInteractionRun = interactionRunQuery.data?.data;
  const isLoading = interactionRunQuery.isLoading;
  const error = interactionRunQuery.error?.message ?? null;

  const findingsQuery = useTestRunFindings(
    networkClient,
    baseUrl,
    token ?? '',
    Number(elementRunId),
    { enabled: !!elementRunId && !!token }
  );
  const findings = findingsQuery.data?.data ?? [];

  const r = useEnvRoutes();
  const surface =
    structure?.surfaces.find(candidate =>
      candidate.surfaceRuns.some(run => run.id === Number(surfaceRunId))
    ) ?? null;
  const testInteraction =
    surface?.testInteractions.find(candidate => candidate.id === Number(elementId)) ?? null;
  const inlineRun = useMemo(
    () =>
      testInteraction?.interactionRuns.find(candidate => candidate.id === Number(elementRunId)) ??
      null,
    [testInteraction, elementRunId]
  );

  const pageError = structureError || error;
  if (pageError) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400 sm:p-6">
        Error: {pageError}
      </div>
    );
  }

  if (isLoading || structureLoading || !testInteractionRun) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 sm:p-6">Loading...</div>
    );
  }

  const consoleLog = formatMultilineLog(testInteractionRun.consoleLog);
  const networkLog = formatMultilineLog(testInteractionRun.networkLog);

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title={`Interaction Run #${elementRunId}`} description="" noIndex />
          <BackLink
            label={`Back to ${testInteraction?.title ?? `Test Interaction #${elementId}`}`}
            onClick={() => navigate(r.runSurfaceRunInteraction(runId, surfaceRunId, elementId))}
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
              {surface?.title ?? `Surface Run #${surfaceRunId}`}
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(r.runSurfaceRunInteraction(runId, surfaceRunId, elementId))}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {testInteraction?.title ?? `Test Interaction #${elementId}`}
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              Run #{elementRunId}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Interaction Run #{elementRunId}
            </h1>
            <StatusBadge status={testInteractionRun.status} />
            {testInteraction && <StatusBadge status={testInteraction.testType} />}
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card variant="bordered" padding="md">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {findings.length}
            </div>
            <div className="text-xs text-gray-500">Findings</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {testInteractionRun.durationMs ?? '-'}
            </div>
            <div className="text-xs text-gray-500">Duration (ms)</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDate(testInteractionRun.startedAt)}
            </div>
            <div className="text-xs text-gray-500">Started</div>
          </Card>
          <Card variant="bordered" padding="md">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDate(testInteractionRun.completedAt)}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </Card>
        </div>

        {testInteractionRun.errorMessage && (
          <Alert variant="error" className="mb-6">
            <span className="whitespace-pre-wrap">{testInteractionRun.errorMessage}</span>
          </Alert>
        )}

        {testInteractionRun.expectedOutcome && (
          <Card variant="bordered" padding="md" className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Expected Outcome
            </h2>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
              {testInteractionRun.expectedOutcome}
            </pre>
          </Card>
        )}

        {testInteractionRun.observedOutcome && (
          <Card variant="bordered" padding="md" className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Observed Outcome
            </h2>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
              {testInteractionRun.observedOutcome}
            </pre>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Findings
          </h2>
          {findings.length === 0 ? (
            <EmptyState description="No findings for this interaction run." />
          ) : (
            <div className="space-y-2">
              {findings.map(finding => (
                <Card key={finding.id} variant="bordered" padding="sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {finding.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {finding.description}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={finding.type} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {(consoleLog || networkLog || inlineRun?.findings.length) && (
          <div className="space-y-6">
            {consoleLog && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Console Log
                </h2>
                <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {consoleLog}
                </pre>
              </div>
            )}
            {networkLog && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Network Log
                </h2>
                <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {networkLog}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

import {
  useRun,
  useRunSummary,
  useRunStructure,
  useTestInteractionRun,
  useTestRunFindings,
} from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { formatDate, formatMultilineLog } from '@sudobility/testomniac_lib';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { Badge, Card, ContentLayout, CardGrid, GridTile } from '@sudobility/components';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { EmptyState } from '../components/states';

function FindingTypeBadge({ type }: { type: string }) {
  const variant = type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info';

  return (
    <Badge variant={variant} size="sm" pill>
      {type}
    </Badge>
  );
}

export function TestRunDetailPage() {
  const { runId } = useRouteParams<{
    runId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const r = useEnvRoutes();
  const testRunId = Number(runId);

  const runQuery = useRun(networkClient, baseUrl, token ?? '', testRunId, {
    enabled: !!runId && !!token,
  });
  const run = runQuery.data?.data;
  const isRunLoading = runQuery.isLoading;
  const runError = runQuery.error?.message ?? null;

  const summaryQuery = useRunSummary(networkClient, baseUrl, token ?? '', testRunId, {
    enabled: !!runId && !!token,
  });
  const summary = summaryQuery.data?.data;

  const structureQuery = useRunStructure(networkClient, baseUrl, token ?? '', testRunId, {
    enabled: !!runId && !!token,
  });
  const structure = structureQuery.data?.data;

  const findingsQuery = useTestRunFindings(
    networkClient,
    baseUrl,
    token ?? '',
    run?.testInteractionRunId ?? 0,
    { enabled: !!run?.testInteractionRunId && !!token }
  );
  const findings = findingsQuery.data?.data ?? [];
  const isLoading = findingsQuery.isLoading;
  const error = findingsQuery.error?.message ?? null;

  const interactionRunQuery = useTestInteractionRun(
    networkClient,
    baseUrl,
    token ?? '',
    run?.testInteractionRunId ?? 0,
    { enabled: !!run?.testInteractionRunId && !!token }
  );
  const testInteractionRun = interactionRunQuery.data?.data;
  const isCaseRunLoading = interactionRunQuery.isLoading;
  const elementRunError = interactionRunQuery.error?.message ?? null;

  if (runError || error || elementRunError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {runError || error || elementRunError}
        </div>
      </div>
    );
  }

  if (isRunLoading || !run) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading run...</div>
      </div>
    );
  }

  const isRootLikeRun = run.testInteractionRunId === null;
  const expertiseEntries = Object.entries(summary?.expertiseSummary ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const surfaceCoverage =
    structure?.surfaces.map(surface => ({
      id: surface.id,
      title: surface.title,
      surfaceRunId: surface.surfaceRuns[0]?.id ?? null,
      status: surface.surfaceRuns[0]?.status ?? 'pending',
      interactionCount: surface.testInteractions.length,
    })) ?? [];
  const consoleLog = formatMultilineLog(testInteractionRun?.consoleLog);
  const networkLog = formatMultilineLog(testInteractionRun?.networkLog);

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <BackLink label="Back to Runs" onClick={() => navigate(r.runs())} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <button
              onClick={() => navigate(r.runs())}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Runs
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Run #{runId}</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Test Run #{runId}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <StatusBadge status={run.sizeClass} />
            <span className="text-xs text-gray-500 dark:text-gray-400">ID: {runId}</span>
            {run.createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created {formatDate(run.createdAt)}
              </span>
            )}
            {run.startedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Started {formatDate(run.startedAt)}
              </span>
            )}
            {run.completedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Completed {formatDate(run.completedAt)}
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isRootLikeRun && summary && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.pagesFound ?? 0}
                </div>
                <div className="text-xs text-gray-500">Pages Found</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.pageStatesFound ?? 0}
                </div>
                <div className="text-xs text-gray-500">Page States</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.testRunsCompleted ?? 0}
                </div>
                <div className="text-xs text-gray-500">Completed Runs</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.totalFindings}
                </div>
                <div className="text-xs text-gray-500">Findings</div>
              </Card>
            </div>

            {summary.aiSummary && (
              <Card variant="bordered" padding="md" className="mb-8">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Summary
                </h2>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {summary.aiSummary}
                </p>
              </Card>
            )}

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => navigate(r.runSurfaceRuns(runId))}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Surface Runs
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Navigate the run hierarchy by surface run, then interaction runs and run details.
                </div>
              </button>
              <button
                onClick={() => navigate(r.runPages(runId))}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Pages</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Browse discovered pages and drill into captured page states.
                </div>
              </button>
              <button
                onClick={() => navigate(r.runIssues(runId))}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Findings</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Review grouped warnings and errors for this scan run.
                </div>
              </button>
            </div>

            {surfaceCoverage.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Coverage Tree
                </h2>
                <CardGrid>
                  {surfaceCoverage.map(surface => (
                    <GridTile
                      key={surface.id}
                      topRight={<StatusBadge status={surface.status} />}
                      title={surface.title}
                      footer={
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {surface.interactionCount} interaction
                          {surface.interactionCount === 1 ? '' : 's'}
                        </span>
                      }
                      onClick={
                        surface.surfaceRunId != null
                          ? () => navigate(r.runSurfaceRun(runId, surface.surfaceRunId!))
                          : undefined
                      }
                    />
                  ))}
                </CardGrid>
              </div>
            )}

            {expertiseEntries.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Findings by Expertise
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {expertiseEntries.map(([name, counts]) => (
                    <Card key={name} variant="bordered" padding="md">
                      <div className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                        {name}
                      </div>
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-red-600 dark:text-red-400">
                          {counts.errors} error{counts.errors === 1 ? '' : 's'}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {counts.warnings} warning{counts.warnings === 1 ? '' : 's'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {counts.findings} total
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Findings */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Findings
        </h2>

        {run.testInteractionRunId === null && (
          <EmptyState description="This test run tracks a surface or discovery workflow and does not map directly to a single test interaction run." />
        )}

        {run.testInteractionRunId !== null && isLoading && (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            Loading findings...
          </div>
        )}

        {run.testInteractionRunId !== null && !isLoading && findings.length === 0 && (
          <EmptyState description="No findings for this test run." />
        )}

        {run.testInteractionRunId !== null && !isLoading && findings.length > 0 && (
          <div className="space-y-3">
            {(findings as TestRunFindingResponse[]).map(finding => (
              <Card key={finding.id} variant="bordered" padding="md">
                <div className="flex items-start gap-3">
                  <FindingTypeBadge type={finding.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {finding.title}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {finding.description}
                    </p>
                    {finding.createdAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDate(finding.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {run.testInteractionRunId !== null && !isCaseRunLoading && (consoleLog || networkLog) && (
          <div className="mt-8 space-y-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Runtime Signals
            </h2>

            {consoleLog && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Console Log
                </h3>
                <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {consoleLog}
                </pre>
              </div>
            )}

            {networkLog && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Network Log
                </h3>
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

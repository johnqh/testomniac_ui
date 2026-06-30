import { useState } from 'react';
import {
  useRun,
  useRunFindingExpertiseSummary,
  useRunFindingSummary,
  useRunSummary,
  useRunStructure,
  useTestInteractionRun,
  useTestRunFindings,
} from '@sudobility/testomniac_client';
import type {
  TestRunFindingResponse,
  TestRunFindingRuleSummary,
} from '@sudobility/testomniac_types';
import {
  formatDate,
  formatMultilineLog,
  getFindingDisplayTitle,
  getFindingExpertiseSlug,
  getFindingRemediation,
  groupFindingsByRule,
} from '@sudobility/testomniac_lib';
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
  const [findingTypeFilter, setFindingTypeFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [expertiseFilter, setExpertiseFilter] = useState('all');

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
  const rootFindingSummaryQuery = useRunFindingSummary(
    networkClient,
    baseUrl,
    token ?? '',
    testRunId,
    { enabled: !!runId && !!token && run?.testInteractionRunId === null }
  );
  const rootFindingExpertiseSummaryQuery = useRunFindingExpertiseSummary(
    networkClient,
    baseUrl,
    token ?? '',
    testRunId,
    { enabled: !!runId && !!token && run?.testInteractionRunId === null }
  );

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
        <div className="text-center text-destructive py-8">
          Error: {runError || error || elementRunError}
        </div>
      </div>
    );
  }

  if (isRunLoading || !run) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground py-8">Loading run...</div>
      </div>
    );
  }

  const isRootLikeRun = run.testInteractionRunId === null;
  const rootFindingSummaries = rootFindingSummaryQuery.data?.data ?? [];
  const rootExpertiseSummary = rootFindingExpertiseSummaryQuery.data?.data ?? [];
  const expertiseEntries = rootExpertiseSummary
    .map(item => [item.expertiseId ?? 'unknown', item] as const)
    .sort(([left], [right]) => left.localeCompare(right));
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
  const typedFindings = findings as TestRunFindingResponse[];
  const expertiseFilters = Array.from(
    new Set(
      isRootLikeRun
        ? rootFindingSummaries
            .map(finding => finding.expertiseId)
            .filter(
              (expertise): expertise is NonNullable<TestRunFindingRuleSummary['expertiseId']> =>
                expertise !== null
            )
        : typedFindings
            .map(finding => getFindingExpertiseSlug(finding))
            .filter((expertise): expertise is string => Boolean(expertise))
    )
  ).sort();
  const filteredFindings = typedFindings.filter(finding => {
    const matchesType = findingTypeFilter === 'all' || finding.type === findingTypeFilter;
    const matchesExpertise =
      expertiseFilter === 'all' || getFindingExpertiseSlug(finding) === expertiseFilter;
    return matchesType && matchesExpertise;
  });
  const findingGroups = Array.from(groupFindingsByRule(filteredFindings).values());
  const filteredRootFindingSummaries = rootFindingSummaries.filter(finding => {
    const matchesType = findingTypeFilter === 'all' || finding.type === findingTypeFilter;
    const matchesExpertise = expertiseFilter === 'all' || finding.expertiseId === expertiseFilter;
    return matchesType && matchesExpertise;
  });
  const rootFindingsLoading = rootFindingSummaryQuery.isLoading;
  const effectiveExpertises = run.expertiseSlugsJson ?? [];
  const effectiveRuleOverrides = run.ruleOverridesJson ?? [];

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <BackLink label="Back to Runs" onClick={() => navigate(r.runs())} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <button
              onClick={() => navigate(r.runs())}
              className="hover:text-primary transition-colors"
            >
              Runs
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">Run #{runId}</span>
          </nav>

          <h1 className="text-2xl font-bold text-foreground mb-2">Test Run #{runId}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <StatusBadge status={run.sizeClass} />
            <span className="text-xs text-muted-foreground">ID: {runId}</span>
            {run.createdAt && (
              <span className="text-xs text-muted-foreground">
                Created {formatDate(run.createdAt)}
              </span>
            )}
            {run.startedAt && (
              <span className="text-xs text-muted-foreground">
                Started {formatDate(run.startedAt)}
              </span>
            )}
            {run.completedAt && (
              <span className="text-xs text-muted-foreground">
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
                <div className="text-2xl font-bold text-foreground">{summary.pagesFound ?? 0}</div>
                <div className="text-xs text-muted-foreground">Pages Found</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-foreground">
                  {summary.pageStatesFound ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Page States</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-foreground">
                  {summary.testRunsCompleted ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Completed Runs</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-destructive">{summary.totalFindings}</div>
                <div className="text-xs text-muted-foreground">Findings</div>
              </Card>
            </div>

            {summary.aiSummary && (
              <Card variant="bordered" padding="md" className="mb-8">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </h2>
                <p className="text-sm leading-6 text-foreground">{summary.aiSummary}</p>
              </Card>
            )}

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => navigate(r.runSurfaceRuns(runId))}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <div className="text-sm font-medium text-foreground">Surface Runs</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Navigate the run hierarchy by surface run, then interaction runs and run details.
                </div>
              </button>
              <button
                onClick={() => navigate(r.runPages(runId))}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <div className="text-sm font-medium text-foreground">Pages</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Browse discovered pages and drill into captured page states.
                </div>
              </button>
              <button
                onClick={() => navigate(r.runIssues(runId))}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <div className="text-sm font-medium text-foreground">Findings</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Review grouped warnings and errors for this scan run.
                </div>
              </button>
            </div>

            {surfaceCoverage.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Coverage Tree</h2>
                <CardGrid>
                  {surfaceCoverage.map(surface => (
                    <GridTile
                      key={surface.id}
                      topRight={<StatusBadge status={surface.status} />}
                      title={surface.title}
                      footer={
                        <span className="text-xs text-muted-foreground">
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
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Findings by Expertise
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {expertiseEntries.map(([name, counts]) => (
                    <Card key={name} variant="bordered" padding="md">
                      <div className="text-sm font-medium capitalize text-foreground">{name}</div>
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-destructive">
                          {counts.errorCount} error{counts.errorCount === 1 ? '' : 's'}
                        </span>
                        <span className="text-warning">
                          {counts.warningCount} warning{counts.warningCount === 1 ? '' : 's'}
                        </span>
                        <span className="text-muted-foreground">{counts.findingCount} total</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card variant="bordered" padding="md" className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Effective Scan Settings
              </h2>
              <div className="space-y-3 text-sm text-foreground">
                <div>
                  <div className="text-xs text-muted-foreground">Expertises</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {effectiveExpertises.length > 0 ? (
                      effectiveExpertises.map(expertise => (
                        <span
                          key={expertise}
                          className="rounded bg-muted px-2 py-1 text-xs capitalize"
                        >
                          {expertise}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No expertise settings recorded.
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{effectiveRuleOverrides.length} rule override(s)</span>
                  <span>Scan mode: {run.scanMode}</span>
                  <span>{run.quickScan ? 'Quick scan enabled' : 'Full discovery flow'}</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Findings */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Findings
        </h2>

        {run.testInteractionRunId !== null && isLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading findings...</div>
        )}

        {run.testInteractionRunId === null && rootFindingsLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading findings...</div>
        )}

        {run.testInteractionRunId !== null && !isLoading && findings.length === 0 && (
          <EmptyState description="No findings for this test run." />
        )}

        {run.testInteractionRunId === null &&
          !rootFindingsLoading &&
          rootFindingSummaries.length === 0 && (
            <EmptyState description="No grouped findings for this scan run." />
          )}

        {((run.testInteractionRunId !== null && !isLoading && findings.length > 0) ||
          (run.testInteractionRunId === null &&
            !rootFindingsLoading &&
            rootFindingSummaries.length > 0)) && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <div className="inline-flex overflow-hidden rounded border border-border">
                {(['all', 'error', 'warning'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFindingTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium capitalize ${
                      findingTypeFilter === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <select
                value={expertiseFilter}
                onChange={event => setExpertiseFilter(event.target.value)}
                className="h-8 rounded border border-input bg-card px-2 text-xs text-foreground"
                aria-label="Filter findings by expertise"
              >
                <option value="all">All expertises</option>
                {expertiseFilters.map(expertise => (
                  <option key={expertise} value={expertise}>
                    {expertise}
                  </option>
                ))}
              </select>
            </div>
            {run.testInteractionRunId === null
              ? filteredRootFindingSummaries.map((finding: TestRunFindingRuleSummary) => (
                  <Card key={`${finding.ruleId ?? finding.title}`} variant="bordered" padding="md">
                    <div className="flex items-start gap-3">
                      <FindingTypeBadge type={finding.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {finding.expertiseId && (
                            <span className="inline-flex shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                              {finding.expertiseId}
                            </span>
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {finding.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {finding.findingCount} occurrence{finding.findingCount === 1 ? '' : 's'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {finding.affectedPages} page{finding.affectedPages === 1 ? '' : 's'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{finding.description}</p>
                        {finding.remediation && (
                          <p className="mt-2 text-xs text-foreground">{finding.remediation}</p>
                        )}
                        {finding.samplePaths.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {finding.samplePaths.join(' | ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              : findingGroups.map(group => {
                  const finding = group[0];
                  const tag = getFindingExpertiseSlug(finding);
                  const remediation = getFindingRemediation(finding);
                  return (
                    <Card key={`${finding.ruleId ?? finding.id}`} variant="bordered" padding="md">
                      <div className="flex items-start gap-3">
                        <FindingTypeBadge type={finding.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {tag && (
                              <span className="inline-flex shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {tag}
                              </span>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {getFindingDisplayTitle(finding)}
                            </span>
                            {group.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {group.length} occurrences
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {finding.description}
                          </p>
                          {remediation && (
                            <p className="text-xs text-foreground mt-2">{remediation}</p>
                          )}
                          {finding.createdAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(finding.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            {((run.testInteractionRunId === null && filteredRootFindingSummaries.length === 0) ||
              (run.testInteractionRunId !== null && findingGroups.length === 0)) && (
              <EmptyState description="No findings match the active filters." />
            )}
          </div>
        )}

        {run.testInteractionRunId !== null && !isCaseRunLoading && (consoleLog || networkLog) && (
          <div className="mt-8 space-y-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Runtime Signals
            </h2>

            {consoleLog && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground">Console Log</h3>
                <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted p-4 text-xs leading-5 text-foreground">
                  {consoleLog}
                </pre>
              </div>
            )}

            {networkLog && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground">Network Log</h3>
                <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted p-4 text-xs leading-5 text-foreground">
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

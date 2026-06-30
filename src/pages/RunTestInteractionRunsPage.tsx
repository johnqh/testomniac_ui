import { useRunStructure } from '@sudobility/testomniac_client';
import { formatDuration } from '@sudobility/testomniac_lib';
import { ContentLayout, CardGrid, GridTile } from '@sudobility/components';
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
      <div className="p-4 text-center text-muted-foreground sm:p-6">Test element not found.</div>
    );
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title={`${testInteraction.title} Runs`} description="" noIndex />
          <BackLink
            label={`Back to ${surface.title}`}
            onClick={() => navigate(r.runSurfaceRun(runId, surfaceRunId))}
          />
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => navigate(r.run(runId))}
              className="hover:text-info transition-colors"
            >
              Run #{runId}
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(r.runSurfaceRuns(runId))}
              className="hover:text-info transition-colors"
            >
              Surface Runs
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(r.runSurfaceRun(runId, surfaceRunId))}
              className="hover:text-info transition-colors"
            >
              {surface.title}
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">{testInteraction.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{testInteraction.title}</h1>
            <StatusBadge status={testInteraction.testType} />
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {testInteraction.interactionRuns.length === 0 ? (
          <EmptyState description="No interaction runs found." />
        ) : (
          <CardGrid>
            {testInteraction.interactionRuns.map(elementRun => (
              <GridTile
                key={elementRun.id}
                topRight={<StatusBadge status={elementRun.status} />}
                title={`Run #${elementRun.id}`}
                footer={
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(elementRun.durationMs)} · {elementRun.findings.length} findings
                  </span>
                }
                onClick={() =>
                  navigate(
                    r.runSurfaceRunInteractionRun(runId, surfaceRunId, elementId, elementRun.id)
                  )
                }
              />
            ))}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

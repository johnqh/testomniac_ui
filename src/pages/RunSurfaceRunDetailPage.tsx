import { useRunStructure } from '@sudobility/testomniac_client';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { Card, ContentLayout } from '@sudobility/components';
import BackLink from '../components/navigation/BackLink';

export function RunSurfaceRunDetailPage() {
  const { runId, surfaceRunId } = useRouteParams<{
    runId: string;
    surfaceRunId: string;
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
  const match =
    structure?.surfaces.find(surface =>
      surface.surfaceRuns.some(surfaceRun => surfaceRun.id === Number(surfaceRunId))
    ) ?? null;
  const selectedRun =
    match?.surfaceRuns.find(surfaceRun => surfaceRun.id === Number(surfaceRunId)) ?? null;

  if (error) {
    return <div className="p-4 text-center text-destructive sm:p-6">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground sm:p-6">Loading...</div>;
  }

  if (!match || !selectedRun) {
    return (
      <div className="p-4 text-center text-muted-foreground sm:p-6">Surface run not found.</div>
    );
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title={`${match.title} Run`} description="" noIndex />
          <BackLink
            label="Back to Surface Runs"
            onClick={() => navigate(r.runSurfaceRuns(runId))}
          />
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => navigate(r.run(runId))}
              className="hover:text-primary transition-colors"
            >
              Run #{runId}
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(r.runSurfaceRuns(runId))}
              className="hover:text-primary transition-colors"
            >
              Surface Runs
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">{match.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{match.title}</h1>
            <StatusBadge status={selectedRun.status} />
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        <Card variant="bordered" padding="md" className="mb-6">
          <div className="text-sm text-muted-foreground">
            Surface run #{selectedRun.id} with {match.testInteractions.length} test interactions.
          </div>
        </Card>

        <div className="space-y-2">
          {match.testInteractions.map(testInteraction => (
            <button
              key={testInteraction.id}
              onClick={() =>
                navigate(r.runSurfaceRunInteraction(runId, surfaceRunId, testInteraction.id))
              }
              className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{testInteraction.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {testInteraction.interactionRuns.length} interaction run
                    {testInteraction.interactionRuns.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={testInteraction.testType} />
                  <StatusBadge
                    status={
                      testInteraction.interactionRuns[0]?.status ??
                      match.surfaceRuns[0]?.status ??
                      'pending'
                    }
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}

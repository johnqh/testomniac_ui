import { useRunStructure } from '@sudobility/testomniac_client';
import { formatDate } from '@sudobility/testomniac_lib';
import { ContentLayout, CardGrid, GridTile } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function RunSurfaceRunsPage() {
  const { runId } = useRouteParams<{
    runId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const structureQuery = useRunStructure(networkClient, baseUrl, token ?? '', Number(runId), {
    enabled: !!runId && !!token,
  });
  const structure = structureQuery.data?.data;
  const isLoading = structureQuery.isLoading;
  const error = structureQuery.error?.message ?? null;

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
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title={`Run #${runId} Surface Runs`} description="" noIndex />
          <BackLink label={`Back to Run #${runId}`} onClick={() => navigate(r.run(runId))} />
          <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => navigate(r.run(runId))}
              className="hover:text-primary transition-colors"
            >
              Run #{runId}
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">Surface Runs</span>
          </nav>

          <h1 className="text-2xl font-bold text-foreground">Surface Runs</h1>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {surfaceRuns.length === 0 ? (
          <EmptyState description="No surface runs found for this run." />
        ) : (
          <CardGrid density="wide">
            {surfaceRuns.map(({ surface, surfaceRun }) => (
              <GridTile
                key={surfaceRun.id}
                topRight={<StatusBadge status={surfaceRun.status} />}
                title={surface.title}
                footer={
                  <span className="text-xs text-muted-foreground">
                    {surface.testInteractions.length} elements · {formatDate(surfaceRun.startedAt)}
                  </span>
                }
                onClick={() => navigate(r.runSurfaceRun(runId, surfaceRun.id))}
              />
            ))}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

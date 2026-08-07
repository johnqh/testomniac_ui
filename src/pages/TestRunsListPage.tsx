import type { TestRunResponse } from '@sudobility/testomniac_types';
import { formatDuration, formatDate } from '@sudobility/testomniac_lib';
import { ContentLayout, CardGrid, GridTile } from '@sudobility/components';
import { SEOHead } from '../context/config.js';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate.js';
import { useEnvRoutes } from '../context/routing.js';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext.js';
import { StatusBadge } from '../components/scanner/StatusBadge.js';
import { ErrorState, LoadingState, EmptyState } from '../components/states/index.js';

/** Best-effort host extraction for a run's scan URL (falls back to null). */
function runHost(scanUrl: string | null): string | null {
  if (!scanUrl) return null;
  try {
    return new URL(scanUrl).host;
  } catch {
    return scanUrl;
  }
}

export function TestRunsListPage() {
  const { navigate } = useLocalizedNavigate();
  const { environmentRuns: testRuns, isLoading, error } = useDashboardEnvironmentContext();

  const r = useEnvRoutes();

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Test Runs" description="" noIndex />
          <h1 className="text-2xl font-bold text-foreground">Test Runs</h1>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isLoading && <LoadingState message="Loading test runs..." />}

        {!isLoading && testRuns.length === 0 && (
          <EmptyState
            title="No test runs yet"
            description="Test runs will appear here after tests are executed."
          />
        )}

        {!isLoading && testRuns.length > 0 && (
          <CardGrid density="wide">
            {testRuns.map((run: TestRunResponse) => {
              const host = runHost(run.scanUrl);
              const metrics = [
                run.pagesFound != null ? `${run.pagesFound} pages` : null,
                formatDuration(run.totalDurationMs),
                run.sizeClass,
                formatDate(run.createdAt),
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <GridTile
                  key={run.id}
                  topRight={<StatusBadge status={run.status} />}
                  title={host ?? `Run #${run.id}`}
                  subtitle={run.scanUrl ?? undefined}
                  footer={<span className="text-xs text-muted-foreground">{metrics}</span>}
                  onClick={() => navigate(r.run(run.id))}
                />
              );
            })}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

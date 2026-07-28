import { useState, useMemo } from 'react';
import {
  useEnvironmentPages,
  useEnvironmentTestInteractions,
  useNavigationGraph,
  useRoute,
  useRunPages,
  useRunTestInteractions,
  useRunnerPageStates,
} from '@sudobility/testomniac_client';
import { ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { PagesListView } from '../components/pages/PagesListView';
import { PagesMapView } from '../components/pages/PagesMapView';
import { PagesGraphView } from '../components/pages/PagesGraphView';

export function PagesPage() {
  const { entitySlug, envId, runId } = useRouteParams<{
    entitySlug: string;
    envId: string;
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const [view, setView] = useState<'list' | 'map' | 'graph'>('list');
  const [targetPageId, setTargetPageId] = useState<number | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);

  const runScoped = Boolean(runId);

  const environmentPagesQuery = useEnvironmentPages(
    networkClient,
    baseUrl,
    token ?? '',
    Number(envId),
    { enabled: !!envId && !!token && !runScoped }
  );

  const runPagesQuery = useRunPages(networkClient, baseUrl, token ?? '', Number(runId), {
    enabled: !!runId && !!token,
  });

  const environmentElementsQuery = useEnvironmentTestInteractions(
    networkClient,
    baseUrl,
    token ?? '',
    Number(envId),
    { enabled: !!envId && !!token && !runScoped }
  );

  const runElementsQuery = useRunTestInteractions(
    networkClient,
    baseUrl,
    token ?? '',
    Number(runId),
    { enabled: !!runId && !!token }
  );

  const pages = runScoped
    ? (runPagesQuery.data?.data ?? [])
    : (environmentPagesQuery.data?.data ?? []);
  const testInteractions = runScoped
    ? (runElementsQuery.data?.data ?? [])
    : (environmentElementsQuery.data?.data ?? []);
  const pagesLoading = runScoped ? runPagesQuery.isLoading : environmentPagesQuery.isLoading;
  const elementsLoading = runScoped
    ? runElementsQuery.isLoading
    : environmentElementsQuery.isLoading;
  const pagesError = runScoped
    ? (runPagesQuery.error?.message ?? null)
    : (environmentPagesQuery.error?.message ?? null);
  const elementsError = runScoped
    ? (runElementsQuery.error?.message ?? null)
    : (environmentElementsQuery.error?.message ?? null);

  const isLoading = pagesLoading || elementsLoading;
  const error = pagesError || elementsError;

  // Fetch page states for screenshot paths (used in both list and map views)
  const primaryRunnerId = pages.length > 0 ? pages[0].runnerId : 0;
  const pageStatesQuery = useRunnerPageStates(
    networkClient,
    baseUrl,
    token ?? '',
    primaryRunnerId,
    { enabled: !!primaryRunnerId && !!token }
  );
  const pageStates = useMemo(() => pageStatesQuery.data?.data ?? [], [pageStatesQuery.data]);

  // Graph mode is runner-scoped by design: edges belong to a runner, not a run.
  const graphQuery = useNavigationGraph(networkClient, baseUrl, token ?? '', primaryRunnerId, {
    enabled: !!primaryRunnerId && !!token && view === 'graph',
  });
  const routeQuery = useRoute(
    networkClient,
    baseUrl,
    token ?? '',
    primaryRunnerId,
    targetPageId ?? 0,
    {
      enabled: !!primaryRunnerId && !!token && !!targetPageId && view === 'graph',
    }
  );
  const graph = graphQuery.data?.data ?? null;
  const routeHops = targetPageId ? (routeQuery.data?.data?.route ?? null) : null;

  const screenshotsByPageId = useMemo(() => {
    const map = new Map<number, string>();
    for (const ps of pageStates) {
      if (ps.screenshotPath && !map.has(ps.pageId)) {
        map.set(ps.pageId, ps.screenshotPath);
      }
    }
    return map;
  }, [pageStates]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="py-8 text-center text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <ContentLayout
      contentClassName="min-h-0"
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Discovered Pages" description="" noIndex />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              {runScoped ? `Run #${runId} Pages` : 'Discovered Pages'}
            </h1>
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                } rounded-l-md`}
              >
                List
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  view === 'map'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setView('graph')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  view === 'graph'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                } rounded-r-md`}
              >
                Graph
              </button>
            </div>
          </div>
        </div>
      }
    >
      {pages.length === 0 ? (
        <div className="px-4 py-4 sm:px-6">
          <p className="text-muted-foreground">No pages discovered yet.</p>
        </div>
      ) : view === 'list' ? (
        <div className="px-4 py-4 sm:px-6">
          <PagesListView
            pages={pages}
            envId={envId!}
            entitySlug={entitySlug!}
            runId={runId}
            screenshotsByPageId={screenshotsByPageId}
            apiUrl={baseUrl}
          />
        </div>
      ) : view === 'graph' ? (
        <div className="h-full min-h-0 p-4 sm:p-6">
          {graphQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading graph...</div>
          ) : graphQuery.error ? (
            <div className="py-8 text-center text-destructive">
              Error: {graphQuery.error.message}
            </div>
          ) : (
            <PagesGraphView
              nodes={graph?.nodes ?? []}
              edges={graph?.edges ?? []}
              route={routeHops}
              selectedTargetPageId={targetPageId}
              onSelectTarget={setTargetPageId}
              showRemoved={showRemoved}
              onToggleRemoved={setShowRemoved}
              originPageId={routeQuery.data?.data?.originPageId ?? null}
              fill
            />
          )}
        </div>
      ) : (
        <div className="h-full min-h-0 p-4 sm:p-6">
          <PagesMapView
            pages={pages}
            testInteractions={testInteractions}
            envId={envId!}
            entitySlug={entitySlug!}
            runId={runId}
            screenshotsByPageId={screenshotsByPageId}
            apiUrl={baseUrl}
            fill
          />
        </div>
      )}
    </ContentLayout>
  );
}

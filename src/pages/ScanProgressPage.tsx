import { useEffect, useRef } from 'react';
import { useScanProgressStore } from '@sudobility/testomniac_lib';
import { useRunProgressStream } from '@sudobility/testomniac_client';
import { Button } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useRoutes } from '../context/routing';
import { ScanProgressPanel } from '../components/scanner/ScanProgressPanel';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export function ScanProgressPage() {
  const { entitySlug, runId } = useRouteParams<{ entitySlug: string; runId: string }>();
  const routes = useRoutes();
  const { baseUrl } = useTestomniacApi();
  const store = useScanProgressStore();
  const prevRunId = useRef<string | undefined>(undefined);

  // Reset store when viewing a different run (or on first mount)
  useEffect(() => {
    if (runId !== prevRunId.current) {
      store.reset();
      prevRunId.current = runId;
    }
  }, [runId, store]);
  const { navigate } = useLocalizedNavigate();

  const { isConnected } = useRunProgressStream({
    baseUrl,
    runId,
    isComplete: store.isComplete,
    onEvent: store.handleEvent,
  });

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title="Discovery Run Progress" description="" noIndex />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Discovery Run Progress
        </h1>
        {store.isComplete && (
          <Button
            variant="primary"
            onClick={() => navigate(routes.entityRun(entitySlug ?? '', runId ?? ''))}
          >
            View Results
          </Button>
        )}
      </div>

      <ScanProgressPanel
        pagesFound={store.pagesFound}
        pageStatesFound={store.pageStatesFound}
        testRunsCompleted={store.testRunsCompleted}
        findingsFound={store.findingsFound}
        error={store.error}
        events={store.events}
        isConnected={isConnected}
        isComplete={store.isComplete}
        latestScreenshotUrl={store.latestScreenshotUrl}
        currentPageUrl={store.currentPageUrl}
      />
    </div>
  );
}

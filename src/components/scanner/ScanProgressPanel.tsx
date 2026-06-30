import { Alert } from '@sudobility/components';
import type { TestRunStreamEvent } from '@sudobility/testomniac_types';
import { LiveCounters } from './LiveCounters';
import { EventLog } from './EventLog';

interface ScanProgressPanelProps {
  pagesFound: number;
  pageStatesFound: number;
  testRunsCompleted: number;
  findingsFound: number;
  error?: string | null;
  events: TestRunStreamEvent[];
  isConnected: boolean;
  isComplete: boolean;
  latestScreenshotUrl?: string | null;
  currentPageUrl?: string | null;
}

export function ScanProgressPanel({
  pagesFound,
  pageStatesFound,
  testRunsCompleted,
  findingsFound,
  error,
  events,
  isConnected,
  isComplete,
  latestScreenshotUrl,
  currentPageUrl,
}: ScanProgressPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {isComplete ? 'Discovery run finished' : 'Running discovery...'}
        </span>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="text-sm text-success font-medium">Complete</span>
          ) : (
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}
            />
          )}
        </div>
      </div>

      {error && <Alert variant="error" description={error} />}

      <LiveCounters
        pagesFound={pagesFound}
        pageStatesFound={pageStatesFound}
        testRunsCompleted={testRunsCompleted}
        findingsFound={findingsFound}
      />

      {(latestScreenshotUrl || currentPageUrl) && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current Page</span>
            {currentPageUrl && (
              <span className="min-w-0 text-xs font-mono text-muted-foreground truncate ml-2 max-w-full sm:max-w-[300px]">
                {currentPageUrl}
              </span>
            )}
          </div>
          {latestScreenshotUrl && (
            <img src={latestScreenshotUrl} alt="Current discovery page" className="w-full h-auto" />
          )}
        </div>
      )}

      <EventLog events={events} />
    </div>
  );
}

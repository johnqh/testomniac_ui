import { useState, useRef, useEffect } from 'react';
import {
  usePageStates,
  useRunPageSummary,
  useEnvironmentTestInteractions,
  useEnvironmentPages,
  useCreateTestInteractionRun,
  useRunPages,
  useRunTestInteractions,
  useProductPersonas,
  buildArtifactUrl,
} from '@sudobility/testomniac_client';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { usePageInteractionGroups } from '@sudobility/testomniac_lib';
import { Button, Card, ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { AddButton } from '../components/ui/AddButton';
import { InteractionCell } from '../components/cells';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { AddScenarioForm } from '../components/scenarios/AddScenarioForm';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

export function PageDetailPage() {
  const { pageId, envId, runId } = useRouteParams<{
    pageId: string;
    envId: string;
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();
  const { primaryRunner, productId } = useDashboardEnvironmentContext();
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const personasQuery = useProductPersonas(networkClient, baseUrl, token ?? '', productId, {
    enabled: !!productId && !!token,
  });
  const personas = personasQuery.data?.data ?? [];

  const numericPageId = Number(pageId);

  const runScoped = Boolean(runId);

  const envPagesQuery = useEnvironmentPages(networkClient, baseUrl, token ?? '', Number(envId), {
    enabled: !!envId && !!token && !runScoped,
  });

  const runPagesQuery = useRunPages(networkClient, baseUrl, token ?? '', Number(runId), {
    enabled: !!runId && !!token,
  });

  const envElementsQuery = useEnvironmentTestInteractions(
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

  const envPages = runScoped ? (runPagesQuery.data?.data ?? []) : (envPagesQuery.data?.data ?? []);
  const currentPage = envPages.find(p => p.id === numericPageId);
  const testInteractions = runScoped
    ? (runElementsQuery.data?.data ?? [])
    : (envElementsQuery.data?.data ?? []);

  const createTestInteractionRunMutation = useCreateTestInteractionRun(networkClient, baseUrl);
  const createRun = (data: { testInteractionId: number }) =>
    createTestInteractionRunMutation.mutateAsync({ token: token ?? '', data });

  const { startingElements, landingElements, onPageElements } = usePageInteractionGroups(
    testInteractions,
    numericPageId
  );

  const pageStatesQuery = usePageStates(networkClient, baseUrl, token ?? '', Number(pageId), {
    enabled: !!pageId && !!token,
  });
  const pageStates = pageStatesQuery.data?.data ?? [];
  const isLoading = pageStatesQuery.isLoading;

  const summaryQuery = useRunPageSummary(
    networkClient,
    baseUrl,
    token ?? '',
    Number(runId),
    Number(pageId),
    { enabled: !!runId && !!pageId && !!token }
  );
  const summary = summaryQuery.data?.data;
  const summaryLoading = summaryQuery.isLoading;

  if (isLoading || summaryLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      </div>
    );
  }

  const pagesBasePath = runId ? r.runPages(runId) : r.pages();

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Page Detail" description="" noIndex />
          <BackLink label="Pages" onClick={() => navigate(pagesBasePath)} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Page Detail</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {summary?.relativePath ?? `Page #${pageId}`}
                {runId ? ` • Run #${runId}` : ` • Page #${pageId}`}
              </p>
            </div>
            <div className="flex gap-2">
              {primaryRunner && (
                <AddButton
                  label="Add Scenario"
                  active={showScenarioForm}
                  onClick={() => setShowScenarioForm(prev => !prev)}
                />
              )}
              <Button variant="outline" onClick={() => navigate(r.pageGraph(pageId))}>
                View Page Graph
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {showScenarioForm && primaryRunner && (
          <div className="mb-6">
            <AddScenarioForm
              networkClient={networkClient}
              token={token ?? ''}
              runnerId={primaryRunner.id}
              personas={personas}
              defaultStartingPath={summary?.relativePath ?? currentPage?.relativePath ?? '/'}
              onCreated={() => setShowScenarioForm(false)}
              onCancel={() => setShowScenarioForm(false)}
            />
          </div>
        )}

        {summary && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-foreground">{summary.pageStatesCount}</div>
                <div className="text-xs text-muted-foreground">Page States</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-foreground">
                  {summary.testInteractionsCount}
                </div>
                <div className="text-xs text-muted-foreground">Test Interactions</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-destructive">{summary.findings}</div>
                <div className="text-xs text-muted-foreground">Findings</div>
              </Card>
              <Card variant="bordered" padding="md">
                <div className="text-2xl font-bold text-foreground">
                  {summary.testInteractionRunsCount}
                </div>
                <div className="text-xs text-muted-foreground">Case Runs</div>
              </Card>
            </div>

            {summary.latestScreenshotPath && (
              <Card variant="bordered" padding="none" className="mb-8 overflow-hidden">
                <img
                  src={buildArtifactUrl(baseUrl, summary.latestScreenshotPath)}
                  alt={`${summary.relativePath} latest screenshot`}
                  className="h-72 w-full object-cover object-top"
                />
              </Card>
            )}

            {summary.recentFindings.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Findings</h2>
                <div className="space-y-3">
                  {summary.recentFindings.slice(0, 8).map(finding => (
                    <Card key={finding.id} variant="bordered" padding="md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-foreground">{finding.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {finding.description}
                          </div>
                        </div>
                        <div className="shrink-0 text-[11px] capitalize text-muted-foreground">
                          {finding.expertise ?? finding.type}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {summary.runtimeSignals.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Runtime Signals</h2>
                <div className="space-y-4">
                  {summary.runtimeSignals.map(signal => (
                    <Card key={signal.testInteractionRunId} variant="bordered" padding="md">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {signal.testInteractionTitle ??
                              `Test Interaction #${signal.testInteractionId}`}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Case run #{signal.testInteractionRunId}
                            {signal.completedAt
                              ? ` • ${new Date(signal.completedAt).toLocaleString()}`
                              : ''}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{signal.status}</span>
                      </div>
                      {signal.consoleLog && (
                        <pre className="mb-3 max-h-48 overflow-auto rounded border border-border bg-muted p-3 text-xs leading-5 text-foreground">
                          {signal.consoleLog}
                        </pre>
                      )}
                      {signal.networkLog && (
                        <pre className="max-h-48 overflow-auto rounded border border-border bg-muted p-3 text-xs leading-5 text-foreground">
                          {signal.networkLog}
                        </pre>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {pageStates.length === 0 ? (
          <p className="text-muted-foreground">No page states found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageStates.map(state => (
              <button
                key={state.id}
                onClick={() =>
                  navigate(
                    runId ? r.runPageState(runId, pageId, state.id) : r.pageState(pageId, state.id)
                  )
                }
                className="text-left rounded-lg border border-border overflow-hidden hover:border-primary transition-colors"
              >
                <div className="h-40 bg-muted overflow-hidden">
                  {state.screenshotPath ? (
                    <img
                      src={buildArtifactUrl(baseUrl, state.screenshotPath)}
                      alt={`State ${state.id} screenshot`}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No screenshot</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">State #{state.id}</span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                      {state.sizeClass}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {state.capturedAt
                      ? new Date(state.capturedAt).toLocaleString()
                      : 'No capture date'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Test Interactions Section */}
        {(startingElements.length > 0 ||
          landingElements.length > 0 ||
          onPageElements.length > 0) && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Test Interactions</h2>

            {onPageElements.length > 0 && (
              <TestInteractionGroup
                label="On this page"
                elements={onPageElements}
                onTest={el => createRun({ testInteractionId: el.id })}
                onOpen={el => navigate(r.testInteraction(el.id))}
              />
            )}

            {startingElements.length > 0 && (
              <TestInteractionGroup
                label="Starting from this page"
                elements={startingElements}
                onTest={el => createRun({ testInteractionId: el.id })}
                onOpen={el => navigate(r.testInteraction(el.id))}
              />
            )}

            {landingElements.length > 0 && (
              <TestInteractionGroup
                label="Landing on this page"
                elements={landingElements}
                onTest={el => createRun({ testInteractionId: el.id })}
                onOpen={el => navigate(r.testInteraction(el.id))}
              />
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

// --- Test Interactions Sub-components ---

function TestInteractionGroup({
  label,
  elements,
  onTest,
  onOpen,
}: {
  label: string;
  elements: TestInteractionResponse[];
  onTest: (el: TestInteractionResponse) => void;
  onOpen: (el: TestInteractionResponse) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="space-y-2">
        {elements.map(el => (
          <TestInteractionRow
            key={el.id}
            element={el}
            onTest={() => onTest(el)}
            onOpen={() => onOpen(el)}
          />
        ))}
      </div>
    </div>
  );
}

function TestInteractionRow({
  element,
  onTest,
  onOpen,
}: {
  element: TestInteractionResponse;
  onTest: () => void;
  onOpen: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <InteractionCell
      interaction={element}
      onClick={onOpen}
      compact
      actions={
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-border bg-popover py-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onTest();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
              >
                Test
              </button>
            </div>
          )}
        </div>
      }
    />
  );
}

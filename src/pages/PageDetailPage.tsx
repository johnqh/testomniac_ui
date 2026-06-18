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
import { Button, Card } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { InteractionCell } from '../components/cells';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { AddScenarioForm } from '../components/scenarios/AddScenarioForm';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

export function PageDetailPage() {
  const { pageId, envId, entitySlug, runId } = useRouteParams<{
    pageId: string;
    envId: string;
    entitySlug: string;
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const { primaryRunner, productId } = useDashboardEnvironmentContext();
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const { personas } = useProductPersonas({
    networkClient,
    baseUrl,
    productId,
    token: token ?? '',
    enabled: !!productId && !!token,
  });

  const numericPageId = Number(pageId);

  const runScoped = Boolean(runId);

  const envPagesQuery = useEnvironmentPages({
    networkClient,
    baseUrl,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token && !runScoped,
  });

  const runPagesQuery = useRunPages({
    networkClient,
    baseUrl,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const envElementsQuery = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token && !runScoped,
  });

  const runElementsQuery = useRunTestInteractions({
    networkClient,
    baseUrl,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const envPages = runScoped ? runPagesQuery.pages : envPagesQuery.pages;
  const currentPage = envPages.find(p => p.id === numericPageId);
  const testInteractions = runScoped
    ? runElementsQuery.testInteractions
    : envElementsQuery.testInteractions;

  const { createRun } = useCreateTestInteractionRun({
    networkClient,
    baseUrl,
    token: token ?? '',
  });

  const { startingElements, landingElements, onPageElements } = usePageInteractionGroups(
    testInteractions,
    numericPageId
  );

  const { pageStates, isLoading } = usePageStates({
    networkClient,
    baseUrl,
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!pageId && !!token,
  });
  const { summary, isLoading: summaryLoading } = useRunPageSummary({
    networkClient,
    baseUrl,
    runId: Number(runId),
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!runId && !!pageId && !!token,
  });

  if (isLoading || summaryLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  const pagesBasePath = runId
    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages`
    : `/dashboard/${entitySlug}/environments/${envId}/pages`;

  return (
    <div className="p-6">
      <SEOHead title="Page Detail" description="" noIndex />
      <BackLink label="Pages" onClick={() => navigate(pagesBasePath)} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Detail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary?.relativePath ?? `Page #${pageId}`}
            {runId ? ` • Run #${runId}` : ` • Page #${pageId}`}
          </p>
        </div>
        <div className="flex gap-2">
          {primaryRunner && (
            <Button variant="primary" onClick={() => setShowScenarioForm(prev => !prev)}>
              {showScenarioForm ? 'Cancel' : 'Add Scenario'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}/graph`)
            }
          >
            View Page Graph
          </Button>
        </div>
      </div>

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
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.pageStatesCount}
              </div>
              <div className="text-xs text-gray-500">Page States</div>
            </Card>
            <Card variant="bordered" padding="md">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testInteractionsCount}
              </div>
              <div className="text-xs text-gray-500">Test Interactions</div>
            </Card>
            <Card variant="bordered" padding="md">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.findings}
              </div>
              <div className="text-xs text-gray-500">Findings</div>
            </Card>
            <Card variant="bordered" padding="md">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testInteractionRunsCount}
              </div>
              <div className="text-xs text-gray-500">Case Runs</div>
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
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Findings
              </h2>
              <div className="space-y-3">
                {summary.recentFindings.slice(0, 8).map(finding => (
                  <Card key={finding.id} variant="bordered" padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {finding.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {finding.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] capitalize text-gray-500 dark:text-gray-400">
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
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Runtime Signals
              </h2>
              <div className="space-y-4">
                {summary.runtimeSignals.map(signal => (
                  <Card key={signal.testInteractionRunId} variant="bordered" padding="md">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {signal.testInteractionTitle ??
                            `Test Interaction #${signal.testInteractionId}`}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Case run #{signal.testInteractionRunId}
                          {signal.completedAt
                            ? ` • ${new Date(signal.completedAt).toLocaleString()}`
                            : ''}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {signal.status}
                      </span>
                    </div>
                    {signal.consoleLog && (
                      <pre className="mb-3 max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        {signal.consoleLog}
                      </pre>
                    )}
                    {signal.networkLog && (
                      <pre className="max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
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
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageStates.map(state => (
            <button
              key={state.id}
              onClick={() =>
                navigate(
                  runId
                    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages/${pageId}/states/${state.id}`
                    : `/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}/states/${state.id}`
                )
              }
              className="text-left rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {state.screenshotPath ? (
                  <img
                    src={buildArtifactUrl(baseUrl, state.screenshotPath)}
                    alt={`State ${state.id} screenshot`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">No screenshot</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    State #{state.id}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {state.sizeClass}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
      {(startingElements.length > 0 || landingElements.length > 0 || onPageElements.length > 0) && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Test Interactions
          </h2>

          {onPageElements.length > 0 && (
            <TestInteractionGroup
              label="On this page"
              elements={onPageElements}
              onTest={el => createRun({ testInteractionId: el.id })}
              onOpen={el =>
                navigate(
                  `/dashboard/${entitySlug}/environments/${envId}/test-interactions/${el.id}`
                )
              }
            />
          )}

          {startingElements.length > 0 && (
            <TestInteractionGroup
              label="Starting from this page"
              elements={startingElements}
              onTest={el => createRun({ testInteractionId: el.id })}
              onOpen={el =>
                navigate(
                  `/dashboard/${entitySlug}/environments/${envId}/test-interactions/${el.id}`
                )
              }
            />
          )}

          {landingElements.length > 0 && (
            <TestInteractionGroup
              label="Landing on this page"
              elements={landingElements}
              onTest={el => createRun({ testInteractionId: el.id })}
              onOpen={el =>
                navigate(
                  `/dashboard/${entitySlug}/environments/${envId}/test-interactions/${el.id}`
                )
              }
            />
          )}
        </div>
      )}
    </div>
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
      <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
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
      actions={
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onTest();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
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

import { useState, useMemo } from 'react';
import {
  usePageStates,
  useHtmlElement,
  usePageStateScaffolds,
  buildArtifactUrl,
} from '@sudobility/testomniac_client';
import { Tabs, TabsList, TabsTrigger, Card, ContentLayout } from '@sudobility/components';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

type Tab = 'body' | 'content' | 'scaffolds';

export function PageStateDetailPage() {
  const { pageStateId, pageId, envId, runId } = useRouteParams<{
    pageStateId: string;
    pageId: string;
    envId: string;
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [bodyView, setBodyView] = useState<'rendered' | 'source'>('rendered');
  const [contentView, setContentView] = useState<'rendered' | 'source'>('rendered');

  const pageStatesQuery = usePageStates(networkClient, baseUrl, token ?? '', Number(pageId), {
    enabled: !!pageId && !!token,
  });
  const pageStates = useMemo(() => pageStatesQuery.data?.data ?? [], [pageStatesQuery.data]);
  const statesLoading = pageStatesQuery.isLoading;

  const state = useMemo(
    () => pageStates.find(s => s.id === Number(pageStateId)) ?? null,
    [pageStates, pageStateId]
  );

  const bodyHtmlElementQuery = useHtmlElement(
    networkClient,
    baseUrl,
    token ?? '',
    state?.bodyHtmlElementId ?? 0,
    { enabled: !!state?.bodyHtmlElementId && !!token }
  );
  const bodyHtmlElement = bodyHtmlElementQuery.data?.data;
  const bodyLoading = bodyHtmlElementQuery.isLoading;

  const contentHtmlElementQuery = useHtmlElement(
    networkClient,
    baseUrl,
    token ?? '',
    state?.contentHtmlElementId ?? 0,
    { enabled: !!state?.contentHtmlElementId && !!token }
  );
  const contentHtmlElement = contentHtmlElementQuery.data?.data;
  const contentLoading = contentHtmlElementQuery.isLoading;

  const scaffoldsQuery = usePageStateScaffolds(
    networkClient,
    baseUrl,
    token ?? '',
    Number(pageStateId),
    { enabled: !!pageStateId && !!token }
  );
  const scaffolds = scaffoldsQuery.data?.data ?? [];
  const scaffoldsLoading = scaffoldsQuery.isLoading;

  if (statesLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground py-8">Page state not found.</div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'body', label: 'Body' },
    { key: 'content', label: 'Content' },
    { key: 'scaffolds', label: 'Scaffolds' },
  ];

  const pageBasePath = runId ? r.runPage(runId, pageId) : r.page(pageId);

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <BackLink label={`Page #${pageId}`} onClick={() => navigate(pageBasePath)} />
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Page State #{pageStateId}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                {state.sizeClass}
              </span>
              <span className="text-xs text-muted-foreground">
                Environment #{envId} / Page #{pageId}
              </span>
              {state.capturedAt && (
                <span className="text-xs text-muted-foreground">
                  Captured: {new Date(state.capturedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
            <TabsList>
              {tabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {/* Body Tab */}
        {activeTab === 'body' && (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBodyView('rendered')}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  bodyView === 'rendered'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground'
                }`}
              >
                Rendered
              </button>
              <button
                onClick={() => setBodyView('source')}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  bodyView === 'source'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground'
                }`}
              >
                Source
              </button>
            </div>

            {bodyView === 'rendered' ? (
              state.rawHtmlPath ? (
                <iframe
                  sandbox="allow-same-origin"
                  src={buildArtifactUrl(baseUrl, state.rawHtmlPath)}
                  className="w-full h-[600px] border border-border rounded-lg bg-card"
                  title="Rendered body HTML"
                />
              ) : (
                <div className="text-muted-foreground py-8 text-center">No raw HTML available.</div>
              )
            ) : bodyLoading ? (
              <div className="text-muted-foreground py-8 text-center">Loading source...</div>
            ) : bodyHtmlElement ? (
              <pre className="p-4 bg-muted border border-border rounded-lg text-xs text-foreground overflow-auto max-h-[600px]">
                {bodyHtmlElement.html}
              </pre>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No body HTML element available.
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setContentView('rendered')}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  contentView === 'rendered'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground'
                }`}
              >
                Rendered
              </button>
              <button
                onClick={() => setContentView('source')}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  contentView === 'source'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground'
                }`}
              >
                Source
              </button>
            </div>

            {contentView === 'rendered' ? (
              <div className="space-y-4">
                {state.contentText && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Content Text</h3>
                    <div className="p-4 bg-muted border border-border rounded-lg text-sm text-foreground whitespace-pre-wrap max-h-[400px] overflow-auto">
                      {state.contentText}
                    </div>
                  </div>
                )}
                {!state.contentText && (
                  <div className="text-muted-foreground py-8 text-center">
                    No content text available.
                  </div>
                )}
              </div>
            ) : contentLoading ? (
              <div className="text-muted-foreground py-8 text-center">Loading source...</div>
            ) : contentHtmlElement ? (
              <pre className="p-4 bg-muted border border-border rounded-lg text-xs text-foreground overflow-auto max-h-[600px]">
                {contentHtmlElement.html}
              </pre>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No content HTML element available.
              </div>
            )}
          </div>
        )}

        {/* Scaffolds Tab */}
        {activeTab === 'scaffolds' && (
          <div>
            {scaffoldsLoading ? (
              <div className="text-muted-foreground py-8 text-center">Loading...</div>
            ) : scaffolds.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No scaffolds found.</div>
            ) : (
              <div className="space-y-2">
                {scaffolds.map(element => (
                  <Card key={element.id} variant="bordered" padding="sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Scaffold #{element.scaffoldId}
                      </span>
                      <span className="px-1.5 py-0.5 text-xs rounded bg-info/10 text-info">
                        Scaffold
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Page State #{element.pageStateId}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

import { useMemo, useState } from 'react';
import {
  useEnvironmentTestInteractions,
  useTestInteractionActions,
} from '@sudobility/testomniac_client';
import type { TestActionResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { Card, ContentLayout } from '@sudobility/components';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';
import { ScriptPanel } from '../components/scripts/ScriptPanel';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

function ActionRow({ action }: { action: TestActionResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-accent transition-colors"
      >
        <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0 text-right">
          #{action.stepOrder}
        </span>
        <StatusBadge status={action.actionType} />
        <span className="flex-1 min-w-0 text-sm text-foreground truncate">
          {action.description}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && action.playwrightCode && (
        <div className="px-4 py-3 border-t border-border bg-muted">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Playwright Code
          </div>
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words bg-card rounded-md p-3 border border-border">
            {action.playwrightCode}
          </pre>
        </div>
      )}
    </Card>
  );
}

function ElementLinkRow({
  element,
  onClick,
  relation,
}: {
  element: TestInteractionResponse;
  onClick: () => void;
  relation: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{relation}</div>
          <div className="mt-1 text-sm font-medium text-foreground truncate">{element.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">Test Interaction #{element.id}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={element.testType} />
          <StatusBadge status={element.sizeClass} />
        </div>
      </div>
    </button>
  );
}

export function TestInteractionDetailPage() {
  const { envId, elementId } = useRouteParams<{
    envId: string;
    elementId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const r = useEnvRoutes();
  const numericElementId = Number(elementId);

  const actionsQuery = useTestInteractionActions(
    networkClient,
    baseUrl,
    token ?? '',
    numericElementId,
    { enabled: !!elementId && !!token }
  );
  const actions = actionsQuery.data?.data ?? [];
  const isLoading = actionsQuery.isLoading;
  const error = actionsQuery.error?.message ?? null;

  const interactionsQuery = useEnvironmentTestInteractions(
    networkClient,
    baseUrl,
    token ?? '',
    Number(envId),
    { enabled: !!envId && !!token }
  );
  const testInteractions = useMemo(
    () => interactionsQuery.data?.data ?? [],
    [interactionsQuery.data]
  );
  const elementsLoading = interactionsQuery.isLoading;
  const elementsError = interactionsQuery.error?.message ?? null;

  const currentElement = useMemo(
    () => testInteractions.find(element => element.id === numericElementId) ?? null,
    [numericElementId, testInteractions]
  );
  const dependencyElement = useMemo(() => {
    if (!currentElement?.dependencyTestInteractionId) return null;
    return (
      testInteractions.find(element => element.id === currentElement.dependencyTestInteractionId) ??
      null
    );
  }, [currentElement, testInteractions]);
  const dependentElements = useMemo(
    () =>
      testInteractions.filter(element => element.dependencyTestInteractionId === numericElementId),
    [numericElementId, testInteractions]
  );
  const actionList = (actions as TestActionResponse[]).sort((a, b) => a.stepOrder - b.stepOrder);
  const hasHoverAction = actionList.some(action => action.actionType === 'hover');
  const actionError = error || elementsError;
  const isPageLoading = isLoading || elementsLoading;

  if (actionError) {
    return <ErrorState message={actionError} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <BackLink label="Test Interactions" onClick={() => navigate(r.testInteractions())} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">Test Interaction #{elementId}</h1>
            <AddToBundleButton itemType="interaction" itemId={Number(elementId)} />
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">ID: {elementId}</span>
          {currentElement && <StatusBadge status={currentElement.testType} />}
          {currentElement && <StatusBadge status={currentElement.sizeClass} />}
          {hasHoverAction && <StatusBadge status="hover" />}
          {currentElement?.surfaceTags.map(tag => (
            <StatusBadge key={tag} status={tag} />
          ))}
        </div>

        {currentElement && (
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card variant="bordered" padding="md">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Starting State
              </div>
              <div className="mt-2 text-sm text-foreground">
                Path: {currentElement.startingPath || 'None'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Page state #{currentElement.startingPageStateId ?? 'none'}
              </div>
            </Card>

            <Card variant="bordered" padding="md">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Interaction Shape
              </div>
              <div className="mt-2 text-sm text-foreground">
                {hasHoverAction
                  ? 'This element includes a hover interaction.'
                  : 'No hover interaction is defined on this element.'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {actionList.length} action{actionList.length === 1 ? '' : 's'} in sequence
              </div>
            </Card>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Depends On
            </h2>
            {dependencyElement ? (
              <ElementLinkRow
                element={dependencyElement}
                relation="Parent dependency"
                onClick={() => navigate(r.testInteraction(dependencyElement.id))}
              />
            ) : (
              <EmptyState description="This test interaction has no dependency." />
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Depended On By
            </h2>
            {dependentElements.length === 0 ? (
              <EmptyState description="No other test interactions currently depend on this one." />
            ) : (
              <div className="space-y-2">
                {dependentElements.map(element => (
                  <ElementLinkRow
                    key={element.id}
                    element={element}
                    relation="Child dependency"
                    onClick={() => navigate(r.testInteraction(element.id))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions list */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Test Actions
        </h2>

        {!isPageLoading && (
          <div className="mb-6">
            <ScriptPanel
              kind="interaction"
              id={numericElementId}
              filename={`interaction-${numericElementId}.spec.ts`}
            />
          </div>
        )}

        {isPageLoading && <LoadingState message="Loading test interaction details..." />}

        {!isPageLoading && actionList.length === 0 && (
          <EmptyState description="No actions defined for this test interaction." />
        )}

        {!isPageLoading && actionList.length > 0 && (
          <div className="space-y-2">
            {actionList.map(action => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

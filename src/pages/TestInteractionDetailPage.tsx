import { useMemo, useState } from 'react';
import {
  useEnvironmentTestInteractions,
  useTestInteractionActions,
} from '@sudobility/testomniac_client';
import type { TestActionResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import { useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useEnvBasePath } from '../hooks/useEnvBasePath';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { Card } from '@sudobility/components';
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
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8 flex-shrink-0 text-right">
          #{action.stepOrder}
        </span>
        <StatusBadge status={action.actionType} />
        <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
          {action.description}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && action.playwrightCode && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Playwright Code
          </div>
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
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
      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {relation}
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {element.title}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Test Interaction #{element.id}
          </div>
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

  const basePath = useEnvBasePath();
  const numericElementId = Number(elementId);

  const { actions, isLoading, error } = useTestInteractionActions({
    networkClient,
    baseUrl,
    testInteractionId: numericElementId,
    token: token ?? '',
    enabled: !!elementId && !!token,
  });
  const {
    testInteractions,
    isLoading: elementsLoading,
    error: elementsError,
  } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

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
    <div className="p-6">
      <BackLink
        label="Test Interactions"
        onClick={() => navigate(`${basePath}/test-interactions`)}
      />

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Test Interaction #{elementId}
        </h1>
        <AddToBundleButton itemType="interaction" itemId={Number(elementId)} />
      </div>

      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {elementId}</span>
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
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Starting State
            </div>
            <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
              Path: {currentElement.startingPath || 'None'}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Page state #{currentElement.startingPageStateId ?? 'none'}
            </div>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Interaction Shape
            </div>
            <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
              {hasHoverAction
                ? 'This element includes a hover interaction.'
                : 'No hover interaction is defined on this element.'}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {actionList.length} action{actionList.length === 1 ? '' : 's'} in sequence
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Depends On
          </h2>
          {dependencyElement ? (
            <ElementLinkRow
              element={dependencyElement}
              relation="Parent dependency"
              onClick={() => navigate(`${basePath}/test-interactions/${dependencyElement.id}`)}
            />
          ) : (
            <EmptyState description="This test interaction has no dependency." />
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
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
                  onClick={() => navigate(`${basePath}/test-interactions/${element.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions list */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
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
  );
}

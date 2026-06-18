import { useState } from 'react';
import {
  useRunnerTestScenarios,
  useEnvironmentTestInteractions,
  useTestScenarioSequences,
  useTestScenarioSequenceTestInteractions,
  useProductPersonas,
  useGenerateSequence,
} from '@sudobility/testomniac_client';
import { Alert, ActionButton, Card } from '@sudobility/components';
import type {
  TestScenarioSequenceResponse,
  TestInteractionResponse,
} from '@sudobility/testomniac_types';
import type { NetworkClient } from '@sudobility/types';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { InteractionCell, ListCell } from '../components/cells';
import { ScriptPanel } from '../components/scripts/ScriptPanel';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';
import { EmptyState } from '../components/states';

function SequenceCard({
  sequence,
  isExpanded,
  onToggle,
  networkClient,
  token,
  interactionPath,
  navigate,
  interactions,
}: {
  sequence: TestScenarioSequenceResponse;
  isExpanded: boolean;
  onToggle: () => void;
  networkClient: NetworkClient;
  token: string;
  interactionPath: (id: number) => string;
  navigate: (path: string) => void;
  interactions: TestInteractionResponse[];
}) {
  const { baseUrl } = useTestomniacApi();
  const { testInteractionLinks, isLoading } = useTestScenarioSequenceTestInteractions({
    networkClient,
    baseUrl,
    testScenarioSequenceId: sequence.id,
    token,
    enabled: isExpanded,
  });

  const sorted = [...testInteractionLinks].sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));

  const interactionById = new Map(interactions.map(i => [i.id, i]));

  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Sequence #{sequence.id}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Environment ID: {sequence.testEnvironmentId}
            {sequence.createdAt &&
              ` — Created: ${new Date(sequence.createdAt).toLocaleDateString()}`}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          {isLoading && <div className="text-xs text-gray-400 py-2">Loading interactions...</div>}
          {!isLoading && sorted.length === 0 && (
            <div className="text-xs text-gray-400 py-2">No interactions in this sequence.</div>
          )}
          {!isLoading && sorted.length > 0 && (
            <div className="space-y-2">
              {sorted.map(link => {
                const interaction = interactionById.get(link.testInteractionId);
                const onOpen = () => navigate(interactionPath(link.testInteractionId));
                const stepLabel = (
                  <span className="w-6 text-right font-mono text-xs text-gray-400">
                    {link.stepOrder}.
                  </span>
                );
                return interaction ? (
                  <InteractionCell
                    key={link.id}
                    interaction={interaction}
                    onClick={onOpen}
                    leading={stepLabel}
                  />
                ) : (
                  <ListCell
                    key={link.id}
                    leading={stepLabel}
                    title={`Interaction #${link.testInteractionId}`}
                    onClick={onOpen}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && sorted.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
              <ScriptPanel
                kind="sequence"
                id={sequence.id}
                filename={`sequence-${sequence.id}.spec.ts`}
                enabled={isExpanded}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function TestScenarioDetailPage() {
  const { envId, scenarioId } = useRouteParams<{
    envId: string;
    scenarioId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    productId,
    primaryRunner,
    envId: numericEnvId,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const r = useEnvRoutes();

  // Fetch the scenario from the list (no single-get endpoint needed)
  const { testScenarios } = useRunnerTestScenarios({
    networkClient,
    baseUrl,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  const scenario = testScenarios.find(s => s.id === Number(scenarioId));

  const { personas } = useProductPersonas({
    networkClient,
    baseUrl,
    productId,
    token,
    enabled: !!productId && !!token,
  });

  // Use the same source as the Test Interactions screen so every sequence step
  // resolves to a full InteractionCell (title + path + type badge).
  const { testInteractions, refetch: refetchInteractions } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: numericEnvId,
    token,
    enabled: !!envId && !!token,
  });

  const personaName = scenario?.personaId
    ? personas.find(p => p.id === scenario.personaId)?.title
    : null;

  const {
    sequences,
    isLoading: sequencesLoading,
    error: sequencesError,
    refetch: refetchSequences,
  } = useTestScenarioSequences({
    networkClient,
    baseUrl,
    testScenarioId: Number(scenarioId),
    token: token ?? '',
    enabled: !!scenarioId && !!token,
  });

  const {
    generateSequence,
    isGenerating,
    error: generateError,
  } = useGenerateSequence({
    networkClient,
    baseUrl,
    token,
  });

  const [generateErrorMsg, setGenerateErrorMsg] = useState<string | null>(null);
  const [expandedSequenceId, setExpandedSequenceId] = useState<number | null>(null);

  const handleGenerateSequence = async () => {
    setGenerateErrorMsg(null);
    try {
      await generateSequence({
        scenarioId: Number(scenarioId),
        testEnvironmentId: numericEnvId,
      });
      refetchSequences();
      // The generated interactions are new rows; refresh the interaction list
      // so each sequence step resolves to a full cell without a page reload.
      refetchInteractions();
    } catch (err) {
      setGenerateErrorMsg(
        err instanceof Error ? err.message : generateError || 'Failed to generate sequence'
      );
    }
  };

  if (contextError || sequencesError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || sequencesError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title={scenario?.title ?? `Scenario #${scenarioId}`} description="" noIndex />

      <BackLink label="Test Scenarios" onClick={() => navigate(r.testScenarios())} />

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {scenario?.title ?? `Test Scenario #${scenarioId}`}
        </h1>
        <AddToBundleButton itemType="scenario" itemId={Number(scenarioId)} />
      </div>

      {scenario && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Starting path:{' '}
              <code className="text-gray-900 dark:text-gray-100">{scenario.startingPath}</code>
            </span>
            <span>
              Device: <code className="text-gray-900 dark:text-gray-100">{scenario.sizeClass}</code>
            </span>
            {scenario.personaId && (
              <span>
                Persona:{' '}
                <code className="text-gray-900 dark:text-gray-100">
                  {personaName ?? `#${scenario.personaId}`}
                </code>
              </span>
            )}
          </div>
          <Card variant="bordered" padding="sm">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prompt</div>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {scenario.prompt}
            </p>
          </Card>
        </div>
      )}

      {/* Sequences */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Sequences
        </h2>
        <ActionButton
          variant="primary"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={handleGenerateSequence}
          disabled={!scenarioId}
          isLoading={isGenerating}
          loadingText="Generating..."
        >
          Generate Sequence
        </ActionButton>
      </div>

      {(generateErrorMsg || generateError) && (
        <Alert
          variant="error"
          description={generateErrorMsg || generateError || undefined}
          className="mb-3"
        />
      )}

      {sequencesLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading...</div>
      )}

      {!sequencesLoading && sequences.length === 0 && (
        <EmptyState
          title="No sequences yet"
          description="Sequences are created when a scenario is run against an environment."
        />
      )}

      {sequences.length > 0 && (
        <div className="space-y-2">
          {sequences.map((seq: TestScenarioSequenceResponse) => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              isExpanded={expandedSequenceId === seq.id}
              onToggle={() => setExpandedSequenceId(expandedSequenceId === seq.id ? null : seq.id)}
              networkClient={networkClient}
              token={token ?? ''}
              interactionPath={r.testInteraction}
              navigate={navigate}
              interactions={testInteractions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

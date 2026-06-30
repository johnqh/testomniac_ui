import { useState } from 'react';
import {
  useRunnerTestScenarios,
  useEnvironmentTestInteractions,
  useTestScenarioSequences,
  useTestScenarioSequenceTestInteractions,
  useProductPersonas,
  useGenerateSequence,
} from '@sudobility/testomniac_client';
import { Alert, ActionButton, Card, ContentLayout } from '@sudobility/components';
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
  const interactionsQuery = useTestScenarioSequenceTestInteractions(
    networkClient,
    baseUrl,
    token,
    sequence.id,
    { enabled: isExpanded }
  );
  const testInteractionLinks = interactionsQuery.data?.data ?? [];
  const isLoading = interactionsQuery.isLoading;

  const sorted = [...testInteractionLinks].sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));

  const interactionById = new Map(interactions.map(i => [i.id, i]));

  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-accent transition-colors"
      >
        <span className="text-xs text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">Sequence #{sequence.id}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Environment ID: {sequence.testEnvironmentId}
            {sequence.createdAt &&
              ` — Created: ${new Date(sequence.createdAt).toLocaleDateString()}`}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-3">
          {isLoading && (
            <div className="text-xs text-muted-foreground py-2">Loading interactions...</div>
          )}
          {!isLoading && sorted.length === 0 && (
            <div className="text-xs text-muted-foreground py-2">
              No interactions in this sequence.
            </div>
          )}
          {!isLoading && sorted.length > 0 && (
            <div className="space-y-1">
              {sorted.map(link => {
                const interaction = interactionById.get(link.testInteractionId);
                const onOpen = () => navigate(interactionPath(link.testInteractionId));
                const stepLabel = (
                  <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                    {link.stepOrder}.
                  </span>
                );
                return interaction ? (
                  <InteractionCell
                    key={link.id}
                    interaction={interaction}
                    onClick={onOpen}
                    leading={stepLabel}
                    compact
                  />
                ) : (
                  <ListCell
                    key={link.id}
                    leading={stepLabel}
                    title={`Interaction #${link.testInteractionId}`}
                    onClick={onOpen}
                    compact
                  />
                );
              })}
            </div>
          )}

          {!isLoading && sorted.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
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
  const scenariosQuery = useRunnerTestScenarios(
    networkClient,
    baseUrl,
    token,
    primaryRunner?.id ?? 0,
    { enabled: !!envId && !!token && !!primaryRunner }
  );
  const testScenarios = scenariosQuery.data?.data ?? [];

  const scenario = testScenarios.find(s => s.id === Number(scenarioId));

  const personasQuery = useProductPersonas(networkClient, baseUrl, token, productId, {
    enabled: !!productId && !!token,
  });
  const personas = personasQuery.data?.data ?? [];

  // Use the same source as the Test Interactions screen so every sequence step
  // resolves to a full InteractionCell (title + path + type badge).
  const interactionsQuery = useEnvironmentTestInteractions(
    networkClient,
    baseUrl,
    token,
    numericEnvId,
    { enabled: !!envId && !!token }
  );
  const testInteractions = interactionsQuery.data?.data ?? [];
  const refetchInteractions = interactionsQuery.refetch;

  const personaName = scenario?.personaId
    ? personas.find(p => p.id === scenario.personaId)?.title
    : null;

  const sequencesQuery = useTestScenarioSequences(
    networkClient,
    baseUrl,
    token ?? '',
    Number(scenarioId),
    { enabled: !!scenarioId && !!token }
  );
  const sequences = sequencesQuery.data?.data ?? [];
  const sequencesLoading = sequencesQuery.isLoading;
  const sequencesError = sequencesQuery.error?.message ?? null;
  const refetchSequences = sequencesQuery.refetch;

  const generateSequenceMutation = useGenerateSequence(networkClient, baseUrl);
  const isGenerating = generateSequenceMutation.isPending;

  const [generateErrorMsg, setGenerateErrorMsg] = useState<string | null>(null);
  const [expandedSequenceId, setExpandedSequenceId] = useState<number | null>(null);

  const handleGenerateSequence = async () => {
    setGenerateErrorMsg(null);
    try {
      const json = await generateSequenceMutation.mutateAsync({
        token: token ?? '',
        scenarioId: Number(scenarioId),
        data: { testEnvironmentId: numericEnvId },
      });
      if (!json.success) {
        setGenerateErrorMsg(json.error ?? 'Failed to generate sequence');
        return;
      }
      refetchSequences();
      // The generated interactions are new rows; refresh the interaction list
      // so each sequence step resolves to a full cell without a page reload.
      refetchInteractions();
    } catch (err) {
      setGenerateErrorMsg(err instanceof Error ? err.message : 'Failed to generate sequence');
    }
  };

  if (contextError || sequencesError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-destructive py-8">
          Error: {contextError || sequencesError}
        </div>
      </div>
    );
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title={scenario?.title ?? `Scenario #${scenarioId}`} description="" noIndex />

          <BackLink label="Test Scenarios" onClick={() => navigate(r.testScenarios())} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              {scenario?.title ?? `Test Scenario #${scenarioId}`}
            </h1>
            <AddToBundleButton itemType="scenario" itemId={Number(scenarioId)} />
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {scenario && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                Starting path: <code className="text-foreground">{scenario.startingPath}</code>
              </span>
              <span>
                Device: <code className="text-foreground">{scenario.sizeClass}</code>
              </span>
              {scenario.personaId && (
                <span>
                  Persona:{' '}
                  <code className="text-foreground">{personaName ?? `#${scenario.personaId}`}</code>
                </span>
              )}
            </div>
            <Card variant="bordered" padding="sm">
              <div className="text-xs font-medium text-muted-foreground mb-1">Prompt</div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{scenario.prompt}</p>
            </Card>
          </div>
        )}

        {/* Sequences */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sequences
          </h2>
          <ActionButton
            variant="primary"
            // distinct purple brand accent for the AI "Generate" action; no semantic token equivalent
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleGenerateSequence}
            disabled={!scenarioId}
            isLoading={isGenerating}
            loadingText="Generating..."
          >
            Generate Sequence
          </ActionButton>
        </div>

        {generateErrorMsg && (
          <Alert variant="error" description={generateErrorMsg} className="mb-3" />
        )}

        {sequencesLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div>
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
                onToggle={() =>
                  setExpandedSequenceId(expandedSequenceId === seq.id ? null : seq.id)
                }
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
    </ContentLayout>
  );
}

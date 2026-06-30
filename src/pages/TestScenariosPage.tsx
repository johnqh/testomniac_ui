import { useState } from 'react';
import {
  useRunnerTestScenarios,
  useDeleteTestScenario,
  useProductPersonas,
  useDetectTestScenarios,
} from '@sudobility/testomniac_client';
import type { TestScenarioResponse } from '@sudobility/testomniac_types';
import { Alert, ActionButton, ContentLayout, CardGrid } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { AddButton } from '../components/ui/AddButton';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { ScenarioCell } from '../components/cells';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { AddScenarioForm } from '../components/scenarios/AddScenarioForm';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function TestScenariosPage() {
  const { envId } = useRouteParams<{ envId: string }>();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    productId,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();
  const [showForm, setShowForm] = useState(false);

  const scenariosQuery = useRunnerTestScenarios(
    networkClient,
    baseUrl,
    token,
    primaryRunner?.id ?? 0,
    { enabled: !!envId && !!token && !!primaryRunner }
  );
  const testScenarios = scenariosQuery.data?.data ?? [];
  const isLoading = scenariosQuery.isLoading;
  const error = scenariosQuery.error?.message ?? null;
  const refetch = scenariosQuery.refetch;

  const personasQuery = useProductPersonas(networkClient, baseUrl, token, productId, {
    enabled: !!productId && !!token,
  });
  const personas = personasQuery.data?.data ?? [];

  const deleteTestScenarioMutation = useDeleteTestScenario(networkClient, baseUrl);

  const detectTestScenariosMutation = useDetectTestScenarios(networkClient, baseUrl);
  const isDetecting = detectTestScenariosMutation.isPending;

  // Detect state
  const [detectError, setDetectError] = useState<string | null>(null);

  const handleDelete = async (scenarioId: number) => {
    await deleteTestScenarioMutation.mutateAsync({
      token,
      runnerId: primaryRunner?.id ?? 0,
      scenarioId,
    });
    refetch();
  };

  const handleDetect = async () => {
    setDetectError(null);
    try {
      await detectTestScenariosMutation.mutateAsync({
        token,
        data: { productId: productId! },
      });
      refetch();
    } catch (err) {
      // The API returns an actionable message (e.g. naming the missing
      // SHAPESHYFT_* env var) when scenario detection isn't configured.
      setDetectError(err instanceof Error ? err.message : 'Detection failed');
    }
  };

  if (contextError || error) {
    return <ErrorState message={contextError || error || ''} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Test Scenarios" description="" noIndex />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">Test Scenarios</h1>
            <div className="flex items-center gap-2">
              {/* distinct purple accent marks the AI "Detect" action apart from the primary Add button; no semantic equivalent */}
              <ActionButton
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleDetect}
                disabled={!productId}
                isLoading={isDetecting}
                loadingText="Detecting..."
              >
                Detect Scenarios
              </ActionButton>
              <AddButton
                label="New Scenario"
                active={showForm}
                onClick={() => setShowForm(!showForm)}
              />
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {detectError && <Alert variant="error" description={detectError} className="mb-4" />}

        {showForm && primaryRunner && (
          <div className="mb-6">
            <AddScenarioForm
              networkClient={networkClient}
              token={token}
              runnerId={primaryRunner.id}
              personas={personas}
              onCreated={() => {
                setShowForm(false);
                refetch();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {(contextLoading || isLoading) && <LoadingState message="Loading test scenarios..." />}

        {!isLoading && testScenarios.length === 0 && !showForm && (
          <EmptyState
            title="No test scenarios yet"
            description="Create a test scenario to define a user flow you want to test."
          />
        )}

        {!isLoading && testScenarios.length > 0 && (
          <CardGrid>
            {testScenarios.map((scenario: TestScenarioResponse) => (
              <ScenarioCell
                key={scenario.id}
                scenario={scenario}
                variant="tile"
                onClick={() => navigate(r.testScenario(scenario.id))}
                trailing={
                  <>
                    {scenario.personaId && (
                      <span className="text-xs text-muted-foreground">
                        {personas.find(p => p.id === scenario.personaId)?.title ??
                          `Persona #${scenario.personaId}`}
                      </span>
                    )}
                    <StatusBadge status={scenario.sizeClass} />
                  </>
                }
                actions={
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Delete
                  </button>
                }
              />
            ))}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

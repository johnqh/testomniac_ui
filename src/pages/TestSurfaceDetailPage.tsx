import { useTestSurfaceTestInteractions } from '@sudobility/testomniac_client';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { ContentLayout, CardGrid } from '@sudobility/components';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { InteractionCell } from '../components/cells';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function TestSurfaceDetailPage() {
  const { surfaceId } = useRouteParams<{
    surfaceId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const r = useEnvRoutes();

  const interactionsQuery = useTestSurfaceTestInteractions(
    networkClient,
    baseUrl,
    token ?? '',
    Number(surfaceId),
    { enabled: !!surfaceId && !!token }
  );
  const testInteractions = interactionsQuery.data?.data ?? [];
  const casesLoading = interactionsQuery.isLoading;
  const casesError = interactionsQuery.error?.message ?? null;

  const isLoading = casesLoading;
  const error = casesError;

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <BackLink label="Test Surfaces" onClick={() => navigate(r.testSurfaces())} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Test Surface #{surfaceId}
            </h1>
            <AddToBundleButton itemType="surface" itemId={Number(surfaceId)} />
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isLoading && <LoadingState message="Loading..." />}

        {!isLoading && testInteractions.length === 0 && (
          <EmptyState
            title="Empty surface"
            description="This test surface has no test interactions."
          />
        )}

        {/* Test elements */}
        {testInteractions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Test Interactions
            </h2>
            <CardGrid>
              {testInteractions.map((tc: TestInteractionResponse) => (
                <InteractionCell
                  key={tc.id}
                  interaction={tc}
                  variant="tile"
                  onClick={() => navigate(r.testInteraction(tc.id))}
                />
              ))}
            </CardGrid>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

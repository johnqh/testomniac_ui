import { useTestSurfaceTestInteractions } from '@sudobility/testomniac_client';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

function FileIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0 text-blue-500 dark:text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

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
    <div className="p-4 sm:p-6">
      <BackLink label="Test Surfaces" onClick={() => navigate(r.testSurfaces())} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Test Surface #{surfaceId}
        </h1>
        <AddToBundleButton itemType="surface" itemId={Number(surfaceId)} />
      </div>

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
          <div className="space-y-2">
            {testInteractions.map((tc: TestInteractionResponse) => (
              <button
                key={tc.id}
                onClick={() => navigate(r.testInteraction(tc.id))}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tc.title}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={tc.testType} />
                  <StatusBadge status={tc.sizeClass} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

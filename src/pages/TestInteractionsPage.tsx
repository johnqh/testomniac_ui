import { useState } from 'react';
import { useEnvironmentTestInteractionsPage } from '@sudobility/testomniac_client';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { ContentLayout, CardGrid } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { SelectField } from '../components/forms/SelectField';
import { InteractionCell } from '../components/cells';
import { ErrorState, LoadingState, EmptyState } from '../components/states';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const PAGE_SIZE = 50;

// Known test interaction types (server-side filter; the paged endpoint no longer
// ships the full set the page could derive these from).
const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'render', label: 'render' },
  { value: 'interaction', label: 'interaction' },
  { value: 'form', label: 'form' },
  { value: 'form_negative', label: 'form_negative' },
  { value: 'navigation', label: 'navigation' },
  { value: 'password', label: 'password' },
  { value: 'e2e', label: 'e2e' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: '0', label: 'Crash (0)' },
  { value: '1', label: 'Critical (1)' },
  { value: '2', label: 'Major (2)' },
  { value: '3', label: 'Minor (3)' },
  { value: '4', label: 'Suggestion (4)' },
];

const DEVICE_OPTIONS = ['All', 'Desktop', 'Mobile'] as const;

export function TestInteractionsPage() {
  const { envId } = useRouteParams<{ entitySlug: string; envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  const [pageIndex, setPageIndex] = useState(0);

  // Any filter change resets to the first page.
  const onType = (value: string) => {
    setTypeFilter(value);
    setPageIndex(0);
  };
  const onPriority = (value: string) => {
    setPriorityFilter(value);
    setPageIndex(0);
  };
  const onDevice = (value: string) => {
    setDeviceFilter(value);
    setPageIndex(0);
  };

  const interactionsQuery = useEnvironmentTestInteractionsPage(
    networkClient,
    baseUrl,
    token ?? '',
    Number(envId),
    {
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
      testType: typeFilter || undefined,
      priority: priorityFilter !== '' ? Number(priorityFilter) : undefined,
      sizeClass: deviceFilter !== 'All' ? deviceFilter.toLowerCase() : undefined,
    },
    { enabled: !!envId && !!token }
  );
  const testInteractions: TestInteractionResponse[] = interactionsQuery.data?.data?.items ?? [];
  const total = interactionsQuery.data?.data?.total ?? 0;
  const isLoading = interactionsQuery.isLoading;
  const error = interactionsQuery.error?.message ?? null;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startRow = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const endRow = Math.min(pageIndex * PAGE_SIZE + testInteractions.length, total);

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Test Interactions" description="" noIndex />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Interactions</h1>

          <div className="flex flex-wrap gap-3 mt-4">
            <SelectField value={typeFilter} onChange={onType} options={TYPE_OPTIONS} />

            <SelectField value={priorityFilter} onChange={onPriority} options={PRIORITY_OPTIONS} />

            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {DEVICE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onDevice(option)}
                  className={`px-3 py-1.5 text-sm ${
                    deviceFilter === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${option !== 'All' ? 'border-l border-gray-300 dark:border-gray-600' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isLoading && <LoadingState message="Loading test interactions..." />}

        {!isLoading && testInteractions.length === 0 && (
          <EmptyState
            title="No test interactions"
            description="Try adjusting the filters to see more results."
          />
        )}

        {!isLoading && testInteractions.length > 0 && (
          <>
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Showing {startRow}&ndash;{endRow} of {total}
            </div>

            <CardGrid>
              {testInteractions.map(interaction => (
                <InteractionCell
                  key={interaction.id}
                  interaction={interaction}
                  variant="tile"
                  onClick={() => navigate(r.testInteraction(interaction.id))}
                />
              ))}
            </CardGrid>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-200 pt-3 dark:border-gray-700">
                <button
                  onClick={() => setPageIndex(0)}
                  disabled={pageIndex === 0}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="First page"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Previous page"
                >
                  &lsaquo;
                </button>
                <span className="px-2 text-xs text-gray-600 dark:text-gray-400">
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  onClick={() => setPageIndex(p => Math.min(pageCount - 1, p + 1))}
                  disabled={pageIndex >= pageCount - 1}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Next page"
                >
                  &rsaquo;
                </button>
                <button
                  onClick={() => setPageIndex(pageCount - 1)}
                  disabled={pageIndex >= pageCount - 1}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Last page"
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}

import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useEnvironmentTestInteractionsPage } from '@sudobility/testomniac_client';
import { PRIORITY_NAMES } from '@sudobility/testomniac_lib';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { SelectField } from '../components/forms/SelectField';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { ErrorState } from '../components/states';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

interface TestInteractionRow {
  id: number;
  title: string;
  testType: string;
  sizeClass: string;
  priority: number;
  surfaceTags: string[];
  startingPath: string | null;
}

const columnHelper = createColumnHelper<TestInteractionRow>();

const columns = [
  columnHelper.accessor('title', {
    header: 'Name',
    cell: info => (
      <div className="min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {info.row.original.startingPath || '/'}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('testType', {
    header: 'Type',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    cell: info => {
      const p = info.getValue();
      const label = PRIORITY_NAMES[p] ?? `P${p}`;
      const color =
        p <= 1
          ? 'text-red-600 font-medium'
          : p === 2
            ? 'text-orange-600 font-medium'
            : 'text-gray-600 dark:text-gray-400';
      return <span className={color}>{label}</span>;
    },
  }),
  columnHelper.accessor('surfaceTags', {
    header: 'Tags',
    cell: info => (
      <div className="flex gap-1 flex-wrap">
        {(info.getValue() ?? []).map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('sizeClass', {
    header: 'Device',
  }),
];

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
  const testInteractions = interactionsQuery.data?.data?.items ?? [];
  const total = interactionsQuery.data?.data?.total ?? 0;
  const isLoading = interactionsQuery.isLoading;
  const error = interactionsQuery.error?.message ?? null;

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title="Test Interactions" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Test Interactions
      </h1>

      <div className="flex flex-wrap gap-3 mb-4">
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

      <DataTable
        data={testInteractions as unknown as TestInteractionRow[]}
        columns={columns as never}
        isLoading={isLoading}
        onRowClick={(row: TestInteractionRow) => navigate(r.testInteraction(row.id))}
        manualPagination
        pageSize={PAGE_SIZE}
        pageIndex={pageIndex}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        totalRows={total}
        onPageChange={setPageIndex}
      />
    </div>
  );
}

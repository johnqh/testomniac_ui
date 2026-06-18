import { useState, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useEnvironmentTestInteractions } from '@sudobility/testomniac_client';
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

  const { testInteractions, isLoading, error } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const uniqueTypes = useMemo(() => {
    if (!testInteractions) return [];
    const types = new Set(testInteractions.map((t: TestInteractionRow) => t.testType));
    return Array.from(types).sort();
  }, [testInteractions]);

  const filteredData = useMemo(() => {
    if (!testInteractions) return [];
    return testInteractions.filter((row: TestInteractionRow) => {
      if (typeFilter && row.testType !== typeFilter) return false;
      if (priorityFilter !== '' && row.priority !== Number(priorityFilter)) return false;
      if (deviceFilter !== 'All' && row.sizeClass !== deviceFilter.toLowerCase()) return false;
      return true;
    });
  }, [testInteractions, typeFilter, priorityFilter, deviceFilter]);

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
        <SelectField
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: '', label: 'All Types' },
            ...uniqueTypes.map(type => ({ value: type, label: type })),
          ]}
        />

        <SelectField
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={PRIORITY_OPTIONS}
        />

        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {DEVICE_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setDeviceFilter(option)}
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
        data={filteredData}
        columns={columns as never}
        isLoading={isLoading}
        onRowClick={(row: TestInteractionRow) => navigate(r.testInteraction(row.id))}
      />
    </div>
  );
}

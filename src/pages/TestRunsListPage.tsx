import type { TestRunResponse } from '@sudobility/testomniac_types';
import { formatDuration, formatDate } from '@sudobility/testomniac_lib';
import { SEOHead } from '../context/config';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { useEnvRoutes } from '../context/routing';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

export function TestRunsListPage() {
  const { navigate } = useLocalizedNavigate();
  const { environmentRuns: testRuns, isLoading, error } = useDashboardEnvironmentContext();

  const r = useEnvRoutes();

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="p-6">
      <SEOHead title="Test Runs" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Runs</h1>

      {isLoading && <LoadingState message="Loading test runs..." />}

      {!isLoading && testRuns.length === 0 && (
        <EmptyState
          title="No test runs yet"
          description="Test runs will appear here after tests are executed."
        />
      )}

      {!isLoading && testRuns.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Device
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {testRuns.map((run: TestRunResponse) => (
                <tr
                  key={run.id}
                  onClick={() => navigate(r.run(run.id))}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                    #{run.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.sizeClass} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDuration(run.totalDurationMs)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(run.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

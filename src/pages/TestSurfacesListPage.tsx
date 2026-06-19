import { useState, useMemo } from 'react';
import { useEnvironmentTestSurfaces } from '@sudobility/testomniac_client';
import { getSurfacePriorityBand } from '@sudobility/testomniac_lib';
import type { TestSurfaceResponse } from '@sudobility/testomniac_types';
import { ContentLayout, CardGrid } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { SurfaceCell } from '../components/cells';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { SelectField } from '../components/forms/SelectField';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

type DeviceFilter = 'all' | 'desktop' | 'mobile';
type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export function TestSurfacesListPage() {
  const { envId } = useRouteParams<{ envId?: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();

  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const surfacesQuery = useEnvironmentTestSurfaces(
    networkClient,
    baseUrl,
    token ?? '',
    Number(envId),
    { enabled: !!envId && !!token }
  );
  const testSurfaces = useMemo(() => surfacesQuery.data?.data ?? [], [surfacesQuery.data]);
  const isLoading = surfacesQuery.isLoading;
  const error = surfacesQuery.error?.message ?? null;

  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const surface of testSurfaces) {
      if (surface.scaffoldType) types.add(surface.scaffoldType);
      if (surface.patternType) types.add(surface.patternType);
    }
    return Array.from(types).sort();
  }, [testSurfaces]);

  const filteredSurfaces = useMemo(() => {
    return testSurfaces.filter((surface: TestSurfaceResponse) => {
      // Device filter
      if (deviceFilter !== 'all' && surface.sizeClass !== deviceFilter) {
        return false;
      }

      // Priority filter (band thresholds defined in testomniac_lib)
      if (priorityFilter !== 'all' && getSurfacePriorityBand(surface.priority) !== priorityFilter) {
        return false;
      }

      // Type filter
      if (
        typeFilter !== 'all' &&
        surface.scaffoldType !== typeFilter &&
        surface.patternType !== typeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [testSurfaces, deviceFilter, priorityFilter, typeFilter]);

  const r = useEnvRoutes();

  const deviceButtonClass = (value: DeviceFilter) =>
    `px-3 py-1.5 text-sm font-medium transition-colors ${
      deviceFilter === value
        ? 'bg-blue-600 text-white'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`;

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Test Surfaces" description="" noIndex />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Surfaces</h1>

          {/* Filter controls */}
          {!isLoading && testSurfaces.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {/* Device filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Device:</span>
                <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setDeviceFilter('all')}
                    className={deviceButtonClass('all')}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDeviceFilter('desktop')}
                    className={deviceButtonClass('desktop')}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setDeviceFilter('mobile')}
                    className={deviceButtonClass('mobile')}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* Priority filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Priority:</span>
                <SelectField
                  value={priorityFilter}
                  onChange={v => setPriorityFilter(v as PriorityFilter)}
                  options={[
                    { value: 'all', label: 'All priorities' },
                    { value: 'critical', label: 'Critical (8+)' },
                    { value: 'high', label: 'High (5-7)' },
                    { value: 'medium', label: 'Medium (3-4)' },
                    { value: 'low', label: 'Low (<3)' },
                  ]}
                />
              </div>

              {/* Type filter */}
              {typeOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                  <SelectField
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                      { value: 'all', label: 'All types' },
                      ...typeOptions.map(type => ({ value: type, label: type })),
                    ]}
                  />
                </div>
              )}

              {/* Result count */}
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {filteredSurfaces.length} of {testSurfaces.length}
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isLoading && <LoadingState message="Loading test surfaces..." />}

        {!isLoading && filteredSurfaces.length === 0 && testSurfaces.length > 0 && (
          <EmptyState
            title="No matching test surfaces"
            description="Try adjusting the filters to see more results."
          />
        )}

        {!isLoading && testSurfaces.length === 0 && (
          <EmptyState
            title="No test surfaces yet"
            description="Test surfaces will appear here after a scan generates them."
          />
        )}

        {!isLoading && filteredSurfaces.length > 0 && (
          <CardGrid>
            {filteredSurfaces.map((surface: TestSurfaceResponse) => (
              <SurfaceCell
                key={surface.id}
                surface={surface}
                variant="tile"
                onClick={() => navigate(r.testSurface(surface.id))}
              />
            ))}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

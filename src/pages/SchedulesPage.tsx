import { useMemo, useState } from 'react';
import {
  useCreateTestSchedule,
  useRunnerSchedules,
  useRunnerTestSurfaceBundles,
  useEnvironmentTestInteractions,
  useEnvironmentTestSurfaces,
} from '@sudobility/testomniac_client';
import type { CreateTestScheduleRequest } from '@sudobility/testomniac_types';
import {
  RECURRENCE_OPTIONS,
  DAY_OPTIONS,
  describeScheduleTarget,
  describeRecurrence,
} from '@sudobility/testomniac_lib';
import { ActionButton, Button, Card, Label } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { SelectField } from '../components/forms/SelectField';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { EmptyState } from '../components/states';

type TargetKind = 'bundle' | 'surface' | 'element';

export function SchedulesPage() {
  const { envId } = useRouteParams<{ envId: string }>();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    primaryRunner,
    envId: numericEnvId,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetKind, setTargetKind] = useState<TargetKind>('bundle');
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [selectedSurfaceId, setSelectedSurfaceId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');
  const [recurrenceType, setRecurrenceType] =
    useState<CreateTestScheduleRequest['recurrenceType']>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [sizeClass, setSizeClass] = useState<CreateTestScheduleRequest['sizeClass']>('desktop');
  const [discovery, setDiscovery] = useState(true);

  const {
    schedules,
    isLoading: schedulesLoading,
    error: schedulesError,
    refetch,
  } = useRunnerSchedules({
    networkClient,
    baseUrl,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  // Bundles / surfaces / interactions are only needed to populate the
  // "New Schedule" form selects, so they are fetched lazily once the form is
  // opened. This keeps the initial schedules list fast to load.
  const { bundles, error: bundlesError } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner && showForm,
  });

  const { testSurfaces, error: surfacesError } = useEnvironmentTestSurfaces({
    networkClient,
    baseUrl,
    envId: numericEnvId,
    token,
    enabled: !!envId && !!token && showForm,
  });

  const { testInteractions, error: elementsError } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: numericEnvId,
    token,
    enabled: !!envId && !!token && showForm,
  });

  const {
    createTestSchedule,
    isCreating,
    error: createError,
    reset,
  } = useCreateTestSchedule({
    networkClient,
    baseUrl,
    runnerId: primaryRunner?.id ?? 0,
    token,
  });

  const pageError =
    contextError ||
    schedulesError ||
    bundlesError ||
    surfacesError ||
    elementsError ||
    createError ||
    null;
  const isLoading = contextLoading || schedulesLoading;

  const selectedTargetId = useMemo(() => {
    if (targetKind === 'bundle') return selectedBundleId;
    if (targetKind === 'surface') return selectedSurfaceId;
    return selectedElementId;
  }, [selectedBundleId, selectedElementId, selectedSurfaceId, targetKind]);

  const canCreate = useMemo(() => {
    if (!title.trim()) return false;
    if (!selectedTargetId) return false;
    if (!timeOfDay.trim() || !timezone.trim()) return false;
    if (recurrenceType === 'weekly' && !dayOfWeek) return false;
    return true;
  }, [dayOfWeek, recurrenceType, selectedTargetId, timeOfDay, timezone, title]);

  const resetForm = () => {
    setTitle('');
    setTargetKind('bundle');
    setSelectedBundleId('');
    setSelectedSurfaceId('');
    setSelectedElementId('');
    setRecurrenceType('daily');
    setTimeOfDay('09:00');
    setDayOfWeek('1');
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSizeClass('desktop');
    setDiscovery(true);
    reset();
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!canCreate || !primaryRunner) return;

    const payload: CreateTestScheduleRequest = {
      runnerId: primaryRunner.id,
      title: title.trim(),
      recurrenceType,
      timeOfDay,
      timezone: timezone.trim(),
      sizeClass,
      discovery,
      ...(targetKind === 'bundle' ? { testSurfaceBundleId: Number(selectedBundleId) } : {}),
      ...(targetKind === 'surface' ? { testSurfaceId: Number(selectedSurfaceId) } : {}),
      ...(targetKind === 'element' ? { testInteractionId: Number(selectedElementId) } : {}),
      ...(recurrenceType === 'weekly' ? { dayOfWeek: Number(dayOfWeek) } : {}),
    };

    await createTestSchedule(payload);
    await refetch();
    closeForm();
  };

  if (pageError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {pageError}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title="Schedules" description="" noIndex />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedules</h1>
        <Button variant="primary" onClick={() => (showForm ? closeForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : '+ New Schedule'}
        </Button>
      </div>

      {showForm && (
        <Card variant="bordered" padding="lg" className="mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1 block">Title</Label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Production navigation smoke"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <Label className="mb-1 block">Target type</Label>
              <SelectField
                value={targetKind}
                onChange={v => setTargetKind(v as TargetKind)}
                options={[
                  { value: 'bundle', label: 'Bundle' },
                  { value: 'surface', label: 'Surface' },
                  { value: 'element', label: 'Element' },
                ]}
              />
            </div>
          </div>

          {targetKind === 'bundle' && (
            <div>
              <Label className="mb-1 block">Bundle</Label>
              <SelectField
                value={selectedBundleId}
                onChange={setSelectedBundleId}
                options={[
                  { value: '', label: 'Select a bundle' },
                  ...bundles.map(bundle => ({
                    value: String(bundle.id),
                    label: `#${bundle.id} ${bundle.title}`,
                  })),
                ]}
              />
            </div>
          )}

          {targetKind === 'surface' && (
            <div>
              <Label className="mb-1 block">Surface</Label>
              <SelectField
                value={selectedSurfaceId}
                onChange={setSelectedSurfaceId}
                options={[
                  { value: '', label: 'Select a surface' },
                  ...testSurfaces.map(surface => ({
                    value: String(surface.id),
                    label: `#${surface.id} ${surface.title}`,
                  })),
                ]}
              />
            </div>
          )}

          {targetKind === 'element' && (
            <div>
              <Label className="mb-1 block">Element</Label>
              <SelectField
                value={selectedElementId}
                onChange={setSelectedElementId}
                options={[
                  { value: '', label: 'Select a test interaction' },
                  ...testInteractions.map(element => ({
                    value: String(element.id),
                    label: `#${element.id} ${element.title}`,
                  })),
                ]}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1 block">Recurrence</Label>
              <SelectField
                value={recurrenceType}
                onChange={v => setRecurrenceType(v as CreateTestScheduleRequest['recurrenceType'])}
                options={RECURRENCE_OPTIONS.map(option => ({
                  value: String(option.value),
                  label: option.label,
                }))}
              />
            </div>

            <div>
              <Label className="mb-1 block">Time</Label>
              <input
                type="time"
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>

            {recurrenceType === 'weekly' && (
              <div>
                <Label className="mb-1 block">Day</Label>
                <SelectField
                  value={dayOfWeek}
                  onChange={setDayOfWeek}
                  options={DAY_OPTIONS.map(option => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />
              </div>
            )}

            <div>
              <Label className="mb-1 block">Device</Label>
              <SelectField
                value={sizeClass}
                onChange={v => setSizeClass(v as CreateTestScheduleRequest['sizeClass'])}
                options={[
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'mobile', label: 'Mobile' },
                ]}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Timezone</Label>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={discovery}
              onChange={e => setDiscovery(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Run in discovery mode
          </label>

          <div className="flex items-center gap-3">
            <ActionButton
              variant="primary"
              isLoading={isCreating}
              loadingText="Creating..."
              onClick={handleCreate}
              disabled={!canCreate}
            >
              Create Schedule
            </ActionButton>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              This only creates the schedule object. Worker launch is not wired here.
            </span>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading schedules...
        </div>
      )}

      {!isLoading && schedules.length === 0 && !showForm && (
        <EmptyState
          title="No schedules yet"
          description="Create a schedule to store a recurring run definition for a bundle, surface, or test element."
        />
      )}

      {!isLoading && schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <Card key={schedule.id} variant="bordered" padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {schedule.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {describeScheduleTarget(schedule)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {describeRecurrence(schedule)} · {schedule.timezone}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
                  <StatusBadge status={schedule.enabled ? 'enabled' : 'disabled'} />
                  <StatusBadge status={schedule.sizeClass} />
                  {schedule.discovery && <StatusBadge status="discovery" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

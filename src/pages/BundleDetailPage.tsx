import { useState, useCallback, useMemo } from 'react';
import {
  useRunnerTestSurfaceBundles,
  useBundleSurfaces,
  useBundleInteractions,
  useBundleScenarios,
  useUpdateTestSurfaceBundle,
  useDeleteTestSurfaceBundle,
  useRemoveFromBundle,
} from '@sudobility/testomniac_client';
import { ActionButton, Button, Tabs, TabsList, TabsTrigger } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { SurfaceCell, InteractionCell, ScenarioCell } from '../components/cells';
import BackLink from '../components/navigation/BackLink';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

type ContentTab = 'surfaces' | 'interactions' | 'scenarios';

export function BundleDetailPage() {
  const { bundleId } = useRouteParams<{
    bundleId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const numericBundleId = Number(bundleId);
  const runnerId = primaryRunner?.id ?? 0;
  const r = useEnvRoutes();

  const bundlesQuery = useRunnerTestSurfaceBundles(networkClient, baseUrl, token ?? '', runnerId, {
    enabled: !!token && !!primaryRunner,
  });
  const bundles = useMemo(() => bundlesQuery.data?.data ?? [], [bundlesQuery.data]);
  const bundlesLoading = bundlesQuery.isLoading;
  const refetch = bundlesQuery.refetch;

  const bundle = bundles.find(b => b.id === numericBundleId);
  const isDiscovery = bundle?.title === 'Discovery';

  const [tab, setTab] = useState<ContentTab>('surfaces');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateBundleMutation = useUpdateTestSurfaceBundle(networkClient, baseUrl);
  const isUpdating = updateBundleMutation.isPending;

  const deleteBundleMutation = useDeleteTestSurfaceBundle(networkClient, baseUrl);

  const surfacesQuery = useBundleSurfaces(
    networkClient,
    baseUrl,
    token ?? '',
    runnerId,
    numericBundleId,
    { enabled: !!token && !!primaryRunner && tab === 'surfaces' }
  );
  const surfaces = surfacesQuery.data?.data ?? [];
  const surfacesLoading = surfacesQuery.isLoading;
  const refetchSurfaces = surfacesQuery.refetch;

  const interactionsQuery = useBundleInteractions(
    networkClient,
    baseUrl,
    token ?? '',
    runnerId,
    numericBundleId,
    { enabled: !!token && !!primaryRunner && tab === 'interactions' }
  );
  const interactions = interactionsQuery.data?.data ?? [];
  const interactionsLoading = interactionsQuery.isLoading;
  const refetchInteractions = interactionsQuery.refetch;

  const scenariosQuery = useBundleScenarios(
    networkClient,
    baseUrl,
    token ?? '',
    runnerId,
    numericBundleId,
    { enabled: !!token && !!primaryRunner && tab === 'scenarios' }
  );
  const scenarios = scenariosQuery.data?.data ?? [];
  const scenariosLoading = scenariosQuery.isLoading;
  const refetchScenarios = scenariosQuery.refetch;

  const removeFromBundleMutation = useRemoveFromBundle(networkClient, baseUrl);

  const handleRemove = useCallback(
    async (type: ContentTab, itemId: number) => {
      setError(null);
      try {
        if (type === 'surfaces') {
          await removeFromBundleMutation.mutateAsync({
            token: token ?? '',
            runnerId,
            bundleId: numericBundleId,
            itemType: 'surface',
            itemId,
          });
          await refetchSurfaces();
        } else if (type === 'interactions') {
          await removeFromBundleMutation.mutateAsync({
            token: token ?? '',
            runnerId,
            bundleId: numericBundleId,
            itemType: 'interaction',
            itemId,
          });
          await refetchInteractions();
        } else {
          await removeFromBundleMutation.mutateAsync({
            token: token ?? '',
            runnerId,
            bundleId: numericBundleId,
            itemType: 'scenario',
            itemId,
          });
          await refetchScenarios();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove item');
      }
    },
    [
      refetchInteractions,
      refetchScenarios,
      refetchSurfaces,
      removeFromBundleMutation,
      token,
      runnerId,
      numericBundleId,
    ]
  );

  const startEdit = () => {
    if (!bundle) return;
    setEditTitle(bundle.title);
    setEditDescription(bundle.description ?? '');
    setEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setError(null);
    try {
      await updateBundleMutation.mutateAsync({
        token: token ?? '',
        runnerId,
        bundleId: numericBundleId,
        data: { title: editTitle.trim(), description: editDescription.trim() || undefined },
      });
      setEditing(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bundle');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteBundleMutation.mutateAsync({
        token: token ?? '',
        runnerId,
        bundleId: numericBundleId,
      });
      navigate(r.bundles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bundle');
    }
  };

  if (contextLoading || bundlesLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {contextError}</div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Bundle not found</div>
      </div>
    );
  }

  const renderRemoveAction = (type: ContentTab, id: number) =>
    isDiscovery ? undefined : (
      <Button
        variant="link"
        size="sm"
        type="button"
        className="text-red-600 hover:text-red-700"
        onClick={() => handleRemove(type, id)}
      >
        Remove
      </Button>
    );

  const tabs: { key: ContentTab; label: string; count: number }[] = [
    { key: 'surfaces', label: 'Surfaces', count: surfaces.length },
    { key: 'interactions', label: 'Interactions', count: interactions.length },
    { key: 'scenarios', label: 'Scenarios', count: scenarios.length },
  ];

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title={bundle.title} description="" noIndex />
      <BackLink label="Bundles" onClick={() => navigate(r.bundles())} />

      {/* Header */}
      <div className="mb-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-lg font-bold"
            />
            <input
              type="text"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <ActionButton
                variant="primary"
                isLoading={isUpdating}
                loadingText="Saving..."
                onClick={handleSave}
                disabled={!editTitle.trim()}
              >
                Save
              </ActionButton>
              <Button variant="outline" type="button" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bundle.title}
              </h1>
              {bundle.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bundle.description}
                </p>
              )}
            </div>
            {!isDiscovery && (
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={startEdit}>
                  Edit
                </Button>
                <Button variant="destructive-outline" type="button" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
        {!editing && error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as ContentTab)} className="mb-4">
        <TabsList>
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({t.count})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="space-y-2">
        {tab === 'surfaces' && (
          <>
            {surfacesLoading && <LoadingState />}
            {!surfacesLoading && surfaces.length === 0 && <EmptyState label="surfaces" />}
            {surfaces.map(s => (
              <SurfaceCell
                key={s.id}
                surface={s}
                onClick={() => navigate(r.testSurface(s.id))}
                actions={renderRemoveAction('surfaces', s.id)}
              />
            ))}
          </>
        )}

        {tab === 'interactions' && (
          <>
            {interactionsLoading && <LoadingState />}
            {!interactionsLoading && interactions.length === 0 && (
              <EmptyState label="interactions" />
            )}
            {interactions.map(i => (
              <InteractionCell
                key={i.id}
                interaction={i}
                onClick={() => navigate(r.testInteraction(i.id))}
                actions={renderRemoveAction('interactions', i.id)}
              />
            ))}
          </>
        )}

        {tab === 'scenarios' && (
          <>
            {scenariosLoading && <LoadingState />}
            {!scenariosLoading && scenarios.length === 0 && <EmptyState label="scenarios" />}
            {scenarios.map(s => (
              <ScenarioCell
                key={s.id}
                scenario={s}
                onClick={() => navigate(r.testScenario(s.id))}
                actions={renderRemoveAction('scenarios', s.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading...</div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
      No {label} in this bundle
    </div>
  );
}

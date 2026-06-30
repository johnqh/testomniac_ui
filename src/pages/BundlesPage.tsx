import { useState } from 'react';
import {
  useRunnerTestSurfaceBundles,
  useCreateTestSurfaceBundle,
} from '@sudobility/testomniac_client';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import {
  Button,
  ActionButton,
  Card,
  Input,
  Label,
  ContentLayout,
  CardGrid,
} from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { AddButton } from '../components/ui/AddButton';
import { BundleCell } from '../components/cells';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { EmptyState } from '../components/states';

export function BundlesPage() {
  const { navigate } = useLocalizedNavigate();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const runnerId = primaryRunner?.id ?? 0;
  const r = useEnvRoutes();

  const bundlesQuery = useRunnerTestSurfaceBundles(networkClient, baseUrl, token ?? '', runnerId, {
    enabled: !!token && !!primaryRunner,
  });
  const bundles = bundlesQuery.data?.data ?? [];
  const isLoading = bundlesQuery.isLoading;
  const error = bundlesQuery.error?.message ?? null;
  const refetch = bundlesQuery.refetch;

  const createBundleMutation = useCreateTestSurfaceBundle(networkClient, baseUrl);
  const isCreating = createBundleMutation.isPending;

  const handleCreate = async () => {
    if (!title.trim()) return;
    setFormError(null);
    try {
      await createBundleMutation.mutateAsync({
        token: token ?? '',
        runnerId,
        data: {
          runnerId,
          title: title.trim(),
          description: description.trim() || undefined,
        },
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create bundle');
    }
  };

  if (contextLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive py-8">Error: {contextError || error}</div>
      </div>
    );
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Bundles" description="" noIndex />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-foreground">Test Bundles</h1>
            {primaryRunner && (
              <AddButton
                label="New Bundle"
                active={showForm}
                onClick={() => setShowForm(!showForm)}
              />
            )}
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {showForm && (
          <Card variant="bordered" className="mb-6 space-y-3">
            <div>
              <Label className="mb-1 block">Title</Label>
              <Input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Checkout Flow Tests"
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-1 block">Description</Label>
              <Input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <ActionButton
                type="button"
                variant="primary"
                onClick={handleCreate}
                disabled={!title.trim()}
                isLoading={isCreating}
                loadingText="Creating..."
              >
                Create Bundle
              </ActionButton>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {bundles.length === 0 && !showForm ? (
          <EmptyState
            title="No bundles yet"
            description="Bundles are created during discovery scans or can be composed manually."
          />
        ) : (
          <CardGrid>
            {bundles.map((bundle: TestSurfaceBundleResponse) => (
              <BundleCell
                key={bundle.id}
                bundle={bundle}
                variant="tile"
                onClick={() => navigate(r.bundle(bundle.id))}
              />
            ))}
          </CardGrid>
        )}
      </div>
    </ContentLayout>
  );
}

import { useState } from 'react';
import {
  useRunnerTestSurfaceBundles,
  useCreateTestSurfaceBundle,
} from '@sudobility/testomniac_client';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import { Button, ActionButton, Card, Input, Label } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { BundleCell } from '../components/cells';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useEnvBasePath } from '../hooks/useEnvBasePath';
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
  const basePath = useEnvBasePath();

  const { bundles, isLoading, error, refetch } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl,
    runnerId,
    token,
    enabled: !!token && !!primaryRunner,
  });

  const { createBundle, isCreating } = useCreateTestSurfaceBundle({
    networkClient,
    baseUrl,
    runnerId,
    token,
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    setFormError(null);
    try {
      await createBundle({
        runnerId,
        title: title.trim(),
        description: description.trim() || undefined,
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
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Bundles" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Bundles</h1>
        {primaryRunner && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Bundle'}
          </Button>
        )}
      </div>

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
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
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
        <div className="space-y-2">
          {bundles.map((bundle: TestSurfaceBundleResponse) => (
            <BundleCell
              key={bundle.id}
              bundle={bundle}
              onClick={() => navigate(`${basePath}/bundles/${bundle.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  useEffectiveEnvironmentScanSettings,
  useEnvironmentScanSettings,
  useProductScanSettings,
  useRunnerTestSurfaceBundles,
  useCreateTestSurfaceBundle,
  useUpdateEnvironmentScanSettings,
  useUpdateProductScanSettings,
} from '@sudobility/testomniac_client';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import {
  Button,
  ActionButton,
  Alert,
  Card,
  Checkbox,
  Input,
  Label,
  ContentLayout,
  CardGrid,
} from '@sudobility/components';
import { EXPERTISE_OPTIONS } from '@sudobility/testomniac_lib';
import { SEOHead, useTestomniacApi } from '../context/config';
import { AddButton } from '../components/ui/AddButton';
import { BundleCell } from '../components/cells';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { EmptyState } from '../components/states';

function ScanSettingsPanel({
  title,
  description,
  selectedExpertises,
  onToggle,
  onSave,
  isSaving,
  overrideCount,
}: {
  title: string;
  description: string;
  selectedExpertises: string[];
  onToggle: (slug: string, checked: boolean) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  overrideCount: number;
}) {
  return (
    <Card variant="bordered" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EXPERTISE_OPTIONS.map(option => (
          <Checkbox
            key={option.slug}
            checked={selectedExpertises.includes(option.slug)}
            onChange={checked => onToggle(option.slug, checked)}
            label={option.label}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>{overrideCount} rule override(s)</span>
        <ActionButton
          variant="primary"
          onClick={() => void onSave()}
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save
        </ActionButton>
      </div>
    </Card>
  );
}

export function BundlesPage() {
  const { navigate } = useLocalizedNavigate();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    primaryRunner,
    productId,
    envId,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [productExpertisesOverride, setProductExpertisesOverride] = useState<string[] | null>(null);
  const [environmentExpertisesOverride, setEnvironmentExpertisesOverride] = useState<
    string[] | null
  >(null);

  const runnerId = primaryRunner?.id ?? 0;
  const environmentId = envId;
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
  const productScanSettingsQuery = useProductScanSettings(
    networkClient,
    baseUrl,
    token ?? '',
    productId ?? 0,
    {
      enabled: !!token && !!productId,
    }
  );
  const environmentScanSettingsQuery = useEnvironmentScanSettings(
    networkClient,
    baseUrl,
    token ?? '',
    productId ?? 0,
    environmentId,
    {
      enabled: !!token && !!productId && !!environmentId,
    }
  );
  const effectiveScanSettingsQuery = useEffectiveEnvironmentScanSettings(
    networkClient,
    baseUrl,
    token ?? '',
    productId ?? 0,
    environmentId,
    {
      enabled: !!token && !!productId && !!environmentId,
    }
  );
  const updateProductScanSettingsMutation = useUpdateProductScanSettings(networkClient, baseUrl);
  const updateEnvironmentScanSettingsMutation = useUpdateEnvironmentScanSettings(
    networkClient,
    baseUrl
  );

  const productExpertises =
    productExpertisesOverride ?? productScanSettingsQuery.data?.data?.expertiseSlugs ?? [];
  const environmentExpertises =
    environmentExpertisesOverride ?? environmentScanSettingsQuery.data?.data?.expertiseSlugs ?? [];

  function toggleSelection(
    setter: Dispatch<SetStateAction<string[] | null>>,
    slug: string,
    checked: boolean
  ) {
    setter(prev => {
      const source = prev ?? [];
      return checked ? [...source, slug] : source.filter(item => item !== slug);
    });
  }

  async function saveProductSettings() {
    if (!productId) return;
    setSettingsError(null);
    try {
      await updateProductScanSettingsMutation.mutateAsync({
        token: token ?? '',
        productId,
        data: {
          expertiseSlugs: productExpertises,
          ruleOverrides: productScanSettingsQuery.data?.data?.ruleOverrides ?? null,
        },
      });
      setProductExpertisesOverride(null);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save product scan settings');
    }
  }

  async function saveEnvironmentSettings() {
    if (!productId || !environmentId) return;
    setSettingsError(null);
    try {
      await updateEnvironmentScanSettingsMutation.mutateAsync({
        token: token ?? '',
        productId,
        environmentId,
        data: {
          expertiseSlugs: environmentExpertises,
          ruleOverrides: environmentScanSettingsQuery.data?.data?.ruleOverrides ?? null,
        },
      });
      setEnvironmentExpertisesOverride(null);
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : 'Failed to save environment scan settings'
      );
    }
  }

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
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Bundles" description="" noIndex />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Bundles</h1>
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
        {settingsError && <Alert variant="error" className="mb-6" description={settingsError} />}

        {productId && environmentId && (
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <ScanSettingsPanel
              title="Product Scan Defaults"
              description="These defaults apply to every environment unless an environment override replaces them."
              selectedExpertises={productExpertises}
              onToggle={(slug, checked) =>
                toggleSelection(setProductExpertisesOverride, slug, checked)
              }
              onSave={saveProductSettings}
              isSaving={updateProductScanSettingsMutation.isPending}
              overrideCount={productScanSettingsQuery.data?.data?.ruleOverrides?.length ?? 0}
            />
            <ScanSettingsPanel
              title="Environment Overrides"
              description="These overrides apply before a scan starts in this environment."
              selectedExpertises={environmentExpertises}
              onToggle={(slug, checked) =>
                toggleSelection(setEnvironmentExpertisesOverride, slug, checked)
              }
              onSave={saveEnvironmentSettings}
              isSaving={updateEnvironmentScanSettingsMutation.isPending}
              overrideCount={environmentScanSettingsQuery.data?.data?.ruleOverrides?.length ?? 0}
            />
            <Card variant="bordered" className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Effective Scan Settings
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This is the merged configuration the API will apply before request-level overrides.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(effectiveScanSettingsQuery.data?.data?.expertiseSlugs ?? []).map(
                  (expertise: string) => (
                    <span
                      key={expertise}
                      className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {expertise}
                    </span>
                  )
                )}
                {(effectiveScanSettingsQuery.data?.data?.expertiseSlugs ?? []).length === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No expertise settings configured.
                  </span>
                )}
              </div>
            </Card>
          </div>
        )}

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

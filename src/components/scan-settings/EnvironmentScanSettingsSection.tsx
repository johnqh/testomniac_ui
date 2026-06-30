import { useState } from 'react';
import { Alert, Card } from '@sudobility/components';
import {
  useEffectiveEnvironmentScanSettings,
  useEnvironmentScanSettings,
  useUpdateEnvironmentScanSettings,
} from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../../context/config';
import { useDashboardEnvironmentContext } from '../../hooks/useDashboardEnvironmentContext';
import { ScanSettingsPanel } from './ScanSettingsPanel';

/**
 * Per-environment scan overrides plus the merged "effective" settings the API
 * will apply. Scoped to the current environment (productId + envId derived from
 * the route via the dashboard environment context).
 */
export function EnvironmentScanSettingsSection() {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { productId, envId: environmentId } = useDashboardEnvironmentContext();
  const [expertisesOverride, setExpertisesOverride] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanSettingsQuery = useEnvironmentScanSettings(
    networkClient,
    baseUrl,
    token ?? '',
    productId ?? 0,
    environmentId,
    { enabled: !!token && !!productId && !!environmentId }
  );
  const effectiveScanSettingsQuery = useEffectiveEnvironmentScanSettings(
    networkClient,
    baseUrl,
    token ?? '',
    productId ?? 0,
    environmentId,
    { enabled: !!token && !!productId && !!environmentId }
  );
  const updateMutation = useUpdateEnvironmentScanSettings(networkClient, baseUrl);

  const expertises = expertisesOverride ?? scanSettingsQuery.data?.data?.expertiseSlugs ?? [];

  const toggle = (slug: string, checked: boolean) => {
    setExpertisesOverride(prev => {
      const source = prev ?? [];
      return checked ? [...source, slug] : source.filter(item => item !== slug);
    });
  };

  async function save() {
    if (!productId || !environmentId) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({
        token: token ?? '',
        productId,
        environmentId,
        data: {
          expertiseSlugs: expertises,
          ruleOverrides: scanSettingsQuery.data?.data?.ruleOverrides ?? null,
        },
      });
      setExpertisesOverride(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save environment scan settings');
    }
  }

  if (!productId || !environmentId) return null;

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" description={error} />}
      <ScanSettingsPanel
        title="Environment Overrides"
        description="These overrides apply before a scan starts in this environment."
        selectedExpertises={expertises}
        onToggle={toggle}
        onSave={save}
        isSaving={updateMutation.isPending}
        overrideCount={scanSettingsQuery.data?.data?.ruleOverrides?.length ?? 0}
      />
      <Card variant="bordered">
        <h2 className="text-sm font-semibold text-foreground">Effective Scan Settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This is the merged configuration the API will apply before request-level overrides.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(effectiveScanSettingsQuery.data?.data?.expertiseSlugs ?? []).map(
            (expertise: string) => (
              <span
                key={expertise}
                className="rounded bg-muted px-2 py-1 text-xs capitalize text-muted-foreground"
              >
                {expertise}
              </span>
            )
          )}
          {(effectiveScanSettingsQuery.data?.data?.expertiseSlugs ?? []).length === 0 && (
            <span className="text-xs text-muted-foreground">No expertise settings configured.</span>
          )}
        </div>
      </Card>
    </div>
  );
}

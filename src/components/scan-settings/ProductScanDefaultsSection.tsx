import { useState } from 'react';
import { Alert } from '@sudobility/components';
import {
  useProductScanSettings,
  useUpdateProductScanSettings,
} from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../../context/config';
import { ScanSettingsPanel } from './ScanSettingsPanel';

/**
 * Product-wide scan defaults. These apply to every environment unless an
 * environment override replaces them. Scoped purely by `productId`, so it has
 * no dependency on the current environment.
 */
export function ProductScanDefaultsSection({ productId }: { productId: number }) {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const [expertisesOverride, setExpertisesOverride] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanSettingsQuery = useProductScanSettings(networkClient, baseUrl, token ?? '', productId, {
    enabled: !!token && !!productId,
  });
  const updateMutation = useUpdateProductScanSettings(networkClient, baseUrl);

  const expertises = expertisesOverride ?? scanSettingsQuery.data?.data?.expertiseSlugs ?? [];

  const toggle = (slug: string, checked: boolean) => {
    setExpertisesOverride(prev => {
      const source = prev ?? [];
      return checked ? [...source, slug] : source.filter(item => item !== slug);
    });
  };

  async function save() {
    if (!productId) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({
        token: token ?? '',
        productId,
        data: {
          expertiseSlugs: expertises,
          ruleOverrides: scanSettingsQuery.data?.data?.ruleOverrides ?? null,
        },
      });
      setExpertisesOverride(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product scan settings');
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" description={error} />}
      <ScanSettingsPanel
        title="Product Scan Defaults"
        description="These defaults apply to every environment unless an environment override replaces them."
        selectedExpertises={expertises}
        onToggle={toggle}
        onSave={save}
        isSaving={updateMutation.isPending}
        overrideCount={scanSettingsQuery.data?.data?.ruleOverrides?.length ?? 0}
      />
    </div>
  );
}

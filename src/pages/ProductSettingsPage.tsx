import { ContentLayout } from '@sudobility/components';
import { SEOHead } from '../context/config';
import { useRouteParams } from '../context/routing';
import { ProductScanDefaultsSection } from '../components/scan-settings';

/**
 * Product-level settings (`/dashboard/:entitySlug/products/:productId/settings`).
 * Minimal for now: just the product-wide scan defaults. Scoped by the route's
 * `productId` so it is bookmarkable and independent of the sidebar selection.
 */
export function ProductSettingsPage() {
  const { productId } = useRouteParams<{ productId: string }>();
  const numericProductId = Number(productId);

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Product Settings" description="" noIndex />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Product Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure defaults that apply across all environments for this product.
          </p>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl px-4 py-6">
        {numericProductId ? (
          <ProductScanDefaultsSection productId={numericProductId} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No product selected.</p>
        )}
      </div>
    </ContentLayout>
  );
}

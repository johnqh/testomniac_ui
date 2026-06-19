import { ContentLayout } from '@sudobility/components';
import { SEOHead } from '../context/config';
import { useRouteParams } from '../context/routing';
import { CredentialManagementSection } from '../components/credentials';

export function RunnerSettingsPage() {
  const { entitySlug, envId } = useRouteParams<{
    entitySlug: string;
    envId: string;
  }>();

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Environment Settings" description="" noIndex />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Environment Settings
          </h1>
          {envId && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure settings for this environment.
            </p>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-2xl px-4 py-6">
        <CredentialManagementSection entitySlug={entitySlug ?? ''} />
      </div>
    </ContentLayout>
  );
}

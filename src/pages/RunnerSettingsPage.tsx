import { ContentLayout } from '@sudobility/components';
import { SEOHead } from '../context/config';
import { useRouteParams } from '../context/routing';
import { CredentialManagementSection } from '../components/credentials';
import { EnvironmentScanSettingsSection } from '../components/scan-settings';

export function RunnerSettingsPage() {
  const { entitySlug, envId } = useRouteParams<{
    entitySlug: string;
    envId: string;
  }>();

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Environment Settings" description="" noIndex />
          <h1 className="text-xl font-semibold text-foreground">Environment Settings</h1>
          {envId && (
            <p className="mt-1 text-sm text-muted-foreground">
              Configure settings for this environment.
            </p>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
        <CredentialManagementSection entitySlug={entitySlug ?? ''} />
        <EnvironmentScanSettingsSection />
      </div>
    </ContentLayout>
  );
}

import { useState } from 'react';
import { useEntityCredentials, useSubmitScan } from '@sudobility/testomniac_client';
import { Label, ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useRoutes } from '../context/routing';
import { SelectField } from '../components/forms/SelectField';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScanForm } from '../components/scanner/ScanForm';

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  email_password: 'Email / Password',
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  okta: 'Okta',
  saml: 'SAML',
};

export function StartScanPage() {
  const { entitySlug } = useRouteParams<{ entitySlug: string }>();
  const routes = useRoutes();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const [error, setError] = useState<string | null>(null);
  const [sizeClass, setSizeClass] = useState<'desktop' | 'mobile'>('desktop');

  // Scan scope
  const [scanScopePath, setScanScopePath] = useState('');
  const [quickScan, setQuickScan] = useState(false);

  // Login credential state
  const [continueWithLogin, setContinueWithLogin] = useState(false);
  const [entityCredentialId, setEntityCredentialId] = useState('');
  const [loginUrl, setLoginUrl] = useState('');

  // Credentials hook
  const credentialsQuery = useEntityCredentials(
    networkClient,
    baseUrl,
    token ?? '',
    entitySlug ?? '',
    { enabled: !!entitySlug && !!token }
  );
  const storedCredentials = credentialsQuery.data?.data ?? [];
  const loadingCredentials = credentialsQuery.isLoading;

  // Scan submission hook
  const submitScanMutation = useSubmitScan(networkClient, baseUrl);
  const isSubmitting = submitScanMutation.isPending;

  async function handleSubmit(url: string, email?: string) {
    setError(null);
    try {
      const response = await submitScanMutation.mutateAsync({
        url,
        sizeClass,
        ...(email ? { reportEmail: email } : {}),
        ...(scanScopePath.trim() ? { scanScopePath: scanScopePath.trim() } : {}),
        ...(quickScan ? { quickScan: true } : {}),
        ...(continueWithLogin
          ? {
              continueWithLogin: true,
              ...(entityCredentialId ? { entityCredentialId: Number(entityCredentialId) } : {}),
              ...(loginUrl.trim() ? { loginUrl: loginUrl.trim() } : {}),
            }
          : {}),
      });

      if (response.success && response.data?.testRunId && response.data?.testEnvironmentId) {
        navigate(
          routes.runProgress(
            entitySlug ?? '',
            response.data.testEnvironmentId,
            response.data.testRunId
          )
        );
      } else {
        setError(response.error || response.data?.message || 'Failed to start scan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    }
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Start Discovery Run" description="" noIndex />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Start Discovery Run
          </h1>
        </div>
      }
    >
      <div className="max-w-lg px-4 py-4 sm:px-6">
        <div className="space-y-6">
          <ScanForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            showEmail={false}
          />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Options</h3>

            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">Device</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSizeClass('desktop')}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      sizeClass === 'desktop'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeClass('mobile')}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      sizeClass === 'mobile'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* Scan Scope Path */}
              <div>
                <Label className="mb-1 block">Scope Path (optional)</Label>
                <input
                  type="text"
                  value={scanScopePath}
                  onChange={e => setScanScopePath(e.target.value)}
                  placeholder="/store/"
                  className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Restrict scanning to URLs under this path prefix
                </p>
              </div>

              {/* Quick Scan */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickScan}
                    onChange={e => setQuickScan(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quick scan</span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
                  Skip hover interactions on linked elements for faster discovery
                </p>
              </div>

              {/* Login Credential Option */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={continueWithLogin}
                    onChange={e => {
                      setContinueWithLogin(e.target.checked);
                      if (!e.target.checked) {
                        setEntityCredentialId('');
                        setLoginUrl('');
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Continue with login
                  </span>
                </label>

                {continueWithLogin && (
                  <div className="mt-3 ml-6 space-y-3">
                    <div>
                      <Label className="mb-1 block">Stored Credential</Label>
                      <SelectField
                        value={entityCredentialId}
                        onChange={setEntityCredentialId}
                        disabled={loadingCredentials}
                        options={[
                          {
                            value: '',
                            label: loadingCredentials ? 'Loading...' : 'Select a credential',
                          },
                          ...storedCredentials.map(cred => ({
                            value: String(cred.id),
                            label: `${cred.label} (${
                              AUTH_PROVIDER_LABELS[cred.authProvider] || cred.authProvider
                            }${cred.email ? ` - ${cred.email}` : ''})`,
                          })),
                        ]}
                      />
                      {!loadingCredentials && storedCredentials.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          No stored credentials. Add them in Settings.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="mb-1 block">Login URL (optional)</Label>
                      <input
                        type="text"
                        value={loginUrl}
                        onChange={e => setLoginUrl(e.target.value)}
                        placeholder="https://example.com/login"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Discovery creates a root test run and captures page states for the selected device
                size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

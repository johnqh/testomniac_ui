import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useResolveProductByUrl } from '@sudobility/testomniac_client';
import {
  useCreateProductFlow,
  useProductSelectionStore,
  useCreateProductDraftStore,
  EXPERTISE_OPTIONS,
  DEFAULT_EXPERTISE_SLUGS,
  SCAN_MODE_OPTIONS,
  environmentOptions,
  resolveEnvironmentContext,
  type EnvironmentChoice,
  type ScanMode,
} from '@sudobility/testomniac_lib';
import type { UserData } from '@sudobility/testomniac_types';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@sudobility/components';
import { useTestomniacApi } from '../context/config';
import { useRouteParams, useRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const labelCls =
  'block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1';
const inputCls =
  'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

/**
 * Dashboard "Create Product" page. Mirrors the extension's scan-setup UI:
 * enter a URL, pick environment / expertises / scan depth / optional login, and
 * start a scan. Unlike the extension, the resulting run is created WITHOUT an
 * owner (see `useCreateProductFlow`), so the server-side runner picks it up.
 *
 * If the URL already belongs to a product in this workspace, the page surfaces
 * that and offers to open it instead of creating a duplicate.
 */
export function CreateProductPage() {
  const { entitySlug } = useRouteParams<{ entitySlug: string }>();
  const routes = useRoutes();
  const { navigate } = useLocalizedNavigate();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const queryClient = useQueryClient();
  const setSelectedProductId = useProductSelectionStore(s => s.setSelectedProductId);
  const setDraftDirty = useCreateProductDraftStore(s => s.setDirty);

  const [url, setUrl] = useState('');
  const [debouncedUrl, setDebouncedUrl] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentChoice>('production');
  const [customEnvironmentLabel, setCustomEnvironmentLabel] = useState('');
  const [selectedExpertiseSlugs, setSelectedExpertiseSlugs] =
    useState<string[]>(DEFAULT_EXPERTISE_SLUGS);
  const [scanMode, setScanMode] = useState<ScanMode>('full');
  const [continueWithLogin, setContinueWithLogin] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [userDataJson, setUserDataJson] = useState('{}');

  // Debounce the URL before the existing-product lookup fires.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedUrl(url.trim()), 500);
    return () => clearTimeout(handle);
  }, [url]);

  // Has the user entered anything worth keeping? Mirrored into a shared store so
  // the sidebar can warn before a workspace/product switch discards it. Reset on
  // unmount so leaving the page by any route clears the guard.
  const draftDirty =
    url.trim() !== '' ||
    continueWithLogin ||
    loginUrl.trim() !== '' ||
    credEmail.trim() !== '' ||
    credPassword !== '' ||
    customEnvironmentLabel.trim() !== '';
  useEffect(() => {
    setDraftDirty(draftDirty);
  }, [draftDirty, setDraftDirty]);
  useEffect(() => () => setDraftDirty(false), [setDraftDirty]);

  const isValidUrl = useMemo(() => {
    if (!debouncedUrl) return false;
    try {
      void new URL(debouncedUrl);
      return true;
    } catch {
      return false;
    }
  }, [debouncedUrl]);

  // Step 2: does this URL already belong to a product in the workspace?
  const resolveQuery = useResolveProductByUrl(
    networkClient,
    baseUrl,
    token,
    entitySlug,
    isValidUrl ? debouncedUrl : '',
    { enabled: !!token && !!entitySlug && isValidUrl }
  );
  const existing = resolveQuery.data?.data ?? null;
  const checking = resolveQuery.isFetching;

  const envContext = useMemo(
    () =>
      resolveEnvironmentContext(
        isValidUrl ? debouncedUrl : null,
        selectedEnvironment,
        customEnvironmentLabel
      ),
    [isValidUrl, debouncedUrl, selectedEnvironment, customEnvironmentLabel]
  );

  const { startScan, isSubmitting, error, setError } = useCreateProductFlow({
    networkClient,
    baseUrl,
    token,
    entityId: entitySlug,
  });

  const envValid = envContext.kind === 'local' || envContext.label.trim().length > 0;
  const canSubmit =
    isValidUrl &&
    !existing &&
    !checking &&
    !isSubmitting &&
    selectedExpertiseSlugs.length > 0 &&
    envValid;

  function toggleExpertise(slug: string, checked: boolean) {
    setSelectedExpertiseSlugs(prev => (checked ? [...prev, slug] : prev.filter(s => s !== slug)));
  }

  function openExisting() {
    if (!existing) return;
    setDraftDirty(false);
    setSelectedProductId(String(existing.product.id));
    navigate(routes.bundles(entitySlug, existing.testEnvironment.id));
  }

  /** Build the environment user-data (credentials JSON) to persist, if any. */
  function buildUserData(): UserData | null {
    if (!continueWithLogin) return null;
    let parsed: UserData = {};
    if (userDataJson.trim()) {
      try {
        parsed = JSON.parse(userDataJson) as UserData;
      } catch {
        setError('Environment data is not valid JSON.');
        throw new Error('invalid-json');
      }
    }
    const credential = { ...(parsed.credential ?? {}) };
    if (credEmail.trim()) credential.email = credEmail.trim();
    if (credPassword) credential.password = credPassword;
    return { ...parsed, credential };
  }

  async function handleStart() {
    setError(null);
    let userData: UserData | null;
    try {
      userData = buildUserData();
    } catch {
      return; // invalid JSON; error already surfaced
    }

    const result = await startScan({
      url: url.trim(),
      expertiseSlugs: selectedExpertiseSlugs,
      environmentLabel: envContext.label,
      environmentKind: envContext.kind,
      scanMode,
      continueWithLogin,
      loginUrl: loginUrl.trim() || undefined,
      userData,
    });

    if (result) {
      // Select the new product so the sidebar reflects it, refresh the product
      // list, and land on its Runs page where the new (pending) run appears.
      setDraftDirty(false);
      setSelectedProductId(String(result.productId));
      queryClient.invalidateQueries({
        predicate: q => Array.isArray(q.queryKey) && (q.queryKey as unknown[]).includes('products'),
      });
      navigate(routes.runs(entitySlug, result.testEnvironmentId));
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Create Product</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Enter a URL to scan. We&apos;ll set up the product and start a discovery run.
          </p>
        </div>

        {/* URL input */}
        <div>
          <label className={labelCls}>URL</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            spellCheck={false}
            className={inputCls}
          />
          {url.trim() && !isValidUrl && (
            <p className="mt-1 text-[11px] text-warning">Enter a full URL including https://</p>
          )}
          {checking && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Checking for an existing product…
            </p>
          )}
        </div>

        {/* Step 2: existing product */}
        {existing && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-3">
            <p className="text-sm font-medium text-warning">
              This URL already belongs to “{existing.product.title}”.
            </p>
            <p className="mt-0.5 text-[12px] text-warning">
              A product for this URL already exists in this workspace.
            </p>
            <button
              type="button"
              onClick={openExisting}
              className="mt-2 rounded-md bg-warning px-3 py-1.5 text-[12px] font-medium text-warning-foreground hover:bg-warning/90"
            >
              Open existing product →
            </button>
          </div>
        )}

        {/* Step 3-7: configuration (only when the URL is new) */}
        {isValidUrl && !existing && !checking && (
          <>
            {/* Environment */}
            <div>
              <label className={labelCls}>Environment</label>
              {envContext.kind === 'local' ? (
                <div className="rounded-md border border-success/20 bg-success/10 px-3 py-2 text-[12px] text-success">
                  Local environment on {envContext.hostname}
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedEnvironment}
                    onValueChange={v => setSelectedEnvironment(v as EnvironmentChoice)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {environmentOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEnvironment === 'custom' && (
                    <input
                      type="text"
                      value={customEnvironmentLabel}
                      onChange={e => setCustomEnvironmentLabel(e.target.value)}
                      placeholder="Environment label"
                      className={inputCls}
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Scans for {envContext.hostname} are stored under{' '}
                    <span className="font-medium text-foreground">
                      {envContext.label || 'an environment label'}
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Expertises */}
            <div>
              <label className={labelCls}>Expertises</label>
              <div className="space-y-1.5 rounded-md border border-border bg-muted px-3 py-2">
                {EXPERTISE_OPTIONS.map(opt => {
                  const checked = selectedExpertiseSlugs.includes(opt.slug);
                  return (
                    <label
                      key={opt.slug}
                      className="flex items-center justify-between gap-2 text-[13px] text-foreground"
                    >
                      <span>
                        {opt.label}
                        {opt.required ? ' (required)' : ''}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={opt.required}
                        onChange={e => !opt.required && toggleExpertise(opt.slug, e.target.checked)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scan depth */}
            <div>
              <label className={labelCls}>Scan depth</label>
              <div className="flex gap-1.5">
                {SCAN_MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScanMode(opt.value)}
                    className={[
                      'flex-1 rounded-md border py-1.5 text-[12px] font-medium transition-colors',
                      scanMode === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-card text-muted-foreground hover:border-muted-foreground',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {SCAN_MODE_OPTIONS.find(o => o.value === scanMode)?.description}
              </p>
            </div>

            {/* Continue with login + environment settings (JSON) */}
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={continueWithLogin}
                  onChange={e => {
                    setContinueWithLogin(e.target.checked);
                    if (!e.target.checked) setLoginUrl('');
                  }}
                />
                Continue with login
              </label>

              {continueWithLogin && (
                <div className="mt-2 space-y-2 rounded-md border border-border bg-muted px-3 py-2">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      value={credEmail}
                      onChange={e => setCredEmail(e.target.value)}
                      placeholder="user@example.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <input
                      type="password"
                      value={credPassword}
                      onChange={e => setCredPassword(e.target.value)}
                      placeholder="Password"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Environment settings (JSON)</label>
                    <textarea
                      value={userDataJson}
                      onChange={e => setUserDataJson(e.target.value)}
                      rows={5}
                      spellCheck={false}
                      placeholder='{ "credential": { "email": "...", "password": "..." } }'
                      className={`${inputCls} font-mono text-[12px]`}
                    />
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      The email/password above are merged into <code>credential</code> on save.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Login URL (optional)</label>
                    <input
                      type="text"
                      value={loginUrl}
                      onChange={e => setLoginUrl(e.target.value)}
                      placeholder="https://example.com/login"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {error}
              </div>
            )}

            {/* Start Scanning */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!canSubmit}
              className="w-full rounded-md bg-success px-3 py-2.5 text-sm font-semibold text-success-foreground hover:bg-success/90 disabled:cursor-not-allowed disabled:bg-success/50"
            >
              {isSubmitting ? 'Starting…' : 'Start Scanning'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

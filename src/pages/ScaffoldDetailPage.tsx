import { useMemo, useState } from 'react';
import { useRunScaffolds, useEnvironmentTestInteractions } from '@sudobility/testomniac_client';
import { Card, Tabs, TabsList, TabsTrigger } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { InteractionCell, SCAFFOLD_ICONS, SCAFFOLD_LABELS } from '../components/cells';
import BackLink from '../components/navigation/BackLink';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export function ScaffoldDetailPage() {
  const { envId, scaffoldId } = useRouteParams<{
    envId: string;
    scaffoldId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const r = useEnvRoutes();

  const { scaffolds, isLoading, error } = useRunScaffolds({
    networkClient,
    baseUrl,
    runId: latestRun?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!latestRun,
  });

  const numericScaffoldId = Number(scaffoldId);
  const scaffold = scaffolds.find(s => s.id === numericScaffoldId);
  const pagePaths = Array.isArray((scaffold as unknown as { pagePaths?: string[] })?.pagePaths)
    ? (scaffold as unknown as { pagePaths: string[] }).pagePaths
    : [];

  const { testInteractions } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl,
    envId: Number(envId),
    token,
    enabled: !!envId && !!token,
  });

  const scaffoldInteractions = useMemo(
    () => testInteractions.filter(i => i.scaffoldId === numericScaffoldId),
    [testInteractions, numericScaffoldId]
  );

  const [tab, setTab] = useState<'pages' | 'interactions'>('pages');

  if (contextLoading || isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  if (!scaffold) {
    return (
      <div className="p-4 sm:p-6">
        <BackLink label="Scaffolds" onClick={() => navigate(r.scaffolds())} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Scaffold not found</div>
      </div>
    );
  }

  const label = SCAFFOLD_LABELS[scaffold.type] ?? scaffold.type;

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title={label} description="" noIndex />
      <BackLink label="Scaffolds" onClick={() => navigate(r.scaffolds())} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <span className="text-gray-500 dark:text-gray-400 [&>svg]:h-5 [&>svg]:w-5">
            {SCAFFOLD_ICONS[scaffold.type]}
          </span>
          <h1 className="text-2xl font-bold">{label}</h1>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <Card
          variant="bordered"
          padding="none"
          className="divide-y divide-gray-200 dark:divide-gray-700"
        >
          <DetailRow label="Type" value={scaffold.type} />
          <DetailRow label="Element ID" value={String(scaffold.htmlElementId)} mono />
          {scaffold.htmlHash && <DetailRow label="HTML Hash" value={scaffold.htmlHash} mono />}
          {scaffold.createdAt && (
            <DetailRow label="Created" value={new Date(scaffold.createdAt).toLocaleString()} />
          )}
        </Card>

        {/* Tabs: Pages / Interactions */}
        <div>
          <Tabs
            value={tab}
            onValueChange={v => setTab(v as 'pages' | 'interactions')}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="pages">
                Pages
                {pagePaths.length > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                    ({pagePaths.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="interactions">
                Interactions
                {scaffoldInteractions.length > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                    ({scaffoldInteractions.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === 'pages' &&
            (pagePaths.length > 0 ? (
              <Card
                variant="bordered"
                padding="none"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                {pagePaths.map((path: string) => (
                  <div
                    key={path}
                    className="px-4 py-2.5 text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {path}
                  </div>
                ))}
              </Card>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                No pages use this scaffold.
              </div>
            ))}

          {tab === 'interactions' &&
            (scaffoldInteractions.length > 0 ? (
              <div className="space-y-2">
                {scaffoldInteractions.map(i => (
                  <InteractionCell
                    key={i.id}
                    interaction={i}
                    onClick={() => navigate(r.testInteraction(i.id))}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                No interactions use this scaffold.
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center px-4 py-3">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">
        {label}
      </span>
      <span
        className={`min-w-0 break-all text-sm text-gray-900 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

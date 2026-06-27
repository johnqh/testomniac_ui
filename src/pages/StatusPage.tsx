import { useMemo, useState } from 'react';
import {
  useRunLiveDashboard,
  useRunFindings,
  type RunStructure,
  type RunNavigationMap,
  type RunSummary,
} from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { getFindingDisplayTitle, getFindingExpertiseSlug } from '@sudobility/testomniac_lib';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useTestomniacApi } from '../context/config';

type MainTab = 'overview' | 'issues' | 'details';
type DetailTab = 'navigation' | 'coverage' | 'events';

const TERMINAL = ['completed', 'failed', 'stopped', 'cancelled', 'error'];

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleTimeString();
}

function typeColor(type: string): string {
  if (type === 'error') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40';
  if (type === 'warning')
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40';
  return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800';
}

function StatusPill({ status, live }: { status: string; live: boolean }) {
  const done = TERMINAL.includes(status);
  const cls = !done
    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
    : status === 'completed'
      ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${cls}`}
    >
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {status}
    </span>
  );
}

const mainTabCls = (active: boolean) =>
  `whitespace-nowrap px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
    active
      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
  }`;

const subTabCls = (active: boolean) =>
  `whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
  }`;

/* ------------------------------------------------------------------ */
/*  Counts                                                             */
/* ------------------------------------------------------------------ */

function CountsBar({
  pages,
  states,
  tests,
  errors,
}: {
  pages: number;
  states: number;
  tests: number;
  errors: number;
}) {
  const cells = [
    { label: 'Pages', value: pages, color: 'text-blue-600 dark:text-blue-400' },
    {
      label: 'States',
      value: states,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Tests',
      value: tests,
      color: 'text-green-600 dark:text-green-400',
    },
    { label: 'Errors', value: errors, color: 'text-red-600 dark:text-red-400' },
  ];
  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg border border-gray-200 bg-white py-1 dark:border-gray-800 dark:bg-gray-950">
      {cells.map(c => (
        <div key={c.label} className="py-1.5 text-center">
          <div className={`font-mono text-lg font-bold tabular-nums sm:text-xl ${c.color}`}>
            {c.value}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Overview                                                      */
/* ------------------------------------------------------------------ */

function OverviewTab({
  summary,
  screenshot,
}: {
  summary: RunSummary | undefined;
  screenshot: string | null;
}) {
  if (!summary) {
    return <p className="py-8 text-center text-[13px] text-gray-400">Waiting for run data…</p>;
  }
  const expertise = Object.entries(summary.expertiseSummary ?? {});
  return (
    <div className="space-y-3">
      {screenshot && (
        <img
          src={screenshot}
          alt="Latest page"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-800"
        />
      )}
      {summary.aiSummary && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {summary.aiSummary}
        </div>
      )}
      {expertise.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {expertise.map(([slug, s]) => (
            <div
              key={slug}
              className="rounded-md border border-gray-200 px-2.5 py-1.5 dark:border-gray-800"
            >
              <div className="truncate text-[12px] font-medium capitalize text-gray-800 dark:text-gray-200">
                {slug}
              </div>
              <div className="mt-0.5 flex gap-2 text-[11px]">
                <span className="text-red-600 dark:text-red-400">{s.errors} err</span>
                <span className="text-amber-600 dark:text-amber-400">{s.warnings} warn</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!summary.aiSummary && expertise.length === 0 && !screenshot && (
        <p className="py-8 text-center text-[13px] text-gray-400">No summary yet.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Issues                                                        */
/* ------------------------------------------------------------------ */

function IssuesTab({
  findings,
  loading,
}: {
  findings: TestRunFindingResponse[];
  loading: boolean;
}) {
  if (loading && findings.length === 0) {
    return <p className="py-8 text-center text-[13px] text-gray-400">Loading issues…</p>;
  }
  if (findings.length === 0) {
    return <p className="py-8 text-center text-[13px] text-gray-400">No issues found.</p>;
  }
  const sorted = [...findings].sort((a, b) => a.priority - b.priority);
  return (
    <div className="space-y-1.5">
      {sorted.map(f => (
        <div
          key={f.id}
          className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
        >
          <div className="flex items-start gap-2">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeColor(f.type)}`}
            >
              {f.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {getFindingExpertiseSlug(f) && (
                  <span className="inline-flex shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {getFindingExpertiseSlug(f)}
                  </span>
                )}
                <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                  {getFindingDisplayTitle(f)}
                </span>
              </div>
              {f.description && (
                <div className="mt-0.5 text-[12px] leading-snug text-gray-600 dark:text-gray-400">
                  {f.description}
                </div>
              )}
              {f.path && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-gray-400">{f.path}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail: Navigation                                                 */
/* ------------------------------------------------------------------ */

function NavigationDetail({ navMap }: { navMap: RunNavigationMap | undefined }) {
  const pages = navMap?.discoveredPages ?? [];
  if (pages.length === 0) {
    return <p className="py-6 text-center text-[13px] text-gray-400">No pages discovered yet.</p>;
  }
  return (
    <div className="space-y-1">
      {pages.map(page => {
        const visit = navMap?.pageVisits.find(v => v.relativePath === page.relativePath);
        return (
          <div
            key={page.id}
            className="rounded-md border border-gray-100 px-2.5 py-1.5 text-[12px] dark:border-gray-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-gray-700 dark:text-gray-300">
                {page.relativePath}
              </span>
              <span className="shrink-0 text-[11px] text-blue-600 dark:text-blue-400">
                {visit?.status ?? 'discovered'}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-gray-400">
              from {page.sourcePagePath || 'root'}
              {page.sourceLabel ? ` via ${page.sourceLabel}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail: Coverage                                                   */
/* ------------------------------------------------------------------ */

function CoverageDetail({ structure }: { structure: RunStructure | null }) {
  if (!structure || structure.surfaces.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-gray-400">Coverage not available yet.</p>
    );
  }
  return (
    <div className="space-y-1.5">
      {structure.surfaces.map(surface => {
        const status = surface.surfaceRuns.map(r => r.status).join(', ') || 'pending';
        return (
          <details
            key={surface.id}
            className="rounded-md border border-gray-200 dark:border-gray-800"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-[12px]">
              <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                {surface.title}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-gray-400">
                <span>{surface.testInteractions.length} tests</span>
                <span className="text-blue-600 dark:text-blue-400">{status}</span>
              </span>
            </summary>
            <div className="space-y-1 border-t border-gray-100 px-2 py-1.5 dark:border-gray-800">
              {surface.testInteractions.map(ti => {
                const runStatus = ti.interactionRuns.map(r => r.status).join(', ') || 'pending';
                return (
                  <details key={ti.id} className="pl-1">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 py-0.5 text-[11px]">
                      <span className="truncate text-gray-700 dark:text-gray-300">{ti.title}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-gray-400">
                        <span className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                          {ti.testType}
                        </span>
                        <span>{runStatus}</span>
                      </span>
                    </summary>
                    <div className="space-y-0.5 pl-2 pt-0.5">
                      {ti.interactionRuns.map(r => (
                        <div key={r.id} className="text-[11px] text-gray-500 dark:text-gray-400">
                          run {r.id} · {r.status}
                          {r.durationMs != null ? ` · ${r.durationMs}ms` : ''} · {r.findings.length}{' '}
                          finding
                          {r.findings.length === 1 ? '' : 's'}
                        </div>
                      ))}
                      {ti.interactionRuns.length === 0 && (
                        <div className="text-[11px] text-gray-400">not run yet</div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail: Events                                                     */
/* ------------------------------------------------------------------ */

function EventsDetail({
  navMap,
  summary,
}: {
  navMap: RunNavigationMap | undefined;
  summary: RunSummary | undefined;
}) {
  const events = useMemo(() => {
    const rows: { key: string; ts: number; label: string; msg: string }[] = [];
    for (const v of navMap?.pageVisits ?? []) {
      rows.push({
        key: `v${v.id}`,
        ts: v.createdAt ? Date.parse(v.createdAt) : 0,
        label: fmtTime(v.createdAt),
        msg: `Visited ${v.relativePath} → ${v.status}`,
      });
    }
    for (const f of summary?.recentFindings ?? []) {
      rows.push({
        key: `f${f.id}`,
        ts: f.createdAt ? Date.parse(f.createdAt) : 0,
        label: fmtTime(f.createdAt),
        msg: `${f.type}: ${f.title}`,
      });
    }
    return rows.sort((a, b) => b.ts - a.ts).slice(0, 50);
  }, [navMap, summary]);

  if (events.length === 0) {
    return <p className="py-6 text-center text-[13px] text-gray-400">No events yet.</p>;
  }
  return (
    <div className="space-y-0.5 font-mono">
      {events.map(e => (
        <div
          key={e.key}
          className="flex gap-2 rounded px-1.5 py-1 text-[11px] odd:bg-gray-50 dark:odd:bg-gray-900/50"
        >
          <span className="shrink-0 text-gray-400">{e.label}</span>
          <span className="min-w-0 flex-1 break-words text-gray-700 dark:text-gray-300">
            {e.msg}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

/**
 * Dashboard "Status" page — the environment-level equivalent of the extension's
 * live scan view. Shows the latest run's status counts (pages/states/tests/
 * errors) plus an Overview / Issues / Details (Navigation · Coverage · Events)
 * tabbed interface, polling `useRunLiveDashboard` while the run is in progress.
 */
export function StatusPage() {
  const {
    latestRun,
    networkClient,
    token,
    isLoading: ctxLoading,
  } = useDashboardEnvironmentContext();
  const { baseUrl } = useTestomniacApi();

  const runId = latestRun?.id ?? 0;
  const runStatus = (latestRun?.status as string | undefined) ?? 'pending';
  const live = runId > 0 && !TERMINAL.includes(runStatus);

  const dash = useRunLiveDashboard(networkClient, baseUrl, token, runId, {
    enabled: !!token && runId > 0,
    refetchInterval: live ? 4000 : false,
  });
  const findingsQuery = useRunFindings(networkClient, baseUrl, token, runId, {
    enabled: !!token && runId > 0,
    refetchInterval: live ? 6000 : false,
  });

  const data = dash.data?.data;
  const summary = data?.summary;
  const findings = findingsQuery.data?.data ?? [];

  const [tab, setTab] = useState<MainTab>('overview');
  const [detailTab, setDetailTab] = useState<DetailTab>('navigation');

  const pages = summary?.pagesFound ?? data?.navigationMap.discoveredPages.length ?? 0;
  const states = summary?.pageStatesFound ?? 0;
  const tests = summary?.testRunsCompleted ?? 0;
  const errors = useMemo(
    () =>
      summary
        ? Object.values(summary.expertiseSummary ?? {}).reduce((acc, e) => acc + e.errors, 0)
        : 0,
    [summary]
  );

  const screenshot = useMemo(() => {
    const withShot = (data?.pagesSummary ?? []).filter(p => p.latestScreenshotPath);
    const path = withShot[withShot.length - 1]?.latestScreenshotPath ?? null;
    if (!path) return null;
    if (/^(https?:|data:)/.test(path)) return path;
    if (path.startsWith('/')) return `${baseUrl}${path}`;
    return null;
  }, [data, baseUrl]);

  if (!ctxLoading && runId === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="max-w-xs text-center text-[13px] leading-relaxed text-gray-400 dark:text-gray-500">
          No runs yet for this environment. Start a scan to see live status here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Status</h1>
          <StatusPill status={runStatus} live={live} />
        </div>

        <CountsBar pages={pages} states={states} tests={tests} errors={errors} />

        {/* Main tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
          {(
            [
              { key: 'overview', label: 'Overview' },
              { key: 'issues', label: 'Issues' },
              { key: 'details', label: 'Details' },
            ] as const
          ).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={mainTabCls(tab === t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab summary={summary} screenshot={screenshot} />}
        {tab === 'issues' && <IssuesTab findings={findings} loading={findingsQuery.isLoading} />}
        {tab === 'details' && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto">
              {(
                [
                  { key: 'navigation', label: 'Navigation' },
                  { key: 'coverage', label: 'Coverage' },
                  { key: 'events', label: 'Events' },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setDetailTab(t.key)}
                  className={subTabCls(detailTab === t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {detailTab === 'navigation' && <NavigationDetail navMap={data?.navigationMap} />}
            {detailTab === 'coverage' && <CoverageDetail structure={data?.structure ?? null} />}
            {detailTab === 'events' && (
              <EventsDetail navMap={data?.navigationMap} summary={summary} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

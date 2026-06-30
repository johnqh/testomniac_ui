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
  if (type === 'error') return 'text-destructive bg-destructive/10';
  if (type === 'warning') return 'text-warning bg-warning/10';
  return 'text-muted-foreground bg-muted';
}

function StatusPill({ status, live }: { status: string; live: boolean }) {
  const done = TERMINAL.includes(status);
  const cls = !done
    ? 'bg-info/10 text-info'
    : status === 'completed'
      ? 'bg-success/10 text-success'
      : 'bg-destructive/10 text-destructive';
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
      ? 'border-primary text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground'
  }`;

const subTabCls = (active: boolean) =>
  `whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
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
  // Distinct per-metric category palette (purple has no semantic equivalent); kept as decorative data.
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
    <div className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-card py-1">
      {cells.map(c => (
        <div key={c.label} className="py-1.5 text-center">
          <div className={`font-mono text-lg font-bold tabular-nums sm:text-xl ${c.color}`}>
            {c.value}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
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
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">Waiting for run data…</p>
    );
  }
  const expertise = Object.entries(summary.expertiseSummary ?? {});
  return (
    <div className="space-y-3">
      {screenshot && (
        <img
          src={screenshot}
          alt="Latest page"
          className="w-full rounded-lg border border-border"
        />
      )}
      {summary.aiSummary && (
        <div className="rounded-lg border border-border bg-muted px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {summary.aiSummary}
        </div>
      )}
      {expertise.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {expertise.map(([slug, s]) => (
            <div key={slug} className="rounded-md border border-border px-2.5 py-1.5">
              <div className="truncate text-[12px] font-medium capitalize text-foreground">
                {slug}
              </div>
              <div className="mt-0.5 flex gap-2 text-[11px]">
                <span className="text-destructive">{s.errors} err</span>
                <span className="text-warning">{s.warnings} warn</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!summary.aiSummary && expertise.length === 0 && !screenshot && (
        <p className="py-8 text-center text-[13px] text-muted-foreground">No summary yet.</p>
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
    return <p className="py-8 text-center text-[13px] text-muted-foreground">Loading issues…</p>;
  }
  if (findings.length === 0) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">No issues found.</p>;
  }
  const sorted = [...findings].sort((a, b) => a.priority - b.priority);
  return (
    <div className="space-y-1.5">
      {sorted.map(f => (
        <div key={f.id} className="rounded-md border border-border px-3 py-2">
          <div className="flex items-start gap-2">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeColor(f.type)}`}
            >
              {f.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {getFindingExpertiseSlug(f) && (
                  <span className="inline-flex shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {getFindingExpertiseSlug(f)}
                  </span>
                )}
                <span className="text-[13px] font-medium text-foreground">
                  {getFindingDisplayTitle(f)}
                </span>
              </div>
              {f.description && (
                <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                  {f.description}
                </div>
              )}
              {f.path && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {f.path}
                </div>
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
    return (
      <p className="py-6 text-center text-[13px] text-muted-foreground">No pages discovered yet.</p>
    );
  }
  return (
    <div className="space-y-1">
      {pages.map(page => {
        const visit = navMap?.pageVisits.find(v => v.relativePath === page.relativePath);
        return (
          <div key={page.id} className="rounded-md border border-border px-2.5 py-1.5 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-foreground">{page.relativePath}</span>
              <span className="shrink-0 text-[11px] text-info">
                {visit?.status ?? 'discovered'}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
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
      <p className="py-6 text-center text-[13px] text-muted-foreground">
        Coverage not available yet.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {structure.surfaces.map(surface => {
        const status = surface.surfaceRuns.map(r => r.status).join(', ') || 'pending';
        return (
          <details key={surface.id} className="rounded-md border border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-[12px]">
              <span className="truncate font-medium text-foreground">{surface.title}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                <span>{surface.testInteractions.length} tests</span>
                <span className="text-info">{status}</span>
              </span>
            </summary>
            <div className="space-y-1 border-t border-border px-2 py-1.5">
              {surface.testInteractions.map(ti => {
                const runStatus = ti.interactionRuns.map(r => r.status).join(', ') || 'pending';
                return (
                  <details key={ti.id} className="pl-1">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 py-0.5 text-[11px]">
                      <span className="truncate text-foreground">{ti.title}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                        <span className="rounded bg-muted px-1">{ti.testType}</span>
                        <span>{runStatus}</span>
                      </span>
                    </summary>
                    <div className="space-y-0.5 pl-2 pt-0.5">
                      {ti.interactionRuns.map(r => (
                        <div key={r.id} className="text-[11px] text-muted-foreground">
                          run {r.id} · {r.status}
                          {r.durationMs != null ? ` · ${r.durationMs}ms` : ''} · {r.findings.length}{' '}
                          finding
                          {r.findings.length === 1 ? '' : 's'}
                        </div>
                      ))}
                      {ti.interactionRuns.length === 0 && (
                        <div className="text-[11px] text-muted-foreground">not run yet</div>
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
    return <p className="py-6 text-center text-[13px] text-muted-foreground">No events yet.</p>;
  }
  return (
    <div className="space-y-0.5 font-mono">
      {events.map(e => (
        <div key={e.key} className="flex gap-2 rounded px-1.5 py-1 text-[11px] odd:bg-muted">
          <span className="shrink-0 text-muted-foreground">{e.label}</span>
          <span className="min-w-0 flex-1 break-words text-foreground">{e.msg}</span>
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
        <p className="max-w-xs text-center text-[13px] leading-relaxed text-muted-foreground">
          No runs yet for this environment. Start a scan to see live status here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-foreground">Status</h1>
          <StatusPill status={runStatus} live={live} />
        </div>

        <CountsBar pages={pages} states={states} tests={tests} errors={errors} />

        {/* Main tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border">
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

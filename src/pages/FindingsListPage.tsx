import { useMemo, useState } from 'react';
import { useRunFindings, useRunPages } from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import {
  getFindingDisplayTitle,
  getFindingExpertiseSlug,
  PRIORITY_LEVELS,
  formatDate,
} from '@sudobility/testomniac_lib';
import { Badge, Button, ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { getPriorityConfig } from '../config/priorityConfig';
import { SelectField } from '../components/forms/SelectField';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScriptPanel } from '../components/scripts/ScriptPanel';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

/* ---------- Sub-components ---------- */

function FindingTypeBadge({ type }: { type: string }) {
  const variant = type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info';

  return (
    <Badge variant={variant} size="sm" pill>
      {type}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = getPriorityConfig(priority);
  return (
    <Badge variant="default" size="sm" pill className={config.className}>
      {config.shortLabel}
    </Badge>
  );
}

/* ---------- Filter types ---------- */

type TypeFilter = 'all' | 'errors';
type PriorityFilter = '' | '0' | '1' | '2' | '3' | '4';

/* ---------- Main component ---------- */

export function FindingsListPage() {
  const { runId } = useRouteParams<{
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('');
  const [pathFilter, setPathFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [scriptFindingId, setScriptFindingId] = useState<number | null>(null);
  const {
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const effectiveRunId = Number(runId ?? latestRun?.id ?? 0);

  const runFindingsQuery = useRunFindings(networkClient, baseUrl, token ?? '', effectiveRunId, {
    enabled: !!token && !!effectiveRunId,
  });
  const findings = useMemo(() => runFindingsQuery.data?.data ?? [], [runFindingsQuery.data]);

  // Map page paths -> page id so a finding can deep-link to its page detail,
  // which shows the finding in context (runtime signals, console/network logs).
  const runPagesQuery = useRunPages(networkClient, baseUrl, token ?? '', effectiveRunId, {
    enabled: !!token && !!effectiveRunId,
  });
  const runPages = useMemo(() => runPagesQuery.data?.data ?? [], [runPagesQuery.data]);
  const pageIdByPath = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of runPages) {
      map.set(page.relativePath, page.id);
    }
    return map;
  }, [runPages]);

  const openFinding = (finding: TestRunFindingResponse) => {
    const pageId = finding.path ? pageIdByPath.get(finding.path) : undefined;
    if (pageId && effectiveRunId) {
      navigate(r.runPage(effectiveRunId, pageId));
    }
  };
  const isLoading = contextLoading || runFindingsQuery.isLoading;
  const error = contextError || (runFindingsQuery.error?.message ?? null);

  // Derive unique paths from findings
  const uniquePaths = useMemo(() => {
    const paths = new Set<string>();
    for (const f of findings) {
      if (f.path) paths.add(f.path);
    }
    return Array.from(paths).sort();
  }, [findings]);

  // Derive unique categories from canonical rule IDs, falling back to legacy title prefixes.
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const f of findings) {
      const slug = getFindingExpertiseSlug(f);
      if (slug) cats.add(slug);
    }
    return Array.from(cats).sort();
  }, [findings]);

  // Apply all filters
  const filteredFindings = useMemo(() => {
    let result = findings as TestRunFindingResponse[];

    if (typeFilter === 'errors') {
      result = result.filter(f => f.type === 'error');
    }

    if (priorityFilter !== '') {
      const p = Number(priorityFilter);
      result = result.filter(f => f.priority === p);
    }

    if (pathFilter !== '') {
      result = result.filter(f => f.path === pathFilter);
    }

    if (categoryFilter !== '') {
      result = result.filter(f => {
        return getFindingExpertiseSlug(f) === categoryFilter;
      });
    }

    return result;
  }, [findings, typeFilter, priorityFilter, pathFilter, categoryFilter]);

  const hasActiveFilters =
    typeFilter !== 'all' || priorityFilter !== '' || pathFilter !== '' || categoryFilter !== '';

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <SEOHead title="Findings" description="" noIndex />

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Findings</h1>
              {runId && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing findings for run #{runId}.
                </p>
              )}
            </div>

            {/* Type filter toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-accent'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('errors')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === 'errors'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-card text-foreground hover:bg-accent'
                }`}
              >
                Errors only
              </button>
            </div>
          </div>

          {/* Priority chips */}
          {!isLoading && findings.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {PRIORITY_LEVELS.map(p => {
                const key = String(p);
                const config = getPriorityConfig(p);
                const count = findings.filter(f => f.priority === p).length;
                const isActive = priorityFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPriorityFilter(isActive ? '' : (key as PriorityFilter))}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? `${config.chipClassName} ring-2 ring-offset-1 ring-current`
                        : `${config.chipClassName} opacity-80 hover:opacity-100`
                    }`}
                  >
                    <span>{config.shortLabel}</span>
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Filter dropdowns row */}
          {!isLoading && findings.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Category filter */}
              {uniqueCategories.length > 0 && (
                <SelectField
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: '', label: 'All categories' },
                    ...uniqueCategories.map(cat => ({ value: cat, label: cat })),
                  ]}
                />
              )}

              {/* Path filter */}
              {uniquePaths.length > 0 && (
                <SelectField
                  value={pathFilter}
                  onChange={setPathFilter}
                  options={[
                    { value: '', label: 'All pages' },
                    ...uniquePaths.map(p => ({ value: p, label: p })),
                  ]}
                />
              )}

              {/* Clear all filters */}
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setTypeFilter('all');
                    setPriorityFilter('');
                    setPathFilter('');
                    setCategoryFilter('');
                  }}
                >
                  Clear filters
                </Button>
              )}

              {/* Result count */}
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredFindings.length} of {findings.length} findings
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {isLoading && <LoadingState message="Loading findings..." />}

        {!isLoading && filteredFindings.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? 'No findings match the current filters' : 'No findings yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting or clearing the filters above.'
                : 'Findings will appear here after test runs complete.'
            }
          />
        )}

        {!isLoading && filteredFindings.length > 0 && (
          <div className="space-y-2">
            {filteredFindings.map(finding => {
              const tag = getFindingExpertiseSlug(finding);
              const title = getFindingDisplayTitle(finding);
              const canOpen = !!(finding.path && pageIdByPath.has(finding.path) && effectiveRunId);
              return (
                <div key={finding.id}>
                  <div
                    onClick={canOpen ? () => openFinding(finding) : undefined}
                    role={canOpen ? 'button' : undefined}
                    tabIndex={canOpen ? 0 : undefined}
                    onKeyDown={
                      canOpen
                        ? e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openFinding(finding);
                            }
                          }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-lg border border-border bg-card ${
                      canOpen ? 'cursor-pointer hover:bg-accent transition-colors' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <FindingTypeBadge type={finding.type} />
                        <PriorityBadge priority={finding.priority} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {tag && (
                            <span className="inline-flex shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {tag}
                            </span>
                          )}
                          <span className="text-sm font-medium text-foreground truncate">
                            {title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {finding.description}
                        </p>
                        <div className="mt-1.5 truncate text-xs text-muted-foreground">
                          {[
                            finding.path,
                            finding.interactionRunIds?.length
                              ? `Run #${finding.interactionRunIds.join(', #')}`
                              : null,
                            finding.createdAt ? formatDate(finding.createdAt) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setScriptFindingId(prev => (prev === finding.id ? null : finding.id));
                        }}
                        className="shrink-0 self-start"
                      >
                        {scriptFindingId === finding.id ? 'Hide' : 'Script'}
                      </Button>
                    </div>
                  </div>
                  {scriptFindingId === finding.id && (
                    <div className="mt-2">
                      <ScriptPanel
                        kind="finding"
                        id={finding.id}
                        filename={`finding-${finding.id}.spec.ts`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ContentLayout>
  );
}

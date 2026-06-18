import { useMemo, useState } from 'react';
import { useRunFindings, useRunPages } from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { parseExpertiseTitle, PRIORITY_LEVELS } from '@sudobility/testomniac_lib';
import { Button } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { getPriorityConfig } from '../config/priorityConfig';
import { SelectField } from '../components/forms/SelectField';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScriptPanel } from '../components/scripts/ScriptPanel';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

/* ---------- Sub-components ---------- */

function FindingTypeBadge({ type }: { type: string }) {
  const colors =
    type === 'error'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : type === 'warning'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {type}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = getPriorityConfig(priority);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.shortLabel}
    </span>
  );
}

/* ---------- Filter types ---------- */

type TypeFilter = 'all' | 'errors';
type PriorityFilter = '' | '0' | '1' | '2' | '3' | '4';

/* ---------- Main component ---------- */

export function FindingsListPage() {
  const { entitySlug, envId, runId } = useRouteParams<{
    entitySlug: string;
    envId: string;
    runId?: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
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

  const runFindingsQuery = useRunFindings({
    networkClient,
    baseUrl,
    runId: effectiveRunId,
    token: token ?? '',
    enabled: !!token && !!effectiveRunId,
  });
  const findings = runFindingsQuery.findings;

  // Map page paths -> page id so a finding can deep-link to its page detail,
  // which shows the finding in context (runtime signals, console/network logs).
  const runPagesQuery = useRunPages({
    networkClient,
    baseUrl,
    runId: effectiveRunId,
    token: token ?? '',
    enabled: !!token && !!effectiveRunId,
  });
  const pageIdByPath = useMemo(() => {
    const map = new Map<string, number>();
    for (const page of runPagesQuery.pages) {
      map.set(page.relativePath, page.id);
    }
    return map;
  }, [runPagesQuery.pages]);

  const openFinding = (finding: TestRunFindingResponse) => {
    const pageId = finding.path ? pageIdByPath.get(finding.path) : undefined;
    if (pageId && effectiveRunId) {
      navigate(
        `/dashboard/${entitySlug}/environments/${envId}/runs/${effectiveRunId}/pages/${pageId}`
      );
    }
  };
  const isLoading = contextLoading || runFindingsQuery.isLoading;
  const error = contextError || runFindingsQuery.error;

  // Derive unique paths from findings
  const uniquePaths = useMemo(() => {
    const paths = new Set<string>();
    for (const f of findings) {
      if (f.path) paths.add(f.path);
    }
    return Array.from(paths).sort();
  }, [findings]);

  // Derive unique categories (tags) from finding titles using parseExpertiseTitle
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const f of findings) {
      const { tag } = parseExpertiseTitle(f.title);
      if (tag) cats.add(tag);
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
        const { tag } = parseExpertiseTitle(f.title);
        return tag === categoryFilter;
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
    <div className="p-6">
      <SEOHead title="Findings" description="" noIndex />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Findings</h1>
          {runId && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Showing findings for run #{runId}.
            </p>
          )}
        </div>

        {/* Type filter toggle */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('errors')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === 'errors'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Errors only
          </button>
        </div>
      </div>

      {/* Priority chips */}
      {!isLoading && findings.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
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
        <div className="mb-4 flex flex-wrap items-center gap-3">
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
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {filteredFindings.length} of {findings.length} findings
          </span>
        </div>
      )}

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
        <div className="space-y-3">
          {filteredFindings.map(finding => {
            const { tag, title } = parseExpertiseTitle(finding.title);
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
                  className={`px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
                    canOpen
                      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                      : ''
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
                          <span className="inline-flex shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {tag}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {finding.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {finding.path && (
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                            {finding.path}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {finding.interactionRunIds?.length
                            ? `Run #${finding.interactionRunIds.join(', #')}`
                            : ''}
                        </span>
                        {finding.createdAt && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(finding.createdAt).toLocaleString()}
                          </span>
                        )}
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
  );
}

import type { PageResponse } from '@sudobility/testomniac_types';
import { buildArtifactUrl } from '@sudobility/testomniac_client';
import { CardGrid } from '@sudobility/components';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { useEnvRoutes } from '../../context/routing';

interface PagesListViewProps {
  pages: PageResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
  screenshotsByPageId?: Map<number, string>;
  apiUrl?: string;
}

export function PagesListView({ pages, runId, screenshotsByPageId, apiUrl }: PagesListViewProps) {
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const sorted = [...pages].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">No pages discovered.</div>
    );
  }

  return (
    <CardGrid>
      {sorted.map(page => {
        const isExternal = page.relativePath.startsWith('http');
        const screenshotPath = screenshotsByPageId?.get(page.id);

        return (
          <div
            key={page.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(runId ? r.runPage(runId, page.id) : r.page(page.id))}
            className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-colors dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
          >
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
              {screenshotPath && apiUrl ? (
                <img
                  src={buildArtifactUrl(apiUrl, screenshotPath, { thumbnail: true })}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <svg
                  className="h-8 w-8 text-gray-300 dark:text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1 p-3">
              <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {page.relativePath}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {page.routeKey && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {page.routeKey}
                  </span>
                )}
                {page.requiresLogin && (
                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[11px] text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Login
                  </span>
                )}
                {isExternal && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    external
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </CardGrid>
  );
}

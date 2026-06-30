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
    return <div className="py-8 text-center text-muted-foreground">No pages discovered.</div>;
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
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors cursor-pointer hover:bg-accent"
          >
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-border bg-muted flex items-center justify-center">
              {screenshotPath && apiUrl ? (
                <img
                  src={buildArtifactUrl(apiUrl, screenshotPath, { thumbnail: true })}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <svg
                  className="h-8 w-8 text-muted-foreground"
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
              <div className="truncate text-sm font-medium text-foreground">
                {page.relativePath}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {page.routeKey && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {page.routeKey}
                  </span>
                )}
                {page.requiresLogin && (
                  <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[11px] text-warning">
                    Login
                  </span>
                )}
                {isExternal && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
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

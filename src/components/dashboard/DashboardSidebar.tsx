import { useEffect, useMemo } from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@sudobility/components';
import {
  useEntities,
  useEntityProducts,
  useProductEnvironments,
} from '@sudobility/testomniac_client';
import { useProductSelectionStore } from '@sudobility/testomniac_lib';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { useTestomniacApi } from '../../context/config';
import {
  useRouteParams,
  useTestomniacRouting,
  useRoutes,
  type TestomniacRoutes,
} from '../../context/routing';

interface DashboardSidebarProps {
  entitySlug: string;
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (16x16, stroke-based, currentColor)              */
/* ------------------------------------------------------------------ */

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Activity pulse / live status */
const StatusIcon = () => (
  <svg {...iconProps}>
    <path d="M2 8h3l2-5 2 10 2-7 1.5 2H14" />
  </svg>
);

/** 4-square grid */
const BundlesIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

/** Document stack */
const PagesIcon = () => (
  <svg {...iconProps}>
    <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    <path d="M10 2v3h3" />
    <path d="M6 9h4" />
    <path d="M6 11.5h3" />
  </svg>
);

/** Layers / surfaces */
const SurfacesIcon = () => (
  <svg {...iconProps}>
    <path d="M2 8l6-4 6 4-6 4-6-4z" />
    <path d="M2 10.5l6 4 6-4" />
    <path d="M2 13l6 4 6-4" />
  </svg>
);

/** Pointer click / interaction */
const InteractionsIcon = () => (
  <svg {...iconProps}>
    <path d="M5 2v8l2.5-2.5L10 12l1.5-1-2.5-4.5H13L5 2z" />
  </svg>
);

/** Branching path / scenario */
const ScenariosIcon = () => (
  <svg {...iconProps}>
    <circle cx="4" cy="4" r="1.5" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M5.5 4h5" />
    <path d="M4 5.5v3.5a2 2 0 0 0 2 2h4.5" />
  </svg>
);

/** Person silhouette / personas */
const PersonasIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3 14.5c0-2.8 2.2-5 5-5s5 2.2 5 5" />
  </svg>
);

/** Play-circle / runs */
const RunsIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="6" />
    <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" />
  </svg>
);

/** Template / scaffold */
const ScaffoldsIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <path d="M2 6h12" />
    <path d="M6 6v8" />
  </svg>
);

/** Grid / patterns */
const PatternsIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="5" height="5" rx="0.5" />
    <rect x="9" y="2" width="5" height="5" rx="0.5" />
    <rect x="2" y="9" width="5" height="5" rx="0.5" />
    <rect x="9" y="9" width="5" height="5" rx="0.5" />
  </svg>
);

/** Warning triangle / issues */
const IssuesIcon = () => (
  <svg {...iconProps}>
    <path d="M8 2L1.5 13.5h13L8 2z" />
    <path d="M8 7v3" />
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Clock / schedules */
const SchedulesIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5v3.5l2.5 2" />
  </svg>
);

/** Gear / settings */
const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.1 1.1M11.85 11.85l1.1 1.1M3.05 12.95l1.1-1.1M11.85 4.15l1.1-1.1" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Menu structure with sections                                      */
/* ------------------------------------------------------------------ */

interface MenuItem {
  label: string;
  /** App-relative target, built from the host-supplied route builders. */
  to: (routes: TestomniacRoutes, entitySlug: string, envId: string) => string;
  icon: React.FC;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Status', to: (r, s, e) => r.status(s, e), icon: StatusIcon },
      { label: 'Bundles', to: (r, s, e) => r.bundles(s, e), icon: BundlesIcon },
      { label: 'Surfaces', to: (r, s, e) => r.testSurfaces(s, e), icon: SurfacesIcon },
      {
        label: 'Interactions',
        to: (r, s, e) => r.testInteractions(s, e),
        icon: InteractionsIcon,
      },
    ],
  },
  {
    title: 'DESTINATIONS',
    items: [
      { label: 'Pages', to: (r, s, e) => r.pages(s, e), icon: PagesIcon },
      { label: 'Scaffolds', to: (r, s, e) => r.scaffolds(s, e), icon: ScaffoldsIcon },
      { label: 'Patterns', to: (r, s, e) => r.patterns(s, e), icon: PatternsIcon },
    ],
  },
  {
    title: 'DISCOVERIES',
    items: [
      { label: 'Personas', to: (r, s, e) => r.personas(s, e), icon: PersonasIcon },
      { label: 'Scenarios', to: (r, s, e) => r.testScenarios(s, e), icon: ScenariosIcon },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Runs', to: (r, s, e) => r.runs(s, e), icon: RunsIcon },
      { label: 'Issues', to: (r, s, e) => r.issues(s, e), icon: IssuesIcon },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Schedules', to: (r, s, e) => r.schedules(s, e), icon: SchedulesIcon },
      { label: 'Settings', to: (r, s, e) => r.settings(s, e), icon: SettingsIcon },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { envId: routeEnvId } = useRouteParams<{ envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const { pathname } = useTestomniacRouting();
  const routes = useRoutes();

  // Workspaces (entities) the user belongs to. The dashboard is scoped to the
  // selected workspace via the route's :entitySlug.
  const entitiesQuery = useEntities(networkClient, baseUrl, token ?? '', {
    enabled: !!token,
  });
  const entities = useMemo(() => entitiesQuery.data?.data ?? [], [entitiesQuery.data]);
  const entitiesLoading = entitiesQuery.isLoading;

  const productsQuery = useEntityProducts(networkClient, baseUrl, token ?? '', entitySlug, {
    enabled: !!token,
  });
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const productsLoading = productsQuery.isLoading;

  // Explicit user selection, held in a shared store so other surfaces (e.g. the
  // create-product flow) can select a product and have the sidebar reflect it.
  const userSelectedProductId = useProductSelectionStore(s => s.selectedProductId);
  const setUserSelectedProductId = useProductSelectionStore(s => s.setSelectedProductId);

  // Path with the language prefix stripped, used for active-state and route
  // detection below. Computed before the product selection so the create-product
  // route can suppress any auto-selection.
  const currentPath = useMemo(() => {
    const langPrefix = pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return pathname.slice(langPrefix.length - 1);
  }, [pathname]);

  // When on the "create product" route, show the selector as "Create New..."
  // rather than the placeholder, even though no product is selected yet.
  const onProductNewRoute = useMemo(() => {
    const target = routes.productNew(entitySlug);
    return currentPath === target || currentPath.startsWith(`${target}/`);
  }, [currentPath, routes, entitySlug]);

  // Effective selection: none while creating a new product (otherwise the
  // existing product's environments would load and the auto-select effect below
  // would navigate straight back out of the create page); user's choice if still
  // valid; otherwise auto-select a single product.
  const selectedProductId = useMemo(() => {
    if (onProductNewRoute) return null;
    if (userSelectedProductId && products.some(p => String(p.id) === userSelectedProductId)) {
      return userSelectedProductId;
    }
    if (products.length === 1) return String(products[0].id);
    return null;
  }, [products, userSelectedProductId, onProductNewRoute]);

  const environmentsQuery = useProductEnvironments(
    networkClient,
    baseUrl,
    token ?? '',
    Number(selectedProductId),
    { enabled: !!selectedProductId && !!token }
  );
  const environments = useMemo(() => environmentsQuery.data?.data ?? [], [environmentsQuery.data]);
  const environmentsLoading = environmentsQuery.isLoading;

  // The environment selector only appears once a product is chosen; the menu
  // only appears once the route's environment is a real one in the loaded list.
  const selectedEnvValid = !!routeEnvId && environments.some(env => String(env.id) === routeEnvId);

  // Auto-select environment if only one exists and no environment in route
  useEffect(() => {
    if (environments.length === 1 && !routeEnvId) {
      navigate(routes.bundles(entitySlug, environments[0].id));
    }
  }, [environments, routeEnvId, entitySlug, navigate, routes]);

  const handleWorkspaceChange = (value: string) => {
    if (value === entitySlug) return;
    // Reset any product selection so it re-derives for the new workspace, then
    // re-scope the whole dashboard to the chosen entity.
    setUserSelectedProductId(null);
    navigate(routes.entityHome(value));
  };

  const handleProductChange = (value: string) => {
    if (value === 'new') {
      navigate(routes.productNew(entitySlug));
      return;
    }
    setUserSelectedProductId(value);
    // Clear any environment selected for a previously-chosen product so the
    // navigation sections stay hidden until an environment for this product is
    // selected. If the new product has exactly one environment, the auto-select
    // effect below will navigate straight into it.
    if (routeEnvId) {
      navigate(routes.entityHome(entitySlug));
    }
  };

  const handleEnvironmentChange = (value: string) => {
    if (value === 'new') {
      navigate(routes.environmentNew(entitySlug));
      return;
    }
    navigate(routes.bundles(entitySlug, value));
  };

  const isActive = (target: string) => {
    return currentPath === target || currentPath.startsWith(target + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Workspace, Product & Environment Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
            Workspace
          </span>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
            <Select value={entitySlug} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-full border-0 bg-transparent shadow-none text-[13px] font-medium">
                <SelectValue placeholder={entitiesLoading ? 'Loading...' : 'Select workspace'} />
              </SelectTrigger>
              <SelectContent>
                {entities.map(e => (
                  <SelectItem key={e.entitySlug} value={e.entitySlug}>
                    {e.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
            Product
          </span>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
            <Select
              value={onProductNewRoute ? 'new' : (selectedProductId ?? '')}
              onValueChange={handleProductChange}
            >
              <SelectTrigger className="w-full border-0 bg-transparent shadow-none text-[13px] font-medium">
                <SelectValue placeholder={productsLoading ? 'Loading...' : 'Select product'} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Create New...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Environment selector — only once a product is selected */}
        {selectedProductId && (
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
              Environment
            </span>
            {environmentsLoading ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-[13px] text-gray-400 dark:text-gray-500">
                Loading...
              </div>
            ) : environments.length === 0 ? (
              <button
                onClick={() => navigate(routes.environmentNew(entitySlug))}
                className="w-full text-left rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                + Create Environment
              </button>
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
                <Select value={routeEnvId ?? ''} onValueChange={handleEnvironmentChange}>
                  <SelectTrigger className="w-full border-0 bg-transparent shadow-none text-[13px] font-medium">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">+ Create New...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu — only when a valid environment is selected */}
      {selectedProductId && selectedEnvValid && (
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {MENU_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title}>
              {sectionIdx > 0 && (
                <div className="mx-2 my-2 border-t border-gray-100 dark:border-gray-800" />
              )}
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 pt-1.5 pb-1">
                {section.title}
              </span>
              {section.items.map(item => {
                const target = item.to(routes, entitySlug, routeEnvId);
                const active = isActive(target);
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(target)}
                    className={[
                      'group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all duration-150',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {/* Left accent bar for active state */}
                    {active && (
                      <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                    <span
                      className={[
                        'flex-shrink-0 transition-colors duration-150',
                        active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                      ].join(' ')}
                    >
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      )}

      {!(selectedProductId && selectedEnvValid) && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            {!selectedProductId
              ? 'Select a product to get started'
              : 'Select an environment to get started'}
          </p>
        </div>
      )}
    </div>
  );
}

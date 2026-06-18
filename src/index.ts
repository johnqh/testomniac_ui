// ===========================================================================
// Host integration
// ===========================================================================

// Config: API client + auth + SEO injection
export {
  TestomniacUiProvider,
  useTestomniacUiConfig,
  useTestomniacApi,
  SEOHead,
  type TestomniacUiConfig,
  type SEOHeadProps,
} from './context/config';

// Routing: host provides params/navigation (no react-router dependency)
export {
  RoutingProvider,
  useTestomniacRouting,
  useRouteParams,
  Redirect,
  type TestomniacRouting,
  type NavigateOptions,
} from './context/routing';

// ===========================================================================
// Hooks
// ===========================================================================
export { useLocalizedNavigate } from './hooks/useLocalizedNavigate';
export { useEnvBasePath } from './hooks/useEnvBasePath';
export { useDashboardEnvironmentContext } from './hooks/useDashboardEnvironmentContext';

// ===========================================================================
// Components
// ===========================================================================
export * from './components/states';
export * from './components/cells';
export * from './components/data';
export * from './components/scanner';
export { SelectField, type SelectOption } from './components/forms/SelectField';
export { DashboardSidebar } from './components/dashboard/DashboardSidebar';
export { ScriptPanel } from './components/scripts/ScriptPanel';
export { AddScenarioForm } from './components/scenarios/AddScenarioForm';
export { AddToBundleButton } from './components/bundles/AddToBundleButton';
export { PagesListView } from './components/pages/PagesListView';
export { PagesMapView } from './components/pages/PagesMapView';
export { default as BackLink } from './components/navigation/BackLink';

// ===========================================================================
// Config + utils
// ===========================================================================
export { getPriorityConfig, type PriorityConfig } from './config/priorityConfig';
export { formatDateTime } from './utils/formatDateTime';

// ===========================================================================
// Pages
// ===========================================================================
export { DashboardOverview } from './pages/DashboardOverview';
export { StartScanPage } from './pages/StartScanPage';
export { ScanProgressPage } from './pages/ScanProgressPage';
export { BundlesPage } from './pages/BundlesPage';
export { BundleDetailPage } from './pages/BundleDetailPage';
export { TestSurfacesListPage } from './pages/TestSurfacesListPage';
export { TestSurfaceDetailPage } from './pages/TestSurfaceDetailPage';
export { TestInteractionsPage } from './pages/TestInteractionsPage';
export { TestInteractionDetailPage } from './pages/TestInteractionDetailPage';
export { TestRunsListPage } from './pages/TestRunsListPage';
export { TestRunDetailPage } from './pages/TestRunDetailPage';
export { RunSurfaceRunsPage } from './pages/RunSurfaceRunsPage';
export { RunSurfaceRunDetailPage } from './pages/RunSurfaceRunDetailPage';
export { RunTestInteractionRunsPage } from './pages/RunTestInteractionRunsPage';
export { RunTestInteractionRunDetailPage } from './pages/RunTestInteractionRunDetailPage';
export { PagesPage } from './pages/PagesPage';
export { PageDetailPage } from './pages/PageDetailPage';
export { PageStateDetailPage } from './pages/PageStateDetailPage';
export { FindingsListPage } from './pages/FindingsListPage';
export { ScaffoldsPage } from './pages/ScaffoldsPage';
export { ScaffoldDetailPage } from './pages/ScaffoldDetailPage';
export { PatternsPage } from './pages/PatternsPage';
export { PersonasPage } from './pages/PersonasPage';
export { RunnerGraphPage } from './pages/RunnerGraphPage';
export { PageGraphPage } from './pages/PageGraphPage';
export { SchedulesPage } from './pages/SchedulesPage';
export { TestScenariosPage } from './pages/TestScenariosPage';
export { TestScenarioDetailPage } from './pages/TestScenarioDetailPage';
export { RunRedirect } from './pages/RunRedirect';

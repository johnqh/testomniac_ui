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
} from './context/config.js';

// Routing: host provides params/navigation (no react-router dependency)
export {
  RoutingProvider,
  useTestomniacRouting,
  useRouteParams,
  useRoutes,
  useEnvRoutes,
  Redirect,
  type TestomniacRouting,
  type TestomniacRoutes,
  type NavigateOptions,
} from './context/routing.js';

// ===========================================================================
// Hooks
// ===========================================================================
export { useLocalizedNavigate } from './hooks/useLocalizedNavigate.js';
export { useEnvBasePath } from './hooks/useEnvBasePath.js';
export { useDashboardEnvironmentContext } from './hooks/useDashboardEnvironmentContext.js';

// ===========================================================================
// Components
// ===========================================================================
export * from './components/states/index.js';
export * from './components/cells/index.js';
export * from './components/data/index.js';
export * from './components/scanner/index.js';
export { SelectField, type SelectOption } from './components/forms/SelectField.js';
export { AddButton } from './components/ui/AddButton.js';
export { DashboardSidebar } from './components/dashboard/DashboardSidebar.js';
export { ScriptPanel } from './components/scripts/ScriptPanel.js';
export { AddScenarioForm } from './components/scenarios/AddScenarioForm.js';
export { AddToBundleButton } from './components/bundles/AddToBundleButton.js';
export { CredentialManagementSection } from './components/credentials/index.js';
export { EntityApiKeysPanel } from './components/apiKeys/index.js';
export { PagesListView } from './components/pages/PagesListView.js';
export { PagesMapView } from './components/pages/PagesMapView.js';
export { default as BackLink } from './components/navigation/BackLink.js';

// ===========================================================================
// Config + utils
// ===========================================================================
export { getPriorityConfig, type PriorityConfig } from './config/priorityConfig.js';
export { formatDateTime } from './utils/formatDateTime.js';

// ===========================================================================
// Pages
// ===========================================================================
export { DashboardOverview } from './pages/DashboardOverview.js';
export { StartScanPage } from './pages/StartScanPage.js';
export { CreateProductPage } from './pages/CreateProductPage.js';
export { ProductSettingsPage } from './pages/ProductSettingsPage.js';
export { StatusPage } from './pages/StatusPage.js';
export { ScanProgressPage } from './pages/ScanProgressPage.js';
export { BundlesPage } from './pages/BundlesPage.js';
export { BundleDetailPage } from './pages/BundleDetailPage.js';
export { TestSurfacesListPage } from './pages/TestSurfacesListPage.js';
export { TestSurfaceDetailPage } from './pages/TestSurfaceDetailPage.js';
export { TestInteractionsPage } from './pages/TestInteractionsPage.js';
export { TestInteractionDetailPage } from './pages/TestInteractionDetailPage.js';
export { TestRunsListPage } from './pages/TestRunsListPage.js';
export { TestRunDetailPage } from './pages/TestRunDetailPage.js';
export { RunSurfaceRunsPage } from './pages/RunSurfaceRunsPage.js';
export { RunSurfaceRunDetailPage } from './pages/RunSurfaceRunDetailPage.js';
export { RunTestInteractionRunsPage } from './pages/RunTestInteractionRunsPage.js';
export { RunTestInteractionRunDetailPage } from './pages/RunTestInteractionRunDetailPage.js';
export { PagesPage } from './pages/PagesPage.js';
export { PageDetailPage } from './pages/PageDetailPage.js';
export { PageStateDetailPage } from './pages/PageStateDetailPage.js';
export { FindingsListPage } from './pages/FindingsListPage.js';
export { ScaffoldsPage } from './pages/ScaffoldsPage.js';
export { ScaffoldDetailPage } from './pages/ScaffoldDetailPage.js';
export { PatternsPage } from './pages/PatternsPage.js';
export { PersonasPage } from './pages/PersonasPage.js';
export { RunnerGraphPage } from './pages/RunnerGraphPage.js';
export { PageGraphPage } from './pages/PageGraphPage.js';
export { SchedulesPage } from './pages/SchedulesPage.js';
export { TestScenariosPage } from './pages/TestScenariosPage.js';
export { TestScenarioDetailPage } from './pages/TestScenarioDetailPage.js';
export { RunnerSettingsPage } from './pages/RunnerSettingsPage.js';
export { RunRedirect } from './pages/RunRedirect.js';

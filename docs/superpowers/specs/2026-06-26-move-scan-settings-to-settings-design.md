# Move scan settings out of Bundles, split by scope

## Problem

`BundlesPage` currently hosts three scan-settings panels — **Product Scan Defaults**,
**Environment Overrides**, and **Effective Scan Settings**. These are configuration,
not bundle content, and were placed there incidentally. They should live under
Settings, split by their natural scope.

## Decisions (approved)

- **Split by scope.** Product Scan Defaults → a new product-level settings page.
  Environment Overrides + Effective Scan Settings → the existing Environment Settings page.
- **Remove from Bundles entirely.** No read-only summary left behind.
- **Navigation:** a gear icon next to the Product selector in the sidebar opens Product Settings.
- **Product Settings page is minimal** for now: only Product Scan Defaults.

## Design

### New product-level route
- Path: `/dashboard/:entitySlug/products/:productId/settings` (productId in the URL →
  bookmarkable / refresh-safe, not dependent on the sidebar selection store).
- Touches the 3 routing-contract points:
  - `TestomniacRoutes` interface (`testomniac_ui/src/context/routing.tsx`): add
    `productSettings(entitySlug, productId): string`.
  - App builder (`testomniac_app/src/lib/testomniacRoutes.ts`): implement it.
  - App route (`testomniac_app/src/App.tsx`): `products/:productId/settings` →
    `<UiRoute><ProductSettingsPage/></UiRoute>`.

### Components (testomniac_ui)
- Lift presentational `ScanSettingsPanel` out of `BundlesPage` into
  `components/scan-settings/ScanSettingsPanel.tsx` (shared).
- `components/scan-settings/ProductScanDefaultsSection.tsx` — owns product scan-settings
  query/state/save; reads `productId` from the route (`useRouteParams`); renders one panel.
- `components/scan-settings/EnvironmentScanSettingsSection.tsx` — owns env scan-settings +
  effective query/state/save; reads `productId`+`envId` from `useDashboardEnvironmentContext`;
  renders the Environment Overrides panel + the Effective Scan Settings card.
- `pages/ProductSettingsPage.tsx` — renders `ProductScanDefaultsSection` only.
- `pages/RunnerSettingsPage.tsx` — add `EnvironmentScanSettingsSection` below the existing
  `CredentialManagementSection`.
- `pages/BundlesPage.tsx` — remove all scan-settings code, state, queries, and the local
  `ScanSettingsPanel`; page returns to bundles only.

### Sidebar (testomniac_ui `DashboardSidebar`)
- Add a gear icon button next to the Product `<Select>`, shown when `selectedProductId` is set,
  navigating to `routes.productSettings(entitySlug, selectedProductId)`.

### Exports
- Export `ProductSettingsPage` from `testomniac_ui/src/index.ts` (consumed by the app, like the
  other pages).

## Out of scope
- No `testomniac_lib` change.
- No new product-level settings beyond Scan Defaults.
- No data-router migration; navigation is plain `navigate()`.

## Verification
- `testomniac_ui`: typecheck + lint + build.
- App: typecheck; manual check that Product Settings (gear) shows Scan Defaults, Environment
  Settings shows Overrides + Effective, and Bundles no longer shows any scan settings.

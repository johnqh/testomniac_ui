# Testomniac UI

Shared dashboard UI library for Testomniac apps.

**Package**: `@sudobility/testomniac_ui` (restricted, BUSL-1.1)

## What this is

The environment-scoped dashboard pages + components extracted from
`testomniac_app` so they can be reused by `testomniac_extension` (and any other
host). It contains the **presentation layer only** — no routing, no i18n, no app
constants.

## Architecture: host-agnostic via two contexts

The library NEVER imports `react-router-dom`, `@sudobility/building_blocks`, or
`@/config/constants`. Anything host-specific is injected:

- **`src/context/config.tsx`** — `TestomniacUiProvider` carries `{ networkClient, token, apiUrl, SeoHead? }`.
  - `useTestomniacApi()` → `{ networkClient, token, baseUrl }` (replaces the app's `useApi()` + `CONSTANTS.API_URL`).
  - `<SEOHead/>` delegates to the host `SeoHead`, or renders nothing (extension).
- **`src/context/routing.tsx`** — `RoutingProvider` carries `{ params, pathname, navigate, currentLanguage, switchLanguage? }`.
  - `useRouteParams<T>()` replaces react-router `useParams`.
  - `<Redirect to=… />` replaces react-router `<Navigate>`.
  - `src/hooks/useLocalizedNavigate.ts` and `useEnvBasePath.ts` read this context.

Routing (route definitions + the real `navigate`) lives in the **host app**, not
here — the host wires its router into `RoutingProvider` per route.

## Structure

```
src/
├── index.ts          # barrel: providers, hooks, components, pages
├── context/          # config + routing contexts (host integration)
├── hooks/            # useLocalizedNavigate, useEnvBasePath, useDashboardEnvironmentContext
├── components/       # cells, data, scanner, states, forms, scripts, scenarios,
│                     #   bundles, dashboard (sidebar), pages (views), navigation
├── config/           # priorityConfig
├── utils/            # formatDateTime
└── pages/            # ~29 dashboard pages (named exports)
```

## Commands

```bash
bun run build      # tsc -p tsconfig.build.json -> dist/
bun run verify     # typecheck + lint + format:check
bun run test       # vitest
```

## Conventions

- **Pages are named exports** (`export function FooPage()`), consumed via the barrel.
- Pages get data through `@sudobility/testomniac_client` / `_lib` hooks, passing
  `{ networkClient, token, baseUrl }` from `useTestomniacApi()`.
- Use `useRouteParams`, `useLocalizedNavigate`, `useEnvBasePath`, `<SEOHead/>`,
  `<Redirect/>` — never `react-router-dom` directly.
- Styling is Tailwind class names from `@sudobility/components` / `@sudobility/design`;
  the library emits no CSS.

## Consumers

- **testomniac_app** — wraps pages with a react-router `UiRoute` adapter (see its `src/lib/testomniacUi.tsx`).
- **testomniac_extension** — (planned) state-based routing adapter, no `SeoHead`.

## Related projects

- **testomniac_client** — API client + query hooks
- **testomniac_lib** — business logic (managers, analysis, formatting, priority, graph layout)
- **testomniac_types** — shared types

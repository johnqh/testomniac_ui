# @sudobility/testomniac_ui

Shared **dashboard UI** for Testomniac apps — the environment-scoped pages
(test surfaces, runs, findings, pages, scaffolds, patterns, personas, schedules,
bundles, scenarios, graphs) and their components, extracted from `testomniac_app`
so they can be reused in `testomniac_extension` and other hosts.

The library is **router-agnostic and i18n-free**: it never imports
`react-router-dom`, `@sudobility/building_blocks`, or app constants. The host
supplies routing, the API client, and (optionally) SEO via two context
providers.

## Install

```bash
bun add @sudobility/testomniac_ui
```

Peer deps: `react`, `react-dom`, `@tanstack/react-query`, `@tanstack/react-table`,
`@xyflow/react`, `@heroicons/react`, and `@sudobility/{components,design,testomniac_client,testomniac_lib,testomniac_types,types}`.

## Host integration

The library reads everything host-specific from two contexts:

| Concern | Provider | Library hook used by pages |
| --- | --- | --- |
| API client + auth + SEO | `TestomniacUiProvider` | `useTestomniacApi()` → `{ networkClient, token, baseUrl }`, `<SEOHead/>` |
| Routing (params + navigate) | `RoutingProvider` | `useRouteParams()`, `useLocalizedNavigate()`, `useEnvBasePath()`, `<Redirect/>` |

`TestomniacUiProvider` is mounted once (it carries the network client + token +
API URL + optional SEO component). `RoutingProvider` is mounted per rendered
page/route, fed by whatever routing the host uses.

### Web app (react-router)

```tsx
// Bridge (mounted once, inside the auth provider so useApi resolves)
<TestomniacUiProvider
  networkClient={networkClient}
  token={token ?? ''}
  apiUrl={API_URL}
  SeoHead={SEOHead}            // your Helmet-based component
>
  <Routes>…</Routes>
</TestomniacUiProvider>

// Per-route adapter (feeds react-router params + navigation into the lib)
function UiRoute({ children }) {
  const params = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <RoutingProvider
      params={params}
      pathname={pathname}
      currentLanguage={lang}
      navigate={(p, o) => navigate(`/${lang}${p}`, o)}
    >
      {children}
    </RoutingProvider>
  );
}

<Route path="environments/:envId/test-surfaces"
       element={<UiRoute><TestSurfacesListPage /></UiRoute>} />
```

### Extension (no router)

Provide `RoutingProvider` with state-based params + a `navigate` that updates
your view state (mount pages under a `MemoryRouter`-free setup; the library
needs no router). Omit `SeoHead` so `<SEOHead/>` renders nothing.

## Build

```bash
bun run build     # tsc -> dist/ (ESM + .d.ts)
bun run verify    # typecheck + lint + format:check
```

No bundler, no Tailwind emission — the host app's Tailwind picks up the class
names (add `node_modules/@sudobility/testomniac_ui` to its `content` globs).

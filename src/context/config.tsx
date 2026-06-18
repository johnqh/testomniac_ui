import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import type { NetworkClient } from '@sudobility/types';

/**
 * Props accepted by a host-provided SEO head component. Mirrors the shape the
 * Testomniac pages pass; the host decides how (or whether) to render it.
 */
export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Host-supplied configuration the dashboard UI needs but does not own:
 * the network client, auth token, API base URL, and an optional SEO component.
 *
 * This decouples the library from any specific app shell (e.g. the web app's
 * `building_blocks` `useApi` + react-helmet, or the extension's own client).
 */
export interface TestomniacUiConfig {
  networkClient: NetworkClient;
  /** Firebase ID token; empty string when unauthenticated. */
  token: string;
  /** API base URL, e.g. `https://api.testomniac.com`. */
  apiUrl: string;
  /**
   * Optional host SEO head (e.g. a Helmet-based component in the web app).
   * When omitted (e.g. in the extension), {@link SEOHead} renders nothing.
   */
  SeoHead?: ComponentType<SEOHeadProps>;
}

const TestomniacUiConfigContext = createContext<TestomniacUiConfig | null>(null);

export function TestomniacUiProvider({
  children,
  networkClient,
  token,
  apiUrl,
  SeoHead,
}: TestomniacUiConfig & { children: ReactNode }) {
  const value = useMemo<TestomniacUiConfig>(
    () => ({ networkClient, token, apiUrl, SeoHead }),
    [networkClient, token, apiUrl, SeoHead]
  );
  return (
    <TestomniacUiConfigContext.Provider value={value}>
      {children}
    </TestomniacUiConfigContext.Provider>
  );
}

export function useTestomniacUiConfig(): TestomniacUiConfig {
  const ctx = useContext(TestomniacUiConfigContext);
  if (!ctx) {
    throw new Error('Testomniac UI: components must be rendered inside <TestomniacUiProvider>');
  }
  return ctx;
}

/**
 * Returns `{ networkClient, token, baseUrl }` ready to pass to
 * `@sudobility/testomniac_client` / `_lib` hooks. Replaces the app's
 * `useApi()` + `CONSTANTS.API_URL`.
 */
export function useTestomniacApi(): {
  networkClient: NetworkClient;
  token: string;
  baseUrl: string;
} {
  const { networkClient, token, apiUrl } = useTestomniacUiConfig();
  return { networkClient, token, baseUrl: apiUrl };
}

/**
 * Library SEO component. Delegates to the host-provided `SeoHead`, or renders
 * nothing when the host doesn't supply one (e.g. the extension sidepanel).
 */
export function SEOHead(props: SEOHeadProps) {
  const { SeoHead } = useTestomniacUiConfig();
  return SeoHead ? <SeoHead {...props} /> : null;
}

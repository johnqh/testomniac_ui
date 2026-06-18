import { useMemo } from 'react';
import { useTestomniacRouting } from '../context/routing';

const noop = () => {};

/**
 * Language-aware navigation, backed by the host routing context.
 *
 * Mirrors the web app's hook API (`{ navigate, switchLanguage, currentLanguage }`)
 * but does not depend on react-router — the host wires the actual navigation.
 */
export function useLocalizedNavigate() {
  const { navigate, switchLanguage, currentLanguage } = useTestomniacRouting();
  return useMemo(
    () => ({ navigate, switchLanguage: switchLanguage ?? noop, currentLanguage }),
    [navigate, switchLanguage, currentLanguage]
  );
}

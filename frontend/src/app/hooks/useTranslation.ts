import { useI18n } from "../contexts/I18nContext";

/**
 * Hook для использования переводов в компонентах
 *
 * @example
 * ```tsx
 * const { t } = useTranslation();
 * return <h1>{t('landing.operators.web.hero.title')}</h1>;
 * ```
 */
export function useTranslation() {
  const { t, language, isLoading } = useI18n();
  return { t, language, isLoading };
}

/**
 * `t()` returns the key itself when the key is missing, which would put a raw
 * "cookies.analytics.notice" in front of a user. Use this for keys that are
 * referenced in code but not synced from Localazy yet.
 */
export function translateWithFallback(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value === key ? fallback : value;
}

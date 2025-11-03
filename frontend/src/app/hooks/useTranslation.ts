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

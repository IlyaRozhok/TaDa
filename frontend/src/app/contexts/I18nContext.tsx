"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Синхронный импорт начальных переводов для предотвращения мигания (все локали из frontend/src/translations)
import arTranslations from "../../translations/ar.json";
import deTranslations from "../../translations/de.json";
import enTranslations from "../../translations/en.json";
import esTranslations from "../../translations/es.json";
import frTranslations from "../../translations/fr.json";
import hiTranslations from "../../translations/hi.json";
import plTranslations from "../../translations/pl.json";
import ruTranslations from "../../translations/ru.json";
import trTranslations from "../../translations/tr.json";
import ukTranslations from "../../translations/uk.json";
import zhTranslations from "../../translations/zh-Hans-CN.json";

type LanguageCode =
  | "ar"
  | "de"
  | "en"
  | "es"
  | "fr"
  | "hi"
  | "pl"
  | "ru"
  | "tr"
  | "uk"
  | "zh-Hans-CN";

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  language: LanguageCode;
  translations: Translations;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "tada_language";

// Маппинг кодов языков Header -> файлы переводов
const LANGUAGE_MAP: Record<string, LanguageCode> = {
  AR: "ar",
  DE: "de",
  EN: "en",
  ES: "es",
  FR: "fr",
  HI: "hi",
  PL: "pl",
  RU: "ru",
  TR: "tr",
  UK: "uk",
  ZH: "zh-Hans-CN",
};

// Обратный маппинг для отображения
const LANGUAGE_DISPLAY_MAP: Record<LanguageCode, string> = {
  ar: "AR",
  de: "DE",
  en: "EN",
  es: "ES",
  fr: "FR",
  hi: "HI",
  pl: "PL",
  ru: "RU",
  tr: "TR",
  uk: "UK",
  "zh-Hans-CN": "ZH",
};

// Предзагруженные переводы для всех языков (Localazy: frontend/src/translations)
const PRELOADED_TRANSLATIONS: Record<LanguageCode, Translations> = {
  ar: arTranslations as Translations,
  de: deTranslations as Translations,
  en: enTranslations as Translations,
  es: esTranslations as Translations,
  fr: frTranslations as Translations,
  hi: hiTranslations as Translations,
  pl: plTranslations as Translations,
  ru: ruTranslations as Translations,
  tr: trTranslations as Translations,
  uk: ukTranslations as Translations,
  "zh-Hans-CN": zhTranslations as Translations,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage on client so header language change is never overwritten by init effect
  const [language, setLanguageState] =
    useState<LanguageCode>(getInitialLanguage);
  const [translations, setTranslations] = useState<Translations>(
    () => PRELOADED_TRANSLATIONS[getInitialLanguage()],
  );
  const [isLoading, setIsLoading] = useState(false);

  // Keep translations in sync when language changes (e.g. from header or storage event)
  useEffect(() => {
    if (PRELOADED_TRANSLATIONS[language]) {
      setTranslations(PRELOADED_TRANSLATIONS[language]);
      setIsLoading(false);
    }
  }, [language]);

  // Sync language from other tabs (storage event)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LANGUAGE_STORAGE_KEY &&
        e.newValue &&
        isValidLanguageCode(e.newValue)
      ) {
        setLanguageState(e.newValue as LanguageCode);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[key] || key;
    },
    [translations],
  );

  const value: I18nContextType = {
    language,
    translations,
    setLanguage,
    t,
    isLoading,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Вспомогательные функции
export function getLanguageDisplayCode(lang: LanguageCode): string {
  return LANGUAGE_DISPLAY_MAP[lang] || "EN";
}

export function getLanguageCodeFromDisplay(displayCode: string): LanguageCode {
  return LANGUAGE_MAP[displayCode] || "en";
}

export function isValidLanguageCode(code: string): code is LanguageCode {
  return [
    "ar",
    "de",
    "en",
    "es",
    "fr",
    "hi",
    "pl",
    "ru",
    "tr",
    "uk",
    "zh-Hans-CN",
  ].includes(code);
}

/** Initial language: from localStorage on client, "en" on SSR. Ensures no race with useEffect. */
function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && isValidLanguageCode(saved)) return saved as LanguageCode;
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  if (browserLang === "zh") return "zh-Hans-CN";
  const mapped =
    (Object.values(LANGUAGE_MAP).find(
      (code) => code === browserLang,
    ) as LanguageCode) || "en";
  return mapped;
}

// Все локали из frontend/src/translations (Localazy) — для дропдауна выбора языка
export const SUPPORTED_LANGUAGES: Array<{
  code: string;
  name: string;
  langCode: LanguageCode;
}> = [
  { code: "AR", name: "العربية", langCode: "ar" },
  { code: "DE", name: "Deutsch", langCode: "de" },
  { code: "EN", name: "English", langCode: "en" },
  { code: "ES", name: "Español", langCode: "es" },
  { code: "FR", name: "Français", langCode: "fr" },
  { code: "HI", name: "हिन्दी", langCode: "hi" },
  { code: "PL", name: "Polski", langCode: "pl" },
  { code: "RU", name: "Русский", langCode: "ru" },
  { code: "TR", name: "Türkçe", langCode: "tr" },
  { code: "UK", name: "Українська", langCode: "uk" },
  { code: "ZH", name: "中文", langCode: "zh-Hans-CN" },
];

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type LanguageCode = "en" | "es" | "pl" | "ru" | "uk" | "zh-Hans-CN";

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
  EN: "en",
  ES: "es",
  PL: "pl",
  RU: "ru",
  UK: "uk",
  ZH: "zh-Hans-CN",
};

// Обратный маппинг для отображения
const LANGUAGE_DISPLAY_MAP: Record<LanguageCode, string> = {
  en: "EN",
  es: "ES",
  pl: "PL",
  ru: "RU",
  uk: "UK",
  "zh-Hans-CN": "ZH",
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка языка из localStorage при инициализации (только на клиенте)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang && isValidLanguageCode(savedLang)) {
      setLanguageState(savedLang as LanguageCode);
    } else {
      // Определение языка браузера
      const browserLang = navigator.language.split("-")[0].toLowerCase();
      const mappedLang =
        Object.values(LANGUAGE_MAP).find((code) => code === browserLang) ||
        "en";
      setLanguageState(mappedLang as LanguageCode);
    }
  }, []);

  // Загрузка переводов
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // Динамический импорт с маппингом для Next.js
        let translationsModule;
        switch (language) {
          case "en":
            translationsModule = await import("../../translations/en.json");
            break;
          case "es":
            translationsModule = await import("../../translations/es.json");
            break;
          case "pl":
            translationsModule = await import("../../translations/pl.json");
            break;
          case "ru":
            translationsModule = await import("../../translations/ru.json");
            break;
          case "uk":
            translationsModule = await import("../../translations/uk.json");
            break;
          case "zh-Hans-CN":
            translationsModule = await import(
              "../../translations/zh-Hans-CN.json"
            );
            break;
          default:
            translationsModule = await import("../../translations/en.json");
        }
        setTranslations(translationsModule.default || translationsModule);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback на английский
        try {
          const fallback = await import("../../translations/en.json");
          setTranslations(fallback.default || fallback);
        } catch (fallbackError) {
          console.error("Failed to load fallback translations:", fallbackError);
          setTranslations({});
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[key] || key;
    },
    [translations]
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
  return ["en", "es", "pl", "ru", "uk", "zh-Hans-CN"].includes(code);
}

// Экспорт для использования в Header
export const SUPPORTED_LANGUAGES = [
  { code: "EN", name: "English", langCode: "en" as LanguageCode },
  { code: "PL", name: "Polish", langCode: "pl" as LanguageCode },
  { code: "RU", name: "Русский", langCode: "ru" as LanguageCode },
  { code: "ZH", name: "中文", langCode: "zh-Hans-CN" as LanguageCode },
];

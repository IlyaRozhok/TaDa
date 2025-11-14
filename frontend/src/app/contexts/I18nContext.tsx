"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Синхронный импорт начальных переводов для предотвращения мигания
import enTranslations from "../../translations/en.json";
import esTranslations from "../../translations/es.json";
import plTranslations from "../../translations/pl.json";
import ruTranslations from "../../translations/ru.json";
import ukTranslations from "../../translations/uk.json";
import zhTranslations from "../../translations/zh-Hans-CN.json";

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

// Предзагруженные переводы для всех языков
const PRELOADED_TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
  pl: plTranslations as Translations,
  ru: ruTranslations as Translations,
  uk: ukTranslations as Translations,
  "zh-Hans-CN": zhTranslations as Translations,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Начинаем с английского по умолчанию (для SSR)
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [translations, setTranslations] = useState<Translations>(
    PRELOADED_TRANSLATIONS["en"]
  );
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация языка из localStorage или браузера (только на клиенте)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    let targetLang: LanguageCode = "en";

    if (savedLang && isValidLanguageCode(savedLang)) {
      targetLang = savedLang as LanguageCode;
    } else {
      // Определение языка браузера
      const browserLang = navigator.language.split("-")[0].toLowerCase();
      const mappedLang =
        Object.values(LANGUAGE_MAP).find((code) => code === browserLang) ||
        "en";
      targetLang = mappedLang;
    }

    if (targetLang !== language) {
      setLanguageState(targetLang);
      setTranslations(PRELOADED_TRANSLATIONS[targetLang]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновление переводов при смене языка (используем предзагруженные)
  useEffect(() => {
    if (PRELOADED_TRANSLATIONS[language]) {
      setTranslations(PRELOADED_TRANSLATIONS[language]);
      setIsLoading(false);
    }
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

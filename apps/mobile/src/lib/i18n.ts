import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { LanguageDetectorAsyncModule } from "i18next";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import en from "@/lib/locales/en.json";
import hi from "@/lib/locales/hi.json";
import mr from "@/lib/locales/mr.json";

const SUPPORTED_LANGUAGES = ["en", "hi", "mr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
} as const;

function resolveDeviceLanguage(): SupportedLanguage {
  const deviceCode = Localization.getLocales()[0]?.languageCode;
  if (deviceCode && (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceCode)) {
    return deviceCode as SupportedLanguage;
  }
  return "en";
}

const languageDetector: LanguageDetectorAsyncModule = {
  type: "languageDetector",
  async: true,
  detect: (callback: (lng: string) => void) => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.languagePreference);
        if (saved) {
          callback(saved);
          return;
        }
      } catch {
        // fall through to device locale
      }
      callback(resolveDeviceLanguage());
    })();
  },
  cacheUserLanguage: (lng: string) => {
    void AsyncStorage.setItem(STORAGE_KEYS.languagePreference, lng);
  },
};

// eslint-disable-next-line import/no-named-as-default-member -- i18next's default export intentionally exposes `.use`
void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;

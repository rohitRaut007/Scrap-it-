export const locales = ["en", "hi", "mr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

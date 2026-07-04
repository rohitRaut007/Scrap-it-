import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import type { StatusBarStyle } from "expo-status-bar";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export type AppTheme = "light" | "dark";

type ThemeColors = {
  background: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  icon: string;
  subtleIcon: string;
};

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  colors: ThemeColors;
  statusBarStyle: StatusBarStyle;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

// Scrap-it Paper palette — source of truth: packages/design-tokens.
const SCRAP_IT_PAPER: ThemeColors = {
  background: "#F3EEDF", // paper
  card: "#EAE4D2", // paper-2
  foreground: "#1A1918", // ink
  mutedForeground: "#4A4744", // ink-soft
  border: "#C9C1AB", // rule
  input: "#C9C1AB",
  primary: "#B84E1C", // rust
  primaryForeground: "#F3EEDF", // paper on rust
  destructive: "#8F3D15", // rust-dark
  icon: "#1A1918",
  subtleIcon: "#4A4744",
};

// v1 ships light-only. Dark mode is DEFERRED TO v1.1 — the newsprint
// aesthetic doesn't auto-invert, so a dark palette needs explicit design
// sign-off. Until then "dark" resolves to the same paper palette so the
// existing toggle/persistence plumbing keeps working without a dark UI.
const THEME_COLORS: Record<AppTheme, ThemeColors> = {
  light: SCRAP_IT_PAPER,
  dark: SCRAP_IT_PAPER,
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): AppTheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function isAppTheme(value: string | null): value is AppTheme {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(
          STORAGE_KEYS.themePreference
        );
        const nextTheme = isAppTheme(storedTheme)
          ? storedTheme
          : getInitialTheme();

        if (!mounted) {
          return;
        }

        setThemeState(nextTheme);
        // v1 is light-only (dark deferred) — never activate `dark:` classes.
        setColorScheme("light");
      } catch (error) {
        if (!mounted) {
          return;
        }

        const fallbackTheme = getInitialTheme();
        setThemeState(fallbackTheme);
        setColorScheme("light");
        console.warn("Unable to restore saved theme preference.", error);
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setColorScheme]);

  const setTheme = useCallback(async (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    // v1 is light-only (dark deferred) — never activate `dark:` classes.
    setColorScheme("light");

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.themePreference, nextTheme);
    } catch (error) {
      console.warn("Unable to save theme preference.", error);
    }
  }, [setColorScheme]);

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      colors: THEME_COLORS[theme],
      // Paper background in both modes (dark deferred) → dark status icons.
      statusBarStyle: "dark",
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  if (!ready) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return value;
}

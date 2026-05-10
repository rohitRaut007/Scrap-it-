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

const THEME_COLORS: Record<AppTheme, ThemeColors> = {
  light: {
    background: "#fafaf9",
    card: "#ffffff",
    foreground: "#1c1c1c",
    mutedForeground: "#737373",
    border: "#eaeaea",
    input: "#eaeaea",
    primary: "#4a9f7a",
    primaryForeground: "#fafafa",
    destructive: "#dc2626",
    icon: "#1c1c1c",
    subtleIcon: "#737373",
  },
  dark: {
    background: "#0a0a0a",
    card: "#171717",
    foreground: "#f5f5f5",
    mutedForeground: "#a3a3a3",
    border: "#2a2a2a",
    input: "#333333",
    primary: "#63c096",
    primaryForeground: "#052e1d",
    destructive: "#f87171",
    icon: "#f5f5f5",
    subtleIcon: "#a3a3a3",
  },
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
        setColorScheme(nextTheme);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const fallbackTheme = getInitialTheme();
        setThemeState(fallbackTheme);
        setColorScheme(fallbackTheme);
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
    setColorScheme(nextTheme);

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
      statusBarStyle: theme === "dark" ? "light" : "dark",
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

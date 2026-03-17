import { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "commute-checker-theme";

const ThemeContext = createContext({ theme: "light", resolvedTheme: "light", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export { ThemeContext };

function isNightHours() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5;
}

function resolveTheme(preference) {
  if (preference === "auto") {
    return isNightHours() ? "dark" : "light";
  }
  return preference;
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "auto";
    } catch {
      return "auto";
    }
  });

  const resolvedTheme = resolveTheme(theme);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Re-evaluate auto mode every minute
  useEffect(() => {
    if (theme !== "auto") return;

    const interval = setInterval(() => {
      setThemeState((current) => {
        if (current !== "auto") return current;
        // Force re-render to re-evaluate resolvedTheme
        return "auto";
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}

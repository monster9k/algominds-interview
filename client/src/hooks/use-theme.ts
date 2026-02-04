/**
 * Custom Hook: useTheme
 * Manages application theme state (light/dark mode)
 * Persists theme preference in localStorage
 */
import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get saved theme from localStorage or default to 'system'
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Use system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      // Use selected theme
      root.classList.add(theme);
    }

    // Save theme preference
    localStorage.setItem("theme", theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme: () => {
      setTheme((prev) => {
        if (prev === "light") return "dark";
        if (prev === "dark") return "system";
        return "light";
      });
    },
  };
}

/**
 * Usage example:
 * const { theme, setTheme, toggleTheme } = useTheme();
 * <button onClick={toggleTheme}>Toggle Theme</button>
 */

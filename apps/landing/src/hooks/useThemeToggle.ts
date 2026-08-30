import { useState, useEffect, useCallback } from "react";

type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "brainbuzz_theme_mode";

function applyTheme(mode: ThemeMode) {
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ThemeMode) || "system";
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const cycleTheme = useCallback(() => {
    setMode((current) => (current === "system" ? "light" : current === "light" ? "dark" : "system"));
  }, []);

  return { mode, cycleTheme };
}

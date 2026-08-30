import { useThemeToggle } from "../hooks/useThemeToggle";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { mode, cycleTheme } = useThemeToggle();
  const icon = mode === "light" ? <Sun size={18} /> : mode === "dark" ? <Moon size={18} /> : <Monitor size={18} />;
  const label = mode === "light" ? "Light" : mode === "dark" ? "Dark" : "Auto";

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 text-sm"
      title={`Theme: ${label} (click to change)`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

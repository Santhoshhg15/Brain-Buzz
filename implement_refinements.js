const fs = require("fs");
const path = require("path");

// 1. Create useCountUp.ts
const hookContent = `import { useState, useEffect, useRef } from "react";

export function useCountUp(targetValue: number, durationMs: number = 700): number {
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + (targetValue - startValue) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = targetValue;
      }
    }

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetValue, durationMs]);

  return displayValue;
}
`;

["host", "play", "display"].forEach(app => {
  const hooksDir = `apps/${app}/src/hooks`;
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(path.join(hooksDir, "useCountUp.ts"), hookContent);
});

// 2. Font Loading Strategy & Skeletons in index.css
const cssAdditions = `
@keyframes skeletonPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.skeleton {
  background-color: var(--color-border);
  border-radius: 0.5rem;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
`;

["host", "play", "display"].forEach(app => {
  const cssFile = `apps/${app}/src/index.css`;
  if (fs.existsSync(cssFile)) {
    let css = fs.readFileSync(cssFile, "utf8");
    if (!css.includes("skeletonPulse")) {
      css += cssAdditions;
    }
    
    css = css.replace(/--font-sans: 'Inter', sans-serif;/g, "--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;");
    css = css.replace(/--font-heading: 'Space Grotesk', sans-serif;/g, "--font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;");
    css = css.replace(/--font-mono: 'JetBrains Mono', monospace;/g, "--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;");
    
    fs.writeFileSync(cssFile, css);
  }
});

// 4. Auto Dark Mode in main.tsx
const darkModeScript = `
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (prefersDark) {
  document.documentElement.classList.add("dark");
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  document.documentElement.classList.toggle("dark", e.matches);
});
`;

["host", "play", "display"].forEach(app => {
  const mainFile = `apps/${app}/src/main.tsx`;
  if (fs.existsSync(mainFile)) {
    let code = fs.readFileSync(mainFile, "utf8");
    if (!code.includes("prefers-color-scheme")) {
      code = code.replace(/ReactDOM\.createRoot/, darkModeScript + "\nReactDOM.createRoot");
      fs.writeFileSync(mainFile, code);
    }
  }
});

console.log("Hooks, CSS, and main.tsx prepared");

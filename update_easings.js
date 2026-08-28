const fs = require("fs");
const path = require("path");

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else if (filepath.endsWith(".tsx")) {
      callback(filepath);
    }
  }
}

const apps = ["apps/host/src", "apps/play/src", "apps/display/src"];

apps.forEach(dir => {
  walkSync(dir, filepath => {
    let code = fs.readFileSync(filepath, "utf8");
    
    // Replace animations
    code = code.replace(/animate-\[screenEnter_300ms_ease-out\]/g, "animate-[screenEnter_300ms_var(--ease-out-expo)]");
    code = code.replace(/animate-\[fadeScaleIn_250ms_ease-out\]/g, "animate-[fadeScaleIn_250ms_var(--ease-spring)]");
    code = code.replace(/animate-\[popIn_200ms_ease-out\]/g, "animate-[popIn_200ms_var(--ease-spring)]");
    code = code.replace(/animate-\[glowPulse_400ms_ease-out\]/g, "animate-[glowPulse_400ms_var(--ease-out-expo)]");
    
    // Replace generic transition-all (where ease isn't specified yet)
    code = code.replace(/transition-all(?!\s+ease-|\]|\s+duration-[0-9]+(?:\s+ease-[a-z-]+)?)/g, "transition-all ease-[var(--ease-smooth)]");
    // Some lines might be "transition-all duration-150 flex items-center".
    // I should just replace all "transition-all" but avoid double replacements.
    // Let's use a simpler regex for transition-all.
    code = code.replace(/transition-all\b(?! ease-\[var\(--ease-smooth\)\]| duration-[0-9]+ ease-[a-z-]+)/g, "transition-all ease-[var(--ease-smooth)]");
    
    // Also update instances where we already have duration-xxx ease-linear
    // We leave ease-linear alone for progress bars.
    
    // Add Frosted Glass to Headers
    if (filepath.endsWith("App.tsx") && !filepath.includes("display")) {
      code = code.replace(/bg-\[var\(--color-surface-elevated\)\] shadow-sm border-b border-\[var\(--color-border\)\]/g, "bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]/50");
      code = code.replace(/bg-\[var\(--color-surface-elevated\)\] shadow-sm py-3/g, "bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm py-3 border-b border-[var(--color-border)]/50");
    }
    
    // Play App RevealScreen/AnsweredScreen cards
    if (filepath.includes("AnsweredScreen.tsx") || (filepath.includes("RevealScreen.tsx") && filepath.includes("play"))) {
      code = code.replace(/bg-\[var\(--color-surface-elevated\)\] p-8 rounded-2xl/g, "bg-[var(--color-surface-elevated)]/90 backdrop-blur-sm p-8 rounded-2xl");
      code = code.replace(/bg-\[var\(--color-surface-elevated\)\] px-8 py-3 rounded-full/g, "bg-[var(--color-surface-elevated)]/90 backdrop-blur-sm px-8 py-3 rounded-full");
    }
    
    // Display App QuestionDisplayScreen badge
    if (filepath.includes("QuestionDisplayScreen.tsx") && filepath.includes("display")) {
      code = code.replace(/bg-white px-8 py-3 rounded-full/g, "bg-white/80 backdrop-blur-sm px-8 py-3 rounded-full");
      code = code.replace(/bg-\[var\(--color-surface-elevated\)\] px-8 py-3 rounded-full/g, "bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm px-8 py-3 rounded-full");
    }
    
    fs.writeFileSync(filepath, code);
  });
});

// Create Haptics Utilities
const hapticsContent = `export function triggerHaptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore
    }
  }
}

export const haptics = {
  tap: () => triggerHaptic(10),
  success: () => triggerHaptic([10, 50, 10]),
  error: () => triggerHaptic(30),
  urgent: () => triggerHaptic(15),
};
`;

fs.mkdirSync("apps/play/src/utils", { recursive: true });
fs.writeFileSync("apps/play/src/utils/haptics.ts", hapticsContent);

fs.mkdirSync("apps/host/src/utils", { recursive: true });
fs.writeFileSync("apps/host/src/utils/haptics.ts", hapticsContent);

console.log("Easings and haptics utility created");

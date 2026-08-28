const fs = require("fs");

let file = "apps/display/src/screens/QuestionDisplayScreen.tsx";
let code = fs.readFileSync(file, "utf8");
code = code.replace(/transition-all duration-75 ease-linear/g, "transition-all duration-200 ease-linear");
code = code.replace(/bg-red-500 animate-pulse/g, "bg-[var(--color-error)] animate-pulse");
fs.writeFileSync(file, code);

// RevealScreen across all 3 apps: add glowPulse on correct option
let apps = ["host", "play", "display"];
apps.forEach(app => {
  let file = app === "display" 
    ? `apps/display/src/screens/RevealDisplayScreen.tsx` 
    : `apps/${app}/src/screens/RevealScreen.tsx`;
    
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, "utf8");
    // We are looking for the style applied to the correct option container.
    // In Host/Play RevealScreen:
    code = code.replace(/bg-\[var\(--color-success-bg\)\]/g, "bg-[var(--color-success-bg)] animate-[glowPulse_400ms_ease-out]");
    // Wait, in Display app:
    code = code.replace(/bg-green-50 border-green-500 shadow-2xl scale-\[1\.02\]/g, "bg-[var(--color-success-bg)] border-[var(--color-success)] shadow-2xl scale-[1.02] animate-[glowPulse_400ms_ease-out]");
    fs.writeFileSync(file, code);
  }
});

// Update Podium in EndedDisplayScreen
file = "apps/display/src/screens/EndedDisplayScreen.tsx";
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, "utf8");
  // We need to add state for visibleRanks
  if (!code.includes("visibleRanks")) {
    code = code.replace(/import { useDisplayStore } from "\.\.\/store\/displayStore";/, `import { useEffect, useState } from "react";\nimport { useDisplayStore } from "../store/displayStore";`);
    code = code.replace(/  const leaderboard = useDisplayStore\(state => state\.leaderboard\);/, `  const leaderboard = useDisplayStore(state => state.leaderboard);\n  const [visibleRanks, setVisibleRanks] = useState<number[]>([]);\n\n  useEffect(() => {\n    if (!leaderboard) return;\n    const timeouts = [\n      setTimeout(() => setVisibleRanks(prev => [...prev, 3]), 200),\n      setTimeout(() => setVisibleRanks(prev => [...prev, 2]), 600),\n      setTimeout(() => setVisibleRanks(prev => [...prev, 1]), 1000),\n    ];\n    return () => timeouts.forEach(clearTimeout);\n  }, [leaderboard]);`);
    
    // Conditionally render based on visibleRanks
    code = code.replace(/\{leaderboard\[1\] && \(/g, "{leaderboard[1] && visibleRanks.includes(2) && (");
    code = code.replace(/\{leaderboard\[0\] && \(/g, "{leaderboard[0] && visibleRanks.includes(1) && (");
    code = code.replace(/\{leaderboard\[2\] && \(/g, "{leaderboard[2] && visibleRanks.includes(3) && (");
    
    fs.writeFileSync(file, code);
  }
}

console.log("Done");


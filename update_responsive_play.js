const fs = require("fs");
const path = require("path");

function walkSync(dir, callback) {
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

// Play app fixes
walkSync("apps/play/src", filepath => {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Buttons
  code = code.replace(/(<button[^>]*className="[^"]*)/g, (match) => {
    let newMatch = match;
    if (!newMatch.includes("min-h-")) newMatch += " min-h-[44px]";
    if (!newMatch.includes("touch-manipulation")) newMatch += " touch-manipulation";
    return newMatch;
  });
  
  // Inputs
  code = code.replace(/(<input[^>]*className="[^"]*)/g, (match) => {
    let newMatch = match;
    if (!newMatch.includes("min-h-")) newMatch += " min-h-[44px]";
    return newMatch;
  });
  
  // Long text truncation / word break
  code = code.replace(/text-xl sm:text-2xl font-heading font-bold/g, "text-xl sm:text-2xl font-heading font-bold break-words");
  code = code.replace(/text-2xl sm:text-3xl font-heading font-bold/g, "text-2xl sm:text-3xl font-heading font-bold break-words");
  
  fs.writeFileSync(filepath, code);
});

// App.tsx specific responsive fixes
const appTsxPaths = [
  "apps/host/src/App.tsx", 
  "apps/play/src/App.tsx", 
  "apps/display/src/App.tsx"
];

appTsxPaths.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, "utf8");
    // Ensure min-h-[100dvh] fallback chain
    code = code.replace(/min-h-screen/g, "min-h-screen min-h-[100dvh]");
    fs.writeFileSync(file, code);
  }
});

// Host app responsive fixes (Secondary)
walkSync("apps/host/src/screens", filepath => {
  let code = fs.readFileSync(filepath, "utf8");
  
  // Header in Host App.tsx and lobby wrap
  if (filepath.includes("LobbyScreen.tsx")) {
    code = code.replace(/flex justify-between items-center mb-6 px-4/g, "flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4");
  }
  
  // SelectQuizScreen.tsx grid
  if (filepath.includes("SelectQuizScreen.tsx")) {
    code = code.replace(/grid grid-cols-2 md:grid-cols-3/g, "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3");
  }
  
  // RevealScreen.tsx layout
  if (filepath.includes("RevealScreen.tsx")) {
    code = code.replace(/flex gap-8 flex-1 pb-4/g, "flex flex-col md:flex-row gap-8 flex-1 pb-4");
    code = code.replace(/w-\[30\%\] flex flex-col h-full/g, "w-full md:w-[30%] flex flex-col h-full min-h-[400px]");
  }
  
  fs.writeFileSync(filepath, code);
});

console.log("Responsive fixes applied");


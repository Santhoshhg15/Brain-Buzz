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

const apps = ["apps/host/src/screens", "apps/play/src/screens", "apps/display/src/screens", "apps/display/src/components"];

apps.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  walkSync(dir, filepath => {
    let code = fs.readFileSync(filepath, "utf8");
    
    // Page backgrounds
    code = code.replace(/\bbg-gray-50\b(?=[\s\S]*?min-h)/g, "bg-[var(--color-bg)]");
    code = code.replace(/\bbg-indigo-50\b(?=[\s\S]*?min-h)/g, "bg-[var(--color-bg)]");
    code = code.replace(/\bbg-gray-50\b/g, "bg-[var(--color-surface)]");
    code = code.replace(/\bbg-indigo-50\b/g, "bg-[var(--color-surface)]");
    code = code.replace(/\bbg-purple-50\b/g, "bg-[var(--color-surface)]");
    
    // Cards / elevated
    code = code.replace(/\bbg-white\b/g, "bg-[var(--color-surface-elevated)]");
    
    // Text Primary
    code = code.replace(/\btext-gray-800\b/g, "text-[var(--color-text-primary)]");
    code = code.replace(/\btext-gray-900\b/g, "text-[var(--color-text-primary)]");
    code = code.replace(/\btext-black\b/g, "text-[var(--color-text-primary)]");
    
    // Text Secondary
    code = code.replace(/\btext-gray-400\b/g, "text-[var(--color-text-secondary)]");
    code = code.replace(/\btext-gray-500\b/g, "text-[var(--color-text-secondary)]");
    code = code.replace(/\btext-gray-600\b/g, "text-[var(--color-text-secondary)]");
    code = code.replace(/\btext-gray-700\b/g, "text-[var(--color-text-secondary)]");
    
    // Borders
    code = code.replace(/\bborder-gray-100\b/g, "border-[var(--color-border)]");
    code = code.replace(/\bborder-gray-200\b/g, "border-[var(--color-border)]");
    code = code.replace(/\bborder-gray-300\b/g, "border-[var(--color-border)]");
    code = code.replace(/\bborder-indigo-100\b/g, "border-[var(--color-border)]");
    code = code.replace(/\bborder-indigo-200\b/g, "border-[var(--color-border)]");
    
    // Accent (excluding optionStyles which use actual red/blue/yellow/green)
    code = code.replace(/\bbg-indigo-600\b/g, "bg-[var(--color-accent)]");
    code = code.replace(/\bbg-indigo-500\b/g, "bg-[var(--color-accent)]");
    code = code.replace(/\bbg-indigo-700\b/g, "bg-[var(--color-accent-hover)]");
    code = code.replace(/\bbg-blue-600\b/g, "bg-[var(--color-accent)]"); // Host reveal screen end button
    code = code.replace(/\bhover:bg-indigo-700\b/g, "hover:bg-[var(--color-accent-hover)]");
    code = code.replace(/\bhover:bg-blue-700\b/g, "hover:bg-[var(--color-accent-hover)]");
    code = code.replace(/\btext-indigo-600\b/g, "text-[var(--color-accent)]");
    code = code.replace(/\btext-indigo-700\b/g, "text-[var(--color-accent)]");
    code = code.replace(/\btext-indigo-900\b/g, "text-[var(--color-accent)]");
    code = code.replace(/\bborder-indigo-500\b/g, "border-[var(--color-accent)]");
    
    // Success / Error (Only specific things like Correct/Incorrect, JoinError)
    // In RevealScreen/RevealDisplayScreen: bg-green-50, text-green-700 etc.
    code = code.replace(/\bbg-green-50\b/g, "bg-[var(--color-success-bg)]");
    code = code.replace(/\bbg-green-500\b(?!.*OptionIcon)/g, "bg-[var(--color-success)]"); 
    // ^ careful with Option buttons, they are bg-green-500 but are in optionStyles
    code = code.replace(/\btext-green-700\b/g, "text-[var(--color-success)]");
    code = code.replace(/\btext-green-900\b/g, "text-[var(--color-success)]");
    code = code.replace(/\bborder-green-500\b/g, "border-[var(--color-success)]");
    
    code = code.replace(/\bbg-red-50\b/g, "bg-[var(--color-error-bg)]");
    code = code.replace(/\bbg-red-400\b/g, "bg-[var(--color-error)]");
    code = code.replace(/\btext-red-600\b/g, "text-[var(--color-error)]");
    code = code.replace(/\btext-red-700\b/g, "text-[var(--color-error)]");
    code = code.replace(/\bborder-red-100\b/g, "border-[var(--color-error)]");
    code = code.replace(/\bborder-red-200\b/g, "border-[var(--color-error)]");

    // Headings font
    code = code.replace(/text-3xl font-bold/g, "text-3xl font-heading font-bold");
    code = code.replace(/text-4xl font-bold/g, "text-4xl font-heading font-bold");
    code = code.replace(/text-5xl font-black/g, "text-5xl font-heading font-black");
    code = code.replace(/text-6xl font-black/g, "text-6xl font-heading font-black");
    code = code.replace(/text-\[4rem\] font-black/g, "text-[4rem] font-heading font-black");
    code = code.replace(/text-\[3\.5rem\] font-black/g, "text-[3.5rem] font-heading font-black");
    code = code.replace(/text-2xl font-bold/g, "text-2xl font-heading font-bold");
    code = code.replace(/text-xl font-bold/g, "text-xl font-heading font-bold");

    // Standardize borders
    code = code.replace(/rounded-3xl/g, "rounded-2xl");
    code = code.replace(/rounded-\[3rem\]/g, "rounded-2xl");
    code = code.replace(/rounded-\[2\.5rem\]/g, "rounded-2xl");
    code = code.replace(/rounded-lg/g, "rounded-xl");
    
    // Fix buttons disabled state
    code = code.replace(/bg-gray-300 text-gray-500 cursor-not-allowed/g, "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white");
    code = code.replace(/bg-gray-200 text-gray-400 cursor-not-allowed/g, "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white");
    code = code.replace(/disabled:bg-gray-300 disabled:shadow-none/g, "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none");

    // Waiting states containers
    // "Waiting for players to connect..."
    code = code.replace(/border-2 border-dashed border-\[var\(--color-border\)\] rounded-xl text-\[var\(--color-text-secondary\)\] italic/g, "border-2 border-dashed border-[var(--color-border)] rounded-2xl text-[var(--color-text-secondary)] italic bg-[var(--color-surface)]");

    fs.writeFileSync(filepath, code);
  });
});

console.log("Completed JS pass.");


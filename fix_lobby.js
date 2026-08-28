const fs = require("fs");

let file = "apps/host/src/screens/LobbyScreen.tsx";
let code = fs.readFileSync(file, "utf8");
code = code.replace(/text-7xl font-black text-\[var\(--color-accent\)\] tracking-widest uppercase/, "text-7xl font-mono font-black text-[var(--color-accent)] bg-[var(--color-surface)] px-6 py-2 rounded-xl tracking-widest uppercase inline-block mt-4");
code = code.replace(/bg-gray-300 text-\[var\(--color-text-secondary\)\] cursor-not-allowed/g, "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white");
// Also fix rounded-full to rounded-xl for buttons
code = code.replace(/rounded-full/g, "rounded-xl");
// Fix chip background
code = code.replace(/bg-indigo-100/g, "bg-[var(--color-surface)]");
fs.writeFileSync(file, code);

file = "apps/display/src/screens/LobbyDisplayScreen.tsx";
if (fs.existsSync(file)) {
  let dcode = fs.readFileSync(file, "utf8");
  dcode = dcode.replace(/text-\[7rem\] font-black text-\[var\(--color-accent\)\] tracking-widest/, "text-[7rem] font-mono font-black text-[var(--color-accent)] tracking-widest bg-[var(--color-surface)] px-8 rounded-2xl");
  dcode = dcode.replace(/rounded-\[3rem\]/g, "rounded-2xl");
  dcode = dcode.replace(/rounded-\[2\.5rem\]/g, "rounded-2xl");
  dcode = dcode.replace(/rounded-full/g, "rounded-xl");
  dcode = dcode.replace(/bg-gray-800 text-white/g, "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]");
  fs.writeFileSync(file, dcode);
}

// Fix Play App JoinScreen button disabled state
let pfile = "apps/play/src/screens/JoinScreen.tsx";
if (fs.existsSync(pfile)) {
  let pcode = fs.readFileSync(pfile, "utf8");
  pcode = pcode.replace(/bg-gray-200 text-\[var\(--color-text-secondary\)\] cursor-not-allowed/g, "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white");
  pcode = pcode.replace(/bg-indigo-100/g, "bg-[var(--color-surface)]");
  fs.writeFileSync(pfile, pcode);
}

// Fix Display App ConnectScreen button disabled state
let cfile = "apps/display/src/screens/ConnectScreen.tsx";
if (fs.existsSync(cfile)) {
  let ccode = fs.readFileSync(cfile, "utf8");
  ccode = ccode.replace(/bg-gray-200 text-\[var\(--color-text-secondary\)\] cursor-not-allowed/g, "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white");
  ccode = ccode.replace(/disabled:bg-gray-300/g, "disabled:opacity-40 disabled:bg-[var(--color-accent)]");
  fs.writeFileSync(cfile, ccode);
}

console.log("Fixes applied");


const fs = require("fs");

const cssAdditions = `
/* Premium Animation Keyframes */
@keyframes screenEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeScaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes popIn {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes glowPulse {
  0% { box-shadow: 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.2); }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Premium Shadows */
.shadow-premium {
  box-shadow: 0 1px 2px rgba(43,38,32,0.04), 0 8px 24px rgba(43,38,32,0.06);
}

.dark .shadow-premium {
  box-shadow: none;
}
`;

for (const app of ["host", "play", "display"]) {
  const filepath = `apps/${app}/src/index.css`;
  let css = fs.readFileSync(filepath, "utf8");
  if (!css.includes("screenEnter")) {
    fs.appendFileSync(filepath, cssAdditions);
  }
}
console.log("Updated index.css");


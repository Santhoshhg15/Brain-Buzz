const fs = require("fs");

const cssContent = `
@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-heading: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

:root {
  --color-bg: #FAF6ED;
  --color-surface: #F3EDE0;
  --color-surface-elevated: #FFFFFF;
  --color-text-primary: #2B2620;
  --color-text-secondary: #6B6355;
  --color-accent: #4F46E5;
  --color-accent-hover: #4338CA;
  --color-success: #15803D;
  --color-success-bg: #DCFCE7;
  --color-error: #B91C1C;
  --color-error-bg: #FEE2E2;
  --color-border: #E5DFD1;
}

.dark {
  --color-bg: #1C1A16;
  --color-surface: #262319;
  --color-surface-elevated: #2E2A20;
  --color-text-primary: #F3EDE0;
  --color-text-secondary: #A89F8C;
  --color-accent: #6366F1;
  --color-accent-hover: #818CF8;
  --color-success: #22C55E;
  --color-success-bg: #14532D;
  --color-error: #EF4444;
  --color-error-bg: #7F1D1D;
  --color-border: #3A3527;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
`;

const htmlHead = `  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Java Quiz Live</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  </head>`;

for (const app of ["host", "play", "display"]) {
  fs.writeFileSync(`apps/${app}/src/index.css`, cssContent);
  let html = fs.readFileSync(`apps/${app}/index.html`, "utf8");
  html = html.replace(/<head>[\s\S]*?<\/head>/, htmlHead);
  fs.writeFileSync(`apps/${app}/index.html`, html);
}
console.log("Done");

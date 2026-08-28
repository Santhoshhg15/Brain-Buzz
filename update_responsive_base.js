const fs = require("fs");
const path = require("path");

const cssAdditions = `
/* Mobile Responsive Resets */
html {
  -webkit-text-size-adjust: 100%;
}

body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.touch-manipulation {
  touch-action: manipulation;
}
`;

for (const app of ["host", "play", "display"]) {
  const cssFile = `apps/${app}/src/index.css`;
  if (fs.existsSync(cssFile)) {
    let css = fs.readFileSync(cssFile, "utf8");
    if (!css.includes("-webkit-text-size-adjust")) {
      fs.appendFileSync(cssFile, cssAdditions);
    }
  }

  const htmlFile = `apps/${app}/index.html`;
  if (fs.existsSync(htmlFile)) {
    let html = fs.readFileSync(htmlFile, "utf8");
    html = html.replace(
      /<meta name="viewport" content="width=device-width, initial-scale=1\.0" \/>/g,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
    );
    fs.writeFileSync(htmlFile, html);
  }
}
console.log("Updated foundational base");


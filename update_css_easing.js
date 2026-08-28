const fs = require("fs");

const cssAdditions = `
:root {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
`;

for (const app of ["host", "play", "display"]) {
  const filepath = `apps/${app}/src/index.css`;
  if (fs.existsSync(filepath)) {
    let css = fs.readFileSync(filepath, "utf8");
    if (!css.includes("--ease-spring")) {
      // Insert right after @theme block or at beginning if not found
      css = css.replace(/:root \{/, ":root {\n  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);\n  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);\n  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);");
      fs.writeFileSync(filepath, css);
    }
  }
}
console.log("Updated CSS with easing tokens");


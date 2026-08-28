const fs = require("fs");

["host", "play", "display"].forEach(app => {
  const htmlFile = `apps/${app}/index.html`;
  if (fs.existsSync(htmlFile)) {
    let html = fs.readFileSync(htmlFile, "utf8");
    
    // Add preconnects if they don`t exist
    if (!html.includes("fonts.gstatic.com")) {
      const preconnects = `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    `;
      html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com/, preconnects + `<link href="https://fonts.googleapis.com`);
    }
    
    // Add display=swap if it doesn`t exist
    if (!html.includes("display=swap")) {
      html = html.replace(/family=Inter:ital,opsz,wght[^"]+/, `$&display=swap`);
      html = html.replace(/family=JetBrains\+Mono:ital,wght[^"]+/, `$&display=swap`);
      html = html.replace(/family=Space\+Grotesk:wght[^"]+/, `$&display=swap`);
      // Simpler: just append &display=swap before the closing quote for any fonts URL
      html = html.replace(/(<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)(" rel="stylesheet">)/g, (match, p1, p2) => {
        if (!p1.includes("display=swap")) {
          return p1 + "&display=swap" + p2;
        }
        return match;
      });
    }
    
    fs.writeFileSync(htmlFile, html);
  }
});

console.log("HTML fonts updated");


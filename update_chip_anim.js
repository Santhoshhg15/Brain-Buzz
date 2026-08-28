const fs = require("fs");
["apps/host/src/screens/LobbyScreen.tsx", "apps/display/src/screens/LobbyDisplayScreen.tsx"].forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, "utf8");
    code = code.replace(/animate-fade-in-up/g, "animate-[fadeScaleIn_250ms_ease-out]");
    fs.writeFileSync(file, code);
  }
});
console.log("Chips updated");


const fs = require("fs");
let file = "apps/host/src/App.tsx";
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(/py-4 px-8 flex justify-between items-center/g, "py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4");
  fs.writeFileSync(file, code);
}
console.log("Host header wrapped");


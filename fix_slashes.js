const fs = require("fs");
const files = ["apps/host/src/components/admin/QuestionForm.tsx", "apps/host/src/components/admin/QuestionCard.tsx"];
files.forEach(f => {
  let content = fs.readFileSync(f, "utf8");
  content = content.replace(/\\`/g, "`");
  fs.writeFileSync(f, content);
});
console.log("Fixed slashes");

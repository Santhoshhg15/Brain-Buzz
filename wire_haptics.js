const fs = require("fs");

// Play RevealScreen
let pfile = "apps/play/src/screens/RevealScreen.tsx";
if (fs.existsSync(pfile)) {
  let pcode = fs.readFileSync(pfile, "utf8");
  if (!pcode.includes("haptics")) {
    pcode = pcode.replace(/import \{ usePlayStore \} from "\.\.\/store\/playStore";/, `import { useEffect } from "react";\nimport { usePlayStore } from "../store/playStore";\nimport { haptics } from "../utils/haptics";`);
    // Insert useEffect inside RevealScreen
    pcode = pcode.replace(/  const revealData = usePlayStore\(state => state\.revealData\);/, `  const revealData = usePlayStore(state => state.revealData);\n\n  useEffect(() => {\n    if (revealData) {\n      if (revealData.isCorrect) haptics.success();\n      else haptics.error();\n    }\n  }, [revealData]);\n`);
    fs.writeFileSync(pfile, pcode);
  }
}

// Host LobbyScreen
let hfile = "apps/host/src/screens/LobbyScreen.tsx";
if (fs.existsSync(hfile)) {
  let hcode = fs.readFileSync(hfile, "utf8");
  if (!hcode.includes("haptics")) {
    hcode = hcode.replace(/import \{ useHostStore \} from "\.\.\/store\/hostStore";/, `import { useHostStore } from "../store/hostStore";\nimport { haptics } from "../utils/haptics";`);
    hcode = hcode.replace(/onClick=\{startSession\}/, `onClick={() => {\n          haptics.tap();\n          startSession();\n        }}`);
    fs.writeFileSync(hfile, hcode);
  }
}

// Host LiveQuestionScreen
let lfile = "apps/host/src/screens/LiveQuestionScreen.tsx";
if (fs.existsSync(lfile)) {
  let lcode = fs.readFileSync(lfile, "utf8");
  if (!lcode.includes("haptics")) {
    lcode = lcode.replace(/import \{ useHostStore \} from "\.\.\/store\/hostStore";/, `import { useHostStore } from "../store/hostStore";\nimport { haptics } from "../utils/haptics";`);
    lcode = lcode.replace(/onClick=\{nextQuestion\}/, `onClick={() => {\n            haptics.tap();\n            nextQuestion();\n          }}`);
    fs.writeFileSync(lfile, lcode);
  }
}

console.log("Haptics wired");


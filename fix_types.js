const fs = require("fs");

let qc = fs.readFileSync("apps/host/src/components/admin/QuestionCard.tsx", "utf8");
qc = qc.replace(/import \{ QuestionDetail, useAdminStore \} from "\.\.\/\.\.\/store\/adminStore";/, "import { useAdminStore } from \\"../../store/adminStore\\";\\nimport type { QuestionDetail } from \\"../../store/adminStore\\";");
qc = qc.replace(/import \{ QuestionForm, QuestionFormData \} from "\.\/QuestionForm";/, "import { QuestionForm } from \\"./QuestionForm\\";\\nimport type { QuestionFormData } from \\"./QuestionForm\\";");
qc = qc.replace(/question\.options\.map\(\(opt, i\)/, "question.options.map((opt)");
fs.writeFileSync("apps/host/src/components/admin/QuestionCard.tsx", qc);

let qe = fs.readFileSync("apps/host/src/screens/QuizEditor.tsx", "utf8");
qe = qe.replace(/import \{ QuestionForm, QuestionFormData \} from "\.\.\/components\/admin\/QuestionForm";/, "import { QuestionForm } from \\"../components/admin/QuestionForm\\";\\nimport type { QuestionFormData } from \\"../components/admin/QuestionForm\\";");
fs.writeFileSync("apps/host/src/screens/QuizEditor.tsx", qe);

console.log("Types fixed");

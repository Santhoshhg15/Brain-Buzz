import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SessionFlow } from "./SessionFlow";
import { AdminDashboard } from "./screens/AdminDashboard";
import { QuizEditor } from "./screens/QuizEditor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SessionFlow />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/quizzes/:quizId" element={<QuizEditor />} />
      </Routes>
    </Router>
  );
}

export default App;

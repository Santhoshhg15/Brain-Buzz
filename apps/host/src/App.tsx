import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { SessionFlow } from "./SessionFlow";
import { AdminDashboard } from "./screens/AdminDashboard";
import { QuizEditor } from "./screens/QuizEditor";
import { AmbientBackground } from "./components/AmbientBackground";
import { AdminLayout } from "./components/admin/AdminLayout";
import { useAuthStore } from "./auth/authStore";
import { LoginScreen } from "./auth/LoginScreen";
import { useHostStore } from "./store/hostStore";

function AdminLayoutWrapper() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function App() {
  const checkExistingSession = useAuthStore((state) => state.checkExistingSession);
  const authStatus = useAuthStore((state) => state.authStatus);
  const initSocket = useHostStore((state) => state.initSocket);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      initSocket();
    }
  }, [authStatus, initSocket]);

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-[var(--color-accent)] text-white w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-2xl shadow-lg shadow-[var(--color-accent)]/20 animate-pulse">
            Q
          </div>
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest animate-pulse">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <>
        <AmbientBackground />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <Router>
        <Routes>
          <Route path="/" element={<SessionFlow />} />
          <Route element={<AdminLayoutWrapper />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/quizzes/:quizId" element={<QuizEditor />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;

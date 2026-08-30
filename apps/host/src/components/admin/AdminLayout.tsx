import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAdminStore } from "../../store/adminStore";
import { LayoutDashboard, ArrowLeft, BookOpen } from "lucide-react";
import { useAuthStore } from "../../auth/authStore";
import { ThemeToggle } from "../ThemeToggle";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const currentQuiz = useAdminStore((state) => state.currentQuiz);
  const instructorName = useAuthStore((state) => state.instructorName);
  const logout = useAuthStore((state) => state.logout);

  const isDashboardActive = location.pathname === "/admin";
  const isEditorActive = location.pathname.startsWith("/admin/quizzes/");

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] font-body text-[var(--color-text-primary)]">
      {/* Persistent Left Sidebar */}
      <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)]/50 flex flex-col fixed top-0 bottom-0 left-0 z-30 shadow-sm">
        {/* Branding Logo Area */}
        <div className="p-6 border-b border-[var(--color-border)]/50 flex items-center gap-3">
          <div className="bg-[var(--color-accent)] text-white w-9 h-9 rounded-xl flex items-center justify-center font-heading font-black shadow-md shadow-[var(--color-accent)]/20">
            Q
          </div>
          <h1 className="text-xl font-heading font-bold text-[var(--color-text-primary)] tracking-tight">
            Quiz <span className="text-[var(--color-accent)] font-black">ADMIN</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ease-[var(--ease-smooth)] duration-200 active:scale-[0.98] ${
              isDashboardActive
                ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)]/30"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {/* Sub-nav breadcrumb if on quiz editor */}
          {isEditorActive && quizId && (
            <div className="pl-4 pt-1 border-l-2 border-[var(--color-accent)]/50 ml-6 space-y-1.5 animate-[screenEnter_200ms_var(--ease-out-expo)]">
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Editing Quiz
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/40 p-2.5 rounded-xl truncate shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                <span className="truncate" title={currentQuiz?.title || "Loading..."}>
                  {currentQuiz?.title || "Loading..."}
                </span>
              </div>
            </div>
          )}
        </nav>

        {/* Back to Host Link at Bottom */}
        <div className="p-4 border-t border-[var(--color-border)]/50 space-y-2">
          {instructorName && (
            <div className="px-2 py-1 text-xs text-[var(--color-text-secondary)] font-semibold truncate text-center">
              Signed in as <span className="font-bold text-[var(--color-text-primary)]">{instructorName}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-error-bg)]/20 border border-[var(--color-border)] hover:border-[var(--color-error)]/40 rounded-xl font-bold text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-all ease-[var(--ease-smooth)] duration-200 active:scale-[0.98] cursor-pointer"
          >
            Log Out
          </button>
          <div className="flex justify-center pt-2">
            <ThemeToggle />
          </div>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)] rounded-xl font-bold text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all ease-[var(--ease-smooth)] duration-200 shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Host Console
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8 md:p-12 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

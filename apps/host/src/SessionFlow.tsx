import { useHostStore } from "./store/hostStore";
import { useAuthStore } from "./auth/authStore";
import { SelectQuizScreen } from "./screens/SelectQuizScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { LiveQuestionScreen } from "./screens/LiveQuestionScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { EndedScreen } from "./screens/EndedScreen";
import { ThemeToggle } from "./components/ThemeToggle";

export function SessionFlow() {
  const screen = useHostStore(state => state.screen);
  const roomCode = useHostStore(state => state.roomCode);
  const instructorName = useAuthStore(state => state.instructorName);
  const logout = useAuthStore(state => state.logout);

  return (
    <div className="min-h-screen min-h-[100dvh] font-body flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]/50 py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--color-accent)] text-white p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-xl font-heading font-bold text-[var(--color-text-primary)] tracking-tight">
            BrainBuzz <span className="text-[var(--color-accent)] font-black">HOST</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {roomCode && screen !== "ENDED" && screen !== "SELECT_QUIZ" && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Room Code</span>
              <span className="bg-[var(--color-surface)] text-[var(--color-accent)] font-mono font-black text-2xl px-4 py-1 rounded-xl tracking-widest border border-[var(--color-border)]">
                {roomCode}
              </span>
            </div>
          )}

          {instructorName && (
            <div className="flex items-center gap-3 border-l border-[var(--color-border)]/50 pl-6">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] hidden md:inline">
                Signed in as <span className="text-[var(--color-text-primary)] font-bold">{instructorName}</span>
              </span>
              <ThemeToggle />
              <button
                onClick={logout}
                className="text-xs font-bold px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-error)]/40 hover:bg-[var(--color-error-bg)]/30 hover:text-[var(--color-error)] text-[var(--color-text-secondary)] rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.97]"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main key={screen} className="flex-1 overflow-auto p-8 flex flex-col animate-[screenEnter_300ms_var(--ease-out-expo)]">
        {screen === "SELECT_QUIZ" && <SelectQuizScreen />}
        {screen === "LOBBY" && <LobbyScreen />}
        {screen === "LIVE_QUESTION" && <LiveQuestionScreen />}
        {screen === "REVEAL" && <RevealScreen />}
        {screen === "ENDED" && <EndedScreen />}
      </main>
    </div>
  );
}

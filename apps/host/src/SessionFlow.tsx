import { useEffect } from "react";
import { useHostStore } from "./store/hostStore";
import { SelectQuizScreen } from "./screens/SelectQuizScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { LiveQuestionScreen } from "./screens/LiveQuestionScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { EndedScreen } from "./screens/EndedScreen";

export function SessionFlow() {
  const initSocket = useHostStore(state => state.initSocket);
  const screen = useHostStore(state => state.screen);
  const roomCode = useHostStore(state => state.roomCode);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--color-bg)] font-body flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]/50 py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--color-accent)] text-white p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-xl font-heading font-bold text-[var(--color-text-primary)] tracking-tight">
            Java Quiz <span className="text-[var(--color-accent)] font-black">HOST</span>
          </h1>
        </div>
        
        {roomCode && screen !== "ENDED" && screen !== "SELECT_QUIZ" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Room Code</span>
            <span className="bg-[var(--color-surface)] text-[var(--color-accent)] font-mono font-black text-2xl px-4 py-1 rounded-xl tracking-widest border border-[var(--color-border)]">
              {roomCode}
            </span>
          </div>
        )}
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

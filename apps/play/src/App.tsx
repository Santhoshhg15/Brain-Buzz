import { useEffect } from "react";
import { usePlayStore } from "./store/playStore";
import { JoinScreen } from "./screens/JoinScreen";
import { WaitingRoomScreen } from "./screens/WaitingRoomScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { AnsweredScreen } from "./screens/AnsweredScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { EndedScreen } from "./screens/EndedScreen";

function App() {
  const initSocket = usePlayStore(state => state.initSocket);
  const screen = usePlayStore(state => state.screen);
  const roomCode = usePlayStore(state => state.roomCode);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] font-body flex flex-col text-[var(--color-text-primary)] w-full overflow-hidden">
      {/* Mobile-first Header */}
      {screen !== "QUESTION" && screen !== "ENDED" && screen !== "REVEAL" && (
        <header className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm py-3 border-b border-[var(--color-border)]/50 px-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--color-accent)] text-white p-1.5 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A120.1 120.1 0 0010 1C5.584 1 2 4.584 2 9c0 4.415 3.584 8 8 8s8-3.585 8-8a120.35 120.35 0 00-1.3-7.954zM10 15a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-lg font-heading font-black tracking-tight text-[var(--color-text-primary)]">
              Java Quiz
            </h1>
          </div>
          
          {roomCode && screen !== "JOIN" && (
            <div className="bg-[var(--color-surface)] text-[var(--color-accent)] font-mono font-bold px-3 py-1 rounded-md text-sm border border-[var(--color-border)] uppercase tracking-widest">
              {roomCode}
            </div>
          )}
        </header>
      )}

      {/* Main Content Area - Constrained width for optimal mobile feel on desktop */}
      <main key={screen} className="flex-1 w-full max-w-md mx-auto relative overflow-y-auto overflow-x-hidden flex flex-col bg-[var(--color-bg)] shadow-2xl sm:border-x sm:border-[var(--color-border)] animate-[screenEnter_300ms_var(--ease-out-expo)]">
        {screen === "JOIN" && <JoinScreen />}
        {screen === "WAITING_ROOM" && <WaitingRoomScreen />}
        {screen === "QUESTION" && <QuestionScreen />}
        {screen === "ANSWERED" && <AnsweredScreen />}
        {screen === "REVEAL" && <RevealScreen />}
        {screen === "ENDED" && <EndedScreen />}
      </main>
    </div>
  );
}

export default App;

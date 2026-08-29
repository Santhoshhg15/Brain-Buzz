import { useEffect } from "react";
import { usePlayStore } from "./store/playStore";
import { JoinScreen } from "./screens/JoinScreen";
import { WaitingRoomScreen } from "./screens/WaitingRoomScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { AnsweredScreen } from "./screens/AnsweredScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { EndedScreen } from "./screens/EndedScreen";
import { AmbientBackground } from "./components/AmbientBackground";

function App() {
  const initSocket = usePlayStore(state => state.initSocket);
  const screen = usePlayStore(state => state.screen);
  const roomCode = usePlayStore(state => state.roomCode);
  const connectionStatus = usePlayStore(state => state.connectionStatus);
  const isRejoining = usePlayStore(state => state.isRejoining);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="min-h-[100dvh] font-body flex flex-col text-[var(--color-text-primary)] w-full overflow-hidden relative">
      <AmbientBackground />

      {/* Reconnection Banner */}
      {connectionStatus === "reconnecting" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
          Reconnecting...
        </div>
      )}

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
              BrainBuzz
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
      <main key={screen} className="flex-1 w-full max-w-md mx-auto relative overflow-y-auto overflow-x-hidden flex flex-col shadow-2xl sm:border-x sm:border-[var(--color-border)] animate-[screenEnter_300ms_var(--ease-out-expo)]">
        {isRejoining ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--color-text-secondary)] font-bold animate-pulse">Reconnecting to session...</p>
          </div>
        ) : (
          <>
            {screen === "JOIN" && <JoinScreen />}
            {screen === "WAITING_ROOM" && <WaitingRoomScreen />}
            {screen === "QUESTION" && <QuestionScreen />}
            {screen === "ANSWERED" && <AnsweredScreen />}
            {screen === "REVEAL" && <RevealScreen />}
            {screen === "ENDED" && <EndedScreen />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

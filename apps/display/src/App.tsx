import { useEffect } from "react";
import { useDisplayStore } from "./store/displayStore";
import { ConnectScreen } from "./screens/ConnectScreen";
import { LobbyDisplayScreen } from "./screens/LobbyDisplayScreen";
import { QuestionDisplayScreen } from "./screens/QuestionDisplayScreen";
import { RevealDisplayScreen } from "./screens/RevealDisplayScreen";
import { EndedDisplayScreen } from "./screens/EndedDisplayScreen";
import { TerminatedDisplayScreen } from "./screens/TerminatedDisplayScreen";
import { AmbientBackground } from "./components/AmbientBackground";

function App() {
  const initSocket = useDisplayStore(state => state.initSocket);
  const screen = useDisplayStore(state => state.screen);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="min-h-screen min-h-[100dvh] font-body flex flex-col text-[var(--color-text-primary)] w-full overflow-hidden">
      <AmbientBackground />
      {/* 
        Display App purposefully uses the full viewport. 
        It has no persistent header because it relies on the specific screens 
        to show information in large font sizes. 
      */}
      <main key={screen} className="flex-1 w-full h-full flex flex-col relative animate-[screenEnter_300ms_var(--ease-out-expo)]">
        {screen === "CONNECT" && <ConnectScreen />}
        {screen === "LOBBY" && <LobbyDisplayScreen />}
        {screen === "QUESTION" && <QuestionDisplayScreen />}
        {screen === "REVEAL" && <RevealDisplayScreen />}
        {screen === "ENDED" && <EndedDisplayScreen />}
        {screen === "TERMINATED" && <TerminatedDisplayScreen />}
      </main>
    </div>
  );
}

export default App;

import { useDisplayStore } from "../store/displayStore";

export function LobbyDisplayScreen() {
  const roomCode = useDisplayStore(state => state.roomCode);
  const quizTitle = useDisplayStore(state => state.quizTitle);
  const participants = useDisplayStore(state => state.participants);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--color-surface)] p-12">
      
      {/* Top Banner */}
      <div className="w-full bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl p-16 flex flex-col md:flex-row items-center justify-between border-4 border-indigo-50 mb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-[var(--color-accent)]"></div>
        
        <div className="flex flex-col max-w-2xl">
          <h2 className="text-3xl font-heading font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4">
            Join the Quiz:
          </h2>
          <h1 className="text-6xl font-heading font-black text-[var(--color-text-primary)] leading-tight">
            {quizTitle}
          </h1>
        </div>

        <div className="flex flex-col items-center mt-12 md:mt-0 bg-[var(--color-surface)] p-10 rounded-2xl border border-[var(--color-border)] shadow-inner">
          <span className="text-3xl font-heading font-bold text-[var(--color-accent)] mb-2">Room Code</span>
          <div className="text-[7rem] font-mono font-black text-[var(--color-accent)] tracking-widest bg-[var(--color-surface)] px-8 rounded-2xl leading-none drop-shadow-md">
            {roomCode}
          </div>
        </div>
      </div>

      {/* Participants Area */}
      <div className="w-full max-w-7xl flex flex-col items-center flex-1">
        <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-10 py-4 rounded-xl text-3xl font-heading font-bold mb-12 shadow-lg">
          {participants.length} Player{participants.length !== 1 ? 's' : ''} Joined
        </div>

        {participants.length === 0 ? (
          <div className="text-4xl text-[var(--color-text-secondary)] font-medium animate-pulse mt-20">
            Waiting for players to connect...
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 w-full">
            {participants.map(p => (
              <div 
                key={p.id} 
                className="bg-[var(--color-surface-elevated)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] px-8 py-5 rounded-2xl text-4xl font-heading font-bold shadow-lg animate-[fadeScaleIn_250ms_var(--ease-spring)] transform transition hover:scale-105"
              >
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

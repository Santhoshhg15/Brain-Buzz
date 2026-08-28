import { useHostStore } from "../store/hostStore";
import { haptics } from "../utils/haptics";

export function LobbyScreen() {
  const roomCode = useHostStore(state => state.roomCode);
  const participants = useHostStore(state => state.participants);
  const startSession = useHostStore(state => state.startSession);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="bg-[var(--color-surface-elevated)] p-12 rounded-2xl shadow-xl border border-[var(--color-border)] mb-12 w-full max-w-2xl">
        <h2 className="text-2xl text-[var(--color-text-secondary)] font-semibold mb-2">Join at</h2>
        <div className="text-4xl font-heading font-bold text-[var(--color-text-primary)] mb-6">java-quiz.live</div>
        <div className="text-xl text-[var(--color-text-secondary)] mb-2">with Room Code</div>
        <div className="text-7xl font-mono font-black text-[var(--color-accent)] bg-[var(--color-surface)] px-6 py-2 rounded-xl tracking-widest uppercase inline-block mt-4">
          {roomCode}
        </div>
      </div>

      <div className="w-full max-w-4xl mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4">
          <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
            Players Joined ({participants.length})
          </h3>
        </div>
        
        {participants.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-[var(--color-text-secondary)] italic bg-[var(--color-surface)]">
            Waiting for players to connect...
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {participants.map(p => (
              <div key={p.id} className="bg-[var(--color-surface)] text-[var(--color-accent)] px-6 py-3 rounded-xl font-bold text-lg shadow-sm animate-[fadeScaleIn_250ms_var(--ease-spring)]">
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          haptics.tap();
          startSession();
        }}
        disabled={participants.length === 0}
        className={`px-12 py-4 rounded-xl text-2xl font-heading font-bold shadow-lg transition-all ease-[var(--ease-smooth)] ${
          participants.length === 0
            ? "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white"
            : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] hover:shadow-indigo-500/30 hover:scale-105"
        }`}
      >
        Start Session
      </button>
      {participants.length === 0 && (
        <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Waiting for students to join...
        </div>
      )}
    </div>
  );
}

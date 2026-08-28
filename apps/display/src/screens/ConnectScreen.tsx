import { useDisplayStore } from "../store/displayStore";

export function ConnectScreen() {
  const roomCode = useDisplayStore(state => state.roomCode);
  const setRoomCode = useDisplayStore(state => state.setRoomCode);
  const connectToRoom = useDisplayStore(state => state.connectToRoom);
  const connectError = useDisplayStore(state => state.connectError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) connectToRoom();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[var(--color-surface)]">
      <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl p-12 w-full max-w-xl border border-[var(--color-border)]">
        <h1 className="text-4xl font-black text-center text-[var(--color-text-primary)] mb-2">Display Mode</h1>
        <p className="text-[var(--color-text-secondary)] text-center mb-10 text-xl">Enter the Room Code from the Host Console</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room Code"
            className="w-full px-8 py-6 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl text-4xl font-mono font-black text-[var(--color-accent)] text-center tracking-widest uppercase focus:outline-none focus:border-[var(--color-accent)] transition-all ease-[var(--ease-smooth)] placeholder:text-gray-300"
            autoFocus
          />

          {connectError && (
            <div className="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl text-lg font-medium text-center border border-[var(--color-error)]">
              {connectError}
            </div>
          )}

          <button
            type="submit"
            disabled={!roomCode.trim()}
            className="w-full py-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-2xl text-3xl font-black transition-all ease-[var(--ease-smooth)] shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-4"
          >
            Connect Display
          </button>
        </form>
      </div>
    </div>
  );
}

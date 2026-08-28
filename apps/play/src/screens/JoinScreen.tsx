import { usePlayStore } from "../store/playStore";

export function JoinScreen() {
  const roomCode = usePlayStore(state => state.roomCode);
  const studentName = usePlayStore(state => state.studentName);
  const setRoomCode = usePlayStore(state => state.setRoomCode);
  const setStudentName = usePlayStore(state => state.setStudentName);
  const joinRoom = usePlayStore(state => state.joinRoom);
  const joinError = usePlayStore(state => state.joinError);

  const canJoin = roomCode.trim().length > 0 && studentName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canJoin) joinRoom();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4">
      <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] p-8 w-full max-w-sm">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[var(--color-surface)] text-[var(--color-accent)] rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center text-[var(--color-text-primary)] mb-8">Ready to play?</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2" htmlFor="roomCode">
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. ABCD-123"
              className="w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xl font-mono font-black text-[var(--color-accent)] text-center tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-[var(--color-accent)] transition-all ease-[var(--ease-smooth)] placeholder:text-gray-300 placeholder:font-medium"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2" htmlFor="studentName">
              Nickname
            </label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Your name"
              className="w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xl font-heading font-bold text-center focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-[var(--color-accent)] transition-all ease-[var(--ease-smooth)] placeholder:text-gray-300 placeholder:font-medium"
              autoComplete="off"
            />
          </div>

          {joinError && (
            <div className="bg-[var(--color-error-bg)] text-[var(--color-error)] p-3 rounded-xl text-sm font-medium text-center border border-[var(--color-error)]">
              {joinError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canJoin}
            className={`mt-4 w-full py-4 rounded-xl text-xl font-black transition-all ease-[var(--ease-smooth)] shadow-md ${
              canJoin 
                ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] hover:shadow-lg active:scale-95" 
                : "opacity-40 cursor-not-allowed bg-[var(--color-accent)] text-white"
            }`}
          >
            Join Quiz
          </button>
        </form>
      </div>
    </div>
  );
}

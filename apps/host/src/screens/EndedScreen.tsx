import { useCountUp } from "../hooks/useCountUp";
import { useHostStore } from "../store/hostStore";

export function EndedScreen() {
  const leaderboard = useHostStore(state => state.leaderboard);
  const resetSession = useHostStore(state => state.resetSession);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto">
      <h1 className="text-5xl font-heading font-black text-[var(--color-text-primary)] mb-12">Final Results</h1>

      {/* Podium for top 3 */}
      <div className="flex items-end justify-center gap-4 mb-16 h-64">
        {/* Rank 2 */}
        {leaderboard[1] && (
          <div className="flex flex-col items-center w-32 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <span className="font-bold text-xl mb-2 text-[var(--color-text-secondary)]">{leaderboard[1].name}</span>
            <div className="w-full bg-gray-300 rounded-t-lg h-32 flex flex-col items-center justify-end pb-4 shadow-lg">
              <span className="text-4xl font-black text-white drop-shadow-md">2</span>
              <span className="font-mono font-bold text-[var(--color-text-secondary)] mt-2">{leaderboard[1].score}</span>
            </div>
          </div>
        )}
        
        {/* Rank 1 */}
        {leaderboard[0] && (
          <div className="flex flex-col items-center w-36 z-10 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <span className="font-bold text-2xl mb-2 text-yellow-600">{leaderboard[0].name}</span>
            <div className="w-full bg-yellow-400 rounded-t-lg h-48 flex flex-col items-center justify-end pb-4 shadow-xl">
              <span className="text-6xl font-heading font-black text-white drop-shadow-md">1</span>
              <span className="font-mono font-bold text-yellow-900 mt-2">{leaderboard[0].score}</span>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {leaderboard[2] && (
          <div className="flex flex-col items-center w-32 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <span className="font-bold text-xl mb-2 text-orange-700">{leaderboard[2].name}</span>
            <div className="w-full bg-orange-300 rounded-t-lg h-24 flex flex-col items-center justify-end pb-4 shadow-lg">
              <span className="text-4xl font-black text-white drop-shadow-md">3</span>
              <span className="font-mono font-bold text-orange-900 mt-2">{leaderboard[2].score}</span>
            </div>
          </div>
        )}
      </div>

      {/* Rest of leaderboard */}
      {leaderboard.length > 3 && (
        <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] rounded-xl shadow-sm border border-[var(--color-border)] p-4 mb-12">
          {leaderboard.slice(3).map((entry, idx) => (
            <div key={entry.id} className="flex justify-between items-center p-4 border-b border-[var(--color-border)] last:border-0">
              <div className="flex items-center gap-4">
                <span className="font-bold text-[var(--color-text-secondary)] w-6">{idx + 4}</span>
                <span className="font-bold text-lg text-[var(--color-text-primary)]">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-[var(--color-accent)]">{useCountUp(entry.score)} pts</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={resetSession}
        className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-10 py-4 rounded-full font-bold text-xl shadow-lg transition-all ease-[var(--ease-smooth)]"
      >
        Start New Session
      </button>
    </div>
  );
}

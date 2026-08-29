import { useEffect, useState } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { useDisplayStore } from "../store/displayStore";

export function EndedDisplayScreen() {
  const leaderboard = useDisplayStore(state => state.leaderboard);
  const [visibleRanks, setVisibleRanks] = useState<number[]>([]);

  useEffect(() => {
    if (!leaderboard) return;
    const timeouts = [
      setTimeout(() => setVisibleRanks(prev => [...prev, 3]), 200),
      setTimeout(() => setVisibleRanks(prev => [...prev, 2]), 600),
      setTimeout(() => setVisibleRanks(prev => [...prev, 1]), 1000),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, [leaderboard]);

  if (!leaderboard) return null;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--color-surface)] py-12 px-8 sm:px-12 md:px-16 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-5xl lg:text-6xl font-black text-[var(--color-accent)] mb-12 tracking-tight uppercase drop-shadow-sm text-center">
          Final Results
        </h1>

        {/* Podium for top 3 */}
        <div className="flex items-end justify-center gap-6 lg:gap-12 mb-16 h-72 lg:h-80">
          {/* Rank 2 */}
          {leaderboard[1] && visibleRanks.includes(2) && (
            <div className="flex flex-col items-center w-48 lg:w-56 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <span className="font-bold text-2xl lg:text-3xl mb-4 text-[var(--color-text-secondary)] truncate w-full text-center px-2">{leaderboard[1].name}</span>
              <div className="w-full bg-gray-300 rounded-t-3xl h-40 lg:h-48 flex flex-col items-center justify-end pb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                <span className="text-7xl font-black text-white drop-shadow-md leading-none">2</span>
                <span className="font-mono font-bold text-xl lg:text-2xl text-[var(--color-text-secondary)] mt-3">{useCountUp(leaderboard[1].score)} pts</span>
              </div>
            </div>
          )}
          
          {/* Rank 1 */}
          {leaderboard[0] && visibleRanks.includes(1) && (
            <div className="flex flex-col items-center w-56 lg:w-64 z-10 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
              <div className="absolute -top-10 lg:-top-12 text-5xl lg:text-6xl animate-bounce">👑</div>
              <span className="font-bold text-3xl lg:text-4xl mb-4 text-yellow-600 truncate w-full text-center px-2">{leaderboard[0].name}</span>
              <div className="w-full bg-yellow-400 rounded-t-3xl h-56 lg:h-64 flex flex-col items-center justify-end pb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                <span className="text-8xl font-black text-white drop-shadow-md leading-none">1</span>
                <span className="font-mono font-bold text-2xl lg:text-3xl text-yellow-900 mt-4">{useCountUp(leaderboard[0].score)} pts</span>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {leaderboard[2] && visibleRanks.includes(3) && (
            <div className="flex flex-col items-center w-48 lg:w-56 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
              <span className="font-bold text-2xl lg:text-3xl mb-4 text-orange-700 truncate w-full text-center px-2">{leaderboard[2].name}</span>
              <div className="w-full bg-orange-300 rounded-t-3xl h-32 flex flex-col items-center justify-end pb-4 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                <span className="text-7xl font-black text-white drop-shadow-md leading-none">3</span>
                <span className="font-mono font-bold text-xl lg:text-2xl text-orange-900 mt-2">{useCountUp(leaderboard[2].score)} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Rest of leaderboard */}
        {leaderboard.length > 3 && (
          <div className="w-full max-w-4xl bg-[var(--color-surface-elevated)] rounded-[2rem] shadow-xl p-6 lg:p-8 border border-[var(--color-border)] mb-12">
            {leaderboard.slice(3, 10).map((entry, idx) => (
              <div key={entry.id} className="flex justify-between items-center p-4 lg:p-6 border-b border-[var(--color-border)] last:border-0 text-xl lg:text-2xl">
                <div className="flex items-center gap-6">
                  <span className="font-black text-[var(--color-text-secondary)] w-8 text-right">{idx + 4}</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-[var(--color-accent)]">{useCountUp(entry.score)} pts</span>
              </div>
            ))}
            {leaderboard.length > 10 && (
              <div className="text-center pt-6 pb-2 text-lg lg:text-xl font-heading font-bold text-[var(--color-text-secondary)]">
                And {leaderboard.length - 10} more players...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

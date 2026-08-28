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
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[var(--color-surface)] py-12 px-8 overflow-y-auto">
      <h1 className="text-[5rem] font-black text-[var(--color-accent)] mb-16 tracking-tight uppercase drop-shadow-sm">
        Final Results
      </h1>

      {/* Podium for top 3 */}
      <div className="flex items-end justify-center gap-12 mb-20 h-96">
        {/* Rank 2 */}
        {leaderboard[1] && visibleRanks.includes(2) && (
          <div className="flex flex-col items-center w-64 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <span className="font-bold text-4xl mb-4 text-[var(--color-text-secondary)] truncate w-full text-center">{leaderboard[1].name}</span>
            <div className="w-full bg-gray-300 rounded-t-3xl h-56 flex flex-col items-center justify-end pb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              <span className="text-[6rem] font-black text-white drop-shadow-md leading-none">2</span>
              <span className="font-mono font-bold text-2xl text-[var(--color-text-secondary)] mt-4">{useCountUp(leaderboard[1].score)} pts</span>
            </div>
          </div>
        )}
        
        {/* Rank 1 */}
        {leaderboard[0] && visibleRanks.includes(1) && (
          <div className="flex flex-col items-center w-72 z-10 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
            <div className="absolute -top-12 text-6xl animate-bounce">👑</div>
            <span className="font-bold text-5xl mb-4 text-yellow-600 truncate w-full text-center">{leaderboard[0].name}</span>
            <div className="w-full bg-yellow-400 rounded-t-3xl h-80 flex flex-col items-center justify-end pb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
              <span className="text-[8rem] font-black text-white drop-shadow-md leading-none">1</span>
              <span className="font-mono font-bold text-3xl text-yellow-900 mt-4">{useCountUp(leaderboard[0].score)} pts</span>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {leaderboard[2] && visibleRanks.includes(3) && (
          <div className="flex flex-col items-center w-64 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <span className="font-bold text-4xl mb-4 text-orange-700 truncate w-full text-center">{leaderboard[2].name}</span>
            <div className="w-full bg-orange-300 rounded-t-3xl h-40 flex flex-col items-center justify-end pb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              <span className="text-[6rem] font-black text-white drop-shadow-md leading-none">3</span>
              <span className="font-mono font-bold text-2xl text-orange-900 mt-4">{useCountUp(leaderboard[2].score)} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Rest of leaderboard */}
      {leaderboard.length > 3 && (
        <div className="w-full max-w-5xl bg-[var(--color-surface-elevated)] rounded-[2rem] shadow-xl p-8 border border-[var(--color-border)] mb-12">
          {leaderboard.slice(3, 10).map((entry, idx) => (
            <div key={entry.id} className="flex justify-between items-center p-6 border-b border-[var(--color-border)] last:border-0 text-3xl">
              <div className="flex items-center gap-8">
                <span className="font-black text-[var(--color-text-secondary)] w-12 text-right">{idx + 4}</span>
                <span className="font-bold text-[var(--color-text-primary)]">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-[var(--color-accent)]">{useCountUp(entry.score)} pts</span>
            </div>
          ))}
          {leaderboard.length > 10 && (
            <div className="text-center pt-6 pb-2 text-xl font-heading font-bold text-[var(--color-text-secondary)]">
              And {leaderboard.length - 10} more players...
            </div>
          )}
        </div>
      )}

    </div>
  );
}

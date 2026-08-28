import { useCountUp } from "../hooks/useCountUp";
import { usePlayStore } from "../store/playStore";

export function EndedScreen() {
  const myRank = usePlayStore(state => state.myRank);
  const leaderboard = usePlayStore(state => state.leaderboard);
  const participantId = usePlayStore(state => state.participantId);

  const targetScore = leaderboard?.find(e => e.id === participantId)?.score || 0;
  const myScore = useCountUp(targetScore);
  const isTop3 = myRank && myRank <= 3;

  return (
    <div className="flex flex-col items-center w-full min-h-[90vh] px-4 py-8 text-center bg-[var(--color-surface)]">
      
      {isTop3 ? (
        <div className="mb-8 mt-4">
          <div className="w-32 h-32 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-xl mx-auto border-4 border-yellow-200">
            <span className="text-6xl">🏆</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-accent)] mt-6 tracking-tight">Amazing Job!</h1>
          <p className="text-xl text-[var(--color-accent)] font-medium mt-2">You placed on the podium!</p>
        </div>
      ) : (
        <div className="mb-8 mt-4">
          <div className="w-24 h-24 bg-indigo-200 text-[var(--color-accent)] rounded-full flex items-center justify-center shadow-lg mx-auto">
            <span className="text-4xl">🌟</span>
          </div>
          <h1 className="text-3xl font-black text-[var(--color-accent)] mt-6 tracking-tight">Great Effort!</h1>
          <p className="text-lg text-[var(--color-accent)] font-medium mt-2">Thanks for playing.</p>
        </div>
      )}

      {myRank && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-8 border border-[var(--color-border)] mb-8 transform hover:scale-105 transition-transform">
          <div className="text-[var(--color-text-secondary)] font-bold mb-2 uppercase tracking-widest text-sm">Final Result</div>
          
          <div className="flex justify-center items-end gap-1 mb-4">
            <span className="text-6xl font-heading font-black text-[var(--color-accent)]">{myRank}</span>
            <span className="text-2xl font-heading font-bold text-indigo-400 mb-1">
              {myRank === 1 ? 'st' : myRank === 2 ? 'nd' : myRank === 3 ? 'rd' : 'th'}
            </span>
            <span className="text-xl font-heading font-bold text-[var(--color-text-secondary)] mb-2 ml-2">Place</span>
          </div>
          
          <div className="inline-block bg-[var(--color-surface)] px-6 py-2 rounded-full border border-[var(--color-border)]">
            <span className="text-2xl font-heading font-bold font-mono text-[var(--color-accent)]">{myScore}</span>
            <span className="text-[var(--color-accent)] font-semibold ml-2">Points</span>
          </div>
        </div>
      )}

      {leaderboard && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-5 border border-[var(--color-border)] mt-auto text-left">
          <h3 className="font-bold text-[var(--color-text-primary)] mb-3 text-center border-b pb-3">Final Leaderboard Top 5</h3>
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div 
                key={entry.id} 
                className={`flex justify-between items-center p-2 rounded-xl ${entry.id === participantId ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold w-5 ${idx < 3 ? 'text-yellow-500' : 'text-[var(--color-text-secondary)]'}`}>{idx + 1}</span>
                  <span className={`font-semibold ${entry.id === participantId ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} truncate max-w-[150px]`}>
                    {entry.name} {entry.id === participantId && '(You)'}
                  </span>
                </div>
                <span className="font-mono font-bold text-[var(--color-accent)] text-sm">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

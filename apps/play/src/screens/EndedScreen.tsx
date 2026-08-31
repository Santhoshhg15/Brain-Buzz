import { useEffect } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { usePlayStore } from "../store/playStore";
import { RippleButton } from "../components/RippleButton";
import { calculateAchievements } from "../utils/calculateAchievements";

export function EndedScreen() {
  const myRank = usePlayStore(state => state.myRank);
  const leaderboard = usePlayStore(state => state.leaderboard);
  const participantId = usePlayStore(state => state.participantId);
  const fetchPerformanceReport = usePlayStore(state => state.fetchPerformanceReport);
  const performanceReport = usePlayStore(state => state.performanceReport);

  useEffect(() => {
    fetchPerformanceReport();
  }, [fetchPerformanceReport]);

  const targetEntry = leaderboard?.find(e => e.id === participantId);
  const targetScore = targetEntry?.score || 0;
  const myScore = useCountUp(targetScore);
  const isTop3 = myRank && myRank <= 3;

  const accuracyPercent = performanceReport 
    ? Math.round(performanceReport.accuracyPercent) 
    : (targetEntry?.accuracyBonusApplied === 500 ? 90 : targetEntry?.accuracyBonusApplied === 250 ? 75 : 60);

  const achievements = performanceReport
    ? calculateAchievements(performanceReport, myRank)
    : [];

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

      {achievements.length > 0 && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-5 border border-[var(--color-border)] mb-8">
          <div className="text-[var(--color-text-secondary)] font-bold mb-3 uppercase tracking-widest text-xs">
            Achievements Earned
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {achievements.map((achievement, idx) => (
              <div 
                key={achievement.id}
                title={achievement.description}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] shadow-sm animate-streak-bounce select-none cursor-help"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <span className="text-lg">{achievement.icon}</span>
                <span>{achievement.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {targetEntry?.accuracyBonusApplied && targetEntry.accuracyBonusApplied > 0 && (
        <div className="w-full max-w-sm bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-8 text-green-700 dark:text-green-400 text-center animate-streak-bounce">
          <div className="font-extrabold text-base flex items-center justify-center gap-1.5">
            <span>🎯</span> Accuracy Bonus!
          </div>
          <p className="text-sm font-semibold mt-1">
            +{targetEntry.accuracyBonusApplied} points for {accuracyPercent}% accuracy!
          </p>
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

      <div className="mt-8 mb-6 w-full max-w-sm flex flex-col gap-3">
        <RippleButton
          onClick={() => usePlayStore.getState().setReportScreenActive(true)}
          className="w-full btn-base py-4 bg-[var(--color-surface-elevated)] border-2 border-[var(--color-accent)] text-[var(--color-accent)] uppercase tracking-wider text-sm shadow-md hover:bg-[var(--color-accent)] hover:text-white"
        >
          View My Performance Report
          <span className="text-lg">📊</span>
        </RippleButton>
        <RippleButton
          onClick={() => usePlayStore.getState().resetGame()}
          className="w-full btn-secondary py-3.5 uppercase tracking-wider text-xs font-bold"
        >
          Exit to Home
        </RippleButton>
      </div>
    </div>
  );
}

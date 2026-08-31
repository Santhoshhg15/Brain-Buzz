import { useEffect } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { usePlayStore } from "../store/playStore";
import { haptics } from "../utils/haptics";
import { optionStyles, OptionIcon } from "./QuestionScreen";
import { Lightbulb } from "lucide-react";

function AnimatedScore({ score }: { score: number }) {
  return <>{useCountUp(score)}</>;
}

export function RevealScreen() {
  const currentQuestion = usePlayStore(state => state.currentQuestion);
  const revealData = usePlayStore(state => state.revealData);

  const myLastAnswerCorrect = usePlayStore(state => state.myLastAnswerCorrect);
  const myRank = usePlayStore(state => state.myRank);
  const leaderboard = usePlayStore(state => state.leaderboard);
  const participantId = usePlayStore(state => state.participantId);

  useEffect(() => {
    if (revealData) {
      if (myLastAnswerCorrect) haptics.success();
      else haptics.error();
    }
  }, [revealData, myLastAnswerCorrect]);

  if (!currentQuestion || !revealData) return null;

  const correctOptionIndex = currentQuestion.options.findIndex(o => o.id === revealData.correctOptionId);
  const correctStyle = optionStyles[correctOptionIndex % optionStyles.length] || optionStyles[0];
  const correctText = currentQuestion.options[correctOptionIndex]?.text || "";

  const targetScore = leaderboard?.find(e => e.id === participantId)?.score || 0;
  const myScore = useCountUp(targetScore);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[90vh] px-4 py-8 text-center bg-[var(--color-bg)]">
      
      {/* Result Card */}
      <div className={`w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl border p-6 mb-8 shadow-md transition-all duration-300 relative overflow-hidden ${
        myLastAnswerCorrect ? 'border-green-500/30 animate-[glowPulse_400ms_var(--ease-out-expo)]' : 'border-red-500/30'
      }`}>
        {/* Subtle top indicator bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${myLastAnswerCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        {myLastAnswerCorrect ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-heading font-black text-[var(--color-text-primary)] tracking-tight">
              Nailed it! 🎉
            </h2>
            {revealData.currentStreak && revealData.currentStreak >= 3 && (
              <div className="mt-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-sm tracking-wide animate-streak-bounce">
                <span>
                  {revealData.currentStreak >= 7 ? "🔥🔥🔥" : revealData.currentStreak >= 5 ? "🔥🔥" : "🔥"}
                </span>
                <span>{revealData.currentStreak} in a row!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-heading font-black text-[var(--color-text-primary)] tracking-tight">
              Not quite!
            </h2>
          </div>
        )}
      </div>

      {!myLastAnswerCorrect && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-5 border border-[var(--color-border)] mb-8">
          <p className="text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Correct Answer was</p>
          <div className={`${correctStyle.bg} text-white p-4 rounded-xl shadow-inner flex items-center gap-3 justify-center`}>
             <OptionIcon type={correctStyle.icon} className="w-6 h-6" />
             <span className="font-bold text-lg truncate">{correctText}</span>
          </div>
        </div>
      )}

      {revealData.explanation && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-5 border border-[var(--color-border)] mb-8 text-left">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
            <Lightbulb className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Why?</span>
          </div>
          <p className="text-[var(--color-text-primary)] font-medium text-[15px] leading-relaxed">
            {revealData.explanation}
          </p>
        </div>
      )}

      {myRank && leaderboard && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-6 border border-[var(--color-border)] mb-4">
          <div className="text-[var(--color-text-secondary)] font-semibold mb-1">Current Standing</div>
          <div className="flex justify-between items-end border-b border-[var(--color-border)] pb-3 mb-3">
            <div className="text-4xl font-black text-[var(--color-accent)]">
              {myRank}
              <span className="text-xl text-indigo-400 font-bold ml-1">
                {myRank === 1 ? 'st' : myRank === 2 ? 'nd' : myRank === 3 ? 'rd' : 'th'}
              </span>
            </div>
            <div className="text-2xl font-heading font-bold font-mono text-[var(--color-text-primary)]">{myScore} <span className="text-sm text-[var(--color-text-secondary)]">pts</span></div>
          </div>
          {myRank === 1 && <div className="text-[var(--color-accent)] font-bold animate-pulse">You're in the lead! 🏆</div>}
          {myRank > 1 && myRank <= 5 && <div className="text-[var(--color-accent)] font-bold">Top 5! Keep it up! 🚀</div>}
        </div>
      )}

      {leaderboard && leaderboard.length > 0 && (
        <div className="w-full max-w-sm flex-1 max-h-[40vh] overflow-y-auto bg-[var(--color-surface-elevated)] rounded-2xl shadow-md border border-[var(--color-border)] mb-4 hide-scrollbar">
          <div className="sticky top-0 bg-[var(--color-surface-elevated)] p-3 border-b border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] uppercase z-10 text-center shadow-sm">
            Full Leaderboard
          </div>
          <div className="p-2 flex flex-col gap-2">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.id === participantId;
              return (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    isMe 
                      ? 'bg-[var(--color-accent)]/15 border-2 border-[var(--color-accent)]/30' 
                      : 'bg-[var(--color-surface)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black w-6 text-center text-[var(--color-text-secondary)]">{idx + 1}</span>
                    <span className={`font-bold truncate max-w-[120px] ${isMe ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                      {entry.name}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${isMe ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                    <AnimatedScore score={entry.score} /> pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 flex items-center gap-3 text-[var(--color-text-secondary)] font-medium">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        Waiting for next question...
      </div>

    </div>
  );
}

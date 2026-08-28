import { useEffect } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { usePlayStore } from "../store/playStore";
import { haptics } from "../utils/haptics";
import { optionStyles, OptionIcon } from "./QuestionScreen";

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
    <div className={`flex flex-col items-center justify-center w-full min-h-[90vh] px-4 py-8 text-center transition-colors duration-500 ${
      myLastAnswerCorrect ? 'bg-[var(--color-success-bg)] animate-[glowPulse_400ms_var(--ease-out-expo)]' : 'bg-[var(--color-error-bg)]'
    }`}>
      
      {myLastAnswerCorrect ? (
        <div className="mb-6 animate-bounce">
          <div className="w-24 h-24 bg-[var(--color-success)] text-white rounded-full flex items-center justify-center shadow-lg mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-[var(--color-success)] mt-4 tracking-tight">Nailed it! 🎉</h2>
        </div>
      ) : (
        <div className="mb-6">
          <div className="w-24 h-24 bg-[var(--color-error)] text-white rounded-full flex items-center justify-center shadow-lg mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-[var(--color-error)] mt-4 tracking-tight">Not quite!</h2>
        </div>
      )}

      {!myLastAnswerCorrect && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-5 border border-[var(--color-border)] mb-8">
          <p className="text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Correct Answer was</p>
          <div className={`${correctStyle.bg} text-white p-4 rounded-xl shadow-inner flex items-center gap-3 justify-center`}>
             <OptionIcon type={correctStyle.icon} className="w-6 h-6" />
             <span className="font-bold text-lg truncate">{correctText}</span>
          </div>
        </div>
      )}

      {myRank && leaderboard && (
        <div className="w-full max-w-sm bg-[var(--color-surface-elevated)] rounded-2xl shadow-md p-6 border border-[var(--color-border)] mb-8">
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

      <div className="mt-auto pt-8 flex items-center gap-3 text-[var(--color-text-secondary)] font-medium">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        Waiting for next question...
      </div>

    </div>
  );
}

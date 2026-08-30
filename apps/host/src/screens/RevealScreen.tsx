import { useCountUp } from "../hooks/useCountUp";
import { useHostStore } from "../store/hostStore";

function LeaderboardRow({ entry, idx }: { entry: any; idx: number }) {
  const animatedScore = useCountUp(entry.score);
  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-center gap-4">
        <span className="text-xl font-heading font-bold text-[var(--color-text-secondary)] w-6">{idx + 1}</span>
        <span className="text-lg font-bold text-[var(--color-text-primary)]">{entry.name}</span>
      </div>
      <span className="font-mono font-bold text-[var(--color-accent)]">{animatedScore}</span>
    </div>
  );
}

export function RevealScreen() {
  const currentQuestion = useHostStore(state => state.currentQuestion);
  const revealData = useHostStore(state => state.revealData);
  const leaderboard = useHostStore(state => state.leaderboard);
  const nextQuestion = useHostStore(state => state.nextQuestion);
  const endSession = useHostStore(state => state.endSession);

  if (!currentQuestion || !revealData) return null;

  const isLastQuestion = currentQuestion.index + 1 >= currentQuestion.total;

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto gap-8 min-h-[80vh]">
      
      {/* Left side - Question and Answers */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[var(--color-surface-elevated)] p-8 rounded-2xl shadow-md border border-[var(--color-border)] mb-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {currentQuestion.options.map((opt) => {
            const isCorrect = opt.id === revealData.correctOptionId;
            const count = revealData.optionCounts[opt.id] || 0;
            
            return (
              <div 
                key={opt.id} 
                className={`flex items-center justify-between p-6 rounded-xl border-4 transition-all ease-[var(--ease-smooth)]
                  ${isCorrect 
                    ? "bg-[var(--color-success-bg)] animate-[glowPulse_400ms_var(--ease-out-expo)] border-[var(--color-success)] shadow-md" 
                    : "bg-[var(--color-surface-elevated)] border-transparent opacity-60"
                  }`}
              >
                <div className="flex items-center gap-4">
                  {isCorrect && (
                    <div className="bg-[var(--color-success)] text-white rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className={`text-2xl font-heading font-bold ${isCorrect ? "text-[var(--color-success)]" : "text-[var(--color-text-secondary)]"}`}>
                    {opt.text}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-gray-200 rounded-full w-32 overflow-hidden">
                    <div 
                      className={`h-full ${isCorrect ? "bg-[var(--color-success)]" : "bg-gray-400"}`}
                      style={{ width: `${Math.min(100, count * 10)}%` }} // Very naive max-width for visual flair
                    />
                  </div>
                  <span className="font-bold text-xl min-w-[2rem] text-right text-[var(--color-text-secondary)]">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side - Live Leaderboard */}
      <div className="w-full lg:w-96 flex flex-col">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-lg border border-[var(--color-border)] overflow-hidden flex-1 flex flex-col">
          <div className="bg-[var(--color-accent)] p-6 text-white text-center">
            <h3 className="text-2xl font-heading font-bold">Top 5</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <LeaderboardRow key={entry.id} entry={entry} idx={idx} />
            ))}
            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-[var(--color-text-secondary)] italic">No scores yet</div>
            )}
          </div>
        </div>

        <div className="mt-8">
          {isLastQuestion ? (
            <button
              onClick={endSession}
              className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-all ease-[var(--ease-smooth)]"
            >
              End Session & Results
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-all ease-[var(--ease-smooth)]"
            >
              Next Question →
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

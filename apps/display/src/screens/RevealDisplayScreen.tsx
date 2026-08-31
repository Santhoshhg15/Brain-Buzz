import { useCountUp } from "../hooks/useCountUp";
import { useDisplayStore } from "../store/displayStore";
import { optionStyles, OptionIcon } from "../components/SharedUI";
import { Lightbulb } from "lucide-react";

function AnimatedScore({ score }: { score: number }) {
  return <>{useCountUp(score)}</>;
}

export function RevealDisplayScreen() {
  const currentQuestion = useDisplayStore(state => state.currentQuestion);
  const revealData = useDisplayStore(state => state.revealData);
  const leaderboard = useDisplayStore(state => state.leaderboard);

  if (!currentQuestion || !revealData) return null;

  const totalAnswers = Object.values(revealData.optionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-screen bg-[var(--color-bg)] py-10 px-8 sm:px-12 md:px-16 flex flex-col overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        
        {/* Header / Question Text */}
        <div className="bg-[var(--color-surface-elevated)] p-10 lg:p-12 rounded-2xl shadow-xl border border-[var(--color-border)] mb-8 text-center flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 lg:h-3 bg-[var(--color-accent)]"></div>
          <h2 className="text-4xl lg:text-5xl font-heading font-black text-[var(--color-text-primary)] leading-tight">
            {currentQuestion.text}
          </h2>
        </div>

        {(() => {
          const notableStreakEntries = leaderboard
            ? leaderboard.filter(e => e.currentStreak && e.currentStreak >= 3)
            : [];
          if (notableStreakEntries.length === 0) return null;
          const highestStreakEntry = notableStreakEntries.reduce((max, entry) => 
            (entry.currentStreak || 0) > (max.currentStreak || 0) ? entry : max
          , notableStreakEntries[0]);

          return (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 py-3.5 px-6 rounded-xl font-heading font-black text-xl lg:text-2xl text-center flex items-center justify-center gap-2 shadow-sm animate-pulse">
              <span>🔥</span>
              <span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{highestStreakEntry.name}</span> is on a {highestStreakEntry.currentStreak}-question streak!
              </span>
            </div>
          );
        })()}

        {/* Two-column layout for Reveal: Left = Options/Bars, Right = Top 5 Leaderboard */}
        <div className="flex gap-8 lg:gap-12 flex-1 min-h-0">
          
          {/* Left Side: Options with Bar Charts */}
          <div className="flex flex-col gap-4 lg:gap-6 w-[65%] h-full overflow-y-auto hide-scrollbar pb-4">
            {currentQuestion.options.map((opt, i) => {
              const style = optionStyles[i % optionStyles.length];
              const isCorrect = opt.id === revealData.correctOptionId;
              const count = revealData.optionCounts[opt.id] || 0;
              const widthPct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;

              return (
                <div 
                  key={opt.id} 
                  className={`flex-1 flex items-center justify-between p-4 lg:p-6 rounded-2xl shadow-md border-2 overflow-hidden transition-all duration-500
                    ${isCorrect 
                      ? "bg-[var(--color-surface-elevated)] border-[var(--color-success)] transform scale-[1.02]" 
                      : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-60"
                    }`}
                >
                  {/* Option Content */}
                  <div className="flex-1 flex items-center gap-4 lg:gap-6 overflow-hidden">
                    <div className={`p-3 lg:p-4 rounded-xl ${isCorrect ? style.bg : 'bg-gray-400'} text-white`}>
                      <OptionIcon type={style.icon} className="w-8 h-8 lg:w-10 lg:h-10" />
                    </div>
                    <span className={`text-2xl lg:text-3xl font-heading font-bold truncate ${isCorrect ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {opt.text}
                    </span>
                  </div>

                  {/* Bar Chart section */}
                  <div className="flex items-center gap-4 lg:gap-6 w-[40%] justify-end">
                    <div className="h-6 lg:h-8 bg-gray-200 rounded-full w-full flex-1 overflow-hidden relative">
                      <div 
                        className={`absolute top-0 right-0 h-full ${isCorrect ? "bg-[var(--color-success)]" : "bg-gray-400"} transition-all duration-1000 ease-out`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-3xl lg:text-4xl font-heading font-black w-12 lg:w-16 text-right text-[var(--color-text-primary)]">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {revealData.explanation && (
              <div className="mt-2 bg-[var(--color-surface-elevated)] p-6 lg:p-8 rounded-2xl shadow-md border-2 border-[var(--color-accent)]/30 text-left relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-2 h-full bg-[var(--color-accent)]"></div>
                <div className="flex items-center gap-3 mb-3 text-[var(--color-accent)]">
                  <Lightbulb className="w-8 h-8" />
                  <span className="text-xl lg:text-2xl font-black uppercase tracking-widest">Why?</span>
                </div>
                <p className="text-[var(--color-text-primary)] font-medium text-2xl lg:text-3xl leading-relaxed">
                  {revealData.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Live Leaderboard */}
          <div className="w-[35%] flex flex-col h-full bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[var(--color-accent)] p-6 lg:p-8 text-white text-center">
              <h3 className="text-2xl lg:text-3xl font-black tracking-widest uppercase">Leaderboard</h3>
            </div>
            
            <div className="flex-1 p-6 lg:p-8 flex flex-col gap-4 overflow-y-auto hide-scrollbar">
              {leaderboard?.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-4 lg:p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shrink-0">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <span className={`text-2xl lg:text-3xl font-black w-6 lg:w-8 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-[var(--color-text-secondary)]' : idx === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-xl lg:text-2xl font-heading font-bold text-[var(--color-text-primary)] truncate max-w-[150px] lg:max-w-[200px]">{entry.name}</span>
                  </div>
                  <span className="font-mono font-black text-2xl lg:text-3xl text-[var(--color-accent)]"><AnimatedScore score={entry.score} /></span>
                </div>
              ))}
              
              {(!leaderboard || leaderboard.length === 0) && (
                <div className="text-center text-[var(--color-text-secondary)] text-xl lg:text-2xl font-medium italic mt-10">
                  Awaiting scores...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

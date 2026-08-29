import { useCountUp } from "../hooks/useCountUp";
import { useDisplayStore } from "../store/displayStore";
import { optionStyles, OptionIcon } from "../components/SharedUI";

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

        {/* Two-column layout for Reveal: Left = Options/Bars, Right = Top 5 Leaderboard */}
        <div className="flex gap-8 lg:gap-12 flex-1 min-h-0">
          
          {/* Left Side: Options with Bar Charts */}
          <div className="flex flex-col gap-4 lg:gap-6 w-[65%] h-full">
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
          </div>

          {/* Right Side: Live Top 5 Leaderboard */}
          <div className="w-[35%] flex flex-col h-full bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[var(--color-accent)] p-6 lg:p-8 text-white text-center">
              <h3 className="text-2xl lg:text-3xl font-black tracking-widest uppercase">Top 5</h3>
            </div>
            
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-around">
              {leaderboard?.slice(0, 5).map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-4 lg:p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <span className={`text-2xl lg:text-3xl font-black w-6 lg:w-8 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-[var(--color-text-secondary)]' : idx === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-xl lg:text-2xl font-heading font-bold text-[var(--color-text-primary)] truncate max-w-[150px] lg:max-w-[200px]">{entry.name}</span>
                  </div>
                  <span className="font-mono font-black text-2xl lg:text-3xl text-[var(--color-accent)]">{useCountUp(entry.score)}</span>
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

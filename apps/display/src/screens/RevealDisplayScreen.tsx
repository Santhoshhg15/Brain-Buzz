import { useCountUp } from "../hooks/useCountUp";
import { useDisplayStore } from "../store/displayStore";
import { optionStyles, OptionIcon } from "../components/SharedUI";

export function RevealDisplayScreen() {
  const currentQuestion = useDisplayStore(state => state.currentQuestion);
  const revealData = useDisplayStore(state => state.revealData);
  const leaderboard = useDisplayStore(state => state.leaderboard);

  if (!currentQuestion || !revealData) return null;

  // Find max count for bar chart scaling
  const maxCount = Math.max(1, ...Object.values(revealData.optionCounts));

  return (
    <div className="flex flex-col w-full h-screen bg-[var(--color-surface)] p-8 overflow-hidden">
      
      {/* Question Text */}
      <div className="bg-[var(--color-surface-elevated)] p-12 rounded-2xl shadow-xl border border-[var(--color-border)] mb-12 text-center flex-shrink-0">
        <h2 className="text-[3.5rem] font-heading font-black text-[var(--color-text-primary)] leading-tight">
          {currentQuestion.text}
        </h2>
      </div>

      <div className="flex gap-12 flex-1 pb-4 h-full">
        
        {/* Left Side: Options and Bar Chart */}
        <div className="flex-1 flex flex-col gap-6 justify-center">
          {currentQuestion.options.map((opt, i) => {
            const isCorrect = opt.id === revealData.correctOptionId;
            const count = revealData.optionCounts[opt.id] || 0;
            const style = optionStyles[i % optionStyles.length];
            const widthPct = Math.max(5, (count / maxCount) * 100);
            
            return (
              <div 
                key={opt.id} 
                className={`flex items-center gap-6 p-6 rounded-2xl border-[6px] transition-all ease-[var(--ease-smooth)]
                  ${isCorrect 
                    ? "bg-[var(--color-success-bg)] animate-[glowPulse_400ms_var(--ease-out-expo)] border-[var(--color-success)] shadow-2xl scale-[1.02]" 
                    : "bg-[var(--color-surface-elevated)] border-transparent opacity-60 grayscale-[30%]"
                  }`}
              >
                {/* Option Content */}
                <div className="flex-1 flex items-center gap-6 overflow-hidden">
                  <div className={`p-4 rounded-xl ${isCorrect ? style.bg : 'bg-gray-400'} text-white`}>
                    <OptionIcon type={style.icon} className="w-12 h-12" />
                  </div>
                  <span className={`text-4xl font-heading font-bold truncate ${isCorrect ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                    {opt.text}
                  </span>
                </div>

                {/* Bar Chart section */}
                <div className="flex items-center gap-6 w-[40%] justify-end">
                  <div className="h-8 bg-gray-200 rounded-full w-full flex-1 overflow-hidden relative">
                    <div 
                      className={`absolute top-0 right-0 h-full ${isCorrect ? "bg-[var(--color-success)]" : "bg-gray-400"} transition-all duration-1000 ease-out`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-5xl font-heading font-black w-20 text-right text-[var(--color-text-primary)]">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Live Top 5 Leaderboard */}
        <div className="w-[35%] flex flex-col h-full bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden">
          <div className="bg-[var(--color-accent)] p-8 text-white text-center">
            <h3 className="text-4xl font-black tracking-widest uppercase">Top 5</h3>
          </div>
          
          <div className="flex-1 p-8 flex flex-col justify-around">
            {leaderboard?.slice(0, 5).map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                <div className="flex items-center gap-6">
                  <span className={`text-4xl font-black w-8 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-[var(--color-text-secondary)]' : idx === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-3xl font-heading font-bold text-[var(--color-text-primary)] truncate max-w-[200px]">{entry.name}</span>
                </div>
                <span className="font-mono font-black text-4xl text-[var(--color-accent)]">{useCountUp(entry.score)}</span>
              </div>
            ))}
            
            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center text-[var(--color-text-secondary)] text-3xl font-medium italic mt-10">
                Awaiting scores...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

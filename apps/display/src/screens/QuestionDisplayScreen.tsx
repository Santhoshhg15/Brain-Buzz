import { useEffect, useState } from "react";
import { useDisplayStore } from "../store/displayStore";
import { optionStyles, OptionIcon } from "../components/SharedUI";

export function QuestionDisplayScreen() {
  const currentQuestion = useDisplayStore(state => state.currentQuestion);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!currentQuestion) return;
    
    const endTime = currentQuestion.serverStartTime + (currentQuestion.durationSeconds * 1000);
    const totalDuration = currentQuestion.durationSeconds * 1000;
    
    const updateTimer = () => {
      const remainingMs = Math.max(0, endTime - Date.now());
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setProgress((remainingMs / totalDuration) * 100);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 50); // Fast interval for smooth big-screen progress bar
    
    return () => clearInterval(interval);
  }, [currentQuestion]);

  if (!currentQuestion) return null;

  const getTimerColor = () => {
    if (progress > 50) return "bg-[var(--color-accent)]";
    if (progress > 25) return "bg-amber-500";
    return "bg-[var(--color-error)] animate-pulse";
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[var(--color-bg)] p-8 overflow-hidden">
      
      {/* Header / Timer */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm px-8 py-3 rounded-full text-3xl font-heading font-bold text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border)]">
          Question {currentQuestion.index + 1} of {currentQuestion.total}
        </div>
        
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl font-heading font-black shadow-inner
          ${progress <= 15 ? "bg-red-100 text-[var(--color-error)] animate-pulse scale-110 transition-transform" : "bg-indigo-100 text-[var(--color-accent)]"}`}>
          {timeLeft}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-4 rounded-full mb-12 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${getTimerColor()} transition-all duration-200 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Text */}
      <div className="bg-[var(--color-surface-elevated)] p-16 rounded-2xl shadow-xl border border-[var(--color-border)] mb-12 text-center flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-[var(--color-accent)]"></div>
        <h2 className="text-[4rem] font-heading font-black text-[var(--color-text-primary)] leading-tight">
          {currentQuestion.text}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-8 flex-1 pb-4">
        {currentQuestion.options.map((opt, i) => {
          const style = optionStyles[i % optionStyles.length];
          return (
            <div
              key={opt.id}
              className={`${style.bg} text-white p-12 rounded-2xl shadow-xl flex items-center gap-8 min-h-[160px] transform transition-transform`}
            >
              <div className="bg-[var(--color-surface-elevated)]/20 p-6 rounded-2xl flex-shrink-0 shadow-inner">
                <OptionIcon type={style.icon} className="w-20 h-20 text-white drop-shadow-md" />
              </div>
              <span className="text-[3rem] font-bold text-left drop-shadow-md leading-tight">
                {opt.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

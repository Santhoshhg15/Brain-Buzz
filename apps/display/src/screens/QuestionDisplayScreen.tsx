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
    const interval = setInterval(updateTimer, 50);
    
    return () => clearInterval(interval);
  }, [currentQuestion]);

  if (!currentQuestion) return null;

  const getTimerColor = () => {
    if (progress > 50) return "bg-[var(--color-accent)]";
    if (progress > 25) return "bg-amber-500";
    return "bg-[var(--color-error)] animate-pulse";
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[var(--color-bg)] py-10 px-8 sm:px-12 md:px-16 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        {/* Header / Timer */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm px-6 py-2 lg:px-8 lg:py-3 rounded-full text-xl lg:text-2xl font-heading font-bold text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border)]">
            Question {currentQuestion.index + 1} of {currentQuestion.total}
          </div>
          
          <div className={`w-24 h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center text-5xl lg:text-6xl font-heading font-black shadow-inner
            ${progress <= 15 ? "bg-red-100 text-[var(--color-error)] animate-pulse scale-110 transition-transform" : "bg-indigo-100 text-[var(--color-accent)]"}`}>
            {timeLeft}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-3 lg:h-4 rounded-full mb-8 overflow-hidden shadow-inner">
          <div 
            className={`h-full ${getTimerColor()} transition-all duration-200 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="bg-[var(--color-surface-elevated)] p-10 lg:p-12 rounded-2xl shadow-xl border border-[var(--color-border)] mb-8 text-center flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 lg:h-3 bg-[var(--color-accent)]"></div>
          <h2 className="text-4xl lg:text-5xl font-heading font-black text-[var(--color-text-primary)] leading-tight">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 lg:gap-6 flex-1 min-h-0 pb-4">
          {currentQuestion.options.map((opt, i) => {
            const style = optionStyles[i % optionStyles.length];
            return (
              <div
                key={opt.id}
                className={`${style.bg} text-white p-6 lg:p-8 rounded-2xl shadow-xl flex items-center gap-6 transform transition-transform`}
              >
                <div className="bg-[var(--color-surface-elevated)]/20 p-4 lg:p-6 rounded-2xl flex-shrink-0 shadow-inner">
                  <OptionIcon type={style.icon} className="w-12 h-12 lg:w-16 lg:h-16 text-white drop-shadow-md" />
                </div>
                <span className="text-3xl lg:text-4xl font-bold text-left drop-shadow-md leading-tight line-clamp-3">
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

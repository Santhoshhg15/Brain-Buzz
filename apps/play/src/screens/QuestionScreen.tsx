import { useEffect, useState, useRef } from "react";
import { usePlayStore } from "../store/playStore";
import { haptics } from "../utils/haptics";

export const optionStyles = [
  { bg: "bg-red-500", hover: "hover:bg-red-600", active: "active:bg-red-700", icon: "triangle" },
  { bg: "bg-blue-500", hover: "hover:bg-[var(--color-accent)]", active: "active:bg-blue-700", icon: "diamond" },
  { bg: "bg-yellow-500", hover: "hover:bg-yellow-600", active: "active:bg-yellow-700", icon: "circle" },
  { bg: "bg-[var(--color-success)]", hover: "hover:bg-green-600", active: "active:bg-green-700", icon: "square" },
];

export function OptionIcon({ type, className = "w-8 h-8" }: { type: string, className?: string }) {
  if (type === "triangle") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L22 20H2L12 2Z" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
      </svg>
    );
  }
  if (type === "circle") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  // square
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export function QuestionScreen() {
  const currentQuestion = usePlayStore(state => state.currentQuestion);
  const submitAnswer = usePlayStore(state => state.submitAnswer);
  const selectedOptionId = usePlayStore(state => state.selectedOptionId);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const urgentTriggered = useRef(false);

  useEffect(() => {
    if (!currentQuestion) return;
    
    const endTime = currentQuestion.serverStartTime + (currentQuestion.durationSeconds * 1000);
    const totalDuration = currentQuestion.durationSeconds * 1000;
    
    urgentTriggered.current = false;
    
    const updateTimer = () => {
      const remainingMs = Math.max(0, endTime - Date.now());
      const currentProgress = (remainingMs / totalDuration) * 100;
      
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setProgress(currentProgress);
      
      if (currentProgress <= 25 && currentProgress > 0 && !urgentTriggered.current) {
        urgentTriggered.current = true;
        haptics.urgent();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 100); // 100ms for smoother progress bar
    
    return () => clearInterval(interval);
  }, [currentQuestion]);

  if (!currentQuestion) return null;

  const handleOptionClick = (optId: string) => {
    haptics.tap();
    submitAnswer(optId);
  };

  const getTimerColor = () => {
    if (progress > 50) return "bg-[var(--color-accent)]";
    if (progress > 25) return "bg-amber-500";
    return "bg-[var(--color-error)] animate-pulse";
  };

  return (
    <div className="flex flex-col w-full min-h-[90vh] px-2 py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] px-3 py-1 rounded-full shadow-sm border border-[var(--color-border)]">
          {currentQuestion.index + 1} / {currentQuestion.total}
        </span>
        <div className="font-black text-2xl w-10 text-center text-[var(--color-text-primary)]">
          {timeLeft}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full ${getTimerColor()} transition-all duration-200 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Text */}
      <div className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-md border border-[var(--color-border)] mb-6 flex-shrink-0">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold break-words text-[var(--color-text-primary)] text-center leading-tight">
          {currentQuestion.text}
        </h2>
      </div>

    {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3 flex-1">
        {currentQuestion.options.map((opt, i) => {
          const style = optionStyles[i % optionStyles.length];
          const isSelected = selectedOptionId === opt.id;
          const isDimmed = selectedOptionId && !isSelected;
          
          return (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              disabled={!!selectedOptionId}
              className={`${style.bg} ${style.hover} ${style.active} text-white p-6 rounded-xl shadow-premium transition-all ease-[var(--ease-smooth)] duration-150 flex items-center gap-4 active:scale-[0.98] h-full min-h-[80px]
                ${isSelected ? "animate-[popIn_200ms_var(--ease-spring)] ring-4 ring-white" : ""}
                ${isDimmed ? "opacity-50" : ""}
              `}
            >
              <div className="bg-[var(--color-surface-elevated)]/20 p-2 rounded-xl flex-shrink-0">
                <OptionIcon type={style.icon} className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <span className="text-xl sm:text-2xl font-heading font-bold break-words text-left drop-shadow-sm leading-tight flex-1">
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

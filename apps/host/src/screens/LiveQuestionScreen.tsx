import { useEffect, useState } from "react";
import { useHostStore } from "../store/hostStore";
import { haptics } from "../utils/haptics";

export function LiveQuestionScreen() {
  const currentQuestion = useHostStore(state => state.currentQuestion);
  const nextQuestion = useHostStore(state => state.nextQuestion);
  
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!currentQuestion) return;
    
    // Calculate initial time left
    const endTime = currentQuestion.serverStartTime + (currentQuestion.durationSeconds * 1000);
    
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    
    return () => clearInterval(interval);
  }, [currentQuestion]);

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto min-h-[80vh]">
      <div className="flex justify-between items-center mb-8">
        <div className="bg-[var(--color-surface-elevated)] px-6 py-2 rounded-full font-bold text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border)]">
          Question {currentQuestion.index + 1} of {currentQuestion.total}
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-inner
            ${timeLeft <= 5 ? "bg-red-100 text-[var(--color-error)] animate-pulse" : "bg-indigo-100 text-[var(--color-accent)]"}`}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-elevated)] p-10 rounded-2xl shadow-lg border border-[var(--color-border)] mb-10 text-center">
        <h2 className="text-4xl font-heading font-bold text-[var(--color-text-primary)] leading-tight">
          {currentQuestion.text}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 mt-auto">
        {currentQuestion.options.map((opt, i) => {
          // Add standard kahoot-like colors for the 4 options
          const colors = [
            "bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-[var(--color-success)]"
          ];
          const bgColor = colors[i % colors.length];
          
          return (
            <div key={opt.id} className={`${bgColor} text-white p-8 rounded-xl shadow-md min-h-[120px] flex items-center`}>
              <span className="text-2xl font-heading font-bold">{opt.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            haptics.tap();
            nextQuestion();
          }}
          className="bg-gray-200 hover:bg-gray-300 text-[var(--color-text-secondary)] px-8 py-3 rounded-full font-bold transition-colors"
        >
          Skip / Reveal Now
        </button>
      </div>
    </div>
  );
}

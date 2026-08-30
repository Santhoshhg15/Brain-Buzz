import { useEffect, useState } from "react";
import { useHostStore } from "../store/hostStore";
import { haptics } from "../utils/haptics";

export function LiveQuestionScreen() {
  // ─── 1. ALL HOOKS MUST BE AT THE TOP BEFORE ANY EARLY RETURNS ──────────────
  const currentQuestion = useHostStore((state) => state.currentQuestion);
  const isPaused = useHostStore((state) => state.isPaused);
  const answeredCount = useHostStore((state) => state.answeredCount);
  const totalParticipants = useHostStore((state) => state.totalParticipants);
  const participants = useHostStore((state) => state.participants);

  const nextQuestion = useHostStore((state) => state.nextQuestion);
  const pauseSession = useHostStore((state) => state.pauseSession);
  const resumeSession = useHostStore((state) => state.resumeSession);
  const terminateSession = useHostStore((state) => state.terminateSession);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentQuestion || isPaused) return;

    // Calculate initial time left based on serverStartTime
    const endTime = currentQuestion.serverStartTime + currentQuestion.durationSeconds * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [currentQuestion, isPaused]);

  // ─── 2. CONDITIONAL RETURN COMES AFTER ALL HOOKS ────────────────────────────
  if (!currentQuestion) return null;

  const displayTotal = totalParticipants > 0 ? totalParticipants : participants.length;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto min-h-[80vh]">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-[var(--color-surface-elevated)] px-6 py-2 rounded-full font-bold text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border)]">
            Question {currentQuestion.index + 1} of {currentQuestion.total}
          </div>
          <div className="bg-[var(--color-surface-elevated)] px-5 py-2 rounded-full font-bold text-sm text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span>
              {answeredCount} of {displayTotal} Answered
            </span>
          </div>
        </div>

        {/* Timer Circle */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-black shadow-inner transition-all ${
              isPaused
                ? "bg-amber-100 text-amber-800 text-xs font-bold tracking-wider uppercase border-2 border-amber-400"
                : timeLeft <= 5
                ? "bg-red-100 text-[var(--color-error)] animate-pulse text-2xl"
                : "bg-indigo-100 text-[var(--color-accent)] text-2xl"
            }`}
          >
            {isPaused ? "Paused" : timeLeft}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-md border border-[var(--color-border)] mb-6 text-center relative overflow-hidden">
        {isPaused && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs font-black uppercase tracking-widest py-1">
            Session Paused — Student timers frozen
          </div>
        )}
        <h2 className="text-3xl font-heading font-bold text-[var(--color-text-primary)] leading-tight pt-2">
          {currentQuestion.text}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 mt-auto">
        {currentQuestion.options.map((opt, i) => {
          const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-[var(--color-success)]"];
          const bgColor = colors[i % colors.length];

          return (
            <div key={opt.id} className={`${bgColor} text-white p-5 rounded-xl shadow-sm min-h-[100px] flex items-center`}>
              <span className="text-xl font-heading font-bold">{opt.text}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[var(--color-border)]/40 pt-4 pb-4">
        {/* Left: Terminate Session Button with Inline Confirmation */}
        {isTerminating ? (
          <div className="flex items-center gap-3 bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 p-2.5 rounded-2xl animate-[screenEnter_150ms_var(--ease-out-expo)]">
            <span className="text-xs font-bold text-[var(--color-error)] pl-2">
              End session immediately for all students?
            </span>
            <button
              onClick={async () => {
                haptics.tap();
                setTerminateError(null);
                const res = await terminateSession();
                if (!res.success) {
                  setTerminateError(res.error || "Failed to terminate session.");
                }
              }}
              className="px-4 py-1.5 bg-[var(--color-error)] text-white text-xs font-bold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
            >
              Yes, Terminate
            </button>
            <button
              onClick={() => setIsTerminating(false)}
              className="px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs font-bold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsTerminating(true)}
            className="px-5 py-2.5 bg-[var(--color-error-bg)] border border-[var(--color-error)]/25 text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white rounded-xl font-bold text-xs transition-all active:scale-95"
          >
            🛑 Terminate Session
          </button>
        )}
        
        {terminateError && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)] px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-fade-in-up">
            {terminateError}
          </div>
        )}

        {/* Right: Pause / Resume & Skip Buttons */}
        <div className="flex items-center gap-3">
          {isPaused ? (
            <button
              onClick={() => {
                haptics.tap();
                resumeSession();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Resume Session
            </button>
          ) : (
            <button
              onClick={() => {
                haptics.tap();
                pauseSession();
              }}
              className="bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 px-6 py-3 rounded-full font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
              Pause Session
            </button>
          )}

          <button
            onClick={() => {
              haptics.tap();
              nextQuestion();
            }}
            className="bg-gray-200 hover:bg-gray-300 text-[var(--color-text-secondary)] px-6 py-3 rounded-full font-bold text-sm transition-colors"
          >
            Skip / Reveal Now →
          </button>
        </div>
      </div>
    </div>
  );
}

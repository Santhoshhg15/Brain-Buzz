import { usePlayStore } from "../store/playStore";
import { optionStyles, OptionIcon } from "./QuestionScreen";

export function AnsweredScreen() {
  const currentQuestion = usePlayStore(state => state.currentQuestion);
  const selectedOptionId = usePlayStore(state => state.selectedOptionId);

  if (!currentQuestion || !selectedOptionId) return null;

  if (selectedOptionId === "REJOIN_PLACEHOLDER") {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[80vh] px-4 text-center">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] p-8 w-full max-w-sm flex flex-col items-center">
          
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">Answer Locked!</h2>
          
          <div className="mt-4 mb-8 w-full text-[var(--color-text-secondary)] font-medium">
            You successfully answered before reconnecting.
          </div>

          <div className="flex items-center gap-3 text-[var(--color-text-secondary)] font-medium">
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
            Waiting for others...
          </div>
        </div>
      </div>
    );
  }

  const optionIndex = currentQuestion.options.findIndex(o => o.id === selectedOptionId);
  const style = optionStyles[optionIndex % optionStyles.length] || optionStyles[0];
  const selectedText = currentQuestion.options[optionIndex]?.text || "";

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] px-4 text-center">
      <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl border border-[var(--color-border)] p-8 w-full max-w-sm flex flex-col items-center">
        
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">Answer Locked!</h2>
        
        <div className="mt-6 mb-8 w-full">
          <p className="text-sm font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">Your Pick</p>
          <div className={`${style.bg} text-white p-4 rounded-xl shadow-inner flex items-center gap-3 justify-center`}>
             <OptionIcon type={style.icon} className="w-6 h-6" />
             <span className="font-bold text-lg truncate">{selectedText}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[var(--color-text-secondary)] font-medium">
          <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-indigo-500 rounded-full animate-spin"></div>
          Waiting for others...
        </div>
      </div>
    </div>
  );
}

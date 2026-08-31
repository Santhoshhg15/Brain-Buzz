import { useState } from "react";
import { useAdminStore } from "../../store/adminStore";
import { RippleButton } from "../RippleButton";

export interface QuestionFormData {
  text: string;
  durationSeconds: number;
  points: number;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
}

interface QuestionFormProps {
  initialValues?: QuestionFormData;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ initialValues, onSubmit, onCancel, isSubmitting }: QuestionFormProps) {
  const formError = useAdminStore((state) => state.formError);
  const clearFormError = useAdminStore((state) => state.clearFormError);

  const [text, setText] = useState(initialValues?.text || "");
  const [duration, setDuration] = useState(initialValues?.durationSeconds?.toString() || "20");
  const [points, setPoints] = useState(initialValues?.points?.toString() || "1000");
  const [explanation, setExplanation] = useState(initialValues?.explanation || "");
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    initialValues?.options || [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const handleOptionChange = (index: number, newText: string) => {
    const newOptions = [...options];
    newOptions[index].text = newText;
    setOptions(newOptions);
    if (localError) setLocalError(null);
  };

  const handleMarkCorrect = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
    if (localError) setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFormError();
    
    // Validation
    if (!text.trim()) {
      setLocalError("Question text cannot be empty.");
      return;
    }
    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum <= 0) {
      setLocalError("Duration must be a positive number.");
      return;
    }
    const ptNum = parseInt(points, 10);
    if (isNaN(ptNum) || ptNum <= 0) {
      setLocalError("Points must be a positive number.");
      return;
    }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].text.trim()) {
        setLocalError(`Option ${i + 1} text cannot be empty.`);
        return;
      }
    }
    if (!options.some(opt => opt.isCorrect)) {
      setLocalError("Exactly one option must be marked as correct.");
      return;
    }
    if (explanation.trim().length > 1000) {
      setLocalError("Explanation cannot exceed 1000 characters.");
      return;
    }

    setLocalError(null);

    await onSubmit({
      text: text.trim(),
      durationSeconds: durNum,
      points: ptNum,
      explanation: explanation.trim() || undefined,
      options: options.map(opt => ({ text: opt.text.trim(), isCorrect: opt.isCorrect }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-[0_1px_2px_rgba(43,38,32,0.04),0_8px_24px_rgba(43,38,32,0.06)] border border-[var(--color-border)] animate-[screenEnter_200ms_var(--ease-out-expo)]">
      {(localError || formError) && (
        <div className="w-full bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl mb-6 font-semibold border border-[var(--color-error)]/20 shadow-sm">
          {localError || formError}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Question Text</label>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => { setText(e.target.value); if (localError) setLocalError(null); }}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold resize-none h-24"
          placeholder="Enter question text or code snippet..."
        />
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Duration (sec)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); if (localError) setLocalError(null); }}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Points</label>
          <input
            type="number"
            min="1"
            value={points}
            onChange={(e) => { setPoints(e.target.value); if (localError) setLocalError(null); }}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">Options (Mark 1 Correct)</label>
        <div className="flex flex-col gap-3">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleMarkCorrect(idx)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ease-[var(--ease-spring)] active:scale-90 \${opt.isCorrect ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-transparent hover:border-[var(--color-success)]/50'}`}
                title="Mark as correct"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option \${idx + 1}`}
                className={`flex-1 bg-[var(--color-surface)] border rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold \${opt.isCorrect ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success-bg)]/30' : 'border-[var(--color-border)] text-[var(--color-text-primary)]'}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Explanation (optional)</label>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Shown to students after they answer — explain why the correct answer is right.</p>
        <textarea
          value={explanation}
          onChange={(e) => { setExplanation(e.target.value); if (localError) setLocalError(null); }}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold resize-none h-20"
          placeholder="e.g. 'final' prevents a class from being subclassed, which is useful for immutable or security-critical classes."
        />
      </div>

      <div className="flex justify-end gap-3">
        <RippleButton
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-[var(--color-surface)] text-[var(--color-text-primary)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
        >
          Cancel
        </RippleButton>
        <RippleButton
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--color-accent-hover)] shadow-md transition-all ease-[var(--ease-smooth)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Question"}
        </RippleButton>
      </div>
    </form>
  );
}

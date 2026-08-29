import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import type { QuestionDetail } from "../../store/adminStore";
import { QuestionForm } from "./QuestionForm";
import type { QuestionFormData } from "./QuestionForm";
import { Check } from "lucide-react";

interface QuestionCardProps {
  question: QuestionDetail;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateQuestion = useAdminStore((state) => state.updateQuestion);
  const updateOption = useAdminStore((state) => state.updateOption);
  const deleteQuestion = useAdminStore((state) => state.deleteQuestion);
  const loading = useAdminStore((state) => state.loading);
  const clearFormError = useAdminStore((state) => state.clearFormError);

  const [localDuration, setLocalDuration] = useState(question.durationSeconds.toString());
  const [localPoints, setLocalPoints] = useState(question.points.toString());
  
  const [durationError, setDurationError] = useState(false);
  const [pointsError, setPointsError] = useState(false);
  
  const [durationSuccess, setDurationSuccess] = useState(false);
  const [pointsSuccess, setPointsSuccess] = useState(false);

  useEffect(() => {
    setLocalDuration(question.durationSeconds.toString());
    setDurationError(false);
  }, [question.durationSeconds]);

  useEffect(() => {
    setLocalPoints(question.points.toString());
    setPointsError(false);
  }, [question.points]);

  const handleDurationSave = async (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 5 || val > 120) {
      setDurationError(true);
      return;
    }
    setDurationError(false);
    if (val === question.durationSeconds) return;

    try {
      await updateQuestion(question.id, { durationSeconds: val });
      setDurationSuccess(true);
      setTimeout(() => setDurationSuccess(false), 1500);
    } catch (err) {
      setDurationError(true);
      setTimeout(() => setDurationError(false), 1500);
    }
  };

  const handlePointsSave = async (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) {
      setPointsError(true);
      return;
    }
    setPointsError(false);
    if (val === question.points) return;

    try {
      await updateQuestion(question.id, { points: val });
      setPointsSuccess(true);
      setTimeout(() => setPointsSuccess(false), 1500);
    } catch (err) {
      setPointsError(true);
      setTimeout(() => setPointsError(false), 1500);
    }
  };

  const handleDurationBlur = () => {
    const val = parseInt(localDuration, 10);
    if (isNaN(val) || val < 5 || val > 120) {
      setLocalDuration(question.durationSeconds.toString());
      setDurationError(false);
    } else {
      handleDurationSave(localDuration);
    }
  };

  const handlePointsBlur = () => {
    const val = parseInt(localPoints, 10);
    if (isNaN(val) || val <= 0) {
      setLocalPoints(question.points.toString());
      setPointsError(false);
    } else {
      handlePointsSave(localPoints);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleSave = async (data: QuestionFormData) => {
    // We update question details
    await updateQuestion(question.id, {
      text: data.text,
      durationSeconds: data.durationSeconds,
      points: data.points
    });

    // We update each option
    // Promise.all to run them concurrently for speed
    await Promise.all(data.options.map((opt, i) => {
      const existingOption = question.options[i];
      if (existingOption) {
        // Only patch if something changed to save network requests
        if (existingOption.text !== opt.text || existingOption.isCorrect !== opt.isCorrect) {
          return updateOption(existingOption.id, {
            text: opt.text,
            isCorrect: opt.isCorrect
          });
        }
      }
      return Promise.resolve();
    }));

    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteQuestion(question.id);
    setIsDeleting(false);
  };

  if (isEditing) {
    const initialValues: QuestionFormData = {
      text: question.text,
      durationSeconds: question.durationSeconds,
      points: question.points,
      options: question.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    };

    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider pl-2">
          Editing Question {index + 1}
        </h3>
        <QuestionForm 
          initialValues={initialValues} 
          onSubmit={handleSave} 
          onCancel={() => { setIsEditing(false); clearFormError(); }}
          isSubmitting={loading}
        />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-[0_1px_2px_rgba(43,38,32,0.04),0_8px_24px_rgba(43,38,32,0.06)] border border-[var(--color-border)] mb-6 transition-all duration-300">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-black text-xl w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            {index + 1}
          </div>
          <div>
            <h4 className="text-lg font-bold text-[var(--color-text-primary)] whitespace-pre-wrap">{question.text}</h4>
            <div className="flex flex-wrap items-center gap-6 mt-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              {/* Duration Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">⏱ Duration:</span>
                <div className="flex items-center gap-1.5 relative">
                  <input
                    type="number"
                    value={localDuration}
                    onChange={(e) => {
                      setLocalDuration(e.target.value);
                      const val = parseInt(e.target.value, 10);
                      setDurationError(isNaN(val) || val < 5 || val > 120);
                    }}
                    onBlur={handleDurationBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-16 px-2 py-1 text-center font-mono text-sm bg-[var(--color-surface)] border rounded-md outline-none transition-all ${
                      durationError 
                        ? 'border-[var(--color-error)] ring-2 ring-[var(--color-error)]/20 text-[var(--color-error)]' 
                        : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 text-[var(--color-text-primary)]'
                    }`}
                  />
                  <span className="text-xs text-[var(--color-text-secondary)] font-semibold">sec</span>
                  {durationSuccess && (
                    <span className="text-[var(--color-success)] animate-[fadeScaleIn_200ms_ease-out] shrink-0">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Points Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">🏆 Points:</span>
                <div className="flex items-center gap-1.5 relative">
                  <input
                    type="number"
                    value={localPoints}
                    onChange={(e) => {
                      setLocalPoints(e.target.value);
                      const val = parseInt(e.target.value, 10);
                      setPointsError(isNaN(val) || val <= 0);
                    }}
                    onBlur={handlePointsBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-20 px-2 py-1 text-center font-mono text-sm bg-[var(--color-surface)] border rounded-md outline-none transition-all ${
                      pointsError 
                        ? 'border-[var(--color-error)] ring-2 ring-[var(--color-error)]/20 text-[var(--color-error)]' 
                        : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 text-[var(--color-text-primary)]'
                    }`}
                  />
                  <span className="text-xs text-[var(--color-text-secondary)] font-semibold">pts</span>
                  {pointsSuccess && (
                    <span className="text-[var(--color-success)] animate-[fadeScaleIn_200ms_ease-out] shrink-0">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isDeleting ? (
          <div className="flex flex-col gap-2 bg-[var(--color-error-bg)]/50 p-2 rounded-xl animate-[screenEnter_200ms_var(--ease-out-expo)] shrink-0 min-w-[200px]">
            <p className="text-sm font-bold text-[var(--color-error)] text-center">Delete Question?</p>
            <div className="flex gap-2">
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-[var(--color-error)] text-white text-sm py-2 rounded-lg font-bold hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                Yes
              </button>
              <button 
                onClick={() => { setIsDeleting(false); clearFormError(); }}
                disabled={loading}
                className="flex-1 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm py-2 rounded-lg font-bold hover:bg-[var(--color-border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => { setIsEditing(true); clearFormError(); }}
              className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-sm rounded-xl hover:bg-[var(--color-border)] transition-colors active:scale-95"
            >
              Edit
            </button>
            <button 
              onClick={() => setIsDeleting(true)}
              className="w-10 h-10 flex items-center justify-center bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-xl hover:bg-[var(--color-error)] hover:text-white transition-all active:scale-95"
              title="Delete Question"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pl-14">
        {question.options.map((opt) => (
          <div 
            key={opt.id} 
            className={`p-3 rounded-xl border flex items-center gap-3 text-sm font-semibold \${opt.isCorrect ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]/30 text-[var(--color-text-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 \${opt.isCorrect ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-border)] text-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="truncate">{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

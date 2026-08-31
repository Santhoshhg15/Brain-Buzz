import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";
import { RippleButton } from "../components/RippleButton";
import { QuestionCard } from "../components/admin/QuestionCard";
import { QuestionForm } from "../components/admin/QuestionForm";
import { BulkImportPanel } from "../components/admin/BulkImportPanel";
import { Check } from "lucide-react";
import type { QuestionFormData } from "../components/admin/QuestionForm";

// ─── ApplyToAllBar ────────────────────────────────────────────────────────────

interface ApplyControlProps {
  label: string;
  unit: string;
  placeholder: string;
  validate: (val: number) => string | null; // returns error string or null
  onApply: (val: number) => Promise<{ success: boolean; updated?: number; error?: string }>;
  questionCount: number;
}

function ApplyControl({ label, unit, placeholder, validate, onApply, questionCount }: ApplyControlProps) {
  const [inputVal, setInputVal] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(false); // two-step confirm
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsedVal = parseInt(inputVal, 10);
  const error = inputVal.trim() === "" ? null : validate(parsedVal);
  const isValid = inputVal.trim() !== "" && !isNaN(parsedVal) && error === null;

  const handleInputChange = (val: string) => {
    setInputVal(val);
    setInlineError(null);
    setConfirmState(false);
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMsg(null);
    const n = parseInt(val, 10);
    setValidationError(val.trim() === "" ? null : validate(n));
  };

  const handleApplyClick = () => {
    if (!isValid) return;
    if (!confirmState) {
      // First click → show confirm step
      setConfirmState(true);
      return;
    }
    // Second click (confirmed) → submit
    handleConfirm();
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setConfirmState(false);
    setInlineError(null);
    const result = await onApply(parsedVal);
    setIsLoading(false);
    if (result.success) {
      setSuccessMsg(`Applied to ${result.updated} question${result.updated === 1 ? "" : "s"}`);
      setInputVal("");
      setValidationError(null);
      successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setInlineError(result.error || "Something went wrong");
    }
  };

  const handleCancel = () => {
    setConfirmState(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Input */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={inputVal}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className={`w-24 px-3 py-2 text-center font-mono text-sm bg-[var(--color-surface)] border rounded-xl outline-none transition-all disabled:opacity-50 ${
              validationError
                ? "border-[var(--color-error)] ring-2 ring-[var(--color-error)]/20 text-[var(--color-error)]"
                : "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 text-[var(--color-text-primary)]"
            }`}
          />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{unit}</span>
        </div>

        {/* Button / confirm state */}
        {confirmState ? (
          <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 animate-[screenEnter_150ms_var(--ease-out-expo)]">
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">
              Overwrite {questionCount} question{questionCount === 1 ? "" : "s"}?
            </span>
            <RippleButton
              onClick={handleConfirm}
              className="px-3 py-1 bg-[var(--color-accent)] text-white text-xs font-bold rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors active:scale-95 animate-[popIn_100ms_ease]"
            >
              Confirm
            </RippleButton>
            <RippleButton
              onClick={handleCancel}
              className="px-3 py-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              Cancel
            </RippleButton>
          </div>
        ) : (
          <RippleButton
            onClick={handleApplyClick}
            disabled={!isValid || isLoading}
            className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold rounded-xl hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-surface-elevated)] disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-primary)] min-w-[90px] flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Applying…
              </>
            ) : (
              "Apply to All"
            )}
          </RippleButton>
        )}

        {/* Inline success */}
        {successMsg && !isLoading && (
          <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-success)] animate-[fadeScaleIn_200ms_ease-out]">
            <Check className="w-3.5 h-3.5" />
            {successMsg}
          </span>
        )}

        {/* Inline error */}
        {inlineError && !isLoading && (
          <span className="text-xs font-bold text-[var(--color-error)] animate-[fadeScaleIn_200ms_ease-out]">
            {inlineError}
          </span>
        )}

        {/* Validation hint */}
        {validationError && !inlineError && (
          <span className="text-xs text-[var(--color-error)] font-semibold animate-[fadeScaleIn_150ms_ease-out]">
            {validationError}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── QuizEditor ───────────────────────────────────────────────────────────────

export function QuizEditor() {
  const { quizId } = useParams<{ quizId: string }>();

  const currentQuiz = useAdminStore((state) => state.currentQuiz);
  const loading = useAdminStore((state) => state.loading);
  const formError = useAdminStore((state) => state.formError);
  const fetchQuizDetail = useAdminStore((state) => state.fetchQuizDetail);
  const updateQuizTitle = useAdminStore((state) => state.updateQuizTitle);
  const addQuestion = useAdminStore((state) => state.addQuestion);
  const applyToAllQuestions = useAdminStore((state) => state.applyToAllQuestions);
  const clearFormError = useAdminStore((state) => state.clearFormError);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  useEffect(() => {
    if (quizId) {
      fetchQuizDetail(quizId);
    }
    return () => clearFormError();
  }, [quizId, fetchQuizDetail, clearFormError]);

  const handleTitleSubmit = async () => {
    if (titleInput.trim() && titleInput !== currentQuiz?.title) {
      await updateQuizTitle(quizId!, titleInput);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setEditingTitle(false);
    }
  };

  const handleAddQuestion = async (data: QuestionFormData) => {
    await addQuestion(quizId!, data);
    setIsAddingQuestion(false);
  };

  if (!currentQuiz && loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-8 items-center pt-24">
        <div className="skeleton w-3/4 h-12 mb-12"></div>
        <div className="w-full max-w-4xl skeleton h-48 mb-6"></div>
        <div className="w-full max-w-4xl skeleton h-48"></div>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-[var(--color-error)]">Quiz not found or failed to load.</h2>
        <Link to="/admin" className="text-[var(--color-accent)] font-bold mt-4">Return to Dashboard</Link>
      </div>
    );
  }

  const questionCount = currentQuiz.questions.length;

  return (
    <div className="animate-[screenEnter_300ms_var(--ease-out-expo)] w-full max-w-4xl mx-auto">
      {/* Title Editor Header */}
      <div className="flex flex-col gap-2 mb-8 w-full border-b border-[var(--color-border)]/40 pb-6">
        <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider pl-1">Quiz Editor</span>
        {editingTitle ? (
          <input
            autoFocus
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="text-3xl font-heading font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[var(--color-accent)]/20 w-full max-w-2xl"
          />
        ) : (
          <h1
            onClick={() => { setTitleInput(currentQuiz.title); setEditingTitle(true); }}
            className="text-3xl font-heading font-bold text-[var(--color-text-primary)] tracking-tight cursor-pointer hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-3 group"
            title="Click to edit title"
          >
            {currentQuiz.title}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </h1>
        )}
      </div>

      {formError && (
        <div className="w-full bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl mb-6 font-semibold border border-[var(--color-error)]/20 shadow-sm flex items-center justify-between">
          <span>{formError}</span>
          <button onClick={clearFormError} className="opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* ── Apply-to-All Utility Bar (only shown when there are questions) ── */}
      {questionCount > 0 && (
        <div className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl px-5 py-4 mb-8 shadow-[0_1px_2px_rgba(43,38,32,0.04),0_4px_12px_rgba(43,38,32,0.05)]">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Apply to All {questionCount} Questions
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <ApplyControl
              label="Duration"
              unit="sec"
              placeholder="e.g. 20"
              validate={(val) => {
                if (isNaN(val) || !Number.isInteger(val) || val < 5 || val > 120)
                  return "5–120 sec";
                return null;
              }}
              onApply={(val) => applyToAllQuestions(quizId!, { durationSeconds: val })}
              questionCount={questionCount}
            />
            <div className="hidden sm:block w-px bg-[var(--color-border)] self-stretch" />
            <ApplyControl
              label="Points"
              unit="pts"
              placeholder="e.g. 1000"
              validate={(val) => {
                if (isNaN(val) || !Number.isInteger(val) || val <= 0)
                  return "Must be > 0";
                return null;
              }}
              onApply={(val) => applyToAllQuestions(quizId!, { points: val })}
              questionCount={questionCount}
            />
          </div>
        </div>
      )}

      {/* Questions header row */}
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Questions ({questionCount})
        </h2>
        {questionCount > 0 && !isBulkImporting && (
          <RippleButton
            onClick={() => { clearFormError(); setIsBulkImporting(true); }}
            className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl font-bold text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors shadow-sm"
          >
            Bulk Import (JSON)
          </RippleButton>
        )}
      </div>

      {isBulkImporting && (
        <BulkImportPanel
          quizId={quizId!}
          onSuccess={() => setIsBulkImporting(false)}
          onClose={() => setIsBulkImporting(false)}
        />
      )}

      {questionCount === 0 && !isAddingQuestion && !isBulkImporting ? (
        <div className="w-full bg-[var(--color-surface-elevated)] border-2 border-dashed border-[var(--color-border)] rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-[var(--color-surface)] w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl">
            📝
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No questions yet</h3>
          <p className="text-[var(--color-text-secondary)] font-semibold mb-8">
            Start building your quiz by adding the first question!
          </p>
          <div className="flex flex-col gap-4 w-full sm:w-auto">
            <RippleButton
              onClick={() => { clearFormError(); setIsAddingQuestion(true); }}
              className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[var(--color-accent-hover)] transition-all ease-[var(--ease-smooth)] active:scale-95"
            >
              + Add First Question
            </RippleButton>
            <RippleButton
              onClick={() => { clearFormError(); setIsBulkImporting(true); }}
              className="text-[var(--color-text-secondary)] font-bold hover:text-[var(--color-accent)] transition-colors bg-transparent border-0 shadow-none hover:shadow-none"
            >
              or Bulk Import (JSON)
            </RippleButton>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          {currentQuiz.questions.map((q, idx) => (
            <QuestionCard key={q.id} question={q} index={idx} />
          ))}

          {isAddingQuestion ? (
            <div className="mt-8 animate-[screenEnter_200ms_var(--ease-out-expo)]">
              <h3 className="text-sm font-bold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider pl-2">
                Create New Question
              </h3>
              <QuestionForm
                onSubmit={handleAddQuestion}
                onCancel={() => { setIsAddingQuestion(false); clearFormError(); }}
                isSubmitting={loading}
              />
            </div>
          ) : (
            <RippleButton
              onClick={() => { clearFormError(); setIsAddingQuestion(true); }}
              className="mt-4 bg-[var(--color-surface-elevated)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-primary)] px-6 py-6 rounded-2xl font-bold hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all ease-[var(--ease-smooth)] w-full justify-center"
            >
              + Add Another Question
            </RippleButton>
          )}
        </div>
      )}
    </div>
  );
}

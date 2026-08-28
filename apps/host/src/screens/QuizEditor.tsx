import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";
import { QuestionCard } from "../components/admin/QuestionCard";
import { QuestionForm } from "../components/admin/QuestionForm";
import type { QuestionFormData } from "../components/admin/QuestionForm";

export function QuizEditor() {
  const { quizId } = useParams<{ quizId: string }>();
  
  const currentQuiz = useAdminStore((state) => state.currentQuiz);
  const loading = useAdminStore((state) => state.loading);
  const formError = useAdminStore((state) => state.formError);
  const fetchQuizDetail = useAdminStore((state) => state.fetchQuizDetail);
  const updateQuizTitle = useAdminStore((state) => state.updateQuizTitle);
  const addQuestion = useAdminStore((state) => state.addQuestion);
  const clearFormError = useAdminStore((state) => state.clearFormError);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
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

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-body flex flex-col pb-24">
      <header className="bg-[var(--color-surface-elevated)]/80 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]/50 py-4 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Quiz Editor</span>
          
          {editingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-heading font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 outline-none focus:ring-2 ring-[var(--color-accent)]/20"
            />
          ) : (
            <h1 
              onClick={() => { setTitleInput(currentQuiz.title); setEditingTitle(true); }}
              className="text-xl font-heading font-bold text-[var(--color-text-primary)] tracking-tight cursor-pointer hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-2 group"
              title="Click to edit title"
            >
              {currentQuiz.title}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </h1>
          )}
        </div>

        <Link 
          to="/admin" 
          className="text-[var(--color-text-secondary)] font-semibold text-sm hover:text-[var(--color-text-primary)] transition-colors shrink-0"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center animate-[screenEnter_300ms_var(--ease-out-expo)] max-w-4xl mx-auto w-full">
        {formError && (
          <div className="w-full bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl mb-6 font-semibold border border-[var(--color-error)]/20 shadow-sm flex items-center justify-between">
            <span>{formError}</span>
            <button onClick={clearFormError} className="opacity-70 hover:opacity-100">&times;</button>
          </div>
        )}

        <div className="w-full flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Questions ({currentQuiz.questions.length})
          </h2>
        </div>

        {currentQuiz.questions.length === 0 && !isAddingQuestion ? (
          <div className="w-full bg-[var(--color-surface-elevated)] border-2 border-dashed border-[var(--color-border)] rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-[var(--color-surface)] w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl">
              📝
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No questions yet</h3>
            <p className="text-[var(--color-text-secondary)] font-semibold mb-8">
              Start building your quiz by adding the first question!
            </p>
            <button
              onClick={() => { clearFormError(); setIsAddingQuestion(true); }}
              className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[var(--color-accent-hover)] transition-all ease-[var(--ease-smooth)] active:scale-95"
            >
              + Add First Question
            </button>
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
              <button
                onClick={() => { clearFormError(); setIsAddingQuestion(true); }}
                className="mt-4 bg-[var(--color-surface-elevated)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-primary)] px-6 py-6 rounded-2xl font-bold hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all ease-[var(--ease-smooth)]"
              >
                + Add Another Question
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

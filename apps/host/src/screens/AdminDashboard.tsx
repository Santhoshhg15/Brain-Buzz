import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "../store/adminStore";
import { RippleButton } from "../components/RippleButton";

export function AdminDashboard() {
  const fetchQuizzes = useAdminStore((state) => state.fetchQuizzes);
  const quizzes = useAdminStore((state) => state.quizzes);
  const loading = useAdminStore((state) => state.loading);
  const formError = useAdminStore((state) => state.formError);
  const deleteQuiz = useAdminStore((state) => state.deleteQuiz);
  const createQuiz = useAdminStore((state) => state.createQuiz);
  const clearFormError = useAdminStore((state) => state.clearFormError);

  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
    return () => clearFormError();
  }, [fetchQuizzes, clearFormError]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newId = await createQuiz(newTitle);
    if (newId) {
      setCreating(false);
      setNewTitle("");
      navigate(`/admin/quizzes/${newId}`);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteQuiz(id);
    if (success) {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-[screenEnter_300ms_var(--ease-out-expo)] w-full">
      <div className="flex justify-between items-center w-full mb-8">
        <h2 className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">Manage Quizzes</h2>
        {!creating && (
          <RippleButton
            onClick={() => { clearFormError(); setCreating(true); }}
            className="btn-primary rounded-full"
          >
            + Create New Quiz
          </RippleButton>
        )}
      </div>

      {formError && (
        <div className="w-full bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl mb-6 font-semibold border border-[var(--color-error)]/20 shadow-sm flex items-center justify-between">
          <span>{formError}</span>
          <button onClick={clearFormError} className="opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {creating && (
        <div className="w-full bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]/60 mb-8 animate-[screenEnter_200ms_var(--ease-out-expo)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Create New Quiz</h3>
          <form onSubmit={handleCreate} className="flex gap-4 items-center">
            <input
              type="text"
              autoFocus
              placeholder="Enter quiz title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all font-semibold"
            />
            <RippleButton
              type="submit"
              disabled={loading || !newTitle.trim()}
              className="btn-primary"
            >
              {loading ? "Creating..." : "Create"}
            </RippleButton>
            <RippleButton
              type="button"
              onClick={() => { setCreating(false); clearFormError(); }}
              className="btn-secondary"
            >
              Cancel
            </RippleButton>
          </form>
        </div>
      )}

      {loading && quizzes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <div className="skeleton w-full h-48"></div>
          <div className="skeleton w-full h-48"></div>
          <div className="skeleton w-full h-48"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)]/60 flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-[var(--color-accent)]/30 transition-all duration-300 relative group h-full justify-between"
            >
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold mb-2 text-[var(--color-text-primary)] line-clamp-2">{quiz.title}</h3>
                <div className="inline-block bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold py-1 px-3 rounded-full text-xs mb-4">
                  {quiz.questionCount} Questions
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6 font-medium">
                  Created {new Date(quiz.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {deletingId === quiz.id ? (
                <div className="flex flex-col gap-2 bg-[var(--color-error-bg)]/50 p-3 rounded-xl animate-[screenEnter_200ms_var(--ease-out-expo)]">
                  <p className="text-sm font-bold text-[var(--color-error)] text-center">Are you sure?</p>
                  <div className="flex gap-2">
                    <RippleButton 
                      onClick={() => handleDelete(quiz.id)}
                      disabled={loading}
                      className="flex-1 btn-danger py-2"
                    >
                      Yes, Delete
                    </RippleButton>
                    <RippleButton 
                      onClick={() => { setDeletingId(null); clearFormError(); }}
                      disabled={loading}
                      className="flex-1 btn-secondary py-2"
                    >
                      Cancel
                    </RippleButton>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <RippleButton 
                    onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                    className="flex-1 btn-secondary"
                  >
                    Edit Questions
                  </RippleButton>
                  <RippleButton 
                    onClick={() => setDeletingId(quiz.id)}
                    className="w-12 btn-danger !p-0"
                    title="Delete Quiz"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </RippleButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

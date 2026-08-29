import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHostStore } from "../store/hostStore";

export function SelectQuizScreen() {
  const fetchQuizzes = useHostStore(state => state.fetchQuizzes);
  const availableQuizzes = useHostStore(state => state.availableQuizzes);
  const createRoom = useHostStore(state => state.createRoom);
  const sessionError = useHostStore(state => state.sessionError);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
      <div className="absolute top-0 right-0">
        <Link 
          to="/admin" 
          className="text-[var(--color-accent)] font-bold text-sm bg-[var(--color-accent)]/10 px-4 py-2 rounded-full hover:bg-[var(--color-accent)]/20 transition-all ease-[var(--ease-smooth)]"
        >
          Manage Quizzes
        </Link>
      </div>
      <h2 className="text-3xl font-heading font-bold mb-8 text-[var(--color-text-primary)] mt-12 sm:mt-0">Select a Quiz to Host</h2>
      
      {sessionError && (
        <div className="bg-[var(--color-error-bg)]/80 text-[var(--color-error)] border border-[var(--color-error)]/25 text-xs font-bold p-3.5 rounded-xl text-center mb-6 max-w-md w-full animate-[screenEnter_200ms_var(--ease-out-expo)]">
          {sessionError}
        </div>
      )}
      
      {availableQuizzes.length === 0 ? (
        <div className="flex gap-6 w-full max-w-5xl">
          <div className="skeleton w-1/3 h-32"></div>
          <div className="skeleton w-1/3 h-32"></div>
          <div className="skeleton w-1/3 h-32"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {availableQuizzes.map(quiz => (
            <div 
              key={quiz.id}
              onClick={() => createRoom(quiz.id)}
              className="bg-[var(--color-surface-elevated)] p-6 rounded-xl shadow-md border border-[var(--color-border)] hover:shadow-xl hover:-translate-y-1 transition-all ease-[var(--ease-smooth)] cursor-pointer flex flex-col"
            >
              <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">{quiz.title}</h3>
              <div className="text-sm text-[var(--color-text-secondary)] mb-4 mt-auto">
                {new Date(quiz.createdAt).toLocaleDateString()}
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {quiz.questionCount} Questions
                </span>
                <span className="text-blue-600 font-medium hover:text-blue-800">
                  Host Now →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

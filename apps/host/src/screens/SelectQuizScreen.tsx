import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHostStore } from "../store/hostStore";

export function SelectQuizScreen() {
  const fetchQuizzes = useHostStore(state => state.fetchQuizzes);
  const availableQuizzes = useHostStore(state => state.availableQuizzes);
  const createRoom = useHostStore(state => state.createRoom);
  const sessionError = useHostStore(state => state.sessionError);
  const creatingRoomId = useHostStore(state => state.creatingRoomId);

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
          {availableQuizzes.map(quiz => {
            const isCreating = creatingRoomId === quiz.id;
            const isAnyCreating = creatingRoomId !== null;
            
            return (
              <div 
                key={quiz.id}
                onClick={() => !isAnyCreating && createRoom(quiz.id)}
                className={`bg-[var(--color-surface-elevated)] p-6 rounded-xl shadow-md border border-[var(--color-border)] flex flex-col transition-all ease-[var(--ease-smooth)] ${
                  isAnyCreating && !isCreating ? 'opacity-50 grayscale pointer-events-none' : ''
                } ${
                  isCreating ? 'ring-2 ring-[var(--color-accent)] shadow-xl -translate-y-1' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                }`}
              >
                <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">{quiz.title}</h3>
                <div className="text-sm text-[var(--color-text-secondary)] mb-4 mt-auto">
                  {new Date(quiz.createdAt).toLocaleDateString()}
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {quiz.questionCount} Questions
                  </span>
                  <span className={`font-medium flex items-center gap-2 ${isCreating ? 'text-[var(--color-accent)]' : 'text-blue-600 hover:text-blue-800'}`}>
                    {isCreating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Starting...
                      </>
                    ) : (
                      "Host Now →"
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHostStore } from "../store/hostStore";

export function SelectQuizScreen() {
  const fetchQuizzes = useHostStore(state => state.fetchQuizzes);
  const checkForActiveSessions = useHostStore(state => state.checkForActiveSessions);
  const availableQuizzes = useHostStore(state => state.availableQuizzes);
  const activeSessions = useHostStore(state => state.activeSessions);
  const createRoom = useHostStore(state => state.createRoom);
  const rejoinSession = useHostStore(state => state.rejoinSession);
  const dismissActiveSessionsBanner = useHostStore(state => state.dismissActiveSessionsBanner);
  const sessionError = useHostStore(state => state.sessionError);
  const creatingRoomId = useHostStore(state => state.creatingRoomId);

  useEffect(() => {
    fetchQuizzes();
    checkForActiveSessions();
  }, [fetchQuizzes, checkForActiveSessions]);

  const activeSession = activeSessions[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] relative w-full max-w-5xl mx-auto">
      <div className="absolute top-0 right-0 flex items-center gap-3">
        <Link 
          to="/sessions" 
          className="text-[var(--color-text-secondary)] font-bold text-sm bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-4 py-2 rounded-full hover:bg-[var(--color-surface)] transition-all ease-[var(--ease-smooth)]"
        >
          My Sessions
        </Link>
        <Link 
          to="/admin" 
          className="text-[var(--color-accent)] font-bold text-sm bg-[var(--color-accent)]/10 px-4 py-2 rounded-full hover:bg-[var(--color-accent)]/20 transition-all ease-[var(--ease-smooth)]"
        >
          Manage Quizzes
        </Link>
      </div>

      <h2 className="text-3xl font-heading font-bold mb-8 text-[var(--color-text-primary)] mt-12 sm:mt-0">Select a Quiz to Host</h2>
      
      {/* Active Session Banner */}
      {activeSession && (
        <div className="w-full bg-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]/30 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-[screenEnter_200ms_var(--ease-out-expo)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-ping shrink-0" />
            <div>
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">In-Progress Session Detected</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Quiz: <span className="text-[var(--color-accent)]">{activeSession.quizTitle}</span> (Room: <span className="font-mono font-bold">{activeSession.roomCode}</span>)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => rejoinSession(activeSession.sessionId)}
              className="flex-1 sm:flex-initial px-5 py-2 bg-[var(--color-accent)] text-white text-xs font-bold rounded-xl hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 shadow-md"
            >
              Resume
            </button>
            <button
              onClick={dismissActiveSessionsBanner}
              className="px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

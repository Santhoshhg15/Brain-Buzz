import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHostStore } from "../store/hostStore";
import { Layers, Settings, Play } from "lucide-react";
import { RippleButton } from "../components/RippleButton";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
    checkForActiveSessions();
  }, [fetchQuizzes, checkForActiveSessions]);

  const activeSession = activeSessions[0];

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-6 px-4 animate-[screenEnter_300ms_var(--ease-out-expo)]">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 mb-10 border-b border-[var(--color-border)]/40 pb-6">
        <div>
          <h2 className="text-3xl font-heading font-black text-[var(--color-text-primary)] tracking-tight">Select Quiz</h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Choose a quiz to launch a live interactive session.</p>
        </div>
        <div className="flex items-center gap-3">
          <RippleButton 
            onClick={() => navigate("/sessions")}
            className="btn-secondary btn-secondary-sm shadow-sm"
          >
            <Layers className="w-4 h-4 mr-1 text-[var(--color-text-secondary)]" />
            My Sessions
          </RippleButton>
          <RippleButton 
            onClick={() => navigate("/admin")}
            className="btn-primary btn-primary-sm shadow-sm"
          >
            <Settings className="w-4 h-4 mr-1 text-white" />
            Manage Quizzes
          </RippleButton>
        </div>
      </div>
      
      {/* Active Session Banner */}
      {activeSession && (
        <div className="w-full bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-[screenEnter_200ms_var(--ease-out-expo)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-ping shrink-0" />
            <div>
              <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider block">In-Progress Session Detected</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Quiz: <span className="text-[var(--color-accent)]">{activeSession.quizTitle}</span> (Room: <span className="font-mono font-black text-lg bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] ml-1">{activeSession.roomCode}</span>)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <RippleButton
              onClick={() => rejoinSession(activeSession.sessionId)}
              className="flex-1 sm:flex-initial btn-primary btn-primary-sm py-2.5 shadow-sm"
            >
              Resume
            </RippleButton>
            <RippleButton
              onClick={dismissActiveSessionsBanner}
              className="px-4 py-2.5 text-xs btn-secondary btn-secondary-sm"
            >
              Dismiss
            </RippleButton>
          </div>
        </div>
      )}

      {sessionError && (
        <div className="bg-[var(--color-error-bg)]/80 text-[var(--color-error)] border border-[var(--color-error)]/25 text-xs font-bold p-3.5 rounded-xl text-center mb-6 max-w-md w-full animate-[screenEnter_200ms_var(--ease-out-expo)]">
          {sessionError}
        </div>
      )}
      
      {availableQuizzes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <div className="skeleton w-full h-44"></div>
          <div className="skeleton w-full h-44"></div>
          <div className="skeleton w-full h-44"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {availableQuizzes.map(quiz => {
            const isCreating = creatingRoomId === quiz.id;
            const isAnyCreating = creatingRoomId !== null;
            
            return (
              <div 
                key={quiz.id}
                onClick={() => !isAnyCreating && createRoom(quiz.id)}
                className={`bg-[var(--color-surface-elevated)] p-6 rounded-2xl border border-[var(--color-border)]/60 flex flex-col justify-between transition-all duration-300 relative group h-48 select-none ${
                  isAnyCreating && !isCreating ? 'opacity-40 grayscale pointer-events-none' : ''
                } ${
                  isCreating 
                    ? 'ring-2 ring-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10 -translate-y-1' 
                    : 'hover:shadow-lg hover:-translate-y-1 hover:border-[var(--color-accent)]/40 cursor-pointer'
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-tight">
                    {quiz.title}
                  </h3>
                  <div className="text-xs text-[var(--color-text-secondary)] font-semibold mt-2">
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-[var(--color-border)]/40 pt-4 mt-auto">
                  <span className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold px-3 py-1 rounded-full">
                    {quiz.questionCount} Questions
                  </span>
                  
                  <span className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${isCreating ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]'}`}>
                    {isCreating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Starting...
                      </>
                    ) : (
                      <>
                        Host Now
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </>
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

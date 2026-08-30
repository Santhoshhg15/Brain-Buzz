import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../auth/apiClient";
import { useHostStore } from "../store/hostStore";
import type { SessionSummary } from "@quiz/shared-types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export function SessionsScreen() {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminatingAllState, setTerminatingAllState] = useState<{ isConfirming: boolean; isRunning: boolean; statusText: string | null }>({
    isConfirming: false,
    isRunning: false,
    statusText: null
  });

  const rejoinSession = useHostStore(state => state.rejoinSession);
  const terminateSession = useHostStore(state => state.terminateSession);
  const socket = useHostStore(state => state.socket);
  const navigate = useNavigate();

  const loadSessions = async (currentTab: "active" | "completed", silent: boolean = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const endpoint = currentTab === "active" ? "/api/sessions/active" : "/api/sessions/completed";
      const res = await authFetch(`${SERVER_URL}${endpoint}`);
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data);
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to fetch sessions");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(tab);
  }, [tab]);

  const handleResume = async (sessionId: string) => {
    const success = await rejoinSession(sessionId);
    if (success) {
      navigate("/");
    } else {
      const errorMsg = useHostStore.getState().sessionError;
      setError(errorMsg || "This session has already ended and can't be resumed.");
      loadSessions(tab);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleTerminated = () => {
      // Re-fetch the current tab to remove the terminated session immediately
      loadSessions(tab, true);
    };
    socket.on("session:terminated", handleTerminated);
    return () => {
      socket.off("session:terminated", handleTerminated);
    };
  }, [socket, tab]);

  const handleTerminate = async (sessionId: string) => {
    if (socket) {
      setTerminatingId(null);
      const res = await terminateSession(sessionId);
      if (!res.success) {
        setError(res.error || "Failed to terminate session.");
      }
      loadSessions(tab, true);
    }
  };

  const handleTerminateAll = async () => {
    setTerminatingAllState({ isConfirming: false, isRunning: true, statusText: `Terminating 1 of ${sessions.length}...` });
    setError(null);
    let successCount = 0;
    let failCount = 0;
    let lastError = "";

    const activeSessions = [...sessions];
    for (let i = 0; i < activeSessions.length; i++) {
      setTerminatingAllState(s => ({ ...s, statusText: `Terminating ${i + 1} of ${activeSessions.length}...` }));
      const res = await terminateSession(activeSessions[i].sessionId);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
        lastError = res.error || "Unknown error";
      }
    }

    if (failCount === 0) {
      setTerminatingAllState({ isConfirming: false, isRunning: false, statusText: `${successCount} sessions terminated successfully` });
      setTimeout(() => setTerminatingAllState(s => ({ ...s, statusText: null })), 4000);
    } else {
      setTerminatingAllState({ isConfirming: false, isRunning: false, statusText: null });
      setError(`${successCount} terminated, ${failCount} failed: ${lastError}`);
    }

    loadSessions(tab, true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-6 sm:p-12 animate-[screenEnter_300ms_var(--ease-out-expo)]">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-[var(--color-border)]/40 pb-6">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider pl-1">Instructor Console</span>
            <h1 className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">My Sessions</h1>
          </div>
          <Link
            to="/"
            className="text-[var(--color-accent)] font-bold text-sm bg-[var(--color-accent)]/10 px-5 py-2.5 rounded-full hover:bg-[var(--color-accent)]/20 transition-all ease-[var(--ease-smooth)]"
          >
            ← Back to Host Console
          </Link>
        </div>

        {/* Tab Control */}
        <div className="flex gap-2 border-b border-[var(--color-border)] mb-8">
          <button
            onClick={() => setTab("active")}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              tab === "active"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              tab === "completed"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl mb-6 font-semibold border border-[var(--color-error)]/20 shadow-sm">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton h-36 rounded-2xl"></div>
            <div className="skeleton h-36 rounded-2xl"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-[var(--color-surface-elevated)] border-2 border-dashed border-[var(--color-border)] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-[var(--color-surface)] w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl">
              🎯
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              No {tab === "active" ? "in-progress" : "completed"} sessions found
            </h3>
            <p className="text-[var(--color-text-secondary)] font-semibold mb-6">
              {tab === "active" ? "Start hosting a quiz to see active sessions here." : "Your completed quiz history will appear here."}
            </p>
            <Link
              to="/"
              className="bg-[var(--color-accent)] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[var(--color-accent-hover)] transition-all"
            >
              Host a Quiz
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Terminate All Bar */}
            {tab === "active" && sessions.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--color-surface-elevated)] p-4 rounded-2xl shadow-sm border border-[var(--color-border)]">
                <div className="text-sm font-bold text-[var(--color-text-secondary)]">
                  {terminatingAllState.statusText ? (
                    <span className="text-[var(--color-accent)] animate-pulse">{terminatingAllState.statusText}</span>
                  ) : (
                    `${sessions.length} In-Progress Session${sessions.length === 1 ? "" : "s"}`
                  )}
                </div>
                <div>
                  {terminatingAllState.isRunning ? (
                    <div className="px-4 py-2 flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                      <div className="w-4 h-4 border-2 border-[var(--color-text-secondary)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : terminatingAllState.isConfirming ? (
                    <div className="flex items-center gap-3 bg-[var(--color-error-bg)]/50 p-2 rounded-xl animate-[screenEnter_150ms_var(--ease-out-expo)]">
                      <span className="text-xs font-bold text-[var(--color-error)] pl-2">
                        This will end all {sessions.length} in-progress sessions immediately. Are you sure?
                      </span>
                      <button
                        onClick={handleTerminateAll}
                        className="px-3 py-1.5 bg-[var(--color-error)] text-white text-xs font-bold rounded-lg hover:bg-red-800 transition-colors shadow-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setTerminatingAllState({ isConfirming: false, isRunning: false, statusText: null })}
                        className="px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setTerminatingAllState({ isConfirming: true, isRunning: false, statusText: null })}
                      className="px-4 py-2 text-xs font-bold text-[var(--color-error)] border border-[var(--color-error)]/30 hover:bg-[var(--color-error-bg)] rounded-xl transition-colors shadow-sm"
                    >
                      Terminate All
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessions.map((s) => (
              <div
                key={s.sessionId}
                className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)]">
                      {s.quizTitle}
                    </h3>
                    {tab === "active" ? (
                      <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                        s.status === "LIVE" ? "bg-emerald-100 text-emerald-800" :
                        s.status === "PAUSED" ? "bg-amber-100 text-amber-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {s.status}
                      </span>
                    ) : (
                      <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                        s.status === "ENDED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}>
                        {s.status === "ENDED" ? "Completed" : "Ended unexpectedly"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
                    <span>Room: <span className="font-mono font-bold text-[var(--color-text-primary)]">{s.roomCode}</span></span>
                    <span>•</span>
                    <span>{s.participantCount} Participant{s.participantCount === 1 ? "" : "s"}</span>
                  </div>

                  <div className="text-xs text-[var(--color-text-secondary)] mb-4">
                    Created {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>

                {tab === "active" && (
                  <div className="border-t border-[var(--color-border)]/50 pt-4 mt-2">
                    {terminatingId === s.sessionId ? (
                      <div className="flex items-center justify-between gap-2 bg-[var(--color-error-bg)]/50 p-2 rounded-xl animate-[screenEnter_150ms_var(--ease-out-expo)]">
                        <span className="text-xs font-bold text-[var(--color-error)] pl-2">Terminate session?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTerminate(s.sessionId)}
                            className="px-3 py-1 bg-[var(--color-error)] text-white text-xs font-bold rounded-lg hover:bg-red-800 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setTerminatingId(null)}
                            className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setTerminatingId(s.sessionId)}
                          className="px-4 py-2 text-xs font-bold text-[var(--color-error)] hover:bg-[var(--color-error-bg)]/40 rounded-xl transition-colors"
                        >
                          Terminate
                        </button>
                        <button
                          onClick={() => handleResume(s.sessionId)}
                          className="px-5 py-2 bg-[var(--color-accent)] text-white text-xs font-bold rounded-xl hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 shadow-sm"
                        >
                          Resume →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

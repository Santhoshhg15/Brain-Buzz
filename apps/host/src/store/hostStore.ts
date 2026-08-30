import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData, SessionSummary } from "@quiz/shared-types";
import { authFetch } from "../auth/apiClient";
import { useAuthStore } from "../auth/authStore";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ScreenState = "SELECT_QUIZ" | "LOBBY" | "LIVE_QUESTION" | "REVEAL" | "ENDED";

interface QuizSummary {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
}

interface Participant {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface HostStore {
  socket: AppSocket | null;
  screen: ScreenState;
  availableQuizzes: QuizSummary[];
  activeSessions: SessionSummary[];
  selectedQuizId: string | null;
  sessionId: string | null;
  roomCode: string | null;
  quizTitle: string | null;
  participants: Participant[];
  currentQuestion: QuestionData | null;
  revealData: { correctOptionId: string; optionCounts: Record<string, number> } | null;
  leaderboard: LeaderboardEntry[];
  sessionError: string | null;
  creatingRoomId: string | null;

  // Pause & Live Answered Count states
  isPaused: boolean;
  answeredCount: number;
  totalParticipants: number;
  
  // Actions
  initSocket: () => void;
  fetchQuizzes: () => Promise<void>;
  checkForActiveSessions: () => Promise<void>;
  rejoinSession: (sessionId: string) => Promise<boolean>;
  dismissActiveSessionsBanner: () => void;
  createRoom: (quizId: string) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  terminateSession: (sessionId?: string) => Promise<{ success: boolean; error?: string }>;
  restartSameSession: () => void;
  restartFreshSession: () => void;
  nextQuestion: () => void;
  endSession: () => void;
  resetSession: () => void;
  disconnectSocket: () => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const useHostStore = create<HostStore>((set, get) => ({
  socket: null,
  screen: "SELECT_QUIZ",
  availableQuizzes: [],
  activeSessions: [],
  selectedQuizId: null,
  sessionId: null,
  roomCode: null,
  quizTitle: null,
  participants: [],
  currentQuestion: null,
  revealData: null,
  leaderboard: [],
  sessionError: null,
  creatingRoomId: null,

  isPaused: false,
  answeredCount: 0,
  totalParticipants: 0,

  initSocket: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn("[hostStore] Cannot initialize socket: auth token is missing.");
      return;
    }

    const currentSocket = get().socket;
    if (currentSocket) {
      console.log("[hostStore] Disconnecting existing socket before re-connecting...");
      currentSocket.disconnect();
    }

    const socket: AppSocket = io(SERVER_URL, {
      auth: { token }
    });
    
    socket.on("connect", () => {
      get().checkForActiveSessions();
    });

    socket.on("room:participant-joined", (payload) => {
      set({ participants: payload as unknown as Participant[] });
    });

    socket.on("question:broadcast", (payload) => {
      set({
        screen: "LIVE_QUESTION",
        currentQuestion: payload,
        revealData: null,
        isPaused: false
      });
    });

    socket.on("question:reveal", (payload) => {
      set({
        screen: "REVEAL",
        revealData: payload
      });
    });

    socket.on("leaderboard:update", (payload) => {
      set({ leaderboard: payload as LeaderboardEntry[] });
    });

    socket.on("session:ended", (payload) => {
      set({
        screen: "ENDED",
        leaderboard: payload as LeaderboardEntry[],
        isPaused: false
      });
    });

    socket.on("session:paused", () => {
      set({ isPaused: true });
    });

    socket.on("session:resumed", (payload) => {
      set({
        isPaused: false,
        currentQuestion: payload.currentQuestion
      });
    });

    socket.on("session:terminated", () => {
      set((state) => ({
        screen: "SELECT_QUIZ",
        sessionId: null,
        roomCode: null,
        currentQuestion: null,
        revealData: null,
        isPaused: false,
        answeredCount: 0,
        totalParticipants: 0,
        activeSessions: state.activeSessions.filter(s => s.sessionId !== state.sessionId)
      }));
      get().checkForActiveSessions();
    });

    socket.on("session:restarted", () => {
      set({
        screen: "LOBBY",
        currentQuestion: null,
        revealData: null,
        leaderboard: [],
        isPaused: false,
        answeredCount: 0,
        totalParticipants: 0
      });
    });

    socket.on("answeredCount:update", (payload) => {
      set({
        answeredCount: payload.answeredCount,
        totalParticipants: payload.totalParticipants
      });
    });

    set({ socket });
  },

  fetchQuizzes: async () => {
    try {
      const res = await authFetch(`${SERVER_URL}/api/quizzes`);
      const data = await res.json();
      set({ availableQuizzes: data });
    } catch (e) {
      console.error("Failed to fetch quizzes", e);
    }
  },

  checkForActiveSessions: async () => {
    try {
      const res = await authFetch(`${SERVER_URL}/api/sessions/active`);
      if (res.ok) {
        const data = await res.json();
        set({ activeSessions: data });
      }
    } catch (e) {
      console.error("Failed to check active sessions", e);
    }
  },

  rejoinSession: (sessionId: string) => {
    return new Promise<boolean>((resolve) => {
      const { socket } = get();
      if (!socket) return resolve(false);

      socket.emit("host:rejoin", { sessionId }, (res) => {
        if (!res.success) {
          set((state) => ({ 
            sessionError: res.error || "This session has already ended and can't be resumed.",
            activeSessions: state.activeSessions.filter((s) => s.sessionId !== sessionId)
          }));
          return resolve(false);
        }

        let screen: ScreenState = "LOBBY";
        if (res.status === "LOBBY") {
          screen = "LOBBY";
        } else if (res.status === "LIVE" || res.status === "PAUSED") {
          if (res.revealData) {
            screen = "REVEAL";
          } else if (res.currentQuestion) {
            screen = "LIVE_QUESTION";
          } else {
            screen = "LOBBY";
          }
        } else if (res.status === "ENDED") {
          screen = "ENDED";
        }

        set({
          sessionId,
          roomCode: res.roomCode || null,
          quizTitle: res.quizTitle || null,
          participants: (res.participants || []).map(p => ({ id: p.id, name: p.name, score: p.score })),
          currentQuestion: res.currentQuestion || null,
          isPaused: res.isPaused || false,
          revealData: res.revealData || null,
          leaderboard: res.leaderboard || [],
          answeredCount: res.answeredCount || 0,
          totalParticipants: res.totalParticipants || 0,
          screen,
          sessionError: null
        });

        resolve(true);
      });
    });
  },

  dismissActiveSessionsBanner: () => {
    set({ activeSessions: [] });
  },

  createRoom: (quizId: string) => {
    const { socket, creatingRoomId } = get();
    if (!socket || creatingRoomId) return; // Prevent double clicks
    
    set({ creatingRoomId: quizId, sessionError: null });

    socket.emit("room:create", { quizId }, (res) => {
      if (res.error) {
        set({ sessionError: res.error, creatingRoomId: null });
        return;
      }
      set({
        selectedQuizId: quizId,
        sessionId: res.sessionId || null,
        roomCode: res.roomCode || null,
        screen: "LOBBY",
        participants: [],
        sessionError: null,
        creatingRoomId: null
      });
    });
  },

  startSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("session:start", { sessionId });
    }
  },

  pauseSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("session:pause", { sessionId });
    }
  },

  resumeSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("session:resume", { sessionId });
    }
  },

  terminateSession: (targetSessionId?: string) => {
    return new Promise((resolve) => {
      const { socket, sessionId } = get();
      const idToTerminate = targetSessionId || sessionId;
      
      if (!socket || !idToTerminate) {
        return resolve({ success: false, error: "No active connection or session to terminate." });
      }

      let timeoutFired = false;
      const timeoutId = setTimeout(() => {
        timeoutFired = true;
        resolve({ success: false, error: "Termination request timed out, please try again" });
      }, 5000);

      socket.emit("session:terminate", { sessionId: idToTerminate }, (res) => {
        if (timeoutFired) return;
        clearTimeout(timeoutId);
        resolve(res);
      });
    });
  },

  restartSameSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("session:restartSame", { sessionId });
    }
  },

  restartFreshSession: () => {
    const { socket, sessionId, selectedQuizId } = get();
    if (socket && sessionId) {
      get().terminateSession(sessionId);
    }
    if (selectedQuizId) {
      get().createRoom(selectedQuizId);
    } else {
      set({ screen: "SELECT_QUIZ" });
    }
  },

  nextQuestion: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("question:next", { sessionId });
    }
  },

  endSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("question:next", { sessionId });
    }
  },

  resetSession: () => {
    set({
      screen: "SELECT_QUIZ",
      selectedQuizId: null,
      sessionId: null,
      roomCode: null,
      quizTitle: null,
      participants: [],
      currentQuestion: null,
      revealData: null,
      leaderboard: [],
      sessionError: null,
      creatingRoomId: null,
      isPaused: false,
      answeredCount: 0,
      totalParticipants: 0
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));

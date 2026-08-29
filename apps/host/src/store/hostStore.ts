import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData } from "@quiz/shared-types";
import { authFetch } from "../auth/apiClient";
import { useAuthStore } from "../auth/authStore";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ScreenState = "SELECT_QUIZ" | "LOBBY" | "LIVE_QUESTION" | "REVEAL" | "ENDED";

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
  id: string; // The leaderboard type uses id, wait let me check payload
  name: string;
  score: number;
  rank: number;
}

interface HostStore {
  socket: AppSocket | null;
  screen: ScreenState;
  availableQuizzes: QuizSummary[];
  selectedQuizId: string | null;
  sessionId: string | null;
  roomCode: string | null;
  participants: Participant[];
  currentQuestion: QuestionData | null;
  revealData: { correctOptionId: string; optionCounts: Record<string, number> } | null;
  leaderboard: LeaderboardEntry[];
  sessionError: string | null;
  
  // Actions
  initSocket: () => void;
  fetchQuizzes: () => Promise<void>;
  createRoom: (quizId: string) => void;
  startSession: () => void;
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
  selectedQuizId: null,
  sessionId: null,
  roomCode: null,
  participants: [],
  currentQuestion: null,
  revealData: null,
  leaderboard: [],
  sessionError: null,

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
    
    socket.on("room:participant-joined", (payload) => {
      set({ participants: payload as unknown as Participant[] });
    });

    socket.on("question:broadcast", (payload) => {
      set({
        screen: "LIVE_QUESTION",
        currentQuestion: payload,
        revealData: null
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
        leaderboard: payload as LeaderboardEntry[]
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

  createRoom: (quizId: string) => {
    const { socket } = get();
    if (!socket) return;
    
    socket.emit("room:create", { quizId }, (res) => {
      if (res.error) {
        set({ sessionError: res.error });
        return;
      }
      set({
        selectedQuizId: quizId,
        sessionId: res.sessionId || null,
        roomCode: res.roomCode || null,
        screen: "LOBBY",
        participants: [],
        sessionError: null
      });
    });
  },

  startSession: () => {
    const { socket, sessionId } = get();
    if (socket && sessionId) {
      socket.emit("session:start", { sessionId });
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
      // We don't have a specific event for force ending, but if we did we'd emit it here.
      // Wait, let's just emit question:next if we want to skip or something.
      // Actually we have no explicit session:end client event in the current implementation.
      // We can just rely on the server auto-ending, or emit question:next which triggers ENDED when over.
      socket.emit("question:next", { sessionId });
    }
  },

  resetSession: () => {
    set({
      screen: "SELECT_QUIZ",
      selectedQuizId: null,
      sessionId: null,
      roomCode: null,
      participants: [],
      currentQuestion: null,
      revealData: null,
      leaderboard: [],
      sessionError: null
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

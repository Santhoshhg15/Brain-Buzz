import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData, QuestionRevealPayload } from "@quiz/shared-types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ScreenState = "JOIN" | "WAITING_ROOM" | "QUESTION" | "ANSWERED" | "REVEAL" | "ENDED" | "TERMINATED";
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  streakBonusApplied?: boolean;
  accuracyBonusApplied?: number;
}

export interface PerformanceReport {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number;
  finalScore: number;
  finalRank: number;
  totalParticipants: number;
  responseTimeStats: {
    minMs: number;
    maxMs: number;
    avgMs: number;
    totalMs: number;
  } | null;
  perQuestionBreakdown: Array<{
    questionText: string;
    isCorrect: boolean;
    responseTimeMs: number | null;
    pointsAwarded: number;
  }>;
}

interface PlayStore {
  socket: AppSocket | null;
  screen: ScreenState;
  connectionStatus: "connected" | "reconnecting";
  isRejoining: boolean;
  isPaused: boolean;
  terminatedData: { finalLeaderboard: LeaderboardEntry[] } | null;
  
  performanceReport: PerformanceReport | null;
  reportLoading: boolean;
  reportScreenActive: boolean;
  
  // Input fields
  roomCode: string;
  studentName: string;
  setRoomCode: (code: string) => void;
  setStudentName: (name: string) => void;
  
  // Session details
  participantId: string | null;
  sessionId: string | null;
  quizTitle: string | null;
  joinError: string | null;
  
  // Game state
  currentQuestion: QuestionData | null;
  selectedOptionId: string | null;
  revealData: QuestionRevealPayload | null;
  myLastAnswerCorrect: boolean | null;
  
  // Leaderboard
  leaderboard: LeaderboardEntry[] | null;
  myRank: number | null;
  myScore: number | null;
  
  // Actions
  initSocket: () => void;
  joinRoom: () => void;
  submitAnswer: (optionId: string) => void;
  resetGame: () => void;
  attemptRejoin: () => void;
  fetchPerformanceReport: () => Promise<void>;
  setReportScreenActive: (active: boolean) => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

function checkInitialSessionState(): { isRejoining: boolean; initialRoomCode: string } {
  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get("room")?.trim().toUpperCase() || null;
  const storedRaw = localStorage.getItem("brainbuzz_play_session");

  let storedRoomCode: string | null = null;
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      if (parsed && typeof parsed.roomCode === "string") {
        storedRoomCode = parsed.roomCode.trim().toUpperCase();
      }
    } catch {
      localStorage.removeItem("brainbuzz_play_session");
    }
  }

  // Priority 1: URL has a room parameter AND it's DIFFERENT from stored roomCode (or no stored session)
  // Explicit fresh join intent: clear stored session and show JoinScreen with pre-filled room.
  if (urlRoom && urlRoom !== storedRoomCode) {
    localStorage.removeItem("brainbuzz_play_session");
    return {
      isRejoining: false,
      initialRoomCode: urlRoom,
    };
  }

  // Priority 2 & 3: Either no room URL parameter or URL room matches stored roomCode exactly.
  if (storedRaw && storedRoomCode) {
    return {
      isRejoining: true,
      initialRoomCode: urlRoom || storedRoomCode,
    };
  }

  return {
    isRejoining: false,
    initialRoomCode: urlRoom || "",
  };
}

const initialState = checkInitialSessionState();

export const usePlayStore = create<PlayStore>((set, get) => ({
  socket: null,
  screen: "JOIN",
  connectionStatus: "connected",
  isRejoining: initialState.isRejoining,
  isPaused: false,
  terminatedData: null,
  
  performanceReport: null,
  reportLoading: false,
  reportScreenActive: false,
  
  roomCode: initialState.initialRoomCode,
  studentName: "",
  setRoomCode: (code: string) => set({ roomCode: code.toUpperCase() }),
  setStudentName: (name: string) => set({ studentName: name }),
  
  participantId: null,
  sessionId: null,
  quizTitle: null,
  joinError: null,
  
  currentQuestion: null,
  selectedOptionId: null,
  revealData: null,
  myLastAnswerCorrect: null,
  
  leaderboard: null,
  myRank: null,
  myScore: null,
  
  initSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const socket: AppSocket = io(SERVER_URL);
    
    socket.on("connect", () => {
      set({ connectionStatus: "connected" });
      get().attemptRejoin();
    });

    socket.on("disconnect", () => {
      set({ connectionStatus: "reconnecting" });
    });
    
    socket.on("question:broadcast", (payload) => {
      set({
        screen: "QUESTION",
        currentQuestion: payload,
        selectedOptionId: null,
        revealData: null,
        myLastAnswerCorrect: null
      });
    });

    socket.on("question:reveal", (payload) => {
      const revealMs = performance.now();
      console.log(`[TIMING] 'question:reveal' received at ${revealMs.toFixed(2)}ms`);
      
      const lastSubmitMs = (window as any).lastAnswerSubmitMs;
      if (lastSubmitMs) {
        console.log(`[TIMING] Total round-trip from submit emit to reveal received: ${(revealMs - lastSubmitMs).toFixed(2)}ms`);
      }

      const { selectedOptionId } = get();
      const myLastAnswerCorrect = selectedOptionId ? (selectedOptionId === payload.correctOptionId) : false;
      
      set({
        screen: "REVEAL",
        revealData: payload,
        myLastAnswerCorrect
      });
    });

    socket.on("leaderboard:update", (payload) => {
      const { participantId } = get();
      const me = (payload as LeaderboardEntry[]).find(e => e.id === participantId);
      
      set({
        leaderboard: payload as LeaderboardEntry[],
        myRank: me ? me.rank : null
      });
    });

    socket.on("session:ended", (payload) => {
      const { participantId } = get();
      const me = (payload.finalLeaderboard as LeaderboardEntry[]).find(e => e.id === participantId);
      
      localStorage.removeItem("brainbuzz_play_session");

      set({
        screen: "ENDED",
        leaderboard: payload.finalLeaderboard as LeaderboardEntry[],
        myRank: me ? me.rank : null,
        myScore: me ? me.score : null
      });
    });

    socket.on("session:paused", () => {
      set({ isPaused: true });
    });

    socket.on("session:resumed", (payload) => {
      set((state) => ({
        isPaused: false,
        currentQuestion: state.currentQuestion ? { ...state.currentQuestion, serverStartTime: payload.currentQuestion.serverStartTime } : null
      }));
    });

    socket.on("session:terminated", (payload) => {
      localStorage.removeItem("brainbuzz_play_session");
      set({
        screen: "TERMINATED",
        terminatedData: { finalLeaderboard: payload.finalLeaderboard as LeaderboardEntry[] }
      });
    });

    set({ socket });
  },
  
  joinRoom: () => {
    const { socket, roomCode, studentName } = get();
    if (!socket || !roomCode.trim() || !studentName.trim()) return;
    
    set({ joinError: null });
    
    socket.emit("room:join", { roomCode, studentName }, (res) => {
      if ("error" in res) {
        set({ joinError: res.error });
      } else {
        localStorage.setItem("brainbuzz_play_session", JSON.stringify({
          roomCode,
          participantId: res.participantId,
          sessionId: res.sessionId
        }));
        
        set({
          screen: "WAITING_ROOM",
          participantId: res.participantId,
          sessionId: res.sessionId,
          quizTitle: res.quizTitle
        });
      }
    });
  },
  
  submitAnswer: (optionId: string) => {
    const startMs = performance.now();
    console.log(`[TIMING] submitAnswer called at ${startMs.toFixed(2)}ms`);

    const { socket, selectedOptionId, sessionId, participantId, currentQuestion } = get();
    
    // Prevent double submission
    if (selectedOptionId || !socket || !sessionId || !participantId || !currentQuestion) return;
    
    set({
      selectedOptionId: optionId,
      screen: "ANSWERED"
    });

    const localUpdateMs = performance.now();
    console.log(`[TIMING] Local optimistic update completed at ${localUpdateMs.toFixed(2)}ms (took ${(localUpdateMs - startMs).toFixed(2)}ms)`);
    
    socket.emit("answer:submit", {
      sessionId,
      participantId,
      questionId: currentQuestion.id,
      optionId
    });

    const emitMs = performance.now();
    console.log(`[TIMING] 'answer:submit' emitted at ${emitMs.toFixed(2)}ms (took ${(emitMs - localUpdateMs).toFixed(2)}ms)`);
    
    (window as any).lastAnswerSubmitMs = emitMs;
  },
  
  resetGame: () => {
    localStorage.removeItem("brainbuzz_play_session");
    set({
      screen: "JOIN",
      roomCode: "",
      participantId: null,
      sessionId: null,
      quizTitle: null,
      joinError: null,
      currentQuestion: null,
      selectedOptionId: null,
      revealData: null,
      myLastAnswerCorrect: null,
      leaderboard: null,
      myRank: null,
      myScore: null,
      isPaused: false,
      terminatedData: null
    });
  },
  
  attemptRejoin: () => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("room")?.trim().toUpperCase() || null;
    const storedRaw = localStorage.getItem("brainbuzz_play_session");

    if (!storedRaw) {
      set({ isRejoining: false });
      if (urlRoom) set({ roomCode: urlRoom });
      return;
    }

    let storedRoomCode: string | null = null;
    try {
      const parsed = JSON.parse(storedRaw);
      if (parsed && typeof parsed.roomCode === "string") {
        storedRoomCode = parsed.roomCode.trim().toUpperCase();
      }
    } catch {
      localStorage.removeItem("brainbuzz_play_session");
      set({ isRejoining: false });
      if (urlRoom) set({ roomCode: urlRoom });
      return;
    }

    // Explicit fresh join intent: URL room differs from stored session room
    if (urlRoom && urlRoom !== storedRoomCode) {
      localStorage.removeItem("brainbuzz_play_session");
      set({ isRejoining: false, screen: "JOIN", roomCode: urlRoom });
      return;
    }

    const { roomCode, participantId, sessionId } = JSON.parse(storedRaw);
    const { socket } = get();
    if (!socket) return;

    socket.emit("room:rejoin", { roomCode, participantId }, (res) => {
      if (!res.success) {
        localStorage.removeItem("brainbuzz_play_session");
        set({ isRejoining: false, screen: "JOIN" });
        if (urlRoom) set({ roomCode: urlRoom });
        return;
      }

      const updates: Partial<PlayStore> = {
        isRejoining: false,
        roomCode,
        participantId,
        sessionId,
        quizTitle: res.quizTitle || get().quizTitle,
        myScore: res.myScore ?? get().myScore,
      };

      if (res.screenState === "LOBBY") {
        updates.screen = "WAITING_ROOM";
      } else if (res.screenState === "QUESTION") {
        updates.currentQuestion = res.currentQuestion || null;
        updates.screen = res.hasAnsweredCurrentQuestion ? "ANSWERED" : "QUESTION";
        updates.selectedOptionId = res.hasAnsweredCurrentQuestion ? "REJOIN_PLACEHOLDER" : null;
      } else if (res.screenState === "REVEAL") {
        updates.screen = "REVEAL";
        updates.revealData = res.revealData || null;
        updates.leaderboard = res.leaderboard || null;
        const me = updates.leaderboard?.find(e => e.id === participantId);
        updates.myRank = me ? me.rank : null;
      } else if (res.screenState === "ENDED") {
        updates.screen = "ENDED";
        updates.leaderboard = res.leaderboard || null;
        const me = updates.leaderboard?.find(e => e.id === participantId);
        updates.myRank = me ? me.rank : null;
      }

      set(updates);
    });
  },
  
  setReportScreenActive: (active: boolean) => {
    set({ reportScreenActive: active });
  },
  
  fetchPerformanceReport: async () => {
    const { sessionId, participantId } = get();
    if (!sessionId || !participantId) return;
    
    set({ reportLoading: true });
    
    try {
      const res = await fetch(`${SERVER_URL}/api/sessions/${sessionId}/participants/${participantId}/report`);
      if (res.ok) {
        const data = await res.json();
        set({ performanceReport: data });
      } else {
        console.error("Failed to fetch performance report", res.status);
      }
    } catch (error) {
      console.error("Error fetching performance report:", error);
    } finally {
      set({ reportLoading: false });
    }
  }
}));

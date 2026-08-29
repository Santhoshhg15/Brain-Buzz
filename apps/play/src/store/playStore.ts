import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData } from "@quiz/shared-types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ScreenState = "JOIN" | "WAITING_ROOM" | "QUESTION" | "ANSWERED" | "REVEAL" | "ENDED";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface PlayStore {
  socket: AppSocket | null;
  screen: ScreenState;
  connectionStatus: "connected" | "reconnecting";
  isRejoining: boolean;
  
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
  revealData: { correctOptionId: string; optionCounts: Record<string, number> } | null;
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
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const usePlayStore = create<PlayStore>((set, get) => ({
  socket: null,
  screen: "JOIN",
  connectionStatus: "connected",
  isRejoining: !!localStorage.getItem("brainbuzz_play_session"),
  
  roomCode: "",
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
      const me = (payload as LeaderboardEntry[]).find(e => e.id === participantId);
      
      localStorage.removeItem("brainbuzz_play_session");

      set({
        screen: "ENDED",
        leaderboard: payload as LeaderboardEntry[],
        myRank: me ? me.rank : null,
        myScore: me ? me.score : null
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
    const { socket, selectedOptionId, sessionId, participantId, currentQuestion } = get();
    
    // Prevent double submission
    if (selectedOptionId || !socket || !sessionId || !participantId || !currentQuestion) return;
    
    set({
      selectedOptionId: optionId,
      screen: "ANSWERED"
    });
    
    socket.emit("answer:submit", {
      sessionId,
      participantId,
      questionId: currentQuestion.id,
      optionId
    });
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
      myScore: null
    });
  },
  
  attemptRejoin: () => {
    const stored = localStorage.getItem("brainbuzz_play_session");
    if (!stored) {
      set({ isRejoining: false });
      return;
    }
    
    try {
      const { roomCode, participantId, sessionId } = JSON.parse(stored);
      const { socket } = get();
      if (!socket) return;
      
      socket.emit("room:rejoin", { roomCode, participantId }, (res) => {
        if (!res.success) {
          localStorage.removeItem("brainbuzz_play_session");
          set({ isRejoining: false, screen: "JOIN" });
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
    } catch (e) {
      localStorage.removeItem("brainbuzz_play_session");
      set({ isRejoining: false });
    }
  }
}));

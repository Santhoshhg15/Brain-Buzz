import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData, QuestionRevealPayload } from "@quiz/shared-types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ScreenState = "CONNECT" | "LOBBY" | "QUESTION" | "REVEAL" | "ENDED" | "TERMINATED";
export interface Participant {
  id: string;
  name: string;
  score: number;
  connectionStatus?: "connected" | "reconnecting";
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  streakBonusApplied?: boolean;
  accuracyBonusApplied?: number;
  currentStreak?: number;
}

interface DisplayStore {
  socket: AppSocket | null;
  screen: ScreenState;
  isPaused: boolean;
  terminatedData: { finalLeaderboard: LeaderboardEntry[] } | null;
  
  roomCode: string;
  setRoomCode: (code: string) => void;
  connectError: string | null;
  
  quizTitle: string | null;
  participants: Participant[];
  
  currentQuestion: QuestionData | null;
  revealData: QuestionRevealPayload | null;
  leaderboard: LeaderboardEntry[] | null;
  
  initSocket: () => void;
  connectToRoom: () => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const DISPLAY_NAME = "__DISPLAY__";

export const useDisplayStore = create<DisplayStore>((set, get) => ({
  socket: null,
  screen: "CONNECT",
  isPaused: false,
  terminatedData: null,
  
  roomCode: "",
  setRoomCode: (code: string) => set({ roomCode: code.toUpperCase() }),
  connectError: null,
  
  quizTitle: null,
  participants: [],
  
  currentQuestion: null,
  revealData: null,
  leaderboard: null,
  
  initSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const socket: AppSocket = io(SERVER_URL);
    
    socket.on("room:participant-joined", (payload) => {
      const participants = (payload as unknown as Participant[])
        .filter(p => p.name !== DISPLAY_NAME);
      set({ participants });
    });

    socket.on("question:broadcast", (payload) => {
      set({
        screen: "QUESTION",
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
      const leaderboard = (payload as LeaderboardEntry[])
        .filter(p => p.name !== DISPLAY_NAME);
      set({ leaderboard });
    });

    socket.on("session:ended", (payload) => {
      const leaderboard = (payload.finalLeaderboard as unknown as LeaderboardEntry[])
        .filter(p => p.name !== DISPLAY_NAME);
      set({
        screen: "ENDED",
        leaderboard
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
      const leaderboard = (payload.finalLeaderboard as LeaderboardEntry[])
        .filter(p => p.name !== DISPLAY_NAME);
      set({
        screen: "TERMINATED",
        terminatedData: { finalLeaderboard: leaderboard }
      });
    });

    socket.on("participant:statusChanged", (payload) => {
      set((state) => {
        if (payload.status === "left") {
          return {
            participants: state.participants.filter(p => p.id !== payload.participantId)
          };
        }
        return {
          participants: state.participants.map(p => 
            p.id === payload.participantId 
              ? { ...p, connectionStatus: payload.status as "connected" | "reconnecting" } 
              : p
          )
        };
      });
    });

    set({ socket });
  },
  
  connectToRoom: () => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode.trim()) return;
    
    set({ connectError: null });
    
    socket.emit("room:join", { roomCode, studentName: DISPLAY_NAME }, (res) => {
      if ("error" in res) {
        set({ connectError: res.error });
      } else {
        set({
          screen: "LOBBY",
          quizTitle: res.quizTitle
        });
      }
    });
  }
}));

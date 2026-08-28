import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents, QuestionData } from "@quiz/shared-types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ScreenState = "CONNECT" | "LOBBY" | "QUESTION" | "REVEAL" | "ENDED";

export interface Participant {
  id: string;
  name: string;
  score: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface DisplayStore {
  socket: AppSocket | null;
  screen: ScreenState;
  
  roomCode: string;
  setRoomCode: (code: string) => void;
  connectError: string | null;
  
  quizTitle: string | null;
  participants: Participant[];
  
  currentQuestion: QuestionData | null;
  revealData: { correctOptionId: string; optionCounts: Record<string, number> } | null;
  leaderboard: LeaderboardEntry[] | null;
  
  initSocket: () => void;
  connectToRoom: () => void;
}

const SERVER_URL = "http://localhost:4000";
const DISPLAY_NAME = "__DISPLAY__";

export const useDisplayStore = create<DisplayStore>((set, get) => ({
  socket: null,
  screen: "CONNECT",
  
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
      const leaderboard = (payload as LeaderboardEntry[])
        .filter(p => p.name !== DISPLAY_NAME);
      set({
        screen: "ENDED",
        leaderboard
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

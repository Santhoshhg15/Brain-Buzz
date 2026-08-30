export interface ParticipantData {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export interface QuestionData {
  id: string;
  index: number;
  total: number;
  text: string;
  options: { id: string; text: string; orderIndex: number }[];
  durationSeconds: number;
  serverStartTime: number;
}

export interface OptionCount {
  [optionId: string]: number;
}

export interface QuestionRevealPayload {
  questionId: string;
  correctOptionId: string;
  optionCounts: OptionCount;
}

export interface RoomRejoinPayload {
  roomCode: string;
  participantId: string;
}

export type RejoinScreenState = "LOBBY" | "QUESTION" | "REVEAL" | "ENDED";

export interface RoomRejoinResponse {
  success: boolean;
  error?: string;
  screenState?: RejoinScreenState;
  quizTitle?: string;
  currentQuestion?: QuestionData;
  hasAnsweredCurrentQuestion?: boolean;
  revealData?: QuestionRevealPayload;
  leaderboard?: ParticipantData[];
  myScore?: number;
}

// ─── Host Rejoin ───────────────────────────────────────────────────────────────

export interface HostRejoinPayload {
  sessionId: string;
}

export interface HostRejoinResponse {
  success: boolean;
  error?: string;
  roomCode?: string;
  status?: "LOBBY" | "LIVE" | "PAUSED" | "ENDED";
  quizTitle?: string;
  participants?: { id: string; name: string; score: number }[];
  currentQuestion?: QuestionData;
  isPaused?: boolean;
  pausedRemainingMs?: number | null;
  revealData?: QuestionRevealPayload;
  leaderboard?: ParticipantData[];
  answeredCount?: number;
  totalParticipants?: number;
}

// ─── Session Summary (for dashboard REST endpoints) ───────────────────────────

export interface SessionSummary {
  sessionId: string;
  roomCode: string;
  quizTitle: string;
  status: "LOBBY" | "LIVE" | "PAUSED" | "ENDED" | "INTERRUPTED";
  participantCount: number;
  createdAt: string;
}

// ─── Socket Event Maps ─────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  "room:create": (payload: { quizId: string }, callback: (res: { sessionId?: string; roomCode?: string; error?: string }) => void) => void;
  "room:join": (payload: { roomCode: string; studentName: string }, callback: (res: { participantId: string; sessionId: string; quizTitle: string } | { error: string }) => void) => void;
  "room:rejoin": (payload: RoomRejoinPayload, callback: (res: RoomRejoinResponse) => void) => void;
  "host:rejoin": (payload: HostRejoinPayload, callback: (res: HostRejoinResponse) => void) => void;
  "session:start": (payload: { sessionId: string }) => void;
  "session:pause": (payload: { sessionId: string }) => void;
  "session:resume": (payload: { sessionId: string }) => void;
  "session:terminate": (payload: { sessionId: string }) => void;
  "session:restartSame": (payload: { sessionId: string }) => void;
  "session:end": (payload: { sessionId: string }) => void;
  "answer:submit": (payload: { sessionId: string; participantId: string; questionId: string; optionId: string }) => void;
  "question:next": (payload: { sessionId: string }) => void;
}

export interface ServerToClientEvents {
  "room:participant-joined": (payload: ParticipantData[]) => void;
  "question:broadcast": (payload: QuestionData) => void;
  "question:reveal": (payload: QuestionRevealPayload) => void;
  "leaderboard:update": (payload: ParticipantData[]) => void;
  "session:ended": (payload: ParticipantData[]) => void;
  "session:paused": () => void;
  "session:resumed": (payload: { currentQuestion: QuestionData }) => void;
  "session:terminated": () => void;
  "session:restarted": () => void;
  "answeredCount:update": (payload: { answeredCount: number; totalParticipants: number }) => void;
}

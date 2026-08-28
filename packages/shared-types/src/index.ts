export interface ParticipantData {
  id: string;
  name: string;
  score: string | number; // sometimes we use rank
  rank?: number;
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

export interface ClientToServerEvents {
  "room:create": (payload: { quizId: string }, callback: (res: { sessionId: string; roomCode: string }) => void) => void;
  "room:join": (payload: { roomCode: string; studentName: string }, callback: (res: { participantId: string; sessionId: string; quizTitle: string } | { error: string }) => void) => void;
  "session:start": (payload: { sessionId: string }) => void;
  "answer:submit": (payload: { sessionId: string; participantId: string; questionId: string; optionId: string }) => void;
  "question:next": (payload: { sessionId: string }) => void;
  "session:end": (payload: { sessionId: string }) => void;
}

export interface ServerToClientEvents {
  "room:participant-joined": (payload: ParticipantData[]) => void;
  "question:broadcast": (payload: QuestionData) => void;
  "question:reveal": (payload: { questionId: string; correctOptionId: string; optionCounts: OptionCount }) => void;
  "leaderboard:update": (payload: ParticipantData[]) => void;
  "session:ended": (payload: ParticipantData[]) => void;
}

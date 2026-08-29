import { ParticipantData, QuestionData, QuestionRevealPayload } from "@quiz/shared-types";

export interface SessionParticipant {
  id: string;
  name: string;
  socketId: string;
  score: number;
}

export interface SessionAnswer {
  optionId: string;
  answeredAtMs: number;
}

export interface SessionState {
  sessionId: string;
  quizId: string;
  roomCode: string;
  status: "LOBBY" | "LIVE" | "ENDED";
  questions: any[];
  currentQuestionIndex: number;
  participants: Map<string, SessionParticipant>;
  currentQuestionAnswers: Map<string, SessionAnswer>;
  questionStartTimeMs: number;
  questionTimer: NodeJS.Timeout | null;
  hasRevealedCurrentQuestion: boolean;
  lastRevealData?: QuestionRevealPayload;
}

const sessionsByRoomCode = new Map<string, SessionState>();
const roomCodeBySessionId = new Map<string, string>();

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code: string;
  do {
    const randomChars = Array.from({ length: 4 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const randomNums = Math.floor(100 + Math.random() * 900); // 3 digits
    code = `${randomChars}-${randomNums}`;
  } while (sessionsByRoomCode.has(code));
  return code;
}

export function createSession(sessionId: string, quizId: string, roomCode: string, questions: any[]): SessionState {
  const session: SessionState = {
    sessionId,
    quizId,
    roomCode,
    status: "LOBBY",
    questions,
    currentQuestionIndex: -1,
    participants: new Map(),
    currentQuestionAnswers: new Map(),
    questionStartTimeMs: 0,
    questionTimer: null,
    hasRevealedCurrentQuestion: false,
  };
  sessionsByRoomCode.set(roomCode, session);
  roomCodeBySessionId.set(sessionId, roomCode);
  return session;
}

export function getSession(roomCode: string): SessionState | undefined {
  return sessionsByRoomCode.get(roomCode);
}

export function getSessionById(sessionId: string): SessionState | undefined {
  const roomCode = roomCodeBySessionId.get(sessionId);
  if (roomCode) {
    return sessionsByRoomCode.get(roomCode);
  }
  return undefined;
}

export function addParticipant(roomCode: string, participantId: string, name: string, socketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    session.participants.set(participantId, {
      id: participantId,
      name,
      socketId,
      score: 0,
    });
  }
}

export function findParticipant(roomCode: string, participantId: string): SessionParticipant | undefined {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    return session.participants.get(participantId);
  }
  return undefined;
}

export function updateParticipantSocketId(roomCode: string, participantId: string, newSocketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    const participant = session.participants.get(participantId);
    if (participant) {
      participant.socketId = newSocketId;
    }
  }
}

export function hasAnswered(roomCode: string, participantId: string): boolean {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    return session.currentQuestionAnswers.has(participantId);
  }
  return false;
}

export function getCurrentQuestionForRejoin(session: SessionState): QuestionData | undefined {
  if (session.currentQuestionIndex >= 0 && session.currentQuestionIndex < session.questions.length) {
    const question = session.questions[session.currentQuestionIndex];
    return {
      id: question.id,
      index: session.currentQuestionIndex,
      total: session.questions.length,
      text: question.text,
      options: question.options.map((o: any) => ({
        id: o.id,
        text: o.text,
        orderIndex: o.orderIndex,
      })),
      durationSeconds: question.durationSeconds,
      serverStartTime: session.questionStartTimeMs,
    };
  }
  return undefined;
}

export function getLastRevealData(roomCode: string): QuestionRevealPayload | undefined {
  const session = sessionsByRoomCode.get(roomCode);
  return session?.lastRevealData;
}

export function recordAnswer(roomCode: string, participantId: string, optionId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session && !session.currentQuestionAnswers.has(participantId)) {
    session.currentQuestionAnswers.set(participantId, {
      optionId,
      answeredAtMs: Date.now(),
    });
  }
}

export function calculateScoreForAnswer(
  session: SessionState,
  participantId: string
): { points: number; isCorrect: boolean } {
  const answer = session.currentQuestionAnswers.get(participantId);
  if (!answer) return { points: 0, isCorrect: false };

  const question = session.questions[session.currentQuestionIndex];
  const option = question.options.find((o: any) => o.id === answer.optionId);

  if (!option || !option.isCorrect) {
    return { points: 0, isCorrect: false };
  }

  const basePoints = question.points;
  const totalDurationMs = question.durationSeconds * 1000;
  
  let remainingTimeMs = totalDurationMs - (answer.answeredAtMs - session.questionStartTimeMs);
  if (remainingTimeMs < 0) remainingTimeMs = 0;
  
  let points = Math.round(basePoints * (remainingTimeMs / totalDurationMs));
  const minPoints = Math.floor(0.1 * basePoints);
  if (points < minPoints) points = minPoints;

  return { points, isCorrect: true };
}

export function getLeaderboard(roomCode: string): ParticipantData[] {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session) return [];

  const participants = Array.from(session.participants.values());
  participants.sort((a, b) => b.score - a.score);

  return participants.map((p, index) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    rank: index + 1,
  }));
}

export function removeSession(roomCode: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    if (session.questionTimer) {
      clearTimeout(session.questionTimer);
    }
    roomCodeBySessionId.delete(session.sessionId);
    sessionsByRoomCode.delete(roomCode);
  }
}

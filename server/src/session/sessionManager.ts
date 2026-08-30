import { PrismaClient } from "@prisma/client";
import { ParticipantData, QuestionData, QuestionRevealPayload } from "@quiz/shared-types";

const prisma = new PrismaClient();

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
  instructorId: string;
  hostSocketId: string | null;
  status: "LOBBY" | "LIVE" | "PAUSED" | "ENDED";
  questions: any[];
  currentQuestionIndex: number;
  participants: Map<string, SessionParticipant>;
  currentQuestionAnswers: Map<string, SessionAnswer>;
  questionStartTimeMs: number;
  questionTimer: NodeJS.Timeout | null;
  hasRevealedCurrentQuestion: boolean;
  lastRevealData?: QuestionRevealPayload;
  isPaused: boolean;
  pausedRemainingMs: number | null;
}

const sessionsByRoomCode = new Map<string, SessionState>();
const roomCodeBySessionId = new Map<string, string>();

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code: string;
  do {
    const randomChars = Array.from({ length: 4 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const randomNums = Math.floor(100 + Math.random() * 900);
    code = `${randomChars}-${randomNums}`;
  } while (sessionsByRoomCode.has(code));
  return code;
}

export function createSession(
  sessionId: string,
  quizId: string,
  roomCode: string,
  questions: any[],
  instructorId: string,
  hostSocketId: string | null = null
): SessionState {
  const session: SessionState = {
    sessionId,
    quizId,
    roomCode,
    instructorId,
    hostSocketId,
    status: "LOBBY",
    questions,
    currentQuestionIndex: -1,
    participants: new Map(),
    currentQuestionAnswers: new Map(),
    questionStartTimeMs: 0,
    questionTimer: null,
    hasRevealedCurrentQuestion: false,
    isPaused: false,
    pausedRemainingMs: null,
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
  if (roomCode) return sessionsByRoomCode.get(roomCode);
  return undefined;
}

export function addParticipant(roomCode: string, participantId: string, name: string, socketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    session.participants.set(participantId, { id: participantId, name, socketId, score: 0 });
  }
}

export function findParticipant(roomCode: string, participantId: string): SessionParticipant | undefined {
  return sessionsByRoomCode.get(roomCode)?.participants.get(participantId);
}

export function updateParticipantSocketId(roomCode: string, participantId: string, newSocketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    const participant = session.participants.get(participantId);
    if (participant) participant.socketId = newSocketId;
  }
}

export function updateHostSocketId(roomCode: string, socketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) session.hostSocketId = socketId;
}

export function hasAnswered(roomCode: string, participantId: string): boolean {
  return sessionsByRoomCode.get(roomCode)?.currentQuestionAnswers.has(participantId) ?? false;
}

export function getAnsweredCount(roomCode: string): { answeredCount: number; totalParticipants: number } {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session) return { answeredCount: 0, totalParticipants: 0 };
  return {
    answeredCount: session.currentQuestionAnswers.size,
    totalParticipants: session.participants.size,
  };
}

export function getCurrentQuestionForRejoin(session: SessionState): QuestionData | undefined {
  if (session.currentQuestionIndex >= 0 && session.currentQuestionIndex < session.questions.length) {
    const question = session.questions[session.currentQuestionIndex];
    return {
      id: question.id,
      index: session.currentQuestionIndex,
      total: session.questions.length,
      text: question.text,
      options: question.options.map((o: any) => ({ id: o.id, text: o.text, orderIndex: o.orderIndex })),
      durationSeconds: question.durationSeconds,
      serverStartTime: session.questionStartTimeMs,
    };
  }
  return undefined;
}

export function getLastRevealData(roomCode: string): QuestionRevealPayload | undefined {
  return sessionsByRoomCode.get(roomCode)?.lastRevealData;
}

export function recordAnswer(roomCode: string, participantId: string, optionId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session && !session.currentQuestionAnswers.has(participantId)) {
    session.currentQuestionAnswers.set(participantId, { optionId, answeredAtMs: Date.now() });
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
  if (!option || !option.isCorrect) return { points: 0, isCorrect: false };

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
  return participants.map((p, index) => ({ id: p.id, name: p.name, score: p.score, rank: index + 1 }));
}

// ─── Pause / Resume ────────────────────────────────────────────────────────────

export function pauseSession(roomCode: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session || session.status !== "LIVE" || session.isPaused) return;

  const question = session.questions[session.currentQuestionIndex];
  if (!question) return;

  // Calculate remaining time
  const totalDurationMs = question.durationSeconds * 1000;
  const elapsed = Date.now() - session.questionStartTimeMs;
  const remaining = Math.max(0, totalDurationMs - elapsed);

  // Clear the running timer
  if (session.questionTimer) {
    clearTimeout(session.questionTimer);
    session.questionTimer = null;
  }

  session.isPaused = true;
  session.pausedRemainingMs = remaining;
}

/**
 * Resume a paused session.
 * Returns a fresh QuestionData with corrected serverStartTime so all clients
 * can reconstruct the accurate countdown without any gaps.
 *
 * The trick: we set questionStartTimeMs to (now - elapsed_already) so that
 * (now - questionStartTimeMs) still equals the time already consumed.
 * elapsed_already = originalDuration - pausedRemainingMs
 */
export function resumeSession(
  roomCode: string,
  onReveal: (roomCode: string) => void
): QuestionData | null {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session || !session.isPaused || session.pausedRemainingMs === null) return null;

  const question = session.questions[session.currentQuestionIndex];
  if (!question) return null;

  const remaining = session.pausedRemainingMs;
  const totalDurationMs = question.durationSeconds * 1000;
  const alreadyElapsed = totalDurationMs - remaining;

  // Back-date the start time so elapsed math remains consistent
  const syntheticStartTime = Date.now() - alreadyElapsed;
  session.questionStartTimeMs = syntheticStartTime;
  session.isPaused = false;
  session.pausedRemainingMs = null;

  // Start a new timer for the remaining duration
  session.questionTimer = setTimeout(() => {
    onReveal(roomCode);
  }, remaining);

  return {
    id: question.id,
    index: session.currentQuestionIndex,
    total: session.questions.length,
    text: question.text,
    options: question.options.map((o: any) => ({ id: o.id, text: o.text, orderIndex: o.orderIndex })),
    durationSeconds: question.durationSeconds,
    serverStartTime: syntheticStartTime,
  };
}

// ─── Restart Same ─────────────────────────────────────────────────────────────

export async function restartSessionSame(roomCode: string): Promise<void> {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session) return;

  // Clear any running timer
  if (session.questionTimer) {
    clearTimeout(session.questionTimer);
    session.questionTimer = null;
  }

  // Reset in-memory scores and clear answers
  for (const participant of session.participants.values()) {
    participant.score = 0;
  }
  session.currentQuestionAnswers.clear();
  session.currentQuestionIndex = -1;
  session.status = "LOBBY";
  session.isPaused = false;
  session.pausedRemainingMs = null;
  session.hasRevealedCurrentQuestion = false;
  session.lastRevealData = undefined;

  // Persist resets to DB: reset all participant scores and session status
  const participantIds = Array.from(session.participants.keys());
  await Promise.all([
    prisma.participant.updateMany({
      where: { id: { in: participantIds } },
      data: { score: 0 },
    }),
    prisma.session.update({
      where: { id: session.sessionId },
      data: { status: "LOBBY" },
    }),
  ]);
}

export function removeSession(roomCode: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    if (session.questionTimer) clearTimeout(session.questionTimer);
    roomCodeBySessionId.delete(session.sessionId);
    sessionsByRoomCode.delete(roomCode);
  }
}

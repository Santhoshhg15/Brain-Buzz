import { PrismaClient } from "@prisma/client";
import { ParticipantData, QuestionData, QuestionRevealPayload } from "@quiz/shared-types";

const prisma = new PrismaClient();

export const DISCONNECT_GRACE_PERIOD_MS = 30000;

export interface SessionParticipant {
  id: string;
  name: string;
  socketId: string;
  score: number;
  connectionStatus: "connected" | "reconnecting";
  disconnectGraceTimer: NodeJS.Timeout | null;
  currentStreak: number;
  longestStreak: number;
  answersCorrect: number;
  answersTotal: number;
  streakBonusApplied?: boolean;
  accuracyBonusApplied?: number;
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
  lastActivityAt: number;
  isRestarting?: boolean;
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

export function touchActivity(roomCode: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    session.lastActivityAt = Date.now();
  }
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
    lastActivityAt: Date.now(),
    isRestarting: false,
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
    session.participants.set(participantId, { 
      id: participantId, 
      name, 
      socketId, 
      score: 0,
      connectionStatus: "connected",
      disconnectGraceTimer: null,
      currentStreak: 0,
      longestStreak: 0,
      answersCorrect: 0,
      answersTotal: 0
    });
    session.lastActivityAt = Date.now();
  }
}

export function findParticipant(roomCode: string, participantId: string): SessionParticipant | undefined {
  return sessionsByRoomCode.get(roomCode)?.participants.get(participantId);
}

export function findParticipantBySocketId(socketId: string): { session: SessionState; participant: SessionParticipant } | null {
  for (const session of sessionsByRoomCode.values()) {
    for (const participant of session.participants.values()) {
      if (participant.socketId === socketId) {
        return { session, participant };
      }
    }
  }
  return null;
}

export function markParticipantDisconnected(roomCode: string, participantId: string): void {
  const participant = sessionsByRoomCode.get(roomCode)?.participants.get(participantId);
  if (participant) {
    participant.connectionStatus = "reconnecting";
  }
}

export function markParticipantReconnected(roomCode: string, participantId: string): void {
  const participant = sessionsByRoomCode.get(roomCode)?.participants.get(participantId);
  if (participant) {
    participant.connectionStatus = "connected";
    if (participant.disconnectGraceTimer) {
      clearTimeout(participant.disconnectGraceTimer);
      participant.disconnectGraceTimer = null;
    }
  }
}

export function removeParticipantPermanently(roomCode: string, participantId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    const participant = session.participants.get(participantId);
    if (participant && participant.disconnectGraceTimer) {
      clearTimeout(participant.disconnectGraceTimer);
    }
    session.participants.delete(participantId);
  }
}

export function updateParticipantSocketId(roomCode: string, participantId: string, newSocketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    const participant = session.participants.get(participantId);
    if (participant) participant.socketId = newSocketId;
    session.lastActivityAt = Date.now();
  }
}

export function updateHostSocketId(roomCode: string, socketId: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (session) {
    session.hostSocketId = socketId;
    session.lastActivityAt = Date.now();
  }
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
    session.lastActivityAt = Date.now();
  }
}

export function calculateScoreForAnswer(
  session: SessionState,
  participantId: string
): { points: number; isCorrect: boolean; currentStreak: number } {
  const answer = session.currentQuestionAnswers.get(participantId);
  const participant = session.participants.get(participantId);
  
  if (!participant) return { points: 0, isCorrect: false, currentStreak: 0 };
  
  if (!answer) {
    participant.currentStreak = 0;
    return { points: 0, isCorrect: false, currentStreak: 0 };
  }
  
  participant.answersTotal++;

  const question = session.questions[session.currentQuestionIndex];
  const option = question.options.find((o: any) => o.id === answer.optionId);
  if (!option || !option.isCorrect) {
    participant.currentStreak = 0;
    return { points: 0, isCorrect: false, currentStreak: 0 };
  }

  participant.answersCorrect++;
  participant.currentStreak++;
  if (participant.currentStreak > participant.longestStreak) {
    participant.longestStreak = participant.currentStreak;
  }

  const basePoints = question.points;
  const accuracyBase = Math.floor(basePoints * 0.70);
  const maxSpeedBonus = basePoints - accuracyBase;

  const totalDurationMs = question.durationSeconds * 1000;
  let remainingTimeMs = totalDurationMs - (answer.answeredAtMs - session.questionStartTimeMs);
  if (remainingTimeMs < 0) remainingTimeMs = 0;
  
  let speedBonus = Math.round(maxSpeedBonus * (remainingTimeMs / totalDurationMs));
  let points = accuracyBase + speedBonus;
  
  let streakMultiplier = 0;
  if (participant.currentStreak >= 7) {
    streakMultiplier = 0.15;
  } else if (participant.currentStreak >= 5) {
    streakMultiplier = 0.10;
  } else if (participant.currentStreak >= 3) {
    streakMultiplier = 0.05;
  }
  
  if (streakMultiplier > 0) {
    points = Math.round(points * (1 + streakMultiplier));
    participant.streakBonusApplied = true;
  }

  return { points, isCorrect: true, currentStreak: participant.currentStreak };
}

export const ACCURACY_BONUS_90 = 500;
export const ACCURACY_BONUS_75 = 250;
export const ACCURACY_BONUS_60 = 100;

export function calculateAccuracyBonus(session: SessionState, participantId: string): number {
  const participant = session.participants.get(participantId);
  if (!participant || participant.answersTotal === 0) return 0;
  
  const accuracy = participant.answersCorrect / participant.answersTotal;
  
  if (accuracy >= 0.90) return ACCURACY_BONUS_90;
  if (accuracy >= 0.75) return ACCURACY_BONUS_75;
  if (accuracy >= 0.60) return ACCURACY_BONUS_60;
  
  return 0;
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
    streakBonusApplied: p.streakBonusApplied,
    accuracyBonusApplied: p.accuracyBonusApplied,
    currentStreak: p.currentStreak
  }));
}

// ─── Pause / Resume ────────────────────────────────────────────────────────────

export function pauseSession(roomCode: string): void {
  const session = sessionsByRoomCode.get(roomCode);
  if (!session || session.status !== "LIVE" || session.isPaused) return;

  const question = session.questions[session.currentQuestionIndex];
  if (!question) return;

  const totalDurationMs = question.durationSeconds * 1000;
  const elapsed = Date.now() - session.questionStartTimeMs;
  const remaining = Math.max(0, totalDurationMs - elapsed);

  if (session.questionTimer) {
    clearTimeout(session.questionTimer);
    session.questionTimer = null;
  }

  session.isPaused = true;
  session.pausedRemainingMs = remaining;
  session.lastActivityAt = Date.now();
}

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

  const syntheticStartTime = Date.now() - alreadyElapsed;
  session.questionStartTimeMs = syntheticStartTime;
  session.isPaused = false;
  session.pausedRemainingMs = null;
  session.lastActivityAt = Date.now();

  session.questionTimer = setTimeout(() => {
    try {
      onReveal(roomCode);
    } catch (err) {
      console.error(`[TIMER ERROR in resumeSession]:`, err);
    }
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

  if (session.questionTimer) {
    clearTimeout(session.questionTimer);
    session.questionTimer = null;
  }

  for (const participant of session.participants.values()) {
    participant.score = 0;
    participant.currentStreak = 0;
    participant.longestStreak = 0;
    participant.answersCorrect = 0;
    participant.answersTotal = 0;
    participant.streakBonusApplied = undefined;
    participant.accuracyBonusApplied = undefined;
  }
  session.currentQuestionAnswers.clear();
  session.currentQuestionIndex = -1;
  session.status = "LOBBY";
  session.isPaused = false;
  session.pausedRemainingMs = null;
  session.hasRevealedCurrentQuestion = false;
  session.lastRevealData = undefined;
  session.lastActivityAt = Date.now();

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

export async function reapAbandonedSessions(): Promise<void> {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const now = Date.now();

  for (const session of Array.from(sessionsByRoomCode.values())) {
    if (session.status === "LOBBY" && now - session.lastActivityAt > TWO_HOURS_MS) {
      console.log(`[ABANDONED SESSION SWEEP] Reaping abandoned LOBBY session: ${session.roomCode} (Session ID: ${session.sessionId})`);
      try {
        await prisma.session.update({
          where: { id: session.sessionId },
          data: { status: "INTERRUPTED" },
        });
      } catch (err) {
        console.error(`[ABANDONED SESSION SWEEP] Failed to update DB status for ${session.roomCode}:`, err);
      }
      removeSession(session.roomCode);
    }
  }
}

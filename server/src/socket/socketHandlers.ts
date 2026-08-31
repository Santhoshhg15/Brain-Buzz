import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  OptionCount,
  RoomRejoinResponse,
  RejoinScreenState,
  HostRejoinResponse,
} from "@quiz/shared-types";
import * as sessionManager from "../session/sessionManager.js";
import { verifyToken } from "../auth/authUtils.js";

const prisma = new PrismaClient();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {

  // ─── Internal helpers ────────────────────────────────────────────────────────

  async function revealCurrentQuestion(roomCode: string) {
    const revealStartMs = performance.now();
    console.log(`[TIMING] revealCurrentQuestion started`);
    const session = sessionManager.getSession(roomCode);
    if (!session || session.status !== "LIVE") return;

    if (session.questionTimer) {
      clearTimeout(session.questionTimer);
      session.questionTimer = null;
    }

    const question = session.questions[session.currentQuestionIndex];
    const correctOption = question.options.find((o: any) => o.isCorrect);
    const correctOptionId = correctOption ? correctOption.id : "";

    const optionCounts: OptionCount = {};
    for (const option of question.options) {
      optionCounts[option.id] = 0;
    }

    const answers = Array.from(session.currentQuestionAnswers.entries());

    const dbStartMs = performance.now();
    
    const dbPromises: Promise<void>[] = [];
    const participantStreaks = new Map<string, number>();

    // First process non-answers to reset streaks correctly before doing db operations
    for (const participant of session.participants.values()) {
      if (!session.currentQuestionAnswers.has(participant.id)) {
        const { currentStreak } = sessionManager.calculateScoreForAnswer(session, participant.id);
        participantStreaks.set(participant.id, currentStreak);
      }
    }
    
    for (const [participantId, answer] of answers) {
      if (optionCounts[answer.optionId] !== undefined) {
        optionCounts[answer.optionId]++;
      } else {
        optionCounts[answer.optionId] = 1;
      }

      const { points, isCorrect, currentStreak } = sessionManager.calculateScoreForAnswer(session, participantId);
      participantStreaks.set(participantId, currentStreak);

      // Update score in memory
      const participant = session.participants.get(participantId);
      if (participant) {
        participant.score += points;

        // ─── PERSIST to DB concurrently ───────────────────────────
        const participantPromise = (async () => {
          try {
            const responseTimeMs = Math.max(0, answer.answeredAtMs - session.questionStartTimeMs);
            
            await Promise.all([
              prisma.participant.update({
                where: { id: participantId },
                data: { score: participant.score },
              }),
              prisma.answer.create({
                data: {
                  participantId,
                  questionId: question.id,
                  optionId: answer.optionId,
                  isCorrect,
                  pointsAwarded: points,
                  responseTimeMs,
                },
              })
            ]);
          } catch (err) {
            console.error(`[DB ERROR] Failed to save answer/score for participant ${participantId}:`, err);
          }
        })();
        
        dbPromises.push(participantPromise);
      }
    }
    
    await Promise.all(dbPromises);
    
    const dbEndMs = performance.now();
    console.log(`[TIMING] Batched database writes for ${answers.length} answers took ${(dbEndMs - dbStartMs).toFixed(2)}ms`);

    console.log(`Question revealed for room ${roomCode}. Correct option: ${correctOptionId}`);

    const baseRevealData = { questionId: question.id, correctOptionId, optionCounts, explanation: question.explanation || undefined };
    session.hasRevealedCurrentQuestion = true;
    session.lastRevealData = baseRevealData;

    const emitStartMs = performance.now();
    if (session.hostSocketId) {
      io.to(session.hostSocketId).emit("question:reveal", baseRevealData);
    }
    for (const participant of session.participants.values()) {
      const streak = participantStreaks.get(participant.id) || 0;
      io.to(participant.socketId).emit("question:reveal", {
        ...baseRevealData,
        currentStreak: streak
      });
    }

    const leaderboard = sessionManager.getLeaderboard(roomCode);
    io.to(roomCode).emit("leaderboard:update", leaderboard);
    
    console.log(`[TIMING] Emitted reveal payloads to clients in ${(performance.now() - emitStartMs).toFixed(2)}ms`);
    console.log(`[TIMING] Total revealCurrentQuestion execution took ${(performance.now() - revealStartMs).toFixed(2)}ms`);

    // Auto-advance after 5 seconds with crash protection
    session.questionTimer = setTimeout(async () => {
      try {
        const currentSession = sessionManager.getSession(roomCode);
        if (!currentSession || currentSession.status === "ENDED" || currentSession.status !== "LIVE") return;

        currentSession.currentQuestionIndex++;
        if (currentSession.currentQuestionIndex >= currentSession.questions.length) {
          const bonusPromises: Promise<void>[] = [];
          for (const participant of currentSession.participants.values()) {
            const bonus = sessionManager.calculateAccuracyBonus(currentSession, participant.id);
            if (bonus > 0) {
              participant.score += bonus;
              participant.accuracyBonusApplied = bonus;
              bonusPromises.push(
                prisma.participant.update({
                  where: { id: participant.id },
                  data: { score: participant.score }
                }).then()
              );
            }
          }
          await Promise.all(bonusPromises);

          currentSession.status = "ENDED";
          await prisma.session.update({
            where: { id: currentSession.sessionId },
            data: { status: "ENDED" },
          });
          io.to(currentSession.roomCode).emit("session:ended", { finalLeaderboard: sessionManager.getLeaderboard(currentSession.roomCode) });
          sessionManager.removeSession(currentSession.roomCode);
          console.log(`Session ${currentSession.roomCode} ended automatically.`);
        } else {
          broadcastCurrentQuestion(currentSession.roomCode);
        }
      } catch (err) {
        console.error(`[TIMER ERROR in revealCurrentQuestion auto-advance]:`, err);
      }
    }, 5000);
  }

  function broadcastCurrentQuestion(roomCode: string) {
    const session = sessionManager.getSession(roomCode);
    if (!session) return;

    const question = session.questions[session.currentQuestionIndex];
    session.currentQuestionAnswers.clear();
    session.questionStartTimeMs = Date.now();
    session.hasRevealedCurrentQuestion = false;
    session.lastRevealData = undefined;

    console.log(`Broadcasting question ${session.currentQuestionIndex + 1} for room ${roomCode}`);

    const questionPayload = {
      id: question.id,
      index: session.currentQuestionIndex,
      total: session.questions.length,
      text: question.text,
      options: question.options.map((o: any) => ({ id: o.id, text: o.text, orderIndex: o.orderIndex })),
      durationSeconds: question.durationSeconds,
      serverStartTime: session.questionStartTimeMs,
    };

    io.to(roomCode).emit("question:broadcast", questionPayload);

    // Expiry timer with crash protection
    session.questionTimer = setTimeout(async () => {
      try {
        await revealCurrentQuestion(roomCode);
      } catch (err) {
        console.error(`[TIMER ERROR in broadcastCurrentQuestion expiry]:`, err);
      }
    }, question.durationSeconds * 1000);
  }

  // ─── Ownership verification helper ──────────────────────────────────────────

  function verifyInstructorOwnsSession(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    sessionId: string
  ): { session: sessionManager.SessionState; instructorId: string } | null {
    const token = socket.handshake.auth?.token;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const session = sessionManager.getSessionById(sessionId);
    if (!session) return null;
    if (session.instructorId !== decoded.instructorId) return null;
    return { session, instructorId: decoded.instructorId };
  }

  // ─── Connection ──────────────────────────────────────────────────────────────

  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);

    let currentParticipantId: string | undefined;
    let currentRoomCode: string | undefined;

    // ─── room:create ──────────────────────────────────────────────────────────
    socket.on("room:create", async (payload, callback) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return callback({ error: "Authentication required" });
        const decoded = verifyToken(token);
        if (!decoded) return callback({ error: "Invalid or expired session" });
        socket.data.instructorId = decoded.instructorId;

        const quiz = await prisma.quiz.findUnique({
          where: { id: payload.quizId },
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { options: { orderBy: { orderIndex: "asc" } } },
            },
          },
        });

        if (!quiz) throw new Error("Quiz not found");

        const roomCode = sessionManager.generateRoomCode();
        const dbSession = await prisma.session.create({
          data: {
            quizId: quiz.id,
            instructorId: decoded.instructorId,
            roomCode,
            status: "LOBBY",
          },
        });

        sessionManager.createSession(dbSession.id, quiz.id, roomCode, quiz.questions, decoded.instructorId, socket.id);
        socket.join(roomCode);

        console.log(`Session created: ${roomCode} (ID: ${dbSession.id})`);
        callback({ sessionId: dbSession.id, roomCode });
      } catch (error: any) {
        console.error(error);
        callback({ error: "Failed to create session" });
      }
    });

    // ─── host:rejoin ──────────────────────────────────────────────────────────
    socket.on("host:rejoin", async (payload, callback) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return callback({ success: false, error: "Authentication required" });
        const decoded = verifyToken(token);
        if (!decoded) return callback({ success: false, error: "Invalid or expired session" });

        const session = sessionManager.getSessionById(payload.sessionId);

        if (!session) {
          const dbSession = await prisma.session.findUnique({ where: { id: payload.sessionId } });
          if (dbSession && !["ENDED", "INTERRUPTED"].includes(dbSession.status)) {
            await prisma.session.update({
              where: { id: payload.sessionId },
              data: { status: "INTERRUPTED" },
            });
          }
          return callback({
            success: false,
            error: "This session's live state was lost (likely a server restart) and can't be resumed. Please end it and start a new one.",
          });
        }

        if (session.instructorId !== decoded.instructorId) {
          return callback({ success: false, error: "You do not own this session." });
        }

        sessionManager.updateHostSocketId(session.roomCode, socket.id);
        socket.join(session.roomCode);

        const dbSession = await prisma.session.findUnique({
          where: { id: session.sessionId },
          include: { quiz: { select: { title: true } } },
        });

        const { answeredCount, totalParticipants } = sessionManager.getAnsweredCount(session.roomCode);

        const response: HostRejoinResponse = {
          success: true,
          roomCode: session.roomCode,
          status: session.status,
          quizTitle: dbSession?.quiz.title,
          participants: Array.from(session.participants.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
          })),
          isPaused: session.isPaused,
          pausedRemainingMs: session.pausedRemainingMs,
          answeredCount,
          totalParticipants,
        };

        if (session.status === "LIVE" || session.status === "PAUSED") {
          response.currentQuestion = sessionManager.getCurrentQuestionForRejoin(session);
          if (session.hasRevealedCurrentQuestion) {
            response.revealData = session.lastRevealData;
            response.leaderboard = sessionManager.getLeaderboard(session.roomCode);
          }
        }

        console.log(`Host rejoined session ${session.roomCode}`);
        callback(response);
      } catch (error: any) {
        console.error(error);
        callback({ success: false, error: "Server error during host rejoin" });
      }
    });

    // ─── room:join ────────────────────────────────────────────────────────────
    socket.on("room:join", async (payload, callback) => {
      try {
        if (typeof payload.studentName !== "string" || payload.studentName.trim() === "") {
          return callback({ error: "Nickname is required" });
        }

        const studentName = payload.studentName.trim();
        if (studentName.length > 50) {
          return callback({ error: "Nickname cannot exceed 50 characters" });
        }

        const session = sessionManager.getSession(payload.roomCode);
        if (!session || session.status !== "LOBBY") {
          return callback({ error: "Session not found or already started" });
        }

        const quiz = await prisma.quiz.findUnique({
          where: { id: session.quizId },
          select: { title: true },
        });

        let participant;
        const joinStartTime = Date.now();
        try {
          participant = await prisma.participant.create({
            data: { sessionId: session.sessionId, name: studentName },
          });
        } catch (dbError) {
          console.error(`[DB ERROR in room:join]`, dbError);
          return callback({ error: "Database error joining session" });
        }
        const joinDuration = Date.now() - joinStartTime;
        if (joinDuration > 1000) {
          console.warn(`[SLOW JOIN] Participant creation took ${joinDuration}ms for room ${payload.roomCode} — possible DB connection pool pressure`);
        }

        sessionManager.addParticipant(payload.roomCode, participant.id, studentName, socket.id);
        socket.join(payload.roomCode);

        currentParticipantId = participant.id;
        currentRoomCode = payload.roomCode;

        console.log(`Participant ${studentName} joined room ${payload.roomCode}`);

        io.to(payload.roomCode).emit("room:participant-joined", sessionManager.getLeaderboard(payload.roomCode));

        callback({
          participantId: participant.id,
          sessionId: session.sessionId,
          quizTitle: quiz?.title || "Quiz",
        });
      } catch (error: any) {
        console.error(error);
        callback({ error: "Server error" });
      }
    });

    // ─── room:rejoin ──────────────────────────────────────────────────────────
    socket.on("room:rejoin", async (payload, callback) => {
      try {
        const session = sessionManager.getSession(payload.roomCode);
        if (!session) {
          return callback({ success: false, error: "This session no longer exists." });
        }

        const participant = sessionManager.findParticipant(payload.roomCode, payload.participantId);
        if (!participant) {
          return callback({ success: false, error: "We couldn't find your spot in this session. Please rejoin with a new name." });
        }

        sessionManager.updateParticipantSocketId(payload.roomCode, payload.participantId, socket.id);
        sessionManager.markParticipantReconnected(payload.roomCode, payload.participantId);
        socket.join(payload.roomCode);

        io.to(payload.roomCode).emit("participant:statusChanged", { participantId: payload.participantId, status: "connected" });

        currentParticipantId = participant.id;
        currentRoomCode = payload.roomCode;

        let screenState: RejoinScreenState = "LOBBY";
        if (session.status === "LOBBY") screenState = "LOBBY";
        else if ((session.status === "LIVE" || session.status === "PAUSED") && !session.hasRevealedCurrentQuestion) screenState = "QUESTION";
        else if ((session.status === "LIVE" || session.status === "PAUSED") && session.hasRevealedCurrentQuestion) screenState = "REVEAL";
        else if (session.status === "ENDED") screenState = "ENDED";

        const quiz = await prisma.quiz.findUnique({
          where: { id: session.quizId },
          select: { title: true },
        });

        const response: RoomRejoinResponse = {
          success: true,
          screenState,
          quizTitle: quiz?.title || "Quiz",
          myScore: participant.score,
        };

        if (screenState === "QUESTION") {
          response.currentQuestion = sessionManager.getCurrentQuestionForRejoin(session);
          response.hasAnsweredCurrentQuestion = sessionManager.hasAnswered(payload.roomCode, payload.participantId);
        } else if (screenState === "REVEAL") {
          const baseReveal = sessionManager.getLastRevealData(payload.roomCode);
          if (baseReveal) {
            response.revealData = { ...baseReveal, currentStreak: participant.currentStreak };
          }
          response.leaderboard = sessionManager.getLeaderboard(payload.roomCode);
        } else if (screenState === "ENDED") {
          response.leaderboard = sessionManager.getLeaderboard(payload.roomCode);
        }

        console.log(`Participant ${participant.name} (${participant.id}) rejoined room ${payload.roomCode}`);
        callback(response);
      } catch (error: any) {
        console.error(error);
        callback({ success: false, error: "Server error while rejoining" });
      }
    });

    // ─── session:start ────────────────────────────────────────────────────────
    socket.on("session:start", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session || session.status !== "LOBBY") return;

      session.status = "LIVE";
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { status: "LIVE" },
      });

      session.currentQuestionIndex = 0;
      if (session.questions.length > 0) {
        broadcastCurrentQuestion(session.roomCode);
      }
    });

    // ─── session:pause ────────────────────────────────────────────────────────
    socket.on("session:pause", async (payload) => {
      const owned = verifyInstructorOwnsSession(socket, payload.sessionId);
      if (!owned) return;
      const { session } = owned;

      // Idempotency guard: ignore duplicate pause triggers
      if (session.isPaused) return;

      sessionManager.pauseSession(session.roomCode);
      await prisma.session.update({
        where: { id: session.sessionId },
        data: { status: "PAUSED" },
      });
      session.status = "PAUSED";

      io.to(session.roomCode).emit("session:paused");
      console.log(`Session ${session.roomCode} paused.`);
    });

    // ─── session:resume ───────────────────────────────────────────────────────
    socket.on("session:resume", async (payload) => {
      const owned = verifyInstructorOwnsSession(socket, payload.sessionId);
      if (!owned) return;
      const { session } = owned;

      // Idempotency guard: ignore duplicate resume triggers
      if (!session.isPaused) return;

      const currentQuestion = sessionManager.resumeSession(session.roomCode, revealCurrentQuestion);
      if (!currentQuestion) return;

      session.status = "LIVE";
      await prisma.session.update({
        where: { id: session.sessionId },
        data: { status: "LIVE" },
      });

      io.to(session.roomCode).emit("session:resumed", { currentQuestion });
      console.log(`Session ${session.roomCode} resumed.`);
    });

    // ─── session:terminate ────────────────────────────────────────────────────
    socket.on("session:terminate", async (payload, callback) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          if (callback) callback({ success: false, error: "Missing authentication token." });
          return;
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          if (callback) callback({ success: false, error: "Invalid or expired token." });
          return;
        }

        let session = sessionManager.getSessionById(payload.sessionId);
        
        if (!session) {
          // Fallback to DB
          const dbSession = await prisma.session.findUnique({ where: { id: payload.sessionId } });
          if (!dbSession) {
            if (callback) callback({ success: false, error: "Session not found." });
            return;
          }
          if (dbSession.instructorId !== decoded.instructorId) {
            if (callback) callback({ success: false, error: "You don't have permission to terminate this session." });
            return;
          }
          if (dbSession.status !== "ENDED" && dbSession.status !== "INTERRUPTED") {
            await prisma.session.update({
              where: { id: payload.sessionId },
              data: { status: "ENDED" },
            });
          }
          if (callback) callback({ success: true });
          return;
        }

        if (session.instructorId !== decoded.instructorId) {
          if (callback) callback({ success: false, error: "You don't have permission to terminate this session." });
          return;
        }

        // Idempotency guard: ignore duplicate terminate triggers
        if (session.status === "ENDED") {
          if (callback) callback({ success: true });
          return;
        }

        await prisma.session.update({
          where: { id: session.sessionId },
          data: { status: "ENDED" },
        });

        session.status = "ENDED";
        io.to(session.roomCode).emit("session:terminated", { finalLeaderboard: sessionManager.getLeaderboard(session.roomCode) });
        sessionManager.removeSession(session.roomCode);
        console.log(`Session ${session.roomCode} terminated by instructor.`);
        
        if (callback) callback({ success: true });
      } catch (err) {
        console.error("Error terminating session:", err);
        if (callback) callback({ success: false, error: "Something went wrong while terminating this session." });
      }
    });

    // ─── session:restartSame ──────────────────────────────────────────────────
    socket.on("session:restartSame", async (payload) => {
      const owned = verifyInstructorOwnsSession(socket, payload.sessionId);
      if (!owned) return;
      const { session } = owned;

      // Idempotency guard: ignore concurrent duplicate restart triggers
      if (session.isRestarting) return;
      session.isRestarting = true;

      try {
        await sessionManager.restartSessionSame(session.roomCode);
        io.to(session.roomCode).emit("session:restarted");
        console.log(`Session ${session.roomCode} restarted (same room).`);
      } catch (err) {
        console.error("Error restarting session:", err);
      } finally {
        session.isRestarting = false;
      }
    });

    // ─── session:end ──────────────────────────────────────────────────────────
    socket.on("session:end", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session) return;

      session.status = "ENDED";
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { status: "ENDED" },
      });

      console.log(`Session ${session.roomCode} ended by host.`);
      io.to(session.roomCode).emit("session:ended", { finalLeaderboard: sessionManager.getLeaderboard(session.roomCode) });
      sessionManager.removeSession(session.roomCode);
    });

    // ─── answer:submit ────────────────────────────────────────────────────────
    socket.on("answer:submit", (payload) => {
      const startMs = performance.now();
      const session = sessionManager.getSessionById(payload.sessionId);
      if (session && session.status === "LIVE") {
        sessionManager.recordAnswer(session.roomCode, payload.participantId, payload.optionId);

        const { answeredCount, totalParticipants } = sessionManager.getAnsweredCount(session.roomCode);
        io.to(session.roomCode).emit("answeredCount:update", { answeredCount, totalParticipants });
      }
      const endMs = performance.now();
      console.log(`[TIMING] 'answer:submit' processed in ${(endMs - startMs).toFixed(2)}ms`);
    });

    // ─── question:next ─────────────────────────────────────────────────────────
    socket.on("question:next", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session || session.status === "ENDED" || session.status !== "LIVE") return;

      // Always clear pending auto-advance timer FIRST to prevent race conditions
      if (session.questionTimer) {
        clearTimeout(session.questionTimer);
        session.questionTimer = null;
      }

      // If the question hasn't been revealed yet, just reveal it
      if (!session.hasRevealedCurrentQuestion) {
        await revealCurrentQuestion(session.roomCode);
        return; // Don't advance to the next question yet!
      }

      session.currentQuestionIndex++;
      if (session.currentQuestionIndex >= session.questions.length) {
        const bonusPromises: Promise<void>[] = [];
        for (const participant of session.participants.values()) {
          const bonus = sessionManager.calculateAccuracyBonus(session, participant.id);
          if (bonus > 0) {
            participant.score += bonus;
            participant.accuracyBonusApplied = bonus;
            bonusPromises.push(
              prisma.participant.update({
                where: { id: participant.id },
                data: { score: participant.score }
              }).then()
            );
          }
        }
        await Promise.all(bonusPromises);

        session.status = "ENDED";
        await prisma.session.update({
          where: { id: payload.sessionId },
          data: { status: "ENDED" },
        });
        io.to(session.roomCode).emit("session:ended", { finalLeaderboard: sessionManager.getLeaderboard(session.roomCode) });
        sessionManager.removeSession(session.roomCode);
        console.log(`Session ${session.roomCode} ended automatically.`);
      } else {
        broadcastCurrentQuestion(session.roomCode);
      }
    });

    // ─── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const match = sessionManager.findParticipantBySocketId(socket.id);
      
      if (match) {
        const { session, participant } = match;
        console.log(`Participant ${participant.name} (${participant.id}) disconnected. Starting grace period...`);
        
        sessionManager.markParticipantDisconnected(session.roomCode, participant.id);
        io.to(session.roomCode).emit("participant:statusChanged", { participantId: participant.id, status: "reconnecting" });

        participant.disconnectGraceTimer = setTimeout(() => {
          if (participant.connectionStatus === "reconnecting") {
            console.log(`Participant ${participant.name} grace period expired. Removing permanently.`);
            sessionManager.removeParticipantPermanently(session.roomCode, participant.id);
            io.to(session.roomCode).emit("participant:statusChanged", { participantId: participant.id, status: "left" });
            io.to(session.roomCode).emit("room:participant-joined", sessionManager.getLeaderboard(session.roomCode));
          }
        }, sessionManager.DISCONNECT_GRACE_PERIOD_MS);
      } else {
        if (currentParticipantId && currentRoomCode) {
          console.log(`Socket disconnected: ${socket.id} (Participant: ${currentParticipantId}, Room: ${currentRoomCode})`);
        } else {
          console.log(`Socket disconnected: ${socket.id}`);
        }
      }
    });
  });
}

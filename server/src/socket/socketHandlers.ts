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

    for (const [participantId, answer] of answers) {
      if (optionCounts[answer.optionId] !== undefined) {
        optionCounts[answer.optionId]++;
      } else {
        optionCounts[answer.optionId] = 1;
      }

      const { points, isCorrect } = sessionManager.calculateScoreForAnswer(session, participantId);

      // Update score in memory
      const participant = session.participants.get(participantId);
      if (participant) {
        participant.score += points;

        // ─── PERSIST score to DB on every reveal ───────────────────────────
        await prisma.participant.update({
          where: { id: participantId },
          data: { score: participant.score },
        });
      }

      // Save answer to DB
      await prisma.answer.create({
        data: {
          participantId,
          questionId: question.id,
          optionId: answer.optionId,
          isCorrect,
          pointsAwarded: points,
        },
      });
    }

    console.log(`Question revealed for room ${roomCode}. Correct option: ${correctOptionId}`);

    const revealData = { questionId: question.id, correctOptionId, optionCounts };
    session.hasRevealedCurrentQuestion = true;
    session.lastRevealData = revealData;

    io.to(roomCode).emit("question:reveal", revealData);

    const leaderboard = sessionManager.getLeaderboard(roomCode);
    io.to(roomCode).emit("leaderboard:update", leaderboard);

    // Auto-advance after 5 seconds
    setTimeout(async () => {
      const currentSession = sessionManager.getSession(roomCode);
      if (!currentSession || currentSession.status !== "LIVE") return;

      currentSession.currentQuestionIndex++;
      if (currentSession.currentQuestionIndex < currentSession.questions.length) {
        broadcastCurrentQuestion(currentSession.roomCode);
      } else {
        currentSession.status = "ENDED";
        await prisma.session.update({
          where: { id: currentSession.sessionId },
          data: { status: "ENDED" },
        });
        io.to(currentSession.roomCode).emit("session:ended", sessionManager.getLeaderboard(currentSession.roomCode));
        sessionManager.removeSession(currentSession.roomCode);
        console.log(`Session ${currentSession.roomCode} ended automatically.`);
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

    session.questionTimer = setTimeout(() => {
      revealCurrentQuestion(roomCode);
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

        // Check in-memory first
        const session = sessionManager.getSessionById(payload.sessionId);

        if (!session) {
          // Session lost from memory — mark DB row as INTERRUPTED if not already ENDED
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

        // Ownership check
        if (session.instructorId !== decoded.instructorId) {
          return callback({ success: false, error: "You do not own this session." });
        }

        // Bind this connection as the host
        sessionManager.updateHostSocketId(session.roomCode, socket.id);
        socket.join(session.roomCode);

        // Fetch quiz title
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
        const session = sessionManager.getSession(payload.roomCode);
        if (!session || session.status !== "LOBBY") {
          return callback({ error: "Session not found or already started" });
        }

        const quiz = await prisma.quiz.findUnique({
          where: { id: session.quizId },
          select: { title: true },
        });

        const participant = await prisma.participant.create({
          data: { sessionId: session.sessionId, name: payload.studentName },
        });

        sessionManager.addParticipant(payload.roomCode, participant.id, payload.studentName, socket.id);
        socket.join(payload.roomCode);

        currentParticipantId = participant.id;
        currentRoomCode = payload.roomCode;

        console.log(`Participant ${payload.studentName} joined room ${payload.roomCode}`);

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
        socket.join(payload.roomCode);

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
          response.revealData = sessionManager.getLastRevealData(payload.roomCode);
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
    socket.on("session:terminate", async (payload) => {
      const owned = verifyInstructorOwnsSession(socket, payload.sessionId);
      if (!owned) return;
      const { session } = owned;

      await prisma.session.update({
        where: { id: session.sessionId },
        data: { status: "ENDED" },
      });

      io.to(session.roomCode).emit("session:terminated");
      sessionManager.removeSession(session.roomCode);
      console.log(`Session ${session.roomCode} terminated by instructor.`);
    });

    // ─── session:restartSame ──────────────────────────────────────────────────
    socket.on("session:restartSame", async (payload) => {
      const owned = verifyInstructorOwnsSession(socket, payload.sessionId);
      if (!owned) return;
      const { session } = owned;

      await sessionManager.restartSessionSame(session.roomCode);
      io.to(session.roomCode).emit("session:restarted");
      console.log(`Session ${session.roomCode} restarted (same room).`);
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
      io.to(session.roomCode).emit("session:ended", sessionManager.getLeaderboard(session.roomCode));
      sessionManager.removeSession(session.roomCode);
    });

    // ─── answer:submit ────────────────────────────────────────────────────────
    socket.on("answer:submit", (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (session && session.status === "LIVE") {
        sessionManager.recordAnswer(session.roomCode, payload.participantId, payload.optionId);

        // Broadcast live answered count to everyone (host uses this)
        const { answeredCount, totalParticipants } = sessionManager.getAnsweredCount(session.roomCode);
        io.to(session.roomCode).emit("answeredCount:update", { answeredCount, totalParticipants });
      }
    });

    // ─── question:next ─────────────────────────────────────────────────────────
    socket.on("question:next", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session || session.status !== "LIVE") return;

      if (session.questionTimer) {
        await revealCurrentQuestion(session.roomCode);
      }

      session.currentQuestionIndex++;
      if (session.currentQuestionIndex < session.questions.length) {
        broadcastCurrentQuestion(session.roomCode);
      } else {
        session.status = "ENDED";
        await prisma.session.update({
          where: { id: payload.sessionId },
          data: { status: "ENDED" },
        });
        io.to(session.roomCode).emit("session:ended", sessionManager.getLeaderboard(session.roomCode));
        sessionManager.removeSession(session.roomCode);
        console.log(`Session ${session.roomCode} ended automatically.`);
      }
    });

    // ─── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (currentParticipantId && currentRoomCode) {
        console.log(`Socket disconnected: ${socket.id} (Participant: ${currentParticipantId}, Room: ${currentRoomCode})`);
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });
  });
}

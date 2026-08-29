import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { ClientToServerEvents, ServerToClientEvents, OptionCount, RoomRejoinResponse, RejoinScreenState } from "@quiz/shared-types";
import * as sessionManager from "../session/sessionManager";
import { verifyToken } from "../auth/authUtils";

const prisma = new PrismaClient();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  
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
      }

      // Save to DB
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

    const revealData = {
      questionId: question.id,
      correctOptionId,
      optionCounts,
    };

    // Store for rejoining clients
    session.hasRevealedCurrentQuestion = true;
    session.lastRevealData = revealData;

    io.to(roomCode).emit("question:reveal", revealData);

    // Send updated leaderboard
    const leaderboard = sessionManager.getLeaderboard(roomCode);
    io.to(roomCode).emit("leaderboard:update", leaderboard);

    // Automatically advance to next question after 5 seconds
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
          data: { status: "ENDED" }
        });
        io.to(currentSession.roomCode).emit("session:ended", sessionManager.getLeaderboard(currentSession.roomCode));
        sessionManager.removeSession(currentSession.roomCode);
        console.log(`Session ${currentSession.roomCode} ended automatically.`);
      }
    }, 5000);
  }

  // Internal helper to broadcast a question
  function broadcastCurrentQuestion(roomCode: string) {
    const session = sessionManager.getSession(roomCode);
    if (!session) return;

    const question = session.questions[session.currentQuestionIndex];
    session.currentQuestionAnswers.clear();
    session.questionStartTimeMs = Date.now();
    session.hasRevealedCurrentQuestion = false; // Reset for new question
    session.lastRevealData = undefined;

    console.log(`Broadcasting question ${session.currentQuestionIndex + 1} for room ${roomCode}`);

    io.to(roomCode).emit("question:broadcast", {
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
    });

    session.questionTimer = setTimeout(() => {
      revealCurrentQuestion(roomCode);
    }, question.durationSeconds * 1000);
  }

  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Tracking for disconnect logs
    let currentParticipantId: string | undefined;
    let currentRoomCode: string | undefined;

    socket.on("room:create", async (payload, callback) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return callback({ error: "Authentication required" });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
          return callback({ error: "Invalid or expired session" });
        }
        socket.data.instructorId = decoded.instructorId;

        const quiz = await prisma.quiz.findUnique({
          where: { id: payload.quizId },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        });

        if (!quiz) {
          throw new Error("Quiz not found");
        }

        const roomCode = sessionManager.generateRoomCode();
        const dbSession = await prisma.session.create({
          data: {
            quizId: quiz.id,
            roomCode,
            status: "LOBBY",
          }
        });

        sessionManager.createSession(dbSession.id, quiz.id, roomCode, quiz.questions);
        
        socket.join(roomCode);
        console.log(`Session created: ${roomCode} (ID: ${dbSession.id})`);
        
        callback({ sessionId: dbSession.id, roomCode });
      } catch (error: any) {
        console.error(error);
      }
    });

    socket.on("room:join", async (payload, callback) => {
      try {
        const session = sessionManager.getSession(payload.roomCode);
        if (!session || session.status !== "LOBBY") {
          return callback({ error: "Session not found or already started" });
        }

        const quiz = await prisma.quiz.findUnique({
          where: { id: session.quizId },
          select: { title: true }
        });

        const participant = await prisma.participant.create({
          data: {
            sessionId: session.sessionId,
            name: payload.studentName,
          }
        });

        sessionManager.addParticipant(payload.roomCode, participant.id, payload.studentName, socket.id);
        socket.join(payload.roomCode);

        currentParticipantId = participant.id;
        currentRoomCode = payload.roomCode;

        console.log(`Participant ${payload.studentName} joined room ${payload.roomCode}`);

        io.to(payload.roomCode).emit(
          "room:participant-joined", 
          sessionManager.getLeaderboard(payload.roomCode)
        );

        callback({ 
          participantId: participant.id, 
          sessionId: session.sessionId, 
          quizTitle: quiz?.title || "Quiz"
        });
      } catch (error: any) {
        console.error(error);
        callback({ error: "Server error" });
      }
    });

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
        
        if (session.status === "LOBBY") {
          screenState = "LOBBY";
        } else if (session.status === "LIVE" && !session.hasRevealedCurrentQuestion) {
          screenState = "QUESTION";
        } else if (session.status === "LIVE" && session.hasRevealedCurrentQuestion) {
          screenState = "REVEAL";
        } else if (session.status === "ENDED") {
          screenState = "ENDED";
        }

        const quiz = await prisma.quiz.findUnique({
          where: { id: session.quizId },
          select: { title: true }
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

    socket.on("session:start", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session || session.status !== "LOBBY") return;

      session.status = "LIVE";
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { status: "LIVE" }
      });

      session.currentQuestionIndex = 0;
      if (session.questions.length > 0) {
        broadcastCurrentQuestion(session.roomCode);
      }
    });

    socket.on("answer:submit", (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (session && session.status === "LIVE") {
        sessionManager.recordAnswer(session.roomCode, payload.participantId, payload.optionId);
      }
    });

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
          data: { status: "ENDED" }
        });
        
        io.to(session.roomCode).emit("session:ended", sessionManager.getLeaderboard(session.roomCode));
        sessionManager.removeSession(session.roomCode);
        console.log(`Session ${session.roomCode} ended automatically.`);
      }
    });

    socket.on("session:end", async (payload) => {
      const session = sessionManager.getSessionById(payload.sessionId);
      if (!session) return;

      session.status = "ENDED";
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { status: "ENDED" }
      });

      console.log(`Session ${session.roomCode} ended by host.`);
      io.to(session.roomCode).emit("session:ended", sessionManager.getLeaderboard(session.roomCode));
      sessionManager.removeSession(session.roomCode);
    });

    socket.on("disconnect", () => {
      if (currentParticipantId && currentRoomCode) {
        console.log(`Socket disconnected: ${socket.id} (Participant: ${currentParticipantId}, Room: ${currentRoomCode})`);
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });
  });
}

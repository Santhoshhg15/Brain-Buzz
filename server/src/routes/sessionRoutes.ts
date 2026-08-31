import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware.js";
import { SessionSummary } from "@quiz/shared-types";

const router = Router();

// All routes under /api/sessions require authentication

/**
 * GET /api/sessions/active
 * List all LOBBY, LIVE, or PAUSED sessions owned by the authenticated instructor.
 */
router.get("/active", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = (req as AuthenticatedRequest).instructor?.instructorId;
    if (!instructorId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const sessions = await prisma.session.findMany({
      where: {
        instructorId,
        status: { in: ["LOBBY", "LIVE", "PAUSED"] },
      },
      include: {
        quiz: { select: { title: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: SessionSummary[] = sessions.map(s => ({
      sessionId: s.id,
      roomCode: s.roomCode,
      quizTitle: s.quiz.title,
      status: s.status as SessionSummary["status"],
      participantCount: s._count.participants,
      createdAt: s.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sessions/completed
 * List all ENDED or INTERRUPTED sessions owned by the authenticated instructor.
 */
router.get("/completed", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = (req as AuthenticatedRequest).instructor?.instructorId;
    if (!instructorId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const sessions = await prisma.session.findMany({
      where: {
        instructorId,
        status: { in: ["ENDED", "INTERRUPTED"] },
      },
      include: {
        quiz: { select: { title: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: SessionSummary[] = sessions.map(s => ({
      sessionId: s.id,
      roomCode: s.roomCode,
      quizTitle: s.quiz.title,
      status: s.status as SessionSummary["status"],
      participantCount: s._count.participants,
      createdAt: s.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching completed sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sessions/:sessionId/scores
 * Return the final leaderboard (participants + scores) for a completed session.
 */
router.get("/:sessionId/scores", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = (req as AuthenticatedRequest).instructor?.instructorId;
    if (!instructorId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: {
        quiz: { select: { title: true } },
        participants: {
          orderBy: { score: "desc" },
        },
      },
    });

    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    if (session.instructorId !== instructorId) { res.status(403).json({ error: "Forbidden" }); return; }

    const leaderboard = session.participants.map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      score: p.score,
    }));

    res.json({
      sessionId: session.id,
      roomCode: session.roomCode,
      quizTitle: session.quiz.title,
      status: session.status,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching session scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sessions/:sessionId/participants/:participantId/report
 * Return full performance metrics for a specific participant in a session.
 * Does not require authentication (student-facing).
 */
router.get("/:sessionId/participants/:participantId/report", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, participantId } = req.params;

    // 1. Verify participant exists and belongs to this session
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, sessionId },
      include: {
        answers: {
          include: { question: true }
        }
      }
    });

    if (!participant) {
      res.status(404).json({ error: "Participant not found in this session" });
      return;
    }

    // 2. Fetch session and all participants for leaderboard/totals
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            _count: { select: { questions: true } }
          }
        },
        participants: {
          select: { id: true, score: true },
          orderBy: { score: "desc" }
        }
      }
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const totalQuestions = session.quiz._count.questions;
    const answeredCount = participant.answers.length;
    const unansweredCount = Math.max(0, totalQuestions - answeredCount);
    
    let correctCount = 0;
    let wrongCount = 0;
    
    let minMs: number | null = null;
    let maxMs: number | null = null;
    let totalMs = 0;
    let countWithMs = 0;

    const perQuestionBreakdown = participant.answers.map(ans => {
      if (ans.isCorrect) correctCount++;
      else wrongCount++;

      if (ans.responseTimeMs !== null) {
        if (minMs === null || ans.responseTimeMs < minMs) minMs = ans.responseTimeMs;
        if (maxMs === null || ans.responseTimeMs > maxMs) maxMs = ans.responseTimeMs;
        totalMs += ans.responseTimeMs;
        countWithMs++;
      }

      return {
        questionText: ans.question?.text || "Unknown Question",
        isCorrect: ans.isCorrect,
        responseTimeMs: ans.responseTimeMs,
        pointsAwarded: ans.pointsAwarded
      };
    });

    const accuracyPercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 1000) / 10 : 0;
    
    const avgMs = countWithMs > 0 ? Math.round(totalMs / countWithMs) : null;
    
    const finalRank = session.participants.findIndex(p => p.id === participantId) + 1;

    res.json({
      totalQuestions,
      answeredCount,
      unansweredCount,
      correctCount,
      wrongCount,
      accuracyPercent,
      finalScore: participant.score,
      finalRank,
      totalParticipants: session.participants.length,
      responseTimeStats: countWithMs > 0 ? {
        minMs,
        maxMs,
        avgMs,
        totalMs
      } : null,
      perQuestionBreakdown
    });
  } catch (error) {
    console.error("Error fetching participant report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

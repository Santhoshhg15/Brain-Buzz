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

export default router;

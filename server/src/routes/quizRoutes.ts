import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { createId } from "@paralleldrive/cuid2";
import { requireAuth } from "../auth/authMiddleware.js";

function handleError(res: Response, contextMessage: string, error: any) {
  console.error(contextMessage, error);
  if (error && typeof error === 'object') {
    if (error.code) console.error("Prisma Error Code:", error.code);
    if (error.meta) console.error("Prisma Error Meta:", error.meta);
    if (error.stack) console.error("Stack:", error.stack);
  }
  
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    error: "Internal server error",
    ...(isDev && { detail: error instanceof Error ? error.message : String(error) }),
  });
}

const router = Router();

// 1. GET /api/quizzes (Existing)
router.get("/quizzes", async (req: Request, res: Response): Promise<void> => {
  try {
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    const formattedQuizzes = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      createdAt: q.createdAt,
      questionCount: q._count.questions
    }));

    res.json(formattedQuizzes);
  } catch (error) {
    handleError(res, "Error fetching quizzes:", error);
  }
});

// 1 & 9. GET /api/quizzes/:id (and /api/quizzes/:id/export)
const getQuizFullHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
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
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    res.json(quiz);
  } catch (error) {
    handleError(res, "Error fetching full quiz:", error);
  }
};

router.get("/quizzes/:id", getQuizFullHandler);
router.get("/quizzes/:id/export", getQuizFullHandler);

// 2. POST /api/quizzes
router.post("/quizzes", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    
    if (typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim()
      }
    });

    res.json(quiz);
  } catch (error) {
    handleError(res, "Error creating quiz:", error);
  }
});

// 3. PATCH /api/quizzes/:id
router.patch("/quizzes/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }

    const quizExists = await prisma.quiz.findUnique({ where: { id } });
    if (!quizExists) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: { title: title.trim() }
    });

    res.json(updatedQuiz);
  } catch (error) {
    handleError(res, "Error updating quiz:", error);
  }
});

// 4. DELETE /api/quizzes/:id
router.delete("/quizzes/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        sessions: true,
        questions: true
      }
    });

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const activeSessions = quiz.sessions.filter(s => s.status === 'LOBBY' || s.status === 'LIVE');
    if (activeSessions.length > 0) {
      res.status(409).json({ error: "Cannot delete a quiz with an active session in progress" });
      return;
    }

    const endedSessionIds = quiz.sessions.map(s => s.id);
    const questionIds = quiz.questions.map(q => q.id);

    await prisma.$transaction(async (tx) => {
      // Clean up ENDED sessions data in correct order
      if (endedSessionIds.length > 0) {
        // Find all participants for these sessions
        const participants = await tx.participant.findMany({
          where: { sessionId: { in: endedSessionIds } },
          select: { id: true }
        });
        const participantIds = participants.map(p => p.id);
        
        // Delete answers
        await tx.answer.deleteMany({
          where: { participantId: { in: participantIds } }
        });
        
        // Delete participants
        await tx.participant.deleteMany({
          where: { sessionId: { in: endedSessionIds } }
        });

        // Delete sessions
        await tx.session.deleteMany({
          where: { id: { in: endedSessionIds } }
        });
      }

      // Clean up questions and options
      if (questionIds.length > 0) {
        // Any answers referencing these questions are deleted already by deleting participants,
        // but just to be absolutely safe (if answers were orphaned somehow)
        await tx.answer.deleteMany({
          where: { questionId: { in: questionIds } }
        });
        
        await tx.option.deleteMany({
          where: { questionId: { in: questionIds } }
        });
        await tx.question.deleteMany({
          where: { quizId: id }
        });
      }

      await tx.quiz.delete({
        where: { id }
      });
    });

    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    handleError(res, "Error deleting quiz:", error);
  }
});

// 5. POST /api/quizzes/:id/questions
router.post("/quizzes/:id/questions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, durationSeconds, points, options } = req.body;

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ error: "Text must be a non-empty string" });
      return;
    }
    if (!Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 120) {
      res.status(400).json({ error: "durationSeconds must be a positive integer between 5 and 120" });
      return;
    }
    if (!Number.isInteger(points) || points <= 0) {
      res.status(400).json({ error: "points must be a positive integer" });
      return;
    }
    if (!Array.isArray(options) || options.length !== 4) {
      res.status(400).json({ error: "options must be an array of exactly 4 items" });
      return;
    }

    let correctCount = 0;
    for (const opt of options) {
      if (typeof opt.text !== 'string' || opt.text.trim() === '') {
        res.status(400).json({ error: "Every option must have non-empty text" });
        return;
      }
      if (opt.isCorrect === true) {
        correctCount++;
      }
    }
    if (correctCount !== 1) {
      res.status(400).json({ error: "Exactly ONE option must have isCorrect: true" });
      return;
    }

    const createdQuestion = await prisma.$transaction(async (tx) => {
      const existingQuestions = await tx.question.findMany({
        where: { quizId: id },
        orderBy: { orderIndex: 'desc' },
        take: 1
      });
      
      const newOrderIndex = existingQuestions.length > 0 ? existingQuestions[0].orderIndex + 1 : 0;

      return await tx.question.create({
        data: {
          quizId: id,
          text: text.trim(),
          durationSeconds,
          points,
          orderIndex: newOrderIndex,
          options: {
            create: options.map((opt, idx) => ({
              text: opt.text.trim(),
              isCorrect: !!opt.isCorrect,
              orderIndex: idx
            }))
          }
        },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    });

    res.json(createdQuestion);
  } catch (error) {
    handleError(res, "Error creating question:", error);
  }
});

// 5.5 POST /api/quizzes/:id/questions/bulk
router.post("/quizzes/:id/questions/bulk", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    const payloadSize = JSON.stringify(req.body).length;
    console.log(`[Bulk Import] Received ${questions?.length || 0} questions. Payload size: ${payloadSize} bytes`);

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "Request body must contain a non-empty 'questions' array" });
      return;
    }

    const validationErrors: Array<{ index: number, questionText: string, errors: string[] }> = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const errors: string[] = [];
      const qText = typeof q.text === 'string' && q.text.trim() !== '' ? q.text.trim() : "(empty)";

      if (typeof q.text !== 'string' || q.text.trim() === '') {
        errors.push("Text must be a non-empty string");
      }
      if (!Number.isInteger(q.durationSeconds) || q.durationSeconds < 5 || q.durationSeconds > 120) {
        errors.push("durationSeconds must be a positive integer between 5 and 120");
      }
      if (!Number.isInteger(q.points) || q.points <= 0) {
        errors.push("points must be a positive integer");
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push("options must be an array of exactly 4 items");
      } else {
        let correctCount = 0;
        let hasEmptyOption = false;
        for (const opt of q.options) {
          if (typeof opt.text !== 'string' || opt.text.trim() === '') {
            hasEmptyOption = true;
          }
          if (opt.isCorrect === true) {
            correctCount++;
          }
        }
        if (hasEmptyOption) {
          errors.push("Every option must have non-empty text");
        }
        if (correctCount !== 1) {
          errors.push("Exactly ONE option must have isCorrect: true");
        }
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          questionText: qText,
          errors
        });
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
      return;
    }

    const createdQuestions = await prisma.$transaction(async (tx) => {
      const existingQuestions = await tx.question.findMany({
        where: { quizId: id },
        orderBy: { orderIndex: 'desc' },
        take: 1
      });
      
      let nextOrderIndex = existingQuestions.length > 0 ? existingQuestions[0].orderIndex + 1 : 0;
      
      const questionRows: any[] = [];
      const optionRows: any[] = [];

      for (const q of questions) {
        const questionId = createId();
        questionRows.push({
          id: questionId,
          quizId: id,
          text: q.text.trim(),
          durationSeconds: q.durationSeconds,
          points: q.points,
          orderIndex: nextOrderIndex,
        });

        q.options.forEach((opt: any, idx: number) => {
          optionRows.push({
            id: createId(),
            questionId,
            text: opt.text.trim(),
            isCorrect: !!opt.isCorrect,
            orderIndex: idx
          });
        });

        nextOrderIndex++;
      }

      await tx.question.createMany({ data: questionRows });
      await tx.option.createMany({ data: optionRows });

      const inserted = await tx.question.findMany({
        where: { id: { in: questionRows.map(q => q.id) } },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { orderIndex: 'asc' }
      });

      return inserted;
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.status(201).json({ created: createdQuestions.length, questions: createdQuestions });
  } catch (error) {
    handleError(res, "Error creating questions in bulk:", error);
  }
});

// 6. PATCH /api/questions/:id
router.patch("/questions/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, durationSeconds, points } = req.body;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const updateData: any = {};
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: "Text must be a non-empty string" });
        return;
      }
      updateData.text = text.trim();
    }
    if (durationSeconds !== undefined) {
      if (!Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 120) {
        res.status(400).json({ error: "durationSeconds must be a positive integer between 5 and 120" });
        return;
      }
      updateData.durationSeconds = durationSeconds;
    }
    if (points !== undefined) {
      if (!Number.isInteger(points) || points <= 0) {
        res.status(400).json({ error: "points must be a positive integer" });
        return;
      }
      updateData.points = points;
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData
    });

    res.json(updatedQuestion);
  } catch (error) {
    handleError(res, "Error updating question:", error);
  }
});

// 7. DELETE /api/questions/:id
router.delete("/questions/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    
    const quizId = question.quizId;

    await prisma.$transaction(async (tx) => {
      // Clean up answers referencing this question first
      await tx.answer.deleteMany({
        where: { questionId: id }
      });

      // Delete options
      await tx.option.deleteMany({
        where: { questionId: id }
      });

      // Delete question
      await tx.question.delete({
        where: { id }
      });

      // Reindex remaining questions in this quiz
      const remainingQuestions = await tx.question.findMany({
        where: { quizId },
        orderBy: { orderIndex: 'asc' }
      });

      for (let i = 0; i < remainingQuestions.length; i++) {
        if (remainingQuestions[i].orderIndex !== i) {
          await tx.question.update({
            where: { id: remainingQuestions[i].id },
            data: { orderIndex: i }
          });
        }
      }
    });

    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    handleError(res, "Error deleting question:", error);
  }
});

// 8. PATCH /api/options/:id
router.patch("/options/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text, isCorrect } = req.body;

    const option = await prisma.option.findUnique({ where: { id } });
    if (!option) {
      res.status(404).json({ error: "Option not found" });
      return;
    }

    if (text !== undefined && (typeof text !== 'string' || text.trim() === '')) {
      res.status(400).json({ error: "Text must be a non-empty string" });
      return;
    }

    const updatedOption = await prisma.$transaction(async (tx) => {
      if (isCorrect === true) {
        // Set all other options for this question to false
        await tx.option.updateMany({
          where: {
            questionId: option.questionId,
            id: { not: id }
          },
          data: { isCorrect: false }
        });
      }

      const dataToUpdate: any = {};
      if (text !== undefined) dataToUpdate.text = text.trim();
      if (isCorrect !== undefined) dataToUpdate.isCorrect = isCorrect;

      return await tx.option.update({
        where: { id },
        data: dataToUpdate
      });
    });

    res.json(updatedOption);
  } catch (error) {
    handleError(res, "Error updating option:", error);
  }
});

export default router;

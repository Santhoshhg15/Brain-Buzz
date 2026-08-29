import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { comparePassword, generateToken } from "../auth/authUtils";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const instructor = await prisma.instructor.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!instructor) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await comparePassword(password, instructor.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(instructor.id, instructor.email);
    res.json({
      token,
      name: instructor.name,
      email: instructor.email
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = (req as AuthenticatedRequest).instructor?.instructorId;
    if (!instructorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { email: true, name: true }
    });

    if (!instructor) {
      res.status(404).json({ error: "Instructor not found" });
      return;
    }

    res.json(instructor);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./authUtils";

export interface AuthenticatedRequest extends Request {
  instructor?: {
    instructorId: string;
    email: string;
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired session, please log in again" });
    return;
  }

  // Attach decoded info to req
  (req as AuthenticatedRequest).instructor = {
    instructorId: decoded.instructorId,
    email: decoded.email
  };

  next();
}

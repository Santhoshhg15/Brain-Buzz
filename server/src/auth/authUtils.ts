import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, 10);
}

export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}

export function generateToken(instructorId: string, email: string): string {
  return jwt.sign({ instructorId, email }, JWT_SECRET, { expiresIn: "7d" });
}

export interface DecodedToken {
  instructorId: string;
  email: string;
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

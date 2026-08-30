import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "@quiz/shared-types";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import * as sessionManager from "./session/sessionManager.js";

// ─── 1. GLOBAL CRASH SAFETY NET ──────────────────────────────────────────────

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION] Server did not crash, but this needs investigation:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION] Server did not crash, but this needs investigation:", reason);
});

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl/Postman) during development
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));
app.use(express.json({ limit: "10mb" }));

// ─── 6. HEALTH CHECK ENDPOINT ────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

// ─── 2. ABANDONED SESSION CLEANUP SWEEP ──────────────────────────────────────

setInterval(() => {
  sessionManager.reapAbandonedSessions();
}, 30 * 60 * 1000);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

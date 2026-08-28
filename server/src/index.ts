import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "@quiz/shared-types";
import quizRoutes from "./routes/quizRoutes";
import { registerSocketHandlers } from "./socket/socketHandlers";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", quizRoutes);

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

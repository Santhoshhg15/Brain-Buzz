import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, QuestionData } from "@quiz/shared-types";
import prisma from "../prisma";

const SERVER_URL = "http://localhost:4000";

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("[SERVER-STATE] Starting smoke test...");

  // Fetch the quiz
  const quiz = await prisma.quiz.findFirst({
    where: { title: "Java Basics Demo" }
  });

  if (!quiz) {
    console.error("[SERVER-STATE] Error: Quiz 'Java Basics Demo' not found in database.");
    process.exit(1);
  }
  
  console.log(`[SERVER-STATE] Found quiz: ${quiz.title} (${quiz.id})`);

  let hostSessionId = "";
  let hostRoomCode = "";
  let joinedCount = 0;

  type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

  const hostSocket: AppSocket = io(SERVER_URL);
  const aliceSocket: AppSocket = io(SERVER_URL);
  const bobSocket: AppSocket = io(SERVER_URL);

  let aliceParticipantId = "";
  let bobParticipantId = "";

  function setupStudent(socket: AppSocket, name: string) {
    socket.on("question:broadcast", async (payload: QuestionData) => {
      console.log(`[${name.toUpperCase()}] Received question ${payload.index + 1}/${payload.total}: "${payload.text}" (Duration: ${payload.durationSeconds}s)`);
      
      const waitTime = Math.floor(Math.random() * 1500) + 500; // 500ms - 2000ms
      await delay(waitTime);

      const randomOption = payload.options[Math.floor(Math.random() * payload.options.length)];
      console.log(`[${name.toUpperCase()}] Submitting answer "${randomOption.text}"`);

      socket.emit("answer:submit", {
        sessionId: hostSessionId,
        participantId: name === "Alice" ? aliceParticipantId : bobParticipantId,
        questionId: payload.id,
        optionId: randomOption.id
      });
    });

    socket.on("question:reveal", (payload) => {
      console.log(`[${name.toUpperCase()}] Question revealed! Correct Option ID: ${payload.correctOptionId}. Option Counts:`, payload.optionCounts);
    });

    socket.on("leaderboard:update", (payload) => {
      console.log(`[${name.toUpperCase()}] Leaderboard updated. Standings:`, payload);
    });

    socket.on("session:ended", (payload) => {
      console.log(`[${name.toUpperCase()}] Session ended! Final standings:`, payload);
      socket.disconnect();
    });
  }

  // Setup host socket listeners
  hostSocket.on("room:participant-joined", (payload) => {
    console.log(`[HOST] Participant joined! Current list:`, payload);
    if (payload.length === 2) {
      joinedCount = 2;
    }
  });

  hostSocket.on("question:broadcast", (payload) => {
    console.log(`[HOST] Broadcasted question ${payload.index + 1}/${payload.total}: "${payload.text}"`);
  });

  hostSocket.on("question:reveal", (payload) => {
    console.log(`[HOST] Question revealed! Correct Option ID: ${payload.correctOptionId}. Option Counts:`, payload.optionCounts);
  });

  hostSocket.on("leaderboard:update", (payload) => {
    console.log(`[HOST] Leaderboard updated. Standings:`, payload);
  });

  hostSocket.on("session:ended", (payload) => {
    console.log(`[HOST] Session ended! Final standings:`, payload);
    hostSocket.disconnect();
    console.log("[SERVER-STATE] All sockets disconnected. Smoke test complete.");
    process.exit(0);
  });

  hostSocket.on("connect", () => {
    console.log(`[HOST] Connected to server (${hostSocket.id}). Requesting room creation...`);
    hostSocket.emit("room:create", { quizId: quiz.id }, async (res) => {
      hostSessionId = res.sessionId;
      hostRoomCode = res.roomCode;
      console.log(`[HOST] Room created! Room Code: ${hostRoomCode}, Session ID: ${hostSessionId}`);

      // Now connect students
      setupStudent(aliceSocket, "Alice");
      if (aliceSocket.connected) {
        console.log(`[ALICE] Already connected (${aliceSocket.id}). Joining room ${hostRoomCode}...`);
        aliceSocket.emit("room:join", { roomCode: hostRoomCode, studentName: "Alice" }, (res: any) => {
          if (res.error) return console.error(`[ALICE] Join error: ${res.error}`);
          aliceParticipantId = res.participantId;
          console.log(`[ALICE] Joined successfully! Participant ID: ${aliceParticipantId}`);
        });
      } else {
        aliceSocket.on("connect", () => {
          console.log(`[ALICE] Connected (${aliceSocket.id}). Joining room ${hostRoomCode}...`);
          aliceSocket.emit("room:join", { roomCode: hostRoomCode, studentName: "Alice" }, (res: any) => {
            if (res.error) return console.error(`[ALICE] Join error: ${res.error}`);
            aliceParticipantId = res.participantId;
            console.log(`[ALICE] Joined successfully! Participant ID: ${aliceParticipantId}`);
          });
        });
      }

      setupStudent(bobSocket, "Bob");
      if (bobSocket.connected) {
        console.log(`[BOB] Already connected (${bobSocket.id}). Joining room ${hostRoomCode}...`);
        bobSocket.emit("room:join", { roomCode: hostRoomCode, studentName: "Bob" }, (res: any) => {
          if (res.error) return console.error(`[BOB] Join error: ${res.error}`);
          bobParticipantId = res.participantId;
          console.log(`[BOB] Joined successfully! Participant ID: ${bobParticipantId}`);
        });
      } else {
        bobSocket.on("connect", () => {
          console.log(`[BOB] Connected (${bobSocket.id}). Joining room ${hostRoomCode}...`);
          bobSocket.emit("room:join", { roomCode: hostRoomCode, studentName: "Bob" }, (res: any) => {
            if (res.error) return console.error(`[BOB] Join error: ${res.error}`);
            bobParticipantId = res.participantId;
            console.log(`[BOB] Joined successfully! Participant ID: ${bobParticipantId}`);
          });
        });
      }

      // Wait for both to join
      console.log("[SERVER-STATE] Waiting for students to join...");
      while (joinedCount < 2) {
        await delay(500);
      }
      
      // Add brief delay before starting
      await delay(1000);
      
      console.log("[HOST] Starting session...");
      hostSocket.emit("session:start", { sessionId: hostSessionId });
    });
  });

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

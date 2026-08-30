import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, QuestionData } from "@quiz/shared-types";
import prisma from "../prisma.js";
import { generateToken } from "../auth/authUtils.js";

// === CONFIGURATION ===
const TARGET_URL = process.env.TARGET_URL || "http://localhost:4000";
const STUDENTS_PER_SESSION = parseInt(process.env.STUDENTS_PER_SESSION || "50", 10);
const CONCURRENT_SESSIONS = parseInt(process.env.CONCURRENT_SESSIONS || "1", 10);

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[LOAD-TEST] Starting load test with config:`);
  console.log(`  Target: ${TARGET_URL}`);
  console.log(`  Students per Session: ${STUDENTS_PER_SESSION}`);
  console.log(`  Concurrent Sessions: ${CONCURRENT_SESSIONS}`);
  
  const startTime = Date.now();

  const quiz = await prisma.quiz.findFirst({
    where: { title: "Java Basics Demo" }
  });

  if (!quiz) {
    console.error("[LOAD-TEST] Error: Quiz 'Java Basics Demo' not found in database.");
    process.exit(1);
  }

  const instructor = await prisma.instructor.findFirst();
  if (!instructor) {
    console.error("[LOAD-TEST] Error: No instructor found in DB. Run npm run create-instructor first.");
    process.exit(1);
  }

  console.log(`[LOAD-TEST] Found quiz: ${quiz.title} (${quiz.id})`);

  let globalJoinedCount = 0;
  let globalFailedCount = 0;
  let globalDisconnectCount = 0;
  
  const connectionTimes: number[] = [];
  const joinRttTimes: number[] = [];
  const broadcastDelays: number[] = [];

  const errorReasons: Record<string, number> = {};
  let firstErrorTime: number | null = null;
  let studentsJoinedAtFirstError = 0;

  const sessionsCompleted = new Array(CONCURRENT_SESSIONS).fill(false);
  const sessionSockets: AppSocket[][] = [];

  for (let s = 0; s < CONCURRENT_SESSIONS; s++) {
    const mockToken = generateToken(instructor.id, `test${s}@example.com`);
    
    const hostSocket: AppSocket = io(TARGET_URL, { auth: { token: mockToken } });
    sessionSockets.push([hostSocket]);

    let hostSessionId = "";
    let hostRoomCode = "";
    let sessionJoinedCount = 0;
    
    // Per-question tracking for this session
    let currentQuestionStartEmit = 0;
    let firstStudentReceiveTime = 0;
    let lastStudentReceiveTime = 0;
    let studentsReceived = 0;

    hostSocket.on("connect", () => {
      hostSocket.emit("room:create", { quizId: quiz.id }, async (res) => {
        if (res.error) {
          console.error(`[HOST ${s}] Error creating room: ${res.error}`);
          process.exit(1);
        }
        hostSessionId = res.sessionId!;
        hostRoomCode = res.roomCode!;
        console.log(`[HOST ${s}] Room created! Code: ${hostRoomCode}`);

        // Connect students
        for (let i = 0; i < STUDENTS_PER_SESSION; i++) {
          const studentStart = Date.now();
          const studentSocket: AppSocket = io(TARGET_URL);
          sessionSockets[s].push(studentSocket);
          
          let studentParticipantId = "";

          studentSocket.on("connect", () => {
            const connectTime = Date.now() - studentStart;
            connectionTimes.push(connectTime);

            const joinStart = Date.now();
            studentSocket.emit("room:join", { roomCode: hostRoomCode, studentName: `Student-${s}-${i}` }, (joinRes: any) => {
              const joinRtt = Date.now() - joinStart;
              joinRttTimes.push(joinRtt);

              if (joinRes.error) {
                globalFailedCount++;
                console.error(`[STUDENT ${s}-${i}] Join error: ${joinRes.error}`);
              } else {
                studentParticipantId = joinRes.participantId;
                sessionJoinedCount++;
                globalJoinedCount++;
              }
            });
          });

          studentSocket.on("disconnect", (reason) => {
            if (!sessionsCompleted[s]) {
              globalDisconnectCount++;
              const errorLabel = `disconnect: ${reason}`;
              errorReasons[errorLabel] = (errorReasons[errorLabel] || 0) + 1;
              if (firstErrorTime === null) {
                firstErrorTime = Date.now() - startTime;
                studentsJoinedAtFirstError = globalJoinedCount;
              }
            }
          });

          studentSocket.on("connect_error", (err) => {
            if (!sessionsCompleted[s]) {
              const errorLabel = `connect_error: ${err.message}`;
              errorReasons[errorLabel] = (errorReasons[errorLabel] || 0) + 1;
              if (firstErrorTime === null) {
                firstErrorTime = Date.now() - startTime;
                studentsJoinedAtFirstError = globalJoinedCount;
              }
            }
          });

          studentSocket.on("question:broadcast", async (payload: QuestionData) => {
            const now = Date.now();
            studentsReceived++;
            if (studentsReceived === 1) firstStudentReceiveTime = now;
            if (studentsReceived === STUDENTS_PER_SESSION) {
              lastStudentReceiveTime = now;
              const delayFanOut = lastStudentReceiveTime - currentQuestionStartEmit;
              broadcastDelays.push(delayFanOut);
            }

            const waitTime = Math.floor(Math.random() * 2000) + 1000; 
            await delay(waitTime);

            const randomOption = payload.options[Math.floor(Math.random() * payload.options.length)];
            studentSocket.emit("answer:submit", {
              sessionId: hostSessionId,
              participantId: studentParticipantId,
              questionId: payload.id,
              optionId: randomOption.id
            });
          });
        }

        while (sessionJoinedCount < STUDENTS_PER_SESSION) {
          await delay(500);
        }
        
        await delay(1000);
        
        console.log(`[HOST ${s}] Starting session...`);
        currentQuestionStartEmit = Date.now();
        studentsReceived = 0;
        hostSocket.emit("session:start", { sessionId: hostSessionId });
      });
    });

    hostSocket.on("question:broadcast", () => {
      // Just waiting for students to receive
    });

    hostSocket.on("question:reveal", () => {
      // Auto-advance is handled by server, we just wait for the next question broadcast
    });

    hostSocket.on("leaderboard:update", (payload) => {
      // Host receives leaderboard update
    });

    // We can also listen for question:next to track when host auto-advances
    let answerRevealedCount = 0;
    hostSocket.on("question:reveal", () => {
       answerRevealedCount++;
       setTimeout(() => {
          // If we wanted manual advance, we would emit question:next here.
          // The server does auto-advance on reveal, so we wait.
       }, 5000);
    });

    hostSocket.on("session:ended", (payload) => {
      sessionsCompleted[s] = true;
      console.log(`[HOST ${s}] Session ended normally.`);
      
      const allCompleted = sessionsCompleted.every(Boolean);
      if (allCompleted) {
        finishTest();
      }
    });

    hostSocket.on("disconnect", () => {
      if (!sessionsCompleted[s]) {
        console.error(`[HOST ${s}] Disconnected unexpectedly!`);
        finishTest();
      }
    });
  }

  // A timeout just in case it hangs
  setTimeout(() => {
    const allCompleted = sessionsCompleted.every(Boolean);
    if (!allCompleted) {
      console.error("[LOAD-TEST] Test timed out after 5 minutes!");
      finishTest();
    }
  }, 300000);

  let isFinishing = false;
  function finishTest() {
    if (isFinishing) return;
    isFinishing = true;

    const totalTime = Date.now() - startTime;
    
    // Disconnect all sockets
    for (const sessionGroup of sessionSockets) {
      for (const s of sessionGroup) {
        s.disconnect();
      }
    }

    const calcStats = (arr: number[]) => {
      if (arr.length === 0) return { min: 0, max: 0, avg: 0 };
      const sum = arr.reduce((a, b) => a + b, 0);
      return {
        min: Math.min(...arr),
        max: Math.max(...arr),
        avg: Math.round(sum / arr.length)
      };
    };

    const connStats = calcStats(connectionTimes);
    const joinStats = calcStats(joinRttTimes);
    const fanoutStats = calcStats(broadcastDelays);

    console.log("\n===========================================");
    console.log("            LOAD TEST RESULTS              ");
    console.log("===========================================");
    console.log(`Total Wall-Clock Time: ${totalTime}ms`);
    console.log(`Students Successfully Joined: ${globalJoinedCount} / ${CONCURRENT_SESSIONS * STUDENTS_PER_SESSION}`);
    console.log(`Failed Joins: ${globalFailedCount}`);
    console.log(`Unexpected Disconnects: ${globalDisconnectCount}`);
    console.log(`Connection Time (ms)  -> Min: ${connStats.min}, Max: ${connStats.max}, Avg: ${connStats.avg}`);
    console.log(`Join RTT Time (ms)    -> Min: ${joinStats.min}, Max: ${joinStats.max}, Avg: ${joinStats.avg}`);
    console.log(`Fanout Delay (ms)     -> Min: ${fanoutStats.min}, Max: ${fanoutStats.max}, Avg: ${fanoutStats.avg}`);
    
    console.log("\n===========================================");
    console.log("   Disconnect/Connection Error Breakdown   ");
    console.log("===========================================");
    if (Object.keys(errorReasons).length === 0) {
      console.log("None");
    } else {
      for (const [reason, count] of Object.entries(errorReasons)) {
        console.log(`- ${reason}: ${count} occurrences`);
      }
      console.log(`\nFirst error occurred at: ${firstErrorTime}ms`);
      console.log(`Students successfully joined at first error: ${studentsJoinedAtFirstError}`);
    }
    console.log("===========================================\n");
    
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("[LOAD-TEST] Catastrophic error:", e);
  process.exit(1);
});

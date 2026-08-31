import { io } from "socket.io-client";
import { PrismaClient } from "@prisma/client";

const SERVER_URL = "http://localhost:4000";

async function runTest() {
  const prisma = new PrismaClient();
  const quiz = await prisma.quiz.findFirst({
    include: { questions: { include: { options: true } } }
  });
  
  if (!quiz) {
    console.error("No quiz found");
    return;
  }
  
  console.log("Found Quiz:", quiz.title);
  
  // Need to get an instructor ID to create a room.
  const instructor = await prisma.instructor.findFirst();
  if (!instructor) {
    console.error("No instructor found");
    return;
  }
  
  // We'll simulate via raw sockets since token might be tricky, or we can just mock the token
  // Let's create a room directly in DB and sessionManager? No, sessionManager runs in the main process, we can't touch it from this script.
  // Let's create a mock token.
  const jwtModule = await import("jsonwebtoken");
  const jwt = jwtModule.default || jwtModule;
  const token = jwt.sign({ instructorId: instructor.id, email: instructor.email }, process.env.JWT_SECRET || "super-secret-key");
  
  const hostSocket = io(SERVER_URL, { auth: { token } });
  
  hostSocket.on("connect", () => {
    console.log("Host connected");
    hostSocket.emit("room:create", { quizId: quiz.id }, (res) => {
      console.log("Room created:", res.roomCode);
      const roomCode = res.roomCode;
      const sessionId = res.sessionId;
      
      const students = [];
      for (let i = 0; i < 3; i++) {
        const studentSocket = io(SERVER_URL);
        students.push(studentSocket);
        
        studentSocket.on("connect", () => {
          studentSocket.emit("room:join", { roomCode, studentName: `Student ${i+1}` }, (joinRes) => {
            console.log(`Student ${i+1} joined`);
            
            studentSocket.on("question:broadcast", (q) => {
              console.log(`Student ${i+1} received question:`, q.id);
              
              const optionId = q.options[i % q.options.length].id;
              
              // Simulate random delay before answering
              setTimeout(() => {
                const emitMs = performance.now();
                studentSocket.emit("answer:submit", {
                  sessionId: joinRes.sessionId,
                  participantId: joinRes.participantId,
                  questionId: q.id,
                  optionId: optionId
                });
                console.log(`[TIMING] 'answer:submit' emitted for Student ${i+1}`);
                studentSocket.lastAnswerSubmitMs = emitMs;
              }, 1000 + (Math.random() * 2000));
            });
            
            studentSocket.on("question:reveal", () => {
              const revealMs = performance.now();
              console.log(`[TIMING] 'question:reveal' received for Student ${i+1}. Round trip: ${(revealMs - studentSocket.lastAnswerSubmitMs).toFixed(2)}ms`);
            });
          });
        });
      }
      
      setTimeout(() => {
        console.log("Host starting session");
        hostSocket.emit("session:start", { sessionId });
      }, 2000);
      
      // Wait for 1 question (e.g. 15s) + 5s buffer, then exit
      setTimeout(() => {
        console.log("Test finished, exiting...");
        process.exit(0);
      }, 20000);
    });
  });
}

runTest();

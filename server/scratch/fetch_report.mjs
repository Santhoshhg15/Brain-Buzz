import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const answer = await prisma.answer.findFirst({
    orderBy: { answeredAt: "desc" },
    include: { participant: true }
  });
  
  if (!answer) {
    console.log("No answer found in DB");
    return;
  }
  
  console.log(`Fetching report for Session ${answer.participant.sessionId}, Participant ${answer.participantId}...`);
  
  const response = await fetch(`http://localhost:4000/api/sessions/${answer.participant.sessionId}/participants/${answer.participantId}/report`);
  const data = await response.json();
  
  console.log("Response:", JSON.stringify(data, null, 2));
}

run();

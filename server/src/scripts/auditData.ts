import prisma from "../prisma.js";

async function main() {
  console.log("=========================================");
  console.log("   DATABASE AUDIT: TEST VS LIVE DATA     ");
  console.log("=========================================\n");

  // 1. Query all Quiz records
  console.log("--- QUIZZES ---");
  const quizzes = await prisma.quiz.findMany({
    include: {
      _count: {
        select: {
          questions: true,
          sessions: true,
        },
      },
    },
  });

  quizzes.forEach((quiz) => {
    console.log(
      `ID: ${quiz.id.padEnd(25)} | Title: ${quiz.title.padEnd(30)} | Created: ${quiz.createdAt.toISOString()} | Questions: ${String(quiz._count.questions).padStart(2)} | Sessions: ${quiz._count.sessions}`
    );
  });
  console.log("");

  // 2. Query all Session records (sorted chronologically)
  console.log("--- SESSIONS (CHRONOLOGICAL) ---");
  const sessions = await prisma.session.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      quiz: {
        select: {
          title: true,
        },
      },
      participants: {
        select: {
          name: true,
        },
      },
    },
  });

  sessions.forEach((session) => {
    const sampleNames = session.participants
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");
    const sampleStr = sampleNames ? `[${sampleNames}${session.participants.length > 3 ? ", ..." : ""}]` : "[]";
    
    console.log(
      `ID: ${session.id.padEnd(25)} | Room: ${session.roomCode.padEnd(6)} | Status: ${session.status.padEnd(12)} | Quiz: ${session.quiz.title.padEnd(25)} | Created: ${session.createdAt.toISOString()} | Participants: ${String(session.participants.length).padStart(3)} | Sample: ${sampleStr}`
    );
  });
  console.log("");

  // 3. Print Totals
  console.log("--- DATABASE TOTALS ---");
  const totalQuizzes = await prisma.quiz.count();
  const totalSessions = await prisma.session.count();
  const totalParticipants = await prisma.participant.count();
  const totalAnswers = await prisma.answer.count();

  console.log(`Total Quizzes:      ${totalQuizzes}`);
  console.log(`Total Sessions:     ${totalSessions}`);
  console.log(`Total Participants: ${totalParticipants}`);
  console.log(`Total Answers:      ${totalAnswers}`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("Audit failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.answer.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.session.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();

  const quiz = await prisma.quiz.create({
    data: {
      title: "Java Basics Demo",
      questions: {
        create: [
          {
            text: "Which keyword is used to inherit a class in Java?",
            orderIndex: 0,
            durationSeconds: 20,
            points: 1000,
            options: {
              create: [
                { text: "extends", isCorrect: true, orderIndex: 0 },
                { text: "implements", isCorrect: false, orderIndex: 1 },
                { text: "inherits", isCorrect: false, orderIndex: 2 },
                { text: "super", isCorrect: false, orderIndex: 3 },
              ],
            },
          },
          {
            text: "What is the default value of a boolean instance variable in Java?",
            orderIndex: 1,
            durationSeconds: 20,
            points: 1000,
            options: {
              create: [
                { text: "true", isCorrect: false, orderIndex: 0 },
                { text: "false", isCorrect: true, orderIndex: 1 },
                { text: "null", isCorrect: false, orderIndex: 2 },
                { text: "0", isCorrect: false, orderIndex: 3 },
              ],
            },
          },
          {
            text: "Which collection class does NOT allow duplicate elements?",
            orderIndex: 2,
            durationSeconds: 25,
            points: 1000,
            options: {
              create: [
                { text: "ArrayList", isCorrect: false, orderIndex: 0 },
                { text: "LinkedList", isCorrect: false, orderIndex: 1 },
                { text: "HashSet", isCorrect: true, orderIndex: 2 },
                { text: "Vector", isCorrect: false, orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Successfully created quiz: ${quiz.title} (ID: ${quiz.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const startMs = performance.now();
  
  const participantId = "cmth0nfaq0007r3r5gyfrunbx"; // dummy
  
  try {
    const promises = [];
    for(let i = 0; i < 3; i++) {
        promises.push(
            Promise.all([
                prisma.participant.update({
                    where: { id: participantId },
                    data: { score: { increment: 10 } }
                }),
                prisma.answer.create({
                    data: {
                        participantId,
                        questionId: "cmtd95rqs0001kdfrv32w09t2",
                        optionId: "zsg5mehp44ld4b36wos7ft48",
                        isCorrect: true,
                        pointsAwarded: 10
                    }
                })
            ])
        );
    }
    
    await Promise.all(promises);
    
    console.log(`Total batched took ${(performance.now() - startMs).toFixed(2)}ms for 3 iterations concurrently`);
  } catch (e) {
    console.log("DB error or bad IDs, but timing is what matters if it succeeded");
  }
}
run();

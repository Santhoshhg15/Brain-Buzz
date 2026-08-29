import { hashPassword } from "../src/auth/authUtils";
import prisma from "../src/prisma";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx tsx prisma/createInstructor.ts <email> <password> <name>");
    process.exit(1);
  }

  const [email, password, name] = args;
  const passwordHash = await hashPassword(password);

  const instructor = await prisma.instructor.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      name
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name
    }
  });

  console.log(`Successfully created/updated instructor: ${instructor.email} (${instructor.name})`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error creating/updating instructor:", error);
  process.exit(1);
});

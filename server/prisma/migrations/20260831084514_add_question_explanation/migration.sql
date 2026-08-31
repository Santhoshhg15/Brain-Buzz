-- AlterTable
ALTER TABLE "Answer" ALTER COLUMN "questionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "explanation" TEXT;

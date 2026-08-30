-- Add instructorId to Session for ownership tracking.
-- Existing rows get the placeholder instructor ID; new rows always supply it explicitly.
ALTER TABLE "Session" ADD COLUMN "instructorId" TEXT NOT NULL DEFAULT 'cmteoq2090000rb2psr6krf98';
ALTER TABLE "Session" ALTER COLUMN "instructorId" DROP DEFAULT;
ALTER TABLE "Session" ADD CONSTRAINT "Session_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- questionId column already exists on "Answer" (added by a previous partial migration).
-- Just add the FK constraint that was never committed.
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

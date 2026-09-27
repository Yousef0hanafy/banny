-- Release B — chapter publish scheduling
-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN "scheduledFor" TIMESTAMP(3);

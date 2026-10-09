-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'contributor' BEFORE 'editor';

-- CreateTable
CREATE TABLE "SeriesAssignment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesAssignment_seriesId_idx" ON "SeriesAssignment"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesAssignment_profileId_seriesId_key" ON "SeriesAssignment"("profileId", "seriesId");

-- AddForeignKey
ALTER TABLE "SeriesAssignment" ADD CONSTRAINT "SeriesAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesAssignment" ADD CONSTRAINT "SeriesAssignment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

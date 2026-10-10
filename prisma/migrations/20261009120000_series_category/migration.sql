-- CreateEnum
CREATE TYPE "series_category" AS ENUM ('manga', 'manhwa', 'novel', 'comic');

-- AlterTable
ALTER TABLE "Series" ADD COLUMN "category" "series_category";

-- Backfill unambiguous legacy records: manga -> manga, novel -> novel
-- Note: legacy webtoon remains unclassified (NULL) until explicitly assigned.
UPDATE "Series" SET "category" = 'manga' WHERE "format" = 'manga';
UPDATE "Series" SET "category" = 'novel' WHERE "format" = 'novel';

-- CreateIndex
CREATE INDEX "Series_category_idx" ON "Series"("category");

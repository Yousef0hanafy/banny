-- CreateEnum
CREATE TYPE "chapter_revision_status" AS ENUM ('draft', 'review', 'changes_requested', 'approved', 'scheduled', 'published', 'withdrawn');

-- CreateTable
CREATE TABLE "ChapterRevision" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "chapter_revision_status" NOT NULL DEFAULT 'draft',
    "titleAr" TEXT NOT NULL,
    "readingDirection" "reading_direction" NOT NULL DEFAULT 'rtl',
    "isPremiumDemo" BOOLEAN NOT NULL DEFAULT false,
    "novelBody" TEXT,
    "pagesJson" JSONB NOT NULL DEFAULT '[]',
    "scheduledFor" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterEditorialEvent" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "revisionId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "reasonAr" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapterEditorialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChapterRevision_chapterId_revisionNumber_key" ON "ChapterRevision"("chapterId", "revisionNumber");

-- CreateIndex
CREATE INDEX "ChapterRevision_chapterId_status_idx" ON "ChapterRevision"("chapterId", "status");

-- CreateIndex
CREATE INDEX "ChapterEditorialEvent_chapterId_createdAt_idx" ON "ChapterEditorialEvent"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "ChapterEditorialEvent_revisionId_idx" ON "ChapterEditorialEvent"("revisionId");

-- CreateIndex
CREATE INDEX "ChapterEditorialEvent_actorId_idx" ON "ChapterEditorialEvent"("actorId");

-- AddForeignKey
ALTER TABLE "ChapterRevision" ADD CONSTRAINT "ChapterRevision_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRevision" ADD CONSTRAINT "ChapterRevision_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterEditorialEvent" ADD CONSTRAINT "ChapterEditorialEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterEditorialEvent" ADD CONSTRAINT "ChapterEditorialEvent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ChapterRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterEditorialEvent" ADD CONSTRAINT "ChapterEditorialEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing chapters:
-- For every existing chapter, create revision 1 with its current state.
-- Map chapter.workflow to ChapterRevisionStatus:
-- 'published' -> 'published'
-- 'review' -> 'review'
-- 'draft' -> 'draft'
-- If scheduledFor is set on a published chapter, set status to 'scheduled'
INSERT INTO "ChapterRevision" (
    "id",
    "chapterId",
    "revisionNumber",
    "version",
    "status",
    "titleAr",
    "readingDirection",
    "isPremiumDemo",
    "novelBody",
    "pagesJson",
    "scheduledFor",
    "approvedById",
    "approvedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'rev_' || c."id" || '_1',
    c."id",
    1,
    1,
    CASE
        WHEN c."workflow" = 'published' AND c."scheduledFor" > NOW() THEN 'scheduled'::"chapter_revision_status"
        WHEN c."workflow" = 'published' THEN 'published'::"chapter_revision_status"
        WHEN c."workflow" = 'review' THEN 'review'::"chapter_revision_status"
        ELSE 'draft'::"chapter_revision_status"
    END,
    c."titleAr",
    c."readingDirection",
    c."isPremiumDemo",
    c."novelBody",
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'pageIndex', p."pageIndex",
                    'imagePath', p."imagePath",
                    'width', p."width",
                    'height', p."height"
                ) ORDER BY p."pageIndex" ASC
            )
            FROM "ChapterPage" p
            WHERE p."chapterId" = c."id"
        ),
        '[]'::jsonb
    ),
    CASE WHEN c."workflow" = 'published' AND c."scheduledFor" > NOW() THEN c."scheduledFor" ELSE NULL END,
    NULL,
    CASE WHEN c."workflow" = 'published' THEN COALESCE(c."publishedAt", c."createdAt") ELSE NULL END,
    c."createdAt",
    c."updatedAt"
FROM "Chapter" c;

-- Record backfill initial migration editorial event for history audit
INSERT INTO "ChapterEditorialEvent" (
    "id",
    "chapterId",
    "revisionId",
    "actorId",
    "action",
    "reasonAr",
    "metadata",
    "createdAt"
)
SELECT
    'evt_' || r."id" || '_backfill',
    r."chapterId",
    r."id",
    NULL,
    'migration_backfill',
    'ترحيل بيانات الفصل إلى مسار النسخ التحريرية',
    '{"source":"migration"}'::jsonb,
    r."createdAt"
FROM "ChapterRevision" r;

-- Future releases are now controlled by the due-publication transaction, not
-- by public query time filters alone. The snapshot retains their schedule.
UPDATE "Chapter"
SET "workflow" = 'draft', "scheduledFor" = NULL, "publishedAt" = NULL
WHERE "workflow" = 'published' AND "scheduledFor" > CURRENT_TIMESTAMP;

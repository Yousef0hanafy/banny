-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('reader', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "series_format" AS ENUM ('manga', 'webtoon');

-- CreateEnum
CREATE TYPE "series_status" AS ENUM ('ongoing', 'completed', 'hiatus');

-- CreateEnum
CREATE TYPE "chapter_workflow" AS ENUM ('draft', 'review', 'published');

-- CreateEnum
CREATE TYPE "reading_direction" AS ENUM ('rtl', 'ltr');

-- CreateEnum
CREATE TYPE "analytics_event_type" AS ENUM ('read_start', 'read_page', 'read_complete', 'login', 'publish');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'reader',
    "avatarSeed" TEXT NOT NULL DEFAULT 'v1',
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleOriginal" TEXT,
    "synopsisAr" TEXT NOT NULL,
    "format" "series_format" NOT NULL,
    "status" "series_status" NOT NULL DEFAULT 'ongoing',
    "genresJson" TEXT NOT NULL DEFAULT '[]',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "author" TEXT NOT NULL,
    "translator" TEXT,
    "coverPath" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT '#9B7BFF',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "titleAr" TEXT NOT NULL,
    "workflow" "chapter_workflow" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "isPremiumDemo" BOOLEAN NOT NULL DEFAULT false,
    "readingDirection" "reading_direction" NOT NULL DEFAULT 'rtl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterPage" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "pageIndex" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 800,
    "height" INTEGER NOT NULL DEFAULT 1200,

    CONSTRAINT "ChapterPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "pageIndex" INTEGER NOT NULL DEFAULT 0,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "analytics_event_type" NOT NULL,
    "seriesId" TEXT,
    "chapterId" TEXT,
    "profileId" TEXT,
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialCollection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'violet',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seriesSlugsJson" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "EditorialCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_seriesId_number_key" ON "Chapter"("seriesId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterPage_chapterId_pageIndex_key" ON "ChapterPage"("chapterId", "pageIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_profileId_chapterId_key" ON "ReadingProgress"("profileId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialCollection_slug_key" ON "EditorialCollection"("slug");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPage" ADD CONSTRAINT "ChapterPage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;


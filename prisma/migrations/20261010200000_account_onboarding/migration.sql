-- CreateEnum
CREATE TYPE "account_token_purpose" AS ENUM ('verify', 'reset', 'invite');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "disabledAt" TIMESTAMP(3),
ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "preferredGenresJson" TEXT NOT NULL DEFAULT '[]';

-- Backfill existing profiles: emailVerifiedAt = createdAt
UPDATE "Profile" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "account_token_purpose" NOT NULL,
    "profileId" TEXT,
    "createdById" TEXT,
    "createdByAuthVersion" INTEGER,
    "email" TEXT NOT NULL,
    "role" "user_role",
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "nextPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRateLimit" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountToken_email_purpose_idx" ON "AccountToken"("email", "purpose");

-- CreateIndex
CREATE INDEX "AccountToken_profileId_idx" ON "AccountToken"("profileId");

-- CreateIndex
CREATE INDEX "AccountAudit_actorId_idx" ON "AccountAudit"("actorId");

-- CreateIndex
CREATE INDEX "AccountAudit_targetId_idx" ON "AccountAudit"("targetId");

-- CreateIndex
CREATE INDEX "AccountAudit_action_idx" ON "AccountAudit"("action");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRateLimit_keyHash_key" ON "AccountRateLimit"("keyHash");

-- CreateIndex
CREATE INDEX "AccountRateLimit_keyHash_windowEnd_idx" ON "AccountRateLimit"("keyHash", "windowEnd");

-- AddForeignKey
ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CHARGE', 'PAYOUT', 'REFUND');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('TASK_CREATED', 'BID_PLACED', 'BID_ACCEPTED', 'TASK_ASSIGNED', 'EN_ROUTE', 'WORK_STARTED', 'WORK_COMPLETED', 'COMPLETION_CONFIRMED', 'AUTO_CONFIRMED', 'TASK_CANCELLED', 'RESCHEDULE_REQUESTED', 'RESCHEDULE_ACCEPTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MESSAGE', 'BID_ACCEPTED', 'HELPER_ASSIGNED', 'TASK_UPDATED', 'CONTRACT_CREATED', 'REVIEW_REQUESTED', 'REPORT_RESOLVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED', 'CONTENT_HIDDEN', 'CONTENT_UNHIDDEN', 'TASK_LOCKED', 'TASK_UNLOCKED', 'CONTRACT_LOCKED', 'CONTRACT_UNLOCKED', 'REFUND_PROCESSED', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewTag" AS ENUM ('PUNCTUAL', 'CAREFUL', 'COMMUNICATIVE', 'PROFESSIONAL', 'FRIENDLY', 'EFFICIENT', 'RELIABLE', 'SKILLED', 'CLEAN', 'RESPONSIVE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TASK', 'USER', 'MESSAGE', 'REVIEW');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "lockedReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "neighborhoodLocationId" TEXT,
ADD COLUMN     "neighborhoodVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "neighborhoodVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "preferredHourlyRate" DECIMAL(10,2),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'POSTER',
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "skills" (
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skillId")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "userSkillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "experienceYears" INTEGER DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("userSkillId")
);

-- CreateTable
CREATE TABLE "task_skills" (
    "taskSkillId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredLevel" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_skills_pkey" PRIMARY KEY ("taskSkillId")
);

-- CreateTable
CREATE TABLE "bids" (
    "bidId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("bidId")
);

-- CreateTable
CREATE TABLE "contracts" (

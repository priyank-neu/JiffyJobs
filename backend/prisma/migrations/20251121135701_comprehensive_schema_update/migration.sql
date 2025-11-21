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
    "contractId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "agreedAmount" DECIMAL(10,2) NOT NULL,
    "acceptedBidId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "terms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "payoutId" TEXT,
    "platformFee" DECIMAL(10,2),
    "helperAmount" DECIMAL(10,2),
    "refundId" TEXT,
    "refundAmount" DECIMAL(10,2),
    "autoReleaseAt" TIMESTAMP(3),
    "paymentCompletedAt" TIMESTAMP(3),
    "payoutReleasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("contractId")
);

-- CreateTable
CREATE TABLE "payments" (
    "paymentId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripeId" TEXT,
    "receiptUrl" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "task_timeline" (
    "timelineId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL,
    "userId" TEXT,
    "oldStatus" "TaskStatus",
    "newStatus" "TaskStatus",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_timeline_pkey" PRIMARY KEY ("timelineId")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "threadId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("threadId")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "messageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedTaskId" TEXT,
    "relatedThreadId" TEXT,
    "relatedBidId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "reviews" (
    "reviewId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" "ReviewTag"[],
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("reviewId")
);

-- CreateTable
CREATE TABLE "task_reports" (
    "reportId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "reportId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "message_reports" (
    "reportId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "reportId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "auditLogId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reportId" TEXT,
    "details" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("auditLogId")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "user_skills_userId_idx" ON "user_skills"("userId");

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "task_skills_taskId_skillId_key" ON "task_skills"("taskId", "skillId");

-- CreateIndex
CREATE INDEX "task_skills_taskId_idx" ON "task_skills"("taskId");

-- CreateIndex
CREATE INDEX "task_skills_skillId_idx" ON "task_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "bids_taskId_helperId_key" ON "bids"("taskId", "helperId");

-- CreateIndex
CREATE INDEX "bids_taskId_idx" ON "bids"("taskId");

-- CreateIndex
CREATE INDEX "bids_helperId_idx" ON "bids"("helperId");

-- CreateIndex
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_taskId_key" ON "contracts"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_acceptedBidId_key" ON "contracts"("acceptedBidId");

-- CreateIndex
CREATE INDEX "contracts_taskId_idx" ON "contracts"("taskId");

-- CreateIndex
CREATE INDEX "contracts_helperId_idx" ON "contracts"("helperId");

-- CreateIndex
CREATE INDEX "contracts_posterId_idx" ON "contracts"("posterId");

-- CreateIndex
CREATE INDEX "contracts_isActive_idx" ON "contracts"("isActive");

-- CreateIndex
CREATE INDEX "contracts_paymentStatus_idx" ON "contracts"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_paymentIntentId_key" ON "contracts"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_payoutId_key" ON "contracts"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_refundId_key" ON "contracts"("refundId");

-- CreateIndex
CREATE INDEX "payments_contractId_idx" ON "payments"("contractId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeId_key" ON "payments"("stripeId");

-- CreateIndex
CREATE INDEX "payments_stripeId_idx" ON "payments"("stripeId");

-- CreateIndex
CREATE INDEX "task_timeline_taskId_createdAt_idx" ON "task_timeline"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_taskId_helperId_key" ON "chat_threads"("taskId", "helperId");

-- CreateIndex
CREATE INDEX "chat_threads_taskId_idx" ON "chat_threads"("taskId");

-- CreateIndex
CREATE INDEX "chat_threads_posterId_idx" ON "chat_threads"("posterId");

-- CreateIndex
CREATE INDEX "chat_threads_helperId_idx" ON "chat_threads"("helperId");

-- CreateIndex
CREATE INDEX "chat_messages_threadId_idx" ON "chat_messages"("threadId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_receiverId_idx" ON "chat_messages"("receiverId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reviews_contractId_idx" ON "reviews"("contractId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_revieweeId_idx" ON "reviews"("revieweeId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_contractId_reviewerId_key" ON "reviews"("contractId", "reviewerId");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex
CREATE INDEX "task_reports_taskId_idx" ON "task_reports"("taskId");

-- CreateIndex
CREATE INDEX "task_reports_reporterId_idx" ON "task_reports"("reporterId");

-- CreateIndex
CREATE INDEX "task_reports_status_idx" ON "task_reports"("status");

-- CreateIndex
CREATE INDEX "task_reports_createdAt_idx" ON "task_reports"("createdAt");

-- CreateIndex
CREATE INDEX "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "user_reports_reporterId_idx" ON "user_reports"("reporterId");

-- CreateIndex
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");

-- CreateIndex
CREATE INDEX "user_reports_createdAt_idx" ON "user_reports"("createdAt");

-- CreateIndex
CREATE INDEX "message_reports_messageId_idx" ON "message_reports"("messageId");

-- CreateIndex
CREATE INDEX "message_reports_reporterId_idx" ON "message_reports"("reporterId");

-- CreateIndex
CREATE INDEX "message_reports_status_idx" ON "message_reports"("status");

-- CreateIndex
CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");

-- CreateIndex
CREATE INDEX "review_reports_reporterId_idx" ON "review_reports"("reporterId");

-- CreateIndex
CREATE INDEX "review_reports_status_idx" ON "review_reports"("status");

-- CreateIndex
CREATE INDEX "review_reports_createdAt_idx" ON "review_reports"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_reportId_idx" ON "audit_logs"("reportId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeAccountId_key" ON "users"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_neighborhoodLocationId_fkey" FOREIGN KEY ("neighborhoodLocationId") REFERENCES "locations"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("skillId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("skillId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_acceptedBidId_fkey" FOREIGN KEY ("acceptedBidId") REFERENCES "bids"("bidId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("contractId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_timeline" ADD CONSTRAINT "task_timeline_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_timeline" ADD CONSTRAINT "task_timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("threadId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("contractId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reports" ADD CONSTRAINT "task_reports_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reports" ADD CONSTRAINT "task_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("reviewId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;


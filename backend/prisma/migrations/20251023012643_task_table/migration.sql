-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'DISPUTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('HOME_REPAIR', 'CLEANING', 'MOVING', 'DELIVERY', 'ASSEMBLY', 'YARD_WORK', 'PET_CARE', 'TECH_SUPPORT', 'TUTORING', 'OTHER');

-- CreateTable
CREATE TABLE "tasks" (
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "budgetMin" DECIMAL(10,2),
    "budgetMax" DECIMAL(10,2),
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "locationId" TEXT,
    "addressMasked" TEXT,
    "taskDate" TIMESTAMP(3),
    "estimatedHours" INTEGER,
    "posterId" TEXT NOT NULL,
    "assignedHelperId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "task_photos" (
    "photoId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_photos_pkey" PRIMARY KEY ("photoId")
);

-- CreateTable
CREATE TABLE "locations" (
    "locationId" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',

    CONSTRAINT "locations_pkey" PRIMARY KEY ("locationId")
);

-- CreateIndex
CREATE INDEX "tasks_posterId_idx" ON "tasks"("posterId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_taskDate_idx" ON "tasks"("taskDate");

-- CreateIndex
CREATE INDEX "task_photos_taskId_idx" ON "task_photos"("taskId");

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedHelperId_fkey" FOREIGN KEY ("assignedHelperId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_photos" ADD CONSTRAINT "task_photos_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

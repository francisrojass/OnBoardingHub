-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TimesheetReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimesheetReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimesheetReport" ADD CONSTRAINT "TimesheetReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

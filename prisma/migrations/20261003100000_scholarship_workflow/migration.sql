CREATE TYPE "ScholarshipStatus" AS ENUM ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','WITHDRAWN');

CREATE TABLE "ScholarshipProgram" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "academicYear" TEXT NOT NULL,
  "maxAwardAmount" INTEGER NOT NULL DEFAULT 0,
  "incomeLimit" INTEGER,
  "minimumPercentage" DOUBLE PRECISION,
  "deadline" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScholarshipProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScholarshipApplication" (
  "id" TEXT NOT NULL,
  "scholarshipId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "amountRequested" INTEGER NOT NULL,
  "awardedAmount" INTEGER,
  "householdIncome" INTEGER,
  "academicPercentage" DOUBLE PRECISION,
  "category" TEXT,
  "statement" TEXT,
  "documentUrl" TEXT,
  "status" "ScholarshipStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScholarshipProgram_institutionId_code_academicYear_key" ON "ScholarshipProgram"("institutionId","code","academicYear");
CREATE INDEX "ScholarshipProgram_institutionId_academicYear_active_idx" ON "ScholarshipProgram"("institutionId","academicYear","active");
CREATE UNIQUE INDEX "ScholarshipApplication_scholarshipId_studentId_key" ON "ScholarshipApplication"("scholarshipId","studentId");
CREATE INDEX "ScholarshipApplication_studentId_status_idx" ON "ScholarshipApplication"("studentId","status");
CREATE INDEX "ScholarshipApplication_scholarshipId_status_idx" ON "ScholarshipApplication"("scholarshipId","status");

ALTER TABLE "ScholarshipProgram" ADD CONSTRAINT "ScholarshipProgram_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_scholarshipId_fkey"
  FOREIGN KEY ("scholarshipId") REFERENCES "ScholarshipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

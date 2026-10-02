CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

CREATE TABLE "FeeStructure" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "semesterId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "tuitionFee" INTEGER NOT NULL DEFAULT 0,
  "examFee" INTEGER NOT NULL DEFAULT 0,
  "libraryFee" INTEGER NOT NULL DEFAULT 0,
  "labFee" INTEGER NOT NULL DEFAULT 0,
  "otherFee" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentFee" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "feeStructureId" TEXT NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "scholarshipAmount" INTEGER NOT NULL DEFAULT 0,
  "paidAmount" INTEGER NOT NULL DEFAULT 0,
  "balanceAmount" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentFee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeePayment" (
  "id" TEXT NOT NULL,
  "studentFeeId" TEXT NOT NULL,
  "receiptNo" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" TEXT NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedById" TEXT NOT NULL,
  CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeStructure_institutionId_academicYear_active_idx" ON "FeeStructure"("institutionId","academicYear","active");
CREATE INDEX "FeeStructure_programId_semesterId_idx" ON "FeeStructure"("programId","semesterId");
CREATE UNIQUE INDEX "StudentFee_studentId_feeStructureId_key" ON "StudentFee"("studentId","feeStructureId");
CREATE INDEX "StudentFee_studentId_status_idx" ON "StudentFee"("studentId","status");
CREATE INDEX "StudentFee_feeStructureId_status_idx" ON "StudentFee"("feeStructureId","status");
CREATE UNIQUE INDEX "FeePayment_receiptNo_key" ON "FeePayment"("receiptNo");
CREATE INDEX "FeePayment_studentFeeId_paidAt_idx" ON "FeePayment"("studentFeeId","paidAt");

ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

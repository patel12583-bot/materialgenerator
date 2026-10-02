-- Admission & enrollment workflow
CREATE TYPE "AdmissionStatus" AS ENUM ('APPLIED','DOCUMENT_VERIFICATION','APPROVED','REJECTED','ENROLLED');

CREATE TABLE "AdmissionApplication" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "applicationNo" TEXT NOT NULL,
  "admissionNo" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "gender" TEXT,
  "address" TEXT,
  "departmentId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "semesterId" TEXT NOT NULL,
  "divisionId" TEXT NOT NULL,
  "status" "AdmissionStatus" NOT NULL DEFAULT 'APPLIED',
  "rejectionReason" TEXT,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "enrolledAt" TIMESTAMP(3),
  "studentId" TEXT,
  CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdmissionDocument" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verificationNote" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdmissionApplication_applicationNo_key" ON "AdmissionApplication"("applicationNo");
CREATE UNIQUE INDEX "AdmissionApplication_admissionNo_key" ON "AdmissionApplication"("admissionNo");
CREATE UNIQUE INDEX "AdmissionApplication_studentId_key" ON "AdmissionApplication"("studentId");
CREATE INDEX "AdmissionApplication_institutionId_status_idx" ON "AdmissionApplication"("institutionId","status");
CREATE INDEX "AdmissionApplication_divisionId_status_idx" ON "AdmissionApplication"("divisionId","status");
CREATE INDEX "AdmissionDocument_applicationId_verified_idx" ON "AdmissionDocument"("applicationId","verified");

ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdmissionDocument" ADD CONSTRAINT "AdmissionDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = "Noble" + "@2026";

  const institution = await prisma.institution.upsert({
    where: { id: "noble-group-2026" },
    update: {
      name: "Noble Group of Institutions",
      campusName: "Noble Public School / Noble Group of Institutions",
      address: "Mota Habipura, Dabhoi, Gujarat State Highway 161, Mota Habipura, Gujarat",
      academicYear: "2026-27",
      logoUrl: "/noble-logo.jpg"
    },
    create: {
      id: "noble-group-2026",
      name: "Noble Group of Institutions",
      campusName: "Noble Public School / Noble Group of Institutions",
      address: "Mota Habipura, Dabhoi, Gujarat State Highway 161, Mota Habipura, Gujarat",
      academicYear: "2026-27",
      logoUrl: "/noble-logo.jpg"
    }
  });

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const accounts = [
    ["superadmin", Role.SUPER_ADMIN, "superadmin@noble.edu.in"],
    ["admin", Role.ADMIN, "admin@noble.edu.in"],
    ["hod", Role.HOD, "hod@noble.edu.in"],
    ["faculty", Role.FACULTY, "faculty@noble.edu.in"],
    ["student", Role.STUDENT, "student@noble.edu.in"],
    ["parent", Role.PARENT, "parent@noble.edu.in"]
  ] as const;

  const users: Record<string, { id:string }> = {};
  for (const [username, role, email] of accounts) {
    const user = await prisma.user.upsert({
      where: { username },
      update: { passwordHash, role, email, institutionId: institution.id, active: true },
      create: { username, passwordHash, role, email, institutionId: institution.id, active: true }
    });
    users[username] = user;
  }

  const structures = [
    { code: "BCA", name: "Bachelor of Computer Applications", totalSemesters: 6 },
    { code: "BRS", name: "Bachelor of Rural Studies", totalSemesters: 6 },
    { code: "BSW", name: "Bachelor of Social Work", totalSemesters: 6 },
    { code: "MSW", name: "Master of Social Work", totalSemesters: 4 },
    { code: "DIP", name: "Diploma", totalSemesters: 6 }
  ];

  const divisions = ["A", "B", "C"];

  for (const item of structures) {
    const department = await prisma.department.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: item.code } },
      update: { name: item.name },
      create: { institutionId: institution.id, name: item.name, code: item.code }
    });

    const program = await prisma.program.upsert({
      where: { departmentId_code: { departmentId: department.id, code: item.code } },
      update: { name: item.name, totalSemesters: item.totalSemesters },
      create: { departmentId: department.id, name: item.name, code: item.code, totalSemesters: item.totalSemesters }
    });

    for (let n = 1; n <= item.totalSemesters; n++) {
      const semester = await prisma.semester.upsert({
        where: { programId_number: { programId: program.id, number: n } },
        update: {},
        create: { programId: program.id, number: n }
      });
      for (const division of divisions) {
        await prisma.division.upsert({
          where: { semesterId_name: { semesterId: semester.id, name: division } },
          update: {},
          create: { semesterId: semester.id, name: division }
        });
      }
    }
  }

  const bca = await prisma.department.findUniqueOrThrow({ where: { institutionId_code: { institutionId: institution.id, code: "BCA" } } });
  const bcaProgram = await prisma.program.findUniqueOrThrow({ where: { departmentId_code: { departmentId: bca.id, code: "BCA" } } });
  const sem1 = await prisma.semester.findUniqueOrThrow({ where: { programId_number: { programId: bcaProgram.id, number: 1 } } });
  const divA = await prisma.division.findUniqueOrThrow({ where: { semesterId_name: { semesterId: sem1.id, name: "A" } } });

  await prisma.user.update({ where: { id: users.admin.id }, data: { departmentId: bca.id } });
  await prisma.user.update({ where: { id: users.hod.id }, data: { departmentId: bca.id } });
  await prisma.user.update({ where: { id: users.faculty.id }, data: { departmentId: bca.id } });

  const faculty = await prisma.faculty.upsert({
    where: { userId: users.faculty.id },
    update: { employeeCode: "FAC-001", name: "Demo Faculty", phone: null },
    create: { userId: users.faculty.id, employeeCode: "FAC-001", name: "Demo Faculty" }
  });

  const student = await prisma.student.upsert({
    where: { userId: users.student.id },
    update: { divisionId: divA.id, enrollmentNo: "NOBLE-BCA-001", rollNo: "1", name: "Demo Student", parentPhone: null },
    create: { userId: users.student.id, divisionId: divA.id, enrollmentNo: "NOBLE-BCA-001", rollNo: "1", name: "Demo Student" }
  });

  const parent = await prisma.parent.upsert({
    where: { userId: users.parent.id },
    update: { name: "Demo Parent", phone: "+91XXXXXXXXXX" },
    create: { userId: users.parent.id, name: "Demo Parent", phone: "+91XXXXXXXXXX" }
  });

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: {},
    create: { parentId: parent.id, studentId: student.id }
  });

  const subject = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: sem1.id, code: "BCA101" } },
    update: { name: "Programming Fundamentals", departmentId: bca.id, credits: 4 },
    create: { departmentId: bca.id, semesterId: sem1.id, code: "BCA101", name: "Programming Fundamentals", credits: 4 }
  });

  await prisma.facultySubject.upsert({
    where: { facultyId_subjectId: { facultyId: faculty.id, subjectId: subject.id } },
    update: {},
    create: { facultyId: faculty.id, subjectId: subject.id }
  });

  await prisma.timetableEntry.upsert({
    where: { divisionId_dayOfWeek_lectureNumber: { divisionId: divA.id, dayOfWeek: 1, lectureNumber: 1 } },
    update: { subjectId: subject.id, facultyId: faculty.id, startTime: "09:00", endTime: "10:00", room: "BCA-101", active: true },
    create: { departmentId: bca.id, divisionId: divA.id, subjectId: subject.id, facultyId: faculty.id, dayOfWeek: 1, lectureNumber: 1, startTime: "09:00", endTime: "10:00", room: "BCA-101" }
  });

  console.log("Noble Attendance seed completed.");
  console.log("Academic structure: BCA/BRS/BSW/MSW/Diploma with configured semesters and divisions A/B/C.");
  console.log("Faculty demo profile, student/parent linkage, subject and Monday timetable are ready for end-to-end testing.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

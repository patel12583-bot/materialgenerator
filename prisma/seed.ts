import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = process.env.NOBLE_DEMO_PASSWORD;
  if (!demoPassword) throw new Error("Set NOBLE_DEMO_PASSWORD before seeding.");

  const institution = await prisma.institution.upsert({
    where: { id: "noble-group-2026" },
    update: {
      name: "Noble Group of Institutions",
      campusName: "Noble Public School / Noble Group of Institutions",
      address: "Mota Habipura, Dabhoi, Gujarat State Highway 161, Mota Habipura, Gujarat",
      academicYear: "2026-27"
    },
    create: {
      id: "noble-group-2026",
      name: "Noble Group of Institutions",
      campusName: "Noble Public School / Noble Group of Institutions",
      address: "Mota Habipura, Dabhoi, Gujarat State Highway 161, Mota Habipura, Gujarat",
      academicYear: "2026-27"
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

  for (const [username, role, email] of accounts) {
    await prisma.user.upsert({
      where: { username },
      update: { passwordHash, role, email, institutionId: institution.id, active: true },
      create: { username, passwordHash, role, email, institutionId: institution.id, active: true }
    });
  }
  console.log("Noble Attendance seed completed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

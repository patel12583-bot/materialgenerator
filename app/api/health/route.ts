import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasSessionSecret = Boolean(process.env.SESSION_SECRET);
  const hasDemoPassword = Boolean(process.env.NOBLE_DEMO_PASSWORD);

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      { ok: false, database: false, error: "DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [institution, users] = await Promise.all([
      prisma.institution.findUnique({
        where: { id: "noble-group-2026" },
        select: { id: true, name: true, academicYear: true }
      }),
      prisma.user.findMany({
        where: {
          username: { in: ["admin", "faculty", "NOBLE-BCA-001", "student"] }
        },
        select: { username: true, role: true, active: true, passwordHash: true }
      })
    ]);

    const account = (role:string, usernames:string[]) => {
      const user = users.find(x => usernames.includes(x.username) && x.role === role);
      return {
        exists: Boolean(user),
        active: Boolean(user?.active),
        passwordConfigured: Boolean(user?.passwordHash)
      };
    };

    const accounts = {
      admin: account("ADMIN", ["admin"]),
      faculty: account("FACULTY", ["faculty"]),
      student: account("STUDENT", ["NOBLE-BCA-001", "student"])
    };

    const seedReady = Boolean(
      institution &&
      accounts.admin.exists &&
      accounts.faculty.exists &&
      accounts.student.exists &&
      accounts.admin.passwordConfigured &&
      accounts.faculty.passwordConfigured &&
      accounts.student.passwordConfigured
    );

    return NextResponse.json({
      ok: true,
      database: true,
      seeded: Boolean(institution),
      seedReady,
      sessionSecretConfigured: hasSessionSecret,
      demoPasswordConfigured: hasDemoPassword,
      institution: institution ?? null,
      accounts
    });
  } catch (error) {
    console.error("health database error", error);
    return NextResponse.json(
      {
        ok: false,
        database: false,
        sessionSecretConfigured: hasSessionSecret,
        demoPasswordConfigured: hasDemoPassword,
        error: "Database connection or schema is unavailable."
      },
      { status: 503 }
    );
  }
}

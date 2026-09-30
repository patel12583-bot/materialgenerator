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
    const institution = await prisma.institution.findUnique({
      where: { id: "noble-group-2026" },
      select: { id: true, name: true, academicYear: true }
    });

    return NextResponse.json({
      ok: true,
      database: true,
      seeded: Boolean(institution),
      sessionSecretConfigured: hasSessionSecret,
      demoPasswordConfigured: hasDemoPassword,
      institution: institution ?? null
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

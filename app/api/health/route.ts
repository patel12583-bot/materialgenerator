import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, database: false }, { status: 503 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const user = await getCurrentUser();
    const verbose = user?.role === "ADMIN";
    return NextResponse.json({
      ok: true,
      database: true,
      sessionSecretConfigured: Boolean(process.env.SESSION_SECRET),
      ...(verbose ? {
        institution: await prisma.institution.findUnique({
          where: { id: user.institutionId },
          select: { id: true, name: true, academicYear: true }
        })
      } : {}),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("health database error", error);
    return NextResponse.json({
      ok: false,
      database: false,
      error: "Database connection or schema is unavailable."
    }, { status: 503 });
  }
}

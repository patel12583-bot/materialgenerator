import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowed = {
  ADMIN: "/admin",
  FACULTY: "/faculty",
  STUDENT: "/student",
} as const;

export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role")?.toUpperCase() as keyof typeof allowed | undefined;

  if (!role || !allowed[role]) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const user = await prisma.user.findFirst({
    where: { role, active: true },
    select: { id: true, role: true, institutionId: true, departmentId: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await createSession({
    userId: user.id,
    role: user.role,
    institutionId: user.institutionId,
    departmentId: user.departmentId,
  });

  return NextResponse.redirect(new URL(allowed[role], req.url));
}

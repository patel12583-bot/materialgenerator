import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN","FACULTY","STUDENT"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = String(url.searchParams.get("role") || "").toUpperCase();
  const redirectTo = role === "ADMIN" ? "/admin" : role === "FACULTY" ? "/faculty" : role === "STUDENT" ? "/student" : "/";
  if (!allowed.has(role)) return NextResponse.redirect(new URL("/", url));

  const user = await prisma.user.findFirst({ where: { role: role as any, active: true }, orderBy: { createdAt: "asc" } });
  if (!user) return NextResponse.redirect(new URL("/?error=no-account", url));

  await createSession({ userId: user.id, role: user.role, institutionId: user.institutionId, departmentId: user.departmentId });
  return NextResponse.redirect(new URL(redirectTo, url));
}

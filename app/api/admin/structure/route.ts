import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function allowed(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await getCurrentUser();
  if (!session || !allowed(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    where: { institutionId: session.institutionId },
    orderBy: { name: "asc" },
    include: {
      programs: {
        orderBy: { code: "asc" },
        include: {
          semesters: {
            orderBy: { number: "asc" },
            include: {
              divisions: { orderBy: { name: "asc" }, _count: { select: { students: true } } }
            }
          }
        }
      }
    }
  });

  return NextResponse.json({ departments });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || !allowed(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const entity = String(body.entity || "");
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    if (entity === "department") {
      const item = await prisma.department.create({
        data: { institutionId: session.institutionId, name, code }
      });
      return NextResponse.json({ item }, { status: 201 });
    }

    if (entity === "program") {
      const departmentId = String(body.departmentId || "");
      const totalSemesters = Number(body.totalSemesters);
      if (!departmentId || !Number.isInteger(totalSemesters) || totalSemesters < 1 || totalSemesters > 12) {
        return NextResponse.json({ error: "Valid department and semester count are required." }, { status: 400 });
      }
      const department = await prisma.department.findFirst({ where: { id: departmentId, institutionId: session.institutionId } });
      if (!department) return NextResponse.json({ error: "Department not found." }, { status: 404 });
      const item = await prisma.program.create({
        data: { departmentId, name, code, totalSemesters }
      });
      return NextResponse.json({ item }, { status: 201 });
    }

    if (entity === "semester") {
      const programId = String(body.programId || "");
      const number = Number(body.number);
      if (!programId || !Number.isInteger(number) || number < 1 || number > 12) {
        return NextResponse.json({ error: "Valid program and semester number are required." }, { status: 400 });
      }
      const program = await prisma.program.findFirst({
        where: { id: programId, department: { institutionId: session.institutionId } }
      });
      if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 });
      const item = await prisma.semester.create({ data: { programId, number } });
      return NextResponse.json({ item }, { status: 201 });
    }

    if (entity === "division") {
      const semesterId = String(body.semesterId || "");
      if (!semesterId) return NextResponse.json({ error: "Semester is required." }, { status: 400 });
      const semester = await prisma.semester.findFirst({
        where: { id: semesterId, program: { department: { institutionId: session.institutionId } } }
      });
      if (!semester) return NextResponse.json({ error: "Semester not found." }, { status: 404 });
      const item = await prisma.division.create({ data: { semesterId, name } });
      return NextResponse.json({ item }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported entity." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to save record.";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "This record already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to save record." }, { status: 500 });
  }
}
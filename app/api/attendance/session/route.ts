import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function indiaNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    dayOfWeek: new Date(`${p.year}-${p.month}-${p.day}T00:00:00+05:30`).getDay(),
  };
}

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function localDayBounds(dateKey: string) {
  return {
    start: new Date(`${dateKey}T00:00:00+05:30`),
    end: new Date(`${dateKey}T23:59:59+05:30`),
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { timetableId } = await req.json();
    if (!timetableId || typeof timetableId !== "string") {
      return NextResponse.json({ error: "Lecture selection is required." }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile not found." }, { status: 404 });

    const institution = await prisma.institution.findUnique({
      where: { id: user.institutionId },
      select: { attendanceGraceMinutes: true },
    });
    const grace = institution?.attendanceGraceMinutes ?? 10;
    const now = indiaNow();

    const timetable = await prisma.timetableEntry.findFirst({
      where: {
        id: timetableId,
        active: true,
        department: { institutionId: user.institutionId },
        OR: [
          { facultyId: faculty.id, substituteAssignments: { none: { dateKey: now.dateKey, active: true } } },
          { substituteAssignments: { some: { dateKey: now.dateKey, active: true, substituteFacultyId: faculty.id } } },
        ],
      },
      include: { division: true, subject: true },
    });
    if (!timetable) {
      return NextResponse.json({ error: "This lecture is not assigned to you." }, { status: 403 });
    }

    if (timetable.dayOfWeek !== now.dayOfWeek) {
      return NextResponse.json({ error: "This lecture is not scheduled for today." }, { status: 409 });
    }

    const current = minutes(now.time);
    const start = minutes(timetable.startTime);
    const end = minutes(timetable.endTime);
    if (current < start - grace || current > end) {
      return NextResponse.json({
        error: `Attendance opens at ${timetable.startTime} minus the ${grace}-minute grace period and locks at ${timetable.endTime}.`,
      }, { status: 409 });
    }

    const dateKey = now.dateKey;
    const existing = await prisma.attendanceSession.findUnique({
      where: { timetableId_dateKey: { timetableId, dateKey } },
      include: { records: true },
    });
    if (existing?.submittedAt) {
      return NextResponse.json({ error: "Attendance for this lecture has already been submitted." }, { status: 409 });
    }

    const sessionRow = await prisma.attendanceSession.upsert({
      where: { timetableId_dateKey: { timetableId, dateKey } },
      update: { startedAt: new Date() },
      create: {
        timetableId,
        facultyId: faculty.id,
        subjectId: timetable.subjectId,
        date: new Date(),
        dateKey,
        startedAt: new Date(),
        room: timetable.room,
      },
      include: { records: true },
    });

    if (sessionRow.records.length === 0) {
      const students = await prisma.student.findMany({
        where: { divisionId: timetable.divisionId },
        select: { id: true },
      });
      const bounds = localDayBounds(dateKey);
      const approved = await prisma.leaveRequest.findMany({
        where: {
          studentId: { in: students.map(s => s.id) },
          status: "APPROVED",
          fromDate: { lte: bounds.end },
          toDate: { gte: bounds.start },
        },
        select: { studentId: true },
      });
      const leaveIds = new Set(approved.map(x => x.studentId));

      await prisma.attendanceRecord.createMany({
        data: students.map(s => ({
          sessionId: sessionRow.id,
          studentId: s.id,
          status: leaveIds.has(s.id) ? "ON_LEAVE" : "PRESENT",
        })),
        skipDuplicates: true,
      });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId: sessionRow.id },
      include: { student: { select: { id: true, enrollmentNo: true, rollNo: true, name: true } } },
      orderBy: { student: { rollNo: "asc" } },
    });

    return NextResponse.json({
      sessionId: sessionRow.id,
      date: dateKey,
      graceMinutes: grace,
      records,
    });
  } catch (error) {
    console.error("attendance session error", error);
    return NextResponse.json({ error: "Unable to start attendance." }, { status: 500 });
  }
}

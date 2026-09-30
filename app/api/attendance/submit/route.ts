import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = ["PRESENT", "ABSENT", "EXAM_ONLY", "ON_LEAVE", "LATE_PRESENT"] as const;
function indiaNow(){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.hour}:${p.minute}`;}
function minutes(value:string){const [h,m]=value.split(":").map(Number);return h*60+m;}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "");
    const input = Array.isArray(body.records) ? body.records : [];
    if (!sessionId || !Array.isArray(body.records)) {
      return NextResponse.json({ error: "Invalid attendance payload." }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile not found." }, { status: 404 });

    const attendance = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, facultyId: faculty.id, timetable: { department: { institutionId: user.institutionId } } },
      include: { subject: true, timetable: true, records: { include: { student: true } } },
    });
    if (!attendance) return NextResponse.json({ error: "Attendance session not found." }, { status: 404 });
    if (attendance.submittedAt) {
      return NextResponse.json({ error: "This attendance session has already been submitted." }, { status: 409 });
    }
    const nowMinutes=minutes(indiaNow());
    const endMinutes=minutes(attendance.timetable.endTime);
    if(nowMinutes> endMinutes) return NextResponse.json({error:`Attendance submission is locked after ${attendance.timetable.endTime}.`},{status:409});

    const allowed = new Map(attendance.records.map(record => [record.studentId, record]));
    const bounds = {
      start: new Date(`${attendance.dateKey}T00:00:00+05:30`),
      end: new Date(`${attendance.dateKey}T23:59:59+05:30`),
    };

    const changes: { studentId: string; before: string; after: string }[] = [];
    const finalStatuses = new Map<string, typeof statuses[number]>();

    for (const item of input) {
      const studentId = String(item?.studentId || "");
      const requested = String(item?.status || "") as typeof statuses[number];
      if (!studentId || !statuses.includes(requested)) continue;

      const existing = allowed.get(studentId);
      if (!existing) continue;

      const approvedLeave = await prisma.leaveRequest.findFirst({
        where: {
          studentId,
          status: "APPROVED",
          fromDate: { lte: bounds.end },
          toDate: { gte: bounds.start },
        },
        select: { id: true },
      });

      const finalStatus = approvedLeave ? "ON_LEAVE" : requested;
      finalStatuses.set(studentId, finalStatus);
      if (existing.status !== finalStatus) {
        changes.push({ studentId, before: existing.status, after: finalStatus });
      }
    }

    await prisma.$transaction(async tx => {
      const claim = await tx.attendanceSession.updateMany({where:{id:sessionId,facultyId:faculty.id,submittedAt:null},data:{submittedAt:new Date()}});
      if (!claim.count) throw new Error("Attendance session already submitted.");

      for (const change of changes) {
        await tx.attendanceRecord.update({
          where: { sessionId_studentId: { sessionId, studentId: change.studentId } },
          data: { status: change.after as any, markedAt: new Date() },
        });
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "ATTENDANCE_CHANGE",
            entity: "AttendanceRecord",
            entityId: allowed.get(change.studentId)!.id,
            before: { status: change.before },
            after: { status: change.after, sessionId },
          },
        });
      }

      const absent = await tx.attendanceRecord.findMany({
        where: { sessionId, status: "ABSENT" },
        include: { student: true },
      });

      const notifications = absent
        .filter(record => Boolean(record.student.parentPhone))
        .flatMap(record => {
          const base = `ATTENDANCE_ABSENT:${sessionId}:${record.studentId}`;
          const payload = {
            studentName: record.student.name,
            subject: attendance.subject.name,
            date: attendance.dateKey,
            message: `નમસ્તે વાલીશ્રી, આપનો પુત્ર/પુત્રી ${record.student.name} આજે ${attendance.dateKey} ના રોજ ${attendance.subject.name} ના લેક્ચરમાં ગેરહાજર (Absent) છે. - Noble Group of Institutions`,
          };
          return [
            { studentId: record.studentId, channel: "SMS", recipient: record.student.parentPhone!, template: "ATTENDANCE_ABSENT", dedupeKey: `${base}:SMS`, payload },
            { studentId: record.studentId, channel: "WHATSAPP", recipient: record.student.parentPhone!, template: "ATTENDANCE_ABSENT", dedupeKey: `${base}:WHATSAPP`, payload },
          ];
        });

      if (notifications.length) {
        const existingNotifications = await tx.notification.findMany({
          where: { dedupeKey: { in: notifications.map(item => item.dedupeKey) } },
          select: { dedupeKey: true },
        });
        const existingKeys = new Set(existingNotifications.map(item => item.dedupeKey));
        const freshNotifications = notifications.filter(item => !existingKeys.has(item.dedupeKey));
        if (freshNotifications.length) {
          await tx.notification.createMany({ data: freshNotifications });
        }
      }

    });

    const absentCount = await prisma.attendanceRecord.count({ where: { sessionId, status: "ABSENT" } });
    return NextResponse.json({
      ok: true,
      absentCount,
      notificationsQueued: absentCount * 2,
      changedCount: changes.length,
      message: "Attendance submitted successfully.",
    });
  } catch (error) {
    console.error("attendance submit error", error);
    if(error instanceof Error && error.message.includes("already submitted")) return NextResponse.json({error:"This attendance session was already submitted."},{status:409});
    return NextResponse.json({ error: "Unable to submit attendance." }, { status: 500 });
  }
}

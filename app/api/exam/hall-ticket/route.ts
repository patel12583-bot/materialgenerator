import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (user.role !== "STUDENT") {
    return NextResponse.json({ error: "Hall tickets are available to students only." }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
    include: {
      division: { include: { semester: { include: { program: true } } } },
    },
  });
  if (!student) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const where: any = {
    institutionId: user.institutionId,
    divisionId: student.divisionId,
  };
  if (sessionId) where.id = sessionId;

  const sessions = await prisma.examSession.findMany({
    where,
    orderBy: [{ date: "asc" }, { subject: { code: "asc" } }],
    include: { subject: true, division: { include: { semester: { include: { program: true } } } } },
  });

  if (sessionId) {
    const exam = sessions[0];
    if (!exam) return NextResponse.json({ error: "Hall ticket not found." }, { status: 404 });

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Hall Ticket - ${esc(student.enrollmentNo)}</title>
<style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#101828;margin:0;background:#fff}
.ticket{border:2px solid #101828;border-radius:14px;padding:28px;max-width:820px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #d0d5dd;padding-bottom:18px}
.brand{font-size:22px;font-weight:800}.sub{color:#667085;font-size:12px;margin-top:4px}.tag{border:1px solid #d0d5dd;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700}
.title{text-align:center;margin:26px 0 18px}.title h1{margin:0;font-size:25px}.title p{margin:7px 0 0;color:#667085;font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.field{border:1px solid #eaecf0;border-radius:9px;padding:11px}.field small{display:block;color:#667085;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.field b{display:block;margin-top:5px;font-size:14px}
.notice{margin-top:18px;background:#f8fafc;border:1px solid #eaecf0;padding:13px;border-radius:9px;font-size:12px;line-height:1.5}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:55px}.line{border-top:1px solid #98a2b3;padding-top:7px;font-size:11px;color:#667085}
.actions{text-align:center;margin-top:20px}.actions button{border:0;background:#101828;color:white;padding:10px 16px;border-radius:8px;cursor:pointer}
@media print{.actions{display:none}}
</style></head><body><main class="ticket">
<div class="header"><div><div class="brand">${esc(exam.division.semester.program.name)} · Noble Group of Institutions</div><div class="sub">Official examination hall ticket</div></div><div class="tag">${esc(exam.examType.replace("_"," "))}</div></div>
<div class="title"><h1>EXAMINATION HALL TICKET</h1><p>Academic Year ${esc(new Intl.DateTimeFormat("en-IN",{year:"numeric"}).format(exam.date))}</p></div>
<div class="grid">
<div class="field"><small>Student Name</small><b>${esc(student.name)}</b></div>
<div class="field"><small>Enrollment Number</small><b>${esc(student.enrollmentNo)}</b></div>
<div class="field"><small>Roll Number</small><b>${esc(student.rollNo)}</b></div>
<div class="field"><small>Class / Division</small><b>${esc(exam.division.semester.program.code)} · Sem ${esc(exam.division.semester.number)} · Div ${esc(exam.division.name)}</b></div>
<div class="field"><small>Subject</small><b>${esc(exam.subject.code)} · ${esc(exam.subject.name)}</b></div>
<div class="field"><small>Exam Date</small><b>${esc(exam.dateKey)}</b></div>
<div class="field"><small>Exam Room / Block</small><b>${esc(exam.room)}</b></div>
<div class="field"><small>Hall Ticket ID</small><b>${esc(exam.id)}</b></div>
</div>
<div class="notice"><b>Candidate instructions:</b> Carry this hall ticket and valid college identity card. Report before the examination starts. The hall ticket is generated from the official examination schedule and is valid only for the examination shown above.</div>
<div class="sign"><div class="line">Student signature</div><div class="line">Authorized examination authority</div></div>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
</main></body></html>`;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json({
    student: {
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      rollNo: student.rollNo,
      program: student.division.semester.program.code,
      semester: student.division.semester.number,
      division: student.division.name,
    },
    exams: sessions.map(exam => ({
      id: exam.id,
      examType: exam.examType,
      dateKey: exam.dateKey,
      room: exam.room,
      subject: { code: exam.subject.code, name: exam.subject.name },
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

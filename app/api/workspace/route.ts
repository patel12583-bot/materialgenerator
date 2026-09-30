import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN","SUPER_ADMIN"];
const pct = (present:number, total:number) => total ? Math.round((present / total) * 1000) / 10 : 0;

async function context() {
  return getCurrentUser();
}

function canRead(role: string, page: string) {
  const rules: Record<string, string[]> = {
    Overview: ["ADMIN", "FACULTY", "STUDENT"],
    Subjects: ["ADMIN"],
    "Master Timetable": ["ADMIN", "FACULTY", "STUDENT"],
    Timetable: ["ADMIN", "FACULTY", "STUDENT"],
    Leaves: ["ADMIN", "FACULTY", "STUDENT"],
    "Leave Requests": ["ADMIN", "FACULTY"],
    "Leave Status": ["ADMIN", "FACULTY"],
    Defaulters: ["ADMIN"],
    Reports: ["ADMIN", "FACULTY", "STUDENT"],
    "My Attendance": ["STUDENT"],
    Notifications: ["ADMIN", "STUDENT"],
    "Parent Alerts": ["ADMIN"],
    "Audit Logs": ["ADMIN"],
    Settings: ["ADMIN"],
    Adjustments: ["FACULTY"],
    Faculty: ["ADMIN"],
    Students: ["ADMIN"],
    "Attendance Monitor": ["ADMIN"],
    Administrators: ["ADMIN"],
    Institutions: ["ADMIN"],
    Security: ["ADMIN"],
  };
  return rules[page]?.includes(role) ?? false;
}

export async function GET(req: Request) {
  const session = await context();
  if (!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const page = new URL(req.url).searchParams.get("page") || "Overview";
  const institutionId = session.institutionId;
  if (!canRead(session.role, page)) return NextResponse.json({error:"Forbidden"},{status:403});

  if (page === "Overview") {
    const [students,faculty,subjects,timetable,leaves,notifications] = await Promise.all([
      prisma.student.count({where:{division:{semester:{program:{department:{institutionId}}}}}}),
      prisma.faculty.count({where:{user:{institutionId}}}),
      prisma.subject.count({where:{department:{institutionId}}}),
      prisma.timetableEntry.count({where:{department:{institutionId},active:true,...(session.role==="FACULTY"?{faculty:{userId:session.id}}:session.role==="STUDENT"?{division:{students:{some:{userId:session.id}}}}:{})}}),
      prisma.leaveRequest.count({where:{student:{division:{semester:{program:{department:{institutionId}}}}},status:"PENDING"}}),
      prisma.notification.count({where:{student:{division:{semester:{program:{department:{institutionId}}}}},status:"QUEUED"}})
    ]);
    return NextResponse.json({students,faculty,subjects,timetable,leaves,notifications});
  }

  if (page === "Subjects") {
    const [subjects,semesters] = await Promise.all([
      prisma.subject.findMany({where:{department:{institutionId}},orderBy:[{department:{code:"asc"}},{semester:{number:"asc"}},{code:"asc"}],include:{department:true,semester:{include:{program:true}}}}),
      prisma.semester.findMany({where:{program:{department:{institutionId}}},orderBy:[{program:{code:"asc"}},{number:"asc"}],include:{program:true}})
    ]);
    return NextResponse.json({subjects,semesters});
  }

  if (page === "Master Timetable" || page === "Timetable") {
    const [entries,divisions,subjects,faculty] = await Promise.all([
      prisma.timetableEntry.findMany({where:{department:{institutionId},active:true},orderBy:[{dayOfWeek:"asc"},{lectureNumber:"asc"}],include:{subject:true,faculty:{include:{user:{select:{departmentId:true}}}},division:{include:{semester:{include:{program:true}}}}}}),
      prisma.division.findMany({where:{semester:{program:{department:{institutionId}}}},orderBy:[{semester:{program:{code:"asc"}}},{semester:{number:"asc"}},{name:"asc"}],include:{semester:{include:{program:true}}}}),
      prisma.subject.findMany({where:{department:{institutionId}},orderBy:{code:"asc"}}),
      prisma.faculty.findMany({where:{user:{institutionId,active:true}},orderBy:{name:"asc"}})
    ]);
    return NextResponse.json({entries,divisions,subjects,faculty});
  }

  if (page === "Leaves" || page === "Leave Requests" || page === "Leave Status") {
    const where:any = {student:{division:{semester:{program:{department:{institutionId}}}}}};
    if (session.role === "STUDENT") where.student = {userId:session.userId};
    const leaves = await prisma.leaveRequest.findMany({where,orderBy:{createdAt:"desc"},take:100,include:{student:{select:{id:true,name:true,enrollmentNo:true,rollNo:true,division:{include:{semester:{include:{program:true}}}}}}}});
    return NextResponse.json({leaves});
  }

  if (page === "Defaulters") {
    const students = await prisma.student.findMany({where:{division:{semester:{program:{department:{institutionId}}}}},include:{division:{include:{semester:{include:{program:true}}}},attendance:{where:{session:{examType:null},status:{notIn:["EXAM_ONLY","ON_LEAVE"]}}}}});
    const defaulters = students.map(s => {
      const total=s.attendance.length, present=s.attendance.filter(a=>a.status==="PRESENT"||a.status==="LATE_PRESENT").length;
      return {id:s.id,name:s.name,enrollmentNo:s.enrollmentNo,rollNo:s.rollNo,program:s.division.semester.program.code,semester:s.division.semester.number,division:s.division.name,present,total,percentage:pct(present,total)};
    }).filter(x=>x.total>0 && x.percentage<75).sort((a,b)=>a.percentage-b.percentage);
    return NextResponse.json({defaulters});
  }

  if (page === "Reports" || page === "My Attendance") {
    const studentWhere:any = {division:{semester:{program:{department:{institutionId}}}}};
    if(session.role==="STUDENT") studentWhere.userId=session.userId;
    const students = await prisma.student.findMany({where:studentWhere,include:{division:{include:{semester:{include:{program:true}}}},attendance:{where:{session:{examType:null}},include:{session:{include:{subject:true}}}}}});
    const rows=students.map(s=>{
      const regular=s.attendance.filter(a=>a.status!=="EXAM_ONLY"&&a.status!=="ON_LEAVE");
      const present=regular.filter(a=>a.status==="PRESENT"||a.status==="LATE_PRESENT").length;
      const leave=s.attendance.filter(a=>a.status==="ON_LEAVE").length;
      return {id:s.id,name:s.name,enrollmentNo:s.enrollmentNo,program:s.division.semester.program.code,semester:s.division.semester.number,division:s.division.name,present,total:regular.length,leave,percentage:pct(present,regular.length)};
    });
    const subjectRows:any[] = [];
    for (const s of students) {
      const bySubject = new Map<string,{subjectId:string;code:string;name:string;present:number;total:number;leave:number}>();
      for (const record of s.attendance) {
        const subject = record.session.subject;
        const row = bySubject.get(subject.id) ?? {subjectId:subject.id,code:subject.code,name:subject.name,present:0,total:0,leave:0};
        if (record.status === "ON_LEAVE") row.leave += 1;
        else if (record.status !== "EXAM_ONLY") { row.total += 1; if (record.status === "PRESENT" || record.status === "LATE_PRESENT") row.present += 1; }
        bySubject.set(subject.id,row);
      }
      for (const row of bySubject.values()) subjectRows.push({...row,studentId:s.id,studentName:s.name,enrollmentNo:s.enrollmentNo,percentage:pct(row.present,row.total)});
    }
    return NextResponse.json({rows,subjectRows});
  }

  if (page === "Notifications" || page === "Parent Alerts") {
    const where:any = {student:{division:{semester:{program:{department:{institutionId}}}}}};
    if(session.role==="STUDENT") where.student={userId:session.userId};
    const notifications=await prisma.notification.findMany({where,orderBy:{createdAt:"desc"},take:100});
    return NextResponse.json({notifications});
  }

  if (page === "Audit Logs") {
    const logs=await prisma.auditLog.findMany({where:{actor:{institutionId}},orderBy:{createdAt:"desc"},take:100,include:{actor:{select:{username:true,role:true}}}});
    return NextResponse.json({logs});
  }

  if (page === "Settings") {
    const institution=await prisma.institution.findUnique({where:{id:institutionId}});
    return NextResponse.json({institution});
  }

  if (page === "Faculty" || page === "Students" || page === "Attendance Monitor" || page === "Administrators" || page === "Institutions") {
    const [faculty,students]=await Promise.all([
      prisma.faculty.findMany({where:{user:{institutionId}},orderBy:{name:"asc"},include:{user:{select:{username:true,active:true,department:{select:{name:true,code:true}}}}}}),
      prisma.student.findMany({where:{division:{semester:{program:{department:{institutionId}}}}},orderBy:{rollNo:"asc"},take:200,include:{division:{include:{semester:{include:{program:true}}}}}})
    ]);
    return NextResponse.json({faculty,students});
  }

  if (page === "Adjustments") {
    const records=await prisma.attendanceRecord.findMany({where:{session:{faculty:{userId:session.userId}}},orderBy:{markedAt:"desc"},take:100,include:{student:{select:{name:true,enrollmentNo:true}},session:{include:{subject:true}}}});
    return NextResponse.json({records});
  }

  return NextResponse.json({});
}

export async function POST(req: Request) {
  const session=await context();
  if(!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json();
  const action=String(body.action||"");

  try {
    if(action==="create-subject" && adminRoles.includes(session.role)) {
      const department=await prisma.department.findFirst({where:{id:String(body.departmentId),institutionId:session.institutionId}});
      const semester=await prisma.semester.findFirst({where:{id:String(body.semesterId),program:{department:{institutionId:session.institutionId}}}});
      if(!department||!semester) return NextResponse.json({error:"Invalid department or semester."},{status:400});
      const code = String(body.code || "").trim().toUpperCase(); const name = String(body.name || "").trim(); const credits = Number(body.credits);
      if(!code || !name || !Number.isInteger(credits) || credits < 0 || credits > 10) return NextResponse.json({error:"Valid subject code, name and credits are required."},{status:400});
      const item=await prisma.subject.create({data:{departmentId:department.id,semesterId:semester.id,code:String(body.code).trim().toUpperCase(),name:String(body.name).trim(),credits:Number(body.credits)||0}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"Subject",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }

    if(action==="create-timetable" && adminRoles.includes(session.role)) {
      const division=await prisma.division.findFirst({where:{id:String(body.divisionId),semester:{program:{department:{institutionId:session.institutionId}}}}});
      const subject=await prisma.subject.findFirst({where:{id:String(body.subjectId),department:{institutionId:session.institutionId}}});
      const faculty=await prisma.faculty.findFirst({where:{id:String(body.facultyId),user:{institutionId:session.institutionId}}});
      if(!division||!subject||!faculty) return NextResponse.json({error:"Invalid division, subject or faculty."},{status:400});
      if(subject.semesterId !== division.semesterId) return NextResponse.json({error:"Subject must belong to the selected division semester."},{status:400});
      const dayOfWeek = Number(body.dayOfWeek); const lectureNumber = Number(body.lectureNumber);
      if(!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6 || !Number.isInteger(lectureNumber) || lectureNumber < 1 || lectureNumber > 10) return NextResponse.json({error:"Invalid day or lecture number."},{status:400});
      const mapping = await prisma.facultySubject.findUnique({where:{facultyId_subjectId:{facultyId:faculty.id,subjectId:subject.id}}});
      if(!mapping) return NextResponse.json({error:"Faculty is not assigned to this subject."},{status:400});
      const item=await prisma.timetableEntry.create({data:{departmentId:subject.departmentId,divisionId:division.id,subjectId:subject.id,facultyId:faculty.id,dayOfWeek:Number(body.dayOfWeek),lectureNumber:Number(body.lectureNumber),startTime:String(body.startTime),endTime:String(body.endTime),room:String(body.room||"")||null}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"TimetableEntry",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }

    if(action==="leave" && session.role==="STUDENT") {
      const student=await prisma.student.findUnique({where:{userId:session.userId}});
      if(!student) return NextResponse.json({error:"Student profile not found."},{status:404});
      const from=new Date(String(body.fromDate)+"T00:00:00+05:30"), to=new Date(String(body.toDate)+"T23:59:59+05:30");
      if(isNaN(from.getTime())||isNaN(to.getTime())||from>to) return NextResponse.json({error:"Invalid leave dates."},{status:400});
      const item=await prisma.leaveRequest.create({data:{studentId:student.id,fromDate:from,toDate:to,reason:String(body.reason||"").trim(),documentUrl:String(body.documentUrl||"").trim()||null}});
      return NextResponse.json({item},{status:201});
    }

    if(action==="leave-status" && (adminRoles.includes(session.role) || session.role==="FACULTY" || session.role==="HOD")) {
      const id=String(body.id), status=String(body.status);
      if(!["APPROVED","REJECTED"].includes(status)) return NextResponse.json({error:"Invalid status."},{status:400});
      const leave=await prisma.leaveRequest.findFirst({where:{id,student:{division:{semester:{program:{department:{institutionId:session.institutionId}}}}}}});
      if(!leave) return NextResponse.json({error:"Leave request not found."},{status:404});
      if(session.role==="FACULTY" && session.departmentId) {
        const studentDepartment = await prisma.student.findUnique({where:{id:leave.studentId},select:{division:{select:{semester:{select:{program:{select:{departmentId:true}}}}}}}});
        const departmentId = studentDepartment?.division.semester.program.departmentId;
        if(departmentId !== session.departmentId) return NextResponse.json({error:"You can only approve leave for your department."},{status:403});
      }
      const approver = session.role==="FACULTY" ? await prisma.faculty.findUnique({where:{userId:session.userId}}) : null;
      const before = leave.status;
      const item=await prisma.$transaction(async tx => {
        const updated = await tx.leaveRequest.update({where:{id},data:{status:status as any,approverId:approver?.id ?? null,approvedAt:status==="APPROVED"?new Date():null}});
        if(status==="APPROVED") {
          await tx.attendanceRecord.updateMany({where:{studentId:leave.studentId,session:{date:{gte:leave.fromDate,lte:leave.toDate}}},data:{status:"ON_LEAVE"}});
          await tx.notification.updateMany({where:{studentId:leave.studentId,status:"QUEUED",template:"ATTENDANCE_ABSENT"},data:{status:"CANCELLED"}});
        }
        await tx.auditLog.create({data:{actorId:session.userId,action:status==="APPROVED"?"APPROVE":"REJECT",entity:"LeaveRequest",entityId:id,before:{status:before},after:{status:updated.status}}});
        return updated;
      });
      return NextResponse.json({item});
    }

    if(action==="institution-settings" && adminRoles.includes(session.role)) {
      const item=await prisma.institution.update({where:{id:session.institutionId},data:{name:String(body.name||"").trim(),campusName:String(body.campusName||"").trim()||null,address:String(body.address||"").trim()||null,phone:String(body.phone||"").trim()||null,website:String(body.website||"").trim()||null,academicYear:String(body.academicYear||"2026-27").trim()}});
      return NextResponse.json({item});
    }

    return NextResponse.json({error:"Unsupported action."},{status:400});
  } catch(error) {
    const message=error instanceof Error?error.message:"Unable to save.";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"This record already exists."},{status:409});
    return NextResponse.json({error:"Unable to save record."},{status:500});
  }
}

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
    "Exam Attendance": ["FACULTY"],
  };
  return rules[page]?.includes(role) ?? false;
}

export async function GET(req: Request) {
  const session = await context();
  if (!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const page = new URL(req.url).searchParams.get("page") || "Overview";
  const institutionId = session.institutionId;
  if (!canRead(session.role, page)) return NextResponse.json({error:"Forbidden"},{status:403});

  if (page === "Exam Attendance") {
    const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
    if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
    const [divisions,subjects]=await Promise.all([
      prisma.division.findMany({where:{semester:{program:{department:{institutionId}}}},orderBy:[{semester:{program:{code:"asc"}}},{semester:{number:"asc"}},{name:"asc"}],include:{semester:{include:{program:true}}}}),
      prisma.subject.findMany({where:{department:{institutionId},facultyMappings:{some:{facultyId:faculty.id}}},orderBy:{code:"asc"}})
    ]);
    return NextResponse.json({divisions,subjects});
  }

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
    const timetableWhere:any = {department:{institutionId},active:true};
    if(session.role==="FACULTY") timetableWhere.faculty={userId:session.userId};
    if(session.role==="STUDENT") timetableWhere.division={students:{some:{userId:session.userId}}};
    const [entries,divisions,subjects,faculty] = await Promise.all([
      prisma.timetableEntry.findMany({where:timetableWhere,orderBy:[{dayOfWeek:"asc"},{lectureNumber:"asc"}],include:{subject:true,faculty:{include:{user:{select:{departmentId:true}}}},division:{include:{semester:{include:{program:true}}}}}}),
      prisma.division.findMany({where:{semester:{program:{department:{institutionId}}}},orderBy:[{semester:{program:{code:"asc"}}},{semester:{number:"asc"}},{name:"asc"}],include:{semester:{include:{program:true}}}}),
      prisma.subject.findMany({where:{department:{institutionId}},orderBy:{code:"asc"}}),
      prisma.faculty.findMany({where:{user:{institutionId,active:true}},orderBy:{name:"asc"}})
    ]);
    return NextResponse.json({entries,divisions,subjects,faculty});
  }

  if (page === "Leaves" || page === "Leave Requests" || page === "Leave Status") {
    const where:any = {student:{division:{semester:{program:{department:{institutionId}}}}}};
    if (session.role === "STUDENT") where.student = {userId:session.userId};
    if (session.role === "FACULTY" && session.departmentId) where.student.division.semester.program.departmentId = session.departmentId;
    const leaves = await prisma.leaveRequest.findMany({where,orderBy:{createdAt:"desc"},take:100,include:{student:{select:{id:true,name:true,enrollmentNo:true,rollNo:true,division:{include:{semester:{include:{program:true}}}}}}}});
    return NextResponse.json({leaves});
  }

  if (page === "Defaulters") {
    const policy = await prisma.institution.findUnique({where:{id:institutionId},select:{minimumAttendance:true}});
    const threshold = policy?.minimumAttendance ?? 75;
    const students = await prisma.student.findMany({where:{division:{semester:{program:{department:{institutionId}}}}},include:{division:{include:{semester:{include:{program:true}}}},attendance:{where:{session:{examType:null},status:{notIn:["EXAM_ONLY","ON_LEAVE"]}}}}});
    const defaulters = students.map(s => {
      const total=s.attendance.length, present=s.attendance.filter(a=>a.status==="PRESENT"||a.status==="LATE_PRESENT").length;
      return {id:s.id,name:s.name,enrollmentNo:s.enrollmentNo,rollNo:s.rollNo,program:s.division.semester.program.code,semester:s.division.semester.number,division:s.division.name,present,total,percentage:pct(present,total)};
    }).filter(x=>x.total>0 && x.percentage<threshold).sort((a,b)=>a.percentage-b.percentage);
    return NextResponse.json({defaulters,threshold});
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
    const policy = await prisma.institution.findUnique({where:{id:institutionId},select:{minimumAttendance:true}});
    return NextResponse.json({rows,subjectRows,threshold:policy?.minimumAttendance ?? 75});
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
      const faculty=await prisma.faculty.findFirst({where:{id:String(body.facultyId),user:{institutionId:session.institutionId,active:true}}});
      if(!division||!subject||!faculty) return NextResponse.json({error:"Invalid division, subject or faculty."},{status:400});
      if(subject.semesterId !== division.semesterId) return NextResponse.json({error:"Subject must belong to the selected division semester."},{status:400});
      const dayOfWeek=Number(body.dayOfWeek), lectureNumber=Number(body.lectureNumber), startTime=String(body.startTime||""), endTime=String(body.endTime||"");
      const standardSlots:any={1:["09:00","10:00"],2:["10:00","11:00"],3:["11:15","12:15"],4:["12:15","13:15"],5:["14:00","15:00"],6:["15:00","16:00"]};
      if(!Number.isInteger(dayOfWeek)||dayOfWeek<1||dayOfWeek>6||!Number.isInteger(lectureNumber)||lectureNumber<1||lectureNumber>6) return NextResponse.json({error:"Invalid day or lecture number."},{status:400});
      if(!/^\d{2}:\d{2}$/.test(startTime)||!/^\d{2}:\d{2}$/.test(endTime)||startTime>=endTime) return NextResponse.json({error:"Invalid lecture time."},{status:400});
      if(standardSlots[lectureNumber]&&(startTime!==standardSlots[lectureNumber][0]||endTime!==standardSlots[lectureNumber][1])) return NextResponse.json({error:"Lecture time must match the Noble standard timetable slot."},{status:400});
      const mapping=await prisma.facultySubject.findUnique({where:{facultyId_subjectId:{facultyId:faculty.id,subjectId:subject.id}}});
      if(!mapping) return NextResponse.json({error:"Faculty is not assigned to this subject."},{status:400});
      const facultyConflict=await prisma.timetableEntry.findFirst({where:{facultyId:faculty.id,dayOfWeek,lectureNumber,active:true}});
      if(facultyConflict) return NextResponse.json({error:"This faculty member is already assigned to another division in this lecture slot."},{status:409});
      const room=String(body.room||"").trim()||null;
      const roomConflict=room?await prisma.timetableEntry.findFirst({where:{departmentId:subject.departmentId,dayOfWeek,lectureNumber,room,active:true}}):null;
      if(roomConflict) return NextResponse.json({error:"This room is already occupied in that lecture slot."},{status:409});
      const item=await prisma.timetableEntry.create({data:{departmentId:subject.departmentId,divisionId:division.id,subjectId:subject.id,facultyId:faculty.id,dayOfWeek,lectureNumber,startTime,endTime,room}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"TimetableEntry",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }

    if(action==="update-timetable" && adminRoles.includes(session.role)) {
      const id=String(body.id||"");
      const existing=await prisma.timetableEntry.findFirst({where:{id,department:{institutionId:session.institutionId}}});
      if(!existing) return NextResponse.json({error:"Timetable entry not found."},{status:404});
      const division=await prisma.division.findFirst({where:{id:String(body.divisionId),semester:{program:{department:{institutionId:session.institutionId}}}}});
      const subject=await prisma.subject.findFirst({where:{id:String(body.subjectId),department:{institutionId:session.institutionId}}});
      const faculty=await prisma.faculty.findFirst({where:{id:String(body.facultyId),user:{institutionId:session.institutionId,active:true}}});
      if(!division||!subject||!faculty||subject.semesterId!==division.semesterId) return NextResponse.json({error:"Invalid timetable assignment."},{status:400});
      const dayOfWeek=Number(body.dayOfWeek), lectureNumber=Number(body.lectureNumber), startTime=String(body.startTime||""), endTime=String(body.endTime||""), room=String(body.room||"").trim()||null;
      const standardSlots:any={1:["09:00","10:00"],2:["10:00","11:00"],3:["11:15","12:15"],4:["12:15","13:15"],5:["14:00","15:00"],6:["15:00","16:00"]};
      if(!Number.isInteger(dayOfWeek)||dayOfWeek<1||dayOfWeek>6||!Number.isInteger(lectureNumber)||lectureNumber<1||lectureNumber>6||!/^\d{2}:\d{2}$/.test(startTime)||!/^\d{2}:\d{2}$/.test(endTime)||startTime>=endTime) return NextResponse.json({error:"Invalid timetable values."},{status:400});
      if(standardSlots[lectureNumber]&&(startTime!==standardSlots[lectureNumber][0]||endTime!==standardSlots[lectureNumber][1])) return NextResponse.json({error:"Lecture time must match the Noble standard timetable slot."},{status:400});
      const mapping=await prisma.facultySubject.findUnique({where:{facultyId_subjectId:{facultyId:faculty.id,subjectId:subject.id}}});
      if(!mapping) return NextResponse.json({error:"Faculty is not assigned to this subject."},{status:400});
      const conflict=await prisma.timetableEntry.findFirst({where:{id:{not:id},OR:[{facultyId:faculty.id,dayOfWeek,lectureNumber,active:true},{divisionId:division.id,dayOfWeek,lectureNumber,active:true},...(room?[{departmentId:subject.departmentId,dayOfWeek,lectureNumber,room,active:true}]:[])]}});
      if(conflict) return NextResponse.json({error:"Timetable conflict: faculty, division or room is already booked."},{status:409});
      const item=await prisma.timetableEntry.update({where:{id},data:{divisionId:division.id,subjectId:subject.id,facultyId:faculty.id,dayOfWeek,lectureNumber,startTime,endTime,room}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"TimetableEntry",entityId:id,before:existing,after:item}});
      return NextResponse.json({item});
    }

    if(action==="delete-timetable" && adminRoles.includes(session.role)) {
      const id=String(body.id||"");
      const existing=await prisma.timetableEntry.findFirst({where:{id,department:{institutionId:session.institutionId}}});
      if(!existing) return NextResponse.json({error:"Timetable entry not found."},{status:404});
      const sessions=await prisma.attendanceSession.count({where:{timetableId:id}});
      if(sessions) return NextResponse.json({error:"This lecture has attendance history, so it cannot be deleted. Disable it instead to preserve records."},{status:409});
      await prisma.timetableEntry.update({where:{id},data:{active:false}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"DELETE",entity:"TimetableEntry",entityId:id,before:existing,after:{active:false}}});
      return NextResponse.json({ok:true});
    }

    if(action==="create-substitute" && adminRoles.includes(session.role)) {
      const timetableId=String(body.timetableId||""), dateKey=String(body.dateKey||"");
      const entry=await prisma.timetableEntry.findFirst({where:{id:timetableId,department:{institutionId:session.institutionId},active:true}});
      const substitute=await prisma.faculty.findFirst({where:{id:String(body.substituteFacultyId),user:{institutionId:session.institutionId,active:true}}});
      if(!entry||!substitute) return NextResponse.json({error:"Invalid timetable or substitute faculty."},{status:400});
      if(substitute.id===entry.facultyId) return NextResponse.json({error:"Substitute faculty must be different from the assigned faculty."},{status:400});
      if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return NextResponse.json({error:"Valid substitute date is required."},{status:400});
      const conflict=await prisma.timetableEntry.findFirst({where:{facultyId:substitute.id,dayOfWeek:entry.dayOfWeek,lectureNumber:entry.lectureNumber,active:true,id:{not:entry.id}}});
      if(conflict) return NextResponse.json({error:"Substitute faculty already has another lecture in that slot."},{status:409});
      const item=await prisma.substituteAssignment.upsert({where:{timetableId_dateKey:{timetableId,dateKey}},update:{substituteFacultyId:substitute.id,reason:String(body.reason||"").trim()||null,active:true},create:{timetableId,dateKey,mainFacultyId:entry.facultyId,substituteFacultyId:substitute.id,reason:String(body.reason||"").trim()||null}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"SubstituteAssignment",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }

    if(action==="delete-substitute" && adminRoles.includes(session.role)) {
      const id=String(body.id||"");
      const item=await prisma.substituteAssignment.findFirst({where:{id,timetable:{department:{institutionId:session.institutionId}}}});
      if(!item) return NextResponse.json({error:"Substitute assignment not found."},{status:404});
      await prisma.substituteAssignment.update({where:{id},data:{active:false}});
      return NextResponse.json({ok:true});
    }

    if(action==="create-exam-session" && session.role==="FACULTY") {
      const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
      if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
      const division=await prisma.division.findFirst({where:{id:String(body.divisionId),semester:{program:{department:{institutionId:session.institutionId}}}}});
      const subject=await prisma.subject.findFirst({where:{id:String(body.subjectId),department:{institutionId:session.institutionId},facultyMappings:{some:{facultyId:faculty.id}}}});
      const examType=String(body.examType) as any;
      const room=String(body.room||"").trim();
      if(!division||!subject||!room||!["MID_SEM","FINAL_EXAM","UNIT_TEST"].includes(examType)) return NextResponse.json({error:"Valid exam type, division, subject and room are required."},{status:400});
      if(subject.semesterId!==division.semesterId) return NextResponse.json({error:"Subject must belong to the selected division."},{status:400});
      const now=new Date(), dateKey=String(body.dateKey||new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(now));
      const item=await prisma.examSession.upsert({where:{divisionId_subjectId_dateKey_examType:{divisionId:division.id,subjectId:subject.id,dateKey,examType}},update:{facultyId:faculty.id,room,startedAt:new Date(),submittedAt:null},create:{institutionId:session.institutionId,divisionId:division.id,subjectId:subject.id,facultyId:faculty.id,examType,date:now,dateKey,room,startedAt:new Date()}});
      const students=await prisma.student.findMany({where:{divisionId:division.id},select:{id:true}});
      await prisma.examRecord.createMany({data:students.map(s=>({sessionId:item.id,studentId:s.id,status:"PRESENT"})),skipDuplicates:true});
      const records=await prisma.examRecord.findMany({where:{sessionId:item.id},include:{student:{select:{id:true,enrollmentNo:true,rollNo:true,name:true}}},orderBy:{student:{rollNo:"asc"}}});
      return NextResponse.json({sessionId:item.id,records});
    }

    if(action==="submit-exam" && session.role==="FACULTY") {
      const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
      if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
      const id=String(body.sessionId||"");
      const exam=await prisma.examSession.findFirst({where:{id,facultyId:faculty.id,institutionId:session.institutionId}});
      if(!exam) return NextResponse.json({error:"Exam session not found."},{status:404});
      if(exam.submittedAt) return NextResponse.json({error:"Exam attendance already submitted."},{status:409});
      const rows=Array.isArray(body.records)?body.records:[];
      await prisma.$transaction(async tx=>{
        const claim=await tx.examSession.updateMany({where:{id,facultyId:faculty.id,submittedAt:null},data:{submittedAt:new Date()}});
        if(!claim.count) throw new Error("Exam attendance already submitted.");
        for(const row of rows){
          const status=String(row?.status||"");
          if(!["PRESENT","ABSENT","EXAM_ONLY"].includes(status)) continue;
          await tx.examRecord.updateMany({where:{sessionId:id,studentId:String(row.studentId)},data:{status:status as any,markedAt:new Date()}});
        }
        await tx.auditLog.create({data:{actorId:session.userId,action:"EXAM_ATTENDANCE_SUBMIT",entity:"ExamSession",entityId:id,after:{examType:exam.examType,room:exam.room}}});
      });
      return NextResponse.json({ok:true});
    }

    if(action==="leave" && session.role==="STUDENT") {
      const student=await prisma.student.findUnique({where:{userId:session.userId}});
      if(!student) return NextResponse.json({error:"Student profile not found."},{status:404});
      const from=new Date(String(body.fromDate)+"T00:00:00+05:30"), to=new Date(String(body.toDate)+"T23:59:59+05:30");
      const reason=String(body.reason||"").trim();
      if(isNaN(from.getTime())||isNaN(to.getTime())||from>to) return NextResponse.json({error:"Invalid leave dates."},{status:400});
      if(!reason || reason.length > 500) return NextResponse.json({error:"Leave reason is required and must be under 500 characters."},{status:400});
      const overlap=await prisma.leaveRequest.findFirst({where:{studentId:student.id,status:{in:["PENDING","APPROVED"]},fromDate:{lte:to},toDate:{gte:from}}});
      if(overlap) return NextResponse.json({error:"A leave request already overlaps these dates."},{status:409});
      const item=await prisma.leaveRequest.create({data:{studentId:student.id,fromDate:from,toDate:to,reason,documentUrl:String(body.documentUrl||"").trim()||null}});
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
          const sessions = await tx.attendanceSession.findMany({where:{date:{gte:leave.fromDate,lte:leave.toDate}},select:{id:true}}); for (const sessionRow of sessions) { await tx.notification.updateMany({where:{studentId:leave.studentId,status:"QUEUED",template:"ATTENDANCE_ABSENT",dedupeKey:{startsWith:`ATTENDANCE_ABSENT:${sessionRow.id}:`}},data:{status:"CANCELLED"}}); }
        }
        await tx.auditLog.create({data:{actorId:session.userId,action:status==="APPROVED"?"APPROVE":"REJECT",entity:"LeaveRequest",entityId:id,before:{status:before},after:{status:updated.status}}});
        return updated;
      });
      return NextResponse.json({item});
    }

    if(action==="institution-settings" && adminRoles.includes(session.role)) {
      const item=await prisma.institution.update({where:{id:session.institutionId},data:{name:String(body.name||"").trim(),campusName:String(body.campusName||"").trim()||null,address:String(body.address||"").trim()||null,phone:String(body.phone||"").trim()||null,website:String(body.website||"").trim()||null,academicYear:String(body.academicYear||"2026-27").trim(),minimumAttendance:Math.min(100,Math.max(1,Number(body.minimumAttendance)||75)),attendanceGraceMinutes:Math.min(60,Math.max(0,Number(body.attendanceGraceMinutes)||10)),timezone:"Asia/Kolkata"}});
      return NextResponse.json({item});
    }

    return NextResponse.json({error:"Unsupported action."},{status:400});
  } catch(error) {
    const message=error instanceof Error?error.message:"Unable to save.";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"This record already exists."},{status:409});
    return NextResponse.json({error:"Unable to save record."},{status:500});
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req:Request){
 const session=await getSession();
 if(!session||session.role!=="FACULTY") return NextResponse.json({error:"Unauthorized"},{status:401});
 const {sessionId,records}=await req.json();
 if(!sessionId||!Array.isArray(records)) return NextResponse.json({error:"Invalid attendance payload."},{status:400});
 const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
 const attendance=await prisma.attendanceSession.findFirst({where:{id:sessionId,facultyId:faculty?.id},include:{subject:true}});
 if(!attendance) return NextResponse.json({error:"Attendance session not found."},{status:404});
 for(const item of records){
   if(!item.studentId||!["PRESENT","ABSENT","EXAM_ONLY","ON_LEAVE","LATE_PRESENT"].includes(item.status)) continue;
   await prisma.attendanceRecord.update({where:{sessionId_studentId:{sessionId,studentId:item.studentId}},data:{status:item.status}});
 }
 const absent=await prisma.attendanceRecord.findMany({where:{sessionId,status:"ABSENT"},include:{student:true}});
 const notifications=absent.filter(x=>x.student.parentPhone).flatMap(x=>[
   {studentId:x.student.id,channel:"SMS",recipient:x.student.parentPhone!,template:"ATTENDANCE_ABSENT",payload:{studentName:x.student.name,subject:attendance.subject.name}},
   {studentId:x.student.id,channel:"WHATSAPP",recipient:x.student.parentPhone!,template:"ATTENDANCE_ABSENT",payload:{studentName:x.student.name,subject:attendance.subject.name}}
 ]);
 if(notifications.length) await prisma.notification.createMany({data:notifications});
 await prisma.attendanceSession.update({where:{id:sessionId},data:{submittedAt:new Date()}});
 return NextResponse.json({ok:true,absentCount:absent.length,notificationsQueued:notifications.length});
}
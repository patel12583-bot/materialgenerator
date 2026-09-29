import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function indiaDateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
export async function POST(req:Request){
 const session=await getSession();
 if(!session||session.role!=="FACULTY") return NextResponse.json({error:"Unauthorized"},{status:401});
 const {timetableId}=await req.json();
 const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
 if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
 const timetable=await prisma.timetableEntry.findFirst({where:{id:timetableId,facultyId:faculty.id,active:true},include:{division:true,subject:true}});
 if(!timetable) return NextResponse.json({error:"This lecture is not assigned to you."},{status:403});
 const dateKey=indiaDateKey();
 const sessionRow=await prisma.attendanceSession.upsert({where:{timetableId_dateKey:{timetableId,dateKey}},update:{startedAt:new Date()},create:{timetableId,facultyId:faculty.id,subjectId:timetable.subjectId,date:new Date(),dateKey,startedAt:new Date()},include:{records:true}});
 if(sessionRow.records.length===0){
   const students=await prisma.student.findMany({where:{divisionId:timetable.divisionId},select:{id:true}});
   const approved=await prisma.leaveRequest.findMany({where:{studentId:{in:students.map(s=>s.id)},status:"APPROVED",fromDate:{lte:new Date()},toDate:{gte:new Date()}}});
   const leaveIds=new Set(approved.map(x=>x.studentId));
   await prisma.attendanceRecord.createMany({data:students.map(s=>({sessionId:sessionRow.id,studentId:s.id,status:leaveIds.has(s.id)?"ON_LEAVE":"PRESENT"})),skipDuplicates:true});
 }
 const records=await prisma.attendanceRecord.findMany({where:{sessionId:sessionRow.id},include:{student:{select:{id:true,enrollmentNo:true,rollNo:true,name:true}}},orderBy:{student:{rollNo:"asc"}}});
 return NextResponse.json({sessionId:sessionRow.id,records});
}
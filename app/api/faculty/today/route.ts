import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function indiaNow(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return {dateKey:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,day:new Date(`${p.year}-${p.month}-${p.day}T00:00:00+05:30`).getDay()};
}
export async function GET(){
 const session=await getCurrentUser();
 if(!session||session.role!=="FACULTY") return NextResponse.json({error:"Unauthorized"},{status:401});
 const now=indiaNow();
 const faculty=await prisma.faculty.findUnique({where:{userId:session.userId}});
 if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
 const direct=await prisma.timetableEntry.findMany({where:{facultyId:faculty.id,dayOfWeek:now.day,active:true,substituteAssignments:{none:{dateKey:now.dateKey,active:true}}},include:{subject:true,division:{include:{semester:{include:{program:true}}}}},orderBy:{lectureNumber:"asc"}});
 const substitutes=await prisma.timetableEntry.findMany({where:{dayOfWeek:now.day,active:true,substituteAssignments:{some:{dateKey:now.dateKey,active:true,substituteFacultyId:faculty.id}}},include:{subject:true,division:{include:{semester:{include:{program:true}}}}},orderBy:{lectureNumber:"asc"}});
 const lectures=[...direct,...substitutes].sort((a,b)=>a.lectureNumber-b.lectureNumber);
 return NextResponse.json({date:now.dateKey,currentTime:now.time,dayOfWeek:now.day,lectures:lectures.map(l=>({id:l.id,lectureNumber:l.lectureNumber,startTime:l.startTime,endTime:l.endTime,room:l.room,subject:{id:l.subject.id,code:l.subject.code,name:l.subject.name},class:{program:l.division.semester.program.name,semester:l.division.semester.number,division:l.division.name}}))});
}
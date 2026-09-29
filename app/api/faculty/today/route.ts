import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function indiaNow(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return {dateKey:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,day:new Date(`${p.year}-${p.month}-${p.day}T00:00:00+05:30`).getDay()};
}
export async function GET(){
 const session=await getSession();
 if(!session||session.role!=="FACULTY") return NextResponse.json({error:"Unauthorized"},{status:401});
 const now=indiaNow();
 const lectures=await prisma.timetableEntry.findMany({where:{faculty:{userId:session.userId},dayOfWeek:now.day,active:true},include:{subject:true,division:{include:{semester:{include:{program:true}}}}},orderBy:{lectureNumber:"asc"}});
 return NextResponse.json({date:now.dateKey,currentTime:now.time,dayOfWeek:now.day,lectures:lectures.map(l=>({id:l.id,lectureNumber:l.lectureNumber,startTime:l.startTime,endTime:l.endTime,room:l.room,subject:{id:l.subject.id,code:l.subject.code,name:l.subject.name},class:{program:l.division.semester.program.name,semester:l.division.semester.number,division:l.division.name}}))});
}
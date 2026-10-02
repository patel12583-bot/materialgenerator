import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const allowed=["ADMIN","SUPER_ADMIN","HOD"];

export async function GET(){
 const session=await getCurrentUser();
 if(!session || !allowed.includes(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
 const dept=session.role==="HOD"&&session.departmentId?session.departmentId:null;
 const [faculty,subjects,mappings]=await Promise.all([
  prisma.faculty.findMany({where:{user:{institutionId:session.institutionId,active:true,...(dept?{departmentId:dept}:{})}},orderBy:{name:"asc"},select:{id:true,name:true,employeeCode:true,user:{select:{departmentId:true}}}}),
  prisma.subject.findMany({where:{department:{institutionId:session.institutionId,...(dept?{id:dept}:{})}},orderBy:{code:"asc"},include:{semester:{include:{program:true}},department:{select:{id:true,code:true,name:true}}}}),
  prisma.facultySubject.findMany({where:{faculty:{user:{institutionId:session.institutionId,...(dept?{departmentId:dept}:{})}}},include:{faculty:{select:{id:true,name:true,employeeCode:true}},subject:{select:{id:true,code:true,name:true,semester:{include:{program:true}}}}},orderBy:{subject:{code:"asc"}}})
 ]);
 return NextResponse.json({faculty,subjects,mappings});
}

export async function POST(req:Request){
 const session=await getCurrentUser();
 if(!session || !allowed.includes(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await req.json(); const facultyId=String(body.facultyId||""); const subjectId=String(body.subjectId||"");
  if(!facultyId||!subjectId) return NextResponse.json({error:"Faculty and subject are required."},{status:400});
  const dept=session.role==="HOD"&&session.departmentId?session.departmentId:null;
  const faculty=await prisma.faculty.findFirst({where:{id:facultyId,user:{institutionId:session.institutionId,active:true,...(dept?{departmentId:dept}:{})}}});
  const subject=await prisma.subject.findFirst({where:{id:subjectId,department:{institutionId:session.institutionId,...(dept?{id:dept}:{})}}});
  if(!faculty||!subject) return NextResponse.json({error:"Faculty or subject is outside your permitted scope."},{status:403});
  const exists=await prisma.facultySubject.findUnique({where:{facultyId_subjectId:{facultyId,subjectId}}});
  if(exists) return NextResponse.json({error:"This mapping already exists."},{status:409});
  const item=await prisma.$transaction(async tx=>{
   const created=await tx.facultySubject.create({data:{facultyId,subjectId}});
   await tx.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"FacultySubject",entityId:facultyId+"_"+subjectId,after:{facultyId,subjectId}}});
   return created;
  });
  return NextResponse.json({item},{status:201});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to create subject mapping."},{status:500});}
}

export async function DELETE(req:Request){
 const session=await getCurrentUser();
 if(!session || !allowed.includes(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await req.json(); const facultyId=String(body.facultyId||""); const subjectId=String(body.subjectId||"");
  const item=await prisma.facultySubject.findUnique({where:{facultyId_subjectId:{facultyId,subjectId}},include:{faculty:{include:{user:true}}}});
  if(!item) return NextResponse.json({error:"Mapping not found."},{status:404});
  if(item.faculty.user.institutionId!==session.institutionId) return NextResponse.json({error:"Forbidden."},{status:403});
  if(session.role==="HOD"&&session.departmentId&&item.faculty.user.departmentId!==session.departmentId) return NextResponse.json({error:"Department scope violation."},{status:403});
  await prisma.$transaction(async tx=>{
   await tx.facultySubject.delete({where:{facultyId_subjectId:{facultyId,subjectId}}});
   await tx.auditLog.create({data:{actorId:session.userId,action:"DELETE",entity:"FacultySubject",entityId:facultyId+"_"+subjectId,before:{facultyId,subjectId}}});
  });
  return NextResponse.json({ok:true});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to remove subject mapping."},{status:500});}
}
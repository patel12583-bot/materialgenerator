import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const writeRoles=["ADMIN","SUPER_ADMIN"] as const;

export async function GET() {
  const session=await getSession();
  if(!session) return NextResponse.json({error:"Unauthorized."},{status:401});
  if(!["ADMIN","SUPER_ADMIN","HOD"].includes(session.role)) return NextResponse.json({error:"Forbidden."},{status:403});

  const departments=await prisma.department.findMany({
    where:{institutionId:session.institutionId,...(session.role==="HOD"&&session.departmentId?{id:session.departmentId}:{})},
    orderBy:{name:"asc"},
    include:{programs:{orderBy:{name:"asc"},include:{semesters:{orderBy:{number:"asc"},include:{divisions:{orderBy:{name:"asc"},include:{_count:{select:{students:true}}}},_count:{select:{subjects:true}}}}}}},
  });
  return NextResponse.json({departments});
}

export async function POST(req:NextRequest){
  const session=await getSession();
  if(!session) return NextResponse.json({error:"Unauthorized."},{status:401});
  if(!writeRoles.includes(session.role as any)) return NextResponse.json({error:"Only Administration can change academic structure."},{status:403});
  const body=await req.json().catch(()=>({}));
  const action=String(body.action||"");

  try{
    if(action==="create-department"){
      const name=String(body.name||"").trim(), code=String(body.code||"").trim().toUpperCase();
      if(name.length<2||code.length<2||code.length>12) return NextResponse.json({error:"Department name and a 2–12 character code are required."},{status:400});
      const item=await prisma.department.create({data:{institutionId:session.institutionId,name,code}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"Department",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }
    if(action==="create-program"){
      const department=await prisma.department.findFirst({where:{id:String(body.departmentId),institutionId:session.institutionId}});
      const name=String(body.name||"").trim(), code=String(body.code||"").trim().toUpperCase(), totalSemesters=Number(body.totalSemesters);
      if(!department||name.length<2||code.length<2||!Number.isInteger(totalSemesters)||totalSemesters<1||totalSemesters>20) return NextResponse.json({error:"Select a valid department and enter valid program details."},{status:400});
      const item=await prisma.program.create({data:{departmentId:department.id,name,code,totalSemesters}});
      await prisma.$transaction(Array.from({length:totalSemesters},(_,i)=>prisma.semester.create({data:{programId:item.id,number:i+1}})));
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"Program",entityId:item.id,after:{...item,totalSemesters}}});
      return NextResponse.json({item},{status:201});
    }
    if(action==="create-semester"){
      const program=await prisma.program.findFirst({where:{id:String(body.programId),department:{institutionId:session.institutionId}}});
      const number=Number(body.number);
      if(!program||!Number.isInteger(number)||number<1||number>20) return NextResponse.json({error:"Valid program and semester number are required."},{status:400});
      const item=await prisma.semester.create({data:{programId:program.id,number}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"Semester",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }
    if(action==="create-division"){
      const semester=await prisma.semester.findFirst({where:{id:String(body.semesterId),program:{department:{institutionId:session.institutionId}}}});
      const name=String(body.name||"").trim().toUpperCase();
      if(!semester||!/^[A-Z0-9][A-Z0-9 ._-]{0,19}$/.test(name)) return NextResponse.json({error:"Select a valid semester and enter a division name."},{status:400});
      const item=await prisma.division.create({data:{semesterId:semester.id,name}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"Division",entityId:item.id,after:item}});
      return NextResponse.json({item},{status:201});
    }
    if(action==="rename"){
      const type=String(body.type||""), id=String(body.id||""), name=String(body.name||"").trim();
      if(!id||name.length<2) return NextResponse.json({error:"A valid name is required."},{status:400});
      if(type==="department"){
        const existing=await prisma.department.findFirst({where:{id,institutionId:session.institutionId}}); if(!existing)return NextResponse.json({error:"Department not found."},{status:404});
        const item=await prisma.department.update({where:{id},data:{name}}); await prisma.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Department",entityId:id,before:existing,after:item}}); return NextResponse.json({item});
      }
      if(type==="program"){
        const existing=await prisma.program.findFirst({where:{id,department:{institutionId:session.institutionId}}}); if(!existing)return NextResponse.json({error:"Program not found."},{status:404});
        const item=await prisma.program.update({where:{id},data:{name}}); await prisma.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Program",entityId:id,before:existing,after:item}}); return NextResponse.json({item});
      }
      if(type==="division"){
        const existing=await prisma.division.findFirst({where:{id,semester:{program:{department:{institutionId:session.institutionId}}}}}); if(!existing)return NextResponse.json({error:"Division not found."},{status:404});
        const item=await prisma.division.update({where:{id},data:{name:name.toUpperCase()}}); await prisma.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Division",entityId:id,before:existing,after:item}}); return NextResponse.json({item});
      }
      return NextResponse.json({error:"Unsupported structure type."},{status:400});
    }
    return NextResponse.json({error:"Unsupported action."},{status:400});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to save.";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"This academic record already exists."},{status:409});
    return NextResponse.json({error:"Unable to save academic structure."},{status:500});
  }
}

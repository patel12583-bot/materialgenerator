import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function password(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let raw="";
  for(let i=0;i<10;i++) raw+=chars[Math.floor(Math.random()*chars.length)];
  return raw.slice(0,5)+"#"+raw.slice(5);
}

export async function GET(){
  const session=await getCurrentUser();
  if(!session || !["ADMIN","SUPER_ADMIN","HOD"].includes(session.role))
    return NextResponse.json({error:"Unauthorized"},{status:401});

  const where:any={user:{institutionId:session.institutionId}};
  if(session.role==="HOD" && session.departmentId) where.user.departmentId=session.departmentId;

  const faculty=await prisma.faculty.findMany({
    where,
    include:{user:{select:{id:true,username:true,email:true,phone:true,active:true,departmentId:true}}},
    orderBy:{name:"asc"}
  });

  const departments=await prisma.department.findMany({
    where:{institutionId:session.institutionId},
    select:{id:true,name:true,code:true},
    orderBy:{code:"asc"}
  });

  return NextResponse.json({faculty,departments});
}

export async function POST(req:Request){
  const session=await getCurrentUser();
  if(!session || !["ADMIN","SUPER_ADMIN"].includes(session.role))
    return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    const employeeCode=String(body.employeeCode||"").trim().toUpperCase();
    const phone=String(body.phone||"").replace(/\D/g,"");
    const email=String(body.email||"").trim().toLowerCase()||null;
    const departmentId=String(body.departmentId||"").trim();

    if(!name || !employeeCode || !departmentId)
      return NextResponse.json({error:"Name, employee code and department are required."},{status:400});
    if(phone && phone.length!==10)
      return NextResponse.json({error:"Faculty mobile must contain 10 digits."},{status:400});

    const department=await prisma.department.findFirst({where:{id:departmentId,institutionId:session.institutionId}});
    if(!department) return NextResponse.json({error:"Invalid department."},{status:400});

    const existingCode=await prisma.faculty.findUnique({where:{employeeCode}});
    if(existingCode) return NextResponse.json({error:"Employee code already exists."},{status:409});

    const username=employeeCode.toLowerCase();
    const existingUser=await prisma.user.findUnique({where:{username}});
    if(existingUser) return NextResponse.json({error:"A login account already exists for this employee code."},{status:409});

    const rawPassword=password();
    const passwordHash=await bcrypt.hash(rawPassword,12);

    const created=await prisma.$transaction(async tx=>{
      const user=await tx.user.create({
        data:{
          institutionId:session.institutionId,
          departmentId,
          username,
          email,
          phone:phone||null,
          passwordHash,
          role:"FACULTY",
          active:true
        }
      });
      const faculty=await tx.faculty.create({
        data:{userId:user.id,employeeCode,name,phone:phone||null}
      });
      await tx.auditLog.create({
        data:{
          actorId:session.userId,
          action:"CREATE",
          entity:"Faculty",
          entityId:faculty.id,
          after:{name,employeeCode,departmentId,email,phone:phone||null}
        }
      });
      return faculty;
    });

    return NextResponse.json({ok:true,faculty:created,credentials:{username,password:rawPassword}},{status:201});
  }catch(error){
    console.error("faculty create error",error);
    return NextResponse.json({error:"Unable to create faculty account."},{status:500});
  }
}

export async function PATCH(req:Request){
  const session=await getCurrentUser();
  if(!session || !["ADMIN","SUPER_ADMIN"].includes(session.role))
    return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const id=String(body.id||"");
    const existing=await prisma.faculty.findFirst({where:{id,user:{institutionId:session.institutionId}},include:{user:true}});
    if(!existing) return NextResponse.json({error:"Faculty not found."},{status:404});

    const name=String(body.name||"").trim();
    const phone=String(body.phone||"").replace(/\D/g,"");
    const email=String(body.email||"").trim().toLowerCase()||null;
    const departmentId=String(body.departmentId||"").trim();

    if(!name || !departmentId) return NextResponse.json({error:"Name and department are required."},{status:400});
    if(phone && phone.length!==10) return NextResponse.json({error:"Faculty mobile must contain 10 digits."},{status:400});
    const department=await prisma.department.findFirst({where:{id:departmentId,institutionId:session.institutionId}});
    if(!department) return NextResponse.json({error:"Invalid department."},{status:400});

    const faculty=await prisma.$transaction(async tx=>{
      const updated=await tx.faculty.update({where:{id},data:{name,phone:phone||null}});
      await tx.user.update({where:{id:existing.userId},data:{departmentId,email,phone:phone||null}});
      await tx.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Faculty",entityId:id,before:{name:existing.name,phone:existing.phone,departmentId:existing.user.departmentId},after:{name,phone:phone||null,departmentId,email}}});
      return updated;
    });
    return NextResponse.json({ok:true,faculty});
  }catch(error){
    console.error("faculty update error",error);
    return NextResponse.json({error:"Unable to update faculty."},{status:500});
  }
}

export async function DELETE(req:Request){
  const session=await getCurrentUser();
  if(!session || !["ADMIN","SUPER_ADMIN"].includes(session.role))
    return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const id=String(body.id||"");
    const existing=await prisma.faculty.findFirst({where:{id,user:{institutionId:session.institutionId}},include:{user:true}});
    if(!existing) return NextResponse.json({error:"Faculty not found."},{status:404});

    await prisma.$transaction(async tx=>{
      await tx.user.update({where:{id:existing.userId},data:{active:false}});
      await tx.auditLog.create({data:{actorId:session.userId,action:"DEACTIVATE",entity:"Faculty",entityId:id,before:{active:existing.user.active},after:{active:false}}});
    });
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("faculty deactivate error",error);
    return NextResponse.json({error:"Unable to deactivate faculty."},{status:500});
  }
}

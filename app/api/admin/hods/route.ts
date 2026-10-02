import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function allowed(role:string){return role==="ADMIN"||role==="SUPER_ADMIN";}

export async function GET(){
  const session=await getCurrentUser();
  if(!session||!allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const [hods,departments]=await Promise.all([
    prisma.user.findMany({
      where:{institutionId:session.institutionId,role:"HOD"},
      orderBy:{username:"asc"},
      select:{id:true,username:true,email:true,phone:true,active:true,departmentId:true,department:{select:{id:true,name:true,code:true}}}
    }),
    prisma.department.findMany({where:{institutionId:session.institutionId},orderBy:{code:"asc"},select:{id:true,name:true,code:true}})
  ]);
  return NextResponse.json({hods,departments});
}

export async function POST(req:Request){
  const session=await getCurrentUser();
  if(!session||!allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const body=await req.json();
    const action=String(body.action||"");
    const userId=String(body.userId||"");
    if(action==="toggle"||action==="reset-password"){
      if(!userId||userId===session.userId) return NextResponse.json({error:"Invalid HOD account."},{status:400});
      const target=await prisma.user.findFirst({where:{id:userId,institutionId:session.institutionId,role:"HOD"}});
      if(!target) return NextResponse.json({error:"HOD account not found."},{status:404});
      if(action==="toggle"){
        const updated=await prisma.user.update({where:{id:userId},data:{active:!target.active}});
        await prisma.auditLog.create({data:{actorId:session.userId,action:updated.active?"ACTIVATE_HOD":"DEACTIVATE_HOD",entity:"User",entityId:userId,before:{active:target.active},after:{active:updated.active}}});
        return NextResponse.json({ok:true,active:updated.active});
      }
      const password=String(body.password||"");
      if(password.length<8)return NextResponse.json({error:"New password must contain at least 8 characters."},{status:400});
      await prisma.user.update({where:{id:userId},data:{passwordHash:await bcrypt.hash(password,12)}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"RESET_HOD_PASSWORD",entity:"User",entityId:userId,after:{passwordReset:true}}});
      return NextResponse.json({ok:true});
    }

    const username=String(body.username||"").trim();
    const password=String(body.password||"");
    const email=String(body.email||"").trim().toLowerCase()||null;
    const phone=String(body.phone||"").replace(/\D/g,"");
    const departmentId=String(body.departmentId||"");
    if(!username||password.length<8||!departmentId)return NextResponse.json({error:"Username, password and department are required."},{status:400});
    if(phone&&phone.length!==10)return NextResponse.json({error:"Mobile number must be 10 digits."},{status:400});
    const department=await prisma.department.findFirst({where:{id:departmentId,institutionId:session.institutionId}});
    if(!department)return NextResponse.json({error:"Department not found."},{status:404});
    const existing=await prisma.user.findUnique({where:{username}});
    if(existing)return NextResponse.json({error:"Username already exists."},{status:409});
    const created=await prisma.user.create({data:{institutionId:session.institutionId,departmentId,username,email,phone:phone||null,passwordHash:await bcrypt.hash(password,12),role:"HOD",active:true}});
    await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE_HOD",entity:"User",entityId:created.id,after:{username,departmentId,email,phone:phone||null}}});
    return NextResponse.json({ok:true,hod:created},{status:201});
  }catch(e){
    return NextResponse.json({error:"Unable to complete HOD account action."},{status:500});
  }
}
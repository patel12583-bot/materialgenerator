import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function allowed(role:string){ return role==="ADMIN" || role==="SUPER_ADMIN"; }
function generatePassword(){ const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; let raw=""; for(let i=0;i<10;i++) raw+=chars[Math.floor(Math.random()*chars.length)]; return raw.slice(0,5)+"#"+raw.slice(5); }
async function generateStudentId(code:string){ const year=new Date().getFullYear(); for(let i=0;i<20;i++){ const id=`NOBLE-${code.toUpperCase()}-${year}-${Math.floor(1000+Math.random()*9000)}`; if(!(await prisma.student.findUnique({where:{enrollmentNo:id}}))) return id; } throw new Error("Unable to generate a unique student ID."); }

export async function GET(req:Request){
  const session=await getCurrentUser();
  if(!session || !allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=new URL(req.url);
  const q=(url.searchParams.get("q")||"").trim();

  const divisions=await prisma.division.findMany({
    where:{semester:{program:{department:{institutionId:session.institutionId}}}},
    orderBy:[{semester:{program:{code:"asc"}}},{semester:{number:"asc"}},{name:"asc"}],
    include:{semester:{include:{program:true}}}
  });

  const students=await prisma.student.findMany({
    where:{
      division:{semester:{program:{department:{institutionId:session.institutionId}}}},
      ...(q?{OR:[
        {name:{contains:q,mode:"insensitive"}},
        {enrollmentNo:{contains:q,mode:"insensitive"}},
        {rollNo:{contains:q,mode:"insensitive"}}
      ]}:{})
    },
    orderBy:[{division:{semester:{program:{code:"asc"}}}},{division:{semester:{number:"asc"}}},{rollNo:"asc"}],
    include:{division:{include:{semester:{include:{program:true}}}},user:{select:{id:true,active:true,email:true,phone:true,passwordHash:true}}}
  });

  return NextResponse.json({divisions,students:students.map(s=>({...s,user:{...s.user,passwordConfigured:Boolean(s.user.passwordHash),passwordHash:undefined}}))});
}

export async function POST(req:Request){
  const session=await getCurrentUser();
  if(!session || !allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    let enrollmentNo=String(body.enrollmentNo||"").trim();
    const rollNo=String(body.rollNo||"").trim();
    const divisionId=String(body.divisionId||"");
    const phone=String(body.phone||"").replace(/\D/g,"");
    const parentPhone=String(body.parentPhone||"").replace(/\D/g,"");
    const email=String(body.email||"").trim()||null;

    if(!name || !rollNo || !divisionId)
      return NextResponse.json({error:"Name, roll number and division are required. Enrollment number can be left blank for automatic generation."},{status:400});
    if(phone && phone.length!==10) return NextResponse.json({error:"Student mobile must be 10 digits."},{status:400});
    if(parentPhone && parentPhone.length!==10) return NextResponse.json({error:"Parent mobile must be 10 digits."},{status:400});

    const division=await prisma.division.findFirst({
      where:{id:divisionId,semester:{program:{department:{institutionId:session.institutionId}}}},
    });
    if(!division) return NextResponse.json({error:"Division not found."},{status:404});

    const program=await prisma.semester.findUnique({where:{id:division.semesterId},include:{program:true}});
    if(!program) return NextResponse.json({error:"Academic program not found."},{status:404});
    if(!enrollmentNo) enrollmentNo=await generateStudentId(program.program.code);
    const existing=await prisma.student.findFirst({where:{OR:[{enrollmentNo},{divisionId,rollNo}]}});
    if(existing) return NextResponse.json({error:"A student with this enrollment number or roll number already exists."},{status:409});

    const generatedPassword=generatePassword();
    const passwordHash=await bcrypt.hash(generatedPassword,12);
    const user=await prisma.user.create({
      data:{
        institutionId:session.institutionId,
        departmentId:(await prisma.semester.findUnique({where:{id:division.semesterId},include:{program:true}}))?.program.departmentId,
        username:enrollmentNo,
        email,
        phone:phone||null,
        role:"STUDENT",
        active:true,
        passwordHash,
        student:{create:{divisionId,enrollmentNo,rollNo,name,phone:phone||null,parentPhone:parentPhone||null}}
      },
      include:{student:true}
    });
    return NextResponse.json({student:user.student,credentials:{studentId:enrollmentNo,password:generatedPassword}},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"Enrollment number, username or roll number already exists."},{status:409});
    return NextResponse.json({error:"Unable to create student."},{status:500});
  }
}


export async function PATCH(req:Request){
  const session=await getCurrentUser(); if(!session||!allowed(session.role))return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const body=await req.json(); const studentId=String(body.studentId||"");
    if(!studentId)return NextResponse.json({error:"Student ID is required."},{status:400});
    const existing=await prisma.student.findFirst({where:{id:studentId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},include:{user:true}});
    if(!existing)return NextResponse.json({error:"Student not found."},{status:404});
    const name=String(body.name||"").trim(), rollNo=String(body.rollNo||"").trim(), divisionId=String(body.divisionId||existing.divisionId);
    const phone=String(body.phone||"").replace(/\D/g,""), parentPhone=String(body.parentPhone||"").replace(/\D/g,""), email=String(body.email||"").trim()||null;
    if(!name||!rollNo||!divisionId)return NextResponse.json({error:"Name, roll number and division are required."},{status:400});
    if(phone&&phone.length!==10)return NextResponse.json({error:"Student mobile must be 10 digits."},{status:400});
    if(parentPhone&&parentPhone.length!==10)return NextResponse.json({error:"Parent mobile must be 10 digits."},{status:400});
    const division=await prisma.division.findFirst({where:{id:divisionId,semester:{program:{department:{institutionId:session.institutionId}}}}});
    if(!division)return NextResponse.json({error:"Division not found."},{status:404});
    const duplicate=await prisma.student.findFirst({where:{id:{not:studentId},divisionId,rollNo}});
    if(duplicate)return NextResponse.json({error:"Another student already uses this roll number in the selected division."},{status:409});
    const updated=await prisma.$transaction(async tx=>{
      const student=await tx.student.update({where:{id:studentId},data:{name,rollNo,divisionId,phone:phone||null,parentPhone:parentPhone||null,status}});
      await tx.user.update({where:{id:existing.userId},data:{email,phone:phone||null,active:status==="ACTIVE"}});
      await tx.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Student",entityId:student.id,reason:"Student master record updated",before:JSON.parse(JSON.stringify(existing)),after:JSON.parse(JSON.stringify(student))}});
      return student;
    });
    return NextResponse.json({student:updated});
  }catch(error){return NextResponse.json({error:"Unable to update student."},{status:500});}
}

export async function PUT(req:Request){
  const session=await getCurrentUser(); if(!session||!allowed(session.role))return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const studentId=String(new URL(req.url).searchParams.get("studentId")||"");
    if(!studentId)return NextResponse.json({error:"Student ID is required."},{status:400});
    const existing=await prisma.student.findFirst({where:{id:studentId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},include:{user:true}});
    if(!existing)return NextResponse.json({error:"Student not found."},{status:404});
    const student=await prisma.$transaction(async tx=>{
      const s=await tx.student.update({where:{id:studentId},data:{status:"ACTIVE"}});
      await tx.user.update({where:{id:existing.userId},data:{active:true}});
      await tx.auditLog.create({data:{actorId:session.userId,action:"ACTIVATE",entity:"Student",entityId:studentId,reason:"Student account reactivated",before:JSON.parse(JSON.stringify(existing)),after:JSON.parse(JSON.stringify(student))}});
      return s;
    });
    return NextResponse.json({student,message:"Student account reactivated."});
  }catch(error){return NextResponse.json({error:"Unable to reactivate student."},{status:500});}
}

export async function DELETE(req:Request){
  const session=await getCurrentUser(); if(!session||!allowed(session.role))return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const studentId=String(new URL(req.url).searchParams.get("studentId")||"");
    if(!studentId)return NextResponse.json({error:"Student ID is required."},{status:400});
    const existing=await prisma.student.findFirst({where:{id:studentId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},include:{user:true}});
    if(!existing)return NextResponse.json({error:"Student not found."},{status:404});
    await prisma.$transaction(async tx=>{
      await tx.student.update({where:{id:studentId},data:{status:"INACTIVE"}});
      await tx.user.update({where:{id:existing.userId},data:{active:false}});
      await tx.auditLog.create({data:{actorId:session.userId,action:"DEACTIVATE",entity:"Student",entityId:studentId,reason:"Student account deactivated",before:JSON.parse(JSON.stringify(existing)),after:{...JSON.parse(JSON.stringify(existing)),status:"INACTIVE"}}});
    });
    return NextResponse.json({ok:true,message:"Student account deactivated."});
  }catch(error){return NextResponse.json({error:"Unable to deactivate student."},{status:500});}
}

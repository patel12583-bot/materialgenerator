import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const staff = new Set(["ADMIN","SUPER_ADMIN","HOD"]);

async function scopedStudent(session:any, studentId?:string){
  if(session.role==="STUDENT"){
    return prisma.student.findFirst({
      where:{userId:session.userId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},
      include:{user:{select:{email:true,phone:true,active:true}},division:{include:{semester:{include:{program:{include:{department:true}}}}}},documents:{orderBy:{uploadedAt:"desc"}}}
    });
  }
  if(!studentId) return null;
  return prisma.student.findFirst({
    where:{id:studentId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},
    include:{user:{select:{email:true,phone:true,active:true}},division:{include:{semester:{include:{program:{include:{department:true}}}}}},documents:{orderBy:{uploadedAt:"desc"}}}
  });
}

export async function GET(req:Request){
  const session=await getCurrentUser();
  if(!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=new URL(req.url);
  const student=await scopedStudent(session,url.searchParams.get("studentId")||undefined);
  if(!student) return NextResponse.json({error:"Student profile not found."},{status:404});
  if(session.role!=="STUDENT"&&!staff.has(session.role)) return NextResponse.json({error:"This profile is not available for your role."},{status:403});
  return NextResponse.json({student});
}

export async function PATCH(req:Request){
  const session=await getCurrentUser();
  if(!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json();
  const studentId=session.role==="STUDENT"
    ? (await prisma.student.findUnique({where:{userId:session.userId},select:{id:true}}))?.id
    : String(body.studentId||"");
  if(!studentId) return NextResponse.json({error:"Student ID is required."},{status:400});
  if(session.role!=="STUDENT"&&!staff.has(session.role)) return NextResponse.json({error:"You do not have permission to edit this profile."},{status:403});
  const existing=await scopedStudent(session,studentId);
  if(!existing) return NextResponse.json({error:"Student profile not found."},{status:404});

  const clean=(v:any)=>String(v??"").trim()||null;
  const phone=String(body.phone??"").replace(/\D/g,"");
  if(phone && phone.length!==10) return NextResponse.json({error:"Student mobile must be 10 digits."},{status:400});
  const pin=String(body.pinCode??"").replace(/\D/g,"");
  if(pin && pin.length!==6) return NextResponse.json({error:"PIN code must be 6 digits."},{status:400});

  const data:any={
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    gender:clean(body.gender), bloodGroup:clean(body.bloodGroup),
    address:clean(body.address), city:clean(body.city), state:clean(body.state),
    pinCode:pin||null, phone:phone||null, parentPhone:String(body.parentPhone??"").replace(/\D/g,"")||null
  };
  if(session.role!=="STUDENT"){
    data.name=String(body.name||existing.name).trim();
    data.rollNo=String(body.rollNo||existing.rollNo).trim();
    if(body.status) data.status=body.status;
  }
  const updated=await prisma.$transaction(async tx=>{
    const s=await tx.student.update({where:{id:studentId},data,include:{documents:true}});
    await tx.user.update({where:{id:s.userId},data:{phone:s.phone}});
    await tx.auditLog.create({data:{actorId:session.userId,action:"UPDATE",entity:"Student",entityId:s.id,reason:"Profile updated",before:JSON.parse(JSON.stringify(existing)),after:JSON.parse(JSON.stringify(s))}});
    return s;
  });
  return NextResponse.json({student:updated,message:"Student profile updated successfully."});
}

export async function POST(req:Request){
  const session=await getCurrentUser();
  if(!session||!staff.has(session.role)) return NextResponse.json({error:"Only administration can add student documents."},{status:403});
  const body=await req.json();
  const studentId=String(body.studentId||"");
  const type=String(body.type||"").trim();
  const name=String(body.name||"").trim();
  const fileUrl=String(body.fileUrl||"").trim()||null;
  if(!studentId||!type||!name) return NextResponse.json({error:"Student, document type and document name are required."},{status:400});
  const student=await scopedStudent(session,studentId);
  if(!student) return NextResponse.json({error:"Student not found."},{status:404});
  const doc=await prisma.studentDocument.create({data:{studentId,type,name,fileUrl}});
  return NextResponse.json({document:doc,message:"Document added successfully."},{status:201});
}
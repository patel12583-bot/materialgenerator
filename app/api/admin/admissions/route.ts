import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const staff = ["ADMIN","SUPER_ADMIN"];
const roles = ["ADMIN","SUPER_ADMIN"];

function password() {
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let raw="";
  for(let i=0;i<10;i++) raw+=chars[Math.floor(Math.random()*chars.length)];
  return raw.slice(0,5)+"#"+raw.slice(5);
}
async function uniqueNo(prefix:string, field:"applicationNo"|"admissionNo") {
  const year=new Date().getFullYear();
  for(let i=0;i<30;i++){
    const value=`${prefix}-${year}-${Math.floor(1000+Math.random()*9000)}`;
    const found=await prisma.admissionApplication.findFirst({where:{[field]:value}});
    if(!found) return value;
  }
  throw new Error("Unable to generate a unique number.");
}

export async function GET(req:Request) {
  const session=await getCurrentUser();
  if(!session || !roles.includes(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=new URL(req.url);
  const q=(url.searchParams.get("q")||"").trim();
  const status=url.searchParams.get("status")||"";
  const [applications, divisions, departments, programs] = await Promise.all([
    prisma.admissionApplication.findMany({
      where:{
        institutionId:session.institutionId,
        ...(status?{status:status as any}:{}),
        ...(q?{OR:[
          {applicationNo:{contains:q,mode:"insensitive"}},
          {admissionNo:{contains:q,mode:"insensitive"}},
          {name:{contains:q,mode:"insensitive"}},
          {phone:{contains:q}}
        ]}:{})
      },
      orderBy:{appliedAt:"desc"},
      take:200,
      include:{
        department:{select:{id:true,name:true,code:true}},
        program:{select:{id:true,name:true,code:true}},
        semester:{select:{id:true,number:true}},
        division:{select:{id:true,name:true}},
        documents:true,
        student:{select:{id:true,enrollmentNo:true,name:true}}
      }
    }),
    prisma.division.findMany({
      where:{semester:{program:{department:{institutionId:session.institutionId}}}},
      orderBy:[{semester:{program:{code:"asc"}}},{semester:{number:"asc"}},{name:"asc"}],
      include:{semester:{include:{program:{include:{department:true}}}}}
    }),
    prisma.department.findMany({where:{institutionId:session.institutionId},orderBy:{name:"asc"}}),
    prisma.program.findMany({where:{department:{institutionId:session.institutionId}},orderBy:{name:"asc"}})
  ]);
  return NextResponse.json({applications,divisions,departments,programs});
}

export async function POST(req:Request) {
  const session=await getCurrentUser();
  if(!session || !staff.includes(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const body=await req.json();
    const action=String(body.action||"");

    if(action==="create") {
      const name=String(body.name||"").trim();
      const email=String(body.email||"").trim()||null;
      const phone=String(body.phone||"").replace(/\D/g,"");
      const parentName=String(body.parentName||"").trim()||null;
      const parentPhone=String(body.parentPhone||"").replace(/\D/g,"");
      const departmentId=String(body.departmentId||"");
      const programId=String(body.programId||"");
      const semesterId=String(body.semesterId||"");
      const divisionId=String(body.divisionId||"");
      if(!name||!departmentId||!programId||!semesterId||!divisionId) return NextResponse.json({error:"Name, department, program, semester and division are required."},{status:400});
      if(phone && phone.length!==10) return NextResponse.json({error:"Applicant mobile must be 10 digits."},{status:400});
      if(parentPhone && parentPhone.length!==10) return NextResponse.json({error:"Parent mobile must be 10 digits."},{status:400});
      const division=await prisma.division.findFirst({
        where:{id:divisionId,semesterId,semester:{programId,program:{departmentId,institutionId:session.institutionId}}}
      });
      if(!division) return NextResponse.json({error:"Selected academic structure is invalid."},{status:400});
      const applicationNo=await uniqueNo("APP","applicationNo");
      const app=await prisma.admissionApplication.create({
        data:{institutionId:session.institutionId,applicationNo,name,email,phone:phone||null,parentName,parentPhone:parentPhone||null,departmentId,programId,semesterId,divisionId},
        include:{department:true,program:true,semester:true,division:true,documents:true}
      });
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"AdmissionApplication",entityId:app.id,reason:"Admission application created",after:app as any}});
      return NextResponse.json({application:app}, {status:201});
    }

    const id=String(body.applicationId||"");
    if(!id) return NextResponse.json({error:"Application ID is required."},{status:400});
    const existing=await prisma.admissionApplication.findFirst({
      where:{id,institutionId:session.institutionId},
      include:{documents:true}
    });
    if(!existing) return NextResponse.json({error:"Admission application not found."},{status:404});

    if(action==="add-document") {
      const type=String(body.type||"").trim();
      const name=String(body.name||"").trim();
      const fileUrl=String(body.fileUrl||"").trim();
      if(!type||!name||!fileUrl) return NextResponse.json({error:"Document type, name and file are required."},{status:400});
      const doc=await prisma.admissionDocument.create({data:{applicationId:id,type,name,fileUrl,verified:false}});
      if(existing.status==="APPLIED") await prisma.admissionApplication.update({where:{id},data:{status:"DOCUMENT_VERIFICATION"}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"UPLOAD",entity:"AdmissionDocument",entityId:doc.id,reason:"Admission document uploaded"}});
      return NextResponse.json({document:doc},{status:201});
    }

    if(action==="verify-document") {
      const documentId=String(body.documentId||"");
      const verified=Boolean(body.verified);
      const note=String(body.note||"").trim()||null;
      const doc=await prisma.admissionDocument.findFirst({where:{id:documentId,applicationId:id}});
      if(!doc) return NextResponse.json({error:"Document not found."},{status:404});
      const updated=await prisma.admissionDocument.update({where:{id:documentId},data:{verified,verificationNote:note}});
      const docs=await prisma.admissionDocument.findMany({where:{applicationId:id}});
      const allVerified=docs.length>0 && docs.every(x=>x.verified);
      await prisma.admissionApplication.update({where:{id},data:{status:allVerified?"APPROVED":"DOCUMENT_VERIFICATION",verifiedAt:allVerified?new Date():null}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:verified?"VERIFY":"UNVERIFY",entity:"AdmissionDocument",entityId:documentId,reason:note||"Document verification updated"}});
      return NextResponse.json({document:updated,allVerified});
    }

    if(action==="reject") {
      const reason=String(body.reason||"").trim();
      if(!reason) return NextResponse.json({error:"Rejection reason is required."},{status:400});
      const updated=await prisma.admissionApplication.update({where:{id},data:{status:"REJECTED",rejectionReason:reason}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"REJECT",entity:"AdmissionApplication",entityId:id,reason}});
      return NextResponse.json({application:updated});
    }

    if(action==="approve") {
      if(existing.status==="REJECTED" || existing.status==="ENROLLED") return NextResponse.json({error:"This application cannot be approved in its current status."},{status:400});
      const docs=await prisma.admissionDocument.findMany({where:{applicationId:id}});
      if(!docs.length || docs.some(x=>!x.verified)) return NextResponse.json({error:"Every required admission document must be verified before approval."},{status:400});
      const admissionNo=existing.admissionNo || await uniqueNo("ADM","admissionNo");
      const generatedPassword=password();
      const passwordHash=await bcrypt.hash(generatedPassword,12);
      const result=await prisma.$transaction(async tx=>{
        let studentId=existing.studentId;
        if(!studentId) {
          const user=await tx.user.create({
            data:{
              institutionId:session.institutionId,
              departmentId:existing.departmentId,
              username:admissionNo,
              email:existing.email,
              phone:existing.phone,
              passwordHash,
              role:"STUDENT",
              active:true,
              student:{create:{
                divisionId:existing.divisionId,
                enrollmentNo:admissionNo,
                rollNo:"PENDING",
                name:existing.name,
                phone:existing.phone,
                parentPhone:existing.parentPhone,
                dateOfBirth:existing.dateOfBirth,
                gender:existing.gender,
                address:existing.address
              }}
            },
            include:{student:true}
          });
          if(!user.student) throw new Error("Student profile creation failed.");
          studentId=user.student.id;
        }
        const app=await tx.admissionApplication.update({
          where:{id},
          data:{admissionNo,studentId,status:"ENROLLED",approvedAt:new Date(),enrolledAt:new Date()},
          include:{documents:true,student:true}
        });
        await tx.auditLog.create({data:{actorId:session.userId,action:"ENROLL",entity:"AdmissionApplication",entityId:id,reason:"Admission approved and student account created",after:app as any}});
        return app;
      });
      return NextResponse.json({application:result,credentials:{studentId:admissionNo,password:generatedPassword}});
    }

    return NextResponse.json({error:"Unknown admission action."},{status:400});
  } catch(error) {
    const message=error instanceof Error?error.message:"";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"A generated application/admission number already exists. Please retry."},{status:409});
    return NextResponse.json({error:"Unable to process admission workflow."},{status:500});
  }
}

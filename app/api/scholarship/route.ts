import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const adminRoles = ["ADMIN","SUPER_ADMIN"];

function positiveInt(v: unknown) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
function percentage(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (adminRoles.includes(session.role)) {
      const url = new URL(req.url), status = url.searchParams.get("status") || "", q = (url.searchParams.get("q") || "").trim();
      const [programs, applications] = await Promise.all([
        prisma.scholarshipProgram.findMany({
          where:{institutionId:session.institutionId}, orderBy:[{academicYear:"desc"},{deadline:"asc"}],
          include:{_count:{select:{applications:true}}}
        }),
        prisma.scholarshipApplication.findMany({
          where:{scholarship:{institutionId:session.institutionId}, ...(status?{status:status as any}:{}),
            ...(q?{OR:[
              {student:{name:{contains:q,mode:"insensitive"}}},
              {student:{enrollmentNo:{contains:q,mode:"insensitive"}}},
              {scholarship:{name:{contains:q,mode:"insensitive"}}}
            ]}: {})},
          orderBy:{appliedAt:"desc"}, take:500,
          include:{scholarship:true,student:{select:{id:true,name:true,enrollmentNo:true,rollNo:true,division:{select:{name:true,semester:{select:{number:true,program:{select:{name:true,code:true}}}}}}}}}
        })
      ]);
      return NextResponse.json({programs,applications});
    }

    let studentIds:string[]=[];
    if(session.role==="STUDENT"){
      const student=await prisma.student.findUnique({where:{userId:session.userId},select:{id:true}});
      if(student) studentIds=[student.id];
    } else if(session.role==="PARENT"){
      const parent=await prisma.parent.findUnique({where:{userId:session.userId},include:{children:{select:{studentId:true}}}});
      studentIds=parent?.children.map(x=>x.studentId)||[];
    } else return NextResponse.json({error:"Forbidden"},{status:403});

    const [programs,applications]=await Promise.all([
      prisma.scholarshipProgram.findMany({where:{institutionId:session.institutionId,active:true,deadline:{gte:new Date()}},orderBy:{deadline:"asc"}}),
      prisma.scholarshipApplication.findMany({where:{studentId:{in:studentIds},scholarship:{institutionId:session.institutionId}},orderBy:{appliedAt:"desc"},include:{scholarship:true,student:{select:{id:true,name:true,enrollmentNo:true}}}})
    ]);
    return NextResponse.json({programs,applications});
  } catch { return NextResponse.json({error:"Unable to load scholarship data."},{status:500}); }
}

export async function POST(req:Request){
  const session=await getCurrentUser();
  if(!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const body=await req.json(), action=String(body.action||"");

    if(adminRoles.includes(session.role)&&action==="create-program"){
      const name=String(body.name||"").trim(), code=String(body.code||"").trim().toUpperCase(), description=String(body.description||"").trim()||null;
      const academicYear=String(body.academicYear||"").trim(), maxAwardAmount=positiveInt(body.maxAwardAmount);
      const incomeLimit=body.incomeLimit===""||body.incomeLimit==null?null:positiveInt(body.incomeLimit);
      const minimumPercentage=body.minimumPercentage===""||body.minimumPercentage==null?null:percentage(body.minimumPercentage);
      const deadline=new Date(String(body.deadline||""));
      if(!name||!code||!academicYear||maxAwardAmount===null||Number.isNaN(deadline.getTime())) return NextResponse.json({error:"Complete scholarship program details are required."},{status:400});
      const exists=await prisma.scholarshipProgram.findFirst({where:{institutionId:session.institutionId,code,academicYear}});
      if(exists)return NextResponse.json({error:"A scholarship with this code already exists for this academic year."},{status:409});
      const item=await prisma.scholarshipProgram.create({data:{institutionId:session.institutionId,name,code,description,academicYear,maxAwardAmount,incomeLimit,minimumPercentage,deadline}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"ScholarshipProgram",entityId:item.id,reason:"Scholarship program created",after:item as any}});
      return NextResponse.json({item},{status:201});
    }

    if(adminRoles.includes(session.role)&&action==="toggle-program"){
      const programId=String(body.programId||"");
      const program=await prisma.scholarshipProgram.findFirst({where:{id:programId,institutionId:session.institutionId}});
      if(!program)return NextResponse.json({error:"Scholarship program not found."},{status:404});
      const item=await prisma.scholarshipProgram.update({where:{id:programId},data:{active:!program.active}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"TOGGLE",entity:"ScholarshipProgram",entityId:item.id,reason:item.active?"Scholarship opened":"Scholarship closed"}});
      return NextResponse.json({item});
    }

    if(adminRoles.includes(session.role)&&action==="review"){
      const applicationId=String(body.applicationId||""), status=String(body.status||""), reviewNote=String(body.reviewNote||"").trim()||null;
      if(!["APPROVED","REJECTED","UNDER_REVIEW"].includes(status))return NextResponse.json({error:"Invalid review status."},{status:400});
      const application=await prisma.scholarshipApplication.findFirst({where:{id:applicationId,scholarship:{institutionId:session.institutionId}},include:{scholarship:true}});
      if(!application)return NextResponse.json({error:"Scholarship application not found."},{status:404});
      const awardedAmount=status==="APPROVED"?Math.min(positiveInt(body.awardedAmount)??application.amountRequested,application.scholarship.maxAwardAmount):null;
      if(status==="APPROVED"&&awardedAmount<=0)return NextResponse.json({error:"Awarded amount must be greater than zero."},{status:400});
      const item=await prisma.scholarshipApplication.update({where:{id:applicationId},data:{status:status as any,awardedAmount,reviewNote,reviewedAt:new Date()}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:status,entity:"ScholarshipApplication",entityId:item.id,reason:reviewNote||"Scholarship application reviewed",after:item as any}});
      return NextResponse.json({item});
    }

    if(session.role==="STUDENT"&&action==="apply"){
      const scholarshipId=String(body.scholarshipId||""), amountRequested=positiveInt(body.amountRequested);
      const householdIncome=body.householdIncome===""||body.householdIncome==null?null:positiveInt(body.householdIncome);
      const academicPercentage=body.academicPercentage===""||body.academicPercentage==null?null:percentage(body.academicPercentage);
      const category=String(body.category||"").trim()||null, statement=String(body.statement||"").trim()||null;
      if(!scholarshipId||amountRequested===null||amountRequested<=0)return NextResponse.json({error:"Scholarship and requested amount are required."},{status:400});
      const student=await prisma.student.findFirst({where:{userId:session.userId,status:"ACTIVE",division:{semester:{program:{department:{institutionId:session.institutionId}}}}}});
      const scholarship=await prisma.scholarshipProgram.findFirst({where:{id:scholarshipId,institutionId:session.institutionId,active:true}});
      if(!student||!scholarship)return NextResponse.json({error:"You are not eligible to submit this application."},{status:400});
      if(scholarship.deadline.getTime()<Date.now())return NextResponse.json({error:"The scholarship application deadline has passed."},{status:400});
      if(amountRequested>scholarship.maxAwardAmount)return NextResponse.json({error:"Requested amount cannot exceed the scholarship maximum award."},{status:400});
      if(scholarship.incomeLimit!==null&&(householdIncome===null||householdIncome>scholarship.incomeLimit))return NextResponse.json({error:"Household income does not meet this scholarship's eligibility limit."},{status:400});
      if(scholarship.minimumPercentage!==null&&(academicPercentage===null||academicPercentage<scholarship.minimumPercentage))return NextResponse.json({error:"Academic percentage does not meet this scholarship's minimum requirement."},{status:400});
      const duplicate=await prisma.scholarshipApplication.findUnique({where:{scholarshipId_studentId:{scholarshipId,studentId:student.id}}});
      if(duplicate&&duplicate.status!=="REJECTED")return NextResponse.json({error:"You already have an active application for this scholarship."},{status:409});
      const item=duplicate?await prisma.scholarshipApplication.update({where:{id:duplicate.id},data:{amountRequested,householdIncome,academicPercentage,category,statement,status:"PENDING",reviewNote:null,reviewedAt:null,awardedAmount:null,appliedAt:new Date()}}):await prisma.scholarshipApplication.create({data:{scholarshipId,studentId:student.id,amountRequested,householdIncome,academicPercentage,category,statement}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"APPLY",entity:"ScholarshipApplication",entityId:item.id,reason:"Student scholarship application submitted"}});
      return NextResponse.json({item},{status:duplicate?200:201});
    }

    return NextResponse.json({error:"Unknown scholarship action."},{status:400});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message.includes("Unique constraint"))return NextResponse.json({error:"This scholarship application already exists."},{status:409});
    return NextResponse.json({error:"Unable to process scholarship workflow."},{status:500});
  }
}

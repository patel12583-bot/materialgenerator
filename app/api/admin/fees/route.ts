import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const adminRoles = ["ADMIN","SUPER_ADMIN"];

function money(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

async function receiptNo() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 40; i++) {
    const value = `RCT-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    const found = await prisma.feePayment.findUnique({ where: { receiptNo: value } });
    if (!found) return value;
  }
  throw new Error("Unable to generate a unique receipt number.");
}

function statusFor(total:number, paid:number, due:Date) {
  if (paid >= total) return "PAID" as const;
  if (paid > 0) return "PARTIAL" as const;
  return due.getTime() < Date.now() ? "OVERDUE" as const : "PENDING" as const;
}

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({error:"Unauthorized"}, {status:401});
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const status = url.searchParams.get("status") || "";

    if (adminRoles.includes(session.role)) {
      const [structures, fees, programs, semesters, students] = await Promise.all([
        prisma.feeStructure.findMany({
          where:{institutionId:session.institutionId},
          orderBy:[{academicYear:"desc"},{createdAt:"desc"}],
          include:{program:{select:{id:true,name:true,code:true}},semester:{select:{id:true,number:true}}}
        }),
        prisma.studentFee.findMany({
          where:{
            student:{division:{semester:{program:{department:{institutionId:session.institutionId}}}}},
            ...(status ? {status: status as any} : {}),
            ...(q ? {student:{AND:[
              {division:{semester:{program:{department:{institutionId:session.institutionId}}}}},
              {OR:[{name:{contains:q,mode:"insensitive"}},{enrollmentNo:{contains:q,mode:"insensitive"}}]}
            ]}} : {})
          },
          orderBy:{assignedAt:"desc"},
          take:300,
          include:{
            student:{select:{id:true,name:true,enrollmentNo:true,rollNo:true,phone:true,division:{include:{semester:{include:{program:true}}}}}},
            feeStructure:{include:{program:{select:{name:true,code:true}},semester:{select:{number:true}}}},
            payments:{orderBy:{paidAt:"desc"},include:{recordedBy:{select:{username:true}}}}
          }
        }),
        prisma.program.findMany({where:{department:{institutionId:session.institutionId}},orderBy:{code:"asc"},include:{department:{select:{code:true,name:true}},semesters:{orderBy:{number:"asc"}}}}),
        prisma.semester.findMany({where:{program:{department:{institutionId:session.institutionId}}},orderBy:[{program:{code:"asc"}},{number:"asc"}],include:{program:{select:{id:true,name:true,code:true}}}}),
        prisma.student.findMany({where:{division:{semester:{program:{department:{institutionId:session.institutionId}}}},status:"ACTIVE"},orderBy:{rollNo:"asc"},take:500,select:{id:true,name:true,enrollmentNo:true,rollNo:true,division:{select:{name:true,semester:{select:{number:true,program:{select:{id:true,name:true,code:true}}}}}}}})
        ]);
      return NextResponse.json({structures,fees,programs,semesters,students});
    }

    let studentIds:string[] = [];
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({where:{userId:session.userId},select:{id:true}});
      if (student) studentIds=[student.id];
    } else if (session.role === "PARENT") {
      const parent = await prisma.parent.findUnique({where:{userId:session.userId},include:{children:{select:{studentId:true}}}});
      studentIds = parent?.children.map(x=>x.studentId) || [];
    } else {
      return NextResponse.json({error:"Forbidden"}, {status:403});
    }

    const fees = await prisma.studentFee.findMany({
      where:{studentId:{in:studentIds}},
      orderBy:{assignedAt:"desc"},
      include:{
        student:{select:{id:true,name:true,enrollmentNo:true}},
        feeStructure:{include:{program:{select:{name:true,code:true}},semester:{select:{number:true}}}},
        payments:{orderBy:{paidAt:"desc"},include:{recordedBy:{select:{username:true}}}}
      }
    });
    return NextResponse.json({structures:[],fees});
  } catch {
    return NextResponse.json({error:"Unable to load fees."}, {status:500});
  }
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || !adminRoles.includes(session.role)) return NextResponse.json({error:"Unauthorized"}, {status:401});

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create-structure") {
      const programId = String(body.programId || "");
      const semesterId = String(body.semesterId || "");
      const name = String(body.name || "").trim();
      const academicYear = String(body.academicYear || "").trim();
      const dueDate = new Date(String(body.dueDate || ""));
      const tuitionFee = money(body.tuitionFee), examFee = money(body.examFee), libraryFee = money(body.libraryFee);
      const labFee = money(body.labFee), otherFee = money(body.otherFee);
      if (!programId || !semesterId || !name || !academicYear || Number.isNaN(dueDate.getTime()) ||
          [tuitionFee,examFee,libraryFee,labFee,otherFee].some(x=>x===null)) {
        return NextResponse.json({error:"Complete fee structure details are required."},{status:400});
      }
      const semester = await prisma.semester.findFirst({
        where:{id:semesterId,programId,program:{department:{institutionId:session.institutionId}}}
      });
      if (!semester) return NextResponse.json({error:"Invalid program or semester."},{status:400});
      const item = await prisma.feeStructure.create({
        data:{institutionId:session.institutionId,programId,semesterId,name,academicYear,dueDate,
          tuitionFee:tuitionFee!,examFee:examFee!,libraryFee:libraryFee!,labFee:labFee!,otherFee:otherFee!}
      });
      await prisma.auditLog.create({data:{actorId:session.userId,action:"CREATE",entity:"FeeStructure",entityId:item.id,after:item as any}});
      return NextResponse.json({item},{status:201});
    }

    if (action === "assign") {
      const feeStructureId = String(body.feeStructureId || "");
      const studentId = String(body.studentId || "");
      const discountAmount = money(body.discountAmount) ?? 0;
      const scholarshipAmount = money(body.scholarshipAmount) ?? 0;
      const structure = await prisma.feeStructure.findFirst({where:{id:feeStructureId,institutionId:session.institutionId,active:true}});
      const student = await prisma.student.findFirst({where:{id:studentId,division:{semester:{program:{department:{institutionId:session.institutionId}}}}},include:{division:{include:{semester:true}}}});
      if (!structure || !student) return NextResponse.json({error:"Invalid fee structure or student."},{status:400});
      if (student.division.semester.id !== structure.semesterId) return NextResponse.json({error:"Fee structure semester does not match the student's semester."},{status:400});
      const gross = structure.tuitionFee + structure.examFee + structure.libraryFee + structure.labFee + structure.otherFee;
      if (discountAmount + scholarshipAmount > gross) return NextResponse.json({error:"Discount and scholarship cannot exceed the total fee."},{status:400});
      const net = gross - discountAmount - scholarshipAmount;
      const existing = await prisma.studentFee.findUnique({where:{studentId_feeStructureId:{studentId,feeStructureId}}});
      const item = existing
        ? await prisma.studentFee.update({where:{id:existing.id},data:{totalAmount:gross,discountAmount,scholarshipAmount,balanceAmount:Math.max(0,net-existing.paidAmount),dueDate:structure.dueDate,status:statusFor(net,existing.paidAmount,structure.dueDate)}})
        : await prisma.studentFee.create({data:{studentId,feeStructureId,totalAmount:gross,discountAmount,scholarshipAmount,balanceAmount:net,dueDate:structure.dueDate,status:statusFor(net,0,structure.dueDate)}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:existing?"UPDATE":"CREATE",entity:"StudentFee",entityId:item.id,reason:"Fee assigned to student",after:item as any}});
      return NextResponse.json({item},{status:existing?200:201});
    }

    if (action === "payment") {
      const studentFeeId = String(body.studentFeeId || "");
      const amount = money(body.amount);
      const method = String(body.method || "").trim();
      const reference = String(body.reference || "").trim() || null;
      const note = String(body.note || "").trim() || null;
      if (!studentFeeId || amount === null || amount <= 0 || !method) return NextResponse.json({error:"Valid payment amount and payment method are required."},{status:400});
      const fee = await prisma.studentFee.findFirst({where:{id:studentFeeId,student:{division:{semester:{program:{department:{institutionId:session.institutionId}}}}}}});
      if (!fee) return NextResponse.json({error:"Fee record not found."},{status:404});
      const net = fee.totalAmount - fee.discountAmount - fee.scholarshipAmount;
      const balance = Math.max(0,net-fee.paidAmount);
      if (amount > balance) return NextResponse.json({error:`Payment exceeds the outstanding balance of ₹${balance.toLocaleString("en-IN")}.`},{status:400});
      const receipt = await receiptNo();
      const result = await prisma.$transaction(async tx=>{
        const payment = await tx.feePayment.create({data:{studentFeeId,receiptNo:receipt,amount,method,reference,note,recordedById:session.userId}});
        const paid = fee.paidAmount + amount;
        const updated = await tx.studentFee.update({where:{id:studentFeeId},data:{paidAmount:paid,balanceAmount:net-paid,status:statusFor(net,paid,fee.dueDate)}});
        await tx.auditLog.create({data:{actorId:session.userId,action:"PAYMENT",entity:"FeePayment",entityId:payment.id,reason:`Fee payment ${receipt}`,after:{payment,updated} as any}});
        return {payment,updated};
      });
      return NextResponse.json({payment:result.payment,fee:result.updated},{status:201});
    }

    if (action === "adjust") {
      const studentFeeId = String(body.studentFeeId || "");
      const discountAmount = money(body.discountAmount) ?? 0;
      const scholarshipAmount = money(body.scholarshipAmount) ?? 0;
      const fee = await prisma.studentFee.findFirst({where:{id:studentFeeId,student:{division:{semester:{program:{department:{institutionId:session.institutionId}}}}}}});
      if (!fee) return NextResponse.json({error:"Fee record not found."},{status:404});
      const net=fee.totalAmount-discountAmount-scholarshipAmount;
      if(net<fee.paidAmount) return NextResponse.json({error:"Adjustment cannot reduce the payable amount below payments already received."},{status:400});
      const updated=await prisma.studentFee.update({where:{id:studentFeeId},data:{discountAmount,scholarshipAmount,balanceAmount:net-fee.paidAmount,status:statusFor(net,fee.paidAmount,fee.dueDate)}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"ADJUST",entity:"StudentFee",entityId:studentFeeId,reason:"Fee discount/scholarship adjusted",after:updated as any}});
      return NextResponse.json({fee:updated});
    }

    return NextResponse.json({error:"Unknown fee action."},{status:400});
  } catch (error) {
    const message=error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint")) return NextResponse.json({error:"This fee assignment or receipt number already exists."},{status:409});
    return NextResponse.json({error:"Unable to process fee workflow."},{status:500});
  }
}

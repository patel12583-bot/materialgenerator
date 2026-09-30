import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function allowed(role:string){ return role==="ADMIN" || role==="SUPER_ADMIN"; }

export async function GET(req:Request){
  const session=await getSession();
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
    include:{division:{include:{semester:{include:{program:true}}}},user:{select:{active:true,email:true,phone:true,passwordHash:true}}}
  });

  return NextResponse.json({divisions,students:students.map(s=>({...s,user:{...s.user,passwordConfigured:Boolean(s.user.passwordHash),passwordHash:undefined}}))});
}

export async function POST(req:Request){
  const session=await getSession();
  if(!session || !allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    const enrollmentNo=String(body.enrollmentNo||"").trim();
    const rollNo=String(body.rollNo||"").trim();
    const divisionId=String(body.divisionId||"");
    const phone=String(body.phone||"").replace(/\D/g,"");
    const parentPhone=String(body.parentPhone||"").replace(/\D/g,"");
    const email=String(body.email||"").trim()||null;

    if(!name || !enrollmentNo || !rollNo || !divisionId)
      return NextResponse.json({error:"Name, enrollment number, roll number and division are required."},{status:400});
    if(phone && phone.length!==10) return NextResponse.json({error:"Student mobile must be 10 digits."},{status:400});
    if(parentPhone && parentPhone.length!==10) return NextResponse.json({error:"Parent mobile must be 10 digits."},{status:400});

    const division=await prisma.division.findFirst({
      where:{id:divisionId,semester:{program:{department:{institutionId:session.institutionId}}}},
    });
    if(!division) return NextResponse.json({error:"Division not found."},{status:404});

    const existing=await prisma.student.findFirst({where:{OR:[{enrollmentNo},{divisionId,rollNo}]}});
    if(existing) return NextResponse.json({error:"A student with this enrollment number or roll number already exists."},{status:409});

    const user=await prisma.user.create({
      data:{
        institutionId:session.institutionId,
        departmentId:(await prisma.semester.findUnique({where:{id:division.semesterId},include:{program:true}}))?.program.departmentId,
        username:enrollmentNo,
        email,
        phone:phone||null,
        role:"STUDENT",
        active:true,
        student:{create:{divisionId,enrollmentNo,rollNo,name,phone:phone||null,parentPhone:parentPhone||null}}
      },
      include:{student:true}
    });
    return NextResponse.json({student:user.student},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"Enrollment number, username or roll number already exists."},{status:409});
    return NextResponse.json({error:"Unable to create student."},{status:500});
  }
}

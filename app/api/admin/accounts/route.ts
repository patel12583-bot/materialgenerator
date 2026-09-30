import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function allowed(role:string){ return role==="ADMIN" || role==="SUPER_ADMIN"; }

export async function GET(){
  const session=await getSession();
  if(!session || !allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});

  const [faculty,admins,departments]=await Promise.all([
    prisma.faculty.findMany({
      where:{user:{institutionId:session.institutionId}},
      orderBy:{name:"asc"},
      include:{user:{select:{username:true,email:true,phone:true,active:true,department:{select:{name:true,code:true}}}}}
    }),
    prisma.user.findMany({
      where:{institutionId:session.institutionId,role:"ADMIN"},
      orderBy:{username:"asc"},
      select:{id:true,username:true,email:true,phone:true,active:true,department:{select:{name:true,code:true}}}
    }),
    prisma.department.findMany({
      where:{institutionId:session.institutionId},
      orderBy:{code:"asc"},
      select:{id:true,name:true,code:true}
    })
  ]);

  return NextResponse.json({faculty,admins,departments});
}

export async function POST(req:Request){
  const session=await getSession();
  if(!session || !allowed(session.role)) return NextResponse.json({error:"Unauthorized"},{status:401});

  try{
    const body=await req.json();
    const type=String(body.type||"").toUpperCase();
    const username=String(body.username||"").trim();
    const password=String(body.password||"");
    const email=String(body.email||"").trim()||null;
    const phone=String(body.phone||"").replace(/\D/g,"");
    const departmentId=String(body.departmentId||"").trim()||null;

    if(!["FACULTY","ADMIN"].includes(type)) return NextResponse.json({error:"Invalid account type."},{status:400});
    if(!username || password.length<8) return NextResponse.json({error:"Username and password of at least 8 characters are required."},{status:400});
    if(phone && phone.length!==10) return NextResponse.json({error:"Mobile number must be 10 digits."},{status:400});

    if(departmentId){
      const department=await prisma.department.findFirst({where:{id:departmentId,institutionId:session.institutionId}});
      if(!department) return NextResponse.json({error:"Department not found."},{status:404});
    }

    const hash=await bcrypt.hash(password,12);

    if(type==="ADMIN"){
      const user=await prisma.user.create({
        data:{institutionId:session.institutionId,departmentId,username,email,phone:phone||null,passwordHash:hash,role:"ADMIN",active:true}
      });
      return NextResponse.json({id:user.id,username:user.username,role:user.role},{status:201});
    }

    const name=String(body.name||"").trim();
    const employeeCode=String(body.employeeCode||"").trim();
    if(!name || !employeeCode) return NextResponse.json({error:"Faculty name and employee code are required."},{status:400});

    const user=await prisma.user.create({
      data:{
        institutionId:session.institutionId,
        departmentId,
        username,
        email,
        phone:phone||null,
        passwordHash:hash,
        role:"FACULTY",
        active:true,
        faculty:{create:{employeeCode,name,phone:phone||null}}
      },
      include:{faculty:true}
    });
    return NextResponse.json({id:user.faculty?.id,username:user.username,role:user.role},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(message.includes("Unique constraint")) return NextResponse.json({error:"Username or employee code already exists."},{status:409});
    return NextResponse.json({error:"Unable to create account."},{status:500});
  }
}

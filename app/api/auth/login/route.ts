import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const redirects: Record<string,string> = {
  ADMIN: "/admin",
  FACULTY: "/faculty",
  STUDENT: "/student",
};

const allowedRoles = new Set(["ADMIN", "FACULTY", "STUDENT"]);

export async function POST(req: Request){
  try{
    const {username,password,role}=await req.json();
    if(!username || !password || !role){
      return NextResponse.json({error:"Username, password and portal are required."},{status:400});
    }

    const normalized=String(role).toUpperCase();
    if(!allowedRoles.has(normalized)){
      return NextResponse.json({error:"This portal is not available for sign in."},{status:403});
    }

    const loginId=String(username).trim();
    if(!loginId){
      return NextResponse.json({error:"Username or enrollment number is required."},{status:400});
    }

    const user = normalized === "STUDENT"
      ? await prisma.user.findFirst({
          where:{
            OR:[
              {username:loginId},
              {student:{is:{enrollmentNo:loginId}}}
            ]
          }
        })
      : await prisma.user.findUnique({
          where:{username:loginId}
        });

    if(!user || !user.active || user.role !== normalized){
      return NextResponse.json({error:"Invalid credentials or portal."},{status:401});
    }

    if(!user.passwordHash || !(await bcrypt.compare(String(password),user.passwordHash))){
      return NextResponse.json({error:"Invalid credentials."},{status:401});
    }

    await createSession({
      userId:user.id,
      role:user.role,
      institutionId:user.institutionId,
      departmentId:user.departmentId
    });

    return NextResponse.json({redirect:redirects[user.role]});
  }catch(error){
    console.error("login error",error);
    return NextResponse.json({error:"Authentication service unavailable."},{status:500});
  }
}

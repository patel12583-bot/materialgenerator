import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const redirects:Record<string,string>={SUPER_ADMIN:"/super-admin",ADMIN:"/admin",HOD:"/hod",FACULTY:"/faculty",STUDENT:"/student",PARENT:"/parent"};
export async function POST(req:Request){
 try{
  const {username,password,role}=await req.json();
  if(!username||!password) return NextResponse.json({error:"Username and password are required."},{status:400});
  const normalized=String(role).toUpperCase();
  const user=await prisma.user.findUnique({where:{username:String(username).trim()}});
  if(!user||!user.active||user.role!==normalized) return NextResponse.json({error:"Invalid credentials or portal."},{status:401});
  if(!user.passwordHash || !(await bcrypt.compare(String(password),user.passwordHash))) return NextResponse.json({error:"Invalid credentials."},{status:401});
  await createSession({userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId});
  return NextResponse.json({redirect:redirects[user.role]||"/login"});
 }catch(error){console.error(error);return NextResponse.json({error:"Authentication service unavailable."},{status:500});}
}
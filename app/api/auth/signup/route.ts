import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function normalizeMobile(value:string){ return value.replace(/\D/g,"").replace(/^91(?=\d{10}$)/,""); }
function generatePassword(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let raw="";
  for(let i=0;i<10;i++) raw+=chars[Math.floor(Math.random()*chars.length)];
  return raw.slice(0,5)+"#"+raw.slice(5);
}

export async function POST(req:Request){
  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    const enrollment=String(body.enrollment||"").trim();
    const mobile=normalizeMobile(String(body.mobile||""));
    const email=String(body.email||"").trim().toLowerCase();

    if(!name || !enrollment || !mobile) return NextResponse.json({error:"Full name, enrollment number and mobile number are required."},{status:400});
    if(!/^\d{10}$/.test(mobile)) return NextResponse.json({error:"Enter a valid 10-digit mobile number."},{status:400});

    const student=await prisma.student.findUnique({
      where:{enrollmentNo:enrollment},
      include:{user:true}
    });
    if(!student) return NextResponse.json({error:"Enrollment number was not found in Noble's student records. Contact Admin."},{status:404});
    if(student.user.passwordHash) return NextResponse.json({error:"An account already exists for this enrollment number."},{status:409});

    const registeredMobile=normalizeMobile(student.phone||"");
    if(registeredMobile && registeredMobile!==mobile) return NextResponse.json({error:"This mobile number does not match the mobile number registered by Noble administration."},{status:403});

    const password=generatePassword();
    const hash=await bcrypt.hash(password,12);
    await prisma.$transaction([
      prisma.user.update({where:{id:student.userId},data:{username:student.enrollmentNo,email:email||student.user.email,phone:mobile,passwordHash:hash,role:"STUDENT",active:true}}),
      prisma.student.update({where:{id:student.id},data:{name,phone:mobile}})
    ]);

    return NextResponse.json({ok:true,studentId:student.enrollmentNo,password,name:student.name,message:"Account created. Save the generated credentials before leaving this page."});
  }catch(error){
    console.error("signup error",error);
    return NextResponse.json({error:"Account service unavailable. Please try again."},{status:503});
  }
}

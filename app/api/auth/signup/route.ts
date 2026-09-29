import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request){
  try{
    const body=await req.json();
    const method=String(body.method||"");
    const name=String(body.name||"").trim();
    const enrollment=String(body.enrollment||"").trim();
    const mobile=String(body.mobile||"").trim();
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");

    if(!["enrollment","mobile"].includes(method)) return NextResponse.json({error:"Choose a supported verification method."},{status:400});
    if(!name || !mobile || password.length<8) return NextResponse.json({error:"Name, mobile and an 8+ character password are required."},{status:400});

    const student=method==="enrollment" ? await prisma.student.findUnique({
      where:{enrollmentNo:enrollment},
      include:{user:true,division:{include:{semester:{include:{program:{include:{department:true}}}}}}}
    }) : null;

    if(method==="enrollment"){
      if(!student) return NextResponse.json({error:"Enrollment number was not found in Noble's student records. Contact Admin."},{status:404});
      if(student.userId && student.user.passwordHash) return NextResponse.json({error:"An account already exists for this enrollment number."},{status:409});

      const hash=await bcrypt.hash(password,12);
      await prisma.user.update({where:{id:student.userId},data:{
        username:student.enrollmentNo,
        email:email||student.user.email,
        phone:mobile,
        passwordHash:hash,
        role:"STUDENT",
        active:true
      }});
      await prisma.student.update({where:{id:student.id},data:{name,phone:mobile}});
      return NextResponse.json({message:"Student account created. You can now sign in with your enrollment number."});
    }

    return NextResponse.json({error:"Mobile OTP signup requires an SMS provider and OTP verification before an account can be created."},{status:501});
  }catch(error){
    console.error("signup error",error);
    return NextResponse.json({error:"Account service unavailable. Please try again."},{status:503});
  }
}
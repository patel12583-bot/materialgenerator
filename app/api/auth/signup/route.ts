import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function normalizeMobile(value:string){
  return value.replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"");
}

export async function POST(req: Request){
  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    const enrollment=String(body.enrollment||"").trim();
    const mobile=normalizeMobile(String(body.mobile||""));
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");

    if(!name || !enrollment || !mobile || password.length<8){
      return NextResponse.json(
        {error:"Full name, enrollment number, mobile number and an 8+ character password are required."},
        {status:400}
      );
    }

    if(!/^\d{10}$/.test(mobile)){
      return NextResponse.json({error:"Enter a valid 10-digit mobile number."},{status:400});
    }

    const student=await prisma.student.findUnique({
      where:{enrollmentNo:enrollment},
      include:{
        user:true,
        division:{include:{semester:{include:{program:{include:{department:true}}}}}}
      }
    });

    if(!student){
      return NextResponse.json(
        {error:"Enrollment number was not found in Noble's student records. Contact Admin."},
        {status:404}
      );
    }

    if(student.user.passwordHash){
      return NextResponse.json(
        {error:"An account already exists for this enrollment number."},
        {status:409}
      );
    }

    const registeredMobile=normalizeMobile(student.phone||"");
    if(registeredMobile && registeredMobile !== mobile){
      return NextResponse.json(
        {error:"This mobile number does not match the mobile number registered by Noble administration."},
        {status:403}
      );
    }

    const hash=await bcrypt.hash(password,12);

    await prisma.$transaction([
      prisma.user.update({
        where:{id:student.userId},
        data:{
          username:student.enrollmentNo,
          email:email||student.user.email,
          phone:mobile,
          passwordHash:hash,
          role:"STUDENT",
          active:true
        }
      }),
      prisma.student.update({
        where:{id:student.id},
        data:{name,phone:mobile}
      })
    ]);

    return NextResponse.json({
      message:"Student account created successfully. You can now sign in with your enrollment number."
    });
  }catch(error){
    console.error("signup error",error);
    return NextResponse.json({error:"Account service unavailable. Please try again."},{status:503});
  }
}

import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const leaveId=new URL(req.url).searchParams.get("leaveId");
  if(!leaveId) return NextResponse.json({error:"Leave id is required."},{status:400});
  const leave=await prisma.leaveRequest.findFirst({where:{id:leaveId,student:{division:{semester:{program:{department:{institutionId:user.institutionId}}}}}},include:{student:{select:{userId:true}}}});
  if(!leave?.documentUrl) return NextResponse.json({error:"Document not found."},{status:404});
  if(user.role==="STUDENT" && leave.student.userId!==user.userId) return NextResponse.json({error:"Forbidden"},{status:403});
  if(!["ADMIN","SUPER_ADMIN","FACULTY","HOD","STUDENT"].includes(user.role)) return NextResponse.json({error:"Forbidden"},{status:403});
  try{
    const result=await get(leave.documentUrl,{access:"private"});
    return new Response(result.stream,{headers:{"Content-Type":result.blob.contentType||"application/octet-stream","Cache-Control":"private, no-store"}});
  }catch(error){console.error("leave document error",error);return NextResponse.json({error:"Unable to read document."},{status:500});}
}

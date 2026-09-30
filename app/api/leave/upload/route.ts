import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  if(user.role!=="STUDENT") return NextResponse.json({error:"Only students can upload leave documents."},{status:403});
  try{
    const form=await req.formData();
    const file=form.get("file");
    if(!(file instanceof File)) return NextResponse.json({error:"Document file is required."},{status:400});
    if(file.size>10*1024*1024) return NextResponse.json({error:"Document must be 10 MB or smaller."},{status:400});
    const allowed=["application/pdf","image/jpeg","image/png"];
    if(!allowed.includes(file.type)) return NextResponse.json({error:"Only PDF, JPG or PNG documents are allowed."},{status:400});
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const blob=await put(`leave-documents/${user.institutionId}/${user.userId}-${Date.now()}-${safe}`,file,{access:"private",addRandomSuffix:false});
    return NextResponse.json({pathname:blob.pathname});
  }catch(error){console.error("leave upload error",error);return NextResponse.json({error:"Unable to upload document."},{status:500});}
}

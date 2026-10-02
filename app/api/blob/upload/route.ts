import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const allowedRoles = new Set(["ADMIN","SUPER_ADMIN","HOD","FACULTY","STUDENT","PARENT"]);
const allowedContentTypes = [
  "application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg","image/png","image/webp","application/zip"
];

function safe(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,"_");}

export async function POST(request:Request){
  const user=await getCurrentUser();
  if(!user || !allowedRoles.has(user.role)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const body=(await request.json()) as HandleUploadBody;
    const result=await handleUpload({
      body,request,
      onBeforeGenerateToken:async(pathname)=>{
        const filename=safe(pathname.split("/").pop()||"file");
        return {
          allowedContentTypes,
          maximumSizeInBytes:25*1024*1024,
          addRandomSuffix:true,
          access:"private",
          pathname:`uploads/${user.institutionId}/${user.role.toLowerCase()}/${user.userId}-${Date.now()}-${filename}`,
        };
      },
      onUploadCompleted:async()=>{}
    });
    return NextResponse.json(result);
  }catch(error){
    console.error("blob client upload error",error);
    return NextResponse.json({error:"Vercel Blob upload authorization failed. Connect the Blob store to this Vercel project, then redeploy."},{status:503});
  }
}

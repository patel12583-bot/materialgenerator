import {handleUpload,type HandleUploadBody} from "@vercel/blob/client";
import {NextResponse} from "next/server";
export async function POST(request:Request){
 try{
  if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:"BLOB_READ_WRITE_TOKEN is missing. Create a Vercel Blob store and connect it to this project."},{status:503});
  const body=(await request.json()) as HandleUploadBody;
  const jsonResponse=await handleUpload({
   body,request,
   onBeforeGenerateToken:async()=>({
    allowedContentTypes:["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","text/plain","text/csv","text/markdown","image/jpeg","image/png","image/webp"],
    addRandomSuffix:true,
    tokenPayload:JSON.stringify({createdAt:Date.now()})
   }),
   onUploadCompleted:async()=>{}
  });
  return NextResponse.json(jsonResponse);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Blob upload failed."},{status:400})}
}
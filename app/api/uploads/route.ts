import { NextResponse } from "next/server";
import { put, get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const allowedRoles = new Set(["ADMIN","SUPER_ADMIN","HOD","FACULTY","STUDENT"]);
const maxSize = 25 * 1024 * 1024;

function safe(value:string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.has(user.role)) return NextResponse.json({error:"Unauthorized"},{status:401});

  try {
    const form = await req.formData();
    const file = form.get("file");
    const category = safe(String(form.get("category") || "general"));
    if (!(file instanceof File)) return NextResponse.json({error:"File is required."},{status:400});
    if (!file.size) return NextResponse.json({error:"The selected file is empty."},{status:400});
    if (file.size > maxSize) return NextResponse.json({error:"File must be 25 MB or smaller."},{status:400});

    const pathname = `uploads/${user.institutionId}/${category}/${user.userId}-${Date.now()}-${safe(file.name)}`;
    const blob = await put(pathname, file, {access:"private", addRandomSuffix:false});
    return NextResponse.json({
      ok:true,
      pathname:blob.pathname,
      filename:file.name,
      size:file.size,
      contentType:file.type || "application/octet-stream",
    },{status:201});
  } catch (error) {
    console.error("generic upload error", error);
    return NextResponse.json({error:"Upload failed. Configure a Vercel Blob store for this project and try again."},{status:500});
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const pathname = new URL(req.url).searchParams.get("pathname");
  if (!pathname || !pathname.startsWith(`uploads/${user.institutionId}/`)) {
    return NextResponse.json({error:"Invalid file."},{status:400});
  }
  try {
    const result = await get(pathname,{access:"private"});
    if (!result?.stream) return NextResponse.json({error:"File not found."},{status:404});
    return new Response(result.stream,{headers:{
      "Content-Type":result.blob.contentType || "application/octet-stream",
      "Content-Disposition":`attachment; filename="${safe(result.blob.pathname.split("/").pop() || "download")}"`,
      "Cache-Control":"private, no-store"
    }});
  } catch {
    return NextResponse.json({error:"Unable to read file."},{status:404});
  }
}

import { NextResponse } from "next/server";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { PDFParse } from "pdf-parse";
import JSZip from "jszip";
import {get} from "@vercel/blob";
export const runtime="nodejs";
const MAX=4*1024*1024;
function chunks(text:string,size=1400){const clean=text.replace(/\r/g,"").trim();const out:string[]=[];for(let i=0;i<clean.length;i+=size)out.push(clean.slice(i,i+size));return out.filter(Boolean)}
async function pptxText(buf:Buffer){const zip=await JSZip.loadAsync(buf);const names=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));let out="";for(const n of names){const xml=await zip.files[n].async("text");const t=[...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map(m=>m[1]).join(" ");out+="\n\n["+n.replace(".xml","")+"]\n"+t}return out}
async function imageOCR(file:File){const key=process.env.AI_API_KEY;if(!key)return "";const b64=Buffer.from(await file.arrayBuffer()).toString("base64");const mime=file.type||"image/png";const r=await fetch(process.env.AI_BASE_URL||"https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.AI_VISION_MODEL||process.env.AI_MODEL||"gpt-4o-mini",messages:[{role:"user",content:[{type:"text",text:"Extract all readable text from this study-material image. Preserve headings, questions, tables and order. Return only extracted text."},{type:"image_url",image_url:{url:"data:"+mime+";base64,"+b64}}]}],temperature:0})});if(!r.ok)throw new Error("Vision OCR failed");const j=await r.json();return j.choices?.[0]?.message?.content||""}
export async function POST(req:Request){
 try{
  const ct=req.headers.get("content-type")||"";
  let file:File;
  if(ct.includes("application/json")){
   const b=await req.json();
   const url=String(b.url||"");
   const name=String(b.name||"source");
   if(!url)return NextResponse.json({error:"Missing source URL."},{status:400});
   if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:"Large-file storage is not configured. Add BLOB_READ_WRITE_TOKEN."},{status:503});
   const stored=await get(url,{access:"private"});
   if(!stored||stored.statusCode!==200)throw new Error("Stored document could not be read.");
   const ab=await new Response(stored.stream).arrayBuffer();
   file=new File([ab],name,{type:String(b.type||stored.headers?.get("content-type")||"application/octet-stream")});
  }else{
   const form=await req.formData();
   const value=form.get("file");
   if(!(value instanceof File))return NextResponse.json({error:"Please select a file."},{status:400});
   file=value;
  }
  if(file.size>MAX)return NextResponse.json({error:"This upload path accepts files up to 4 MB. Larger files use Vercel Blob direct upload."},{status:413});
  const ext=file.name.toLowerCase().split(".").pop()||"";
  const buf=Buffer.from(await file.arrayBuffer());
  let text="";
  if(["txt","md","csv"].includes(ext))text=buf.toString("utf8");
  else if(["xlsx","xls"].includes(ext)){const wb=XLSX.read(buf);text=wb.SheetNames.map(s=>"## "+s+"\n"+XLSX.utils.sheet_to_csv(wb.Sheets[s])).join("\n\n")}
  else if(ext==="docx")text=(await mammoth.extractRawText({buffer:buf})).value;
  else if(ext==="pdf"){const parser=new PDFParse({data:buf});try{text=(await parser.getText()).text}finally{await parser.destroy()}}
  else if(ext==="pptx")text=await pptxText(buf);
  else if(["jpg","jpeg","png","webp"].includes(ext)){return NextResponse.json({error:"Image OCR needs AI vision configuration. Add AI_API_KEY before uploading images."},{status:503})}
  else return NextResponse.json({error:"Unsupported file type: ."+ext},{status:415});
  const clean=text.replace(/\u0000/g,"").trim();
  if(!clean)return NextResponse.json({error:"No readable text found in this file."},{status:422});
  const cs=chunks(clean);
  return NextResponse.json({ok:true,id:crypto.randomUUID(),name:file.name,size:file.size,type:file.type||ext,text:clean.slice(0,450000),chunks:cs.length,chunkList:cs.slice(0,300).map((content,i)=>({id:i+1,content}))});
 }catch(e){console.error("DOCUMENT_PROCESSING_ERROR",e);return NextResponse.json({error:e instanceof Error?e.message:"Document processing failed."},{status:500})}
}
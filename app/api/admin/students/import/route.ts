import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function generatePassword(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";let raw="";for(let i=0;i<10;i++)raw+=chars[Math.floor(Math.random()*chars.length)];return raw.slice(0,5)+"#"+raw.slice(5);}
async function generateStudentId(code:string){const year=new Date().getFullYear();for(let i=0;i<30;i++){const id=`NOBLE-${code.toUpperCase()}-${year}-${Math.floor(1000+Math.random()*9000)}`;if(!(await prisma.student.findUnique({where:{enrollmentNo:id}})))return id;}throw new Error("Unable to generate student ID.");}
function val(row:any,names:string[]){const key=Object.keys(row).find(k=>names.includes(k.toLowerCase().replace(/[ _-]/g,"")));return key?String(row[key]??"").trim():"";}
function norm(v:string){return v.toLowerCase().replace(/[ _-]/g,"");}

export async function POST(req:Request){
 const session=await getCurrentUser();if(!session||!["ADMIN","SUPER_ADMIN"].includes(session.role))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const form=await req.formData();const file=form.get("file");if(!(file instanceof File))return NextResponse.json({error:"Excel or CSV file is required."},{status:400});
  if(file.size>25*1024*1024)return NextResponse.json({error:"File must be 25 MB or smaller."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  const workbook=XLSX.read(bytes,{type:"buffer"});
  const sheet=workbook.Sheets[workbook.SheetNames[0]];if(!sheet)return NextResponse.json({error:"The spreadsheet has no sheet."},{status:400});
  const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:""});
  if(!rows.length)return NextResponse.json({error:"The spreadsheet is empty."},{status:400});

  const divisions=await prisma.division.findMany({where:{semester:{program:{department:{institutionId:session.institutionId}}}},include:{semester:{include:{program:true}}}});
  const divisionMap=new Map(divisions.map(d=>[`${norm(d.semester.program.code)}|${d.semester.number}|${norm(d.name)}`,d]));
  const existingRows=await prisma.student.findMany({where:{division:{semester:{program:{department:{institutionId:session.institutionId}}}}},select:{enrollmentNo:true}});
  const existing=new Set(existingRows.map(s=>s.enrollmentNo));
  const imported:any[]=[];const errors:string[]=[];
  for(let i=0;i<rows.length;i++){
   const row=rows[i];const line=i+2;
   const name=val(row,["name","fullname","studentname"]);
   let enrollment=val(row,["enrollmentno","enrollment","studentid","studentno"]);
   const roll=val(row,["rollno","roll","rollnumber"]);
   const program=val(row,["program","course","programme","programcode"]);
   const semester=val(row,["semester","sem"]);
   const divisionName=val(row,["division","div"]);
   const phone=val(row,["phone","mobile","studentmobile"]).replace(/\D/g,"");
   const parentPhone=val(row,["parentphone","parentmobile","guardianmobile"]).replace(/\D/g,"");
   const email=val(row,["email","studentemail"]).toLowerCase()||null;
   if(!name||!roll||!program||!semester||!divisionName){errors.push(`Row ${line}: name, roll number, program, semester and division are required.`);continue;}
   const division=divisionMap.get(`${norm(program)}|${Number(semester)}|${norm(divisionName)}`);
   if(!division){errors.push(`Row ${line}: class ${program} / Sem ${semester} / Div ${divisionName} was not found.`);continue;}
   if(!enrollment)enrollment=await generateStudentId(division.semester.program.code);
   if(existing.has(enrollment)){errors.push(`Row ${line}: enrollment ${enrollment} already exists.`);continue;}
   if(phone&&phone.length!==10){errors.push(`Row ${line}: invalid student mobile.`);continue;}
   if(parentPhone&&parentPhone.length!==10){errors.push(`Row ${line}: invalid parent mobile.`);continue;}
   existing.add(enrollment);
   const password=generatePassword();
   const passwordHash=await bcrypt.hash(password,12);
   try{
    const user=await prisma.user.create({data:{institutionId:session.institutionId,departmentId:division.semester.program.departmentId,username:enrollment,email,phone:phone||null,passwordHash,role:"STUDENT",active:true,student:{create:{divisionId:division.id,enrollmentNo:enrollment,rollNo:roll,name,phone:phone||null,parentPhone:parentPhone||null}}},include:{student:true}});
    imported.push({name,enrollmentNo:enrollment,rollNo:roll,program:division.semester.program.code,semester:division.semester.number,division:division.name,password});
   }catch(e){errors.push(`Row ${line}: could not create ${name}; record may already exist.`);}
  }
  return NextResponse.json({ok:true,importedCount:imported.length,skippedCount:errors.length,students:imported,errors},{status:imported.length?201:400});
 }catch(error){console.error("student import error",error);return NextResponse.json({error:"Unable to read this spreadsheet. Use CSV/XLSX with the required columns."},{status:400});}
}
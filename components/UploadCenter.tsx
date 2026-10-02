"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { CheckCircle2, Download, FileUp, UploadCloud } from "lucide-react";

type Role="Admin"|"Faculty"|"Student"|"HOD"|"Parent"|"Super Admin";
const options:Record<string,{key:string;title:string;text:string;accept:string}[]>={
 Admin:[
  {key:"students",title:"Student list",text:"Upload CSV or Excel student records.",accept:".csv,.xlsx,.xls"},
  {key:"timetable",title:"Master timetable",text:"Upload timetable sheets.",accept:".csv,.xlsx,.xls,.pdf"},
  {key:"attendance",title:"Attendance data",text:"Upload attendance reconciliation sheets.",accept:".csv,.xlsx,.xls,.pdf"},
  {key:"exam",title:"Exam documents",text:"Upload examination schedules and notices.",accept:".pdf,.csv,.xlsx,.xls,.doc,.docx"}
 ],
 Faculty:[
  {key:"attendance",title:"Attendance sheet",text:"Upload class attendance sheets.",accept:".csv,.xlsx,.xls,.pdf"},
  {key:"lecture-material",title:"Lecture material",text:"Upload notes, assignments and manuals.",accept:".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"},
  {key:"exam",title:"Exam documents",text:"Upload examination documents.",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png"}
 ],
 Student:[
  {key:"notes",title:"Student notes",text:"Upload notes for academic review.",accept:".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"},
  {key:"leave-document",title:"Leave document",text:"Upload supporting leave documents.",accept:".pdf,.jpg,.jpeg,.png"},
  {key:"exam-document",title:"Exam document",text:"Upload examination supporting documents.",accept:".pdf,.jpg,.jpeg,.png"}
 ],
 HOD:[
  {key:"attendance",title:"Department attendance",text:"Upload department reconciliation sheets.",accept:".csv,.xlsx,.xls,.pdf"},
  {key:"academic",title:"Academic documents",text:"Upload department academic documents.",accept:".pdf,.doc,.docx,.xlsx,.xls"}
 ],
 Parent:[{key:"supporting",title:"Supporting document",text:"Upload a supporting document.",accept:".pdf,.jpg,.jpeg,.png"}],
 "Super Admin":[{key:"institution",title:"Institution documents",text:"Upload institution-level records.",accept:".pdf,.doc,.docx,.xlsx,.xls,.csv"}]
};

export default function UploadCenter({role}:{role:Role}){
 const [category,setCategory]=useState("");const [busy,setBusy]=useState(false);const [progress,setProgress]=useState(0);const [message,setMessage]=useState("");const [path,setPath]=useState("");
 const list=options[role]||[];
 async function uploadFile(file:File){
  setBusy(true);setProgress(0);setMessage("");setPath("");
  try{
   const blob=await upload(file.name,file,{access:"private",handleUploadUrl:"/api/blob/upload",multipart:true,onUploadProgress:e=>setProgress(Math.round(e.percentage))});
   setMessage(file.name+" uploaded successfully.");setPath(blob.pathname);
  }catch(e){setMessage(e instanceof Error?e.message:"Upload failed.");}
  finally{setBusy(false)}
 }
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · UPLOAD CENTRE</span><h1>Upload <em>securely.</em></h1><p>Files go directly from your browser to private Blob storage.</p></div></div>
  <div className="uploadGrid">{list.map(x=><button type="button" className="uploadCard" key={x.key} disabled={busy} onClick={()=>{setCategory(x.key);setTimeout(()=>document.getElementById("secure-upload-input")?.click(),0)}}>
   <div className="uploadIcon"><FileUp size={20}/></div><b>{x.title}</b><p>{x.text}</p><small>{x.accept.replaceAll(","," · ")}</small><span>{busy&&category===x.key?"Uploading "+progress+"%…":"Choose file"} <UploadCloud size={14}/></span>
  </button>)}</div>
  <input id="secure-upload-input" hidden type="file" accept={list.find(x=>x.key===category)?.accept} onChange={e=>{const f=e.target.files?.[0];if(f)uploadFile(f);e.currentTarget.value=""}}/>
  {message&&<div className="card" style={{marginTop:14}}><CheckCircle2 size={17}/><b style={{marginLeft:8}}>{message}</b>{path&&<a className="secondaryBtn" style={{marginLeft:12,textDecoration:"none"}} href={"/api/uploads?pathname="+encodeURIComponent(path)}><Download size={14}/> Download</a>}</div>}
  <div className="card" style={{marginTop:14}}><span className="eyebrow">UPLOAD SAFETY</span><h2>Private by default.</h2><p className="quickText">Maximum file size is 25 MB. The storage credential stays on the server.</p></div>
 </div>
}

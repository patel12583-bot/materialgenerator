"use client";

import { useRef, useState } from "react";
import { Download, FileUp, CheckCircle2, UploadCloud } from "lucide-react";

type Role="Admin"|"Faculty"|"Student"|"HOD"|"Parent"|"Super Admin";

const options:Record<string,{key:string;title:string;text:string;accept:string}[]> = {
  Admin:[
    {key:"students",title:"Student list",text:"Upload CSV/Excel-exported CSV for student records and future import processing.",accept:".csv,.xlsx,.xls"},
    {key:"timetable",title:"Master timetable",text:"Upload timetable sheets for administration review.",accept:".csv,.xlsx,.xls,.pdf"},
    {key:"attendance",title:"Attendance data",text:"Upload attendance sheets for reconciliation and archival.",accept:".csv,.xlsx,.xls,.pdf"},
    {key:"exam",title:"Exam schedule / documents",text:"Upload examination schedules, notices and supporting files.",accept:".pdf,.csv,.xlsx,.xls,.doc,.docx"},
  ],
  Faculty:[
    {key:"attendance",title:"Attendance sheet",text:"Upload a class attendance sheet for reconciliation.",accept:".csv,.xlsx,.xls,.pdf"},
    {key:"lecture-material",title:"Lecture material",text:"Upload notes, assignments, practical manuals or lecture documents.",accept:".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"},
    {key:"exam",title:"Exam documents",text:"Upload exam instructions or supporting examination documents.",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png"},
  ],
  Student:[
    {key:"notes",title:"Student notes",text:"Upload notes or study documents for faculty/admin review.",accept:".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"},
    {key:"leave-document",title:"Leave document",text:"Upload a medical or supporting leave document.",accept:".pdf,.jpg,.jpeg,.png"},
    {key:"exam-document",title:"Exam document",text:"Upload an examination-related supporting document.",accept:".pdf,.jpg,.jpeg,.png"},
  ],
  HOD:[
    {key:"attendance",title:"Department attendance",text:"Upload department attendance reconciliation sheets.",accept:".csv,.xlsx,.xls,.pdf"},
    {key:"academic",title:"Academic documents",text:"Upload department schedules and academic documents.",accept:".pdf,.doc,.docx,.xlsx,.xls"},
  ],
  "Super Admin":[
    {key:"institution",title:"Institution documents",text:"Upload institution-level records and compliance documents.",accept:".pdf,.doc,.docx,.xlsx,.xls,.csv"},
  ],
};

export default function UploadCenter({role}:{role:Role}){
 const input=useRef<HTMLInputElement>(null);
 const [category,setCategory]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [downloadPath,setDownloadPath]=useState("");
 const list=options[role]||[];
 async function upload(file:File){
   setBusy(true);setMessage("");setDownloadPath("");
   const form=new FormData();form.append("file",file);form.append("category",category);
   try{
    const r=await fetch("/api/uploads",{method:"POST",body:form});const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Upload failed.");
    setMessage(`${d.filename} uploaded successfully.`);setDownloadPath(d.pathname);
   }catch(e){setMessage(e instanceof Error?e.message:"Upload failed.");}
   finally{setBusy(false);}
 }
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · UPLOAD CENTRE</span><h1>Upload <em>anything.</em></h1><p>Secure file intake for the academic workflows. Files are stored privately and remain behind authenticated access.</p></div></div>
  <div className="uploadGrid">{list.map(x=><button type="button" className="uploadCard" key={x.key} onClick={()=>{setCategory(x.key);input.current?.click()}} disabled={busy}>
   <div className="uploadIcon"><FileUp size={20}/></div><b>{x.title}</b><p>{x.text}</p><small>{x.accept.replaceAll(","," · ")}</small><span>{busy&&category===x.key?"Uploading…":"Choose file"} <UploadCloud size={14}/></span>
  </button>)}</div>
  <input ref={input} hidden type="file" accept={list.find(x=>x.key===category)?.accept||undefined} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.currentTarget.value=""}}/>
  {message&&<div className="card" style={{marginTop:14}}><CheckCircle2 size={17}/><b style={{marginLeft:8}}>{message}</b>{downloadPath&&<a className="secondaryBtn" style={{marginLeft:12,textDecoration:"none"}} href={"/api/uploads?pathname="+encodeURIComponent(downloadPath)}>Download uploaded file <Download size={14}/></a>}</div>}
  <div className="card" style={{marginTop:14}}><span className="eyebrow">UPLOAD SAFETY</span><h2>Private by default.</h2><p className="quickText">Maximum file size is 25 MB. Access is checked against the signed-in institution before a file can be downloaded.</p></div>
 </div>
}

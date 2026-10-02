"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Activity, CheckCircle2, FileCheck2, FileText, Loader2, Save, ShieldCheck, UploadCloud, UserRound, X } from "lucide-react";

type Props={studentId?:string;editable?:boolean};

const documentTypes=["Aadhaar / ID Proof","Birth Certificate","Passport Photo","Transfer Certificate","Leaving Certificate","Bonafide Certificate","Marksheet","Admission Form","Other"];

export default function StudentProfile({studentId,editable=true}:Props){
 const [student,setStudent]=useState<any>(null);
 const [form,setForm]=useState<any>({});
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState(false);
 const [verifying,setVerifying]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [docType,setDocType]=useState(documentTypes[0]);
 const [docFile,setDocFile]=useState<File|null>(null);

 async function load(){
  setLoading(true);setError("");
  try{
   const q=studentId?"?studentId="+encodeURIComponent(studentId):"";
   const r=await fetch("/api/student/profile"+q,{cache:"no-store"});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Unable to load profile.");
   setStudent(d.student);
   setForm({
    name:d.student.name,rollNo:d.student.rollNo,
    dateOfBirth:d.student.dateOfBirth?String(d.student.dateOfBirth).slice(0,10):"",
    gender:d.student.gender||"",bloodGroup:d.student.bloodGroup||"",
    address:d.student.address||"",city:d.student.city||"",state:d.student.state||"",
    pinCode:d.student.pinCode||"",phone:d.student.phone||"",parentPhone:d.student.parentPhone||"",
    status:d.student.status||"ACTIVE"
   });
  }catch(e){setError(e instanceof Error?e.message:"Unable to load profile.");}
  finally{setLoading(false)}
 }

 useEffect(()=>{load()},[studentId]);

 async function save(){
  setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/student/profile",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...form,studentId})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save profile.");
   setNotice(d.message||"Profile updated.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save profile.");}
  finally{setSaving(false)}
 }

 async function uploadDocument(){
  if(!docFile){setError("Select a document file first.");return}
  if(docFile.size>25*1024*1024){setError("Document must be 25 MB or smaller.");return}
  setUploading(true);setError("");setNotice("");
  try{
   const blob=await upload(docFile.name,docFile,{
    access:"private",
    handleUploadUrl:"/api/blob/upload",
    multipart:true,
  });
   const r=await fetch("/api/student/profile",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({studentId,type:docType,name:docFile.name,fileUrl:blob.url})
   });
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save document record.");
   setNotice(d.message||"Document uploaded.");
   setDocFile(null);
   const input=document.getElementById("student-document-file") as HTMLInputElement|null;
   if(input)input.value="";
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to upload document.");}
  finally{setUploading(false)}
 }

 async function verifyDocument(documentId:string,verified:boolean){
  setVerifying(documentId);setError("");setNotice("");
  try{
   const r=await fetch("/api/student/profile",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"verify",documentId,verified})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to update document verification.");
   setNotice(d.message||"Document status updated.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update document.");}
  finally{setVerifying("")}
 }

 if(loading)return <div className="card emptyState"><Activity size={18}/><span>Loading student profile…</span></div>;
 if(!student)return <div className="card errorState"><X size={18}/><span>{error||"Profile unavailable."}</span></div>;

 const set=(key:string,value:string)=>setForm((x:any)=>({...x,[key]:value}));
 const staffView=Boolean(studentId);

 return <div className="adminWorkspace">
  <div className="pageHead">
   <div><span className="eyebrow">STUDENT · MASTER PROFILE</span><h1>My <em>profile.</em></h1><p>A single verified profile for identity, academic placement, contact information and institutional documents.</p></div>
   {editable&&<button className="primary" onClick={save} disabled={saving}><Save size={15}/>{saving?"Saving…":"Save changes"}</button>}
  </div>

  {notice&&<div className="successState"><CheckCircle2 size={16}/><span>{notice}</span></div>}
  {error&&<div className="errorState"><X size={16}/><span>{error}</span></div>}

  <div className="profileGrid">
   <section className="card profileCard">
    <div className="profileIdentity">
     <div className="profileAvatar"><UserRound size={28}/></div>
     <div><h2>{student.name}</h2><p>{student.enrollmentNo} · Roll {student.rollNo}</p><span className={"status "+String(student.status).toLowerCase()}>{student.status}</span></div>
    </div>
    <div className="profileAcademic">
     <div><small>PROGRAM</small><b>{student.division.semester.program.name}</b></div>
     <div><small>SEMESTER</small><b>{student.division.semester.number}</b></div>
     <div><small>DIVISION</small><b>{student.division.name}</b></div>
     <div><small>DEPARTMENT</small><b>{student.division.semester.program.department.code}</b></div>
    </div>
   </section>

   <section className="card">
    <div className="sectionTitle"><UserRound size={17}/><div><b>Personal information</b><small>Identity and contact details</small></div></div>
    <div className="formGrid">
     <label>Full name<input value={form.name||""} disabled={staffView?!editable:false} onChange={e=>set("name",e.target.value)}/></label>
     <label>Roll number<input value={form.rollNo||""} disabled={staffView?!editable:false} onChange={e=>set("rollNo",e.target.value)}/></label>
     <label>Date of birth<input type="date" value={form.dateOfBirth||""} onChange={e=>set("dateOfBirth",e.target.value)} disabled={!editable}/></label>
     <label>Gender<select value={form.gender||""} onChange={e=>set("gender",e.target.value)} disabled={!editable}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
     <label>Blood group<input value={form.bloodGroup||""} onChange={e=>set("bloodGroup",e.target.value)} disabled={!editable} placeholder="B+"/></label>
     <label>Mobile<input value={form.phone||""} onChange={e=>set("phone",e.target.value)} disabled={!editable} placeholder="10 digit mobile"/></label>
     <label>Parent mobile<input value={form.parentPhone||""} onChange={e=>set("parentPhone",e.target.value)} disabled={!editable}/></label>
     <label>PIN code<input value={form.pinCode||""} onChange={e=>set("pinCode",e.target.value)} disabled={!editable}/></label>
     <label className="full">Address<textarea value={form.address||""} onChange={e=>set("address",e.target.value)} disabled={!editable} rows={3}/></label>
     <label>City<input value={form.city||""} onChange={e=>set("city",e.target.value)} disabled={!editable}/></label>
     <label>State<input value={form.state||""} onChange={e=>set("state",e.target.value)} disabled={!editable}/></label>
    </div>
   </section>

   <section className="card">
    <div className="sectionTitle"><FileText size={17}/><div><b>Institutional documents</b><small>{staffView?"Review, verify and manage student records":"Upload your records for administration verification"}</small></div></div>

    {editable&&<div className="documentUploader">
      <div className="documentUploadTop"><div><b>Upload a document</b><small>PDF, DOCX, XLSX, PPTX or image · maximum 25 MB</small></div><ShieldCheck size={18}/></div>
      <div className="documentUploadGrid">
       <label>Document type<select value={docType} onChange={e=>setDocType(e.target.value)}>{documentTypes.map(t=><option key={t}>{t}</option>)}</select></label>
       <label className="filePicker">Choose file<input id="student-document-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.jpg,.jpeg,.png,.webp" onChange={e=>setDocFile(e.target.files?.[0]||null)}/><span>{docFile?docFile.name:"No file selected"}</span></label>
       <button className="primary" onClick={uploadDocument} disabled={uploading||!docFile}><UploadCloud size={15}/>{uploading?"Uploading…":"Upload document"}</button>
      </div>
    </div>}

    {(student.documents||[]).length===0?<div className="emptyInline"><FileText size={20}/><span>No documents have been attached yet.</span></div>:
    <div className="documentList">{student.documents.map((d:any)=>
      <div className="documentRow" key={d.id}>
       <div><b>{d.name}</b><small>{d.type} · {new Date(d.uploadedAt).toLocaleDateString()}</small></div>
       <span className={d.verified?"status present":"status pending"}>{d.verified?"VERIFIED":"PENDING"}</span>
       <a href={"/api/student/documents?documentId="+encodeURIComponent(d.id)} target="_blank" rel="noreferrer"><FileCheck2 size={14}/> Open</a>
       {staffView&&<button className="textBtn" disabled={verifying===d.id} onClick={()=>verifyDocument(d.id,!d.verified)}>{verifying===d.id?<Loader2 size={13} className="spin">:d.verified?"Unverify":"Verify"}</button>}
      </div>
    )}</div>}
   </section>
  </div>
 </div>;
}

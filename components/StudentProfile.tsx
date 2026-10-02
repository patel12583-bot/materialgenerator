"use client";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, FileText, Save, UserRound, X } from "lucide-react";

type Props={studentId?:string;editable?:boolean};
export default function StudentProfile({studentId,editable=true}:Props){
 const [student,setStudent]=useState<any>(null); const [form,setForm]=useState<any>({});
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{const q=studentId?"?studentId="+encodeURIComponent(studentId):"";const r=await fetch("/api/student/profile"+q,{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load profile.");setStudent(d.student);setForm({name:d.student.name,rollNo:d.student.rollNo,dateOfBirth:d.student.dateOfBirth?String(d.student.dateOfBirth).slice(0,10):"",gender:d.student.gender||"",bloodGroup:d.student.bloodGroup||"",address:d.student.address||"",city:d.student.city||"",state:d.student.state||"",pinCode:d.student.pinCode||"",phone:d.student.phone||"",parentPhone:d.student.parentPhone||"",status:d.student.status||"ACTIVE"});}
  catch(e){setError(e instanceof Error?e.message:"Unable to load profile.");}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[studentId]);
 async function save(){
  setSaving(true);setError("");setNotice("");
  try{const r=await fetch("/api/student/profile",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...form,studentId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save profile.");setNotice(d.message||"Profile updated.");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to save profile.");}finally{setSaving(false)}
 }
 if(loading)return <div className="card emptyState"><Activity size={18}/><span>Loading student profile…</span></div>;
 if(!student)return <div className="card errorState"><X size={18}/><span>{error||"Profile unavailable."}</span></div>;
 const set=(key:string,value:string)=>setForm((x:any)=>({...x,[key]:value}));
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">STUDENT · MASTER PROFILE</span><h1>My <em>profile.</em></h1><p>A single verified profile for identity, academic placement, contact information and institutional documents.</p></div>{editable&&<button className="primary" onClick={save} disabled={saving}><Save size={15}/>{saving?"Saving…":"Save changes"}</button>}</div>
  {notice&&<div className="successState"><CheckCircle2 size={16}/><span>{notice}</span></div>}{error&&<div className="errorState"><X size={16}/><span>{error}</span></div>}
  <div className="profileGrid">
   <section className="card profileCard"><div className="profileIdentity"><div className="profileAvatar"><UserRound size={28}/></div><div><h2>{student.name}</h2><p>{student.enrollmentNo} · Roll {student.rollNo}</p><span className={"status "+String(student.status).toLowerCase()}>{student.status}</span></div></div>
    <div className="profileAcademic"><div><small>PROGRAM</small><b>{student.division.semester.program.name}</b></div><div><small>SEMESTER</small><b>{student.division.semester.number}</b></div><div><small>DIVISION</small><b>{student.division.name}</b></div><div><small>DEPARTMENT</small><b>{student.division.semester.program.department.code}</b></div></div>
   </section>
   <section className="card"><div className="sectionTitle"><UserRound size={17}/><div><b>Personal information</b><small>Identity and contact details</small></div></div><div className="formGrid">
    <label>Full name<input value={form.name||""} disabled={studentId? !editable:false} onChange={e=>set("name",e.target.value)}/></label>
    <label>Roll number<input value={form.rollNo||""} disabled={studentId? !editable:false} onChange={e=>set("rollNo",e.target.value)}/></label>
    <label>Date of birth<input type="date" value={form.dateOfBirth||""} onChange={e=>set("dateOfBirth",e.target.value)} disabled={!editable}/></label>
    <label>Gender<select value={form.gender||""} onChange={e=>set("gender",e.target.value)} disabled={!editable}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
    <label>Blood group<input value={form.bloodGroup||""} onChange={e=>set("bloodGroup",e.target.value)} disabled={!editable} placeholder="B+"/></label>
    <label>Mobile<input value={form.phone||""} onChange={e=>set("phone",e.target.value)} disabled={!editable} placeholder="10 digit mobile"/></label>
    <label>Parent mobile<input value={form.parentPhone||""} onChange={e=>set("parentPhone",e.target.value)} disabled={!editable}/></label>
    <label>PIN code<input value={form.pinCode||""} onChange={e=>set("pinCode",e.target.value)} disabled={!editable}/></label>
    <label className="full">Address<textarea value={form.address||""} onChange={e=>set("address",e.target.value)} disabled={!editable} rows={3}/></label>
    <label>City<input value={form.city||""} onChange={e=>set("city",e.target.value)} disabled={!editable}/></label>
    <label>State<input value={form.state||""} onChange={e=>set("state",e.target.value)} disabled={!editable}/></label>
   </div></section>
   <section className="card"><div className="sectionTitle"><FileText size={17}/><div><b>Institutional documents</b><small>Verified records attached to this profile</small></div></div>
    {(student.documents||[]).length===0?<div className="emptyInline"><FileText size={20}/><span>No documents have been attached yet.</span></div>:<div className="documentList">{student.documents.map((d:any)=><div className="documentRow" key={d.id}><div><b>{d.name}</b><small>{d.type} · {new Date(d.uploadedAt).toLocaleDateString()}</small></div><span className={d.verified?"status present":"status pending"}>{d.verified?"VERIFIED":"PENDING"}</span>{d.fileUrl&&<a href={d.fileUrl} target="_blank" rel="noreferrer">Open</a>}</div>)}</div>}
   </section>
  </div>
 </div>;
}
"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Upload, Users, UserPlus, Pencil, UserX, CheckCircle2, Download, RotateCcw } from "lucide-react";

type Division={id:string;name:string;semester:{number:number;program:{name:string;code:string}}};
type Student={id:string;name:string;enrollmentNo:string;rollNo:string;phone:string|null;parentPhone:string|null;dateOfBirth:string|null;gender:string|null;bloodGroup:string|null;address:string|null;city:string|null;state:string|null;pinCode:string|null;division:Division;user:{id:string;active:boolean;email:string|null;phone:string|null;passwordConfigured:boolean}};

export default function AdminStudents(){
 const [students,setStudents]=useState<Student[]>([]);
 const [divisions,setDivisions]=useState<Division[]>([]);
 const [q,setQ]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [uploadBusy,setUploadBusy]=useState(false); const [importReport,setImportReport]=useState<{importedCount:number;skippedCount:number;students:any[];errors:string[]}|null>(null);
 const [message,setMessage]=useState(""); const [credentials,setCredentials]=useState<{studentId:string;password:string}|null>(null);
 const [open,setOpen]=useState(false); const [editing,setEditing]=useState<Student|null>(null);
 const [form,setForm]=useState({name:"",enrollmentNo:"",rollNo:"",divisionId:"",phone:"",parentPhone:"",email:"",dateOfBirth:"",gender:"",bloodGroup:"",address:"",city:"",state:"",pinCode:""});

 async function load(){
  setLoading(true);
  try{
   const r=await fetch("/api/admin/students?q="+encodeURIComponent(q),{cache:"no-store"});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Unable to load students.");
   setStudents(d.students||[]);setDivisions(d.divisions||[]);
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to load students.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{load()},[]);

 async function uploadStudentList(file:File){
  setUploadBusy(true);setMessage("");setImportReport(null);
  try{
   const body=new FormData();body.append("file",file);
   const r=await fetch("/api/admin/students/import",{method:"POST",body});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error||d.errors?.[0]||"Unable to import student list.");
   setImportReport(d);
   setMessage(`Student import complete: ${d.importedCount} added, ${d.skippedCount} skipped.`);
   await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to import student list.");}
  finally{setUploadBusy(false);}
 }
 function downloadCredentials(){
  if(!importReport?.students?.length)return;
  const header="Name,Enrollment,Roll,Program,Semester,Division,Password";
  const lines=importReport.students.map((s:any)=>[s.name,s.enrollmentNo,s.rollNo,s.program,s.semester,s.division,s.password].map((v:any)=>'"'+String(v??"").replace(/"/g,'""')+'"').join(","));
  const blob=new Blob([[header,...lines].join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="student-login-credentials.csv";a.click();URL.revokeObjectURL(url);
}
 async function saveEdit(e:React.FormEvent){
  e.preventDefault(); if(!editing)return; setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/students",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...form,studentId:editing.id})});
   const d=await r.json(); if(!r.ok)throw new Error(d.error||"Unable to update student.");
   setMessage("Student record updated successfully."); setEditing(null); await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to update student.");}finally{setBusy(false);}
 }
 async function reactivateStudent(s:Student){
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/students?studentId="+encodeURIComponent(s.id),{method:"PUT"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to reactivate student.");setMessage(d.message||"Student account reactivated.");await load();}
  catch(e){setMessage(e instanceof Error?e.message:"Unable to reactivate student.");}finally{setBusy(false);}
 }
 async function deactivateStudent(s:Student){
  if(!window.confirm(`Deactivate ${s.name}'s login account?`))return;
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/students?studentId="+encodeURIComponent(s.id),{method:"DELETE"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to deactivate student.");setMessage(d.message||"Student account deactivated.");await load();}
  catch(e){setMessage(e instanceof Error?e.message:"Unable to deactivate student.");}finally{setBusy(false);}
 }
 async function createStudent(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/students",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Unable to create student.");
   setMessage("Student created successfully. Save the generated credentials below."); setCredentials(d.credentials||null);
   setForm({name:"",enrollmentNo:"",rollNo:"",divisionId:"",phone:"",parentPhone:"",email:"",dateOfBirth:"",gender:"",bloodGroup:"",address:"",city:"",state:"",pinCode:""});
   setOpen(false);await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to create student.");}
  finally{setBusy(false);}
 }

 return <div className="adminWorkspace">
  <div className="pageHead">
   <div><span className="eyebrow">ADMIN · STUDENT MANAGEMENT</span><h1>Manage <em>students.</em></h1><p>Create official student records first; students then activate their own login account.</p></div>
   <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
    <label className="secondaryBtn" style={{cursor:uploadBusy?"wait":"pointer",opacity:uploadBusy?0.65:1}}>
     <Upload size={15}/>{uploadBusy?"Uploading…":"Upload students"}
     <input type="file" accept=".csv,.xlsx,.xls" hidden disabled={uploadBusy} onChange={e=>{const file=e.target.files?.[0];if(file)uploadStudentList(file);e.currentTarget.value=""}}/>
    </label>
    <button className="primary" onClick={()=>setOpen(true)}><UserPlus size={15}/> Add student</button>
   </div>
  </div>
  <div className="studentToolbar card">
   <div className="adminSearch"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search name, enrollment or roll number"/></div>
   <button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button>
   <span className="studentCount"><Users size={14}/> {students.length} students</span>
  </div>
  {message&&<div className="loginError adminMessage">{message}</div>}
  {importReport&&<div className="card" style={{marginTop:12}}><div className="eyebrow">IMPORT RESULT</div><h3 style={{margin:"7px 0"}}>{importReport.importedCount} students added</h3>{importReport.skippedCount>0&&<p className="quickText">{importReport.skippedCount} rows skipped. {importReport.errors.slice(0,5).join(" ")}</p>}{importReport.students.length>0&&<details style={{marginTop:10}}><summary>View generated credentials</summary><button type="button" className="secondaryBtn" style={{marginTop:8}} onClick={downloadCredentials}><Download size={14}/> Download credentials CSV</button><div style={{marginTop:10,display:"grid",gap:6}}>{importReport.students.map((s:any)=><div key={s.enrollmentNo} className="quickText"><b>{s.name}</b> · {s.enrollmentNo} · password: <code>{s.password}</code></div>)}</div></details>}</div>}{credentials&&<div className="card" style={{marginTop:12}}><div className="eyebrow">GENERATED STUDENT CREDENTIALS</div><p style={{margin:"8px 0"}}><b>Student ID:</b> {credentials.studentId}</p><p style={{margin:"8px 0"}}><b>Password:</b> {credentials.password}</p><small className="quickText">Save these credentials now. The password is stored only as a secure hash.</small></div>}
  <div className="card studentAdminTable">
   <div className="studentAdminHead"><span>STUDENT</span><span>ENROLLMENT</span><span>CLASS</span><span>CONTACT</span><span>ACCOUNT</span></div>
   {loading?<div className="emptyState">Loading students…</div>:students.length===0?<div className="emptyState">No students found. Add the first student record.</div>:students.map(s=><div className="studentAdminRow" key={s.id}>
    <div><b>{s.name}</b><small>Roll No. {s.rollNo}</small></div>
    <span>{s.enrollmentNo}</span>
    <span>{s.division.semester.program.code} · Sem {s.division.semester.number} · Div {s.division.name}</span>
    <span><small>{s.phone||"No mobile"}</small><small>{s.parentPhone||"No parent mobile"}</small></span>
    <span className={s.user.active?"accountReady":"accountPending"}>{!s.user.active?"Deactivated":s.user.passwordConfigured?"Active":"Pending activation"}</span>
    <div style={{display:"flex",gap:6}}>
      <button className="iconBtn" title="Edit student" onClick={()=>{setEditing(s);setForm({name:s.name,enrollmentNo:s.enrollmentNo,rollNo:s.rollNo,divisionId:s.division.id,phone:s.phone||"",parentPhone:s.parentPhone||"",email:s.user.email||"",dateOfBirth:s.dateOfBirth?s.dateOfBirth.slice(0,10):"",gender:s.gender||"",bloodGroup:s.bloodGroup||"",address:s.address||"",city:s.city||"",state:s.state||"",pinCode:s.pinCode||""})}}><Pencil size={14}/></button>
      {s.user.active?<button className="iconBtn" title="Deactivate student" onClick={()=>deactivateStudent(s)} disabled={busy}><UserX size={14}/></button>:<button className="iconBtn" title="Reactivate student" onClick={()=>reactivateStudent(s)} disabled={busy}><RotateCcw size={14}/></button>}
    </div>
   </div>)}
  </div>
  {(open||editing)&&<div className="modalBackdrop" onMouseDown={()=>{setOpen(false);setEditing(null)}}><div className="modalCard" onMouseDown={e=>e.stopPropagation()}>
   <div className="cardHead"><div><span className="eyebrow">{editing?"EDIT STUDENT":"NEW STUDENT"}</span><h2>{editing?"Edit student record":"Create student record"}</h2></div><button type="button" className="iconBtn" onClick={()=>{setOpen(false);setEditing(null)}}>×</button></div>
   <form className="adminForm" onSubmit={editing?saveEdit:createStudent}>
    <label>Full name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Student full name"/>
    <div className="formTwo"><div><label>Enrollment number</label><input value={form.enrollmentNo} disabled={!!editing} onChange={e=>setForm({...form,enrollmentNo:e.target.value})} placeholder="NOBLE-BCA-2026-1001"/></div><div><label>Roll number</label><input required value={form.rollNo} onChange={e=>setForm({...form,rollNo:e.target.value})} placeholder="2"/></div></div>
    <label>Division</label><select required value={form.divisionId} onChange={e=>setForm({...form,divisionId:e.target.value})}><option value="">Select division</option>{divisions.map(d=><option key={d.id} value={d.id}>{d.semester.program.code} · Sem {d.semester.number} · Div {d.name}</option>)}</select>
    <div className="formTwo"><div><label>Student mobile</label><input inputMode="numeric" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></div><div><label>Parent mobile</label><input inputMode="numeric" value={form.parentPhone} onChange={e=>setForm({...form,parentPhone:e.target.value})} placeholder="10-digit mobile"/></div></div>
    <label>Email (optional)</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="student@example.com"/>
    <div className="formTwo"><div><label>Date of birth</label><input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})}/></div><div><label>Gender</label><select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div></div>
    <div className="formTwo"><div><label>Blood group</label><input value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} placeholder="e.g. B+"/></div><div><label>PIN code</label><input inputMode="numeric" value={form.pinCode} onChange={e=>setForm({...form,pinCode:e.target.value})} placeholder="6-digit PIN"/></div></div>
    <label>Address</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Street / area / building"/>
    <div className="formTwo"><div><label>City</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City"/></div><div><label>State</label><input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} placeholder="State"/></div></div>
    <button className="primary fullBtn" disabled={busy}>{busy?(editing?"Saving…":"Creating…"):(editing?"Save changes":"Create student")} {editing?<CheckCircle2 size={14}/>:<Plus size={14}/>}</button>
   </form>
  </div></div>}
 </div>;
}

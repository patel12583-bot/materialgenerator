"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Upload, Users, UserPlus } from "lucide-react";

type Division={id:string;name:string;semester:{number:number;program:{name:string;code:string}}};
type Student={id:string;name:string;enrollmentNo:string;rollNo:string;phone:string|null;parentPhone:string|null;division:Division;user:{active:boolean;email:string|null;phone:string|null;passwordConfigured:boolean}};

export default function AdminStudents(){
 const [students,setStudents]=useState<Student[]>([]);
 const [divisions,setDivisions]=useState<Division[]>([]);
 const [q,setQ]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [uploadBusy,setUploadBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [open,setOpen]=useState(false);
 const [form,setForm]=useState({name:"",enrollmentNo:"",rollNo:"",divisionId:"",phone:"",parentPhone:"",email:""});

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
  setUploadBusy(true);setMessage("");
  try{
   const body=new FormData();body.append("file",file);body.append("category","student-list");
   const r=await fetch("/api/uploads",{method:"POST",body});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Unable to upload student list.");
   setMessage("Student list uploaded successfully. Open Uploads to review the uploaded file.");
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to upload student list.");}
  finally{setUploadBusy(false);}
 }

 async function createStudent(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/students",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Unable to create student.");
   setMessage("Student created. Student can now use Create Account with this enrollment number.");
   setForm({name:"",enrollmentNo:"",rollNo:"",divisionId:"",phone:"",parentPhone:"",email:""});
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
     <input type="file" accept=".csv,.xlsx,.xls,.pdf,.doc,.docx" hidden disabled={uploadBusy} onChange={e=>{const file=e.target.files?.[0];if(file)uploadStudentList(file);e.currentTarget.value=""}}/>
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
  <div className="card studentAdminTable">
   <div className="studentAdminHead"><span>STUDENT</span><span>ENROLLMENT</span><span>CLASS</span><span>CONTACT</span><span>ACCOUNT</span></div>
   {loading?<div className="emptyState">Loading students…</div>:students.length===0?<div className="emptyState">No students found. Add the first student record.</div>:students.map(s=><div className="studentAdminRow" key={s.id}>
    <div><b>{s.name}</b><small>Roll No. {s.rollNo}</small></div>
    <span>{s.enrollmentNo}</span>
    <span>{s.division.semester.program.code} · Sem {s.division.semester.number} · Div {s.division.name}</span>
    <span><small>{s.phone||"No mobile"}</small><small>{s.parentPhone||"No parent mobile"}</small></span>
    <span className={s.user.active?"accountReady":"accountPending"}>{s.user.passwordConfigured?"Active":"Pending activation"}</span>
   </div>)}
  </div>
  {open&&<div className="modalBackdrop" onMouseDown={()=>setOpen(false)}><div className="modalCard" onMouseDown={e=>e.stopPropagation()}>
   <div className="cardHead"><div><span className="eyebrow">NEW STUDENT</span><h2>Create student record</h2></div><button type="button" className="iconBtn" onClick={()=>setOpen(false)}>×</button></div>
   <form className="adminForm" onSubmit={createStudent}>
    <label>Full name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Student full name"/>
    <div className="formTwo"><div><label>Enrollment number</label><input required value={form.enrollmentNo} onChange={e=>setForm({...form,enrollmentNo:e.target.value})} placeholder="NOBLE-BCA-002"/></div><div><label>Roll number</label><input required value={form.rollNo} onChange={e=>setForm({...form,rollNo:e.target.value})} placeholder="2"/></div></div>
    <label>Division</label><select required value={form.divisionId} onChange={e=>setForm({...form,divisionId:e.target.value})}><option value="">Select division</option>{divisions.map(d=><option key={d.id} value={d.id}>{d.semester.program.code} · Sem {d.semester.number} · Div {d.name}</option>)}</select>
    <div className="formTwo"><div><label>Student mobile</label><input inputMode="numeric" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></div><div><label>Parent mobile</label><input inputMode="numeric" value={form.parentPhone} onChange={e=>setForm({...form,parentPhone:e.target.value})} placeholder="10-digit mobile"/></div></div>
    <label>Email (optional)</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="student@example.com"/>
    <button className="primary fullBtn" disabled={busy}>{busy?"Creating…":"Create student"}<Plus size={14}/></button>
   </form>
  </div></div>}
 </div>;
}

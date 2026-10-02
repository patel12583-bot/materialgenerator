"use client";
import {useEffect,useState} from "react";
import {KeyRound,Plus,Power,RefreshCw,ShieldCheck,UserRound} from "lucide-react";

type Department={id:string;name:string;code:string};
type HOD={id:string;username:string;email:string|null;phone:string|null;active:boolean;department:Department|null};

export default function HODManagement(){
 const [hods,setHods]=useState<HOD[]>([]),[departments,setDepartments]=useState<Department[]>([]);
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [form,setForm]=useState({username:"",password:"",email:"",phone:"",departmentId:""});
 async function load(){setLoading(true);try{const r=await fetch("/api/admin/hods",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load HODs.");setHods(d.hods||[]);setDepartments(d.departments||[])}catch(e){setMessage(e instanceof Error?e.message:"Unable to load HODs.")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 function reset(){setForm({username:"",password:"",email:"",phone:"",departmentId:""});setOpen(false)}
 async function action(body:any){
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/hods",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to complete action.");setMessage(d.active===false?"HOD account deactivated.":d.active===true?"HOD account activated.":body.action==="reset-password"?"HOD password reset successfully.":"HOD account created successfully.");reset();await load()}catch(e){setMessage(e instanceof Error?e.message:"Unable to complete action.")}finally{setBusy(false)}
 }
 async function create(e:React.FormEvent){e.preventDefault();await action({...form})}
 async function toggle(x:HOD){await action({action:"toggle",userId:x.id})}
 async function resetPassword(x:HOD){const p=window.prompt("New password (minimum 8 characters):","");if(p)await action({action:"reset-password",userId:x.id,password:p})}
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">ADMIN · HOD MANAGEMENT</span><h1>Manage <em>HODs.</em></h1><p>Assign one department to each Head of Department and control the department-level workspace.</p></div><div style={{display:"flex",gap:8}}><button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add HOD</button></div></div>
  {message&&<div className="globalNotice"><ShieldCheck size={15}/><span>{message}</span></div>}
  <div className="miniStats"><div><ShieldCheck size={18}/><span>HOD accounts<b>{hods.length}</b></span></div><div><UserRound size={18}/><span>Active<b>{hods.filter(x=>x.active).length}</b></span></div><div><ShieldCheck size={18}/><span>Departments<b>{new Set(hods.map(x=>x.department?.id).filter(Boolean)).size}</b></span></div></div>
  <div className="card studentAdminTable"><div className="studentAdminHead"><span>HOD ACCOUNT</span><span>DEPARTMENT</span><span>CONTACT</span><span>STATUS</span><span>ACTION</span></div>
   {loading?<div className="emptyState">Loading HOD accounts…</div>:hods.length===0?<div className="emptyState"><ShieldCheck size={22}/><h2>No HOD accounts</h2><p>Create a department head to activate department-level approvals and reporting.</p></div>:hods.map(x=><div className="studentAdminRow" key={x.id}><div><b>{x.username}</b><small>{x.email||"No email"}</small></div><span>{x.department?.code||"—"} · {x.department?.name||"No department"}</span><span>{x.phone||"—"}</span><span className={x.active?"status present":"status absent"}>{x.active?"Active":"Inactive"}</span><span style={{display:"flex",gap:6}}><button className="textBtn" onClick={()=>toggle(x)} disabled={busy}><Power size={13}/>{x.active?"Deactivate":"Activate"}</button><button className="textBtn" onClick={()=>resetPassword(x)} disabled={busy}><KeyRound size={13}/> Reset</button></span></div>)}
  </div>
  {open&&<div className="modalBackdrop" onMouseDown={reset}><div className="modalCard" onMouseDown={e=>e.stopPropagation()}><div className="cardHead"><div><span className="eyebrow">NEW HOD</span><h2>Create department head</h2></div><button className="iconBtn" onClick={reset}>×</button></div><form className="adminForm" onSubmit={create}>
   <label>Username</label><input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="hod.bca"/>
   <div className="formTwo"><div><label>Password</label><input required minLength={8} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 8 characters"/></div><div><label>Mobile</label><input inputMode="numeric" maxLength={10} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"")})} placeholder="10-digit mobile"/></div></div>
   <label>Department</label><select required value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select>
   <label>Email (optional)</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="hod@college.edu.in"/>
   <button className="primary fullBtn" disabled={busy}>{busy?"Creating…":"Create HOD"} <Plus size={14}/></button>
  </form></div></div>}
 </div>
}
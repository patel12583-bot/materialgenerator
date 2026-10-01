"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, RefreshCw, ShieldCheck, UserRound, UsersRound, Power } from "lucide-react";

type Department={id:string;name:string;code:string};
type Faculty={id:string;name:string;employeeCode:string;user:{id:string;username:string;email:string|null;phone:string|null;active:boolean;department:Department|null}};
type Admin={id:string;username:string;email:string|null;phone:string|null;active:boolean;department:Department|null};

export default function AdminAccounts(){
 const [tab,setTab]=useState<"FACULTY"|"ADMIN">("FACULTY");
 const [faculty,setFaculty]=useState<Faculty[]>([]);
 const [admins,setAdmins]=useState<Admin[]>([]);
 const [departments,setDepartments]=useState<Department[]>([]);
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");
 const [form,setForm]=useState({name:"",employeeCode:"",username:"",password:"",email:"",phone:"",departmentId:""});

 async function load(){
  setLoading(true);
  try{
   const r=await fetch("/api/admin/accounts",{cache:"no-store"}); const d=await r.json();
   if(!r.ok) throw new Error(d.error||"Unable to load accounts.");
   setFaculty(d.faculty||[]); setAdmins(d.admins||[]); setDepartments(d.departments||[]);
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to load accounts.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{load()},[]);

 function reset(){setForm({name:"",employeeCode:"",username:"",password:"",email:"",phone:"",departmentId:""});setOpen(false)}
 async function accountAction(userId:string, action:"toggle"|"reset-password"){
  const password = action==="reset-password" ? window.prompt("Enter the new password (minimum 8 characters):","") : undefined;
  if(action==="reset-password" && !password) return;
  setBusy(true); setMessage("");
  try{
    const r=await fetch("/api/admin/accounts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,userId,password})});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to update account.");
    setMessage(action==="toggle"?(d.active?"Account activated.":"Account deactivated."):"Password reset successfully.");
    await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to update account.");}
  finally{setBusy(false)}
 }

 async function create(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/accounts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...form,type:tab})});
   const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to create account.");
   setMessage((tab==="FACULTY"?"Faculty":"Admin")+" account created successfully.");
   reset(); await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to create account.");}
  finally{setBusy(false);}
 }

 return <div className="adminWorkspace">
  <div className="pageHead">
   <div><span className="eyebrow">ADMIN · ACCOUNT MANAGEMENT</span><h1>Manage <em>accounts.</em></h1><p>Only an existing Admin can create Faculty and Admin login accounts.</p></div>
   <button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add {tab==="FACULTY"?"faculty":"admin"}</button>
  </div>
  <div className="studentToolbar card">
   <div className="accountTabs">
    <button className={tab==="FACULTY"?"accountTab active":"accountTab"} onClick={()=>setTab("FACULTY")}><UsersRound size={15}/> Faculty</button>
    <button className={tab==="ADMIN"?"accountTab active":"accountTab"} onClick={()=>setTab("ADMIN")}><ShieldCheck size={15}/> Admin</button>
   </div>
   <button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button>
   <span className="studentCount"><UserRound size={14}/> {tab==="FACULTY"?faculty.length:admins.length} accounts</span>
  </div>
  {message&&<div className="loginError adminMessage">{message}</div>}
  <div className="card studentAdminTable">
   <div className="studentAdminHead"><span>NAME / USERNAME</span><span>LOGIN</span><span>DEPARTMENT</span><span>CONTACT</span><span>STATUS</span></div>
   {loading?<div className="emptyState">Loading accounts…</div>:tab==="FACULTY"?
    (faculty.length?faculty.map(f=><div className="studentAdminRow" key={f.id}><div><b>{f.name}</b><small>{f.employeeCode}</small></div><span>{f.user.username}</span><span>{f.user.department?.code||"—"}</span><span><small>{f.user.email||"No email"}</small><small>{f.user.phone||"No mobile"}</small></span><span className="accountActionCell"><span className="accountReady">{f.user.active?"Active":"Inactive"}</span><button className="textBtn" title={f.user.active?"Deactivate account":"Activate account"} onClick={()=>accountAction(f.user.id,"toggle")}><Power size={14}/></button><button className="textBtn" title="Reset password" onClick={()=>accountAction(f.user.id,"reset-password")}><KeyRound size={14}/></button></span></div>):<div className="emptyState">No faculty accounts yet.</div>)
    :(admins.length?admins.map(a=><div className="studentAdminRow" key={a.id}><div><b>{a.username}</b><small>Administrator</small></div><span>{a.username}</span><span>{a.department?.code||"All departments"}</span><span><small>{a.email||"No email"}</small><small>{a.phone||"No mobile"}</small></span><span className="accountActionCell"><span className="accountReady">{a.active?"Active":"Inactive"}</span><button className="textBtn" title={a.active?"Deactivate account":"Activate account"} onClick={()=>accountAction(a.id,"toggle")}><Power size={14}/></button><button className="textBtn" title="Reset password" onClick={()=>accountAction(a.id,"reset-password")}><KeyRound size={14}/></button></span></div>):<div className="emptyState">No additional admin accounts yet.</div>)}
  </div>

  {open&&<div className="modalBackdrop" onMouseDown={()=>setOpen(false)}><div className="modalCard" onMouseDown={e=>e.stopPropagation()}>
   <div className="cardHead"><div><span className="eyebrow">NEW {tab}</span><h2>Create {tab==="FACULTY"?"faculty":"admin"} account</h2></div><button type="button" className="iconBtn" onClick={()=>setOpen(false)}>×</button></div>
   <form className="adminForm" onSubmit={create}>
    {tab==="FACULTY"&&<><label>Full name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Faculty full name"/><div className="formTwo"><div><label>Employee code</label><input required value={form.employeeCode} onChange={e=>setForm({...form,employeeCode:e.target.value})} placeholder="FAC-002"/></div><div><label>Department</label><select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></div></div></>}
    {tab==="ADMIN"&&<label>Department access (optional)</label>}
    {tab==="ADMIN"&&<select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select>}
    <label>Username</label><input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder={tab==="FACULTY"?"faculty.username":"admin.username"}/>
    <div className="formTwo"><div><label>Initial password</label><input required minLength={8} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 8 characters"/></div><div><label>Mobile</label><input inputMode="numeric" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></div></div>
    <label>Email (optional)</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@noble.edu.in"/>
    <button className="primary fullBtn" disabled={busy}>{busy?"Creating…":"Create account"}<Plus size={14}/></button>
   </form>
  </div></div>}
 </div>;
}

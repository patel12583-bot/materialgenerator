"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, UserX, Users, Copy, CheckCircle2 } from "lucide-react";

type Faculty={id:string;name:string;employeeCode:string;phone:string|null;user:{id:string;username:string;email:string|null;phone:string|null;active:boolean;departmentId:string|null}};
type Department={id:string;name:string;code:string};

export default function FacultyManagement({canEdit=true}:{canEdit?:boolean}){
  const [faculty,setFaculty]=useState<Faculty[]>([]);
  const [departments,setDepartments]=useState<Department[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [credentials,setCredentials]=useState<{username:string;password:string}|null>(null);
  const [editing,setEditing]=useState<Faculty|null>(null);
  const [form,setForm]=useState({name:"",employeeCode:"",phone:"",email:"",departmentId:""});

  async function load(){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/admin/faculty",{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to load faculty.");
      setFaculty(d.faculty||[]);setDepartments(d.departments||[]);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load faculty.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load()},[]);

  function reset(){setEditing(null);setForm({name:"",employeeCode:"",phone:"",email:"",departmentId:""});}

  async function save(){
    setBusy(true);setError("");setCredentials(null);
    try{
      const method=editing?"PATCH":"POST";
      const payload=editing?{id:editing.id,...form}:form;
      const r=await fetch("/api/admin/faculty",{method,headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to save faculty.");
      if(d.credentials)setCredentials(d.credentials);
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to save faculty.");}
    finally{setBusy(false);}
  }

  async function deactivate(id:string){
    if(!confirm("Deactivate this faculty login? Attendance history will remain intact.")) return;
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/admin/faculty",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({id})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to deactivate faculty.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to deactivate faculty.");}
    finally{setBusy(false);}
  }

  function edit(x:Faculty){
    setEditing(x);
    setForm({name:x.name,employeeCode:x.employeeCode,phone:x.phone||x.user.phone||"",email:x.user.email||"",departmentId:x.user.departmentId||""});
    setCredentials(null);
  }

  const dept=(id:string|null)=>departments.find(d=>d.id===id);

  return <div className="adminWorkspace">
    <div className="pageHead">
      <div><span className="eyebrow">ADMIN · FACULTY MANAGEMENT</span><h1>Manage <em>faculty.</em></h1><p>Create faculty accounts, assign departments and preserve their academic history.</p></div>
      <div style={{display:"flex",gap:8}}><button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button>{canEdit&&<button className="primary" onClick={()=>{reset();window.scrollTo({top:0,behavior:"smooth"})}}><Plus size={14}/> Add faculty</button>}</div>
    </div>

    {credentials&&<div className="globalNotice"><CheckCircle2 size={15}/><span>Faculty created. Login: <b>{credentials.username}</b> · Password: <b>{credentials.password}</b></span><button onClick={()=>navigator.clipboard?.writeText(`${credentials.username}\n${credentials.password}`)}><Copy size={14}/></button></div>}
    {error&&<div className="loginError">{error}</div>}

    {canEdit&&<div className="card" style={{marginBottom:14}}>
      <div className="cardHead"><div><span className="eyebrow">{editing?"EDIT":"CREATE"}</span><h2>{editing?"Edit faculty":"Add faculty member"}</h2></div><Users size={18}/></div>
      <div className="formTwo">
        <div className="adminForm"><label>Full name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Faculty full name"/></div>
        <div className="adminForm"><label>Employee code</label><input disabled={!!editing} value={form.employeeCode} onChange={e=>setForm({...form,employeeCode:e.target.value.toUpperCase()})} placeholder="FAC-002"/></div>
        <div className="adminForm"><label>Department</label><select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></div>
        <div className="adminForm"><label>Mobile</label><input inputMode="numeric" maxLength={10} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"")})} placeholder="10 digit mobile"/></div>
        <div className="adminForm"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="faculty@college.edu"/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}><button className="primary" onClick={save} disabled={busy||!form.name||!form.employeeCode||!form.departmentId}>{busy?"Saving…":editing?"Save changes":"Create faculty"} <CheckCircle2 size={14}/></button>{editing&&<button className="secondaryBtn" onClick={reset}>Cancel</button>}</div>
    </div>}

    <div className="card studentAdminTable">
      <div className="studentAdminHead"><span>FACULTY</span><span>EMPLOYEE CODE</span><span>DEPARTMENT</span><span>CONTACT</span><span>STATUS</span><span>ACTION</span></div>
      {loading?<div className="emptyState">Loading faculty…</div>:faculty.length===0?<div className="emptyState">No faculty records found.</div>:faculty.map(x=><div className="studentAdminRow" key={x.id}>
        <div><b>{x.name}</b><small>{x.user.email||"No email"}</small></div>
        <span>{x.employeeCode}</span><span>{dept(x.user.departmentId)?.code||"—"}</span><span>{x.phone||x.user.phone||"—"}</span>
        <span className={x.user.active?"status present":"status absent"}>{x.user.active?"Active":"Deactivated"}</span>
        <span>{canEdit&&x.user.active&&<><button className="textBtn" onClick={()=>edit(x)}><Pencil size={13}/> Edit</button><button className="textBtn" onClick={()=>deactivate(x.id)} disabled={busy}><UserX size={13}/> Deactivate</button></>}</span>
      </div>)}
    </div>
  </div>
}

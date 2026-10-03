"use client";

import { useEffect, useState } from "react";
import { Check, CircleDollarSign, FileCheck2, Plus, Search, X } from "lucide-react";

const money=(n:number)=>`₹${Number(n||0).toLocaleString("en-IN")}`;
const date=(v:string)=>v?new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

export default function ScholarshipManagement({role}:{role:string}){
  const admin=role==="Admin"||role==="Super Admin";
  const [state,setState]=useState<any>({programs:[],applications:[]});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [tab,setTab]=useState(admin?"Applications":"Available Scholarships");
  const [form,setForm]=useState<any>({name:"",code:"",description:"",academicYear:"2026-27",maxAwardAmount:"",incomeLimit:"",minimumPercentage:"",deadline:""});
  const [apply,setApply]=useState<any>({scholarshipId:"",amountRequested:"",householdIncome:"",academicPercentage:"",category:"",statement:""});
  const [q,setQ]=useState(""),[status,setStatus]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const url=admin?`/api/scholarship?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`:"/api/scholarship";
      const r=await fetch(url,{cache:"no-store"}),d=await r.json();
      if(!r.ok)throw new Error(d.error||"Unable to load scholarships.");
      setState(d);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load scholarships.");}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[admin,status]);
  const post=async(body:any)=>{
    setBusy(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/scholarship",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Scholarship operation failed.");
      setMessage("Saved successfully.");await load();return d;
    }catch(e){setError(e instanceof Error?e.message:"Scholarship operation failed.");return null}
    finally{setBusy(false)}
  };

  if(loading)return <div className="adminWorkspace"><div className="card emptyState"><CircleDollarSign size={22}/><h2>Loading scholarship centre…</h2></div></div>;

  if(!admin)return <div className="adminWorkspace">
    <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · FINANCIAL AID</span><h1>Scholarship <em>centre.</em></h1><p>Review available schemes, submit an application and track every decision.</p></div></div>
    {error&&<div className="loginError adminMessage">{error}</div>}{message&&<div className="toast">{message}</div>}
    <div className="card" style={{marginBottom:14}}><div className="cardHead"><div><span className="eyebrow">OPEN SCHEMES</span><h2>Available scholarships</h2></div><CircleDollarSign size={18}/></div>
      <div className="studentAdminTable"><div className="studentAdminHead"><span>SCHEME</span><span>ACADEMIC YEAR</span><span>MAX AWARD</span><span>ELIGIBILITY</span><span>DEADLINE</span></div>
      {(state.programs||[]).map((p:any)=><div className="studentAdminRow" key={p.id}><div><b>{p.name}</b><small>{p.code} · {p.description||"Institution scholarship"}</small></div><span>{p.academicYear}</span><span>{money(p.maxAwardAmount)}</span><span>{p.minimumPercentage!=null?`≥ ${p.minimumPercentage}%`:"As per scheme"}{p.incomeLimit!=null?` · Income ≤ ${money(p.incomeLimit)}`:""}</span><span>{date(p.deadline)}</span></div>)}
      {!state.programs?.length&&<div className="emptyState">No scholarship schemes are currently open.</div>}</div>
    </div>
    <div className="card"><div className="cardHead"><div><span className="eyebrow">APPLICATION</span><h2>Submit scholarship application</h2></div><FileCheck2 size={18}/></div>
      <div className="formTwo">
        <div className="adminForm"><label>Scholarship</label><select value={apply.scholarshipId} onChange={e=>setApply({...apply,scholarshipId:e.target.value})}><option value="">Select scheme</option>{(state.programs||[]).map((p:any)=><option key={p.id} value={p.id}>{p.code} · {p.name} · max {money(p.maxAwardAmount)}</option>)}</select></div>
        <div className="adminForm"><label>Requested amount (₹)</label><input type="number" min="1" value={apply.amountRequested} onChange={e=>setApply({...apply,amountRequested:e.target.value})}/></div>
        <div className="adminForm"><label>Household income (₹)</label><input type="number" min="0" value={apply.householdIncome} onChange={e=>setApply({...apply,householdIncome:e.target.value})}/></div>
        <div className="adminForm"><label>Academic percentage</label><input type="number" min="0" max="100" step="0.01" value={apply.academicPercentage} onChange={e=>setApply({...apply,academicPercentage:e.target.value})}/></div>
        <div className="adminForm"><label>Category</label><input value={apply.category} placeholder="e.g. Merit / Need / Reserved" onChange={e=>setApply({...apply,category:e.target.value})}/></div>
        <div className="adminForm" style={{gridColumn:"1/-1"}}><label>Statement / reason</label><textarea rows={4} value={apply.statement} onChange={e=>setApply({...apply,statement:e.target.value})}/></div>
      </div>
      <button className="primary" disabled={busy} onClick={async()=>{const d=await post({action:"apply",...apply});if(d)setApply({scholarshipId:"",amountRequested:"",householdIncome:"",academicPercentage:"",category:"",statement:""})}}><Check size={14}/> Submit application</button>
    </div>
    <div className="card" style={{marginTop:14}}><div className="cardHead"><div><span className="eyebrow">MY HISTORY</span><h2>Application status</h2></div></div>
      {(state.applications||[]).map((a:any)=><div className="studentAdminRow" key={a.id}><div><b>{a.scholarship.name}</b><small>Applied {date(a.appliedAt)}</small></div><span>{money(a.amountRequested)} requested</span><span>{a.awardedAmount!=null?money(a.awardedAmount):"—"}</span><span className={a.status==="APPROVED"?"accountReady":a.status==="REJECTED"?"accountPending":""}>{a.status}</span><span>{a.reviewNote||"Awaiting review"}</span></div>)}
      {!state.applications?.length&&<div className="emptyState">No scholarship applications yet.</div>}
    </div>
  </div>;

  return <div className="adminWorkspace">
    <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · FINANCIAL AID</span><h1>Scholarship <em>management.</em></h1><p>Publish schemes, enforce eligibility and process student applications with an audit trail.</p></div></div>
    {error&&<div className="loginError adminMessage">{error}</div>}{message&&<div className="toast">{message}</div>}
    <div className="card" style={{marginBottom:14}}><div className="cardHead"><div>{["Applications","Scholarship Schemes"].map(x=><button key={x} className={tab===x?"primary":"secondaryBtn"} style={{marginRight:8}} onClick={()=>setTab(x)}>{x}</button>)}</div><div style={{display:"flex",gap:8}}><input placeholder="Search student or scheme…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All status</option><option>PENDING</option><option>UNDER_REVIEW</option><option>APPROVED</option><option>REJECTED</option></select><button className="iconBtn" onClick={load}><Search size={16}/></button></div></div></div>

    {tab==="Scholarship Schemes"&&<div className="card"><div className="cardHead"><div><span className="eyebrow">SCHEME CATALOGUE</span><h2>Create scholarship scheme</h2></div><Plus size={18}/></div>
      <div className="formTwo">
        <div className="adminForm"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className="adminForm"><label>Code</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></div>
        <div className="adminForm"><label>Academic year</label><input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/></div>
        <div className="adminForm"><label>Maximum award (₹)</label><input type="number" min="0" value={form.maxAwardAmount} onChange={e=>setForm({...form,maxAwardAmount:e.target.value})}/></div>
        <div className="adminForm"><label>Income limit (₹, optional)</label><input type="number" min="0" value={form.incomeLimit} onChange={e=>setForm({...form,incomeLimit:e.target.value})}/></div>
        <div className="adminForm"><label>Minimum percentage (optional)</label><input type="number" min="0" max="100" step="0.01" value={form.minimumPercentage} onChange={e=>setForm({...form,minimumPercentage:e.target.value})}/></div>
        <div className="adminForm"><label>Application deadline</label><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></div>
        <div className="adminForm" style={{gridColumn:"1/-1"}}><label>Description</label><textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
      </div>
      <button className="primary" disabled={busy} onClick={async()=>{const d=await post({action:"create-program",...form});if(d)setForm({name:"",code:"",description:"",academicYear:"2026-27",maxAwardAmount:"",incomeLimit:"",minimumPercentage:"",deadline:""})}}><Plus size={14}/> Publish scholarship</button>
      <div className="studentAdminTable" style={{marginTop:16}}><div className="studentAdminHead"><span>SCHEME</span><span>YEAR</span><span>MAX AWARD</span><span>DEADLINE</span><span>APPLICATIONS</span><span>STATUS</span></div>
      {(state.programs||[]).map((p:any)=><div className="studentAdminRow" key={p.id}><div><b>{p.name}</b><small>{p.code}</small></div><span>{p.academicYear}</span><span>{money(p.maxAwardAmount)}</span><span>{date(p.deadline)}</span><span>{p._count?.applications||0}</span><button className="textBtn" onClick={()=>post({action:"toggle-program",programId:p.id})}>{p.active?"Close":"Open"}</button></div>)}</div>
    </div>}

    {tab==="Applications"&&<div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>SCHEME</span><span>REQUESTED</span><span>ACADEMIC</span><span>STATUS</span><span>DECISION</span></div>
      {(state.applications||[]).map((a:any)=><div className="studentAdminRow" key={a.id}><div><b>{a.student.name}</b><small>{a.student.enrollmentNo} · {a.student.division.semester.program.code}</small></div><span>{a.scholarship.name}</span><span>{money(a.amountRequested)}</span><span>{a.academicPercentage!=null?`${a.academicPercentage}%`:"—"}</span><span>{a.status}</span><div style={{display:"flex",gap:6}}>{a.status!=="APPROVED"&&<button className="textBtn" disabled={busy} onClick={()=>post({action:"review",applicationId:a.id,status:"APPROVED",awardedAmount:a.amountRequested})}><Check size={13}/> Approve</button>}{a.status!=="REJECTED"&&<button className="textBtn" disabled={busy} onClick={()=>{const note=window.prompt("Reason / review note?")||"";post({action:"review",applicationId:a.id,status:"REJECTED",reviewNote:note})}}><X size={13}/> Reject</button>}</div></div>)}
      {!state.applications?.length&&<div className="emptyState">No scholarship applications match the current filters.</div>}
    </div>}
  </div>;
}

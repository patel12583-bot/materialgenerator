"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FileCheck2, FileUp, GraduationCap, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

type Application = {
  id:string; applicationNo:string; admissionNo?:string|null; name:string; email?:string|null; phone?:string|null;
  parentName?:string|null; parentPhone?:string|null; status:string; rejectionReason?:string|null;
  department:{id:string;name:string;code:string}; program:{id:string;name:string;code:string};
  semester:{id:string;number:number}; division:{id:string;name:string};
  documents:{id:string;type:string;name:string;fileUrl:string;verified:boolean;verificationNote?:string|null}[];
  student?:{id:string;enrollmentNo:string;name:string}|null;
};

export default function AdmissionManagement(){
  const [applications,setApplications]=useState<Application[]>([]);
  const [departments,setDepartments]=useState<any[]>([]);
  const [programs,setPrograms]=useState<any[]>([]);
  const [divisions,setDivisions]=useState<any[]>([]);
  const [status,setStatus]=useState("");
  const [q,setQ]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [credentials,setCredentials]=useState<any>(null);
  const [selected,setSelected]=useState<Application|null>(null);
  const [form,setForm]=useState<any>({});

  async function load(){
    setLoading(true); setMessage("");
    try{
      const r=await fetch("/api/admin/admissions?status="+encodeURIComponent(status)+"&q="+encodeURIComponent(q),{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to load admissions.");
      setApplications(d.applications||[]); setDepartments(d.departments||[]); setPrograms(d.programs||[]); setDivisions(d.divisions||[]);
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to load admissions.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load()},[status]);
  const filteredPrograms=useMemo(()=>programs.filter(p=>!form.departmentId||p.departmentId===form.departmentId),[programs,form.departmentId]);
  const filteredDivisions=useMemo(()=>divisions.filter(d=>!form.programId||d.semester.program.id===form.programId).filter(d=>!form.semesterId||d.semester.id===form.semesterId),[divisions,form.programId,form.semesterId]);

  async function post(body:any){
    setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/admin/admissions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to save.");
      if(d.credentials)setCredentials(d.credentials);
      setMessage("Admission workflow updated successfully.");
      await load();
      if(selected){const fresh=(applications.find(x=>x.id===selected.id)); if(fresh)setSelected(fresh)}
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save.");}
    finally{setBusy(false)}
  }

  async function create(){
    await post({action:"create",...form});
    setForm({});
  }
  async function uploadDoc(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file||!selected)return;
    if(file.size>25*1024*1024){setMessage("Maximum file size is 25 MB.");return}
    setBusy(true);setMessage("");
    try{
      const fd=new FormData();fd.append("file",file);
      const up=await fetch("/api/blob/upload",{method:"POST",body:fd});
      const ud=await up.json(); if(!up.ok)throw new Error(ud.error||"File upload failed.");
      await post({action:"add-document",applicationId:selected.id,type:form.docType||"Other",name:file.name,fileUrl:ud.pathname||ud.url});
      await load();
      const fresh=(await (await fetch("/api/admin/admissions",{cache:"no-store"})).json()).applications?.find((x:any)=>x.id===selected.id);
      if(fresh)setSelected(fresh);
    }catch(e){setMessage(e instanceof Error?e.message:"Document upload failed.");}
    finally{setBusy(false);e.target.value=""}
  }

  return <div className="adminWorkspace">
    <div className="pageHead">
      <div><span className="eyebrow">ADMIN · ADMISSIONS</span><h1>Admission <em>centre.</em></h1><p>Application → document verification → approval → admission number → student enrollment.</p></div>
      <button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>

    <div className="portalStats" style={{marginBottom:14}}>
      <div className="metric"><span>Total applications</span><b>{applications.length}</b><small>Current intake</small></div>
      <div className="metric"><span>Verification</span><b>{applications.filter(x=>x.status==="DOCUMENT_VERIFICATION").length}</b><small>Awaiting document clearance</small></div>
      <div className="metric"><span>Approved</span><b>{applications.filter(x=>x.status==="APPROVED").length}</b><small>Ready to enroll</small></div>
      <div className="metric"><span>Enrolled</span><b>{applications.filter(x=>x.status==="ENROLLED").length}</b><small>Student accounts created</small></div>
    </div>

    <div className="card" style={{marginBottom:14}}>
      <div className="cardHead"><div><span className="eyebrow">NEW APPLICATION</span><h2>Register applicant</h2></div><GraduationCap size={18}/></div>
      <div className="formTwo">
        <div className="adminForm"><label>Applicant name</label><input value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className="adminForm"><label>Email</label><input value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div className="adminForm"><label>Mobile</label><input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10 digit"/></div>
        <div className="adminForm"><label>Parent name</label><input value={form.parentName||""} onChange={e=>setForm({...form,parentName:e.target.value})}/></div>
        <div className="adminForm"><label>Parent mobile</label><input value={form.parentPhone||""} onChange={e=>setForm({...form,parentPhone:e.target.value})}/></div>
        <div className="adminForm"><label>Department</label><select value={form.departmentId||""} onChange={e=>setForm({...form,departmentId:e.target.value,programId:"",semesterId:"",divisionId:""})}><option value="">Select</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></div>
        <div className="adminForm"><label>Program</label><select value={form.programId||""} onChange={e=>setForm({...form,programId:e.target.value,semesterId:"",divisionId:""})}><option value="">Select</option>{filteredPrograms.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></div>
        <div className="adminForm"><label>Semester / Division</label><select value={form.divisionId||""} onChange={e=>{const d=divisions.find(x=>x.id===e.target.value);setForm({...form,divisionId:e.target.value,semesterId:d?.semester?.id||""})}}><option value="">Select</option>{filteredDivisions.map(d=><option key={d.id} value={d.id}>Sem {d.semester.number} · Div {d.name}</option>)}</select></div>
      </div>
      <button className="primary" disabled={busy||!form.name||!form.departmentId||!form.programId||!form.divisionId} onClick={create}>Create application <GraduationCap size={14}/></button>
    </div>

    {message&&<div className="loginError adminMessage">{message}</div>}
    {credentials&&<div className="card" style={{marginBottom:14,border:"1px solid #b8e0c2"}}><div className="cardHead"><div><span className="eyebrow">STUDENT CREDENTIALS</span><h2>Enrollment completed</h2></div><ShieldCheck size={18}/></div><p><b>Student ID:</b> {credentials.studentId} &nbsp; <b>Temporary password:</b> {credentials.password}</p><small>Show/save these credentials securely. The password is generated once during enrollment.</small><button className="textBtn" onClick={()=>setCredentials(null)}><X size={14}/> Dismiss</button></div>}

    <div className="card studentAdminTable">
      <div className="studentAdminHead"><span>APPLICATION</span><span>APPLICANT</span><span>ACADEMIC PLACEMENT</span><span>STATUS</span><span>ACTION</span></div>
      {loading?<div className="emptyState">Loading admissions…</div>:applications.length===0?<div className="emptyState">No admission applications found.</div>:applications.map(a=><div className="studentAdminRow" key={a.id}>
        <div><b>{a.applicationNo}</b><small>{a.admissionNo||"Admission number pending"}</small></div>
        <div><b>{a.name}</b><small>{a.phone||"No mobile"}</small></div>
        <span>{a.program.code} · Sem {a.semester.number} · Div {a.division.name}</span>
        <span className={a.status==="REJECTED"?"accountPending":a.status==="ENROLLED"||a.status==="APPROVED"?"accountReady":""}>{a.status.replaceAll("_"," ")}</span>
        <button className="textBtn" onClick={()=>setSelected(a)}>Open <Search size={13}/></button>
      </div>)}
    </div>

    {selected&&<div className="modalOverlay" onClick={()=>setSelected(null)}><div className="modalCard" onClick={e=>e.stopPropagation()}>
      <div className="cardHead"><div><span className="eyebrow">APPLICATION {selected.applicationNo}</span><h2>{selected.name}</h2><small>{selected.program.name} · Semester {selected.semester.number} · Division {selected.division.name}</small></div><button className="iconBtn" onClick={()=>setSelected(null)}><X size={17}/></button></div>
      <div className="portalRows">
        <div className="portalRow"><div><b>Document verification</b><small>{selected.documents.filter(d=>d.verified).length} / {selected.documents.length} verified</small></div><span className="status">{selected.documents.length&&selected.documents.every(d=>d.verified)?"CLEARED":"PENDING"}</span></div>
        <div className="portalRow"><div><b>Application status</b><small>{selected.status.replaceAll("_"," ")}</small></div><span className="status">{selected.status}</span></div>
      </div>
      <div className="card" style={{marginTop:14}}>
        <div className="cardHead"><div><span className="eyebrow">DOCUMENTS</span><h3>Verification queue</h3></div><FileCheck2 size={17}/></div>
        <div className="adminForm"><label>Document type</label><select value={form.docType||"Other"} onChange={e=>setForm({...form,docType:e.target.value})}>{["Aadhaar / ID Proof","Birth Certificate","Marksheet","Transfer Certificate","Leaving Certificate","Passport Photo","Bonafide","Admission Form","Other"].map(x=><option key={x}>{x}</option>)}</select></div>
        <label className="uploadDrop"><FileUp size={18}/><span>Upload document<input type="file" onChange={uploadDoc} disabled={busy}/></span></label>
        <div className="portalRows">{selected.documents.map(d=><div className="portalRow" key={d.id}><div><b>{d.type}</b><small>{d.name}</small></div><div><a href={d.fileUrl} target="_blank" rel="noreferrer">Open</a>{d.verified?<span className="status present">Verified</span>:<button className="textBtn" onClick={()=>post({action:"verify-document",applicationId:selected.id,documentId:d.id,verified:true})}><Check size={13}/> Verify</button>}</div></div>)}</div>
      </div>
      <div className="card" style={{marginTop:14}}>
        <div className="cardHead"><div><span className="eyebrow">DECISION</span><h3>Admission decision</h3></div><ShieldCheck size={17}/></div>
        <div className="formTwo">
          <button className="primary" disabled={busy||!selected.documents.length||!selected.documents.every(d=>d.verified)||selected.status==="ENROLLED"} onClick={()=>post({action:"approve",applicationId:selected.id})}>Approve & enroll <Check size={14}/></button>
          <button className="secondaryBtn" disabled={busy||selected.status==="ENROLLED"} onClick={()=>{const reason=window.prompt("Reason for rejection?");if(reason)post({action:"reject",applicationId:selected.id,reason})}}>Reject application <X size={14}/></button>
        </div>
      </div>
    </div></div>}
  </div>;
}

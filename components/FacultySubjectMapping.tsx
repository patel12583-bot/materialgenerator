"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link2, RefreshCw, Search, Trash2, Users } from "lucide-react";

type Faculty={id:string;name:string;employeeCode:string;user:{departmentId:string|null}};
type Subject={id:string;code:string;name:string;department:{id:string;code:string;name:string};semester:{number:number;program:{code:string;name:string}}};
type Mapping={faculty:{id:string;name:string;employeeCode:string};subject:{id:string;code:string;name:string;semester:{number:number;program:{code:string}}}};

export default function FacultySubjectMapping(){
 const [faculty,setFaculty]=useState<Faculty[]>([]); const [subjects,setSubjects]=useState<Subject[]>([]); const [mappings,setMappings]=useState<Mapping[]>([]);
 const [facultyId,setFacultyId]=useState(""); const [subjectId,setSubjectId]=useState(""); const [query,setQuery]=useState(""); const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/admin/faculty-subjects",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load mappings.");setFaculty(d.faculty||[]);setSubjects(d.subjects||[]);setMappings(d.mappings||[]);}catch(e){setError(e instanceof Error?e.message:"Unable to load mappings.");}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>mappings.filter(x=>(x.faculty.name+" "+x.faculty.employeeCode+" "+x.subject.code+" "+x.subject.name).toLowerCase().includes(query.toLowerCase())),[mappings,query]);
 async function save(){setBusy(true);setError("");setNotice("");try{const r=await fetch("/api/admin/faculty-subjects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({facultyId,subjectId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to map subject.");setNotice("Subject mapped successfully.");setFacultyId("");setSubjectId("");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to map subject.");}finally{setBusy(false)}}
 async function remove(x:Mapping){if(!confirm("Remove "+x.subject.code+" from "+x.faculty.name+"?"))return;setBusy(true);setError("");try{const r=await fetch("/api/admin/faculty-subjects",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({facultyId:x.faculty.id,subjectId:x.subject.id})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to remove mapping.");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to remove mapping.");}finally{setBusy(false)}}
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">ACADEMIC · FACULTY SUBJECT MAPPING</span><h1>Connect <em>teaching.</em></h1><p>Assign faculty to subjects. Timetable creation validates these assignments.</p></div><button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button></div>
  {error&&<div className="loginError">{error}</div>}{notice&&<div className="globalNotice"><CheckCircle2 size={15}/>{notice}</div>}
  <div className="card" style={{marginBottom:14}}><div className="cardHead"><div><span className="eyebrow">NEW ASSIGNMENT</span><h2>Map faculty to subject</h2></div><Link2 size={18}/></div>
   <div className="formTwo"><div className="adminForm"><label>Faculty</label><select value={facultyId} onChange={e=>setFacultyId(e.target.value)}><option value="">Select faculty</option>{faculty.map(x=><option key={x.id} value={x.id}>{x.employeeCode} · {x.name}</option>)}</select></div>
   <div className="adminForm"><label>Subject</label><select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map(x=><option key={x.id} value={x.id}>{x.code} · {x.name} · {x.department.code} / Sem {x.semester.number}</option>)}</select></div></div>
   <button className="primary" disabled={busy||!facultyId||!subjectId} onClick={save}>{busy?"Saving…":"Create mapping"} <Link2 size={14}/></button>
  </div>
  <div className="card"><div className="cardHead"><div><span className="eyebrow">ACTIVE MAP</span><h2>Teaching assignments</h2></div><span className="countBadge">{mappings.length}</span></div>
   <div className="toolbar"><div className="searchBox"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search faculty or subject"/></div></div>
   {loading?<div className="emptyState">Loading mappings…</div>:filtered.length===0?<div className="emptyState"><Users size={24}/><p>No faculty-subject mappings found.</p></div>:<div className="studentAdminTable"><div className="studentAdminHead"><span>FACULTY</span><span>SUBJECT</span><span>PROGRAM</span><span>SEMESTER</span><span>ACTION</span></div>{filtered.map(x=><div className="studentAdminRow" key={x.faculty.id+"-"+x.subject.id}><div><b>{x.faculty.name}</b><small>{x.faculty.employeeCode}</small></div><span><b>{x.subject.code}</b><small>{x.subject.name}</small></span><span>{x.subject.semester.program.code}</span><span>Semester {x.subject.semester.number}</span><span><button className="textBtn" disabled={busy} onClick={()=>remove(x)}><Trash2 size={13}/> Unmap</button></span></div>)}</div>}
  </div>
 </div>
}
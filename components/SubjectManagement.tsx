"use client";

import {useEffect,useMemo,useState} from "react";
import {BookOpen,Plus,RefreshCw,Search} from "lucide-react";

type Subject={id:string;code:string;name:string;credits:number;department:{id:string;code:string;name:string};semester:{id:string;number:number;program:{id:string;code:string;name:string}}};
type Semester={id:string;number:number;program:{id:string;code:string;name:string}};

export default function SubjectManagement(){
 const [subjects,setSubjects]=useState<Subject[]>([]),[semesters,setSemesters]=useState<Semester[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[query,setQuery]=useState("");
 const [semesterId,setSemesterId]=useState(""),[code,setCode]=useState(""),[name,setName]=useState(""),[credits,setCredits]=useState("3");

 async function load(){
  setLoading(true);setError("");
  try{const r=await fetch("/api/workspace?page=Subjects",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load subjects.");setSubjects(d.subjects||[]);setSemesters(d.semesters||[]);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load subjects.");}finally{setLoading(false);}
 }
 useEffect(()=>{load()},[]);
 const selected=useMemo(()=>semesters.find(x=>x.id===semesterId),[semesters,semesterId]);
 const filtered=useMemo(()=>subjects.filter(s=>(s.code+" "+s.name+" "+s.department.name+" "+s.semester.program.name).toLowerCase().includes(query.toLowerCase())),[subjects,query]);
 async function create(){
  if(!semesterId||!code.trim()||!name.trim()){setError("Semester, subject code and subject name are required.");return;}
  setBusy(true);setError("");
  try{const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create-subject",departmentId:selected?.program?undefined:undefined,semesterId,code,name,credits:Number(credits)})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to create subject.");
   setCode("");setName("");setCredits("3");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to create subject.");}finally{setBusy(false);}
 }
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">ADMIN · ACADEMIC MANAGEMENT</span><h1>Manage <em>subjects.</em></h1><p>Create and maintain the subject catalogue used by timetable, attendance and examinations.</p></div><button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button></div>
  {error&&<div className="globalNotice"><BookOpen size={15}/><span>{error}</span></div>}
  <div className="adminStructureGrid">
   <div className="card"><div className="cardHead"><div><span className="eyebrow">CREATE</span><h2>New subject</h2></div><Plus size={18}/></div>
    <div className="adminForm">
     <label>Program & semester</label><select value={semesterId} onChange={e=>setSemesterId(e.target.value)}><option value="">Select semester</option>{semesters.map(s=><option key={s.id} value={s.id}>{s.program.code} · {s.program.name} · Semester {s.number}</option>)}</select>
     <label>Subject code</label><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. BCA301"/>
     <label>Subject name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Database Management Systems"/>
     <label>Credits</label><input type="number" min="0" max="10" value={credits} onChange={e=>setCredits(e.target.value)}/>
     <button className="primary fullBtn" onClick={create} disabled={busy}>{busy?"Creating…":"Create subject"} <Plus size={14}/></button>
    </div>
   </div>
   <div className="card"><div className="cardHead"><div><span className="eyebrow">CATALOGUE · {subjects.length}</span><h2>Subjects</h2></div><BookOpen size={18}/></div>
    <div className="searchBar"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search subject, code, program…"/></div>
    {loading?<div className="emptyState">Loading subject catalogue…</div>:filtered.length===0?<div className="emptyState">No subjects match your search.</div>:<div className="lectureStack">{filtered.map(s=><div className="lectureCard" key={s.id}><div className="lectureTime"><BookOpen size={18}/><b>{s.code}</b></div><div className="lectureInfo"><span>{s.department.code} · {s.semester.program.code} · Semester {s.semester.number}</span><h2>{s.name}</h2><small>{s.credits} credit{s.credits===1?"":"s"}</small></div><span className="status present">ACTIVE</span></div>)}</div>}
   </div>
  </div>
 </div>
}
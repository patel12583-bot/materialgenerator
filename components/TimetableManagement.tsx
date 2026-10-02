"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

type Props={canEdit?:boolean};
type Entry={id:string;dayOfWeek:number;lectureNumber:number;startTime:string;endTime:string;room?:string|null;division:any;subject:any;faculty:any};
type Data={divisions:any[];subjects:any[];faculty:any[];entries:Entry[]};

const days=["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const slots={1:["09:00","10:00"],2:["10:00","11:00"],3:["11:15","12:15"],4:["12:15","13:15"],5:["14:00","15:00"],6:["15:00","16:00"]};

export default function TimetableManagement({canEdit=true}:Props){
 const [data,setData]=useState<Data>({divisions:[],subjects:[],faculty:[],entries:[]});
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [editing,setEditing]=useState<Entry|null>(null);
 const [selectedDay,setSelectedDay]=useState(1);
 const empty={divisionId:"",subjectId:"",facultyId:"",dayOfWeek:1,lectureNumber:1,startTime:"09:00",endTime:"10:00",room:""};
 const [form,setForm]=useState<any>(empty);

 async function load(){
  setLoading(true);setError("");
  try{const r=await fetch("/api/workspace?page=Master%20Timetable",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load timetable.");setData(d);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load timetable.");}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);

 const divisions=data.divisions;
 const subjects=useMemo(()=>form.divisionId?data.subjects.filter(s=>s.semesterId===divisions.find(d=>d.id===form.divisionId)?.semesterId):data.subjects,[form.divisionId,data.subjects,divisions]);
 const faculty=useMemo(()=>form.subjectId?data.faculty.filter(f=>f.subjectMappings?.some((m:any)=>m.subjectId===form.subjectId)):data.faculty,[form.subjectId,data.faculty]);
 const dayEntries=data.entries.filter(e=>e.dayOfWeek===selectedDay);

 function chooseSlot(n:number){
  const s=(slots as any)[n]||["09:00","10:00"];
  setForm((x:any)=>({...x,lectureNumber:n,startTime:s[0],endTime:s[1]}));
 }
 function edit(e:Entry){
  setEditing(e);setForm({divisionId:e.division.id,subjectId:e.subject.id,facultyId:e.faculty.id,dayOfWeek:e.dayOfWeek,lectureNumber:e.lectureNumber,startTime:e.startTime,endTime:e.endTime,room:e.room||""});
 }
 function reset(){setEditing(null);setForm({...empty,dayOfWeek:selectedDay});}
 async function save(){
  setSaving(true);setError("");
  try{
   const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:editing?"update-timetable":"create-timetable",...(editing?{id:editing.id}:{}),...form})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Timetable could not be saved.");
   reset();await load();
  }catch(e){setError(e instanceof Error?e.message:"Timetable could not be saved.");}finally{setSaving(false)}
 }
 async function remove(id:string){
  if(!confirm("Disable this timetable entry? Attendance history is preserved."))return;
  setSaving(true);setError("");
  try{const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"delete-timetable",id})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to disable timetable.");await load();}
  catch(e){setError(e instanceof Error?e.message:"Unable to disable timetable.");}finally{setSaving(false)}
 }

 if(loading)return <div className="card emptyState"><RefreshCw size={18}/><b>Loading master timetable…</b></div>;
 return <div className="ttPage">
  <div className="pageHead">
   <div><span className="eyebrow">ACADEMIC OPERATIONS · MASTER TIMETABLE</span><h1>Timetable<span>.</span></h1><p>One controlled timetable for divisions, faculty, rooms and lecture slots. Conflicts are validated before anything is saved.</p></div>
   <button className="secondaryBtn" onClick={load}><RefreshCw size={14}/> Refresh</button>
  </div>
  {error&&<div className="globalNotice"><span>{error}</span></div>}
  <div className="ttToolbar">
   <div className="ttDays">{days.slice(1).map((d,i)=><button key={d} className={selectedDay===i+1?"ttDay active":"ttDay"} onClick={()=>setSelectedDay(i+1)}>{d.slice(0,3)}<small>{i+1}</small></button>)}</div>
   <div className="ttSummary"><CheckCircle2 size={14}/>{data.entries.length} active lecture slots</div>
  </div>
  <div className="ttLayout">
   {canEdit&&<div className="card ttEditor">
    <div className="cardHead"><div><span className="eyebrow">{editing?"EDIT SLOT":"ADD SLOT"}</span><h2>{editing?"Update lecture":"Create lecture"}</h2></div>{editing&&<button className="textBtn" onClick={reset}>Cancel</button>}</div>
    <div className="adminForm">
     <label>Division</label><select value={form.divisionId} onChange={e=>setForm((x:any)=>({...x,divisionId:e.target.value,subjectId:"",facultyId:""}))}><option value="">Select division</option>{divisions.map(d=><option key={d.id} value={d.id}>{d.semester?.program?.code} · Sem {d.semester?.number} · {d.name}</option>)}</select>
     <label>Subject</label><select value={form.subjectId} onChange={e=>setForm((x:any)=>({...x,subjectId:e.target.value,facultyId:""}))}><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}</select>
     <label>Faculty</label><select value={form.facultyId} onChange={e=>setForm((x:any)=>({...x,facultyId:e.target.value}))}><option value="">Select assigned faculty</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.employeeCode} · {f.name}</option>)}</select>
     <label>Day</label><select value={form.dayOfWeek} onChange={e=>{const d=Number(e.target.value);setSelectedDay(d);setForm((x:any)=>({...x,dayOfWeek:d}))}}>{days.slice(1).map((d,i)=><option key={d} value={i+1}>{d}</option>)}</select>
     <label>Lecture slot</label><div className="slotGrid">{Object.entries(slots).map(([n,s])=><button type="button" key={n} className={Number(n)===form.lectureNumber?"slot active":"slot"} onClick={()=>chooseSlot(Number(n))}><b>L{n}</b><span>{s[0]}–{s[1]}</span></button>)}</div>
     <label>Room / Lab <span className="optional">optional</span></label><input value={form.room} placeholder="e.g. C-204 / Lab-2" onChange={e=>setForm((x:any)=>({...x,room:e.target.value}))}/>
     <button className="primary fullBtn" disabled={saving||!form.divisionId||!form.subjectId||!form.facultyId} onClick={save}>{saving?"Saving…":editing?"Update timetable":"Add to timetable"} <Plus size={14}/></button>
    </div>
   </div>}
   <div className="ttBoard">
    <div className="ttBoardHead"><div><span className="eyebrow">WEEKDAY VIEW</span><h2>{days[selectedDay]}</h2></div><span>{dayEntries.length} lectures</span></div>
    {dayEntries.length===0?<div className="emptyState"><CalendarDays size={22}/><b>No lectures scheduled</b><span>{canEdit?"Use the editor to add the first slot for this day.":"No timetable has been published for this day."}</span></div>:
     <div className="ttSlots">{dayEntries.map(e=><div className="ttEntry" key={e.id}><div className="ttTime"><b>L{e.lectureNumber}</b><span><Clock3 size={12}/>{e.startTime}–{e.endTime}</span></div><div><b>{e.subject.code} · {e.subject.name}</b><small>{e.division?.semester?.program?.code} · Sem {e.division?.semester?.number} · Div {e.division?.name}</small></div><div><b>{e.faculty.name}</b><small>{e.room||"Room not assigned"}</small></div>{canEdit&&<div className="ttActions"><button onClick={()=>edit(e)} title="Edit"><Pencil size={14}/></button><button onClick={()=>remove(e.id)} title="Disable"><Trash2 size={14}/></button></div>}</div>)}</div>}
   </div>
  </div>
 </div>
}

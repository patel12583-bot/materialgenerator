"use client";
import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, ChevronDown, ChevronRight, GraduationCap, Plus, RefreshCw, Save, School, Users, X } from "lucide-react";

type Division={id:string;name:string;_count:{students:number}};
type Semester={id:string;number:number;divisions:Division[];_count:{subjects:number}};
type Program={id:string;name:string;code:string;totalSemesters:number;semesters:Semester[]};
type Department={id:string;name:string;code:string;programs:Program[]};

export default function AcademicStructure({readOnly=false}:{readOnly?:boolean}){
  const [departments,setDepartments]=useState<Department[]>([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [open,setOpen]=useState<Record<string,boolean>>({});
  const [modal,setModal]=useState<"department"|"program"|"division"|null>(null);
  const [parentId,setParentId]=useState(""); const [form,setForm]=useState({name:"",code:"",totalSemesters:"6"});
  const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);setError("");
    try{const r=await fetch("/api/admin/academic-structure",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load academic structure.");setDepartments(d.departments||[])}
    catch(e){setError(e instanceof Error?e.message:"Unable to load academic structure.")}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  const stats=useMemo(()=>({departments:departments.length,programs:departments.reduce((a,d)=>a+d.programs.length,0),semesters:departments.reduce((a,d)=>a+d.programs.reduce((b,p)=>b+p.semesters.length,0),0),divisions:departments.reduce((a,d)=>a+d.programs.reduce((b,p)=>b+p.semesters.reduce((c,s)=>c+s.divisions.length,0),0),0)}),[departments]);

  function start(type:"department"|"program"|"division",id=""){setModal(type);setParentId(id);setForm({name:"",code:"",totalSemesters:"6"});setNotice("");}
  async function save(){
    if(!modal)return; setSaving(true);setError("");setNotice("");
    const body=modal==="department"?{action:"create-department",name:form.name,code:form.code}:modal==="program"?{action:"create-program",departmentId:parentId,name:form.name,code:form.code,totalSemesters:Number(form.totalSemesters)}:{action:"create-division",semesterId:parentId,name:form.name};
    try{const r=await fetch("/api/admin/academic-structure",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save.");setModal(null);setNotice("Academic structure updated successfully.");await load()}
    catch(e){setError(e instanceof Error?e.message:"Unable to save.")}finally{setSaving(false)}
  }
  return <div className="adminWorkspace">
    <div className="pageHead"><div><span className="eyebrow">ACADEMIC ADMINISTRATION</span><h1>Academic <em>structure.</em></h1><p>Institution → Department → Program → Semester → Division. This hierarchy powers students, subjects, timetable and attendance.</p></div>{!readOnly&&<button className="primary" onClick={()=>start("department")}><Plus size={15}/> Add Department</button>}</div>
    {notice&&<div className="successState"><Save size={16}/><span>{notice}</span></div>}
    {error&&<div className="errorState"><X size={16}/><div><b>Action could not be completed</b><p>{error}</p></div><button onClick={()=>setError("")}><X size={14}/></button></div>}
    <div className="miniStats"><div><School size={18}/><span>Departments<b>{stats.departments}</b></span></div><div><GraduationCap size={18}/><span>Programs<b>{stats.programs}</b></span></div><div><BookOpen size={18}/><span>Semesters<b>{stats.semesters}</b></span></div><div><Users size={18}/><span>Divisions<b>{stats.divisions}</b></span></div></div>
    {loading?<div className="card emptyState"><Activity size={20}/><span>Loading academic hierarchy…</span></div>:departments.length===0?<div className="card emptyState"><School size={24}/><h2>No departments configured</h2><p>Create the first department to begin the institution's academic master.</p></div>:<div className="structureTree">
      {departments.map(d=><div className="structureNode" key={d.id}>
        <button className="structureHeader" onClick={()=>setOpen(x=>({...x,[d.id]:!x[d.id]}))}><span className="nodeIcon"><School size={17}/></span><span><b>{d.name}</b><small>{d.code} · {d.programs.length} program(s)</small></span>{open[d.id]?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</button>
        {open[d.id]&&<div className="structureChildren">{d.programs.map(p=><div className="structureProgram" key={p.id}><div className="programHead"><div><b>{p.name}</b><small>{p.code} · {p.totalSemesters} semester(s)</small></div>{!readOnly&&<button className="tinyBtn" onClick={()=>start("division",p.semesters[0]?.id||"")} title="Add division"><Plus size={14}/></button>}</div>
          <div className="semesterGrid">{p.semesters.map(s=><div className="semesterCard" key={s.id}><div className="semesterTitle"><span>Semester {s.number}</span><small>{s._count.subjects} subjects</small></div><div className="divisionList">{s.divisions.map(v=><div className="divisionPill" key={v.id}><span>{v.name}</span><small>{v._count.students} students</small></div>)}{!readOnly&&<button className="addDivision" onClick={()=>start("division",s.id)}><Plus size={13}/> Division</button>}</div></div>)}</div>
        </div>)}
        {!readOnly&&<button className="outlineAction" onClick={()=>start("program",d.id)}><Plus size={14}/> Add Program</button>}</div>}
      </div>)}
    </div>}
    {modal&&<div className="modalBackdrop" onClick={()=>setModal(null)}><div className="modalCard" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><span className="eyebrow">ACADEMIC MASTER</span><h2>Add {modal}</h2></div><button className="iconBtn" onClick={()=>setModal(null)}><X size={17}/></button></div>
      {modal==="division"?<label>Division name<input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="A"/></label>:<><label>{modal==="department"?"Department":"Program"} name<input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={modal==="department"?"Computer Applications":"Bachelor of Computer Applications"}/></label><label>Code<input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder={modal==="department"?"BCA":"BCA"}/></label>{modal==="program"&&<label>Total semesters<input type="number" min="1" max="20" value={form.totalSemesters} onChange={e=>setForm({...form,totalSemesters:e.target.value})}/></label>}</>}
      <div className="modalActions"><button className="secondary" onClick={()=>setModal(null)}>Cancel</button><button className="primary" disabled={saving} onClick={save}>{saving?"Saving…":"Create"} <Save size={14}/></button></div>
    </div></div>}
  </div>
}

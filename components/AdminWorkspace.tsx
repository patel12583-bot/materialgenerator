"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Building2, Layers3, GraduationCap, Users } from "lucide-react";

type Division = { id:string; name:string; _count?:{students:number} };
type Semester = { id:string; number:number; divisions:Division[] };
type Program = { id:string; name:string; code:string; totalSemesters:number; semesters:Semester[] };
type Department = { id:string; name:string; code:string; programs:Program[] };

export default function AdminWorkspace(){
  const [departments,setDepartments]=useState<Department[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [entity,setEntity]=useState<"department"|"program"|"semester"|"division">("department");
  const [name,setName]=useState("");
  const [code,setCode]=useState("");
  const [departmentId,setDepartmentId]=useState("");
  const [programId,setProgramId]=useState("");
  const [semesterId,setSemesterId]=useState("");
  const [number,setNumber]=useState("1");
  const [totalSemesters,setTotalSemesters]=useState("6");

  async function load(){
    setLoading(true); setError("");
    try{
      const r=await fetch("/api/admin/structure",{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to load structure.");
      setDepartments(d.departments||[]);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load structure.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load()},[]);

  const selectedDepartment=useMemo(()=>departments.find(x=>x.id===departmentId)||null,[departments,departmentId]);
  const selectedProgram=useMemo(()=>selectedDepartment?.programs.find(x=>x.id===programId)||null,[selectedDepartment,programId]);
  const selectedSemester=useMemo(()=>selectedProgram?.semesters.find(x=>x.id===semesterId)||null,[selectedProgram,semesterId]);

  async function save(){
    setBusy(true); setError("");
    const payload:Record<string,string|number>={entity,name:name.trim(),code:code.trim()};
    if(entity==="program") Object.assign(payload,{departmentId,totalSemesters:Number(totalSemesters)});
    if(entity==="semester") Object.assign(payload,{programId,number:Number(number)});
    if(entity==="division") Object.assign(payload,{semesterId});
    if(entity!=="division" && (!name.trim() || !code.trim())){setError("Name and code are required.");setBusy(false);return;}
    if(entity==="division" && !name.trim()){setError("Division name is required.");setBusy(false);return;}
    try{
      const r=await fetch("/api/admin/structure",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to save.");
      setName("");setCode("");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
    finally{setBusy(false);}
  }

  return <div className="adminWorkspace">
    <div className="pageHead">
      <div><span className="eyebrow">ADMIN · ACADEMIC STRUCTURE</span><h1>Build the <em>college.</em></h1><p>Departments → Programs → Semesters → Divisions. Everything here is stored in the Noble database.</p></div>
      <button className="secondaryBtn" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>

    <div className="adminStructureGrid">
      <div className="card">
        <div className="cardHead"><div><span className="eyebrow">CREATE</span><h2>Add academic structure</h2></div><Plus size={18}/></div>
        <div className="adminForm">
          <label>What do you want to add?</label>
          <select value={entity} onChange={e=>setEntity(e.target.value as typeof entity)}>
            <option value="department">Department</option><option value="program">Program</option><option value="semester">Semester</option><option value="division">Division</option>
          </select>
          {entity==="program" && <><label>Department</label><select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setProgramId("")}}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select></>}
          {entity==="semester" && <><label>Department</label><select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setProgramId("");setSemesterId("")}}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select><label>Program</label><select value={programId} onChange={e=>setProgramId(e.target.value)}><option value="">Select program</option>{selectedDepartment?.programs.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></>}
          {entity==="division" && <><label>Department</label><select value={departmentId} onChange={e=>{setDepartmentId(e.target.value);setProgramId("");setSemesterId("")}}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}</select><label>Program</label><select value={programId} onChange={e=>{setProgramId(e.target.value);setSemesterId("")}}><option value="">Select program</option>{selectedDepartment?.programs.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select><label>Semester</label><select value={semesterId} onChange={e=>setSemesterId(e.target.value)}><option value="">Select semester</option>{selectedProgram?.semesters.map(s=><option key={s.id} value={s.id}>Semester {s.number}</option>)}</select></>}
          <label>{entity==="division"?"Division name":"Name"}</label><input value={name} onChange={e=>setName(e.target.value)} placeholder={entity==="division"?"A / B / C":"e.g. Bachelor of Computer Applications"}/>
          {entity!=="division" && entity!=="semester" && <><label>Code</label><input value={code} onChange={e=>setCode(e.target.value)} placeholder={entity==="department"?"BCA":"BCA"}/></>}
          {entity==="semester" && <><label>Semester number</label><input type="number" min="1" max="12" value={number} onChange={e=>setNumber(e.target.value)}/></>}
          {entity==="program" && <><label>Total semesters</label><input type="number" min="1" max="12" value={totalSemesters} onChange={e=>setTotalSemesters(e.target.value)}/></>}
          {error&&<div className="loginError">{error}</div>}
          <button className="primary fullBtn" onClick={save} disabled={busy}>{busy?"Saving…":"Create record"} <Plus size={14}/></button>
        </div>
      </div>

      <div className="card structureCard">
        <div className="cardHead"><div><span className="eyebrow">DATABASE HIERARCHY</span><h2>Academic structure</h2></div><Building2 size={18}/></div>
        {loading?<div className="emptyState">Loading academic structure…</div>:departments.length===0?<div className="emptyState">No departments yet. Create the first department.</div>:<div className="structureTree">{departments.map(d=><div className="treeDepartment" key={d.id}><div className="treeTitle"><span className="treeIcon"><Building2 size={14}/></span><div><b>{d.code} · {d.name}</b><small>{d.programs.length} program(s)</small></div></div>{d.programs.map(p=><div className="treeProgram" key={p.id}><Layers3 size={14}/><div><b>{p.code} · {p.name}</b><small>{p.totalSemesters} semester(s)</small></div>{p.semesters.map(s=><div className="treeSemester" key={s.id}><GraduationCap size={13}/><span>Sem {s.number}</span><small>{s.divisions.map(v=>v.name).join(", ")||"No divisions"} · {s.divisions.reduce((n,v)=>n+(v._count?.students||0),0)} students</small></div>)}</div>)}</div>)}</div>}
      </div>
    </div>
  </div>
}
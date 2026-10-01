"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Check, X, Search, Download, Save, CalendarDays, Users, BookOpen, Bell, ShieldCheck } from "lucide-react";

type Role="Admin"|"Faculty"|"Student"|"HOD"|"Parent"|"Super Admin";
type Props={role:Role;page:string};
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function WorkspaceModule({role,page}:Props){
 const [data,setData]=useState<any>({});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [form,setForm]=useState<any>({});
 async function load(){setLoading(true);setMessage("");try{const r=await fetch("/api/workspace?page="+encodeURIComponent(page),{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load.");setData(d)}catch(e){setMessage(e instanceof Error?e.message:"Unable to load.")}finally{setLoading(false)}}
 useEffect(()=>{load();setForm({})},[page,role]);
 async function post(action:string,extra:any={}){setBusy(true);setMessage("");try{const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,...form,...extra})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save.");setMessage("Saved successfully.");setForm({});await load()}catch(e){setMessage(e instanceof Error?e.message:"Unable to save.")}finally{setBusy(false)}}
 if(loading)return <div className="card emptyState">Loading {page.toLowerCase()}…</div>;

 if(page==="Overview")return <Overview data={data} role={role}/>;
 if(page==="Exam Attendance")return <ExamAttendance data={data} form={form} setForm={setForm} busy={busy} post={post} message={message}/>;
 if(page==="Subjects")return <Subjects data={data} form={form} setForm={setForm} busy={busy} post={post} message={message}/>;
 if(page==="Master Timetable"||page==="Timetable")return <Timetable data={data} role={role} form={form} setForm={setForm} busy={busy} post={post} message={message}/>;
 if(page==="Leaves"||page==="Leave Requests"||page==="Leave Status")return <Leaves data={data} role={role} form={form} setForm={setForm} busy={busy} post={post} message={message}/>;
 if(page==="Defaulters")return <Defaulters data={data} post={post} busy={busy} message={message}/>;
 if(page==="Reports"||page==="My Attendance")return <Reports data={data} role={role}/>;
 if(page==="Notifications"||page==="Parent Alerts")return <Notifications data={data}/>;
 if(page==="Audit Logs")return <AuditLogs data={data}/>;
 if(page==="Settings")return <Settings data={data} form={form} setForm={setForm} busy={busy} post={post} message={message}/>;
 if(page==="Adjustments")return <Adjustments data={data}/>;
 if(page==="Faculty"||page==="Students"||page==="Attendance Monitor"||page==="Administrators"||page==="Institutions")return <People data={data} page={page}/>;
 if(page==="Security")return <div className="card"><span className="eyebrow">SECURITY</span><h2>Security controls</h2><p className="quickText">Session, role access and audit infrastructure are enabled. Production should use a configured SESSION_SECRET and authenticated role access.</p></div>;
 return <div className="card emptyState">This workspace is ready for configuration.</div>;
}

function Overview({data,role}:{data:any;role:Role}){const cards=[["Students",data.students||0],["Faculty",data.faculty||0],["Subjects",data.subjects||0],["Timetable entries",data.timetable||0],["Pending leaves",data.leaves||0],["Queued alerts",data.notifications||0]];return <><div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · OVERVIEW</span><h1>Command <em>centre.</em></h1><p>Live database-backed summary for Noble Group of Institutions.</p></div></div><div className="portalStats">{cards.map(([a,b])=><div className="metric" key={String(a)}><span>{a}</span><b>{String(b)}</b><small>Current academic year</small></div>)}</div><div className="card"><div className="cardHead"><div><span className="eyebrow">WORKFLOW</span><h2>Attendance lifecycle</h2></div><ShieldCheck size={18}/></div><div className="portalRows"><div className="portalRow"><div><b>Timetable → Attendance → Reports</b><small>Faculty attendance sessions are connected directly to assigned timetable entries.</small></div><span className="status present">Connected</span></div><div className="portalRow"><div><b>Leave → On Leave</b><small>Approved leave is represented separately from absence.</small></div><span className="status present">Connected</span></div><div className="portalRow"><div><b>Absent → Parent alerts</b><small>SMS and WhatsApp notifications are queued from submitted attendance.</small></div><span className="status present">Queued</span></div></div></div></>}

function Subjects({data,form,setForm,busy,post,message}:any){return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">ADMIN · SUBJECTS</span><h1>Manage <em>subjects.</em></h1><p>Create subjects against the real semester structure.</p></div></div><div className="adminStructureGrid"><div className="card"><div className="cardHead"><div><span className="eyebrow">CREATE</span><h2>New subject</h2></div><BookOpen size={18}/></div><div className="adminForm"><label>Semester</label><select value={form.semesterId||""} onChange={e=>setForm({...form,semesterId:e.target.value})}><option value="">Select semester</option>{(data.semesters||[]).map((s:any)=><option key={s.id} value={s.id}>{s.program.code} · Sem {s.number}</option>)}</select><label>Subject code</label><input value={form.code||""} onChange={e=>setForm({...form,code:e.target.value})} placeholder="BCA101"/><label>Subject name</label><input value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Database Management System"/><label>Credits</label><input type="number" min="0" value={form.credits??3} onChange={e=>setForm({...form,credits:e.target.value})}/>{message&&<div className="loginError">{message}</div>}<button className="primary fullBtn" disabled={busy||!form.semesterId||!form.code||!form.name} onClick={()=>{const s=(data.semesters||[]).find((x:any)=>x.id===form.semesterId);post("create-subject",{departmentId:s?.program?.departmentId})}}>{busy?"Saving…":"Create subject"} <Plus size={14}/></button></div></div><div className="card studentAdminTable"><div className="studentAdminHead"><span>CODE</span><span>SUBJECT</span><span>PROGRAM</span><span>SEMESTER</span><span>CREDITS</span></div>{(data.subjects||[]).map((s:any)=><div className="studentAdminRow" key={s.id}><b>{s.code}</b><span>{s.name}</span><span>{s.semester.program.code}</span><span>Sem {s.semester.number}</span><span>{s.credits}</span></div>)}</div></div></div>}

function Timetable({data,role,form,setForm,busy,post,message}:any){
 const admin=role==="Admin"; const [editing,setEditing]=useState<string|null>(null);
 const [substituteId,setSubstituteId]=useState<string|null>(null);
 const [subDate,setSubDate]=useState("");
 return <div className="adminWorkspace">
  <div className="pageHead"><div><span className="eyebrow">{admin?"ADMIN · MASTER TIMETABLE":"FACULTY · TIMETABLE"}</span><h1>{admin?"Master timetable":"My timetable"}<em>.</em></h1><p>Monday–Saturday schedule with faculty, division, room and conflict protection.</p></div></div>
  {admin&&<div className="card" style={{marginBottom:14}}><div className="cardHead"><div><span className="eyebrow">{editing?"EDIT LECTURE":"CREATE LECTURE"}</span><h2>{editing?"Update timetable slot":"Assign a timetable slot"}</h2></div><CalendarDays size={18}/></div>
   <div className="formTwo">
    <div className="adminForm"><label>Division</label><select value={form.divisionId||""} onChange={e=>setForm({...form,divisionId:e.target.value})}><option value="">Select</option>{(data.divisions||[]).map((x:any)=><option key={x.id} value={x.id}>{x.semester.program.code} · Sem {x.semester.number} · Div {x.name}</option>)}</select></div>
    <div className="adminForm"><label>Subject</label><select value={form.subjectId||""} onChange={e=>setForm({...form,subjectId:e.target.value})}><option value="">Select</option>{(data.subjects||[]).map((x:any)=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div>
    <div className="adminForm"><label>Faculty</label><select value={form.facultyId||""} onChange={e=>setForm({...form,facultyId:e.target.value})}><option value="">Select</option>{(data.faculty||[]).map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.employeeCode}</option>)}</select></div>
    <div className="adminForm"><label>Day</label><select value={form.dayOfWeek??1} onChange={e=>setForm({...form,dayOfWeek:e.target.value})}>{days.slice(1).map((x,i)=><option key={x} value={i+1}>{x}</option>)}</select></div>
    <div className="adminForm"><label>Lecture no.</label><input type="number" min="1" max="6" value={form.lectureNumber??1} onChange={e=>setForm({...form,lectureNumber:e.target.value})}/></div>
    <div className="adminForm"><label>Start</label><input type="time" value={form.startTime||"09:00"} onChange={e=>setForm({...form,startTime:e.target.value})}/></div>
    <div className="adminForm"><label>End</label><input type="time" value={form.endTime||"10:00"} onChange={e=>setForm({...form,endTime:e.target.value})}/></div>
    <div className="adminForm"><label>Room</label><input value={form.room||""} onChange={e=>setForm({...form,room:e.target.value})} placeholder="Room 101"/></div>
   </div>{message&&<div className="loginError">{message}</div>}
   <button className="primary" disabled={busy} onClick={async()=>{await post(editing?"update-timetable":"create-timetable",editing?{id:editing}:{});setEditing(null)}}>{busy?"Saving…":editing?"Update timetable":"Add timetable entry"} <Plus size={14}/></button>
   {editing&&<button className="secondaryBtn" style={{marginLeft:8}} onClick={()=>{setEditing(null);setForm({})}}>Cancel</button>}
  </div>}
  <div className="card studentAdminTable"><div className="studentAdminHead"><span>DAY / TIME</span><span>CLASS</span><span>SUBJECT</span><span>FACULTY</span><span>ROOM</span><span>ACTION</span></div>
   {(data.entries||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><div><b>{days[x.dayOfWeek]}</b><small>Lecture {x.lectureNumber} · {x.startTime}–{x.endTime}</small></div><span>{x.division.semester.program.code} · Sem {x.division.semester.number} · Div {x.division.name}</span><span>{x.subject.code} · {x.subject.name}</span><span>{x.faculty.name}</span><span>{x.room||"—"}</span><span>{admin&&<><button className="textBtn" onClick={()=>{setEditing(x.id);setForm({id:x.id,divisionId:x.divisionId,subjectId:x.subjectId,facultyId:x.facultyId,dayOfWeek:x.dayOfWeek,lectureNumber:x.lectureNumber,startTime:x.startTime,endTime:x.endTime,room:x.room||""})}}>Edit</button><button className="textBtn" onClick={()=>post("delete-timetable",{id:x.id})}>Delete</button><button className="textBtn" onClick={()=>setSubstituteId(substituteId===x.id?null:x.id)}>Proxy</button></>}</span></div>)}
  </div>
  {admin&&substituteId&&<div className="card" style={{marginTop:14}}><div className="cardHead"><div><span className="eyebrow">SUBSTITUTE / PROXY</span><h2>Assign temporary faculty</h2></div></div><div className="formTwo"><div className="adminForm"><label>Date</label><input type="date" value={subDate} onChange={e=>setSubDate(e.target.value)}/></div><div className="adminForm"><label>Substitute faculty</label><select value={form.substituteFacultyId||""} onChange={e=>setForm({...form,substituteFacultyId:e.target.value})}><option value="">Select</option>{(data.faculty||[]).map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.employeeCode}</option>)}</select></div><div className="adminForm"><label>Reason</label><input value={form.reason||""} onChange={e=>setForm({...form,reason:e.target.value})}/></div></div><button className="primary" disabled={busy||!subDate||!form.substituteFacultyId} onClick={()=>post("create-substitute",{timetableId:substituteId,dateKey:subDate})}>Save substitute</button></div>}
 </div>
}

function ExamAttendance({data,form,setForm,busy,post,message}:any){const [session,setSession]=useState<any>(null);const [records,setRecords]=useState<any[]>([]);const [submitted,setSubmitted]=useState(false);return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">FACULTY · EXAM MODE</span><h1>Exam <em>attendance.</em></h1><p>Isolated from regular lecture attendance analytics.</p></div></div>{!session?<div className="card"><div className="formTwo"><div className="adminForm"><label>Exam type</label><select value={form.examType||"MID_SEM"} onChange={e=>setForm({...form,examType:e.target.value})}><option value="MID_SEM">Mid-Sem</option><option value="FINAL_EXAM">Final</option><option value="UNIT_TEST">Unit Test</option></select></div><div className="adminForm"><label>Division</label><select value={form.divisionId||""} onChange={e=>setForm({...form,divisionId:e.target.value})}><option value="">Select</option>{(data.divisions||[]).map((x:any)=><option key={x.id} value={x.id}>{x.semester.program.code} · Sem {x.semester.number} · Div {x.name}</option>)}</select></div><div className="adminForm"><label>Subject</label><select value={form.subjectId||""} onChange={e=>setForm({...form,subjectId:e.target.value})}><option value="">Select</option>{(data.subjects||[]).map((x:any)=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div><div className="adminForm"><label>Exam room / block</label><input value={form.room||""} onChange={e=>setForm({...form,room:e.target.value})}/></div><div className="adminForm"><label>Date</label><input type="date" value={form.dateKey||""} onChange={e=>setForm({...form,dateKey:e.target.value})}/></div></div>{message&&<div className="loginError">{message}</div>}<button className="primary" disabled={busy||!form.divisionId||!form.subjectId||!form.room} onClick={async()=>{const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create-exam-session",...form})});const d=await r.json();if(r.ok){setSession(d);setRecords(d.records||[])}else setForm({...form,_error:d.error})}}>Start exam attendance</button></div>:<div className="card attendanceTable"><div className="pageHead"><div><span className="eyebrow">{session.examType} · {session.room}</span><h2>Mark exam attendance</h2></div><button className="primary" disabled={submitted} onClick={async()=>{const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"submit-exam",sessionId:session.sessionId,records})});if(r.ok)setSubmitted(true)}}>{submitted?"Submitted":"Submit exam attendance"}</button></div>{records.map((r:any)=><div className="tableRow" key={r.studentId}><span className="roll">{r.student.rollNo}</span><div className="studentCell"><div><b>{r.student.name}</b><small>{r.student.enrollmentNo}</small></div></div><span className="status">{r.status}</span><div className="statusButtons">{["PRESENT","ABSENT","EXAM_ONLY"].map((s:string)=><button className={r.status===s?"chosen":""} key={s} onClick={()=>setRecords(x=>x.map(a=>a.studentId===r.studentId?{...a,status:s}:a))}>{s==="PRESENT"?"P":s==="ABSENT"?"A":"E"}</button>)}</div></div>)}</div>}</div>}
 
function Leaves({data,role,form,setForm,busy,post,message}:any){
 const student=role==="Student"; const [file,setFile]=useState<File|null>(null); const [uploading,setUploading]=useState(false);
 async function submitLeave(){
  setUploading(true);
  try{
   let documentUrl="";
   if(file){
    const fd=new FormData(); fd.append("file",file);
    const upload=await fetch("/api/leave/upload",{method:"POST",body:fd}); const d=await upload.json();
    if(!upload.ok) throw new Error(d.error||"Document upload failed."); documentUrl=d.pathname;
   }
   await post("leave",{documentUrl});
   setFile(null);
  }catch(err){alert(err instanceof Error?err.message:"Unable to submit leave.");}
  finally{setUploading(false);}
 }
 return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · LEAVE</span><h1>{student?"Apply for leave":"Leave requests"}<em>.</em></h1><p>{student?"Submit dates, reason and supporting document; approval automatically marks covered lectures On Leave.":"Review leave requests and approve or reject them."}</p></div></div>
 {student&&<div className="card" style={{marginBottom:14}}><div className="formTwo"><div className="adminForm"><label>From</label><input type="date" value={form.fromDate||""} onChange={e=>setForm({...form,fromDate:e.target.value})}/></div><div className="adminForm"><label>To</label><input type="date" value={form.toDate||""} onChange={e=>setForm({...form,toDate:e.target.value})}/></div></div><div className="adminForm"><label>Reason</label><textarea value={form.reason||""} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Reason for leave"/></div><div className="adminForm"><label>Supporting document (PDF/JPG/PNG, max 10 MB)</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>{message&&<div className="loginError">{message}</div>}<button className="primary" disabled={busy||uploading||!form.fromDate||!form.toDate||!form.reason} onClick={submitLeave}>{uploading?"Uploading…":busy?"Saving…":"Submit leave request"} <Plus size={14}/></button></div>}
 {!student&&message&&<div className="loginError adminMessage">{message}</div>}
 <div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>DATES</span><span>REASON</span><span>DOCUMENT</span><span>STATUS</span><span>ACTION</span></div>{(data.leaves||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><div><b>{x.student.name}</b><small>{x.student.enrollmentNo}</small></div><span>{new Date(x.fromDate).toLocaleDateString()} – {new Date(x.toDate).toLocaleDateString()}</span><span>{x.reason}</span><span>{x.documentUrl?<a href={"/api/leave/document?leaveId="+encodeURIComponent(x.id)} target="_blank" rel="noreferrer">View</a>:"—"}</span><span className={x.status==="APPROVED"?"accountReady":x.status==="PENDING"?"accountPending":""}>{x.status}</span><span>{!student&&x.status==="PENDING"?<><button className="textBtn" onClick={()=>post("leave-status",{id:x.id,status:"APPROVED"})}><Check size={14}/></button><button className="textBtn" onClick={()=>post("leave-status",{id:x.id,status:"REJECTED"})}><X size={14}/></button></>:"—"}</span></div>)}</div></div>
}

function Defaulters({data,post,busy,message}:any){
 const exportCsv=(rows:any[],name:string)=>{const headers=Object.keys(rows[0]||{}).filter(k=>!["parentPhone","id","studentId","subjectId"].includes(k));const csv=[headers.join(","),...rows.map(r=>headers.map(h=>`"${String(r[h]??"").replace(/"/g,'""')}"`).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=name;a.click();URL.revokeObjectURL(a.href)};
 return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">ADMIN · ELIGIBILITY</span><h1>Attendance <em>defaulters.</em></h1><p>Overall and subject-wise students below the configured {data.threshold??75}% threshold.</p></div><div><button className="secondaryBtn" onClick={()=>exportCsv(data.defaulters||[],"overall-defaulters.csv")}><Download size={14}/> Export</button><button className="primary" style={{marginLeft:8}} disabled={busy} onClick={()=>post("queue-defaulter-warnings")}>Send warnings</button></div></div>{message&&<div className="loginError adminMessage">{message}</div>}
 <div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>CLASS</span><span>PRESENT</span><span>ATTENDANCE</span><span>ELIGIBILITY</span></div>{(data.defaulters||[]).length?(data.defaulters||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><div><b>{x.name}</b><small>{x.enrollmentNo} · Roll {x.rollNo}</small></div><span>{x.program} · Sem {x.semester} · Div {x.division}</span><span>{x.present}/{x.total}</span><span><b>{x.percentage}%</b></span><span className="accountPending">Not eligible</span></div>):<div className="emptyState">No current overall defaulters.</div>}</div>
 <div className="card studentAdminTable" style={{marginTop:14}}><div className="cardHead"><div><span className="eyebrow">SUBJECT-WISE</span><h2>Subject defaulters</h2></div></div><div className="studentAdminHead"><span>STUDENT</span><span>SUBJECT</span><span>PRESENT</span><span>TOTAL</span><span>PERCENTAGE</span></div>{(data.subjectDefaulters||[]).map((x:any)=><div className="studentAdminRow" key={x.studentId+x.subjectId}><div><b>{x.studentName}</b><small>{x.enrollmentNo}</small></div><span>{x.code} · {x.subject}</span><span>{x.present}</span><span>{x.total}</span><span className="accountPending">{x.percentage}%</span></div>)}</div>
 <div className="card studentAdminTable" style={{marginTop:14}}><div className="cardHead"><div><span className="eyebrow">WARNING HISTORY</span><h2>Defaulter warnings</h2></div></div><div className="studentAdminHead"><span>CHANNEL</span><span>RECIPIENT</span><span>STUDENT</span><span>STATUS</span><span>DATE</span></div>{(data.warningHistory||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><span>{x.channel}</span><span>{x.recipient}</span><span>{x.payload?.studentName} · {x.payload?.percentage}%</span><span>{x.status}</span><span>{new Date(x.createdAt).toLocaleString()}</span></div>)}</div></div>
}

function AttendanceCalendar({daily,onSelectDate}:{daily:any[];onSelectDate?:(date:string)=>void}){
 const [month,setMonth]=useState(()=>new Date().toISOString().slice(0,7));
 const [y,m]=month.split("-").map(Number);
 const first=new Date(y,m-1,1).getDay();
 const daysIn=new Date(y,m,0).getDate();
 const byDate=new Map<string,string>();
 for(const x of daily){
   const prev=byDate.get(x.date);
   byDate.set(x.date,prev==="ABSENT"||x.status==="ABSENT"?"ABSENT":prev==="ON_LEAVE"||x.status==="ON_LEAVE"?"ON_LEAVE":prev==="LATE_PRESENT"||x.status==="LATE_PRESENT"?"LATE_PRESENT":"PRESENT");
 }
 const statusLabel=(status:string)=>status==="PRESENT"?"Present":status==="ABSENT"?"Absent":status==="ON_LEAVE"?"Leave":status==="LATE_PRESENT"?"Late":"";
 return <div className="card" style={{marginTop:14}}>
  <div className="cardHead"><div><span className="eyebrow">MONTHLY CALENDAR</span><h2>Attendance calendar</h2><small>Click any marked date to open its date-wise report.</small></div><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
   {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><b key={d} style={{fontSize:11,padding:6}}>{d}</b>)}
   {Array.from({length:first}).map((_,i)=><span key={"e"+i}/>)}
   {Array.from({length:daysIn},(_,i)=>{
     const d=String(i+1).padStart(2,"0"),key=`${month}-${d}`,status=byDate.get(key);
     return <button type="button" key={key} onClick={()=>status&&onSelectDate?.(key)} disabled={!status}
       style={{minHeight:58,padding:7,border:"1px solid #eef0f3",borderRadius:10,fontSize:11,textAlign:"left",background:status?"#f8fbff":"white",cursor:status?"pointer":"default"}}>
       <b>{i+1}</b><div>{status?statusLabel(status):"—"}</div>
     </button>
   })}
  </div>
 </div>
}

function Reports({data,role}:any){
 const [viewData,setViewData]=useState(data);
 const [selectedDate,setSelectedDate]=useState<string>("");
 const [dateLoading,setDateLoading]=useState(false);
 const rows=viewData.rows||[];
 const subjects=viewData.subjectRows||[];
 const threshold=viewData.threshold??75;
 const daily=viewData.dailyHistory||[];
 const dateReport=viewData.dateReport||[];

 async function loadDate(date:string){
   setSelectedDate(date);
   setDateLoading(true);
   try{
     const r=await fetch("/api/workspace?page=Reports&date="+encodeURIComponent(date),{cache:"no-store"});
     const d=await r.json();
     if(!r.ok) throw new Error(d.error||"Unable to load date report.");
     setViewData(d);
   }catch(e){
     alert(e instanceof Error?e.message:"Unable to load date report.");
   }finally{setDateLoading(false);}
 }
 function exportCsv(){
   if(!dateReport.length)return;
   const headers=["Date","Roll","Student","Enrollment","Class","Subject","Code","Status"];
   const csv=[
     headers.join(","),
     ...dateReport.map((x:any)=>[
       selectedDate,x.rollNo,x.studentName,x.enrollmentNo,
       `${x.program} Sem ${x.semester} Div ${x.division}`,
       x.subject,x.code,x.status
     ].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))
   ].join("\n");
   const a=document.createElement("a");
   a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
   a.download=`attendance-${selectedDate}.csv`;
   a.click();
   URL.revokeObjectURL(a.href);
 }
 return <div className="adminWorkspace">
  <div className="pageHead">
   <div><span className="eyebrow">{role.toUpperCase()} · REPORTS</span><h1>Attendance <em>reports.</em></h1><p>Regular attendance excludes Exam Only and approved Leave. Select a calendar date for a complete daily report.</p></div>
   <button className="secondaryBtn" onClick={()=>window.print()}><Download size={14}/> Print / PDF</button>
  </div>

  {role==="Student"&&<div className="portalStats" style={{marginBottom:14}}>
   <div className="metric"><span>Overall</span><b>{rows[0]?.percentage??0}%</b><small>{rows[0]?.eligible?"Exam eligible":"Below threshold"}</small></div>
   <div className="metric"><span>Threshold</span><b>{threshold}%</b><small>Institution policy</small></div>
  </div>}

  <div className="card" style={{marginBottom:14}}>
   <div className="cardHead"><div><span className="eyebrow">DATE-WISE REPORT</span><h2>Choose attendance date</h2></div><CalendarDays size={18}/></div>
   <div className="formTwo">
    <div className="adminForm"><label>Attendance date</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div>
    <div className="adminForm" style={{justifyContent:"end"}}><label>&nbsp;</label><button className="primary" disabled={!selectedDate||dateLoading} onClick={()=>loadDate(selectedDate)}>{dateLoading?"Loading…":"Open date report"} <Search size={14}/></button></div>
   </div>
   {selectedDate&&<div className="cardHead" style={{marginTop:14}}>
     <div><span className="eyebrow">{selectedDate}</span><h2>{dateReport.length} attendance record(s)</h2></div>
     <button className="secondaryBtn" disabled={!dateReport.length} onClick={exportCsv}><Download size={14}/> Download CSV</button>
   </div>}
   {selectedDate&&<div className="card studentAdminTable" style={{marginTop:10}}>
    <div className="studentAdminHead"><span>ROLL</span><span>STUDENT</span><span>CLASS</span><span>SUBJECT</span><span>STATUS</span></div>
    {dateReport.length?dateReport.map((x:any)=><div className="studentAdminRow" key={x.studentId+x.code+x.status}>
      <b>{x.rollNo}</b><div><b>{x.studentName}</b><small>{x.enrollmentNo}</small></div>
      <span>{x.program} · Sem {x.semester} · Div {x.division}</span><span>{x.code} · {x.subject}</span>
      <span className={x.status==="ABSENT"?"accountPending":"accountReady"}>{x.status.replace("_"," ")}</span>
    </div>):<div className="emptyState">{dateLoading?"Loading…":"No attendance records found for this date."}</div>}
   </div>}
  </div>

  <div className="card studentAdminTable">
   <div className="studentAdminHead"><span>STUDENT</span><span>CLASS</span><span>PRESENT</span><span>LEAVE</span><span>PERCENTAGE</span></div>
   {rows.map((x:any)=><div className="studentAdminRow" key={x.id}><div><b>{x.name}</b><small>{x.enrollmentNo}</small></div><span>{x.program} · Sem {x.semester} · Div {x.division}</span><span>{x.present}/{x.total}</span><span>{x.leave}</span><span className={x.percentage<threshold?"accountPending":"accountReady"}>{x.percentage}% · {x.eligible?"Eligible":"Not eligible"}</span></div>)}
  </div>

  {subjects.length>0&&<div className="card studentAdminTable" style={{marginTop:14}}>
   <div className="cardHead"><div><span className="eyebrow">SUBJECT-WISE</span><h2>Attendance by subject</h2></div></div>
   <div className="studentAdminHead"><span>STUDENT</span><span>SUBJECT</span><span>PRESENT</span><span>LEAVE</span><span>PERCENTAGE</span></div>
   {subjects.map((x:any)=><div className="studentAdminRow" key={x.studentId+x.subjectId}><div><b>{x.studentName}</b><small>{x.enrollmentNo}</small></div><span>{x.code} · {x.name}</span><span>{x.present}/{x.total}</span><span>{x.leave}</span><span className={x.percentage<threshold?"accountPending":"accountReady"}>{x.percentage}% · {x.eligible?"Eligible":"Not eligible"}</span></div>)}
  </div>}

  {role==="Student"&&<AttendanceCalendar daily={daily} onSelectDate={loadDate}/>}
  {role==="Student"&&<div className="card studentAdminTable" style={{marginTop:14}}>
   <div className="cardHead"><div><span className="eyebrow">DAILY HISTORY</span><h2>Recent lecture history</h2></div></div>
   <div className="studentAdminHead"><span>DATE</span><span>SUBJECT</span><span>CODE</span><span>STATUS</span></div>
   {daily.map((x:any)=><div className="studentAdminRow" key={x.date+x.code+x.subject}><span>{x.date}</span><span>{x.subject}</span><span>{x.code}</span><span>{x.status}</span></div>)}
  </div>}
 </div>
}
function Notifications({data}:any){return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">NOTIFICATIONS</span><h1>Alert <em>centre.</em></h1><p>Attendance alerts queued for SMS and WhatsApp delivery.</p></div></div><div className="card studentAdminTable"><div className="studentAdminHead"><span>CHANNEL</span><span>RECIPIENT</span><span>MESSAGE</span><span>STATUS</span><span>CREATED</span></div>{(data.notifications||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><b>{x.channel}</b><span>{x.recipient}</span><span>{x.payload?.studentName} · {x.payload?.subject}</span><span className="accountPending">{x.status}</span><span>{new Date(x.createdAt).toLocaleString()}</span></div>)}</div></div>}

function AuditLogs({data}:any){return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">AUDIT · HISTORY</span><h1>Audit <em>log.</em></h1><p>Who changed what, and when.</p></div></div><div className="card studentAdminTable"><div className="studentAdminHead"><span>ACTOR</span><span>ACTION</span><span>ENTITY</span><span>ENTITY ID</span><span>TIME</span></div>{(data.logs||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><div><b>{x.actor.username}</b><small>{x.actor.role}</small></div><span>{x.action}</span><span>{x.entity}</span><span>{x.entityId}</span><span>{new Date(x.createdAt).toLocaleString()}</span></div>)}</div></div>}

function Settings({data,form,setForm,busy,post,message}:any){const i=data.institution||{};return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">ADMIN · SETTINGS</span><h1>Institution <em>settings.</em></h1><p>College identity and academic-year configuration.</p></div></div><div className="card"><div className="formTwo"><div className="adminForm"><label>Institution name</label><input value={form.name??i.name??""} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="adminForm"><label>Campus</label><input value={form.campusName??i.campusName??""} onChange={e=>setForm({...form,campusName:e.target.value})}/></div><div className="adminForm"><label>Academic year</label><input value={form.academicYear??i.academicYear??"2026-27"} onChange={e=>setForm({...form,academicYear:e.target.value})}/></div><div className="adminForm"><label>Phone</label><input value={form.phone??i.phone??""} onChange={e=>setForm({...form,phone:e.target.value})}/></div><div className="adminForm"><label>Minimum attendance %</label><input type="number" min="1" max="100" value={form.minimumAttendance??i.minimumAttendance??75} onChange={e=>setForm({...form,minimumAttendance:e.target.value})}/></div><div className="adminForm"><label>Attendance grace minutes</label><input type="number" min="0" max="60" value={form.attendanceGraceMinutes??i.attendanceGraceMinutes??10} onChange={e=>setForm({...form,attendanceGraceMinutes:e.target.value})}/></div></div><div className="adminForm"><label>Address</label><textarea value={form.address??i.address??""} onChange={e=>setForm({...form,address:e.target.value})}/></div><div className="adminForm"><label>Website</label><input value={form.website??i.website??""} onChange={e=>setForm({...form,website:e.target.value})}/></div>{message&&<div className="loginError">{message}</div>}<button className="primary" disabled={busy} onClick={()=>post("institution-settings")}><Save size={14}/> Save settings</button></div></div>}

function Adjustments({data}:any){return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">FACULTY · ADJUSTMENTS</span><h1>Attendance <em>history.</em></h1><p>Recent attendance records from your assigned sessions.</p></div></div><div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>SUBJECT</span><span>STATUS</span><span>MARKED</span><span>SESSION</span></div>{(data.records||[]).map((x:any)=><div className="studentAdminRow" key={x.id}><b>{x.student.name}<small>{x.student.enrollmentNo}</small></b><span>{x.session.subject.name}</span><span>{x.status}</span><span>{new Date(x.markedAt).toLocaleString()}</span><span>{x.session.id.slice(0,8)}</span></div>)}</div></div>}

function People({data,page}:any){const faculty=data.faculty||[],students=data.students||[];return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">{page.toUpperCase()}</span><h1>{page}<em>.</em></h1><p>Live records from Noble Group of Institutions.</p></div></div>{(page==="Faculty"||page==="Administrators")&&<div className="card studentAdminTable"><div className="studentAdminHead"><span>FACULTY</span><span>EMPLOYEE</span><span>USERNAME</span><span>DEPARTMENT</span><span>STATUS</span></div>{faculty.map((x:any)=><div className="studentAdminRow" key={x.id}><b>{x.name}</b><span>{x.employeeCode}</span><span>{x.user.username}</span><span>{x.user.department?.code||"—"}</span><span className="accountReady">{x.user.active?"Active":"Inactive"}</span></div>)}</div>}{(page==="Students"||page==="Attendance Monitor"||page==="Institutions")&&<div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>ENROLLMENT</span><span>CLASS</span><span>ROLL</span><span>STATUS</span></div>{students.map((x:any)=><div className="studentAdminRow" key={x.id}><b>{x.name}</b><span>{x.enrollmentNo}</span><span>{x.division.semester.program.code} · Sem {x.division.semester.number} · Div {x.division.name}</span><span>{x.rollNo}</span><span>Registered</span></div>)}</div>}</div>}

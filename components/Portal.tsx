"use client";

import AdminWorkspace from "@/components/AdminWorkspace";
import AdminStudents from "@/components/AdminStudents";
import AdminAccounts from "@/components/AdminAccounts";
import WorkspaceModule from "@/components/WorkspaceModule";
import UploadCenter from "@/components/UploadCenter";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  ClipboardCheck, Download, FileUp, GraduationCap, LayoutDashboard, LogOut,
  Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Users, X,
  ChevronRight, Sparkles
} from "lucide-react";

const data = {
  Admin:["Overview","Departments","Students","Faculty","Accounts","Subjects","Master Timetable","Uploads","Leaves","Defaulters","Reports","Audit Logs","Settings"],
  "Super Admin":["Overview","Institutions","Administrators","Security","Audit Logs","Settings"],
  HOD:["Overview","Faculty","Students","Attendance Monitor","Uploads","Leaves","Defaulters","Reports","Settings"],
  Faculty:["Overview","Today's Lectures","Attendance","Timetable","Attendance Reports","Exam Attendance","Uploads","Leave Requests","Adjustments","Reports","Settings"],
  Student:["Overview","My Attendance","Timetable","Attendance Reports","Uploads","Leave Requests","Hall Tickets","Examinations","Notifications","Reports","Settings"],
  Parent:["Overview","Attendance","Timetable","Attendance Reports","Uploads","Notifications","Leave Status","Reports","Settings"]
} as const;

type Role=keyof typeof data;
type Status="PRESENT"|"ABSENT"|"EXAM_ONLY"|"ON_LEAVE"|"LATE_PRESENT";
type Lecture={id:string;lectureNumber:number;startTime:string;endTime:string;room?:string|null;subject:{name:string;code:string};class:{program:string;semester:number;division:string}};
type RecordItem={studentId:string;status:Status;student:{id:string;enrollmentNo:string;rollNo:string;name:string}};

const iconFor=(label:string)=>{
  if(label==="Overview") return LayoutDashboard;
  if(label.includes("Attendance")||label.includes("Lectures")) return ClipboardCheck;
  if(label.includes("Timetable")||label.includes("Calendar")) return CalendarDays;
  if(label.includes("Report")||label==="Defaulters") return BarChart3;
  if(label.includes("Student")||label.includes("Faculty")||label.includes("Administrators")||label.includes("Institutions")) return Users;
  if(label.includes("Upload")) return FileUp;
  if(label.includes("Subject")) return BookOpen;
  if(label.includes("Notification")) return Bell;
  if(label==="Settings"||label==="Security"||label==="Audit Logs") return Settings;
  return Activity;
};

const groupsFor=(role:Role)=>{
  const items=data[role];
  const groups=[
    {label:"Workspace",items:items.filter(x=>x==="Overview")},
    {label:"Academic",items:items.filter(x=>["Departments","Subjects","Master Timetable","Timetable","Today's Lectures","Faculty","Students","Attendance Monitor","Institutions","Administrators"].includes(x))},
    {label:"Operations",items:items.filter(x=>["Attendance","My Attendance","Attendance Reports","Exam Attendance","Hall Tickets","Examinations","Leave Requests","Leaves","Leave Status","Defaulters","Reports","Notifications","Adjustments"].includes(x))},
    {label:"System",items:items.filter(x=>["Uploads","Audit Logs","Security","Settings"].includes(x))}
  ];
  return groups.filter(x=>x.items.length);
};

const roleLabel:Record<Role,string>={
  Admin:"Administration", "Super Admin":"Super Administration", HOD:"Head of Department",
  Faculty:"Faculty", Student:"Student", Parent:"Parent"
};

export default function Portal({role,title,subtitle}:{role:Role;title:string;subtitle:string}){
  const [open,setOpen]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [page,setPage]=useState("Overview");
  const [lectures,setLectures]=useState<Lecture[]>([]);
  const [currentTime,setCurrentTime]=useState("");
  const [sessionId,setSessionId]=useState<string|null>(null);
  const [records,setRecords]=useState<RecordItem[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const groups=useMemo(()=>groupsFor(role),[role]);

  useEffect(()=>{
    if(role!=="Faculty") return;
    fetch("/api/faculty/today",{cache:"no-store"})
      .then(async r=>r.ok?r.json():null)
      .then(d=>{if(d){setLectures(d.lectures||[]);setCurrentTime(d.currentTime||"")}})
      .catch(()=>setMessage("Today's lectures are temporarily unavailable. You can continue using the rest of the workspace."));
  },[role]);

  async function startAttendance(id:string){
    setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/attendance/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({timetableId:id})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to start attendance.");
      setSessionId(d.sessionId);setRecords(d.records||[]);setPage("Attendance");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to start attendance.");}
    finally{setBusy(false)}
  }

  async function submit(){
    if(!sessionId)return;
    setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/attendance/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,records:records.map(x=>({studentId:x.studentId,status:x.status}))})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Attendance could not be submitted.");
      setMessage(`Attendance submitted. ${d.absentCount||0} absent notification(s) queued.`);
    }catch(e){setMessage(e instanceof Error?e.message:"Attendance could not be submitted.");}
    finally{setBusy(false)}
  }

  function navigate(x:string){setPage(x);setOpen(false);setMessage("");if(x!=="Attendance")setSessionId(null);}

  async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.href="/";}

  const modulePage=new Set(["Overview","Subjects","Master Timetable","Timetable","Leaves","Leave Requests","Leave Status","Defaulters","Reports","My Attendance","Notifications","Audit Logs","Settings","Adjustments","Exam Attendance","Faculty","Students","Attendance Monitor","Administrators","Institutions","Security","Attendance Reports","Examinations"]).has(page);

  return <div className={`portalShell companyShell ${collapsed?"sidebarCollapsed":""}`}>
    <aside className={`portalSide companySide ${open?"open":""}`}>
      <div className="companyBrand">
        <div className="brandMark"><img src="/noble-logo.jpg" alt="Noble"/></div>
        <div className="brandCopy"><b>Noble</b><span>Digital Campus</span></div>
        <button className="iconBtn sideClose" onClick={()=>setOpen(false)}><X size={18}/></button>
      </div>
      <div className="workspaceIdentity">
        <div className="workspaceAvatar">{role==="Student"?"ST":role==="Parent"?"PR":role==="Faculty"?"FC":role==="HOD"?"HD":"NG"}</div>
        <div><b>{roleLabel[role]}</b><small>{subtitle || "Institutional workspace"}</small></div>
      </div>
      <div className="companyNav">
        {groups.map(group=><div className="navGroup" key={group.label}>
          <span className="navGroupLabel">{group.label}</span>
          {group.items.map(x=>{const Icon=iconFor(x);return <button key={x} className={page===x?"navItem active":"navItem"} onClick={()=>navigate(x)}><Icon size={16}/><span>{x}</span>{page===x&&<i/>}</button>})}
        </div>)}
      </div>
      <div className="companySideBottom">
        <div className="secureMini"><ShieldCheck size={15}/><div><b>Protected workspace</b><small>Role permissions active</small></div></div>
        <div className="portalUser"><div className="avatar">{role.slice(0,2).toUpperCase()}</div><div><b>{roleLabel[role]}</b><small>Academic year 2026–27</small></div></div>
        <button className="logoutBtn" onClick={logout}><LogOut size={15}/> Sign out</button>
      </div>
    </aside>

    <main className="portalMain companyMain">
      <header className="portalTop companyTop">
        <div className="topLeft">
          <button className="iconBtn mobileOnly" onClick={()=>setOpen(true)}><Menu size={20}/></button>
          <button className="iconBtn desktopToggle" onClick={()=>setCollapsed(v=>!v)} title="Collapse navigation">{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button>
          <div className="crumb"><span>Noble Digital Campus</span><b>/</b><strong>{page}</strong></div>
        </div>
        <div className="topRight"><div className="topStatus"><span/> All systems operational</div><button className="topIcon" onClick={()=>navigate("Notifications")}><Bell size={17}/></button><div className="topAvatar">{role.slice(0,2).toUpperCase()}</div></div>
      </header>

      <section className="portalContent companyContent">
        {message&&<div className="globalNotice"><Activity size={15}/><span>{message}</span><button onClick={()=>setMessage("")}><X size={14}/></button></div>}
        {page==="Overview"?<DashboardHome role={role} title={title} onNavigate={navigate}/>
          :page==="Departments"&&role==="Admin"?<AdminWorkspace/>
          :page==="Students"&&role==="Admin"?<AdminStudents/>
          :page==="Accounts"&&role==="Admin"?<AdminAccounts/>
          :page==="Today's Lectures"&&role==="Faculty"?<FacultyToday lectures={lectures} currentTime={currentTime} onStart={startAttendance} busy={busy}/>
          :page==="Hall Tickets"&&role==="Student"?<HallTickets/>
          :page==="Uploads"?<UploadCenter role={role}/>
          :page==="Attendance"&&role==="Faculty"&&sessionId?<LiveAttendance records={records} setStatus={(id,s)=>setRecords(x=>x.map(r=>r.studentId===id?{...r,status:s}:r))} onSubmit={submit} busy={busy} message={message}/>
          :modulePage?<WorkspaceModule role={role} page={page}/>
          :<div className="card emptyState"><h2>Nothing to show yet</h2><p>This workspace is ready for your institution's data.</p></div>}
      </section>
    </main>
  </div>;
}

function DashboardHome({role,title,onNavigate}:{role:Role;title:string;onNavigate:(p:string)=>void}){
  const actions=data[role].filter(x=>x!=="Overview").slice(0,4);
  return <div className="dashboardHome">
    <div className="dashboardHero">
      <div><span className="eyebrow">NOBLE DIGITAL CAMPUS · {role.toUpperCase()}</span><h1>{title || "Campus command centre"}<em>.</em></h1><p>One connected workspace for attendance, academics, people, documents and institutional operations.</p></div>
      <div className="heroPulse"><div className="pulseDot"/><span>Live institutional system</span><b>2026–27</b></div>
    </div>
    <WorkspaceModule role={role} page="Overview"/>
    <div className="quickSection"><div><span className="eyebrow">QUICK ACCESS</span><h2>Continue where you left off.</h2></div><div className="quickGrid">{actions.map(x=>{const Icon=iconFor(x);return <button key={x} onClick={()=>onNavigate(x)} className="quickCard"><div className="quickIcon"><Icon size={18}/></div><span>{x}</span><ChevronRight size={16}/></button>})}</div></div>
    <div className="systemStrip"><Sparkles size={17}/><div><b>Designed for institutional scale</b><span>Clean role separation, database-backed workflows and a consistent workspace across every department.</span></div></div>
  </div>;
}

function HallTickets(){
  const [data,setData]=useState<any>({});const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/exam/hall-ticket",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load hall tickets.");setData(d)}).catch(e=>setError(e instanceof Error?e.message:"Unable to load hall tickets.")).finally(()=>setLoading(false))},[]);
  const openTicket=(id:string)=>window.open("/api/exam/hall-ticket?sessionId="+encodeURIComponent(id),"_blank","noopener,noreferrer");
  return <div className="adminWorkspace"><div className="pageHead"><div><span className="eyebrow">STUDENT · EXAMINATION</span><h1>Hall <em>tickets.</em></h1><p>Published examination schedules appear here with a print-ready hall ticket.</p></div></div>
    {loading?<div className="card emptyState"><Activity size={18}/><span>Loading examination schedule…</span></div>:error?<div className="card errorState"><X size={18}/><div><b>Could not load hall tickets</b><p>{error}</p></div></div>:(data.exams||[]).length===0?<div className="card emptyState"><GraduationCap size={22}/><h2>No published examinations</h2><p>Your examination authority has not published a schedule for your division yet.</p></div>:<div className="lectureStack">{data.exams.map((x:any)=><div className="lectureCard" key={x.id}><div className="lectureTime"><CalendarDays size={18}/><b>{String(x.examType).replace("_"," ")}</b></div><div className="lectureInfo"><span>{data.student?.program} · Semester {data.student?.semester} · Division {data.student?.division}</span><h2>{x.subject.code} · {x.subject.name}</h2><small>{x.dateKey} · {x.room}</small></div><button className="primary" onClick={()=>openTicket(x.id)}>Generate Hall Ticket <Download size={14}/></button></div>)}</div>}
  </div>;
}

function FacultyToday({lectures,currentTime,onStart,busy}:{lectures:Lecture[];currentTime:string;onStart:(id:string)=>void;busy:boolean}){
  return <><div className="pageHead"><div><span className="eyebrow">FACULTY · TODAY · {currentTime||"--:--"}</span><h1>Today's <em>lectures.</em></h1><p>Your timetable is the source of truth. Start attendance directly from the lecture card.</p></div></div>
    <div className="lectureStack">{lectures.length?lectures.map((l,i)=><div className="lectureCard current" key={l.id}><div className="lectureTime"><ClipboardCheck size={18}/><b>Lecture {l.lectureNumber}</b>{i===0&&<span>UP NEXT</span>}</div><div className="lectureInfo"><span>{l.class.program} · Semester {l.class.semester} · Division {l.class.division}</span><h2>{l.subject.name}</h2><small>{l.startTime} – {l.endTime} · {l.room||"Room not assigned"}</small></div><button className="primary" onClick={()=>onStart(l.id)} disabled={busy}>{busy?"Starting…":"Start Attendance"} <ClipboardCheck size={14}/></button></div>):<div className="card emptyState"><ClipboardCheck size={22}/><h2>No lectures assigned today</h2><p>Once the admin publishes your timetable, today's lectures will appear here automatically.</p></div>}</div>
  </>;
}

function LiveAttendance({records,setStatus,onSubmit,busy,message}:{records:RecordItem[];setStatus:(id:string,s:Status)=>void;onSubmit:()=>void;busy:boolean;message:string}){
  const count=(s:Status)=>records.filter(x=>x.status===s).length;
  return <><div className="pageHead attendanceHead"><div><span className="eyebrow">LIVE CLASSROOM · {records.length} STUDENTS</span><h1>Mark <em>attendance.</em></h1><p>Students start as Present. Change only exceptions, then submit once.</p></div><button className="primary" onClick={onSubmit} disabled={busy}>{busy?"Submitting…":"Submit Attendance"} <Check size={15}/></button></div>
    <div className="attendanceStats"><span>Present <b>{count("PRESENT")}</b></span><span>Absent <b>{count("ABSENT")}</b></span><span>Exam Only <b>{count("EXAM_ONLY")}</b></span><span>On Leave <b>{count("ON_LEAVE")}</b></span><span>Late <b>{count("LATE_PRESENT")}</b></span></div>
    <div className="card attendanceTable"><div className="tableHead"><span>ROLL</span><span>STUDENT</span><span>STATUS</span><span>QUICK ACTION</span></div>{records.map(r=><div className="tableRow" key={r.studentId}><span className="roll">{r.student.rollNo}</span><div className="studentCell"><div className="avatar">{r.student.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><b>{r.student.name}</b><small>{r.student.enrollmentNo}</small></div></div><span className={`status ${r.status.toLowerCase().replace("_","-")}`}>{r.status.replace("_"," ")}</span><div className="statusButtons">{(["PRESENT","ABSENT","EXAM_ONLY","ON_LEAVE","LATE_PRESENT"] as Status[]).map(s=><button key={s} className={r.status===s?"chosen":""} onClick={()=>setStatus(r.studentId,s)}>{s==="PRESENT"?"P":s==="ABSENT"?"A":s==="EXAM_ONLY"?"E":s==="ON_LEAVE"?"L":"LT"}</button>)}</div></div>)}</div>
    {message&&<div className="toast"><CheckCircle2 size={15}/>{message}</div>}
  </>;
}

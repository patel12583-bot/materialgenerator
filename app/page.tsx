"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, Bell, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck,
  Clock3, Download, FileSpreadsheet, GraduationCap, LayoutDashboard, LogOut,
  Menu, MessageSquare, MoreHorizontal, Search, Settings, ShieldCheck, Users,
  X, UserRound, AlertTriangle, ArrowUpRight
} from "lucide-react";

type Role = "admin" | "faculty" | "student" | "parent";
type Status = "present" | "absent" | "exam" | "leave";

const students = [
  { roll:"01", name:"Aarav Patel", status:"present" as Status },
  { roll:"02", name:"Diya Shah", status:"present" as Status },
  { roll:"03", name:"Krish Mehta", status:"absent" as Status },
  { roll:"04", name:"Mahi Desai", status:"present" as Status },
  { roll:"05", name:"Vivaan Joshi", status:"exam" as Status },
  { roll:"06", name:"Anaya Trivedi", status:"present" as Status },
  { roll:"07", name:"Reyansh Parmar", status:"present" as Status },
  { roll:"08", name:"Aanya Patel", status:"leave" as Status },
];

const lectures = [
  { time:"09:00 – 10:00", subject:"Database Management System", course:"BCA · Semester 3 · Div A", room:"Lab 204" },
  { time:"10:15 – 11:15", subject:"Web Technology", course:"BCA · Semester 3 · Div A", room:"Room 306" },
  { time:"11:30 – 12:30", subject:"Java Programming", course:"BCA · Semester 3 · Div B", room:"Lab 102" },
];

const navByRole: Record<Role, string[]> = {
  admin:["Overview","Departments","Students","Faculty","Subjects","Timetable","Leaves","Defaulters","Reports","Audit Logs","Settings"],
  faculty:["Overview","Today's Lectures","Attendance","Timetable","Leaves","Adjustments","Reports","Settings"],
  student:["Overview","My Attendance","Timetable","Leave Requests","Notifications","Reports","Settings"],
  parent:["Overview","Attendance","Notifications","Leave Status","Settings"],
};

export default function Home() {
  const [role,setRole]=useState<Role>("faculty");
  const [page,setPage]=useState("Overview");
  const [mobile,setMobile]=useState(false);
  const [toast,setToast]=useState("");
  const [attendance,setAttendance]=useState(students);
  const [search,setSearch]=useState("");

  const nav=navByRole[role];
  const activeLecture=lectures[0];
  const filtered=useMemo(()=>attendance.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.roll.includes(search)),[attendance,search]);

  function cycleStatus(roll:string,status:Status){
    setAttendance(prev=>prev.map(s=>s.roll===roll?{...s,status}:s));
  }

  function submitAttendance(){
    const absent=attendance.filter(s=>s.status==="absent");
    setToast(absent.length ? `Attendance saved. ${absent.length} parent notification(s) queued.` : "Attendance saved successfully.");
    setTimeout(()=>setToast(""),3500);
  }

  function switchRole(next:Role){
    setRole(next); setPage("Overview"); setMobile(false);
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${mobile?"open":""}`}>
        <div className="brand">
          <div className="brandMark"><GraduationCap size={21}/></div>
          <div><strong>Campus</strong><span>Attendance</span></div>
          <button className="iconBtn mobileOnly" onClick={()=>setMobile(false)}><X size={18}/></button>
        </div>
        <div className="institution"><div className="institutionLogo">PU</div><div><b>Parul University</b><small>Attendance workspace</small></div></div>
        <div className="navLabel">WORKSPACE</div>
        {nav.map(item=><button key={item} className={`navItem ${page===item?"active":""}`} onClick={()=>{setPage(item);setMobile(false)}}>{iconFor(item)}<span>{item}</span>{item==="Defaulters"&&<em>12</em>}</button>)}
        <div className="sidebarBottom">
          <button className="navItem" onClick={()=>setPage("Settings")}><Settings size={17}/><span>Settings</span></button>
          <div className="userMini"><div className="avatar">PP</div><div><b>Prof. Patel</b><small>{roleLabel(role)}</small></div><MoreHorizontal size={16}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="iconBtn mobileOnly" onClick={()=>setMobile(true)}><Menu size={20}/></button>
          <div className="crumb"><span>COLLEGE</span><ChevronRight size={13}/><b>{page}</b></div>
          <div className="topActions">
            <div className="roleSwitcher">{(["admin","faculty","student","parent"] as Role[]).map(r=><button key={r} className={role===r?"selected":""} onClick={()=>switchRole(r)}>{roleLabel(r)}</button>)}</div>
            <div className="searchBox"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students..." /></div>
            <button className="iconBtn"><Bell size={18}/><i/></button>
            <div className="topAvatar">PP</div>
          </div>
        </header>

        {page==="Overview" && <Overview role={role} onOpen={()=>setPage(role==="faculty"?"Today's Lectures":role==="student"?"My Attendance":"Attendance")} />}
        {page==="Today's Lectures" && role==="faculty" && <FacultyLectures onStart={()=>setPage("Attendance")} />}
        {page==="Attendance" && (role==="faculty"||role==="parent") && (
          role==="faculty"
          ? <AttendancePanel attendance={filtered} lecture={activeLecture} onStatus={cycleStatus} onSubmit={submitAttendance} search={search}/>
          : <StudentAttendance readonly={true}/>
        )}
        {page==="My Attendance" && role==="student" && <StudentAttendance/>}
        {page==="Timetable" && <Timetable role={role}/>}
        {page==="Leave Requests" && role==="student" && <LeaveStudent onToast={setToast}/>}
        {page==="Leaves" && (role==="faculty"||role==="admin") && <LeaveAdmin onToast={setToast}/>}
        {page==="Adjustments" && role==="faculty" && <Adjustments/>}
        {["Departments","Students","Faculty","Subjects"].includes(page) && role==="admin" && <Master title={page}/>}
        {page==="Defaulters" && role==="admin" && <Defaulters/>}
        {page==="Reports" && <Reports/>}
        {page==="Audit Logs" && role==="admin" && <Audit/>}
        {page==="Notifications" && (role==="student"||role==="parent") && <Notifications/>}
        {page==="Leave Status" && role==="parent" && <LeaveStatus/>}
        {page==="Settings" && <SettingsPage role={role}/>}

        {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></div>}
      </main>
    </div>
  );
}

function iconFor(item:string){
  const p={size:17};
  if(item==="Overview") return <LayoutDashboard {...p}/>;
  if(item.includes("Attendance")) return <ClipboardCheck {...p}/>;
  if(item.includes("Timetable")) return <CalendarDays {...p}/>;
  if(item.includes("Leave")) return <FileSpreadsheet {...p}/>;
  if(item.includes("Faculty")||item.includes("Students")||item.includes("Departments")) return <Users {...p}/>;
  if(item==="Subjects") return <BookOpen {...p}/>;
  if(item==="Reports") return <BarChart3 {...p}/>;
  if(item==="Audit Logs") return <ShieldCheck {...p}/>;
  if(item==="Notifications") return <Bell {...p}/>;
  return <Settings {...p}/>;
}
function roleLabel(r:Role){return r==="admin"?"Admin":r==="faculty"?"Faculty":r==="student"?"Student":"Parent";}

function Overview({role,onOpen}:{role:Role;onOpen:()=>void}){
  const isFaculty=role==="faculty";
  return <section className="content">
    <div className="pageHead"><div><span className="eyebrow">{roleLabel(role).toUpperCase()} WORKSPACE</span><h1>Good morning, <em>Prof. Patel.</em></h1><p>Everything important for today's attendance is in one place.</p></div><button className="primary" onClick={onOpen}>{isFaculty?"Start today's attendance":"View attendance"} <ArrowUpRight size={15}/></button></div>
    <div className="metricGrid">
      {[
        ["92.4%","Overall attendance","This semester","good"],
        ["48","Today's students","Across 3 lectures",""],
        ["03","Today's lectures","09:00 – 12:30",""],
        ["12","Defaulters","Below 75% threshold","warn"]
      ].map(([v,l,s,c])=><div className="metric" key={l}><span>{l}</span><b className={c}>{v}</b><small>{s}</small></div>)}
    </div>
    <div className="grid2">
      <div className="card"><div className="cardHead"><div><span className="eyebrow">TODAY</span><h2>Upcoming lectures</h2></div><button className="textBtn" onClick={onOpen}>View all <ChevronRight size={14}/></button></div>
        {lectures.map((l,i)=><div className="lectureRow" key={l.time}><div className="time"><b>{l.time}</b><small>{l.room}</small></div><div><b>{l.subject}</b><span>{l.course}</span></div><button className={i===0&&isFaculty?"primary small":"ghost"} onClick={i===0?onOpen:undefined}>{i===0&&isFaculty?"Start":i===0?"Open":"Scheduled"}</button></div>)}
      </div>
      <div className="card"><div className="cardHead"><div><span className="eyebrow">ATTENDANCE HEALTH</span><h2>Semester overview</h2></div><BarChart3 size={18}/></div><div className="donut"><div><b>92%</b><span>Overall</span></div></div><div className="legend"><span><i className="dot green"/>Present <b>92%</b></span><span><i className="dot red"/>Absent <b>6%</b></span><span><i className="dot blue"/>Leave <b>2%</b></span></div></div>
    </div>
    <div className="card activity"><div className="cardHead"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Attendance activity</h2></div><button className="iconBtn"><MoreHorizontal size={18}/></button></div>
      {["DBMS attendance submitted · 47/48 present","MCA Sem 2 leave request approved","BCA Sem 3 timetable updated","12 students crossed defaulter threshold"].map((x,i)=><div className="activityRow" key={x}><div className="activityIcon">{i===3?<AlertTriangle size={15}/>:<Check size={15}/>}</div><span>{x}</span><small>{i+1}h ago</small></div>)}
    </div>
  </section>
}

function FacultyLectures({onStart}:{onStart:()=>void}){
 return <section className="content"><div className="pageHead"><div><span className="eyebrow">FACULTY · TODAY</span><h1>Today's <em>lectures.</em></h1><p>Timetable-driven attendance. No repetitive class or subject selection.</p></div></div><div className="lectureStack">{lectures.map((l,i)=><div className={`lectureCard ${i===0?"current":""}`} key={l.time}><div className="lectureTime"><Clock3 size={18}/><b>{l.time}</b>{i===0&&<span>NOW</span>}</div><div className="lectureInfo"><span>{l.course}</span><h2>{l.subject}</h2><small>{l.room} · 48 students</small></div><button className={i===0?"primary":"ghost"} onClick={i===0?onStart:undefined}>{i===0?"Start Attendance":"Scheduled"} <ArrowUpRight size={14}/></button></div>)}</div></section>
}

function AttendancePanel({attendance,lecture,onStatus,onSubmit}:{attendance:any[];lecture:any;onStatus:(r:string,s:Status)=>void;onSubmit:()=>void;search:string}){
 const counts={present:attendance.filter(s=>s.status==="present").length,absent:attendance.filter(s=>s.status==="absent").length,exam:attendance.filter(s=>s.status==="exam").length,leave:attendance.filter(s=>s.status==="leave").length};
 return <section className="content"><div className="pageHead"><div><span className="eyebrow">LIVE ATTENDANCE</span><h1>{lecture.subject}</h1><p>{lecture.course} · {lecture.time} · {lecture.room}</p></div><button className="primary" onClick={onSubmit}>Submit Attendance <Check size={15}/></button></div>
 <div className="attendanceStats"><span><i className="dot green"/>Present <b>{counts.present}</b></span><span><i className="dot red"/>Absent <b>{counts.absent}</b></span><span><i className="dot blue"/>Exam Only <b>{counts.exam}</b></span><span><i className="dot amber"/>On Leave <b>{counts.leave}</b></span></div>
 <div className="card attendanceTable"><div className="tableHead"><span>ROLL</span><span>STUDENT</span><span>STATUS</span><span>QUICK ACTION</span></div>
 {attendance.map(s=><div className="tableRow" key={s.roll}><span className="roll">{s.roll}</span><div className="studentCell"><div className="avatar">{s.name.split(" ").map((x:string)=>x[0]).join("").slice(0,2)}</div><div><b>{s.name}</b><small>BCA · Sem 3 · Div A</small></div></div><span className={`status ${s.status}`}>{statusLabel(s.status)}</span><div className="statusButtons">{(["present","absent","exam","leave"] as Status[]).map(x=><button key={x} className={s.status===x?"chosen":""} onClick={()=>onStatus(s.roll,x)}>{statusShort(x)}</button>)}</div></div>)}
 </div></section>
}
function statusLabel(s:Status){return s==="present"?"Present":s==="absent"?"Absent":s==="exam"?"Exam Only":"On Leave";}
function statusShort(s:Status){return s==="present"?"P":s==="absent"?"A":s==="exam"?"E":"L";}

function StudentAttendance({readonly=false}:{readonly?:boolean}){
 return <section className="content"><div className="pageHead"><div><span className="eyebrow">ATTENDANCE</span><h1>My attendance <em>overview.</em></h1><p>Semester-wise and subject-wise attendance with eligibility indicators.</p></div><button className="ghost"><Download size={15}/> Export</button></div><div className="studentHero"><div><span>OVERALL</span><b>88.7%</b><small>Above 75% eligibility threshold</small></div><div className="progressBig"><div style={{width:"88.7%"}}/></div></div><div className="card"><div className="tableHead subjectHead"><span>SUBJECT</span><span>HELD</span><span>PRESENT</span><span>ATTENDANCE</span></div>{["Database Management System","Web Technology","Java Programming","Software Engineering","Computer Networks"].map((s,i)=><div className="subjectRow" key={s}><div><b>{s}</b><small>BCA · Semester 3</small></div><span>{42+i}</span><span>{39-i}</span><strong className={i===4?"warn":""}>{i===4?"71.4%":(92-i*4)+".8%"}</strong></div>)}</div></section>
}
function Timetable({role}:{role:Role}){return <section className="content"><div className="pageHead"><div><span className="eyebrow">MASTER TIMETABLE</span><h1>Weekly <em>schedule.</em></h1><p>{role==="admin"?"Manage department and faculty timetable slots.":"Your assigned lectures are automatically surfaced each day."}</p></div><button className="primary">{role==="admin"?"Edit timetable":"Calendar view"} <CalendarDays size={15}/></button></div><div className="week"><div className="weekHead">{["MON","TUE","WED","THU","FRI","SAT"].map(x=><b key={x}>{x}</b>)}</div>{lectures.map((l,i)=><div className="weekRow" key={l.subject}><span>{l.time}</span>{["BCA · A","BCA · A","BCA · B","MCA · A","BCA · A","—"].map((x,j)=><div key={j} className={j===i?"slot active":"slot"}>{j===i&&<><b>{l.subject}</b><small>{x} · {l.room}</small></>}</div>)}</div>)}</div></section>}
function LeaveStudent({onToast}:{onToast:(s:string)=>void}){return <section className="content"><div className="pageHead"><div><span className="eyebrow">STUDENT SERVICES</span><h1>Leave <em>requests.</em></h1><p>Apply online and attach medical or supporting documents when needed.</p></div><button className="primary" onClick={()=>onToast("Leave request created and sent for approval.")}>New Leave Request <ArrowUpRight size={15}/></button></div><div className="requestList">{["Medical leave · 18 Sep","Family function · 02 Sep","Medical leave · 21 Aug"].map((x,i)=><div className="requestRow" key={x}><FileSpreadsheet size={18}/><div><b>{x}</b><small>{i===0?"Pending review":"Approved"} · Document attached</small></div><span className={i===0?"status pending":"status approved"}>{i===0?"Pending":"Approved"}</span></div>)}</div></section>}
function LeaveAdmin({onToast}:{onToast:(s:string)=>void}){return <section className="content"><div className="pageHead"><div><span className="eyebrow">LEAVE MANAGEMENT</span><h1>Review <em>requests.</em></h1><p>Approved leave automatically prevents false absence notifications.</p></div></div><div className="requestList">{["Aanya Patel · Medical · 18 Sep","Rohan Shah · Family function · 18 Sep","Mihir Desai · Medical · 19 Sep"].map((x,i)=><div className="requestRow" key={x}><div className="avatar">AP</div><div><b>{x}</b><small>Supporting document · Submitted 20 min ago</small></div><span className="requestActions"><button className="approve" onClick={()=>onToast("Leave approved. Attendance will show On Leave.")}>Approve</button><button className="reject" onClick={()=>onToast("Leave rejected.")}>Reject</button></span></div>)}</div></section>}
function Adjustments(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">FACULTY ADJUSTMENT</span><h1>Substitute <em>lectures.</em></h1><p>Temporary access is granted only for the selected date and lecture.</p></div><button className="primary">New adjustment <ArrowUpRight size={15}/></button></div><div className="requestList">{["DBMS · 19 Sep · Prof. Shah → Prof. Patel","Web Technology · 20 Sep · Prof. Mehta → Prof. Patel"].map(x=><div className="requestRow" key={x}><Users size={18}/><div><b>{x}</b><small>Temporary attendance access · Active</small></div><span className="status approved">Active</span></div>)}</div></section>}
function Master({title}:{title:string}){return <section className="content"><div className="pageHead"><div><span className="eyebrow">ADMIN · MASTER MANAGEMENT</span><h1>{title} <em>management.</em></h1><p>Dynamic records with search, filters, validation and audit history.</p></div><button className="primary">Add {title.slice(0,-1)} <ArrowUpRight size={15}/></button></div><div className="card masterTable">{["BCA · Semester 3 · Division A","BCA · Semester 4 · Division B","MCA · Semester 1 · Division A","B.Tech · Semester 5 · Division A"].map((x,i)=><div className="masterRow" key={x}><div className="avatar">{String(i+1).padStart(2,"0")}</div><div><b>{x}</b><small>48 records · Updated today</small></div><button className="iconBtn"><MoreHorizontal size={17}/></button></div>)}</div></section>}
function Defaulters(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">ELIGIBILITY CONTROL</span><h1>Attendance <em>defaulters.</em></h1><p>Students below the configured threshold can be warned and marked for eligibility review.</p></div><button className="primary"><MessageSquare size={15}/> Send warnings</button></div><div className="card masterTable">{["Mihir Desai","Riya Patel","Dev Shah","Krisha Joshi"].map((x,i)=><div className="masterRow" key={x}><div className="avatar">{x.split(" ").map(y=>y[0]).join("")}</div><div><b>{x}</b><small>BCA · Sem 3 · DBMS · Parent notification eligible</small></div><strong className="warn">{68-i*3}%</strong><button className="ghost">Review</button></div>)}</div></section>}
function Reports(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">REPORTING</span><h1>Reports that <em>travel well.</em></h1><p>Export daily, monthly, semester and subject-wise attendance for department submission.</p></div><button className="primary"><Download size={15}/> Export Excel</button></div><div className="reportGrid">{["Daily attendance register","Monthly department report","Student attendance sheet","Defaulter & eligibility report"].map((x,i)=><div className="reportCard" key={x}><FileSpreadsheet size={20}/><b>{x}</b><span>Excel · PDF · Filters</span><ArrowUpRight size={15}/></div>)}</div></section>}
function Audit(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">SECURITY · AUDIT</span><h1>Every change, <em>traceable.</em></h1><p>Attendance edits require a reason and remain visible to authorized administrators.</p></div></div><div className="card audit">{["Prof. Patel changed Krish Mehta · Absent → Present · Reason: medical proof","HOD Shah approved Aanya Patel's leave","Admin created timetable slot · BCA Sem 3 · Monday 09:00","Prof. Mehta submitted attendance · DBMS · 47/48 present"].map((x,i)=><div key={x}><ShieldCheck size={16}/><div><b>{x}</b><small>Today · {10+i}:2{i} · Immutable audit event</small></div></div>)}</div></section>}
function Notifications(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">NOTIFICATIONS</span><h1>Stay <em>informed.</em></h1><p>Attendance, leave and eligibility alerts appear here.</p></div></div><div className="requestList">{["Attendance alert · DBMS · Absent on 18 Sep","Leave approved · Medical leave · 17 Sep","Warning · Attendance below 75% in Computer Networks"].map((x,i)=><div className="requestRow" key={x}><Bell size={18}/><div><b>{x}</b><small>Sent via notification center · Today</small></div><span className="status approved">Read</span></div>)}</div></section>}
function LeaveStatus(){return <section className="content"><div className="pageHead"><div><span className="eyebrow">PARENT PORTAL</span><h1>Leave <em>status.</em></h1><p>View your student's current and historical leave requests.</p></div></div><div className="card studentHero"><div><span>STUDENT</span><b>Aarav Patel</b><small>3 requests this semester</small></div><div><span>LATEST</span><b>Approved</b><small>Medical leave · 18 Sep</small></div></div></section>}
function SettingsPage({role}:{role:Role}){return <section className="content"><div className="pageHead"><div><span className="eyebrow">ACCOUNT</span><h1>Workspace <em>settings.</em></h1><p>Profile, notification preferences and role-specific controls.</p></div></div><div className="settingsGrid">{["Profile & account","Notification preferences","Attendance threshold","Security & sessions"].map((x,i)=><div className="card settingCard" key={x}><Settings size={18}/><b>{x}</b><small>{i===2?"Current threshold: 75%":`Configured for ${roleLabel(role)}`}</small><ChevronRight size={15}/></div>)}</div></section>}

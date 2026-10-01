import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ClipboardCheck, FileText, GraduationCap, ShieldCheck, Users } from "lucide-react";

const products=[
  {icon:ClipboardCheck,title:"Attendance operations",text:"Timetable-driven classroom attendance, live marking, corrections and daily history.",href:"/login?role=FACULTY"},
  {icon:CalendarDays,title:"Academic planning",text:"Departments, programs, semesters, divisions, subjects and master timetable in one system.",href:"/login?role=ADMIN"},
  {icon:BarChart3,title:"Reports & insights",text:"Student, subject, date-wise and defaulter views built from the same attendance records.",href:"/login?role=ADMIN"},
  {icon:FileText,title:"Digital records",text:"Secure documents, examination schedules, hall tickets and institutional uploads.",href:"/login?role=STUDENT"}
];

const portals=[
  {icon:ShieldCheck,name:"Administration",role:"Admin",desc:"Structure, students, faculty, accounts, timetable, reports and audit.",href:"/login?role=ADMIN"},
  {icon:ShieldCheck,name:"Super Admin",role:"Super Admin",desc:"Platform governance, security, administrators and institutional control.",href:"/login?role=SUPER_ADMIN"},
  {icon:Users,name:"HOD workspace",role:"HOD",desc:"Department faculty, students, attendance monitoring, leave and reports.",href:"/login?role=HOD"},
  {icon:Users,name:"Faculty workspace",role:"Faculty",desc:"Today's lectures, classroom attendance, timetable, leaves and reports.",href:"/login?role=FACULTY"},
  {icon:GraduationCap,name:"Student workspace",role:"Student",desc:"Attendance, timetable, leave requests, hall tickets and notifications.",href:"/login?role=STUDENT"},
  {icon:Users,name:"Parent workspace",role:"Parent",desc:"Family attendance, leave status, notifications and academic reports.",href:"/login?role=PARENT"}
];

export default function Home(){
 return <main className="corpHome">
   <section className="corpHero">
     <nav className="corpNav">
       <Link href="/" className="corpBrand"><span className="corpLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions"/></span><span><b>Noble</b><small>Group of Institutions</small></span></Link>
       <div className="corpNavMeta"><span>ACADEMIC YEAR</span><b>2026–27</b><Link href="/login">Sign in <ArrowRight size={14}/></Link></div>
     </nav>
     <div className="heroGrid">
       <div className="heroCopy">
         <span className="corpKicker">NOBLE · DIGITAL CAMPUS PLATFORM</span>
         <h1>One campus.<br/><em>One source of truth.</em></h1>
         <p>A professional attendance and academic operations workspace connecting administration, faculty, students and parents around the same institutional data.</p>
         <div className="heroActions"><Link href="/login" className="heroPrimary">Open workspace <ArrowRight size={16}/></Link><a href="#platform" className="heroSecondary">Explore platform</a></div>
         <div className="heroProof"><span><CheckCircle2 size={14}/> Role-based access</span><span><CheckCircle2 size={14}/> Live database records</span><span><CheckCircle2 size={14}/> Academic-year ready</span></div>
       </div>
       <div className="heroPanel">
         <div className="heroPanelTop"><span>LIVE WORKSPACE</span><i/></div>
         <div className="heroPanelMain"><div className="miniIcon"><ClipboardCheck size={18}/></div><b>Attendance command centre</b><p>See today's classes, mark attendance and move directly into reports.</p></div>
         <div className="heroPanelRows"><div><span>Today's lectures</span><b>Timetable</b></div><div><span>Attendance status</span><b>Live</b></div><div><span>Access control</span><b>RBAC</b></div></div>
       </div>
     </div>
   </section>

   <section id="platform" className="corpSection">
     <div className="sectionIntro"><div><span className="corpKicker dark">PLATFORM</span><h2>Built like an institutional product.</h2></div><p>The interface is deliberately quiet, structured and task-first — the same workspace can scale from a single department to a complete campus.</p></div>
     <div className="productGrid">{products.map(({icon:Icon,title,text,href})=><Link href={href} className="productCard" key={title}><div className="productIcon"><Icon size={18}/></div><h3>{title}</h3><p>{text}</p><span>Open workspace <ArrowRight size={14}/></span></Link>)}</div>
   </section>

   <section className="corpSection portalsSection">
     <div className="sectionIntro"><div><span className="corpKicker dark">WORKSPACES</span><h2>Each role sees what it needs.</h2></div><p>Permissions stay separate. Data stays connected.</p></div>
     <div className="portalCards">{portals.map(({icon:Icon,name,role,desc,href})=><Link href={href} className="corpPortal" key={role}><div className="corpPortalTop"><div className="productIcon"><Icon size={18}/></div><span>SECURE ACCESS</span></div><small>{role.toUpperCase()}</small><h3>{name}</h3><p>{desc}</p><div className="corpPortalAction">Continue <ArrowRight size={14}/></div></Link>)}</div>
   </section>

   <section className="corpFooter"><div><Link href="/" className="corpBrand"><span className="corpLogo"><img src="/noble-logo.jpg" alt=""/></span><span><b>Noble</b><small>Group of Institutions</small></span></Link></div><div><span>Attendance & Academic Operations</span><small>Academic Year 2026–27 · Secure institutional workspace</small></div><Link href="/login">Sign in <ArrowRight size={14}/></Link></section>
 </main>;
}
import { ArrowRight, BarChart3, Bell, CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: ClipboardCheck, title: "Smart Attendance", text: "Timetable-driven attendance with Present, Absent, Leave, Exam and Late status.", href: "/login?role=FACULTY" },
  { icon: CalendarDays, title: "Master Timetable", text: "Monday–Saturday lectures, divisions, subjects, rooms and faculty assignments.", href: "/login?role=ADMIN" },
  { icon: BarChart3, title: "Reports & Defaulters", text: "Subject-wise and overall attendance with 75% eligibility monitoring.", href: "/login?role=ADMIN" },
  { icon: Bell, title: "Parent Alerts", text: "Attendance notification pipeline for SMS and WhatsApp alerts.", href: "/login?role=ADMIN" },
];

const portals = [
  { icon: ShieldCheck, title: "Admin", text: "Departments, students, faculty, accounts and master timetable.", href: "/admin" },
  { icon: Users, title: "Faculty", text: "Today's lectures and fast classroom attendance marking.", href: "/login?role=FACULTY" },
  { icon: GraduationCap, title: "Student", text: "Attendance, timetable, leave requests and notifications.", href: "/login?role=STUDENT" },
];

export default function Home() {
  return (
    <main className="homePage">
      <section className="homeHero">
        <div className="homeHeroGlow" />
        <header className="homeHeader">
          <div className="homeBrand">
            <div className="homeLogo imageLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions logo" /></div>
            <div><b>Noble</b><span>Group of Institutions</span></div>
          </div>
          <div className="homeYear">ACADEMIC YEAR <b>2026–27</b></div>
        </header>
        <div className="homeHeroContent">
          <span className="homeEyebrow">NOBLE ATTENDANCE MANAGEMENT SYSTEM</span>
          <h1>Attendance,<br /><em>without the chaos.</em></h1>
          <p>One connected platform for college administration, faculty and students — built around the Noble academic structure.</p>
          <div className="homeTrust">
            <span><CheckCircle2 size={15} /> Timetable driven</span>
            <span><CheckCircle2 size={15} /> 75% monitoring</span>
            <span><CheckCircle2 size={15} /> SMS + WhatsApp ready</span>
          </div>
        </div>
      </section>

      <section className="homeBody">
        <div className="homeIntro">
          <div><span className="eyebrow">SYSTEM OVERVIEW</span><h2>Noble Attendance.</h2><p>A clean central workspace for the complete attendance lifecycle.</p></div>
          <div className="homeStatus"><span /> Secure workspace access</div>
        </div>

        <div className="homeFeatureGrid">
          {features.map(({ icon: Icon, title, text, href }) => (
            <Link className="homeFeature homeClickable" href={href} key={title}>
              <div className="homeFeatureIcon"><Icon size={18} /></div>
              <h3>{title}</h3><p>{text}</p>
              <div className="homeCardAction">Sign in securely <ArrowRight size={14} /></div>
            </Link>
          ))}
        </div>

        <div className="homeSectionHead">
          <div><span className="eyebrow">PORTALS</span><h2>One system. Three workspaces.</h2></div>
          <span className="homeNote">Noble Group of Institutions · Mota Habipura, Dabhoi, Gujarat</span>
        </div>

        <div className="homePortalGrid">
          {portals.map(({ icon: Icon, title, text, href }) => (
            <Link className="homePortal homeClickable" href={href} key={title}>
              <div className="homePortalTop"><div className="homePortalIcon"><Icon size={19} /></div><span>SECURE PORTAL</span></div>
              <h3>{title}</h3><p>{text}</p>
              <div className="homePortalLine"><span>Open workspace</span><ArrowRight size={15} /></div>
            </Link>
          ))}
        </div>

        <footer className="homeFooter">
          <div><b>Noble Group of Institutions</b><span>Attendance Management System</span></div>
          <small>Academic Year 2026–27 · Secure access</small>
        </footer>
      </section>
    </main>
  );
}
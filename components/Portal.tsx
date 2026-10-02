"use client";

import AdminWorkspace from "@/components/AdminWorkspace";
import AdminStudents from "@/components/AdminStudents";
import AdminAccounts from "@/components/AdminAccounts";
import FacultyManagement from "@/components/FacultyManagement";
import FacultySubjectMapping from "@/components/FacultySubjectMapping";
import SubjectManagement from "@/components/SubjectManagement";
import TimetableManagement from "@/components/TimetableManagement";
import AcademicStructure from "@/components/AcademicStructure";
import WorkspaceModule from "@/components/WorkspaceModule";
import UploadCenter from "@/components/UploadCenter";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  ClipboardCheck, Download, FileUp, GraduationCap, LayoutDashboard, LogOut,
  Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Users, X,
  ChevronRight, Sparkles
} from "lucide-react";

type Role="Admin"|"Super Admin"|"HOD"|"Faculty"|"Student"|"Parent";

const data = {
  Admin:[
    "Overview","Student Management","Faculty Management","Admissions","Academic Structure","Subjects","Faculty-Subject Mapping",
    "Master Timetable","Attendance","Attendance Reports","Leaves","Examinations","Hall Tickets","Results","Assignments",
    "Study Material","AI Study Generator","AI Tutor","PYQ Bank","Notes","Fees & Accounts","Scholarship","Documents","ID Cards",
    "Notifications","SMS / Email / WhatsApp","Helpdesk","Library","Hostel","Transport","Placement","Internship","Events",
    "Certificates","Alumni","Reports & Analytics","Uploads","Audit Logs","Settings"
  ],
  "Super Admin":[
    "Overview","Institutions","Departments","Programs","Users","Roles & Permissions","Administrators","HODs","Faculty",
    "Students","System Settings","Security","Audit Logs","Database / System Health","Notification Configuration",
    "Integration Configuration","Backup / Export","Access Control","Reports & Analytics","Settings"
  ],
  HOD:[
    "Overview","Department Overview","Students","Faculty","Subjects","Faculty-Subject Mapping","Master Timetable",
    "Attendance Monitor","Attendance Reports","Defaulters","Leave Approvals","Examinations","Result Monitoring",
    "Faculty Workload","Department Notifications","Assignments","Study Material","PYQ Bank","Notes","Reports","Audit"
  ],
  Faculty:[
    "Overview","Today's Lectures","My Classes","My Subjects","Timetable","Attendance","Attendance Correction",
    "Attendance Reports","Assignments","Study Material Upload","Question Bank","Exams","Marks Entry","Results",
    "Leave Requests","Substitute Faculty","Student Requests","Notifications","Reports","Profile","Settings"
  ],
  Student:[
    "Overview","My Profile","My Courses","Timetable","My Attendance","Attendance Alerts","Attendance Reports","Assignments",
    "Study Material","AI Study Generator","AI Tutor","PYQ Bank","Notes","Exams","Hall Tickets","Results","Fees","Leave Requests",
    "Notifications","Library","Hostel","Transport","Documents","Certificates","Helpdesk","Events","Placement","Settings"
  ],
  Parent:[
    "Overview","My Child","Attendance","Attendance Alerts","Timetable","Assignments","Study Material","Examinations","Hall Tickets",
    "Results","Fees","Leave Status","Notifications","Library","Hostel","Transport","Certificates","Helpdesk","Events","Settings"
  ]
} as const;

const groupsFor=(role:Role)=>{
  const items=data[role];
  const groups=[
    {label:"Dashboard",items:items.filter(x=>x==="Overview")},
    {label:"People & Academics",items:items.filter(x=>[
      "Student Management","Faculty Management","Students","Faculty","HODs","Administrators","Users","Roles & Permissions",
      "Department Overview","Departments","Programs","Academic Structure","Subjects","My Classes","My Subjects","My Courses",
      "Faculty-Subject Mapping","Profile","My Profile","My Child"
    ].includes(x))},
    {label:"Academic Operations",items:items.filter(x=>[
      "Master Timetable","Timetable","Today's Lectures","Attendance","My Attendance","Attendance Monitor","Attendance Correction",
      "Attendance Reports","Attendance Alerts","Attendance Reports","Assignments","Study Material","Study Material Upload",
      "AI Study Generator","AI Tutor","Question Bank","PYQ Bank","Notes","Exams","Examinations","Hall Tickets","Marks Entry","Results",
      "Result Monitoring","Faculty Workload","Defaulters","Leave Approvals","Leave Requests","Leave Status","Substitute Faculty"
    ].includes(x))},
    {label:"Campus Services",items:items.filter(x=>[
      "Fees","Fees & Accounts","Scholarship","Library","Hostel","Transport","Placement","Internship","Events","Certificates",
      "Documents","ID Cards","Helpdesk","Notifications","Department Notifications","Student Requests","SMS / Email / WhatsApp",
      "Integration Configuration"
    ].includes(x))},
    {label:"Governance & Intelligence",items:items.filter(x=>[
      "Reports","Reports & Analytics","Audit","Audit Logs","System Settings","Security","Database / System Health",
      "Notification Configuration","Backup / Export","Access Control","Settings","Uploads"
    ].includes(x))}
  ];
  return groups.filter(x=>x.items.length);
};

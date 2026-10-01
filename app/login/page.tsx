"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, ShieldCheck, UsersRound, Eye, EyeOff, LockKeyhole, Building2, UserRound } from "lucide-react";

type PortalRole="ADMIN"|"SUPER_ADMIN"|"HOD"|"FACULTY"|"STUDENT"|"PARENT";
const roles:{id:PortalRole;title:string;desc:string;icon:any}[]=[
 {id:"ADMIN",title:"Administration",desc:"Institution operations",icon:ShieldCheck},
 {id:"SUPER_ADMIN",title:"Super Admin",desc:"Platform governance",icon:Building2},
 {id:"HOD",title:"HOD",desc:"Department control",icon:UserRound},
 {id:"FACULTY",title:"Faculty",desc:"Teaching workspace",icon:UsersRound},
 {id:"STUDENT",title:"Student",desc:"Academic workspace",icon:GraduationCap},
 {id:"PARENT",title:"Parent",desc:"Family overview",icon:UsersRound}
];

function LoginForm(){
 const params=useSearchParams();const router=useRouter();
 const initial=params.get("role")?.toUpperCase() as PortalRole|undefined;
 const [role,setRole]=useState<PortalRole>(roles.some(x=>x.id===initial)?initial!:"ADMIN");
 const [username,setUsername]=useState("");const [password,setPassword]=useState("");const [show,setShow]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password,role})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Sign in could not be completed.");router.replace(d.redirect);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Sign in could not be completed.")}finally{setBusy(false)}}
 return <main className="authPage">
   <section className="authVisual"><div className="authOrb one"/><div className="authOrb two"/><div className="authVisualInner"><a href="/" className="authBrand"><span className="authLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions"/></span><span><b>Noble</b><small>Digital Campus</small></span></a><div className="authMessage"><span className="corpKicker">SECURE INSTITUTIONAL ACCESS</span><h1>One campus.<br/><em>One workspace.</em></h1><p>A focused digital environment for administration, faculty, students, parents and department leadership.</p><div className="authFeature"><ShieldCheck size={17}/><span><b>Role-based access</b><small>Every portal opens only the tools assigned to that role.</small></span></div><div className="authFeature"><LockKeyhole size={17}/><span><b>Protected sessions</b><small>Institutional data stays behind authenticated access.</small></span></div></div><div className="authVisualFoot">NOBLE DIGITAL CAMPUS · 2026–27</div></div></section>
   <section className="authPanel"><div className="authBox"><a href="/" className="authBack">← Noble home</a><span className="corpKicker dark">SIGN IN</span><h2>Welcome back.</h2><p className="authMuted">Choose your portal and enter your Noble credentials.</p>
    <div className="authRoleGrid">{roles.map(({id,title,desc,icon:Icon})=><button key={id} type="button" className={role===id?"authRole active":"authRole"} onClick={()=>{setRole(id);setError("")}}><Icon size={16}/><span><b>{title}</b><small>{desc}</small></span></button>)}</div>
    <form onSubmit={submit}><label htmlFor="username">Username / enrollment number</label><div className="authInput"><input id="username" required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder={role==="STUDENT"?"Enrollment number":"Your username"}/></div><div className="authLabelRow"><label htmlFor="password">Password</label><span>Protected access</span></div><div className="authInput"><input id="password" required type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>{error&&<div className="authError">{error}</div>}<button className="authSubmit" disabled={busy}>{busy?"Signing in…":"Sign in"}<ArrowRight size={16}/></button></form>
    {role==="STUDENT"&&<a href="/signup" className="authActivation">Need a student account? Activate it <ArrowRight size={13}/></a>}
    <small className="authLegal">Admin, HOD, Faculty, Parent and Super Admin accounts are provisioned by authorised institution staff.</small>
   </div></section>
 </main>;
}
export default function LoginPage(){return <Suspense><LoginForm/></Suspense>}

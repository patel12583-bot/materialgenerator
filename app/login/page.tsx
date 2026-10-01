"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, ShieldCheck, UsersRound, Eye, EyeOff, LockKeyhole } from "lucide-react";

type PortalRole="ADMIN"|"FACULTY"|"STUDENT";
const roles=[
 {id:"ADMIN" as const,title:"Administration",desc:"Manage the institution",icon:ShieldCheck},
 {id:"FACULTY" as const,title:"Faculty",desc:"Teach & record attendance",icon:UsersRound},
 {id:"STUDENT" as const,title:"Student",desc:"View your academic record",icon:GraduationCap}
];

function LoginForm(){
 const params=useSearchParams();const router=useRouter();
 const initial=params.get("role")?.toUpperCase();
 const [role,setRole]=useState<PortalRole>(initial==="FACULTY"||initial==="STUDENT"||initial==="ADMIN"?initial:"ADMIN");
 const [username,setUsername]=useState("");const [password,setPassword]=useState("");const [show,setShow]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password,role})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Sign in could not be completed.");router.replace(d.redirect);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Sign in could not be completed.")}finally{setBusy(false)}}
 return <main className="authPage">
   <section className="authVisual"><div className="authOrb one"/><div className="authOrb two"/><div className="authVisualInner"><a href="/" className="authBrand"><span className="authLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions"/></span><span><b>Noble</b><small>Group of Institutions</small></span></a><div className="authMessage"><span className="corpKicker">SECURE INSTITUTIONAL ACCESS</span><h1>Everything your<br/><em>campus runs on.</em></h1><p>A single professional workspace for academic operations, attendance and institutional records.</p><div className="authFeature"><ShieldCheck size={17}/><span><b>Role-based access</b><small>Every workspace is protected by institutional permissions.</small></span></div><div className="authFeature"><LockKeyhole size={17}/><span><b>Secure session</b><small>Authenticated access to Noble academic data.</small></span></div></div><div className="authVisualFoot">NOBLE GROUP OF INSTITUTIONS · 2026–27</div></div></section>
   <section className="authPanel"><div className="authBox"><a href="/" className="authBack">← Noble home</a><span className="corpKicker dark">SIGN IN</span><h2>Welcome back.</h2><p className="authMuted">Choose your workspace and enter your Noble credentials.</p>
    <div className="authRoleGrid">{roles.map(({id,title,desc,icon:Icon})=><button key={id} type="button" className={role===id?"authRole active":"authRole"} onClick={()=>{setRole(id);setError("")}}><Icon size={16}/><span><b>{title}</b><small>{desc}</small></span></button>)}</div>
    <form onSubmit={submit}><label htmlFor="username">Username / enrollment number</label><div className="authInput"><input id="username" required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder={role==="STUDENT"?"Enrollment number":"Your username"}/></div><div className="authLabelRow"><label htmlFor="password">Password</label><span>Protected access</span></div><div className="authInput"><input id="password" required type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>{error&&<div className="authError">{error}</div>}<button className="authSubmit" disabled={busy}>{busy?"Signing in…":"Sign in"}<ArrowRight size={16}/></button></form>
    {role==="STUDENT"&&<a href="/signup" className="authActivation">Need a student account? Activate it <ArrowRight size={13}/></a>}
    <small className="authLegal">Access is limited by role and institution. If your account is not active, contact Noble Administration.</small>
   </div></section>
 </main>;
}
export default function LoginPage(){return <Suspense><LoginForm/></Suspense>}
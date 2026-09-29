"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Phone, UserRound, GraduationCap, ShieldCheck } from "lucide-react";

const methods = [
  { id:"enrollment", label:"Enrollment No.", icon:GraduationCap },
  { id:"mobile", label:"Mobile + OTP", icon:Phone },
  { id:"google", label:"Google Account", icon:Mail },
];

export default function SignupPage(){
  const [method,setMethod]=useState("enrollment");
  const [enrollment,setEnrollment]=useState("");
  const [name,setName]=useState("");
  const [mobile,setMobile]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault(); setBusy(true); setMessage("");
    try{
      if(method==="google"){
        setMessage("Google sign-up is ready for OAuth provider configuration. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel before enabling it.");
        return;
      }
      const r=await fetch("/api/auth/signup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({method,enrollment,name,mobile,email,password})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to create account.");
      setMessage(d.message||"Account created. You can now sign in.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to create account.");}
    finally{setBusy(false);}
  }

  return <main className="loginPage">
    <section className="loginBrand">
      <div className="loginGlow"/>
      <div className="loginBrandInner">
        <div className="loginLogo imageLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions logo"/></div>
        <span className="loginEyebrow">NOBLE GROUP OF INSTITUTIONS</span>
        <h1>Create your<br/><em>Noble account.</em></h1>
        <p>Secure access for students and authorised college users.</p>
        <div className="loginTrust"><ShieldCheck size={16}/> Verified identity · Academic Year 2026–27</div>
      </div>
    </section>
    <section className="loginPanel"><div className="loginBox">
      <a className="backLink" href="/login"><ArrowLeft size={14}/> Back to sign in</a>
      <span className="loginEyebrow dark">NEW ACCOUNT</span><h2>Create account.</h2>
      <p className="loginMuted">Choose how your college identity should be verified.</p>
      <div className="roleGrid signupMethods">{methods.map(m=>{const Icon=m.icon;return <button type="button" key={m.id} className={method===m.id?"roleChoice active":"roleChoice"} onClick={()=>setMethod(m.id)}><Icon size={15}/>{m.label}</button>})}</div>
      {method==="google" ? <div className="signupInfo">Google OAuth requires a verified Google Cloud application and redirect configuration. The button will be enabled only after those production credentials are configured.</div> :
      <form onSubmit={submit}>
        <label>Full name</label><div className="loginInput"><UserRound size={17}/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></div>
        {method==="enrollment" && <><label>Enrollment number</label><div className="loginInput"><GraduationCap size={17}/><input required value={enrollment} onChange={e=>setEnrollment(e.target.value)} placeholder="College enrollment number"/></div></>}
        <label>Mobile number</label><div className="loginInput"><Phone size={17}/><input required value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+91 98765 43210"/></div>
        <label>Email (optional)</label><div className="loginInput"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></div>
        <label>Password</label><div className="loginInput"><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters"/></div>
        <button className="loginSubmit" disabled={busy}>{busy?"Creating…":"Create account"}<ArrowRight size={17}/></button>
      </form>}
      {message&&<div className="loginError signupMessage">{message}</div>}
      <small className="loginFooter">Account access is subject to Noble Group of Institutions verification.</small>
    </div></section>
  </main>;
}
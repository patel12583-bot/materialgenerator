"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, Mail, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";

export default function SignupPage(){
  const [accountType,setAccountType]=useState<"STUDENT"|"FACULTY"|"ADMIN">("STUDENT");
  const [enrollment,setEnrollment]=useState("");
  const [name,setName]=useState("");
  const [mobile,setMobile]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    setMessage("");
    if(password !== confirmPassword){
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try{
      const r=await fetch("/api/auth/signup",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({enrollment,name,mobile,email,password})
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to create account.");
      setMessage(d.message||"Account created. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
    }catch(e){
      setMessage(e instanceof Error?e.message:"Unable to create account.");
    }finally{
      setBusy(false);
    }
  }

  return <main className="loginPage">
    <section className="loginBrand">
      <div className="loginGlow"/>
      <div className="loginBrandInner">
        <div className="loginLogo imageLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions logo"/></div>
        <span className="loginEyebrow">NOBLE GROUP OF INSTITUTIONS</span>
        <h1>Activate your<br/><em>Noble account.</em></h1>
        <p>Students can activate their college account using their registered enrollment details.</p>
        <div className="loginTrust"><ShieldCheck size={16}/> Verified student access · Academic Year 2026–27</div>
      </div>
    </section>

    <section className="loginPanel">
      <div className="loginBox">
        <a className="backLink" href="/"><ArrowLeft size={14}/> Back to sign in</a>
        <span className="loginEyebrow dark">{accountType} ACCOUNT</span>
        <h2>Create account.</h2>
        <p className="loginMuted">Choose the account type below. Student activation is self-service; Faculty and Admin accounts are managed by Noble Admin.</p>

        <div className="roleGrid accountRoleInfo">
          <button type="button" className={`roleChoice roleChoiceButton ${accountType==="STUDENT"?"active":""}`} onClick={()=>{setAccountType("STUDENT");setMessage("");}}><GraduationCap size={15}/> Student</button>
          <button type="button" className={`roleChoice roleChoiceButton ${accountType==="FACULTY"?"active":""}`} onClick={()=>{setAccountType("FACULTY");setMessage("");}}><UsersRound size={15}/> Faculty</button>
          <button type="button" className={`roleChoice roleChoiceButton ${accountType==="ADMIN"?"active":""}`} onClick={()=>{setAccountType("ADMIN");setMessage("");}}><ShieldCheck size={15}/> Admin</button>
        </div>

        {accountType !== "STUDENT" ? <div className="managedAccountCard">
          <div className="managedAccountIcon">{accountType==="FACULTY"?<UsersRound size={20}/>:<ShieldCheck size={20}/>}</div>
          <div>
            <h3>{accountType==="FACULTY"?"Faculty account":"Admin account"}</h3>
            <p>{accountType==="FACULTY"?"Faculty accounts are created by an existing Noble Admin with department and employee details.":"Admin accounts are created by an existing Noble Admin for controlled access to the college system."}</p>
            <a className="managedAccountLink" href="/">Go to sign in <ArrowRight size={14}/></a>
          </div>
        </div> : <form onSubmit={submit}>
          <label>Full name</label>
          <div className="loginInput"><UserRound size={17}/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></div>

          <label>Enrollment number</label>
          <div className="loginInput"><GraduationCap size={17}/><input required value={enrollment} onChange={e=>setEnrollment(e.target.value)} placeholder="College enrollment number"/></div>

          <label>Mobile number</label>
          <div className="loginInput"><Phone size={17}/><input required type="tel" inputMode="numeric" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="10-digit mobile number"/></div>

          <label>Email (optional)</label>
          <div className="loginInput"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></div>

          <label>Password</label>
          <div className="loginInput"><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters"/></div>

          <label>Confirm password</label>
          <div className="loginInput"><input required minLength={8} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter password"/></div>

          {message&&<div className="loginError signupMessage">{message}</div>}
          <button className="loginSubmit" disabled={busy}>{busy?"Creating…":"Create account"}<ArrowRight size={17}/></button>
        </form>}

        <small className="loginFooter">{accountType==="STUDENT" ? "Faculty and Admin accounts are created by an existing Noble Admin from Admin → Accounts." : "Need this account? Ask an existing Noble Admin to create it from Admin → Accounts."}</small>
      </div>
    </section>
  </main>;
}

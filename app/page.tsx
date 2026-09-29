"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, FileText, Brain, BarChart3, CheckCircle2, Sparkles, BookOpen,
  MessageSquare, Layers, Settings, ChevronRight, Download, RefreshCw,
  LogOut, Shield, UserPlus, Smartphone, Mail, Lock, Users, Crown
} from "lucide-react";

type Source={id:string,name:string,text:string,chunks:number,size?:number};
type Material={kind:string,data:any,provider?:string,notice?:string};
type Role="student"|"admin"|"super_admin";
type Account={id:string,name:string,email:string,mobile:string,password:string,role:Role};

const nav=[["Dashboard",BarChart3],["Documents",FileText],["Study Materials",BookOpen],["Questions",MessageSquare],["MCQs",Layers],["Quizzes",CheckCircle2],["AI Tutor",Brain],["Analytics",BarChart3]] as const;
const roleLabel=(r:Role)=>r==="super_admin"?"Super Admin":r==="admin"?"Admin":"Student";

export default function Home(){
 const[auth,setAuth]=useState<"login"|"register">("login");
 const[account,setAccount]=useState<Account|null>(null);
 const[tab,setTab]=useState("Dashboard");
 const[file,setFile]=useState<File|null>(null);
 const[source,setSource]=useState<Source|null>(null);
 const[material,setMaterial]=useState<Material|null>(null);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState("");
 const[count,setCount]=useState(10);
 const[language,setLanguage]=useState("English");
 const[difficulty,setDifficulty]=useState("Medium");
 const[length,setLength]=useState("Detailed");
 const[quizIndex,setQuizIndex]=useState(0),[score,setScore]=useState(0),[answered,setAnswered]=useState<number|null>(null),[quizDone,setQuizDone]=useState(false);
 const[authError,setAuthError]=useState("");
 const uploadInputRef=useRef<HTMLInputElement>(null);

 useEffect(()=>{try{const a=localStorage.getItem("eduforge_session");const s=localStorage.getItem("eduforge_source");const m=localStorage.getItem("eduforge_material");if(a)setAccount(JSON.parse(a));if(s)setSource(JSON.parse(s));if(m)setMaterial(JSON.parse(m))}catch{}},[]);
 useEffect(()=>{if(source)localStorage.setItem("eduforge_source",JSON.stringify(source));},[source]);
 useEffect(()=>{if(material)localStorage.setItem("eduforge_material",JSON.stringify(material));},[material]);

 const mcqs=useMemo(()=>material?.kind==="mcq"&&Array.isArray(material.data)?material.data:[],[material]);

 async function upload(selected?:File|null, target?:string){
   const f=selected||file;
   if(!f){setMsg("Pehla file select karo.");return;}
   setBusy(true);setMsg("File read + extract thai rahi che...");
   try{
     const fd=new FormData();fd.append("file",f);
     const r=await fetch("/api/documents",{method:"POST",body:fd});
     const d=await r.json();if(!r.ok)throw new Error(d.error||"Upload failed");
     const s={id:d.id,name:d.name,text:d.text,chunks:d.chunks,size:d.size};
     setSource(s);setFile(f);setMsg("✓ Upload complete — "+d.chunks+" chunks ready.");
     if(target)setTab(target);
   }catch(e){setMsg(e instanceof Error?e.message:"Upload failed");}
   finally{setBusy(false);}
 }
 function chooseFile(target?:string){if(target)setTab(target);uploadInputRef.current?.click();}
 async function generate(kind:string){
   if(!source){setMsg("Pehla source upload karo.");return;}
   setBusy(true);setMsg("Generating "+kind+"...");
   try{
     const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:source.text,kind,count,language,difficulty,length})});
     const d=await r.json();if(!r.ok)throw new Error(d.error);
     setMaterial({kind,data:d.data,provider:d.provider,notice:d.notice});
     setMsg("✓ "+kind+" generated.");
     setTab(kind==="notes"?"Study Materials":kind==="qa"?"Questions":kind==="mcq"?"MCQs":"Study Materials");
   }catch(e){setMsg(e instanceof Error?e.message:"Generation failed");}
   finally{setBusy(false);}
 }
 function startQuiz(){if(!mcqs.length)return;setQuizIndex(0);setScore(0);setAnswered(null);setQuizDone(false);setTab("Quizzes")}
 function answer(i:number){if(answered!==null)return;setAnswered(i);if(i===Number(mcqs[quizIndex].answer))setScore(s=>s+1)}
 function next(){if(quizIndex+1>=mcqs.length){setQuizDone(true);return}setQuizIndex(i=>i+1);setAnswered(null)}
 async function exportMaterial(){
   if(!material)return;
   const r=await fetch("/api/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"EduForge Study Material",body:JSON.stringify(material.data,null,2)})});
   if(!r.ok){setMsg("Export failed");return}const blob=await r.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eduforge-study-material.html";a.click();URL.revokeObjectURL(a.href);
 }
 function logout(){localStorage.removeItem("eduforge_session");setAccount(null);setAuth("login");setMaterial(null);setSource(null)}

 if(!account)return <AuthScreen mode={auth} setMode={setAuth} onLogin={setAccount} error={authError} setError={setAuthError}/>;

 const title=tab==="Dashboard"?"Overview":tab;
 return <main className="app">
  <aside>
   <div className="brand"><div className="mark">E</div><div><b>EduForge AI</b><small>Learning workspace</small></div></div>
   <nav>{nav.map(([n,I])=><button className={tab===n?"sel":""} onClick={()=>setTab(n)} key={n}><I size={17}/>{n}</button>)}</nav>
   <div className="asideBottom">
    {(account.role==="admin"||account.role==="super_admin")&&<button onClick={()=>setTab("Administration")}><Shield size={17}/>Administration</button>}
    <button onClick={()=>setTab("Settings")}><Settings size={17}/>Settings</button>
    <div className="user"><strong>{account.name.slice(0,2).toUpperCase()}</strong><span>{account.name}<small>{roleLabel(account.role)}</small></span><button className="iconBtn" onClick={logout} title="Logout"><LogOut size={15}/></button></div>
   </div>
  </aside>
  <section className="main">
   <header><div><label>WORKSPACE / {title.toUpperCase()}</label><h1>{title}</h1></div><div className="actions"><div className="sourcePill">{source?"● Source ready":"○ No source"}</div><button className="dark" onClick={()=>chooseFile()}><Upload size={16}/>Upload</button></div></header>
   <input ref={uploadInputRef} id="globalUpload" hidden type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.webp" onChange={e=>{const f=e.target.files?.[0]||null;if(f)upload(f,tab);e.currentTarget.value=""}}/>
   {tab==="Dashboard"&&<Dashboard source={source} file={file} busy={busy} msg={msg} count={count} setCount={setCount} language={language} setLanguage={setLanguage} difficulty={difficulty} setDifficulty={setDifficulty} length={length} setLength={setLength} chooseFile={chooseFile} upload={upload} generate={generate}/>}
   {tab==="Documents"&&<Documents source={source} chooseFile={chooseFile} busy={busy} msg={msg} file={file} upload={upload}/>}
   {tab==="Study Materials"&&<Study material={material} exportMaterial={exportMaterial} chooseFile={chooseFile} generate={generate}/>}
   {tab==="Questions"&&<Questions material={material} chooseFile={chooseFile} generate={generate}/>}
   {tab==="MCQs"&&<MCQs mcqs={mcqs} startQuiz={startQuiz} chooseFile={chooseFile}/>}
   {tab==="Quizzes"&&<Quiz mcqs={mcqs} quizIndex={quizIndex} score={score} answered={answered} quizDone={quizDone} answer={answer} next={next} startQuiz={startQuiz} chooseFile={chooseFile}/>}
   {tab==="AI Tutor"&&<Tutor source={source} chooseFile={chooseFile} upload={upload}/>}
   {tab==="Analytics"&&<Analytics source={source} material={material} mcqs={mcqs} quizDone={quizDone} score={score}/>}
   {tab==="Administration"&&(account.role==="admin"||account.role==="super_admin")&&<Administration role={account.role}/>}
   {tab==="Settings"&&<section className="contentCard"><label>ACCOUNT & PLATFORM</label><h2>{account.name}</h2><p>Role: <b>{roleLabel(account.role)}</b> · {account.email||account.mobile}</p><div className="settingsGrid"><div><Shield/>Role based access</div><div><Upload/>Multi-format uploads</div><div><Brain/>AI generation</div><div><Users/>Workspace users</div></div></section>}
   {msg&&<div className="toast">{msg}</div>}
  </section>
 </main>
}

function UploadCard({title,desc,chooseFile,busy,file,upload,msg}:{title:string,desc:string,chooseFile:()=>void,busy:boolean,file:File|null,upload:()=>void,msg:string}){return <section className="upload" onClick={chooseFile}><div className="uploadMark"><Upload/></div><h3>{file?file.name:title}</h3><p>{file?"File selected — click Process to extract":" "+desc}</p>{file&&<button className="dark" disabled={busy} onClick={e=>{e.stopPropagation();upload()}}>{busy?<><RefreshCw className="spin"/>Processing...</>:"Process source"}</button>}<small>{msg}</small></section>}

function Dashboard({source,file,busy,msg,count,setCount,language,setLanguage,difficulty,setDifficulty,length,setLength,chooseFile,upload,generate}:any){return <><section className="welcome"><div><label><Sparkles size={13}/> AI STUDY PLATFORM</label><h2>From your files to<br/><i>exam-ready learning.</i></h2><p>Upload PDF, PPT, DOCX, Excel, CSV, text or image and turn it into notes, Q&A, MCQs, flashcards and quizzes.</p><button className="dark big" onClick={chooseFile}>Choose source <ChevronRight size={16}/></button></div><div className="pipeline"><span>LIVE PIPELINE</span><b>1 · Upload</b><b>2 · Extract</b><b>3 · Generate</b><b>4 · Practice</b></div></section><UploadCard title="Choose a source file" desc="PDF · DOCX · PPTX · XLSX · CSV · TXT · MD · images" chooseFile={chooseFile} busy={busy} file={file} upload={upload} msg={msg}/>{source&&<section className="preview"><label>ACTIVE SOURCE</label><h3>{source.name}</h3><p>{source.chunks} chunks · {(source.text.length||0).toLocaleString()} characters</p><div className="generatorControls"><div><span>Items</span><select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={5}>5 items</option><option value={10}>10 items</option><option value={20}>20 items</option><option value={50}>50</option></select></div><div><span>Language</span><select value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Gujarati</option><option>Hindi</option></select></div><div><span>Difficulty</span><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></div><div><span>Length</span><select value={length} onChange={e=>setLength(e.target.value)}><option>Short</option><option>Detailed</option><option>Deep</option></select></div></div><div className="generator"><button className="dark" onClick={()=>generate("notes")}>Notes</button><button className="dark" onClick={()=>generate("qa")}>Q&A</button><button className="dark" onClick={()=>generate("mcq")}>MCQs</button><button className="dark" onClick={()=>generate("flashcards")}>Flashcards</button></div></section>}</>}

function Documents({source,chooseFile,busy,msg,file,upload}:any){return <><UploadCard title="Upload another document" desc="Every document is processed into a reusable source" chooseFile={chooseFile} busy={busy} file={file} upload={upload} msg={msg}/><section className="workspace">{source?<><FileText size={36}/><h2>{source.name}</h2><p>{source.chunks} chunks · {source.text.length.toLocaleString()} characters</p><pre>{source.text.slice(0,14000)}</pre></>:<Empty text="No document uploaded yet. Use the upload box above."/ >}</section></>}

function Study({material,exportMaterial,chooseFile}:any){return <section className="contentCard"><div className="row"><div><label>STUDY MATERIALS</label><h2>{material?.data?.title||"Create study material"}</h2></div>{material&&<button className="dark" onClick={exportMaterial}><Download size={15}/>Export</button>}</div>{material?.kind==="notes"?<>{(material.data.summary||[]).map((x:string,i:number)=><p key={i}>{x}</p>)}{(material.data.sections||[]).map((s:any,i:number)=><article className="section" key={i}><h3>{s.heading}</h3><p>{s.content}</p><small>Source: {s.source}</small></article>)}</>:material?.kind==="flashcards"?<div className="gridList">{(material.data||[]).map((x:any,i:number)=><article className="mini" key={i}><b>{x.front}</b><p>{x.back}</p></article>)}</div>:<><Empty text="Upload a source and generate Notes or Flashcards."/><button className="dark" onClick={chooseFile}><Upload size={15}/>Upload source</button></>}</section>}

function Questions({material,chooseFile}:any){const qs=material?.kind==="qa"&&Array.isArray(material.data)?material.data:[];return <section className="contentCard"><div className="row"><div><label>QUESTIONS & ANSWERS</label><h2>{qs.length?qs.length+" questions":"No questions yet"}</h2></div><button className="dark" onClick={chooseFile}><Upload size={15}/>Upload source</button></div>{qs.map((q:any,i:number)=><article className="question" key={i}><h3>{i+1}. {q.question}</h3><p>{q.answer}</p><small>{q.marks} marks</small></article>)}{!qs.length&&<><Empty text="Upload source, then generate Q&A from Dashboard."/></>}</section>}

function MCQs({mcqs,startQuiz,chooseFile}:any){return <section className="contentCard"><div className="row"><div><label>MCQ BANK</label><h2>{mcqs.length} questions</h2></div><div className="actions"><button className="dark" onClick={chooseFile}><Upload size={15}/>Upload</button>{mcqs.length>0&&<button className="dark" onClick={startQuiz}>Start Quiz <ChevronRight size={15}/></button>}</div></div>{mcqs.map((q:any,i:number)=><article className="question" key={i}><b>{i+1}. {q.question}</b>{q.options?.map((o:string,j:number)=><div className="option" key={j}><span>{String.fromCharCode(65+j)}</span>{o}</div>)}<small>{q.explanation}</small></article>)}{!mcqs.length&&<Empty text="Upload a source, then generate MCQs from Dashboard."/>}</section>}

function Quiz({mcqs,quizIndex,score,answered,quizDone,answer,next,startQuiz,chooseFile}:any){return <section className="contentCard"><label>QUIZ MODE</label>{!mcqs.length?<><Empty text="No MCQs available. Upload a source and generate MCQs first."/><button className="dark" onClick={chooseFile}><Upload size={15}/>Upload source</button></>:quizDone?<div className="quizResult"><h2>Quiz complete</h2><p>Your score: <b>{score} / {mcqs.length}</b></p><button className="dark" onClick={startQuiz}>Retry</button></div>:<><div className="progress">Question {quizIndex+1} / {mcqs.length}</div><h2>{mcqs[quizIndex].question}</h2>{mcqs[quizIndex].options.map((o:string,i:number)=><button className={"quizOption "+(answered!==null&&i===Number(mcqs[quizIndex].answer)?"correct":"")} onClick={()=>answer(i)} key={i}>{String.fromCharCode(65+i)}. {o}</button>)}{answered!==null&&<><p className="explain">{mcqs[quizIndex].explanation}</p><button className="dark" onClick={next}>{quizIndex+1===mcqs.length?"Finish":"Next"}</button></>}</>}</section>}

function Tutor({source,chooseFile}:any){const[q,setQ]=useState(""),[a,setA]=useState(""),[busy,setBusy]=useState(false);async function ask(){if(!source||!q.trim())return;setBusy(true);setA("");try{const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:source.text+"\n\nStudent question: "+q,kind:"qa",count:1})});const d=await r.json();if(!r.ok)throw new Error(d.error);setA(d.data?.[0]?.answer||d.data?.sections?.[0]?.content||"No answer returned.")}catch(e){setA(e instanceof Error?e.message:"Tutor failed")}finally{setBusy(false)}}return <section className="contentCard"><div className="tutorHead"><div><label>AI TUTOR</label><h2>Ask your uploaded source</h2></div><button className="dark" onClick={chooseFile}><Upload size={15}/>Upload source</button></div>{source?<p className="sourceHint">Using: <b>{source.name}</b></p>:<Empty text="Upload a PDF, PPT, DOCX, Excel, CSV, text or image first."/ >}<textarea value={q} onChange={e=>setQ(e.target.value)} placeholder={source?"Example: Explain Unit 2 in easy language...":"Upload a source to enable AI Tutor."}/><button className="dark" disabled={!source||!q.trim()||busy} onClick={ask}>{busy?<><RefreshCw className="spin"/>Thinking...</>:"Ask AI"}</button>{a&&<article className="answer"><label>AI ANSWER</label><p>{a}</p></article>}</section>}

function Analytics({source,material,mcqs,quizDone,score}:any){return <section className="contentCard"><label>WORKSPACE ANALYTICS</label><h2>Learning overview</h2><div className="stats"><div><b>{source?1:0}</b><span>Sources</span></div><div><b>{material?1:0}</b><span>Generated packs</span></div><div><b>{mcqs.length}</b><span>MCQs</span></div><div><b>{quizDone?score+"/"+mcqs.length:"—"}</b><span>Last quiz</span></div></div></section>}

function Administration({role}:{role:Role}){return <section className="contentCard"><label>ADMINISTRATION</label><h2>{role==="super_admin"?"Super Admin Control Center":"Admin Workspace"}</h2><div className="adminCards"><div><Crown/><b>Role</b><span>{roleLabel(role)}</span></div><div><Users/><b>Users</b><span>Manage student access</span></div><div><FileText/><b>Content</b><span>Documents and materials</span></div><div><BarChart3/><b>Reports</b><span>Usage and learning analytics</span></div></div><p className="adminNote">User-management screens are role-gated here. Production multi-user persistence should be connected to PostgreSQL/Neon before deployment.</p></section>}

function Empty({text}:{text:string}){return <div className="emptyBox"><Sparkles/><p>{text}</p></div>}

function AuthScreen({mode,setMode,onLogin,error,setError}:{mode:"login"|"register",setMode:(x:"login"|"register")=>void,onLogin:(a:Account)=>void,error:string,setError:(x:string)=>void}){
 const[name,setName]=useState(""),[email,setEmail]=useState(""),[mobile,setMobile]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
 function seed(){return JSON.parse(localStorage.getItem("eduforge_accounts")||"[]") as Account[]}
 function submit(e:any){e.preventDefault();setError("");const accounts=seed();if(mode==="register"){if(!name.trim()||(!email.trim()&&!mobile.trim())||password.length<6)return setError("Name, email/mobile and minimum 6 character password required.");if(password!==confirm)return setError("Passwords do not match.");if(accounts.some(a=>a.email===email||a.mobile===mobile))return setError("Account already exists.");const a:Account={id:crypto.randomUUID(),name,email,mobile,password,role:"student"};localStorage.setItem("eduforge_accounts",JSON.stringify([...accounts,a]));localStorage.setItem("eduforge_session",JSON.stringify(a));onLogin(a);return}const a=accounts.find(x=>(email&&x.email===email||mobile&&x.mobile===mobile)&&x.password===password)||demo(email||mobile,password);if(!a)return setError("Invalid ID/mobile or password.");localStorage.setItem("eduforge_session",JSON.stringify(a));onLogin(a)}
 function demo(id:string,pw:string):Account|null{if(id==="student@eduforge.ai"&&pw==="Student@123")return{id:"demo-s",name:"Demo Student",email:id,mobile:"",password:pw,role:"student"};if(id==="admin@eduforge.ai"&&pw==="Admin@123")return{id:"demo-a",name:"Demo Admin",email:id,mobile:"",password:pw,role:"admin"};if(id==="superadmin@eduforge.ai"&&pw==="Super@123")return{id:"demo-sa",name:"Super Admin",email:id,mobile:"",password:pw,role:"super_admin"};return null}
 return <main className="authPage"><div className="authGlow"/><div className="authGridGlow"/><section className="authBrand"><div className="authVisual" aria-hidden="true"><div className="visualOrb orbOne"/><div className="visualOrb orbTwo"/><div className="visualPanel"><div className="visualTop"><span>EDUFORGE AI</span><i/></div><div className="visualTitle">Turn knowledge<br/><em>into momentum.</em></div><div className="visualLines"><span/><span/><span/></div><div className="visualCards"><div><b>NOTES</b><small>Ready</small></div><div><b>MCQ</b><small>10 generated</small></div><div><b>QUIZ</b><small>Practice</small></div></div><div className="visualSpark">✦</div></div></div><section className="authBrand"><div className="mark">E</div><p>EduForge AI</p><span>Turn your study files into an intelligent learning workspace.</span><div className="authFeatures"><b>01</b><span>Source-grounded AI material</span><b>02</b><span>Student · Admin · Super Admin</span><b>03</b><span>Notes · Q&A · MCQs · Quiz · Tutor</span></div></section><section className="authCard"><div className="authTabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Login</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div><div className="authTitle"><label>{mode==="login"?"WELCOME BACK":"GET STARTED"}</label><h1>{mode==="login"?"Continue learning.":"Build your study workspace."}</h1><p>{mode==="login"?"Login with your email/mobile and password.":"Student accounts are created here. Admin roles are controlled separately."}</p></div><form onSubmit={submit}>{mode==="register"&&<div className="field"><UserPlus size={16}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"/></div>}<div className="field"><Mail size={16}/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email ID"/></div><div className="field"><Smartphone size={16}/><input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="Mobile number"/></div><div className="field"><Lock size={16}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></div>{mode==="register"&&<div className="field"><Lock size={16}/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password"/></div>}<button className="authSubmit" type="submit">{mode==="login"?"Login":"Create Student Account"} <ChevronRight size={16}/></button></form>{error&&<div className="authError">{error}</div>}<div className="or"><span>OR</span></div><div className="socials"><button onClick={()=>setError("Google sign-in UI is ready; add Google OAuth credentials to enable live OAuth.")}>G Google</button><button onClick={()=>setError("Facebook sign-in UI is ready; add Facebook OAuth credentials to enable live OAuth.")}>f Facebook</button></div>{mode==="login"&&<div className="demoCred"><b>Test roles</b><span>Student: student@eduforge.ai / Student@123</span><span>Admin: admin@eduforge.ai / Admin@123</span><span>Super Admin: superadmin@eduforge.ai / Super@123</span></div>}</section></main>
}

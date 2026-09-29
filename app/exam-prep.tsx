"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Check, Code2, Flame, Gauge, Gift, Moon, Play, Sparkles, Trophy, Users, Zap } from "lucide-react";

type Mode = "panic" | "topper" | "passing";
const units = [
  { n:"Unit 1", topic:"Introduction & Fundamentals", p:62, qs:18, hot:false },
  { n:"Unit 2", topic:"Core Concepts", p:85, qs:31, hot:true },
  { n:"Unit 3", topic:"Advanced Concepts", p:78, qs:27, hot:true },
  { n:"Unit 4", topic:"Applications & Examples", p:54, qs:16, hot:false },
  { n:"Unit 5", topic:"Practical / Case Study", p:71, qs:22, hot:true }
];
const pyqs = [
  {q:"Explain the core concept with a suitable example.",years:"2023 · 2024 · 2025",marks:5,hot:true},
  {q:"Define the main terms and explain their differences.",years:"2022 · 2024 · 2025",marks:5,hot:true},
  {q:"Draw and explain the complete process / architecture.",years:"2021 · 2023 · 2025",marks:10,hot:true},
  {q:"Write short notes on important applications.",years:"2022 · 2023",marks:5,hot:false}
];
const viva = [
  ["What is the main purpose of this concept?","Start with the one-line definition, then explain its practical use."],
  ["What is the difference between two related concepts?","Give the definition of both, then compare them point-by-point."],
  ["Where is this used in real projects?","Connect the theory to one practical software or business example."],
  ["What are its advantages and limitations?","Mention 2–3 advantages followed by 1–2 realistic limitations."],
  ["Explain the process step-by-step.","Use a small flow: input → processing → output."]
];

export default function ExamPrep(){
 const [mode,setMode]=useState<Mode>("panic"),[night,setNight]=useState(false),[tab,setTab]=useState<"overview"|"pyq"|"viva"|"request">("overview"),[code,setCode]=useState('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello EduForge");\n  }\n}'),[ran,setRan]=useState(false),[requested,setRequested]=useState(false);
 const modeText=useMemo(()=>mode==="topper"?{title:"Topper Mode",sub:"Full syllabus · deeper theory · references · diagrams",badge:"DEEP LEARNING"}:mode==="passing"?{title:"Passing Mode",sub:"High-weightage units · direct definitions · scoring questions",badge:"EXAM FIRST"}:{title:"Exam Night Panic Mode",sub:"Only the essentials you can revise tonight",badge:"LAST MINUTE"},[mode]);
 return <main className={night?"content examNight":"content"}>
  <div className="examHero"><div><label>EXAM INTELLIGENCE</label><h1>{modeText.title}</h1><p>{modeText.sub}</p></div><div className="examHeroActions"><button className={night?"nightToggle on":"nightToggle"} onClick={()=>setNight(!night)}><Moon size={15}/>{night?"Night mode on":"Exam Night"}</button><span className="examBadge"><Sparkles size={12}/>{modeText.badge}</span></div></div>
  <section className="modeSwitch">
   <button className={mode==="topper"?"active":""} onClick={()=>setMode("topper")}><Trophy size={16}/><b>Topper Mode</b><small>Learn everything</small></button>
   <button className={mode==="passing"?"active":""} onClick={()=>setMode("passing")}><Zap size={16}/><b>Passing Mode</b><small>Focus on scoring</small></button>
   <button className={mode==="panic"?"active":""} onClick={()=>setMode("panic")}><Flame size={16}/><b>Panic Mode</b><small>Revise tonight</small></button>
  </section>
  {mode==="panic"?<section className="panicGrid"><article className="panicMain"><div className="cardKicker"><AlertTriangle size={14}/> TONIGHT'S REVISION</div><h2>Don't read 60 pages.<br/><em>Read what matters.</em></h2><div className="panicStats"><span><b>10</b><small>Top questions</small></span><span><b>2</b><small>Page cheat-sheet</small></span><span><b>5</b><small>Unit pointers</small></span></div><button className="blueBtn"><Play size={14}/> Start 30-minute revision</button></article><article className="cheatCard"><div className="cardKicker"><BookOpen size={14}/> CHEAT-SHEET</div><h3>Core syntax & formulas</h3><p><b>for</b> (int i=0; i&lt;n; i++) · O(n)</p><p><b>SELECT</b> columns <b>FROM</b> table <b>WHERE</b> condition</p><p><b>Definition → Example → Advantage → Limitation</b></p><button className="ghostBtn">Open 2-page sheet <Zap size={13}/></button></article></section>:<section className="modeInsight"><div><span>{mode==="topper"?"FULL COVERAGE":"HIGH-WEIGHTAGE FOCUS"}</span><h2>{mode==="topper"?"Build understanding, not just answers.":"Focus your limited time where the syllabus signals are strongest."}</h2><p>{mode==="topper"?"Detailed notes, references, diagrams, examples, practice and deeper explanations stay visible.":"The system prioritises the top 3 high-frequency units and scoring questions; lower-signal topics are collapsed, not deleted."}</p></div><div className="focusRing"><b>{mode==="topper"?"100":"78"}%</b><small>{mode==="topper"?"syllabus":"priority coverage"}</small></div></section>}
  <div className="examTabs">{([["overview","Probability Heatmap"],["pyq","PYQ Intelligence"],["viva","Viva + Lab"],["request","Request Notes"]] as const).map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
  {tab==="overview"&&<section className="heatmapCard"><div className="sectionHead"><div><label>PYQ PROBABILITY HEATMAP</label><h3>What the past papers keep testing</h3></div><span>Based on mapped PYQs</span></div><div className="unitRows">{units.filter(u=>mode!=="passing"||u.p>=70).map(u=><div className="unitRow" key={u.n}><div className="unitTitle"><b>{u.n}</b><span>{u.topic}</span></div><div className="probBar"><i style={{width:u.p+"%"}}/></div><strong>{u.p}%</strong>{u.hot&&<span className="hotBadge"><Flame size={11}/> High Frequency</span>}<small>{u.qs} mapped questions</small></div>)}</div><p className="methodNote"><Gauge size={13}/> Probability is a study-priority signal derived from mapped PYQs — not a guarantee that a question will appear.</p></section>}
  {tab==="pyq"&&<section className="pyqList">{pyqs.map((x,i)=><article className="pyqItem" key={i}><div className="pyqNum">{String(i+1).padStart(2,"0")}</div><div><h3>{x.q}</h3><span>{x.years} · {x.marks} marks</span></div>{x.hot&&<b className="frequency"><Flame size={12}/> HIGH FREQUENCY</b>}<button className="iconBtn"><Play size={14}/></button></article>)}</section>}
  {tab==="viva"&&<section className="vivaLayout"><div className="vivaCard"><div className="cardKicker"><Users size={14}/> TOP 30 VIVA QUESTIONS</div><h2>Walk into the practical exam prepared.</h2><p>Quick oral questions, concise answers and follow-up prompts generated from the subject material.</p>{viva.slice(0,3).map((x,i)=><details key={i}><summary><span>{String(i+1).padStart(2,"0")}</span>{x[0]}</summary><p>{x[1]}</p></details>)}</div><div className="codeCard"><div className="codeHead"><span><Code2 size={14}/> LIVE CODE PREVIEW</span><button onClick={()=>setRan(true)}><Play size={12}/> Run</button></div><textarea value={code} onChange={e=>{setCode(e.target.value);setRan(false)}}/><div className="codeOutput">{ran?<><Check size={13}/> Hello EduForge</>:<span>Output will appear here</span>}</div><button className="copyCode" onClick={()=>navigator.clipboard?.writeText(code)}>Copy code</button></div></section>}
  {tab==="request"&&<section className="requestCard"><div><Gift size={22}/><h2>Can't find your subject material?</h2><p>Request a subject. Classmates or seniors can contribute it, and verified uploads earn contributor points.</p></div><div className="requestForm"><input placeholder="Subject / topic name"/><input placeholder="University / semester (optional)"/><button className="blueBtn" onClick={()=>setRequested(true)}>{requested?<><Check size={14}/> Request submitted</>:<>Request notes <span>→</span></>}</button></div></section>}
  <section className="contributorStrip"><div><Users size={18}/><span><b>Community Bounty</b><small>Verified contributors earn points, badges and a visible contribution history.</small></span></div><div className="contributorBadges"><b>+50 pts</b><span>Top Contributor</span><span>Verified Upload</span></div></section>
 </main>
}
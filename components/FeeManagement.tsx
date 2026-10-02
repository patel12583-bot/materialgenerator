"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Download, Plus, Receipt, Search, WalletCards, X } from "lucide-react";

const money=(n:number)=>`₹${Number(n||0).toLocaleString("en-IN")}`;
const date=(v:string)=>v?new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

export default function FeeManagement({role}:{role:string}){
  const admin=role==="Admin"||role==="Super Admin";
  const [state,setState]=useState<any>({structures:[],fees:[],programs:[],semesters:[],students:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [q,setQ]=useState("");
  const [status,setStatus]=useState("");
  const [tab,setTab]=useState(admin?"Ledger":"My Fees");
  const [form,setForm]=useState<any>({name:"Semester Fee",academicYear:"2026-27",programId:"",semesterId:"",dueDate:"",tuitionFee:0,examFee:0,libraryFee:0,labFee:0,otherFee:0});
  const [assign,setAssign]=useState<any>({feeStructureId:"",studentId:"",discountAmount:0,scholarshipAmount:0});
  const [payment,setPayment]=useState<any>({studentFeeId:"",amount:"",method:"CASH",reference:"",note:""});
  const [busy,setBusy]=useState(false);

  async function load(){
    setLoading(true);setError("");
    try{
      const url=admin?`/api/admin/fees?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`:"/api/admin/fees";
      const r=await fetch(url,{cache:"no-store"}); const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Unable to load fees.");
      setState(d);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load fees.");}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[admin,status]);
  const filteredStudents=useMemo(()=>state.students||[],[state.students]);
  const selectedProgram=state.programs?.find((x:any)=>x.id===form.programId);
  const semesters=(selectedProgram?.semesters||state.semesters||[]).filter((s:any)=>!form.programId||s.programId===form.programId);
  const totals=(state.fees||[]).reduce((a:any,x:any)=>{a.total+=x.totalAmount-x.discountAmount-x.scholarshipAmount;a.paid+=x.paidAmount;a.balance+=x.balanceAmount;return a},{total:0,paid:0,balance:0});
  const post=async(action:string,body:any)=>{
    setBusy(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/admin/fees",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,...body})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Fee operation failed.");
      setMessage(action==="payment"?`Payment recorded. Receipt ${d.payment.receiptNo}`:"Saved successfully.");
      return d;
    }catch(e){setError(e instanceof Error?e.message:"Fee operation failed.");return null}
    finally{setBusy(false)}
  };

  async function createStructure(){
    if(!form.programId||!form.semesterId||!form.dueDate)return setError("Select program, semester and due date.");
    const d=await post("create-structure",form); if(d){setForm({...form,name:"Semester Fee",programId:"",semesterId:"",tuitionFee:0,examFee:0,libraryFee:0,labFee:0,otherFee:0});await load();}
  }
  async function assignFee(){
    if(!assign.feeStructureId||!assign.studentId)return setError("Select a fee structure and student.");
    const d=await post("assign",assign); if(d){setAssign({feeStructureId:"",studentId:"",discountAmount:0,scholarshipAmount:0});await load();}
  }
  async function recordPayment(){
    const d=await post("payment",payment); if(d){setPayment({studentFeeId:"",amount:"",method:"CASH",reference:"",note:""});await load();}
  }
  function printReceipt(p:any,fee:any){
    const w=window.open("","_blank","width=760,height=760"); if(!w)return;
    w.document.write(`<!doctype html><html><head><title>${p.receiptNo}</title><style>body{font-family:Arial;padding:40px;color:#172033}h1{margin:0 0 6px}.meta{color:#667085;margin-bottom:30px}.box{border:1px solid #ddd;padding:20px;border-radius:12px}.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eee}.total{font-size:20px;font-weight:700}</style></head><body><h1>Noble Digital Campus</h1><div class="meta">Official Fee Receipt · ${p.receiptNo}</div><div class="box"><div class="row"><b>Student</b><span>${fee.student.name}</span></div><div class="row"><b>Enrollment</b><span>${fee.student.enrollmentNo}</span></div><div class="row"><b>Fee</b><span>${fee.feeStructure.name}</span></div><div class="row"><b>Payment date</b><span>${date(p.paidAt)}</span></div><div class="row"><b>Method</b><span>${p.method}</span></div><div class="row total"><b>Amount paid</b><span>${money(p.amount)}</span></div></div><script>window.print()</script></body></html>`);
    w.document.close();
  }

  if(loading)return <div className="adminWorkspace"><div className="card emptyState"><WalletCards size={22}/><h2>Loading fee centre…</h2></div></div>;
  if(!admin)return <div className="adminWorkspace">
    <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · ACCOUNTS</span><h1>Fees <em>& payments.</em></h1><p>View your assigned fees, payments, receipts and outstanding balance.</p></div></div>
    {error&&<div className="loginError adminMessage">{error}</div>}
    <div className="portalStats" style={{marginBottom:14}}><div className="metric"><span>Total</span><b>{money(totals.total)}</b><small>Assigned fees</small></div><div className="metric"><span>Paid</span><b>{money(totals.paid)}</b><small>Received</small></div><div className="metric"><span>Outstanding</span><b>{money(totals.balance)}</b><small>Balance due</small></div></div>
    <div className="card studentAdminTable"><div className="studentAdminHead"><span>FEE</span><span>ACADEMIC</span><span>DUE DATE</span><span>PAID</span><span>BALANCE</span><span>STATUS</span></div>
      {(state.fees||[]).map((f:any)=><div className="studentAdminRow" key={f.id}><div><b>{f.feeStructure.name}</b><small>{f.student.name} · {f.student.enrollmentNo}</small></div><span>{f.feeStructure.program.code} · Sem {f.feeStructure.semester.number}</span><span>{date(f.dueDate)}</span><span>{money(f.paidAmount)}</span><span><b>{money(f.balanceAmount)}</b></span><span className={f.status==="PAID"?"accountReady":f.status==="OVERDUE"?"accountPending":""}>{f.status}</span></div>)}
      {!state.fees?.length&&<div className="emptyState">No fee records have been assigned yet.</div>}
    </div>
    {(state.fees||[]).map((f:any)=>f.payments?.length?<div className="card studentAdminTable" style={{marginTop:14}} key={"p"+f.id}><div className="cardHead"><div><span className="eyebrow">RECEIPTS</span><h2>{f.feeStructure.name}</h2></div></div>{f.payments.map((p:any)=><div className="studentAdminRow" key={p.id}><span>{p.receiptNo}</span><span>{date(p.paidAt)}</span><span>{p.method}</span><b>{money(p.amount)}</b><span>{p.reference||"—"}</span></div>)}</div>:null)}
  </div>;

  return <div className="adminWorkspace">
    <div className="pageHead"><div><span className="eyebrow">{role.toUpperCase()} · ACCOUNTS</span><h1>Fees & <em>accounts.</em></h1><p>Fee structures, student assignments, collections and audit-ready receipts.</p></div><button className="secondaryBtn" onClick={()=>window.print()}><Download size={14}/> Print report</button></div>
    {error&&<div className="loginError adminMessage">{error}</div>}{message&&<div className="toast">{message}</div>}
    <div className="portalStats" style={{marginBottom:14}}><div className="metric"><span>Assigned</span><b>{(state.fees||[]).length}</b><small>Fee records</small></div><div className="metric"><span>Collected</span><b>{money(totals.paid)}</b><small>Payments received</small></div><div className="metric"><span>Outstanding</span><b>{money(totals.balance)}</b><small>Current balance</small></div></div>
    <div className="card" style={{marginBottom:14}}><div className="cardHead"><div>{["Ledger","Structures","Assign Fee","Record Payment"].map(x=><button key={x} className={tab===x?"primary":"secondaryBtn"} style={{marginRight:8}} onClick={()=>setTab(x)}>{x}</button>)}</div><div style={{display:"flex",gap:8}}><input placeholder="Search student…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All status</option><option>PENDING</option><option>PARTIAL</option><option>PAID</option><option>OVERDUE</option></select><button className="iconBtn" onClick={load}><Search size={16}/></button></div></div></div>

    {tab==="Structures"&&<div className="card"><div className="cardHead"><div><span className="eyebrow">FEE CATALOGUE</span><h2>Create fee structure</h2></div><CreditCard size={19}/></div><div className="formTwo">
      <div className="adminForm"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
      <div className="adminForm"><label>Academic year</label><input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/></div>
      <div className="adminForm"><label>Program</label><select value={form.programId} onChange={e=>setForm({...form,programId:e.target.value,semesterId:""})}><option value="">Select program</option>{(state.programs||[]).map((p:any)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></div>
      <div className="adminForm"><label>Semester</label><select value={form.semesterId} onChange={e=>setForm({...form,semesterId:e.target.value})}><option value="">Select semester</option>{semesters.map((s:any)=><option key={s.id} value={s.id}>Semester {s.number}</option>)}</select></div>
      <div className="adminForm"><label>Due date</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
      {["tuitionFee","examFee","libraryFee","labFee","otherFee"].map(k=><div className="adminForm" key={k}><label>{k.replace("Fee"," Fee").replace(/^./,x=>x.toUpperCase())} (₹)</label><input type="number" min="0" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}
    </div><button className="primary" disabled={busy} onClick={createStructure}><Plus size={14}/> Create fee structure</button>
    <div className="card studentAdminTable" style={{marginTop:16}}><div className="studentAdminHead"><span>NAME</span><span>PROGRAM</span><span>SEM</span><span>ACADEMIC YEAR</span><span>TOTAL</span><span>DUE</span></div>{(state.structures||[]).map((s:any)=><div className="studentAdminRow" key={s.id}><b>{s.name}</b><span>{s.program.code}</span><span>{s.semester.number}</span><span>{s.academicYear}</span><b>{money(s.tuitionFee+s.examFee+s.libraryFee+s.labFee+s.otherFee)}</b><span>{date(s.dueDate)}</span></div>)}</div></div>}

    {tab==="Assign Fee"&&<div className="card"><div className="cardHead"><div><span className="eyebrow">STUDENT BILLING</span><h2>Assign fee to student</h2></div></div><div className="formTwo">
      <div className="adminForm"><label>Fee structure</label><select value={assign.feeStructureId} onChange={e=>setAssign({...assign,feeStructureId:e.target.value})}><option value="">Select fee structure</option>{(state.structures||[]).filter((s:any)=>s.active).map((s:any)=><option key={s.id} value={s.id}>{s.program.code} · Sem {s.semester.number} · {s.name} · {s.academicYear}</option>)}</select></div>
      <div className="adminForm"><label>Student</label><select value={assign.studentId} onChange={e=>setAssign({...assign,studentId:e.target.value})}><option value="">Select student</option>{filteredStudents.map((s:any)=><option key={s.id} value={s.id}>{s.rollNo} · {s.name} · {s.enrollmentNo}</option>)}</select></div>
      <div className="adminForm"><label>Discount (₹)</label><input type="number" min="0" value={assign.discountAmount} onChange={e=>setAssign({...assign,discountAmount:e.target.value})}/></div>
      <div className="adminForm"><label>Scholarship (₹)</label><input type="number" min="0" value={assign.scholarshipAmount} onChange={e=>setAssign({...assign,scholarshipAmount:e.target.value})}/></div>
    </div><button className="primary" disabled={busy} onClick={assignFee}><WalletCards size={14}/> Assign fee</button></div>}

    {tab==="Record Payment"&&<div className="card"><div className="cardHead"><div><span className="eyebrow">COLLECTION</span><h2>Record payment</h2></div><Receipt size={19}/></div><div className="formTwo">
      <div className="adminForm"><label>Student fee</label><select value={payment.studentFeeId} onChange={e=>setPayment({...payment,studentFeeId:e.target.value})}><option value="">Select outstanding fee</option>{(state.fees||[]).filter((f:any)=>f.balanceAmount>0).map((f:any)=><option key={f.id} value={f.id}>{f.student.name} · {f.student.enrollmentNo} · Balance {money(f.balanceAmount)}</option>)}</select></div>
      <div className="adminForm"><label>Amount (₹)</label><input type="number" min="1" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></div>
      <div className="adminForm"><label>Payment method</label><select value={payment.method} onChange={e=>setPayment({...payment,method:e.target.value})}><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>CARD</option><option>CHEQUE</option></select></div>
      <div className="adminForm"><label>Reference / transaction ID</label><input value={payment.reference} onChange={e=>setPayment({...payment,reference:e.target.value})}/></div>
      <div className="adminForm"><label>Note</label><input value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})}/></div>
    </div><button className="primary" disabled={busy} onClick={recordPayment}><Receipt size={14}/> Record & generate receipt</button></div>}

    {tab==="Ledger"&&<div className="card studentAdminTable"><div className="studentAdminHead"><span>STUDENT</span><span>CLASS</span><span>FEE</span><span>TOTAL</span><span>PAID</span><span>BALANCE / STATUS</span></div>
      {(state.fees||[]).map((f:any)=><div className="studentAdminRow" key={f.id}><div><b>{f.student.name}</b><small>{f.student.enrollmentNo} · Roll {f.student.rollNo}</small></div><span>{f.feeStructure.program.code} · Sem {f.feeStructure.semester.number}</span><span>{f.feeStructure.name}</span><span>{money(f.totalAmount-f.discountAmount-f.scholarshipAmount)}</span><span>{money(f.paidAmount)}</span><span className={f.status==="PAID"?"accountReady":f.status==="OVERDUE"?"accountPending":""}>{money(f.balanceAmount)} · {f.status}{f.payments?.[0]&&<button className="textBtn" title="Print latest receipt" onClick={()=>printReceipt(f.payments[0],f)}><Receipt size={14}/></button>}</span></div>)}
      {!state.fees?.length&&<div className="emptyState">No fee assignments match the current filters.</div>}
    </div>}
  </div>;
}

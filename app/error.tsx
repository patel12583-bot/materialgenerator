"use client";

import { useEffect } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Noble Digital Campus application error"); }, []);
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f6f9fc",fontFamily:"Inter,system-ui,sans-serif"}}>
    <section style={{maxWidth:560,width:"100%",background:"#fff",border:"1px solid #e4ebf3",borderRadius:24,padding:36,boxShadow:"0 18px 60px rgba(15,35,65,.08)",textAlign:"center"}}>
      <div style={{width:52,height:52,borderRadius:16,margin:"0 auto 18px",display:"grid",placeItems:"center",background:"#eef5ff",color:"#174ea6"}}><ShieldAlert size={25}/></div>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,color:"#6b7b91"}}>NOBLE DIGITAL CAMPUS</div>
      <h1 style={{fontSize:30,margin:"8px 0 10px",color:"#10233f"}}>Something went wrong.</h1>
      <p style={{margin:"0 auto 24px",maxWidth:430,lineHeight:1.65,color:"#66768c"}}>The workspace hit an unexpected error. Your saved database records are not deleted. Try the page again.</p>
      <button onClick={()=>reset()} style={{border:0,borderRadius:12,padding:"12px 18px",fontWeight:700,cursor:"pointer",background:"#155eef",color:"#fff",display:"inline-flex",alignItems:"center",gap:8}}><RefreshCw size={15}/> Try again</button>
    </section>
  </main>;
}

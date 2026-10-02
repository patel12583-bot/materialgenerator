import Link from "next/link";

export default function NotFound() {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f6f9fc",fontFamily:"Inter,system-ui,sans-serif"}}>
    <section style={{textAlign:"center"}}>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#6b7b91"}}>NOBLE DIGITAL CAMPUS</div>
      <h1 style={{fontSize:64,margin:"8px 0",color:"#10233f"}}>404</h1>
      <p style={{color:"#66768c",marginBottom:22}}>This page does not exist or is no longer available.</p>
      <Link href="/" style={{display:"inline-block",padding:"12px 18px",borderRadius:12,background:"#155eef",color:"#fff",textDecoration:"none",fontWeight:700}}>Back to home</Link>
    </section>
  </main>;
}

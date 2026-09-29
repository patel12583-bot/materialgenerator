"use client";

import { FormEvent, useState } from "react";
import { GraduationCap, Lock, UserRound, ArrowRight, ShieldCheck } from "lucide-react";

const roles = [
  { value: "ADMIN", label: "Admin" },
  { value: "HOD", label: "HOD" },
  { value: "FACULTY", label: "Faculty" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export default function LoginPage() {
  const [role, setRole] = useState("FACULTY");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      window.location.href = data.redirect;
    } catch {
      setError("Server connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginBrand">
        <div className="loginGlow" />
        <div className="loginBrandInner">
          <div className="loginLogo imageLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions logo" /></div>
          <span className="loginEyebrow">NOBLE GROUP OF INSTITUTIONS</span>
          <h1>Attendance,<br /><em>without the chaos.</em></h1>
          <p>One connected platform for faculty, students, parents, HODs and administrators.</p>
          <div className="loginTrust"><ShieldCheck size={16} /> Secure role-based access · Academic Year 2026–27</div>
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginBox">
          <div className="mobileLoginMark imageLogo mobileLogo"><img src="/noble-logo.jpg" alt="Noble logo" /></div>
          <span className="loginEyebrow dark">WELCOME BACK</span>
          <h2>Sign in.</h2>
          <p className="loginMuted">Choose your portal and continue to Noble Attendance.</p>

          <div className="roleGrid">
            {roles.map(r => (
              <button type="button" key={r.value} className={role === r.value ? "roleChoice active" : "roleChoice"} onClick={() => setRole(r.value)}>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            <label>Username / Enrollment</label>
            <div className="loginInput"><UserRound size={17} /><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" /></div>
            <label>Password</label>
            <div className="loginInput"><Lock size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" /></div>
            {error && <div className="loginError">{error}</div>}
            <button className="loginSubmit" disabled={busy}>{busy ? "Signing in…" : "Continue"} <ArrowRight size={17} /></button>
          </form>

          <small className="loginFooter">Noble Group of Institutions · Mota Habipura, Dabhoi, Gujarat</small>
        </div>
      </section>
    </main>
  );
}

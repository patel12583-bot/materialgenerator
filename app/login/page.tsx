"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";

type PortalRole = "ADMIN" | "FACULTY" | "STUDENT";

const roles: { id: PortalRole; title: string; description: string }[] = [
  { id: "ADMIN", title: "Admin", description: "College administration" },
  { id: "FACULTY", title: "Faculty", description: "Attendance & timetable" },
  { id: "STUDENT", title: "Student", description: "Attendance & leave" },
];

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("role")?.toUpperCase();
  const [role, setRole] = useState<PortalRole>(
    initial === "FACULTY" || initial === "STUDENT" || initial === "ADMIN" ? initial : "ADMIN"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.replace(data.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginBrand" aria-label="Noble Attendance">
        <div className="loginGlow" aria-hidden="true" />
        <div className="loginBrandInner">
          <div className="loginLogo imageLogo"><img src="/noble-logo.jpg" alt="Noble Group of Institutions logo" /></div>
          <span className="loginEyebrow">NOBLE GROUP OF INSTITUTIONS</span>
          <h1>Attendance,<br /><em>kept simple.</em></h1>
          <p>One secure workspace for college administration, faculty and students.</p>
          <div className="loginTrust"><ShieldCheck size={16} /> Secure role-based access · Academic Year 2026–27</div>
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginBox">
          <a className="backLink" href="/">← Back to Noble</a>
          <span className="loginEyebrow dark">SECURE ACCESS</span>
          <h2>Sign in.</h2>
          <p className="loginMuted">Choose your workspace, then sign in with your Noble credentials.</p>

          <div className="roleGrid" role="tablist" aria-label="Choose portal">
            {roles.map(({ id, title, description }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={role === id}
                className={`roleChoice roleChoiceButton ${role === id ? "active" : ""}`}
                onClick={() => { setRole(id); setError(""); }}
              >
                {id === "ADMIN" ? <ShieldCheck size={15} /> : id === "FACULTY" ? <UsersRound size={15} /> : <GraduationCap size={15} />}
                <span><b>{title}</b><small>{description}</small></span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            <label htmlFor="username">Username / Enrollment number</label>
            <div className="loginInput">
              <input id="username" required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder={role === "STUDENT" ? "NOBLE-BCA-001" : "Your username"} />
            </div>
            <label htmlFor="password">Password</label>
            <div className="loginInput">
              <input id="password" required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
            </div>
            {error && <div className="loginError" role="alert">{error}</div>}
            <button className="loginSubmit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} />
            </button>
          </form>

          <a className="managedAccountLink loginSignupLink" href="/signup">Student account activation</a>
          <small className="loginFooter">Access is limited by role and institution. Contact Noble Admin if your account is not active.</small>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

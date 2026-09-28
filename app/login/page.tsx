"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_EMAIL, DEMO_PASSWORD, login } from "@/lib/store";
import { Logo } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = login(email, password);
    if (!r.ok) return setError(r.error);
    router.replace("/dashboard");
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Logo dark />
        <div>
          <h1 className="serif">Rehearse the design interview before the real one.</h1>
          <p style={{ color: "var(--room-muted)", maxWidth: 440, marginTop: 14 }}>
            An AI interviewer runs portfolio reviews, case-study deep dives, app critiques and design challenges on camera — then tells you exactly what landed, what didn't, and how to say it better.
          </p>
          <div className="mock-report">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--room-muted)" }}>Case-study presentation · Senior</span>
              <span style={{ fontWeight: 700, color: "#4fd1a8" }}>78</span>
            </div>
            {[
              ["Storytelling & structure", 82],
              ["Impact & outcomes", 58],
              ["Process & rationale", 74],
            ].map(([n, v]) => (
              <div key={n} style={{ marginTop: 12, fontSize: 13 }}>
                {n}
                <div className="bar">
                  <i style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="quote small">“You explained what you built, but not what changed. Lead with the 32% drop in PO errors.”</p>
      </aside>

      <main className="auth-form">
        <form onSubmit={submit} noValidate>
          <div>
            <h2 className="serif" style={{ fontSize: 30 }}>
              Sign in
            </h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              This is a prototype — any email and password (6+ characters) creates an account on this device.
            </p>
          </div>
          <div className="demo-hint">
            <span>
              Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
            >
              Fill in
            </button>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn primary lg" type="submit">
            Continue
          </button>
        </form>
      </main>
    </div>
  );
}

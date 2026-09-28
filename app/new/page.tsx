"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, KindIcon, useUser } from "@/components/ui";
import { KINDS, kindById } from "@/lib/kinds";
import { newId, saveSession } from "@/lib/store";
import type { InterviewKind, Level } from "@/lib/types";
import { COMPETENCIES, LEVEL_INFO, pickQuestions } from "@/lib/questionBank";
import Link from "next/link";

const LEVELS: Level[] = ["Junior", "Mid-level", "Senior", "Lead / Principal"];
const LENGTHS = [
  { n: 3, label: "Quick · 3 questions" },
  { n: 5, label: "Standard · 5 questions" },
  { n: 7, label: "Full · 7 questions" },
];
const PD_LENGTHS = [
  { n: 3, label: "Quick · 3 questions" },
  { n: 6, label: "Standard · 6 questions" },
  { n: 9, label: "Full · 9 questions" },
];

export default function NewInterview() {
  const user = useUser();
  const router = useRouter();
  const [kind, setKind] = useState<InterviewKind>("pd-interview");
  const [level, setLevel] = useState<Level>("Senior");
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");
  const [n, setN] = useState(6);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("kind");
    if (k && KINDS.some((x) => x.id === k)) {
      setKind(k as InterviewKind);
      setN(k === "pd-interview" ? 6 : 5);
    }
  }, []);

  if (!user) return null;
  const def = kindById(kind);
  const isPD = kind === "pd-interview";
  const lengths = isPD ? PD_LENGTHS : LENGTHS;

  function start() {
    const id = newId();
    saveSession({
      id,
      userEmail: user!.email,
      createdAt: Date.now(),
      config: { kind, level, company: company.trim() || undefined, context: context.trim() || undefined, mainQuestions: n, ...(isPD ? { plannedQuestions: pickQuestions(level, n) } : {}) },
      turns: [],
      status: "in-progress",
    });
    router.push(`/interview/${id}`);
  }

  return (
    <>
      <Header user={user} />
      <main className="container page" style={{ maxWidth: 820 }}>
        <h1 className="page-title serif">Set up your interview</h1>
        <p className="muted">The interviewer adapts its questions and follow-ups to the format, your level and the role you're targeting.</p>

        <div className="section-h">
          <h2 style={{ fontSize: 17 }}>1. Format</h2>
        </div>
        <div className="grid-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              className={`kind-card ${kind === k.id ? "selected" : ""}`}
              style={k.id === "pd-interview" ? { gridColumn: "1 / -1" } : undefined}
              onClick={() => {
                setKind(k.id);
                setN(k.id === "pd-interview" ? 6 : 5);
              }}
              aria-pressed={kind === k.id}
            >
              <div className="row">
                <div className="kind-icon">
                  <KindIcon kind={k.id} />
                </div>
                <strong>{k.title}</strong>
                {k.id === "pd-interview" && <span className="pill accent">Recommended</span>}
              </div>
              <span className="muted small">{k.blurb}</span>
            </button>
          ))}
        </div>

        <div className="section-h">
          <h2 style={{ fontSize: 17 }}>2. Role</h2>
        </div>
        <div className="card" style={{ padding: 20, display: "grid", gap: 18 }}>
          <div className="field">
            <label>Seniority</label>
            <div className="seg">
              {LEVELS.map((l) => (
                <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>
                  {l}
                </button>
              ))}
            </div>
            <span className="muted small">
              {LEVEL_INFO[level].years} · {LEVEL_INFO[level].focus}
            </span>
          </div>
          {isPD && (
            <div className="card" style={{ padding: 14, boxShadow: "none", background: "var(--paper)" }}>
              <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
                You&apos;ll be assessed on
              </div>
              <div className="grid-3" style={{ gap: 10 }}>
                {COMPETENCIES.map((c) => (
                  <div key={c.id}>
                    <div className="small" style={{ fontWeight: 600, color: "var(--accent)" }}>
                      {c.label}
                    </div>
                    <div className="muted small">{c.blurb}</div>
                  </div>
                ))}
              </div>
              <div className="small" style={{ marginTop: 10 }}>
                Questions are picked from the {level} question bank.{" "}
                <Link href={`/questions?level=${encodeURIComponent(level)}`} target="_blank">
                  Browse the bank
                </Link>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="company">Target company or role (optional)</label>
            <input id="company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Product Designer at a B2B procurement SaaS" />
          </div>
          <div className="field">
            <label htmlFor="ctx">{def.contextLabel}</label>
            <textarea id="ctx" className="input" value={context} onChange={(e) => setContext(e.target.value)} placeholder={def.contextPlaceholder} />
          </div>
          <div className="field">
            <label>Length</label>
            <div className="seg">
              {lengths.map((l) => (
                <button key={l.n} className={n === l.n ? "on" : ""} onClick={() => setN(l.n)}>
                  {l.label}
                </button>
              ))}
            </div>
            <span className="muted small">After each answer the interviewer may ask up to 2 cross-questions on what you said.</span>
          </div>
        </div>

        <div className="section-h">
          <h2 style={{ fontSize: 17 }}>3. What happens next</h2>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <ul className="list">
            <li><span className="muted">1</span><span>We'll ask for camera and microphone access and run a quick device check.</span></li>
            <li><span className="muted">2</span><span>The interviewer reads each question aloud. Answer by speaking — your words are transcribed live and you can correct them before submitting.</span></li>
            <li><span className="muted">3</span><span>At the end you get a scored report: what went well, what to fix, stronger answers, and on-camera presence feedback.</span></li>
          </ul>
          <p className="muted small" style={{ marginBottom: 0 }}>Your recording stays in this browser. Only the transcript and a few still frames are sent for analysis. Works best in Chrome or Edge.</p>
        </div>

        <div className="row" style={{ marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn lg" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="btn primary lg" onClick={start}>
            Continue to device check
          </button>
        </div>
      </main>
    </>
  );
}

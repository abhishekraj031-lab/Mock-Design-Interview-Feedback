"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header, KindIcon, scoreTone, useUser } from "@/components/ui";
import { getApiKey, getSession, loadFrames, loadVideo, newId, saveSession } from "@/lib/store";
import { kindById } from "@/lib/kinds";
import type { Frame, Report, Session, Turn } from "@/lib/types";
import { bankById, competencyLabel, levelRank, LEVELS_ORDER, pickQuestions, SENIORITY_SIGNALS } from "@/lib/questionBank";

export default function ReportPage() {
  const user = useUser();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const s = getSession(id);
    if (!s) return void router.replace("/dashboard");
    setSession(s);
    let url: string | null = null;
    if (s.hasVideo)
      loadVideo(id).then((b) => {
        if (b) {
          url = URL.createObjectURL(b);
          setVideoUrl(url);
        }
      });
    if (s.status === "grading" && !started.current) {
      started.current = true;
      grade(s);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function grade(s: Session) {
    setGrading(true);
    const pending = { ...s, status: "grading" as const, error: undefined };
    saveSession(pending);
    setSession(pending);
    try {
      const frames = await loadFrames<Frame>(id);
      const key = getApiKey();
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json", ...(key ? { "x-user-api-key": key } : {}) },
        body: JSON.stringify({ config: s.config, turns: s.turns, stats: s.stats, frames }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Grading failed");
      const done: Session = { ...s, status: "done", report: j as Report, error: undefined };
      saveSession(done);
      setSession(done);
    } catch (e) {
      const failed: Session = { ...s, status: "error", error: (e as Error).message };
      saveSession(failed);
      setSession(failed);
    } finally {
      setGrading(false);
    }
  }

  function practiceAgain() {
    if (!session || !user) return;
    const nid = newId();
    const config =
      session.config.kind === "pd-interview" ? { ...session.config, plannedQuestions: pickQuestions(session.config.level, session.config.mainQuestions) } : session.config;
    saveSession({ id: nid, userEmail: user.email, createdAt: Date.now(), config, turns: [], status: "in-progress" });
    router.push(`/interview/${nid}`);
  }

  if (!user || !session) return null;
  const k = kindById(session.config.kind);
  const r = session.report;

  if (!r) {
    return (
      <>
        <Header user={user} />
        <main className="container page" style={{ maxWidth: 640, textAlign: "center" }}>
          {session.status === "error" && !grading ? (
            <div className="card" style={{ padding: 32 }}>
              <h1 className="serif" style={{ fontSize: 26 }}>We couldn&apos;t generate your feedback</h1>
              <p className="muted">{session.error}</p>
              <p className="muted small">Your transcript is saved, so you can retry without redoing the interview.</p>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link className="btn" href="/dashboard">
                  Dashboard
                </Link>
                <button className="btn primary" onClick={() => grade(session)}>
                  Retry feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 40, display: "grid", justifyItems: "center", gap: 14 }}>
              <div className="spinner" />
              <h1 className="serif" style={{ fontSize: 26 }}>Reviewing your interview…</h1>
              <p className="muted" style={{ margin: 0 }}>
                Reading your {session.turns.filter((t) => t.role === "candidate").length} answers, checking your on-camera presence and drafting stronger answers. This usually takes 20–60 seconds.
              </p>
            </div>
          )}
        </main>
      </>
    );
  }

  const tone = scoreTone(r.overall.score);
  const answers = session.turns.filter((t) => t.role === "candidate");
  const totalSec = answers.reduce((s, a) => s + (a.durationSec ?? 0), 0);
  const C = 2 * Math.PI * 60;
  const labels = questionLabels(session, r.questions);

  return (
    <>
      <Header user={user} />
      <main className="container page">
        <div className="row small muted" style={{ marginBottom: 12 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>

        {r.demo && (
          <div className="banner" style={{ marginBottom: 16 }}>
            Demo-mode report: scores are a rough heuristic, not AI feedback. Add an Anthropic API key on the dashboard to get real, answer-by-answer feedback.
          </div>
        )}

        <section className="card hero-score">
          <div className="ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--paper)" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={tone.bar} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - r.overall.score / 100)} />
            </svg>
            <div className="num">
              <div>
                <b>{r.overall.score}</b>
                <span className="muted small">out of 100</span>
              </div>
            </div>
          </div>
          <div>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className="pill" style={{ background: tone.bg, color: tone.fg, borderColor: "transparent" }}>
                {r.overall.verdict}
              </span>
              <span className="pill">
                <KindIcon kind={k.id} size={13} /> {k.title}
              </span>
              <span className="pill">{session.config.level}</span>
              <span className="pill">
                {answers.length} answers · {Math.max(1, Math.round(totalSec / 60))} min speaking
              </span>
            </div>
            <h1 className="serif" style={{ fontSize: 28, marginTop: 12 }}>
              Interview feedback
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 16, color: "var(--ink-2)" }}>{r.overall.summary}</p>
          </div>
        </section>

        <div className="grid-2" style={{ marginTop: 16 }}>
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 17, marginBottom: 6 }}>Top 3 things to work on</h2>
            {r.topActions.map((a, i) => (
              <div key={i} className="action">
                <span className="n">{i + 1}</span>
                <span>{a}</span>
              </div>
            ))}
          </section>
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>What you did well</h2>
            <ul className="list">
              {r.strengths.map((s, i) => (
                <li key={i}>
                  <span style={{ color: "var(--good)" }}>✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="section-h">
          <h2>Skill breakdown</h2>
          <span className="muted small">out of 10</span>
        </div>
        <section className="card" style={{ padding: "8px 20px" }}>
          {r.dimensions.map((d) => {
            const t = scoreTone(d.score, 10);
            return (
              <div key={d.name} className="dim">
                <div>
                  <div style={{ fontWeight: 500 }}>{d.name}</div>
                  <div className="muted small">{d.comment}</div>
                </div>
                <div className="track">
                  <i style={{ width: `${d.score * 10}%`, background: t.bar }} />
                </div>
                <strong style={{ color: t.fg, textAlign: "right" }}>{d.score}</strong>
              </div>
            );
          })}
        </section>

        <SeniorityCard questions={r.questions} target={session.config.level} />

        <div className="section-h">
          <h2>On-camera presence</h2>
          {r.presence.score != null && <span className="muted small">{r.presence.score}/10</span>}
        </div>
        <div className="grid-2">
          <section className="card" style={{ padding: 20, display: "grid", gap: 14, alignContent: "start" }}>
            {session.stats && (
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <span className="pill">{session.stats.wpm || "—"} words/min</span>
                <span className={`pill ${session.stats.fillerTotal > 8 ? "warn" : ""}`}>{session.stats.fillerTotal} filler words</span>
                <span className="pill">{session.stats.totalWords} words total</span>
              </div>
            )}
            {session.stats && session.stats.fillerTotal > 0 && (
              <div className="muted small">
                Most used:{" "}
                {Object.entries(session.stats.fillers)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([w, n]) => `"${w}" ×${n}`)
                  .join(", ")}
              </div>
            )}
            <div>
              <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
                Observations
              </div>
              <ul className="list">
                {r.presence.observations.map((o, i) => (
                  <li key={i}>
                    <span className="muted">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
                Tips
              </div>
              <ul className="list">
                {r.presence.tips.map((o, i) => (
                  <li key={i}>
                    <span style={{ color: "var(--accent)" }}>→</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="card video-box" style={{ padding: 16 }}>
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  onLoadedMetadata={(e) => {
                    // MediaRecorder webm files report Infinity duration until seeked to the end
                    const v = e.currentTarget;
                    if (v.duration === Infinity) {
                      v.currentTime = 1e101;
                      v.ontimeupdate = () => {
                        v.ontimeupdate = null;
                        v.currentTime = 0;
                      };
                    }
                  }}
                />
                <p className="muted small" style={{ margin: "10px 0 0" }}>
                  Your recording is stored only in this browser.
                </p>
              </>
            ) : (
              <div className="empty muted">No recording was saved for this interview.</div>
            )}
          </section>
        </div>

        <div className="section-h">
          <h2>Question by question</h2>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {r.questions.map((q, i) => (
            <QuestionCard key={i} i={i} q={q} answer={findAnswer(session, q.question, i)} meta={labels[i]} target={session.config.level} />
          ))}
        </div>

        <AnswerGuide questions={r.questions} labels={labels} demo={!!r.demo} />

        <div className="row" style={{ marginTop: 32, justifyContent: "flex-end" }}>
          <Link href="/dashboard" className="btn lg">
            Back to dashboard
          </Link>
          <button className="btn primary lg" onClick={practiceAgain}>
            Practice this format again
          </button>
        </div>
      </main>
    </>
  );
}

function findAnswer(s: Session, question: string, i: number) {
  const idx = s.turns.findIndex((t) => t.role === "interviewer" && t.text.trim() === question.trim());
  if (idx >= 0 && s.turns[idx + 1]?.role === "candidate") return s.turns[idx + 1].text;
  // fallback: i-th answered question
  const pairs: string[] = [];
  s.turns.forEach((t, j) => t.role === "interviewer" && s.turns[j + 1]?.role === "candidate" && pairs.push(s.turns[j + 1].text));
  return pairs[i] ?? "";
}

type QLabel = { title: string; cross: boolean; competency: string; reference?: string };

function findTurn(s: Session, question: string, i: number): Turn | undefined {
  const exact = s.turns.find((t) => t.role === "interviewer" && t.text.trim() === question.trim());
  if (exact) return exact;
  const asked = s.turns.filter((t, j) => t.role === "interviewer" && s.turns[j + 1]?.role === "candidate");
  return asked[i];
}

function questionLabels(s: Session, qs: Report["questions"]): QLabel[] {
  let main = 0;
  let cross = 0;
  return qs.map((q, i) => {
    const t = findTurn(s, q.question, i);
    if (t?.qType === "followup") {
      cross++;
      return { title: `Cross-question on Q${Math.max(1, main)}`, cross: true, competency: "" };
    }
    main++;
    cross = 0;
    return { title: `Question ${main}`, cross: false, competency: competencyLabel(t?.competency), reference: bankById(t?.qid)?.reference };
  });
}

function AnswerGuide({ questions, labels, demo }: { questions: Report["questions"]; labels: QLabel[]; demo: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = questions
    .map((q, i) => `${labels[i]?.title ?? `Question ${i + 1}`}: ${q.question}\n${labels[i]?.reference || q.modelAnswer ? `Model answer: ${labels[i]?.reference || q.modelAnswer}\n` : ""}${q.keyPoints?.length ? `Key points: ${q.keyPoints.join("; ")}` : ""}`)
    .join("\n\n");
  return (
    <>
      <div className="section-h">
        <h2>Answer guide</h2>
        <span className="muted small">Brief model answers for every question you were asked</span>
        <span className="spacer" />
        <button
          className="btn sm"
          onClick={() =>
            navigator.clipboard?.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          {copied ? "Copied" : "Copy all"}
        </button>
      </div>
      {demo && (
        <div className="banner" style={{ marginBottom: 12 }}>
          Demo mode shows reference answers from the question bank. Add an API key to also get model answers for cross-questions.
        </div>
      )}
      <section className="card">
        {questions.map((q, i) => {
          const l = labels[i];
          return (
            <div key={i} className="guide-item" style={l?.cross ? { paddingLeft: 44 } : undefined}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <span className={`guide-num ${l?.cross ? "cross" : ""}`}>{l?.cross ? "↳" : l?.title.replace("Question ", "")}</span>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span className="muted small">{l?.title}</span>
                    {l?.competency && <span className="pill accent">{l.competency}</span>}
                  </div>
                  <div style={{ fontWeight: 500 }}>{q.question}</div>
                </div>
              </div>
              {(l?.reference || q.modelAnswer) && (
                <div>
                  <div className="small muted" style={{ marginBottom: 6 }}>
                    {l?.reference ? "Reference answer" : "Model answer"}
                  </div>
                  <div className="better" style={{ background: "var(--paper)" }}>
                    {l?.reference || q.modelAnswer}
                  </div>
                  {l?.reference?.includes("[") && (
                    <div className="muted small" style={{ marginTop: 6 }}>
                      Swap the [placeholders] for your own projects and numbers.
                    </div>
                  )}
                </div>
              )}
              {!!q.keyPoints?.length && (
                <div>
                  <div className="small muted" style={{ marginBottom: 6 }}>
                    What interviewers listen for
                  </div>
                  <div className="chips">
                    {q.keyPoints.map((k, j) => (
                      <span key={j} className="pill">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}

function LevelPill({ level, target }: { level?: string; target: string }) {
  if (!level || levelRank(level) < 0) return null;
  const below = levelRank(level) < levelRank(target);
  return <span className={`pill ${below ? "warn" : "good"}`}>Answered at: {level}</span>;
}

function SeniorityCard({ questions, target }: { questions: Report["questions"]; target: string }) {
  const graded = questions.filter((q) => levelRank(q.level) >= 0);
  if (!graded.length) return null;
  const atOrAbove = graded.filter((q) => levelRank(q.level) >= levelRank(target)).length;
  const counts = LEVELS_ORDER.map((l) => ({ l, n: graded.filter((q) => q.level === l).length }));
  const pct = Math.round((atOrAbove / graded.length) * 100);
  return (
    <>
      <div className="section-h">
        <h2>Seniority check</h2>
        <span className="muted small">Are you answering like a {target} designer?</span>
      </div>
      <div className="grid-2">
        <section className="card" style={{ padding: 20, display: "grid", gap: 14, alignContent: "start" }}>
          <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", color: pct >= 70 ? "var(--good)" : pct >= 40 ? "var(--warn)" : "var(--bad)" }}>
              {atOrAbove}/{graded.length}
            </span>
            <span className="muted">answers at {target} level or above</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {counts.map(({ l, n }) => (
              <div key={l} className="row small" style={{ gap: 10 }}>
                <span style={{ width: 118, fontWeight: l === target ? 600 : 400 }}>
                  {l}
                  {l === target ? " (target)" : ""}
                </span>
                <div className="track" style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--paper)", overflow: "hidden" }}>
                  <i style={{ display: "block", height: "100%", width: `${(n / graded.length) * 100}%`, borderRadius: 4, background: levelRank(l) >= levelRank(target) ? "#2f9e62" : "#d98a1f" }} />
                </div>
                <span className="muted" style={{ width: 20, textAlign: "right" }}>{n}</span>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ margin: 0 }}>Each answer is tagged in the question-by-question section below, with what would lift it a level.</p>
        </section>
        <section className="card" style={{ padding: 20 }}>
          <div className="small" style={{ fontWeight: 600, marginBottom: 10 }}>
            How the level shows in an answer
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }} className="small">
            <span className="muted" style={{ fontWeight: 600 }}>Junior</span>
            <span style={{ fontWeight: 600, color: "var(--accent)" }}>Senior</span>
            {SENIORITY_SIGNALS.map((x, i) => (
              <div key={i} style={{ display: "contents" }}>
                <span className="muted">{x.junior}</span>
                <span>{x.senior}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function QuestionCard({ i, q, answer, meta, target }: { i: number; q: Report["questions"][number]; answer: string; meta?: QLabel; target: string }) {
  const [open, setOpen] = useState(i === 0);
  const [copied, setCopied] = useState(false);
  const t = scoreTone(q.score, 10);
  return (
    <section className="card qa">
      <button className="qa-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="score-badge" style={{ background: t.bg, color: t.fg, width: 40, height: 40 }}>
          {q.score}
        </div>
        <div style={{ flex: 1 }}>
          <div className="row small" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="muted">{meta?.title ?? `Question ${i + 1}`}</span>
            {meta?.competency && <span className="pill accent">{meta.competency}</span>}
            <LevelPill level={q.level} target={target} />
          </div>
          <div style={{ fontWeight: 500 }}>{q.question}</div>
          {!open && <div className="muted small" style={{ marginTop: 4 }}>{q.answerSummary}</div>}
        </div>
        <span className="muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="qa-body">
          {q.levelNote && (
            <div className="small" style={{ padding: "10px 12px", borderRadius: 10, background: levelRank(q.level) < levelRank(target) ? "var(--warn-soft)" : "var(--good-soft)" }}>
              <strong>Level: </strong>
              {q.levelNote}
            </div>
          )}
          {answer && (
            <div>
              <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                Your answer
              </div>
              <div className="your-answer small">{answer}</div>
            </div>
          )}
          <div className="grid-2">
            <div>
              <div className="small" style={{ fontWeight: 600, marginBottom: 8, color: "var(--good)" }}>
                What went well
              </div>
              <ul className="list">
                {q.wentWell.length ? (
                  q.wentWell.map((w, j) => (
                    <li key={j}>
                      <span style={{ color: "var(--good)" }}>✓</span>
                      <span>{w}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="muted">–</span>
                    <span className="muted">Nothing notable here.</span>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <div className="small" style={{ fontWeight: 600, marginBottom: 8, color: "var(--bad)" }}>
                What to improve
              </div>
              <ul className="list">
                {q.toImprove.map((w, j) => (
                  <li key={j}>
                    <span style={{ color: "var(--bad)" }}>!</span>
                    <span>
                      {w.point}
                      {w.evidence && <span className="evidence">“{w.evidence}”</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <div className="small" style={{ fontWeight: 600, color: "var(--accent)" }}>
                A stronger answer
              </div>
              <span className="spacer" />
              <button
                className="btn sm ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(q.betterAnswer).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="better">{q.betterAnswer}</div>
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              Built from your own points. Replace anything in [brackets] with your real details.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

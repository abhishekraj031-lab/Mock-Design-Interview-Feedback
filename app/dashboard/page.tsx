"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header, KindIcon, scoreTone, useUser } from "@/components/ui";
import { AiStatusCard } from "@/components/AiStatus";
import { deleteSession, listSessions } from "@/lib/store";
import { kindById, KINDS } from "@/lib/kinds";
import type { Session } from "@/lib/types";

export default function Dashboard() {
  const user = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    if (user) setSessions(listSessions(user.email));
  }, [user]);
  if (!user) return null;

  const done = sessions.filter((s) => s.status === "done" && s.report);
  const avg = done.length ? Math.round(done.reduce((a, s) => a + s.report!.overall.score, 0) / done.length) : null;
  const best = done.length ? Math.max(...done.map((s) => s.report!.overall.score)) : null;
  const last = done[0]?.report?.topActions?.[0];

  return (
    <>
      <Header user={user} />
      <main className="container page">
        <p className="muted" style={{ margin: 0 }}>
          Hi {user.name},
        </p>
        <h1 className="page-title serif" style={{ marginTop: 4 }}>
          Ready for your next round?
        </h1>

        <div className="grid-3" style={{ marginTop: 24 }}>
          <div className="card stat">
            <div className="muted small">Interviews completed</div>
            <div className="v">{done.length}</div>
          </div>
          <div className="card stat">
            <div className="muted small">Average score</div>
            <div className="v">{avg ?? "—"}</div>
          </div>
          <div className="card stat">
            <div className="muted small">Best score</div>
            <div className="v">{best ?? "—"}</div>
          </div>
        </div>

        {last && (
          <div className="card" style={{ padding: 18, marginTop: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span className="pill accent">Focus next</span>
            <span>{last}</span>
          </div>
        )}

        <AiStatusCard />

        <div className="section-h">
          <h2>Start a mock interview</h2>
        </div>
        <div className="grid-2">
          {KINDS.map((k) => (
            <Link key={k.id} href={`/new?kind=${k.id}`} className="kind-card" style={{ textDecoration: "none", ...(k.id === "pd-interview" ? { gridColumn: "1 / -1", borderColor: "var(--accent)" } : {}) }}>
              <div className="row">
                <div className="kind-icon">
                  <KindIcon kind={k.id} />
                </div>
                <div className="spacer" />
                <span className="pill">{k.duration}</span>
              </div>
              <strong style={{ fontSize: 16 }}>{k.title}</strong>
              <span className="muted small">{k.blurb}</span>
            </Link>
          ))}
        </div>

        <div className="section-h">
          <h2>Past interviews</h2>
          <span className="muted small">{sessions.length} total</span>
        </div>
        <div className="card">
          {sessions.length === 0 ? (
            <div className="empty muted">No interviews yet. Your reports will show up here so you can track progress.</div>
          ) : (
            sessions.map((s) => {
              const k = kindById(s.config.kind);
              const score = s.report?.overall.score;
              const tone = score != null ? scoreTone(score) : null;
              const href = s.status === "done" || s.status === "error" || s.status === "grading" ? `/report/${s.id}` : `/interview/${s.id}`;
              return (
                <div key={s.id} className="session-row">
                  <div className="score-badge" style={tone ? { background: tone.bg, color: tone.fg } : { background: "var(--paper)", color: "var(--muted)" }}>
                    {score ?? "–"}
                  </div>
                  <Link href={href} style={{ flex: 1, textDecoration: "none", minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {k.title} <span className="muted">· {s.config.level}</span>
                    </div>
                    <div className="muted small" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {new Date(s.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {s.config.company ? ` · ${s.config.company}` : ""}
                      {s.report ? ` · ${s.report.overall.verdict}` : ""}
                    </div>
                  </Link>
                  {s.status === "in-progress" && <span className="pill warn">Unfinished</span>}
                  {s.status === "error" && <span className="pill bad">Grading failed</span>}
                  {s.report?.demo && <span className="pill">Demo</span>}
                  <button
                    className="btn ghost sm"
                    aria-label="Delete interview"
                    onClick={() => {
                      if (!confirmDelete()) return;
                      deleteSession(s.id);
                      setSessions(listSessions(user.email));
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

function confirmDelete() {
  return window.confirm("Delete this interview and its recording?");
}

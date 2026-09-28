"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header, useUser } from "@/components/ui";
import { COMPETENCIES, LEVEL_INFO, QUESTION_BANK } from "@/lib/questionBank";
import type { Level } from "@/lib/types";

const LEVELS: Level[] = ["Junior", "Mid-level", "Senior", "Lead / Principal"];

export default function QuestionBankPage() {
  const user = useUser();
  const [level, setLevel] = useState<Level>("Senior");

  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get("level");
    if (l && LEVELS.includes(l as Level)) setLevel(l as Level);
  }, []);

  if (!user) return null;
  const info = LEVEL_INFO[level];

  return (
    <>
      <Header user={user} />
      <main className="container page" style={{ maxWidth: 880 }}>
        <h1 className="page-title serif">Question bank</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          Questions a product designer is asked at each level, grouped by what the interviewer is assessing. In a Product Designer interview, questions are drawn from your level and balanced across all three areas.
        </p>

        <div className="row" style={{ flexWrap: "wrap", marginTop: 20 }}>
          <div className="seg" role="tablist" aria-label="Experience level">
            {LEVELS.map((l) => (
              <button key={l} role="tab" aria-selected={level === l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}
          </div>
          <span className="spacer" />
          <Link href={`/new?kind=pd-interview`} className="btn primary">
            Practice these
          </Link>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 16, display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <span className="pill accent">{info.years}</span>
          <span className="muted small" style={{ flex: 1, minWidth: 220 }}>
            {info.focus}
          </span>
        </div>

        {COMPETENCIES.map((c) => {
          const qs = QUESTION_BANK.filter((q) => q.level === level && q.competency === c.id);
          return (
            <section key={c.id}>
              <div className="section-h">
                <h2>{c.label}</h2>
                <span className="muted small">{qs.length} questions</span>
              </div>
              <p className="muted small" style={{ marginTop: -6 }}>
                {c.blurb}
              </p>
              <div className="card">
                {qs.map((q, i) => (
                  <details key={q.id} className="qb-q">
                    <summary>
                      <span>
                        <span className="muted small">Q{i + 1}. </span>
                        {q.text}
                      </span>
                      <span className="toggle">{q.reference ? "Answer & tips" : "What they listen for"}</span>
                    </summary>
                    <ul className="list qb-look small">
                      {q.lookFor.map((p, j) => (
                        <li key={j}>
                          <span style={{ color: "var(--accent)" }}>✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    {q.reference && (
                      <div style={{ marginTop: 12 }}>
                        <div className="small" style={{ fontWeight: 600, color: "var(--accent)", marginBottom: 6 }}>
                          Reference answer
                        </div>
                        <div className="better small">{q.reference}</div>
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}

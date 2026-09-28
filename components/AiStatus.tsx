"use client";
import { useEffect, useState } from "react";
import { getApiKey, setApiKey } from "@/lib/store";

export function useAiMode() {
  const [server, setServer] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(getApiKey());
    fetch("/api/status")
      .then((r) => r.json())
      .then((j) => setServer(!!j.hasServerKey))
      .catch(() => setServer(false));
  }, []);
  return { live: server === null ? null : server || !!key, server, key, setKey: (k: string) => (setApiKey(k), setKey(k.trim())) };
}

export function AiStatusCard() {
  const { live, server, key, setKey } = useAiMode();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  if (live === null) return null;
  if (server) return null;
  return (
    <div className="card" style={{ padding: 18, marginTop: 24 }}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong>AI engine</strong>
            {live ? <span className="pill good">Live · your API key</span> : <span className="pill warn">Demo mode</span>}
          </div>
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            {live
              ? "Interviews and feedback run on Claude using the key saved in this browser."
              : "No AI key is configured on the server, so interviews use a scripted question bank and the report is a basic heuristic. Add an Anthropic API key to get real adaptive follow-ups and AI feedback."}
          </p>
        </div>
        <button className="btn sm" onClick={() => setOpen((o) => !o)}>
          {live ? "Change key" : "Add API key"}
        </button>
      </div>
      {open && (
        <div className="row" style={{ marginTop: 14 }}>
          <input className="input" type="password" placeholder="sk-ant-..." value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button
            className="btn primary"
            onClick={() => {
              setKey(draft);
              setDraft("");
              setOpen(false);
            }}
          >
            Save
          </button>
          {key && (
            <button className="btn" onClick={() => setKey("")}>
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

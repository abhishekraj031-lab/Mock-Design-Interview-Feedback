"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo, useUser } from "@/components/ui";
import { getApiKey, getSession, saveFrames, saveSession, saveVideo } from "@/lib/store";
import { kindById } from "@/lib/kinds";
import { competencyLabel } from "@/lib/questionBank";
import { computeStats } from "@/lib/speech";
import type { Frame, Session, Turn } from "@/lib/types";

type Phase = "check" | "asking" | "answering" | "thinking" | "finishing" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;
function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const prefs = ["Google UK English Female", "Samantha", "Microsoft Aria Online (Natural) - English (United States)", "Google US English", "Karen", "Daniel"];
  for (const p of prefs) {
    const v = voices.find((x) => x.name === p);
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en") && /natural|neural|google/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
}

const MAX_FRAMES_PER_Q = 3;

export default function InterviewRoom() {
  const user = useUser();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("check");
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const [camErr, setCamErr] = useState("");
  const [level, setLevel] = useState(0);
  const [srSupported, setSrSupported] = useState(true);
  const [ttsOn, setTtsOn] = useState(true);
  const [answer, setAnswer] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [listening, setListening] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const srRef = useRef<SR | null>(null);
  const answeringRef = useRef(false);
  const answerStartRef = useRef(0);
  const framesRef = useRef<Frame[]>([]);
  const frameTimerRef = useRef<number | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const ttsOnRef = useRef(true);
  const speakTimerRef = useRef<number | null>(null);

  // Load session
  useEffect(() => {
    const s = getSession(id);
    if (!s) return void router.replace("/dashboard");
    if (s.status !== "in-progress") return void router.replace(`/report/${id}`);
    setSession(s);
    sessionRef.current = s;
    turnsRef.current = s.turns;
    setSrSupported(!!getSR());
    window.speechSynthesis?.getVoices();
  }, [id, router]);

  // Camera + mic
  const startDevices = useCallback(async () => {
    setCamErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOk(true);
      // mic meter
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        if (!streamRef.current) return;
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += (v - 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) / 30));
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setCamOk(false);
      const name = (e as Error).name;
      setCamErr(
        name === "NotAllowedError"
          ? "Camera/microphone permission was blocked. Allow access from the address bar and try again."
          : name === "NotFoundError"
            ? "No camera or microphone was found on this device."
            : `Couldn't start your camera: ${(e as Error).message}`,
      );
    }
  }, []);

  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) return;
    startDevices();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      window.speechSynthesis?.cancel();
      try {
        srRef.current?.stop();
      } catch {}
    };
  }, [sessionId, startDevices]);

  // Re-attach stream when the video element remounts (check → room layout)
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  // Answer timer
  useEffect(() => {
    if (phase !== "answering") return;
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - answerStartRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  function persist(patch: Partial<Session>) {
    const s = { ...sessionRef.current!, ...patch };
    sessionRef.current = s;
    setSession(s);
    saveSession(s);
  }

  // ---------- Frames ----------
  function captureFrame() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const qIndex = turnsRef.current.length - 1;
    if (framesRef.current.filter((f) => f.qIndex === qIndex).length >= MAX_FRAMES_PER_Q) return;
    const c = document.createElement("canvas");
    c.width = 384;
    c.height = Math.round((384 * v.videoHeight) / v.videoWidth);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    framesRef.current.push({ qIndex, dataUrl: c.toDataURL("image/jpeg", 0.6) });
  }

  // ---------- Speech recognition ----------
  function startListening() {
    const SRC = getSR();
    if (!SRC) return;
    const r = new SRC();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language?.startsWith("en") ? navigator.language : "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (ev: any) => {
      let fin = "";
      let int = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else int += res[0].transcript;
      }
      if (fin) setAnswer((a) => (a ? a.replace(/\s*$/, " ") : "") + fin.trim());
      setInterim(int);
    };
    r.onend = () => {
      setListening(false);
      if (answeringRef.current) {
        try {
          r.start();
          setListening(true);
        } catch {}
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setSrSupported(false);
      }
    };
    srRef.current = r;
    try {
      r.start();
      setListening(true);
    } catch {}
  }
  function stopListening() {
    const r = srRef.current;
    srRef.current = null;
    if (r) {
      r.onend = null;
      try {
        r.stop();
      } catch {}
    }
    setListening(false);
    setInterim("");
  }

  // ---------- Interviewer speech ----------
  function speak(text: string, done: () => void) {
    const synth = window.speechSynthesis;
    if (!ttsOnRef.current || !synth) return done();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1;
    u.pitch = 1;
    let finished = false;
    const fin = () => {
      if (finished) return;
      finished = true;
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      done();
    };
    u.onend = fin;
    u.onerror = fin;
    // Safety net: some browsers never fire onend
    speakTimerRef.current = window.setTimeout(fin, 4000 + text.split(/\s+/).length * 450);
    synth.speak(u);
  }

  function beginAnswer() {
    setAnswer("");
    setInterim("");
    setElapsed(0);
    answerStartRef.current = Date.now();
    answeringRef.current = true;
    setPhase("answering");
    startListening();
    window.setTimeout(captureFrame, 4000);
    frameTimerRef.current = window.setInterval(captureFrame, 25000);
  }

  function ask(turn: Turn) {
    turnsRef.current = [...turnsRef.current, { ...turn, startedAt: Date.now() }];
    persist({ turns: turnsRef.current });
    setPhase("asking");
    speak(turn.text, () => {
      if (turn.qType === "closing") finish();
      else beginAnswer();
    });
  }

  async function nextTurn() {
    setPhase("thinking");
    setErrMsg("");
    try {
      const key = getApiKey();
      const r = await fetch("/api/turn", {
        method: "POST",
        headers: { "content-type": "application/json", ...(key ? { "x-user-api-key": key } : {}) },
        body: JSON.stringify({ config: sessionRef.current!.config, turns: turnsRef.current }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "The interviewer couldn't respond.");
      ask({ role: "interviewer", text: j.text, qType: j.qType, qid: j.qid, competency: j.competency });
    } catch (e) {
      setErrMsg((e as Error).message);
      setPhase("error");
    }
  }

  function startInterview() {
    const stream = streamRef.current;
    if (stream && typeof MediaRecorder !== "undefined") {
      const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t));
      try {
        const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1_000_000 });
        chunksRef.current = [];
        rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        rec.start(1000);
        recRef.current = rec;
      } catch (e) {
        console.warn("recording unavailable", e);
      }
    }
    nextTurn();
  }

  function submitAnswer(skip = false) {
    const text = skip ? "(Candidate skipped this question.)" : (answer + (interim ? " " + interim : "")).trim();
    if (!text) return;
    answeringRef.current = false;
    stopListening();
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    captureFrame();
    const durationSec = Math.round((Date.now() - answerStartRef.current) / 1000);
    turnsRef.current = [...turnsRef.current, { role: "candidate", text, durationSec }];
    persist({ turns: turnsRef.current });
    setAnswer("");
    setInterim("");
    nextTurn();
  }

  async function finish() {
    setPhase("finishing");
    answeringRef.current = false;
    stopListening();
    window.speechSynthesis?.cancel();
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    const rec = recRef.current;
    let hasVideo = false;
    if (rec && rec.state !== "inactive") {
      await new Promise<void>((res) => {
        rec.onstop = () => res();
        rec.stop();
      });
      if (chunksRef.current.length) {
        try {
          await saveVideo(id, new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" }));
          hasVideo = true;
        } catch (e) {
          console.warn("video save failed", e);
        }
      }
    }
    // keep frames evenly spread, max 12
    let frames = framesRef.current;
    if (frames.length > 12) frames = Array.from({ length: 12 }, (_, i) => frames[Math.floor((i * frames.length) / 12)]);
    await saveFrames(id, frames).catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const answered = turnsRef.current.some((t) => t.role === "candidate");
    persist({ status: answered ? "grading" : "in-progress", stats: computeStats(turnsRef.current), hasVideo });
    router.replace(answered ? `/report/${id}` : "/dashboard");
  }

  function endEarly() {
    if (!window.confirm("End the interview now? You'll get feedback on the questions you've answered.")) return;
    if (phase === "answering" && (answer || interim).trim()) {
      const durationSec = Math.round((Date.now() - answerStartRef.current) / 1000);
      turnsRef.current = [...turnsRef.current, { role: "candidate", text: (answer + " " + interim).trim(), durationSec }];
    }
    finish();
  }

  if (!user || !session) return null;
  const def = kindById(session.config.kind);
  const interviewerTurns = session.turns.filter((t) => t.role === "interviewer");
  const current = interviewerTurns[interviewerTurns.length - 1];
  const mainAsked = interviewerTurns.filter((t) => t.qType === "main").length;
  const bars = Array.from({ length: 5 }, (_, i) => Math.max(3, Math.min(18, level * 18 * (1 - Math.abs(i - 2) * 0.22))));
  const userSpeaking = phase === "answering" && level > 0.18;
  const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // ---------- Device check ----------
  if (phase === "check") {
    return (
      <div className="room">
        <div className="room-top">
          <Logo dark />
          <div className="spacer" />
          <button className="btn sm" onClick={() => router.push("/dashboard")}>
            Leave
          </button>
        </div>
        <div className="container" style={{ padding: "32px 20px", display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 28, alignItems: "start" }}>
          <div className="tile" style={{ aspectRatio: "16/10" }}>
            {camOk === false ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--room-muted)" }}>
                <p>{camErr}</p>
                <button className="btn" onClick={startDevices}>
                  Try again
                </button>
              </div>
            ) : (
              <video ref={videoRef} autoPlay muted playsInline />
            )}
            {camOk && (
              <div className="label">
                <div className="meter">
                  {bars.map((h, i) => (
                    <i key={i} style={{ height: h }} />
                  ))}
                </div>
                {user.name}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div className="muted small">{session.config.level} · {session.config.mainQuestions} questions</div>
              <h1 className="serif" style={{ fontSize: 30, marginTop: 4 }}>
                {def.title}
              </h1>
              {session.turns.length > 0 && <p className="small" style={{ color: "#ffd08a" }}>You left this interview midway — you'll pick up where you stopped.</p>}
            </div>
            <div className="check-list">
              <div className="check-item">
                <span className={camOk ? "ok" : camOk === false ? "no" : ""}>{camOk ? "✓" : camOk === false ? "✕" : "…"}</span>
                Camera & microphone
              </div>
              <div className="check-item">
                <span className={level > 0.1 ? "ok" : ""}>{level > 0.1 ? "✓" : "…"}</span>
                {level > 0.1 ? "We can hear you" : "Say something to test your mic"}
              </div>
              <div className="check-item">
                <span className={srSupported ? "ok" : "no"}>{srSupported ? "✓" : "!"}</span>
                <span>
                  {srSupported ? "Live transcription available" : "Live transcription isn't supported in this browser — you can type your answers instead. Chrome or Edge recommended."}
                </span>
              </div>
              <label className="check-item" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={ttsOn}
                  onChange={(e) => {
                    setTtsOn(e.target.checked);
                    ttsOnRef.current = e.target.checked;
                  }}
                />
                Read questions aloud
                <span className="spacer" />
                <button
                  type="button"
                  className="btn sm"
                  onClick={(e) => {
                    e.preventDefault();
                    ttsOnRef.current = true;
                    speak("Hi, I'll be your interviewer today. Can you hear me clearly?", () => (ttsOnRef.current = ttsOn));
                  }}
                >
                  Test voice
                </button>
              </label>
            </div>
            <p className="small" style={{ color: "var(--room-muted)", margin: 0 }}>
              Tip: use headphones so the interviewer's voice isn't picked up by your mic. Speak naturally — you can edit the transcript before submitting each answer.
            </p>
            <button className="btn primary lg" disabled={!camOk} onClick={startInterview}>
              {session.turns.length ? "Resume interview" : "Start interview"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Live room ----------
  const interviewerState = phase === "asking" ? "talking" : phase === "thinking" || phase === "finishing" ? "thinking" : "";
  return (
    <div className="room">
      <div className="room-top">
        <Logo dark />
        <span className="pill">{def.title}</span>
        {recRef.current && (
          <span className="pill">
            <span className="rec-dot" /> Recording
          </span>
        )}
        <div className="spacer" />
        <div className="progress-dots" aria-label={`Question ${mainAsked} of ${session.config.mainQuestions}`}>
          {Array.from({ length: session.config.mainQuestions }, (_, i) => (
            <i key={i} className={i < mainAsked ? "on" : ""} />
          ))}
        </div>
        <span className="small" style={{ color: "var(--room-muted)" }}>
          Q{Math.max(1, mainAsked)}/{session.config.mainQuestions}
        </span>
        <button className="btn danger sm" onClick={endEarly} disabled={phase === "finishing"}>
          End interview
        </button>
      </div>

      <div className="room-main">
        <div className={`tile ${phase === "asking" ? "speaking" : ""}`}>
          <div className={`orb ${interviewerState}`} />
          <div className="label">
            AI interviewer
            {phase === "thinking" && <span style={{ color: "var(--room-muted)" }}>· thinking…</span>}
            {phase === "asking" && <span style={{ color: "#4fd1a8" }}>· speaking</span>}
          </div>
        </div>
        <div className={`tile ${userSpeaking ? "speaking" : ""}`}>
          <video ref={videoRef} autoPlay muted playsInline />
          <div className="label">
            <div className="meter">
              {bars.map((h, i) => (
                <i key={i} style={{ height: h }} />
              ))}
            </div>
            {user.name}
          </div>
        </div>
      </div>

      <div className="room-bottom">
        <div className="q-card">
          <div className="row small" style={{ color: "var(--room-muted)", marginBottom: 8 }}>
            {current?.qType === "followup" ? "Cross-question on your answer" : current?.qType === "closing" ? "Wrapping up" : `Question ${Math.max(1, mainAsked)}`}
            {current?.competency && current.qType === "main" && (
              <span className="pill" style={{ background: "var(--room-3)", borderColor: "var(--room-3)", color: "#4fd1a8" }}>
                {competencyLabel(current.competency)}
              </span>
            )}
            <span className="spacer" />
            {current && phase !== "thinking" && (
              <button
                className="btn sm"
                onClick={() => {
                  const wasAnswering = answeringRef.current;
                  if (wasAnswering) stopListening();
                  const prev = ttsOnRef.current;
                  ttsOnRef.current = true;
                  speak(current.text, () => {
                    ttsOnRef.current = prev;
                    if (wasAnswering && answeringRef.current) startListening();
                  });
                }}
              >
                Repeat
              </button>
            )}
          </div>
          {phase === "error" ? (
            <div>
              <p style={{ color: "#ffb4ae" }}>{errMsg}</p>
              <button className="btn primary" onClick={nextTurn}>
                Try again
              </button>
            </div>
          ) : phase === "finishing" ? (
            <div className="q">Saving your recording and preparing feedback…</div>
          ) : current ? (
            <div className="q">{current.text}</div>
          ) : (
            <div className="q" style={{ color: "var(--room-muted)" }}>
              Your interviewer is joining…
            </div>
          )}
        </div>

        <div className="transcript">
          <div className="row small" style={{ color: "var(--room-muted)" }}>
            {phase === "answering" ? (
              <>
                {listening ? <span className="rec-dot" /> : null}
                {srSupported ? (listening ? "Listening — speak your answer" : "Type or speak your answer") : "Type your answer"}
                <span className="spacer" />
                <span style={{ color: elapsed > 180 ? "#ffd08a" : undefined }}>
                  {mm}:{ss}
                  {elapsed > 180 ? " · try to wrap up" : ""}
                </span>
              </>
            ) : (
              "Your answer"
            )}
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={phase === "answering" ? "Your words will appear here as you speak…" : ""}
            disabled={phase !== "answering"}
            aria-label="Your answer transcript"
          />
          {interim && <div className="interim small">{interim}</div>}
          <div className="controls">
            <button className="btn primary" disabled={phase !== "answering" || !(answer + interim).trim()} onClick={() => submitAnswer()}>
              Done answering
            </button>
            <button className="btn" disabled={phase !== "answering"} onClick={() => submitAnswer(true)}>
              Skip
            </button>
            <span className="spacer" />
            <label className="small row" style={{ gap: 6, color: "var(--room-muted)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ttsOn}
                onChange={(e) => {
                  setTtsOn(e.target.checked);
                  ttsOnRef.current = e.target.checked;
                  if (!e.target.checked) window.speechSynthesis?.cancel();
                }}
              />
              Voice
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

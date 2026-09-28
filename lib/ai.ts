import Anthropic from "@anthropic-ai/sdk";
import { kindById } from "./kinds";
import { bankById, competencyLabel, SENIORITY_SIGNALS } from "./questionBank";
import type { Frame, InterviewConfig, Report, SpeechStats, Turn } from "./types";

export const MODEL_TURN = process.env.ANTHROPIC_MODEL_TURN || "claude-sonnet-5";
export const MODEL_REPORT = process.env.ANTHROPIC_MODEL_REPORT || "claude-sonnet-5";

export function getClient(req: Request): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY || req.headers.get("x-user-api-key") || "";
  return key ? new Anthropic({ apiKey: key }) : null;
}

export function extractJSON<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function transcriptText(turns: Turn[]) {
  return turns
    .map((t) =>
      t.role === "interviewer"
        ? `INTERVIEWER (${t.qType === "followup" ? "cross-question" : t.qType ?? "main"}${t.competency ? ` · ${competencyLabel(t.competency)}` : ""}): ${t.text}`
        : `CANDIDATE${t.durationSec ? ` [${t.durationSec}s]` : ""}: ${t.text}`,
    )
    .join("\n\n");
}

function roleLine(c: InterviewConfig) {
  return `${c.level} product designer${c.company ? `, targeting: ${c.company}` : ""}`;
}

// ---------------- Turn (interviewer) ----------------

export const MAX_CROSS_QUESTIONS = 2;

export function turnPlan(config: InterviewConfig, turns: Turn[]) {
  const interviewer = turns.filter((t) => t.role === "interviewer");
  const mainAsked = interviewer.filter((t) => t.qType === "main").length;
  let lastMainIdx = -1;
  interviewer.forEach((t, i) => t.qType === "main" && (lastMainIdx = i));
  const followupsSinceMain = lastMainIdx < 0 ? 0 : interviewer.slice(lastMainIdx + 1).filter((t) => t.qType === "followup").length;
  const lastAnswer = turns[turns.length - 1];
  const skipped = lastAnswer?.role === "candidate" && lastAnswer.text.startsWith("(Candidate skipped");
  const followupAllowed = lastMainIdx >= 0 && followupsSinceMain < MAX_CROSS_QUESTIONS && !skipped;
  const mustClose = mainAsked >= config.mainQuestions && !followupAllowed;
  const allowed: ("followup" | "next" | "close")[] = mustClose
    ? ["close"]
    : mainAsked >= config.mainQuestions
      ? ["followup", "close"]
      : followupAllowed
        ? ["followup", "next"]
        : ["next"];
  const planned = config.plannedQuestions?.[mainAsked];
  return { mainAsked, allowed, first: turns.length === 0, followupsSinceMain, planned };
}

export function turnSystem(config: InterviewConfig) {
  const k = kindById(config.kind);
  return `You are a senior design manager conducting a realistic, spoken mock interview: ${k.interviewerBrief}

Candidate: ${roleLine(config)}.
${config.context ? `Context the candidate gave: "${config.context}"` : "The candidate gave no extra context."}
Planned main questions: ${config.mainQuestions}.

How you behave:
- Speak like a real, warm but rigorous interviewer. Your words are read aloud by text-to-speech, so write plain spoken sentences: no markdown, lists, emojis or parentheses.
- Keep each turn short: an optional brief acknowledgement (max ~8 words, neutral — never praise or grade the answer) followed by ONE clear question. 1–3 sentences total.
- This is a two-way conversation. Listen to the candidate's last answer and, when it adds real signal, ask a cross-question about something they actually said: a vague claim, a missing personal role, no evidence or metric, an unexplained tradeoff, a conflict they glossed over, or an interesting detail worth going deeper on. Quote or reference their words so it's clearly a reaction to them. If the answer was already complete and specific, move on instead — never ask a cross-question just to fill time.
- Main questions should progress logically through the format and not repeat ground already covered. Calibrate difficulty to the seniority level (Senior and above: strategy, influence, ambiguity, business impact).
- For an app critique with no app specified, pick a well-known consumer app and name it. For a design challenge, the first main question must state one concrete, open-ended prompt${config.context ? " in the domain the candidate asked for" : ""}.
${config.plannedQuestions?.length ? "- When asked for a planned main question, ask THAT question. You may add a brief natural transition and lightly adapt wording to the conversation or the candidate's background, but keep its intent and scope.\n" : ""}- The very first turn should greet the candidate in one sentence, say what format this is, then ask the first main question.
- A closing turn thanks the candidate and says their feedback report is being prepared. No question.

Respond with ONLY a JSON object: {"decision": "followup" | "next" | "close", "text": "what you say"}`;
}

// ---------------- Report ----------------

export function reportSystem(config: InterviewConfig) {
  const k = kindById(config.kind);
  return `You are an expert design hiring manager and interview coach. You are grading a mock ${k.title.toLowerCase()} interview for a ${roleLine(config)}.

Grade honestly and specifically, the way a strong hiring panel would debrief. Calibrate expectations to the seniority level.

Rules:
1. Every critique must be grounded in the transcript. In "toImprove", put a short VERBATIM quote from the candidate's answer in "evidence" whenever possible (max ~25 words). Never invent quotes.
2. "betterAnswer" is a rewritten, stronger version of THE CANDIDATE'S OWN answer, in first person, as they could say it aloud (roughly 120–220 words). Reuse their real facts, projects and examples. Do NOT invent facts, numbers, company names or outcomes; where a stronger answer needs something they didn't provide, insert a bracketed placeholder like [add the % reduction in errors] or [name the stakeholder]. Show structure (e.g. context → role → approach → decision & tradeoff → outcome → reflection) through the flow of sentences, not headings.
3. If an answer was skipped or very thin, score it low, say so plainly, and still give a model structure in betterAnswer with placeholders.
4. Scores: overall 0–100; dimensions and per-question 0–10. Anchors: 9–10 exceptional for level; 7–8 solid, would pass; 5–6 mixed, borderline; 3–4 weak; 0–2 missing. overall ≈ weighted judgement, not a plain average. Verdict must be one of: "Strong hire", "Hire", "Lean hire", "Lean no hire", "No hire".
5. Dimensions to score, in this order: ${k.dimensions.map((d) => `"${d}"`).join(", ")}. Each gets a one-to-two sentence comment referencing specifics.
6. Presence: you may receive webcam still frames and speech statistics (pace in words per minute, filler-word counts). Comment only on interview-relevant presence: eye line toward the camera, framing and distance, lighting and background distractions, posture, visible engagement, speaking pace, fillers and conciseness. Never comment on physical appearance, attractiveness, clothing style, age, ethnicity, gender, or anything about the person's body or home beyond distractions. If no frames are provided, set presence.score to null and base observations on speech only. Typical conversational pace is 130–160 wpm (transcription may undercount slightly).
7. "topActions": exactly 3 concrete, practice-able actions ordered by impact, each one sentence starting with a verb.
8. "strengths": 2–4 short specific strengths.
9. "summary": 2–3 sentences, direct, like a debrief note to the candidate ("You…").
10. Plain text inside strings (no markdown).
11. "modelAnswer": if a REFERENCE ANSWER is provided for the question, return an empty string (the app shows the reference). Otherwise, a brief ideal answer to THAT question (70–130 words, first person) that a strong ${config.level} candidate could give. It is a reference answer, independent of what this candidate said: concrete and realistic, may use a short illustrative example clearly framed as an example ("For example, on a checkout redesign…"), and must follow a clear structure. Where "WHAT INTERVIEWERS LISTEN FOR" notes are provided for a question, make sure the model answer covers them.
12. "keyPoints": 3–5 short phrases naming what interviewers listen for in an answer to that question.
13. Seniority check. "level": the seniority the answer actually demonstrates — one of "Junior", "Mid-level", "Senior", "Lead / Principal" — judged by these signals (junior → senior): ${SENIORITY_SIGNALS.map((x) => `${x.junior.replace(/[“”]/g, "")} → ${x.senior.replace(/[“”]/g, "")}`).join("; ")}. "levelNote": one sentence — if below ${config.level}, name the specific move that would lift it to ${config.level}; otherwise say what made it read at that level. Judge the substance, not the length.
14. When a REFERENCE ANSWER is provided, use it as the benchmark for what a strong answer covers, but don't penalise a different structure or example that is equally strong, and don't expect the candidate's personal facts to match its [placeholders].
15. Weigh the interview's goal: how well the candidate shows product thinking, level-appropriate managerial/leadership ability, and clear communication of the product and their decisions. Answers to cross-questions show how they think on their feet — reflect that.

Return ONLY a JSON object with this exact shape:
{
  "overall": {"score": number, "verdict": string, "summary": string},
  "dimensions": [{"name": string, "score": number, "comment": string}],
  "presence": {"score": number | null, "observations": string[], "tips": string[]},
  "questions": [{"question": string, "score": number, "answerSummary": string, "wentWell": string[], "toImprove": [{"point": string, "evidence": string}], "betterAnswer": string, "modelAnswer": string, "keyPoints": string[], "level": string, "levelNote": string}],
  "strengths": string[],
  "topActions": string[]
}
"questions" must contain one entry per interviewer question the candidate answered (main questions AND cross-questions), in order, with "question" copied from the transcript.`;
}

export function reportUserContent(turns: Turn[], stats: SpeechStats | undefined, frames: Frame[]): Anthropic.ContentBlockParam[] {
  const content: Anthropic.ContentBlockParam[] = [];
  const guides = turns
    .filter((t) => t.role === "interviewer" && t.qid && bankById(t.qid))
    .map((t) => {
      const b = bankById(t.qid)!;
      return `- "${t.text}"\n  Listen for: ${b.lookFor.join("; ")}${b.reference ? `\n  REFERENCE ANSWER: ${b.reference}` : ""}`;
    });
  content.push({
    type: "text",
    text: `TRANSCRIPT (answers were captured via live speech-to-text, so ignore minor transcription errors and missing punctuation):\n\n${transcriptText(turns)}`,
  });
  if (stats) {
    content.push({
      type: "text",
      text: `SPEECH STATS: ${stats.totalWords} words over ${stats.speakingSec}s of answering; pace ≈ ${stats.wpm} wpm; filler words: ${
        stats.fillerTotal ? Object.entries(stats.fillers).map(([k, v]) => `"${k}"×${v}`).join(", ") : "none detected"
      }.`,
    });
  }
  if (frames.length) {
    content.push({ type: "text", text: `WEBCAM FRAMES: ${frames.length} still frames sampled while the candidate was answering (mirrored self-view):` });
    for (const f of frames) {
      const m = f.dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!m) continue;
      content.push({ type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } });
    }
  }
  if (guides.length) content.push({ type: "text", text: `WHAT INTERVIEWERS LISTEN FOR (question bank notes and reference answers for the planned main questions):\n${guides.join("\n")}` });
  content.push({ type: "text", text: "Now write the JSON report." });
  return content;
}

// ---------------- Demo fallbacks (no API key) ----------------

const CLOSING = "That's all my questions. Thanks for walking me through your thinking. Your feedback report is being prepared now.";

export function demoTurn(config: InterviewConfig, turns: Turn[]) {
  const k = kindById(config.kind);
  const { mainAsked, allowed, first, followupsSinceMain, planned } = turnPlan(config, turns);
  if (allowed.length === 1 && allowed[0] === "close") return { qType: "closing", text: CLOSING };
  const totalFollowups = turns.filter((t) => t.qType === "followup").length;
  const lastAnswer = turns[turns.length - 1]?.text ?? "";
  const thin = lastAnswer.split(/\s+/).length < 45 || !/\d/.test(lastAnswer);
  if (allowed.includes("followup") && followupsSinceMain === 0 && thin && totalFollowups < 3) {
    return { qType: "followup", text: k.demoFollowups[totalFollowups % k.demoFollowups.length] };
  }
  if (allowed.includes("close")) return { qType: "closing", text: CLOSING };
  const intro = `Hi, thanks for joining. This is a ${k.title.toLowerCase()}.`;
  if (planned) {
    return { qType: "main", qid: planned.id, competency: planned.competency, text: first ? `${intro} ${planned.text}` : `Thanks. ${planned.text}` };
  }
  const q = k.demoQuestions[mainAsked % Math.max(1, k.demoQuestions.length)];
  return { qType: "main", text: first ? `${intro} ${q}` : `Thanks. ${q}` };
}

export function demoReport(config: InterviewConfig, turns: Turn[], stats?: SpeechStats): Report {
  const k = kindById(config.kind);
  const qs: Report["questions"] = [];
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const a = turns[i + 1];
    if (t.role !== "interviewer" || !a || a.role !== "candidate") continue;
    const words = a.text.split(/\s+/).filter(Boolean).length;
    const hasNumber = /\d/.test(a.text);
    const hasI = /\b(i|my)\b/i.test(a.text);
    const skipped = a.text.startsWith("(Candidate skipped");
    let score = skipped ? 1 : Math.min(8, 3 + Math.floor(words / 40) + (hasNumber ? 1 : 0) + (hasI ? 1 : 0));
    if (words > 400) score -= 1;
    const firstSentence = a.text.split(/(?<=[.!?])\s/)[0].slice(0, 140);
    qs.push({
      question: t.text,
      score,
      answerSummary: skipped ? "Skipped." : `${words}-word answer.`,
      wentWell: skipped ? [] : [words > 60 ? "Gave a reasonably full answer." : "Kept it brief.", ...(hasI ? ["Used first person to show ownership."] : [])],
      toImprove: [
        ...(hasNumber || skipped ? [] : [{ point: "No measurable outcome mentioned — quantify impact.", evidence: firstSentence }]),
        ...(words < 60 && !skipped ? [{ point: "Answer was short; add context, your role and the result.", evidence: firstSentence }] : []),
        ...(skipped ? [{ point: "Question was skipped.", evidence: "" }] : []),
      ],
      betterAnswer:
        "Demo mode can't rewrite answers. Structure to aim for: context (product, users, problem) → your specific role → what you did and why → the key tradeoff → the outcome [add a metric] → what you'd do differently.",
      modelAnswer: bankById(t.qid)?.reference,
      keyPoints: bankById(t.qid)?.lookFor ?? ["Context: product, users and the problem", "Your specific role and decisions", "The tradeoff you made and why", "Measurable outcome and what you learned"],
    });
  }
  const avg = qs.length ? qs.reduce((s, q) => s + q.score, 0) / qs.length : 0;
  const overall = Math.round(avg * 10);
  return {
    demo: true,
    overall: {
      score: overall,
      verdict: overall >= 75 ? "Hire" : overall >= 60 ? "Lean hire" : overall >= 45 ? "Lean no hire" : "No hire",
      summary: "This is a demo-mode estimate based on answer length, first-person ownership and whether you mentioned numbers. Add an Anthropic API key for real AI feedback on the substance of your answers.",
    },
    dimensions: k.dimensions.map((d) => ({ name: d, score: Math.round(avg), comment: "Estimated in demo mode." })),
    presence: {
      score: null,
      observations: stats
        ? [`Pace ≈ ${stats.wpm} words per minute.`, stats.fillerTotal ? `${stats.fillerTotal} filler words detected.` : "Few or no filler words detected."]
        : [],
      tips: ["Keep your eyes near the camera lens when making key points.", "Pause instead of using filler words."],
    },
    questions: qs,
    strengths: ["Completed the interview."],
    topActions: [
      "Open each answer with one sentence of context before diving into details.",
      "Attach at least one measurable outcome to every project you discuss.",
      "Say explicitly which decisions were yours versus the team's.",
    ],
  };
}

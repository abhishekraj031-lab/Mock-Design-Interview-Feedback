import type { SpeechStats, Turn } from "./types";

const FILLERS = ["um", "uh", "erm", "like", "basically", "actually", "you know", "sort of", "kind of", "i mean", "so yeah"];

export function computeStats(turns: Turn[]): SpeechStats {
  const answers = turns.filter((t) => t.role === "candidate");
  const text = answers.map((a) => a.text.toLowerCase()).join(" ");
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const speakingSec = answers.reduce((s, a) => s + (a.durationSec ?? 0), 0);
  const fillers: Record<string, number> = {};
  let fillerTotal = 0;
  for (const f of FILLERS) {
    const re = new RegExp(`\\b${f.replace(" ", "\\s+")}\\b`, "g");
    const n = (text.match(re) || []).length;
    if (n) {
      fillers[f] = n;
      fillerTotal += n;
    }
  }
  const wpm = speakingSec > 5 ? Math.round(totalWords / (speakingSec / 60)) : 0;
  return { totalWords, speakingSec: Math.round(speakingSec), wpm, fillers, fillerTotal };
}

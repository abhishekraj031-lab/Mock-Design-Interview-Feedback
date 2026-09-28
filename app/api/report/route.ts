import { demoReport, extractJSON, getClient, MODEL_REPORT, reportSystem, reportUserContent } from "@/lib/ai";
import type { Frame, InterviewConfig, Report, SpeechStats, Turn } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { config, turns, stats, frames } = (await req.json()) as { config: InterviewConfig; turns: Turn[]; stats?: SpeechStats; frames?: Frame[] };
  if (!config?.kind || !Array.isArray(turns)) return Response.json({ error: "Bad request" }, { status: 400 });

  const client = getClient(req);
  if (!client) return Response.json(demoReport(config, turns, stats));

  try {
    const msg = await client.messages.create({
      model: MODEL_REPORT,
      max_tokens: 12000,
      system: reportSystem(config),
      messages: [{ role: "user", content: reportUserContent(turns, stats, (frames ?? []).slice(0, 12)) }],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const report = extractJSON<Report>(text);
    report.overall.score = Math.max(0, Math.min(100, Math.round(report.overall.score)));
    return Response.json(report);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return Response.json(
      { error: err.status === 401 ? "The Anthropic API key was rejected." : `Couldn't generate feedback (${err.message ?? "unknown error"}).` },
      { status: err.status === 401 ? 401 : 502 },
    );
  }
}

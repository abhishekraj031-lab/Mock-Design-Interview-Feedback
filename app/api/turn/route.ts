import { demoTurn, extractJSON, getClient, MODEL_TURN, transcriptText, turnPlan, turnSystem } from "@/lib/ai";
import type { InterviewConfig, Turn } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { config, turns } = (await req.json()) as { config: InterviewConfig; turns: Turn[] };
  if (!config?.kind || !Array.isArray(turns)) return Response.json({ error: "Bad request" }, { status: 400 });

  const client = getClient(req);
  if (!client) return Response.json({ ...demoTurn(config, turns), demo: true });

  const plan = turnPlan(config, turns);
  const instructions = plan.first
    ? `This is the start of the interview. Greet the candidate and ask main question 1 of ${config.mainQuestions}${plan.planned ? ` — the planned question is: "${plan.planned.text}"` : ""}. Use decision "next".`
    : `Main questions asked so far: ${plan.mainAsked} of ${config.mainQuestions}. Allowed decisions for this turn: ${plan.allowed.map((a) => `"${a}"`).join(", ")}.
- "followup": a cross-question on the candidate's last answer — only when it adds real signal (vague, missing their own role, evidence, outcome or tradeoffs, or something worth digging into).
- "next": ask main question ${plan.mainAsked + 1}${plan.planned ? ` — the planned question is: "${plan.planned.text}"` : ""}.
- "close": end the interview.
Cross-questions already asked on the current main question: ${plan.followupsSinceMain} (max 2).
Choose one of the allowed decisions.`;

  try {
    const msg = await client.messages.create({
      model: MODEL_TURN,
      max_tokens: 400,
      system: turnSystem(config),
      messages: [
        {
          role: "user",
          content: `${turns.length ? `Conversation so far:\n\n${transcriptText(turns)}\n\n` : ""}${instructions}\n\nRespond with the JSON object only.`,
        },
      ],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const out = extractJSON<{ decision: "followup" | "next" | "close"; text: string }>(text);
    let decision = out.decision;
    if (!plan.allowed.includes(decision)) {
      // "next" after the quota means the interview is done; an unexpected "followup" becomes the next main question
      decision = decision === "next" && plan.allowed.includes("close") ? "close" : plan.allowed.includes("next") ? "next" : plan.allowed[0];
    }
    if (decision !== out.decision && decision === "close") {
      return Response.json(demoTurn(config, turns));
    }
    const qType = decision === "followup" ? "followup" : decision === "close" ? "closing" : "main";
    const planned = qType === "main" ? plan.planned : undefined;
    return Response.json({ qType, text: out.text.trim(), ...(planned ? { qid: planned.id, competency: planned.competency } : {}) });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    const status = err.status === 401 ? 401 : 502;
    return Response.json(
      { error: status === 401 ? "The Anthropic API key was rejected. Check the key and try again." : `The interviewer couldn't respond (${err.message ?? "unknown error"}).` },
      { status },
    );
  }
}

import type { Level } from "./types";
import { REFERENCE_ANSWERS } from "./referenceAnswers";

export type Competency = "product" | "leadership" | "communication";

export const COMPETENCIES: { id: Competency; label: string; short: string; blurb: string }[] = [
  { id: "product", label: "Product thinking", short: "Product", blurb: "Framing problems, users vs business, prioritisation, metrics and impact." },
  { id: "leadership", label: "Managerial & leadership", short: "Leadership", blurb: "Ownership, stakeholder management, influence, conflict, mentoring and running teams." },
  { id: "communication", label: "Communication", short: "Communication", blurb: "Explaining the product and decisions clearly, storytelling, tailoring to the audience." },
];
export const competencyLabel = (c?: string) => COMPETENCIES.find((x) => x.id === c)?.label ?? "";

export interface BankQuestion {
  id: string;
  level: Level;
  competency: Competency;
  text: string;
  lookFor: string[]; // what a strong answer covers
  reference?: string; // vetted reference answer (see referenceAnswers.ts)
}

export const LEVEL_INFO: Record<Level, { years: string; focus: string }> = {
  Junior: { years: "0–2 years", focus: "Fundamentals, learning from feedback, working well with PMs and engineers, explaining your own work." },
  "Mid-level": { years: "2–5 years", focus: "Owning features end to end, using data, balancing user and business needs, handling stakeholder pushback." },
  Senior: { years: "5–8 years", focus: "Shaping ambiguous problems, driving cross-team outcomes, influencing without authority, raising the bar." },
  "Lead / Principal": { years: "8+ years", focus: "Design strategy and vision, building and running teams, org-level influence, making the business case for design." },
};

const q = (id: string, level: Level, competency: Competency, text: string, lookFor: string[]): BankQuestion => ({
  id,
  level,
  competency,
  text,
  lookFor,
  reference: REFERENCE_ANSWERS[id],
});

export const QUESTION_BANK: BankQuestion[] = [
  // ---------------- Junior ----------------
  q("jr-p1", "Junior", "product", "Pick an app you use every day. What is one thing you would improve, and why does it matter to its users?", [
    "Names the user and the job they're trying to do before suggesting changes",
    "Describes a specific, observable problem rather than a visual preference",
    "Proposes a concrete improvement and says how they'd know it worked",
    "Acknowledges why the current design might exist (constraints, business goal)",
  ]),
  q("jr-p2", "Junior", "product", "Before you start designing, how do you make sure you understand the problem you're solving?", [
    "Asks who the users are, what the goal is and what success looks like",
    "Uses some evidence: talking to users, support tickets, analytics, the PM",
    "Writes down the problem statement and constraints before sketching",
    "Checks understanding with the team before going to high fidelity",
  ]),
  q("jr-p3", "Junior", "product", "Walk me through one project from the brief to handoff. What did you do at each stage?", [
    "Clear sequence: brief, understanding, exploration, testing, refinement, handoff",
    "Separates their own contribution from the team's",
    "Mentions at least one decision that changed because of feedback or testing",
    "Ends with what shipped and what happened after",
  ]),
  q("jr-p4", "Junior", "product", "You have two design options and the team is split. How do you decide which one to go with?", [
    "Goes back to the user goal and success criteria rather than taste",
    "Suggests a cheap way to test: quick usability test, data, prototype",
    "Lays out the tradeoffs of each option",
    "Is comfortable committing and revisiting later",
  ]),
  q("jr-l1", "Junior", "leadership", "Tell me about a time you got design feedback you disagreed with. What did you do?", [
    "Listened first and tried to understand the reason behind the feedback",
    "Responded with rationale or evidence, not defensiveness",
    "Reached a resolution: changed the design, tested it, or agreed to disagree",
    "Reflects on what they learned about giving or receiving feedback",
  ]),
  q("jr-l2", "Junior", "leadership", "An engineer tells you your design can't be built in time. How do you handle it?", [
    "Asks what specifically is hard and why",
    "Separates must-haves from nice-to-haves",
    "Offers a simpler version that keeps the core user value",
    "Documents what is deferred so it isn't lost",
  ]),
  q("jr-l3", "Junior", "leadership", "You're working on three tasks with the same deadline. How do you prioritise and keep people informed?", [
    "Clarifies priority with the PM or lead instead of guessing",
    "Breaks work down and estimates honestly",
    "Flags risk early rather than at the deadline",
    "Communicates status proactively",
  ]),
  q("jr-l4", "Junior", "leadership", "Tell me about a mistake you made on a project and how you handled it.", [
    "Owns the mistake clearly without blaming others",
    "Explains the impact and the immediate fix",
    "Describes what they changed in their process afterwards",
  ]),
  q("jr-c1", "Junior", "communication", "Explain one design decision you made to me as if I were a non-designer on the sales team.", [
    "Avoids jargon and uses plain language",
    "Connects the decision to a user or business outcome sales cares about",
    "Uses a simple example or analogy",
    "Keeps it short and checks for understanding",
  ]),
  q("jr-c2", "Junior", "communication", "In about two minutes, present the project you're proudest of.", [
    "Opens with context: product, users, problem",
    "States their role clearly",
    "Highlights one or two key decisions, not every screen",
    "Ends with the outcome or learning, within the time",
  ]),
  q("jr-c3", "Junior", "communication", "How do you hand off a design so engineers build it the way you intended?", [
    "Annotated specs covering states, edge cases, empty and error states",
    "Uses components and tokens from the design system",
    "Walks engineers through it live and stays available for questions",
    "Reviews the build before release",
  ]),
  q("jr-c4", "Junior", "communication", "How would you explain what 'good UX' means to someone new to the company?", [
    "Defines it in terms of users achieving goals easily and confidently",
    "Gives a concrete everyday example",
    "Mentions it's measured by outcomes, not just looks",
  ]),
  q("jr-p5", "Junior", "product", "How do you conduct user research, and how do you avoid just asking users what feature they want?", [
    "Picks the method to fit the question: interviews, usability tests, analytics, support tickets",
    "Asks about past behaviour and current workarounds, not hypothetical wishes",
    "Gives an example of a good vs a leading question",
    "Turns findings into a clear problem or opportunity",
  ]),
  q("jr-p6", "Junior", "product", "Pick a product you know well and walk me through its end-to-end user journey: what happens before, during and after the key interaction?", [
    "Covers stages outside the screens (trigger, preparation, follow-up)",
    "Names the user's goal and emotions or pain points at each stage",
    "Spots at least one opportunity the journey reveals",
  ]),
  q("jr-l5", "Junior", "leadership", "A stakeholder looks at your design and says, \"I don't like it.\" What do you do?", [
    "Stays calm and asks what specifically they don't like and why",
    "Turns vague feedback into something actionable",
    "Checks the concern against user needs, requirements and research",
    "Either improves the design or explains the rationale with evidence",
  ]),
  q("jr-c5", "Junior", "communication", "Walk me through your design process, using a real project as the example.", [
    "Clear stages: understand, research, define, flows, explore, prototype, test, refine, handoff",
    "Grounded in a real project rather than a textbook diagram",
    "Shows the process is not strictly linear and loops back when testing finds problems",
  ]),
  q("jr-c6", "Junior", "communication", "What is your biggest strength as a designer? Give me an example that shows it.", [
    "Names one specific strength, not a list",
    "Backs it with a concrete example and result",
    "Links it to the role they're applying for",
  ]),

  // ---------------- Mid-level ----------------
  q("mid-p1", "Mid-level", "product", "How do you define success metrics for a feature you're designing? Give an example.", [
    "Ties metrics to the user goal and business goal",
    "Distinguishes a primary metric from guardrail metrics",
    "Sets a baseline and target before launch",
    "Real example with how it was actually measured",
  ]),
  q("mid-p2", "Mid-level", "product", "Tell me about a time data or research changed the direction of your design.", [
    "Describes the original assumption",
    "Explains the evidence (quant or qual) and how it was gathered",
    "Shows what changed in the design and why",
    "States the result of the change",
  ]),
  q("mid-p3", "Mid-level", "product", "You have a long list of user problems and limited engineering time. How do you decide what to design for first?", [
    "Uses a framework: impact vs effort, frequency × severity, or business priority",
    "Involves PM and engineering in the call",
    "Considers dependencies and quick wins",
    "Is explicit about what is not being done and why",
  ]),
  q("mid-p4", "Mid-level", "product", "Describe a time user needs and business goals were in conflict. How did you resolve it?", [
    "Clearly explains both sides of the conflict",
    "Looks for a solution that serves both instead of picking a winner",
    "Uses evidence to make the case",
    "Outcome and what was traded off",
  ]),
  q("mid-l1", "Mid-level", "leadership", "Your PM wants to cut scope in a way you think will hurt the user experience. What do you do?", [
    "Understands the reason for the cut (deadline, risk, cost)",
    "Quantifies the user impact of the cut",
    "Proposes alternatives: phasing, a lighter version, follow-up ticket",
    "Disagrees and commits once a decision is made",
  ]),
  q("mid-l2", "Mid-level", "leadership", "Tell me about a time you had to align stakeholders with conflicting requirements.", [
    "Identifies each stakeholder's underlying goal",
    "Brings them together around shared evidence or a decision framework",
    "Documents the decision and who owns what",
    "Shows the outcome and relationships afterwards",
  ]),
  q("mid-l3", "Mid-level", "leadership", "Have you mentored a junior designer or intern? How did you help them grow?", [
    "Specific person and specific skill they helped build",
    "Gave actionable, regular feedback",
    "Gave ownership gradually rather than doing the work for them",
    "Evidence of the person's growth",
  ]),
  q("mid-l4", "Mid-level", "leadership", "Your project is slipping behind schedule. How do you handle it?", [
    "Spots the slip early and finds the root cause",
    "Communicates transparently to the PM and stakeholders",
    "Proposes options: re-scope, re-sequence, get help",
    "Protects the quality of what matters most",
  ]),
  q("mid-c1", "Mid-level", "communication", "How would you present a redesign to leadership to get buy-in?", [
    "Starts with the business problem and the cost of doing nothing",
    "Shows evidence: data, user quotes, test results",
    "Presents the solution at the right level of detail for execs",
    "Makes a clear ask: decision, resources or timeline",
  ]),
  q("mid-c2", "Mid-level", "communication", "How do you share research findings so the team actually acts on them?", [
    "Short, prioritised insights instead of a long report",
    "Uses real user quotes or clips to build empathy",
    "Links each insight to a recommendation and owner",
    "Follows up to see what changed",
  ]),
  q("mid-c3", "Mid-level", "communication", "Walk me through a project where you can show measurable impact. Keep it structured.", [
    "Clear structure: context, role, approach, decision, outcome",
    "Concrete numbers, or an honest proxy if no numbers exist",
    "Explains how the design caused the result",
    "Includes a reflection",
  ]),
  q("mid-c4", "Mid-level", "communication", "How do you handle tough critique in a design review in front of others?", [
    "Stays calm and curious and asks clarifying questions",
    "Separates the feedback from their ego",
    "Explains rationale briefly and agrees next steps",
    "Follows up with the changes or a counter-argument backed by evidence",
  ]),
  q("mid-p5", "Mid-level", "product", "How do you decide what goes into the MVP of a new feature?", [
    "Starts from the core user problem and the riskiest assumption",
    "Keeps enough to deliver real value, not just the smallest build",
    "Defines what the team wants to learn and how it will be measured",
    "Is explicit about what is deferred",
  ]),
  q("mid-p6", "Mid-level", "product", "How do you use AI tools in your design workflow, and where don't you trust them?", [
    "Concrete uses: synthesis, ideation, copy, prototyping, not just 'I use ChatGPT'",
    "Keeps judgement and user validation with the designer",
    "Aware of risks: hallucinated insights, generic output, privacy of research data",
    "Shows a real time or quality gain",
  ]),

  // ---------------- Senior ----------------
  q("sr-p1", "Senior", "product", "Tell me about an opportunity you identified that nobody asked you to work on. How did it become a real project?", [
    "How they spotted it: data, user insight, market signal",
    "How they sized the opportunity and made a case",
    "How they got sponsorship and resources",
    "What shipped and the business impact",
  ]),
  q("sr-p2", "Senior", "product", "How do you turn a vague, ambiguous problem into a clear design direction?", [
    "Frames the problem and writes down assumptions",
    "Identifies the riskiest assumptions and tests them cheaply",
    "Defines principles and success criteria with PM and engineering",
    "Converges through iterations with clear decision points",
  ]),
  q("sr-p3", "Senior", "product", "How do you balance short-term delivery pressure with long-term product vision?", [
    "Has a north-star vision and maps quick wins toward it",
    "Avoids design debt that blocks the vision, or tracks it deliberately",
    "Uses roadmapping and sequencing, not just the backlog",
    "Real example of a tradeoff made",
  ]),
  q("sr-p4", "Senior", "product", "Tell me about a time you argued not to build something. What happened?", [
    "Evidence that the feature wouldn't solve the problem or wasn't worth it",
    "Proposed a better alternative or a cheaper test",
    "Handled the politics respectfully",
    "Outcome, including what was saved",
  ]),
  q("sr-l1", "Senior", "leadership", "Describe a project where you led design across multiple teams. How did you keep it coherent?", [
    "Set shared principles, patterns or a design system",
    "Established rituals: crits, syncs, a single source of truth",
    "Managed dependencies and conflicting priorities",
    "Result: a consistent experience and delivery",
  ]),
  q("sr-l2", "Senior", "leadership", "How do you influence decisions when you don't have authority over the people involved?", [
    "Builds trust and relationships ahead of time",
    "Uses data, prototypes and user evidence to persuade",
    "Frames the case in the other person's goals",
    "Example with the outcome",
  ]),
  q("sr-l3", "Senior", "leadership", "How have you raised the quality bar of design in your team or company?", [
    "A specific initiative: design system, crit culture, research ops, quality reviews",
    "How they got adoption, not just created it",
    "A measurable or visible improvement",
  ]),
  q("sr-l4", "Senior", "leadership", "Research is inconclusive and a decision is needed this week. What do you do?", [
    "Acknowledges uncertainty openly",
    "Makes a reversible decision using the best available evidence and principles",
    "Defines what to measure after launch to validate it",
    "Aligns stakeholders on the risk",
  ]),
  q("sr-c1", "Senior", "communication", "Pitch a design vision to me as if I'm the VP of Product. You have three minutes.", [
    "Starts with the business problem or opportunity",
    "Tells a user story that makes the vision tangible",
    "Gives a phased plan and expected impact",
    "Ends with a clear ask",
  ]),
  q("sr-c2", "Senior", "communication", "Tell me about a project that failed. How did you communicate it?", [
    "Honest about what failed and why",
    "Communicated early and transparently",
    "Shared the learnings and changes made",
    "Kept trust with stakeholders",
  ]),
  q("sr-c3", "Senior", "communication", "How would you explain the same project differently to engineers, executives and customers?", [
    "Engineers: constraints, specs, edge cases",
    "Executives: business impact, risk, investment",
    "Customers: benefits in plain language",
    "Shows deliberate audience awareness",
  ]),
  q("sr-c4", "Senior", "communication", "How do you document and communicate design decisions so they survive after you leave the project?", [
    "Decision logs or design rationale docs",
    "Design system documentation and principles",
    "Recorded walkthroughs and a single source of truth",
  ]),
  q("sr-p5", "Senior", "product", "How do you approach a complex product problem before designing anything?", [
    "Separates the user problem, business problem and product problem",
    "Looks for the root cause instead of redesigning the obvious screen",
    "Uses data and research to confirm the cause",
    "Defines the problem and opportunities before solutions",
  ]),
  q("sr-p6", "Senior", "product", "Our checkout conversion has dropped 15% in the last two weeks. What would you do?", [
    "Doesn't jump to a redesign; first finds when and where in the funnel the drop happens",
    "Segments the data: device, new vs returning, payment method, traffic source, browser",
    "Checks recent releases, error logs and external factors",
    "Combines quant with qual, then prioritises and validates fixes with experiments",
  ]),
  q("sr-p7", "Senior", "product", "Users aren't using a feature you designed. What do you do?", [
    "Separates discoverability, understanding of value, usability and real need",
    "Uses adoption data, session recordings, interviews and support feedback",
    "Is willing to conclude the need wasn't real and remove or rethink it",
    "Defines what success would look like after the fix",
  ]),
  q("sr-p8", "Senior", "product", "How do you design for scalability in a complex B2B product?", [
    "Thinks beyond the current screen: 10x data, new roles, permissions, new business rules",
    "Treats edge cases, empty states and failures as part of the design",
    "Uses patterns and systems that can absorb change",
    "Gives a real example where this mattered",
  ]),
  q("sr-p9", "Senior", "product", "How would you design an AI-powered feature so users trust it, knowing it will sometimes be wrong?", [
    "Decides where AI adds value versus where rules or plain UI are better",
    "Designs for errors: confidence, sources, easy correction, undo",
    "Keeps the user in control of consequential actions",
    "Measures trust and quality after launch, not just usage",
  ]),
  q("sr-p10", "Senior", "product", "Tell me about the most complex design problem you've solved.", [
    "Clear context and why it was genuinely complex (dependencies, users, constraints)",
    "Their own role and key decisions",
    "How they mapped and simplified the problem",
    "A measurable outcome and a reflection",
  ]),
  q("sr-l5", "Senior", "leadership", "The CEO wants a feature that your research suggests users don't need. What do you do?", [
    "Takes the request seriously and uncovers the business reason behind it",
    "Shares evidence clearly: what we know, what we don't, and the risks",
    "Proposes a measurable hypothesis and a lightweight experiment",
    "Respects the final decision while protecting the user",
  ]),
  q("sr-l6", "Senior", "leadership", "You have one week to design a complex feature. How do you plan it?", [
    "Reduces scope, not quality: focuses on the critical user journey",
    "A realistic day-by-day plan including validation",
    "Aligns early with PM and engineering on what's in and out",
    "Documents what follows in the next version",
  ]),
  q("sr-l7", "Senior", "leadership", "How would you build a design system from scratch, and how do you decide something should become a component?", [
    "Starts with foundations: type, colour, spacing, grid, states, tokens",
    "Builds components from real product needs, not a speculative library",
    "Creates components when a pattern repeats and needs consistent behaviour; avoids premature abstraction",
    "Sets up naming, documentation, contribution and adoption",
  ]),
  q("sr-l8", "Senior", "leadership", "What would you do in your first 30 days at a new company?", [
    "Learns before redesigning: users, product strategy, engineering constraints, existing design",
    "Reviews analytics, research and customer feedback",
    "Builds relationships and understands why things are the way they are",
    "Identifies one or two early, meaningful wins",
  ]),
  q("sr-c5", "Senior", "communication", "In your view, what makes someone a Senior Product Designer rather than a mid-level one?", [
    "Moves from designing screens to influencing outcomes",
    "Handles ambiguity and chooses the right problem",
    "Influences stakeholders and partners with engineering",
    "Raises the bar for the team, not just their own work",
  ]),
  q("sr-c6", "Senior", "communication", "Why should we hire you?", [
    "A crisp, specific value proposition, not a list of adjectives",
    "Evidence from past impact",
    "Tied to this company's product and challenges",
    "Confident but not arrogant, under a minute",
  ]),

  // ---------------- Lead / Principal ----------------
  q("ld-p1", "Lead / Principal", "product", "How do you set a design strategy that ties directly to company goals?", [
    "Starts from company objectives and customer insight",
    "Defines a design vision, principles and priorities",
    "Turns it into a roadmap with measurable outcomes",
    "Reviews and adapts it regularly with product leadership",
  ]),
  q("ld-p2", "Lead / Principal", "product", "What does the product experience look like two years from now, for a product you've led? How did you get there?", [
    "A clear, compelling vision grounded in user needs",
    "Market and technology trends considered",
    "Phased path from today to the vision",
    "How they got alignment on it",
  ]),
  q("ld-p3", "Lead / Principal", "product", "How do you measure and prove the ROI of design to the business?", [
    "Links design work to business metrics: conversion, retention, support cost, efficiency",
    "Uses experiments and before-and-after baselines",
    "Also tracks leading indicators: usability, satisfaction, task time",
    "Tells the story in business language",
  ]),
  q("ld-p4", "Lead / Principal", "product", "Tell me about a big product bet you shaped. How did you reduce risk before committing?", [
    "Framed the bet and its key assumptions",
    "Validated with prototypes, pilots and customer research",
    "Defined kill or continue criteria",
    "Outcome and learnings",
  ]),
  q("ld-l1", "Lead / Principal", "leadership", "How have you hired and built a design team? What do you look for?", [
    "Team structure tied to business needs",
    "A clear hiring bar and process",
    "Balances skills across the team (craft, research, systems)",
    "Onboarding and early success of hires",
  ]),
  q("ld-l2", "Lead / Principal", "leadership", "How do you handle a designer on your team who is underperforming?", [
    "Diagnoses the cause: skill, will, clarity or context",
    "Gives clear, specific expectations and support",
    "Documents and follows up regularly",
    "Makes the hard call fairly if it doesn't improve",
  ]),
  q("ld-l3", "Lead / Principal", "leadership", "How do you set up design process and operations so quality scales with the team?", [
    "Design system, reviews, research ops, tooling",
    "Clear rituals and definitions of done",
    "Balances process with speed and autonomy",
    "Evidence it worked at scale",
  ]),
  q("ld-l4", "Lead / Principal", "leadership", "Tell me about a serious disagreement with a product or engineering leader. How was it resolved?", [
    "Understands the other leader's goals and constraints",
    "Escalates only when needed, with data",
    "Protects the relationship and the team",
    "Resolution and what they learned",
  ]),
  q("ld-c1", "Lead / Principal", "communication", "How would you convince the CEO to invest more in design?", [
    "Speaks in business outcomes and risk",
    "Uses proof points from past wins",
    "Makes a specific, sized ask",
    "Anticipates objections",
  ]),
  q("ld-c2", "Lead / Principal", "communication", "How do you create a design culture that the rest of the company understands and values?", [
    "Makes design visible: showcases, reviews, shared rituals",
    "Involves other functions in research and critique",
    "Celebrates wins tied to outcomes",
  ]),
  q("ld-c3", "Lead / Principal", "communication", "How would you communicate a major org or process change to your design team?", [
    "Explains the why first",
    "Is transparent about impact on people",
    "Creates space for questions and feedback",
    "Follows up and adjusts",
  ]),
  q("ld-c4", "Lead / Principal", "communication", "Walk me through how you present your team's work in a quarterly business review.", [
    "Outcomes over outputs",
    "Links to company goals",
    "Honest about misses and next priorities",
    "Concise and executive-ready",
  ]),
];

export const INTRO_QUESTION: BankQuestion = q("intro", "Junior", "communication", "To start, tell me briefly about yourself: your current role, the products you've worked on, and what you're looking for next.", [
  "Concise, around one to two minutes",
  "Clear current role and scope",
  "One or two highlights with impact",
  "Connects their background to the role they want",
]);

export const bankById = (id?: string) => (id === "intro" ? INTRO_QUESTION : QUESTION_BANK.find((x) => x.id === id));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Picks n questions for a level, balanced across the three competencies. Adds an intro for longer interviews. */
export function pickQuestions(level: Level, n: number): { id: string; text: string; competency: Competency }[] {
  const pools = COMPETENCIES.map((c) => shuffle(QUESTION_BANK.filter((x) => x.level === level && x.competency === c.id)));
  const out: BankQuestion[] = [];
  const withIntro = n >= 6;
  if (withIntro) out.push(INTRO_QUESTION);
  let i = 0;
  while (out.length < n && pools.some((p) => p.length)) {
    const p = pools[i % pools.length];
    if (p.length) out.push(p.shift()!);
    i++;
  }
  return out.map((x) => ({ id: x.id, text: x.text, competency: x.competency }));
}

/** How answers sound at different seniority levels — used by the grader and shown in the report. */
export const SENIORITY_SIGNALS: { junior: string; senior: string }[] = [
  { junior: "“How do I design this?”", senior: "“Should we design this?”" },
  { junior: "Focuses on screens", senior: "Focuses on problems" },
  { junior: "Executes requirements", senior: "Challenges requirements" },
  { junior: "Uses UX methods", senior: "Chooses the right method" },
  { junior: "Gets stakeholder feedback", senior: "Influences stakeholders" },
  { junior: "Follows design systems", senior: "Builds and evolves systems" },
  { junior: "Solves defined problems", senior: "Handles ambiguity" },
  { junior: "Measures usability", senior: "Connects UX to business metrics" },
  { junior: "Works with developers", senior: "Partners with engineering" },
  { junior: "Owns design tasks", senior: "Owns outcomes" },
];

export const LEVELS_ORDER: Level[] = ["Junior", "Mid-level", "Senior", "Lead / Principal"];
export const levelRank = (l?: string) => LEVELS_ORDER.indexOf(l as Level);

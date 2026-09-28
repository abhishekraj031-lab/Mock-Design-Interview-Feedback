import type { InterviewKind } from "./types";

export interface KindDef {
  id: InterviewKind;
  title: string;
  blurb: string;
  duration: string;
  contextLabel: string;
  contextPlaceholder: string;
  interviewerBrief: string;
  dimensions: string[];
  demoQuestions: string[];
  demoFollowups: string[];
}

export const KINDS: KindDef[] = [
  {
    id: "pd-interview",
    title: "Product Designer interview",
    blurb: "The full round: questions picked for your level on product thinking, managerial skills and communication, with cross-questions on your answers.",
    duration: "~30 min",
    contextLabel: "Tell the interviewer about yourself (optional)",
    contextPlaceholder: "e.g. 7 years; sole designer on an internal ERP used by 15+ business units; targeting B2B SaaS",
    interviewerBrief:
      "a product designer interview. The goal is to assess three things: (1) product thinking — how they frame problems, balance users and business, prioritise and measure impact; (2) managerial and leadership skills appropriate to their level — ownership, stakeholder management, influence, conflict, mentoring or running teams; (3) communication — how clearly they explain the product and their decisions. Main questions come from a planned list; cross-questions dig into the candidate's own answers.",
    dimensions: ["Product thinking", "Managerial & leadership", "Communication & clarity", "Structured problem solving", "Impact & outcomes", "Handling cross-questions"],
    demoQuestions: [],
    demoFollowups: [
      "You said the team did that. What was your own part in it, specifically?",
      "How did you know it worked? What changed after it shipped?",
      "If you had to make that call again, what would you do differently?",
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio walkthrough",
    blurb: "Walk the interviewer through your body of work, your role and how you've grown.",
    duration: "~20 min",
    contextLabel: "Which projects will you talk about?",
    contextPlaceholder: "e.g. ERP purchase module redesign, fintech onboarding flow, logistics tracking app",
    interviewerBrief:
      "a portfolio review. Probe the candidate's overall body of work: their role vs the team's, how they choose problems, range across projects, craft quality, growth, and what they would do differently.",
    dimensions: ["Storytelling & structure", "Problem framing", "Process & rationale", "Impact & outcomes", "Ownership & collaboration", "Communication clarity"],
    demoQuestions: [
      "To start, give me a two-minute tour of your background and the kind of product problems you're drawn to.",
      "Pick the project you're proudest of. What was the problem, and what exactly was your role?",
      "Walk me through one key design decision on that project. What options did you consider and why did you land where you did?",
      "How did you know the design worked? What changed for users or the business?",
      "Tell me about a project that didn't go as planned. What did you learn?",
    ],
    demoFollowups: [
      "You mentioned the team — which parts were you personally accountable for?",
      "What data or research backed that decision?",
    ],
  },
  {
    id: "case-study",
    title: "Case-study presentation",
    blurb: "Deep-dive on one project, end to end: problem, research, iterations, outcome.",
    duration: "~25 min",
    contextLabel: "Which case study are you presenting?",
    contextPlaceholder: "e.g. Redesigning the purchase-order flow for an internal ERP used by 15+ business units",
    interviewerBrief:
      "a single case-study deep dive. Go deep on one project: the problem and constraints, research, how insights shaped design, iterations and rejected directions, tradeoffs, stakeholder conflict, measurable outcomes and reflection.",
    dimensions: ["Storytelling & structure", "Problem framing", "Research & insight", "Process & rationale", "Impact & outcomes", "Communication clarity"],
    demoQuestions: [
      "Set the stage for me: what was the product, who were the users, and what problem were you solving?",
      "What did you learn from research, and how did it change your direction?",
      "Show me how the design evolved. What did you try that didn't make it?",
      "What was the hardest tradeoff you had to make, and who disagreed?",
      "What was the outcome, and what would you do differently now?",
    ],
    demoFollowups: [
      "How did you measure that improvement?",
      "What constraint shaped that decision most?",
    ],
  },
  {
    id: "app-critique",
    title: "App critique",
    blurb: "Critique a real product live: usability, visual design, business goals and what you'd change.",
    duration: "~15 min",
    contextLabel: "Which app or flow should you critique? (leave blank to be assigned one)",
    contextPlaceholder: "e.g. Swiggy checkout, Google Maps offline mode, Notion onboarding",
    interviewerBrief:
      "a live app critique. Ask the candidate to critique a real product flow. Push for structure (who is the user, what is the goal), specific usability and visual observations, business intent behind choices, prioritisation of issues and concrete redesign ideas.",
    dimensions: ["Structure of critique", "User & goal framing", "Usability depth", "Visual & interaction craft", "Business awareness", "Prioritised recommendations"],
    demoQuestions: [
      "Let's critique an app you use often. Before judging anything, who do you think its primary user is and what are they trying to do?",
      "Walk me through the core flow. What works well, and why?",
      "What are the biggest usability problems you see?",
      "Why do you think the team designed it this way? What business goal might be behind it?",
      "If you could ship only one change next sprint, what would it be and how would you measure it?",
    ],
    demoFollowups: ["How would you validate that assumption?", "Which of those issues matters most, and why?"],
  },
  {
    id: "design-challenge",
    title: "Design challenge",
    blurb: "Solve an open-ended prompt out loud: clarify, explore, decide and defend.",
    duration: "~25 min",
    contextLabel: "Any domain you want the challenge in? (optional)",
    contextPlaceholder: "e.g. B2B procurement, fintech, healthcare, or leave blank",
    interviewerBrief:
      "a whiteboard-style design challenge. Give the candidate one open-ended product prompt in the first question, then guide them through clarifying requirements, users, ideation, flows, tradeoffs, edge cases and success metrics. Reward clarifying questions and explicit tradeoffs.",
    dimensions: ["Clarifying requirements", "User & problem framing", "Ideation breadth", "Flow & interaction thinking", "Tradeoffs & edge cases", "Success metrics"],
    demoQuestions: [
      "Here's your challenge: design a way for a small manufacturer to compare quotes from multiple suppliers. Start wherever you like — what would you want to know first?",
      "Who are the key users here, and what does success look like for each?",
      "Sketch out the main flow for me verbally. What are the key screens or steps?",
      "What are the riskiest edge cases, and how does your design handle them?",
      "How would you measure whether this worked after launch?",
    ],
    demoFollowups: ["What would you cut if you only had two weeks?", "What alternative did you consider and reject?"],
  },
];

export const kindById = (id: string) => KINDS.find((k) => k.id === id) ?? KINDS[0];

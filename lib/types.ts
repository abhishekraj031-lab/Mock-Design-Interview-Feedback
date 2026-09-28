export type InterviewKind = "pd-interview" | "portfolio" | "case-study" | "app-critique" | "design-challenge";
export type Level = "Junior" | "Mid-level" | "Senior" | "Lead / Principal";

export interface InterviewConfig {
  kind: InterviewKind;
  level: Level;
  company?: string;
  context?: string; // project to present, app to critique, etc.
  mainQuestions: number;
  plannedQuestions?: { id: string; text: string; competency: string }[];
}

export interface Turn {
  role: "interviewer" | "candidate";
  text: string;
  qType?: "main" | "followup" | "closing";
  qid?: string; // question-bank id for planned main questions
  competency?: string;
  startedAt?: number;
  durationSec?: number;
}

export interface Frame {
  qIndex: number; // index of the interviewer turn being answered
  dataUrl: string; // jpeg data url
}

export interface SpeechStats {
  totalWords: number;
  speakingSec: number;
  wpm: number;
  fillers: Record<string, number>;
  fillerTotal: number;
}

export interface Report {
  demo?: boolean;
  overall: { score: number; verdict: string; summary: string };
  dimensions: { name: string; score: number; comment: string }[];
  presence: { score: number | null; observations: string[]; tips: string[] };
  questions: {
    question: string;
    score: number;
    answerSummary: string;
    wentWell: string[];
    toImprove: { point: string; evidence?: string }[];
    betterAnswer: string;
    modelAnswer?: string;
    keyPoints?: string[];
    level?: string; // seniority the answer demonstrates
    levelNote?: string;
  }[];
  strengths: string[];
  topActions: string[];
}

export interface Session {
  id: string;
  userEmail: string;
  createdAt: number;
  config: InterviewConfig;
  turns: Turn[];
  stats?: SpeechStats;
  status: "in-progress" | "grading" | "done" | "error";
  report?: Report;
  hasVideo?: boolean;
  error?: string;
}

import { Annotation } from "@langchain/langgraph";

export interface TranscriptEntry {
  question: string;
  answer: string;
  evaluation: string;
  score: number;
}

export interface ExpressionEntry {
  timestamp: number;
  expression: string;
  confidence: number;
  [key: string]: unknown; // allow extra fields from frontend
}

const replace = <T>(_current: T, update: T): T => update;

const append = <T>(current: T[], update: T[]): T[] => [...current, ...update];

export type InterviewStatus = "in-progress" | "completing" | "done";

const InterviewState = Annotation.Root({
  // interview state  set once never change....

  sessionId: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  resumeText: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  role: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  skills: Annotation<string[]>({
    reducer: replace,
    default: () => [],
  }),

  difficulty: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  round: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  duration: Annotation<number>({
    reducer: replace,
    default: () => 0,
  }),

  /** Derived from duration — 1 question per 2 minutes */
  maxQuestions: Annotation<number>({
    reducer: replace,
    default: () => 0,
  }),

  // ── Running State (changes every iteration)

  currentQuestion: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  currentAnswer: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  questionCount: Annotation<number>({
    reducer: replace,
    default: () => 0,
  }),

  followUpNeeded: Annotation<boolean>({
    reducer: replace,
    default: () => false,
  }),

  followUpContext: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  lastQuestionType: Annotation<"new" | "followup">({
    reducer: replace,
    default: () => "new",
  }),

  // ── History (appended every iteration)

  transcript: Annotation<TranscriptEntry[]>({
    reducer: append,
    default: () => [],
  }),

  // ── Evaluation (updated after every answer)

  lastAnswerScore: Annotation<number>({
    reducer: replace,
    default: () => 0,
  }),

  lastAnswerFeedback: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  lastAnswerStrength: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  lastAnswerWeakness: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  // ── Expression Data (updated in parallel from frontend)

  expressions: Annotation<ExpressionEntry[]>({
    reducer: append,
    default: () => [],
  }),

  // ── Result (set at the end)

  overallScore: Annotation<number>({
    reducer: replace,
    default: () => 0,
  }),

  overallFeedback: Annotation<string>({
    reducer: replace,
    default: () => "",
  }),

  strengths: Annotation<string[]>({
    reducer: replace,
    default: () => [],
  }),

  improvements: Annotation<string[]>({
    reducer: replace,
    default: () => [],
  }),

  status: Annotation<InterviewStatus>({
    reducer: replace,
    default: () => "in-progress",
  }),
});

export type InterviewStateType = typeof InterviewState.State;

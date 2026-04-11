import { InterviewStateType } from "../state.js";

const MINUTES_PER_QUESTION = 2;
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;

/**
 * Derives maxQuestions from duration.
 * Rule: 1 question per 2 minutes, clamped between 3 and 10.
 *
 * Examples:
 *   10 min → 5 questions
 *    4 min → 3 questions  (minimum applied)
 *   30 min → 10 questions (maximum applied)
 */

const deriveMaxQuestions = (duration: number): number => {
  const raw = Math.floor(duration / MINUTES_PER_QUESTION);
  return Math.min(MAX_QUESTIONS, Math.max(raw, MIN_QUESTIONS));
};

export const initializerNode = async (
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> => {
  const { duration } = state;
  const maxQuestions = deriveMaxQuestions(duration);

  console.log(
    `[initializer] duration=${duration}min → maxQuestions=${maxQuestions}`
  );

  return {
    maxQuestions,
    status: "in-progress",
  };
};

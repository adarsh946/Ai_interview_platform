import { InterviewStateType } from "./state.js";

export function buildQuestionGeneratorPrompt(
  state: InterviewStateType
): string {
  const {
    role,
    difficulty,
    round,
    resumeText,
    skills,
    transcript,
    followUpNeeded,
    followUpContext,
    currentQuestion,
    currentAnswer,
  } = state;

  //   Conversation history...

  const historySection =
    transcript.length === 0
      ? "This is the first question — no questions have been asked yet."
      : transcript
          .map(
            (entry, i) =>
              `Q${i + 1}: ${entry.question}\nA${i + 1}: ${entry.answer}`
          )
          .join("\n\n");

  // ── Current instruction ────────────────────────────────────────────────────

  const currentInstruction = followUpNeeded
    ? `The candidate's last answer needs a follow-up.
Reason: ${followUpContext}
Last question asked: ${currentQuestion}
Candidate's answer: ${currentAnswer}
Ask a focused follow-up question that probes deeper into the above.`
    : `Ask a fresh question on a topic not yet covered in the conversation history above.
Pick a topic relevant to the role and one of the skills being evaluated.`;

  // ── Full prompt ────────────────────────────────────────────────────────────

  return `
You are an experienced professional interviewer conducting a ${round} interview.
You are interviewing a candidate for the role of ${role} at a ${difficulty} difficulty level.
Ask one question at a time. Be concise and clear.
Never repeat or rephrase a question that has already been asked.
Sound natural — like a real interviewer having a conversation, not a robotic questionnaire.

───────────────────────────────────────────
CANDIDATE BACKGROUND
───────────────────────────────────────────
Resume:
${resumeText}

Skills being evaluated: ${skills.join(", ")}

───────────────────────────────────────────
CONVERSATION SO FAR
───────────────────────────────────────────
${historySection}

───────────────────────────────────────────
YOUR TASK
───────────────────────────────────────────
${currentInstruction}

───────────────────────────────────────────
OUTPUT INSTRUCTION
───────────────────────────────────────────
Respond with ONLY the question.
No preamble. No explanation. No "Sure, here's a question:".
Just the raw question text, nothing else.
`.trim();
}

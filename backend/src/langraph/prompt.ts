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

// ─── Evaluator Prompt ─────────────────────────────────────────────────────────

export function buildEvaluatorPrompt(state: InterviewStateType): string {
  const { role, difficulty, round, skills, currentQuestion, currentAnswer } =
    state;

  return `
You are a strict but fair interview evaluator.
You are evaluating a candidate interviewing for the role of ${role}.
Round type: ${round}
Difficulty level: ${difficulty}
 
Calibrate your scoring to the difficulty level — the same answer should score
higher for a junior role and lower for a senior role. A vague but directionally
correct answer might earn a 7 at junior level but only a 4 at senior level.
 
───────────────────────────────────────────
EVALUATION INPUT
───────────────────────────────────────────
Question asked:
${currentQuestion}
 
Candidate's answer:
${currentAnswer}
 
Skills being evaluated: ${skills.join(", ")}
 
───────────────────────────────────────────
WHAT TO EVALUATE
───────────────────────────────────────────
Completeness — did the candidate fully answer the question or leave parts unaddressed?
Relevance    — was the answer relevant to the role and the skills being evaluated?
Depth        — did they go deep enough for a ${difficulty} level candidate?
Clarity      — was the answer clear, structured, and easy to follow?
 
───────────────────────────────────────────
FOLLOW-UP DECISION
───────────────────────────────────────────
Set "followUpNeeded" to true if ANY of the following apply:
  - The answer was vague or incomplete
  - The answer missed a critical concept expected at ${difficulty} level
  - The answer would benefit from deeper probing to fairly assess the candidate
 
Set "followUpNeeded" to false if:
  - The answer was complete and satisfactory for ${difficulty} level
  - The topic is sufficiently covered and a new question would be more valuable
 
───────────────────────────────────────────
OUTPUT INSTRUCTION
───────────────────────────────────────────
Respond in strict JSON format. No preamble. No explanation. No markdown code fences.
Just the raw JSON object, nothing else.
 
{
  "score": <number between 0 and 10>,
  "feedback": "<brief overall feedback on the answer>",
  "strength": "<what was good about the answer>",
  "weakness": "<what was missing or weak>",
  "followUpNeeded": <true | false>,
  "followUpContext": "<if followUpNeeded is true, explain what to probe deeper — empty string if false>"
}
`.trim();
}

export function buildResultGeneratorPrompt(state: InterviewStateType): string {
  const { role, difficulty, round, skills, transcript, questionCount } = state;

  // ── Average score ──────────────────────────────────────────────────────────

  const averageScore =
    transcript.length > 0
      ? (
          transcript.reduce((sum, entry) => sum + entry.score, 0) /
          transcript.length
        ).toFixed(1)
      : "0.0";

  // ── Formatted transcript ───────────────────────────────────────────────────

  const formattedTranscript = transcript
    .map(
      (entry, i) => `Q${i + 1}: ${entry.question}
A${i + 1}: ${entry.answer}
Evaluation: ${entry.evaluation}
Score: ${entry.score}/10`
    )
    .join("\n\n");

  // ── Full prompt ────────────────────────────────────────────────────────────

  return `
You are an expert interview assessor delivering a final evaluation report.
You have just reviewed a complete ${round} interview for the role of ${role} at ${difficulty} level.
Skills that were evaluated: ${skills.join(", ")}
Total questions asked: ${questionCount}
 
───────────────────────────────────────────
FULL INTERVIEW TRANSCRIPT
───────────────────────────────────────────
${formattedTranscript}
 
───────────────────────────────────────────
SCORE REFERENCE
───────────────────────────────────────────
Average score across all answers: ${averageScore}/10
Use this as a reference point, but apply your own holistic judgment —
weigh harder questions more, and account for improvement or decline across the interview.
 
───────────────────────────────────────────
YOUR TASK
───────────────────────────────────────────
Generate a comprehensive final evaluation of the candidate based on the full transcript above.
Your evaluation should:
  - Reflect performance across the entire interview, not just individual answers
  - Be calibrated to ${difficulty} level expectations — be honest and precise
  - Highlight 2-4 concrete strengths with specific evidence from the interview
  - Highlight 2-4 concrete areas for improvement with actionable guidance
  - Write the overall feedback as a coherent paragraph, not a list
 
───────────────────────────────────────────
OUTPUT INSTRUCTION
───────────────────────────────────────────
Respond in strict JSON format. No preamble. No explanation. No markdown code fences.
Just the raw JSON object, nothing else.
 
{
  "overallScore": <number between 0 and 10>,
  "overallFeedback": "<comprehensive paragraph summarising the candidate's overall performance>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"]
}
`.trim();
}

// import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { EvaluationSchema } from "../../types/schema.js";
import { buildEvaluatorPrompt } from "../prompt.js";
import { InterviewStateType } from "../state.js";
import { HumanMessage } from "@langchain/core/messages";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Evaluator node — scores the candidate's latest answer.
 *
 * Uses structured output so the response is automatically parsed and typed —
 * no manual JSON parsing needed.
 *
 * Appends one entry to `transcript` (the append reducer handles merging).
 * Sets follow-up fields so the router and question generator know what to do next.
 */

export async function evaluatorNode(
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> {
  // const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });

  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.7,
  });
  const structuredLLM = llm.withStructuredOutput(EvaluationSchema);

  const { currentQuestion, currentAnswer } = state;

  const prompt = buildEvaluatorPrompt(state);
  const result = await structuredLLM.invoke([new HumanMessage(prompt)]);

  console.log(
    `[evaluator] score=${result.score} followUpNeeded=${result.followUpNeeded}`
  );

  return {
    lastAnswerScore: Number(result.score),
    lastAnswerFeedback: result.feedback,
    lastAnswerStrength: result.strength,
    lastAnswerWeakness: result.weakness,
    followUpNeeded: result.followUpNeeded,
    followUpContext: result.followUpContext,
    // Single-item array — the append reducer adds it to the existing transcript
    transcript: [
      {
        question: currentQuestion,
        answer: currentAnswer,
        evaluation: result.feedback,
        score: Number(result.score),
      },
    ],
  };
}

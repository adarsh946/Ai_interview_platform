import { ChatOpenAI } from "@langchain/openai";
import { ResultSchema } from "../../types/schema.js";
import { InterviewStateType } from "../state.js";
import { buildResultGeneratorPrompt } from "../prompt.js";
import { HumanMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });
const structuredLLM = llm.withStructuredOutput(ResultSchema);

/**
 * Result Generator node — runs once at the very end of the interview.
 *
 * Receives the full transcript and generates a comprehensive final evaluation.
 * Sets status to "done" to signal the graph has completed.
 */
export async function resultGeneratorNode(
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> {
  const prompt = buildResultGeneratorPrompt(state);
  const result = await structuredLLM.invoke([new HumanMessage(prompt)]);

  console.log(
    `[resultGenerator] overallScore=${result.overallScore} strengths=${result.strengths.length} improvements=${result.improvements.length}`
  );

  return {
    overallScore: result.overallScore,
    overallFeedback: result.overallFeedback,
    strengths: result.strengths,
    improvements: result.improvements,
    status: "done",
  };
}

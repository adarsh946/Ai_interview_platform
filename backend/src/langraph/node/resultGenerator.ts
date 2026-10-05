// import { ChatOpenAI } from "@langchain/openai";
import { ResultSchema } from "../../types/schema.js";
import { InterviewStateType } from "../state.js";
import { buildResultGeneratorPrompt } from "../prompt.js";
import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatGroq } from "@langchain/groq";

/**
 * Result Generator node — runs once at the very end of the interview.
 *
 * Receives the full transcript and generates a comprehensive final evaluation.
 * Sets status to "done" to signal the graph has completed.
 */
export async function resultGeneratorNode(
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> {
  // const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.3 });

  // const llm = new ChatGroq({
  //   model: "llama3-8b-8192", // smaller, always available on free tier
  //   apiKey: process.env.GROQ_API_KEY,
  //   temperature: 0.3,
  // });

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });

  const structuredLLM = llm.withStructuredOutput(ResultSchema);
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

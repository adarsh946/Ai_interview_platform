import { ChatOpenAI } from "@langchain/openai";
import { buildQuestionGeneratorPrompt } from "../prompt.js";
import { InterviewStateType } from "../state.js";
import { HumanMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

/**
 * Question Generator node — generates the next interview question.
 *
 * Asks a follow-up if `followUpNeeded` is true, otherwise picks a fresh topic.
 * Only increments `questionCount` for new questions, not follow-ups.
 *
 * After this node returns, the graph interrupts and waits for the
 * candidate's answer — the interrupt is handled at the graph level,
 * not here.
 */

export async function questionGeneratorNode(
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> {
  const { followUpNeeded, questionCount } = state;

  const prompt = buildQuestionGeneratorPrompt(state);
  const response = await llm.invoke([new HumanMessage(prompt)]);

  const currentQuestion =
    typeof response.content === "string"
      ? response.content.trim()
      : (response.content[0] as { text: string }).text.trim();

  console.log(
    `[questionGenerator] type=${
      followUpNeeded ? "followup" : "new"
    } count=${questionCount} question="${currentQuestion}"`
  );

  return {
    currentQuestion,
    lastQuestionType: followUpNeeded ? "followup" : "new",
    questionCount: followUpNeeded ? questionCount : questionCount + 1,
  };
}

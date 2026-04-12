import { interrupt } from "@langchain/langgraph";
import { InterviewStateType } from "../state.js";

export async function waitForAnswerNode(
  state: InterviewStateType
): Promise<Partial<InterviewStateType>> {
  const { currentQuestion } = state;

  const answer = interrupt(currentQuestion) as string;
  return { currentAnswer: answer };
}

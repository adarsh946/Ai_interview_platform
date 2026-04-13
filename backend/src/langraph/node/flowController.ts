import { InterviewStateType } from "../state.js";

export function flowController(state: InterviewStateType) {
  if (state.status === "completing") return "resultGenerator";
  else if (state.questionCount >= state.maxQuestions) return "resultGenerator";
  else {
    return "questionGenerator";
  }
}

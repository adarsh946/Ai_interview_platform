import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { InterviewState } from "./state.js";
import { evaluatorNode } from "./node/evaluator.js";
import { initializerNode } from "./node/initializer.js";
import { questionGeneratorNode } from "./node/questionGeneration.js";
import { resultGeneratorNode } from "./node/resultGenerator.js";
import { waitForAnswerNode } from "./node/waitForAnswer.js";
import { flowController } from "./node/flowController.js";

import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import { createClient } from "redis";

// Create separate redis client for LangGraph
const checkpointRedis = createClient({
  url: process.env.UPSTASH_REDIS_URL, // rediss:// format
});

await checkpointRedis.connect();

// // RedisSaver persists state between interrupts so the graph can resume
// // across socket reconnects or server restarts

// const checkpointer = new MemorySaver();

// // ─── Graph Definition

// const workflow = new StateGraph(InterviewState);

// // All nodes...

// workflow.addNode("initializer", initializerNode);
// workflow.addNode("questionGenerator", questionGeneratorNode);
// workflow.addNode("waitForAnswer", waitForAnswerNode);
// workflow.addNode("evaluator", evaluatorNode);
// workflow.addNode("resultGenerator", resultGeneratorNode);

// // Direct edges

// // @ts-ignore
// workflow.addEdge(START, "initializer"); // graph entry point
// // @ts-ignore
// workflow.addEdge("initializer", "questionGenerator"); // setup → first question
// // @ts-ignore
// workflow.addEdge("questionGenerator", "waitForAnswer"); // question ready → wait for candidate
// // @ts-ignore
// workflow.addEdge("waitForAnswer", "evaluator"); // answer received → evaluate
// // @ts-ignore
// workflow.addEdge("resultGenerator", END); // final result → graph done

// // ── Conditional edge

// // After every evaluation, flowController decides:
// //   → "questionGenerator"  if there are more questions to ask
// //   → "resultGenerator"    if the interview is complete
// // @ts-ignore
// workflow.addConditionalEdges("evaluator", flowController, {
//   questionGenerator: "questionGenerator",
//   resultGenerator: "resultGenerator",
// });

// // ─── Compile

// // interruptBefore "waitForAnswer" pauses the graph after the question is
// // written to state, giving the socket handler time to read currentQuestion
// // and send it to the frontend before resuming with the candidate's answer
// export const interviewGraph = workflow.compile({
//   checkpointer, // @ts-ignore
//   interruptBefore: ["waitForAnswer"],
// });

export function createInterviewGraph() {
  const checkpointer = new MemorySaver();
  const workflow = new StateGraph(InterviewState);

  // All nodes...

  workflow.addNode("initializer", initializerNode);
  workflow.addNode("questionGenerator", questionGeneratorNode);
  workflow.addNode("waitForAnswer", waitForAnswerNode);
  workflow.addNode("evaluator", evaluatorNode);
  workflow.addNode("resultGenerator", resultGeneratorNode);

  // Direct edges

  // @ts-ignore
  workflow.addEdge(START, "initializer"); // graph entry point
  // @ts-ignore
  workflow.addEdge("initializer", "questionGenerator"); // setup → first question
  // @ts-ignore
  workflow.addEdge("questionGenerator", "waitForAnswer"); // question ready → wait for candidate
  // @ts-ignore
  workflow.addEdge("waitForAnswer", "evaluator"); // answer received → evaluate
  // @ts-ignore
  workflow.addEdge("resultGenerator", END); // final result → graph done

  // ── Conditional edge

  // After every evaluation, flowController decides:
  //   → "questionGenerator"  if there are more questions to ask
  //   → "resultGenerator"    if the interview is complete
  // @ts-ignore
  workflow.addConditionalEdges("evaluator", flowController, {
    questionGenerator: "questionGenerator",
    resultGenerator: "resultGenerator",
  });

  // ─── Compile

  // interruptBefore "waitForAnswer" pauses the graph after the question is
  // written to state, giving the socket handler time to read currentQuestion
  // and send it to the frontend before resuming with the candidate's answer
  return workflow.compile({
    checkpointer, // @ts-ignore
    interruptBefore: ["waitForAnswer"],
  });
}

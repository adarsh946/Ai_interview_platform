import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection.js";

export const resumeQueue = new Queue("resume-queue", {
  connection: redisConnection,
});

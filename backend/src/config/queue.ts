import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const resumeQueue = new Queue("resume-queue", {
  connection: redisConnection,
});

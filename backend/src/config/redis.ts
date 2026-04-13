import { createClient } from "redis";

export const redis = createClient({
  url: process.env.UPSTASH_REDIS_URL,
});

redis.on("connect", () => console.log("[redis] connected to Upstash"));
redis.on("error", (err) => console.error("[redis] error:", err.message));

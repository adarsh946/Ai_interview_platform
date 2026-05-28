import { createClient } from "redis";

export const redis = createClient({
  url: process.env.UPSTASH_REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Too many retries");
      return Math.min(retries * 100, 3000); // wait up to 3s between retries
    },
    keepAlive: true, // send keepalive every 5s
  },
});

redis.on("connect", () => console.log("[redis] connected to Upstash"));
redis.on("error", (err) => console.error("[redis] error:", err.message));
redis.on("reconnecting", () => console.log("[redis] reconnecting..."));

await redis.connect();

console.log("[redis] connect() completed");

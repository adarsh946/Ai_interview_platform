import { createClient } from "redis";

export const redis = createClient({
  url: process.env.UPSTASH_REDIS_URL,
  socket: {
    reconnectStrategy: (retries: any) => {
      if (retries > 10) return new Error("Too many retries");
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
  } as any,
});

redis.on("connect", () => {
  console.log("[redis] connected to Upstash");
  // @ts-ignore
  redis.socket?.setKeepAlive?.(true, 10000);
});
redis.on("error", (err) => console.error("[redis] error:", err.message));
redis.on("reconnecting", () => console.log("[redis] reconnecting..."));

await redis.connect();
console.log("[redis] connect() completed");

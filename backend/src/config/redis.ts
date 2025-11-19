import { RedisOptions } from "ioredis";

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

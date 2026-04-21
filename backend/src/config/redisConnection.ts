export const redisConnection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT || "6380"),
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
  },
};

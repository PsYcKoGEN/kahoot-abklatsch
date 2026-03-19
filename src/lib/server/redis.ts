import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export function getRedis() {
  if (redisInstance) {
    return redisInstance;
  }

  const url =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Upstash Redis Umgebungsvariablen fehlen. Erwartet wird entweder " +
        "UPSTASH_REDIS_REST_KV_REST_API_URL und UPSTASH_REDIS_REST_KV_REST_API_TOKEN " +
        "oder UPSTASH_REDIS_REST_URL und UPSTASH_REDIS_REST_TOKEN."
    );
  }

  redisInstance = new Redis({
    url,
    token,
  });

  return redisInstance;
}
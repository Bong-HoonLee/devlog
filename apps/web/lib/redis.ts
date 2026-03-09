import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { RATE_LIMIT } from "./config";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT.MAX_REQUESTS, RATE_LIMIT.WINDOW),
      analytics: true,
    })
  : null;

import Redis from "ioredis";
import { config } from "../config";

// This connection is used by BullMQ for queues and workers.
export const redisConnection = new Redis(config.redis.port, config.redis.host, {
  password: config.redis.password,
  maxRetriesPerRequest: null, // Important for BullMQ
});

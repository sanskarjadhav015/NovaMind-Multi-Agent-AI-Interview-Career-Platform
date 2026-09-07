/**
 * @file redis.js (Shared Infrastructure)
 * @description Centralized Redis client instance using `ioredis`.
 * Provides caching, session storage, and rate-limiting support across microservices.
 * Includes automatic reconnection with exponential backoff and connection error monitoring.
 */

import Redis from "ioredis";

// Fall back to default local Redis port if environment variable is unspecified
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Shared Redis client instance.
 * Configured with null maxRetriesPerRequest to allow persistent queuing during brief outages.
 */
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
        // Exponential backoff capped at 3000ms
        return Math.min(times * 100, 3000);
    }
});

// Redis connection error event listener
redis.on("error", (err) => {
    console.warn("⚠️ Redis Connection Warning:", err.message);
});

// Redis connection success event listener
redis.on("connect", () => {
    console.log(" Connected to Redis");
});

export default redis;
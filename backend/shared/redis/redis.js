/**
 * @file redis.js (Shared Infrastructure)
 * @description Centralized, production-hardened Redis client using `ioredis`.
 * Features bounded retries, command timeouts, connection health checks,
 * memory usage inspection, and graceful shutdown capabilities.
 */

import Redis from "ioredis";

// Fall back to default local Redis port if environment variable is unspecified
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const MAX_RETRY_ATTEMPTS = 10;

/**
 * Shared Redis client instance.
 * Configured with bounded retries and explicit timeouts to prevent memory exhaustion and hanging requests.
 */
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    commandTimeout: 4000,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
        if (times > MAX_RETRY_ATTEMPTS) {
            console.error(`[Redis] Max reconnect attempts (${MAX_RETRY_ATTEMPTS}) reached. Halting reconnect.`);
            return null; // Stop reconnecting after max attempts
        }
        // Exponential backoff with jitter capped at 3000ms
        const delay = Math.min(times * 150 + Math.floor(Math.random() * 100), 3000);
        return delay;
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

redis.on("close", () => {
    console.log("ℹ️ Redis connection closed");
});

/**
 * Checks Redis health and roundtrip response latency.
 * Safe helper for readiness probes and monitoring.
 * @returns {Promise<{healthy: boolean, status: string, latencyMs?: number, error?: string}>}
 */
export async function isRedisHealthy() {
    if (!redis) {
        return { healthy: false, status: "uninitialized" };
    }
    const start = Date.now();
    try {
        const reply = await redis.ping();
        const latencyMs = Date.now() - start;
        return {
            healthy: reply === "PONG",
            status: reply === "PONG" ? "ready" : "unexpected_reply",
            latencyMs
        };
    } catch (err) {
        return {
            healthy: false,
            status: "error",
            error: err.message
        };
    }
}

/**
 * Safely fetches Redis memory metrics for capacity monitoring.
 * @returns {Promise<{usedMemoryHuman?: string, peakMemoryHuman?: string, error?: string}>}
 */
export async function getRedisMemoryInfo() {
    try {
        if (typeof redis.info !== "function") return { error: "INFO command unavailable" };
        const rawInfo = await redis.info("memory");
        const lines = rawInfo.split("\r\n");
        const metrics = {};
        for (const line of lines) {
            const [k, v] = line.split(":");
            if (k && v) metrics[k.trim()] = v.trim();
        }
        return {
            usedMemoryHuman: metrics["used_memory_human"] || "unknown",
            peakMemoryHuman: metrics["used_memory_peak_human"] || "unknown"
        };
    } catch (err) {
        return { error: err.message };
    }
}

/**
 * Gracefully disconnects the Redis client instance.
 * @returns {Promise<void>}
 */
export async function closeRedis() {
    try {
        if (redis && redis.status !== "end") {
            await redis.quit();
        }
    } catch (err) {
        console.warn("Error during Redis disconnect:", err.message);
    }
}

export default redis;

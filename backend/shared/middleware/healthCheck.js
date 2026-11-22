/**
 * @file healthCheck.js (Shared Middleware)
 * @description Standardized liveness and readiness health check endpoints for microservices.
 * Supports Kubernetes/ECS probes with dependency checking (MongoDB, Redis, Qdrant)
 * without leaking sensitive credentials or internal topology.
 */

import express from "express";

/**
 * Creates a standardized health router for a microservice.
 * 
 * @param {object} options
 * @param {string} options.serviceName - Name of the microservice
 * @param {object} [options.mongoose] - Mongoose instance to verify database connection
 * @param {Function} [options.redisCheck] - Function returning Promise<{healthy: boolean}>
 * @param {Function} [options.qdrantCheck] - Function returning Promise<boolean>
 * @returns {import("express").Router}
 */
export function createHealthRouter({
    serviceName = "Service",
    mongoose = null,
    redisCheck = null,
    qdrantCheck = null
} = {}) {
    const router = express.Router();

    // 1. General health summary
    router.get("/", (req, res) => {
        res.status(200).json({
            status: "healthy",
            service: serviceName,
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime())
        });
    });

    // 2. Liveness probe (checks process is alive)
    router.get("/live", (req, res) => {
        res.status(200).json({
            status: "alive",
            service: serviceName,
            uptimeSeconds: Math.floor(process.uptime())
        });
    });

    // 3. Readiness probe (checks operational dependencies)
    router.get("/ready", async (req, res) => {
        const checks = {};
        let isReady = true;

        // Check MongoDB connection
        if (mongoose) {
            // readyState: 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
            const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
            checks.database = dbReady ? "connected" : "disconnected";
            if (!dbReady) isReady = false;
        }

        // Check Redis connectivity
        if (typeof redisCheck === "function") {
            try {
                const redisStatus = await redisCheck();
                checks.redis = redisStatus.healthy ? "connected" : "unreachable";
                // Note: non-critical Redis read cache does not fail readiness unless fail-closed
            } catch (err) {
                checks.redis = "error";
            }
        }

        // Check Qdrant vector store
        if (typeof qdrantCheck === "function") {
            try {
                const qdrantOk = await qdrantCheck();
                checks.vectorDb = qdrantOk ? "connected" : "fallback";
            } catch (err) {
                checks.vectorDb = "error";
            }
        }

        const statusCode = isReady ? 200 : 503;
        res.status(statusCode).json({
            status: isReady ? "ready" : "degraded",
            service: serviceName,
            timestamp: new Date().toISOString(),
            checks
        });
    });

    return router;
}

export default createHealthRouter;

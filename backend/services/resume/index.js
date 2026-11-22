/**
 * @file index.js (Resume Service)
 * @description Microservice entry point for resume upload, parsing, and ATS scoring.
 */

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import resumeRouter from "./routes/resume.route.js";
import { verifyInternalSecret } from "../../shared/middleware/verifyInternalSecret.js";
import { requestLogger } from "../../shared/middleware/requestLogger.js";
import { createHealthRouter } from "../../shared/middleware/healthCheck.js";
import { isRedisHealthy } from "../../shared/redis/redis.js";
import defaultQdrantClient from "../../shared/rag/qdrantClient.js";

const app = express();

app.use(requestLogger("Resume"));

// Health checks for container orchestrator
app.use("/health", createHealthRouter({
    serviceName: "Resume",
    mongoose,
    redisCheck: isRedisHealthy,
    qdrantCheck: () => defaultQdrantClient.ping()
}));

app.use(verifyInternalSecret);
app.use(express.json());

const PORT = process.env.PORT || 6002;

// Health & Root Endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Resume Service",
        status: "active"
    });
});

// Mount resume routes
app.use("/", resumeRouter);

// Start server and initialize database
app.listen(PORT, () => {
    console.log(`📄 Resume service listening on port ${PORT}`);
    connectDB();
});

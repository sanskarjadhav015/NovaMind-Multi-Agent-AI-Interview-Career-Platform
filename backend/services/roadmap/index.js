/**
 * @file index.js (Roadmap Service)
 * @description Microservice entry point for career roadmap synthesis and resource curation.
 */

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import roadmapRouter from "./routes/roadmap.route.js";
import { verifyInternalSecret } from "../../shared/middleware/verifyInternalSecret.js";
import { requestLogger } from "../../shared/middleware/requestLogger.js";
import { createHealthRouter } from "../../shared/middleware/healthCheck.js";
import { isRedisHealthy } from "../../shared/redis/redis.js";

dotenv.config();

const app = express();

app.use(requestLogger("Roadmap"));

// Health checks for container orchestrator
app.use("/health", createHealthRouter({
    serviceName: "Roadmap",
    mongoose,
    redisCheck: isRedisHealthy
}));

app.use(verifyInternalSecret);
app.use(express.json());

const PORT = process.env.PORT || 6004;

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Roadmap Service",
        status: "active"
    });
});

// Mount roadmap routes
app.use("/", roadmapRouter);

// Start server and initialize database
app.listen(PORT, () => {
    console.log(`🗺️ Roadmap service listening on port ${PORT}`);
    connectDB();
});

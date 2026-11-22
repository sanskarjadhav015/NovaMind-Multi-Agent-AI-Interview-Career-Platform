/**
 * @file index.js (Auth Service)
 * @description Microservice entry point for authentication and user management.
 */

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDB } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";
import { verifyInternalSecret } from "../../shared/middleware/verifyInternalSecret.js";
import { requestLogger } from "../../shared/middleware/requestLogger.js";
import { createHealthRouter } from "../../shared/middleware/healthCheck.js";
import { isRedisHealthy } from "../../shared/redis/redis.js";

dotenv.config();

const app = express();

app.use(requestLogger("Auth"));

// Unauthenticated health probes for orchestrator (ECS/Docker/K8s)
app.use("/health", createHealthRouter({
    serviceName: "Auth",
    mongoose,
    redisCheck: isRedisHealthy
}));

app.use(verifyInternalSecret);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 6001;

// Service Health & Root Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Auth Service",
        status: "active"
    });
});

// Authentication routes
app.use("/", authRouter);

// Start server and connect to MongoDB
app.listen(PORT, () => {
    console.log(`🔐 Auth service listening on port ${PORT}`);
    connectDB();
});

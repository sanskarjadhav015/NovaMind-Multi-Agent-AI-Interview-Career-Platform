/**
 * @file index.js (Billing Service)
 * @description Microservice entry point for Razorpay payments and billing history.
 */

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import billingRouter from "./routes/billing.route.js";
import { verifyInternalSecret } from "../../shared/middleware/verifyInternalSecret.js";
import { requestLogger } from "../../shared/middleware/requestLogger.js";
import { createHealthRouter } from "../../shared/middleware/healthCheck.js";
import { isRedisHealthy } from "../../shared/redis/redis.js";

dotenv.config();

const app = express();

app.use(requestLogger("Billing"));

// Unauthenticated health check for orchestrator
app.use("/health", createHealthRouter({
    serviceName: "Billing",
    mongoose,
    redisCheck: isRedisHealthy
}));

app.use(verifyInternalSecret);
app.use(express.json());

const PORT = process.env.PORT || 6005;

// Root Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Billing Service",
        status: "active"
    });
});

// Mount billing routes
app.use("/", billingRouter);

// Start server and initialize database
app.listen(PORT, () => {
    console.log(`💳 Billing service listening on port ${PORT}`);
    connectDB();
});

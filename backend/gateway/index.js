/**
 * @file index.js (Gateway Service)
 * @description Central API Gateway for the NovaMind AI Interview Platform.
 * Acts as the single entry point for all client requests, routing traffic
 * to microservices (Auth, Resume, Interview, Roadmap, Billing). Handles
 * CORS, request logging, session cookie validation, and header enrichment.
 */

import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";

// Load environment configurations
dotenv.config();

const app = express();

// Parse JSON request bodies for gateway-handled routes
app.use(express.json());

// Allowed origins for cross-origin resource sharing
const allowedOrigins = [
    process.env.FRONTEND_URL
].filter(Boolean);

// CORS configuration allowing credentials (cookies) from trusted origins
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// Request logging in development format
app.use(morgan("dev"));

// Cookie parsing middleware for session-based auth
app.use(cookieParser());

const PORT = process.env.PORT || 8000;

// Gateway Root & Health Check Endpoints
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "NovaMind AI Gateway is running",
        timestamp: new Date()
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
});

// ==========================================
// Microservice Reverse Proxy Routes
// ==========================================

// Public Auth Service proxy
app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL));

// Protected Services
app.use(
    "/api/resume",
    isAuth,
    proxyWithHeaders(process.env.RESUME_SERVICE_URL)
);

app.use(
    "/api/interview",
    isAuth,
    proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL)
);

app.use(
    "/api/roadmap",
    isAuth,
    proxyWithHeaders(process.env.ROADMAP_SERVICE_URL)
);

app.use(
    "/api/billing",
    isAuth,
    proxyWithHeaders(process.env.BILLING_SERVICE_URL)
);

// Get currently authenticated user details from Redis session
app.get("/api/me", isAuth, getCurrentUser);

// Start Gateway Server
app.listen(PORT, () => {
    console.log(`🚀 NovaMind Gateway active on port ${PORT}`);
});
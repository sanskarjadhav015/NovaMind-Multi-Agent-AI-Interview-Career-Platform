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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getCurrentUser } from "./controllers/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";
import { requestLogger } from "../shared/middleware/requestLogger.js";

// Load environment configurations
dotenv.config();

const app = express();

// Terminal request logger
app.use(requestLogger("Gateway"));

// Secure HTTP Headers via Helmet
app.use(helmet({
    contentSecurityPolicy: false, // Managed by frontend host/CDN
    crossOriginEmbedderPolicy: false
}));

// Allowed origins for cross-origin resource sharing
const configuredOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "";
const allowedOrigins = [
    configuredOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

// CORS configuration allowing credentials (cookies) from trusted origins
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalized)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// Request logging in development format
app.use(morgan("dev"));

// Cookie parsing middleware for session-based auth
app.use(cookieParser());

// ==========================================
// Rate Limiting Policies
// ==========================================

// Global Rate Limiter: 500 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests from this IP, please try again later." }
});
app.use(globalLimiter);

// Sensitive Auth Limiter: 15 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts, please try again after 15 minutes." }
});

// AI & Compute-intensive Operations Limiter: 30 requests per 15 minutes per IP
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "AI generation rate limit exceeded. Please try again shortly." }
});

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

// Public Auth Service proxy with auth rate limiting
app.use("/api/auth", authLimiter, proxyWithHeaders(process.env.AUTH_SERVICE_URL));

// Protected Services
app.use(
    "/api/resume",
    isAuth,
    aiLimiter,
    proxyWithHeaders(process.env.RESUME_SERVICE_URL)
);

app.use(
    "/api/interview",
    isAuth,
    aiLimiter,
    proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL)
);

app.use(
    "/api/roadmap",
    isAuth,
    aiLimiter,
    proxyWithHeaders(process.env.ROADMAP_SERVICE_URL)
);

app.use(
    "/api/billing",
    isAuth,
    proxyWithHeaders(process.env.BILLING_SERVICE_URL)
);

// Get currently authenticated user details from Redis session
app.get("/api/me", isAuth, getCurrentUser);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("❌ Gateway Proxy Error:", err.message || err);
    if (!res.headersSent) {
        const isProduction = process.env.NODE_ENV === "production";
        res.status(err.status || 500).json({
            success: false,
            message: isProduction && (!err.status || err.status >= 500)
                ? "An unexpected gateway error occurred"
                : (err.message || "Internal Gateway Error")
        });
    }
});

// Start Gateway Server
app.listen(PORT, () => {
    console.log(`🚀 NovaMind Gateway active on port ${PORT}`);
});
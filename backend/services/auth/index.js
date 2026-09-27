/**
 * @file index.js (Auth Service)
 * @description Microservice entry point for authentication and user management.
 */

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";
import { verifyInternalSecret } from "../../shared/middleware/verifyInternalSecret.js";
import { requestLogger } from "../../shared/middleware/requestLogger.js";

dotenv.config();

const app = express();

app.use(requestLogger("Auth"));
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

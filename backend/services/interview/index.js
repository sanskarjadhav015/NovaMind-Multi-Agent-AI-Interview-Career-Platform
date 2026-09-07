/**
 * @file index.js (Interview Service)
 * @description Microservice entry point for mock interview generation and real-time evaluation.
 */

import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.js";
import interviewRouter from "./routes/interview.route.js";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 6003;

// Root Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Interview Service",
        status: "active"
    });
});

// Mount interview API routes
app.use("/", interviewRouter);

// Start server and initialize database connection
app.listen(PORT, () => {
    console.log(`🎙️ Interview service listening on port ${PORT}`);
    connectDB();
});

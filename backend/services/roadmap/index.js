/**
 * @file index.js (Roadmap Service)
 * @description Microservice entry point for career roadmap synthesis and resource curation.
 */

import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import roadmapRouter from "./routes/roadmap.route.js";

dotenv.config();

const app = express();

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

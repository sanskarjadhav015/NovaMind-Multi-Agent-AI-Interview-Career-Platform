/**
 * @file resume.controller.js (Resume Service)
 * @description Manages resume processing pipeline:
 * PDF Upload (Multer) -> Text Extraction (pdf-parse) -> ATS Analysis (LLM Agent)
 * -> JSON Cleansing & Normalization -> Mongo Persistence -> Redis Caching -> Temp File Cleanup.
 */

import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs";
import mongoose from "mongoose";
import crypto from "crypto";
import { verifyPdfMagicBytes } from "../middleware/multer.js";

let redisClient = null;
try {
    const redisModule = await import("../../../shared/redis/redis.js");
    redisClient = redisModule.default;
} catch (e) {
    console.log("Redis client not available in resume service:", e.message);
}

/**
 * Safely fetches a value from Redis cache.
 * @param {string} key - Redis cache key
 * @returns {Promise<string|null>}
 */
const safeRedisGet = async (key) => {
    try {
        if (redisClient && typeof redisClient.get === "function") {
            return await redisClient.get(key);
        }
    } catch (e) {
        console.warn("Redis get error:", e.message);
    }
    return null;
};

/**
 * Safely sets a value in Redis with TTL.
 * @param {string} key - Redis cache key
 * @param {string} value - Value string
 * @param {number} [ttl=600] - Expiration in seconds
 */
const safeRedisSet = async (key, value, ttl = 600) => {
    try {
        if (redisClient && typeof redisClient.set === "function") {
            await redisClient.set(key, value, "EX", ttl);
        }
    } catch (e) {
        console.warn("Redis set error:", e.message);
    }
};

/**
 * Processes uploaded resume PDF, extracts text, evaluates with ATS LLM agent,
 * saves structured resume in MongoDB, and caches in Redis.
 * 
 * @param {import("express").Request} req - Request with multer req.file and x-user-id header
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const uploadResume = async (req, res) => {
    const file = req.file;
    let deductedCoins = false;
    let idempotencyKey = "";
    let userId = null;

    try {
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF file is required"
            });
        }

        // Validate PDF magic bytes
        if (!verifyPdfMagicBytes(file.path)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file content: The uploaded file is not a valid PDF document."
            });
        }

        userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: A valid User ID is required"
            });
        }

        idempotencyKey = req.body?.idempotencyKey || `resume_upload_${userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

        // Server-side atomic & idempotent coin deduction (10 coins)
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8001";
        let deductData = null;
        try {
            const deductRes = await fetch(`${authUrl}/internal/deduct-coins`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET || ""
                },
                body: JSON.stringify({
                    userId,
                    coins: 10,
                    action: "resume_scorer",
                    idempotencyKey
                }),
                signal: AbortSignal.timeout(8000)
            });

            deductData = await deductRes.json();
            if (!deductRes.ok || !deductData.success) {
                return res.status(deductRes.status === 403 ? 403 : 400).json({
                    success: false,
                    message: deductData.message || "Insufficient interview coins (10 required)",
                    interviewCoin: deductData.interviewCoin
                });
            }
            deductedCoins = true;
        } catch (authErr) {
            console.error("Coin deduction communication error:", authErr.message);
            return res.status(502).json({
                success: false,
                message: "Unable to verify coin balance with Auth service. Please try again shortly."
            });
        }

        // Extract raw text from PDF
        const resumeText = await extractText(file.path);
        if (!resumeText || resumeText.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: "The uploaded PDF appears to be empty or unreadable text."
            });
        }

        // Run ATS Analysis LLM agent
        const aiResponse = await resumeAgent(resumeText);
        const rawContent = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);

        // Clean reasoning traces, markdown fences, and control characters
        let cleanJson = rawContent
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .replace(/```json|```/g, "")
            .trim();

        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        // Clean unescaped control characters
        cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, (match) =>
            match === "\n" || match === "\r" || match === "\t" ? " " : ""
        );

        let resumeData;
        try {
            resumeData = JSON.parse(cleanJson);
        } catch {
            // Apply common repairs: trailing commas, unquoted numbers
            const repaired = cleanJson
                .replace(/:\s*(\d+)"/g, ": $1")
                .replace(/,\s*([\]\}])/g, "$1");
            resumeData = JSON.parse(repaired);
        }

        // Upsert resume document in MongoDB
        let resume = await Resume.findOne({ userId });

        if (resume) {
            const nextVersion = (resume.documentVersion || 1) + 1;
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText,
                documentVersion: nextVersion,
                indexingStatus: "pending"
            });
            await resume.save();
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                documentVersion: 1,
                indexingStatus: "pending",
                ...resumeData
            });
        }

        // Asynchronously index resume into Qdrant vector database with tenant isolation
        try {
            const { indexResumeDocument } = await import("../../../shared/rag/retriever.js");
            const indexRes = await indexResumeDocument({
                userId: resume.userId.toString(),
                documentId: resume._id.toString(),
                text: resumeText,
                documentVersion: resume.documentVersion || 1
            });
            resume.indexingStatus = indexRes.success ? "indexed" : "failed";
            await resume.save();
        } catch (indexErr) {
            console.warn("[ResumeController] RAG indexing error:", indexErr.message);
            resume.indexingStatus = "failed";
            await resume.save();
        }

        // Cache in Redis
        await safeRedisSet(`resume:${userId}`, JSON.stringify(resume));

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume,
            interviewCoin: deductData?.interviewCoin
        });

    } catch (error) {
        console.error("uploadResume Error:", error);

        // Automatic idempotent refund if coins were deducted before failure
        if (deductedCoins) {
            try {
                const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:8001";
                await fetch(`${authUrl}/internal/refund-coins`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET || ""
                    },
                    body: JSON.stringify({
                        userId,
                        coins: 10,
                        reason: "resume_upload_failed",
                        idempotencyKey: `refund_${idempotencyKey}`
                    }),
                    signal: AbortSignal.timeout(8000)
                });
            } catch (refundErr) {
                console.error("Auto-refund error:", refundErr.message);
            }
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process resume"
        });
    } finally {
        // Guaranteed cleanup of uploaded temporary file to prevent disk exhaustion
        if (file && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error("Failed to delete temp file:", err.message);
            }
        }
    }
};

/**
 * Retrieves the candidate's parsed and analyzed resume from Redis cache or MongoDB.
 * 
 * @param {import("express").Request} req - Request with x-user-id header
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getResume = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: A valid User ID is required"
            });
        }

        // Check Redis cache first
        const cache = await safeRedisGet(`resume:${userId}`);
        if (cache) {
            return res.status(200).json({
                success: true,
                source: "redis",
                data: JSON.parse(cache)
            });
        }

        const resume = await Resume.findOne({ userId });
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        // Store back in Redis cache
        await safeRedisSet(`resume:${userId}`, JSON.stringify(resume));

        return res.status(200).json({
            success: true,
            source: "mongoDb",
            data: resume
        });

    } catch (error) {
        console.error("getResume Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve resume"
        });
    }
};

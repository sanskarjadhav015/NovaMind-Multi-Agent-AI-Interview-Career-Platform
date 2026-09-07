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
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF file is required"
            });
        }

        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required"
            });
        }

        // Extract raw text from PDF
        const resumeText = await extractText(file.path);

        // Run ATS Analysis LLM agent
        const aiResponse = await resumeAgent(resumeText);

        // Clean reasoning traces, markdown fences, and control characters
        let cleanJson = aiResponse
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

        const resumeData = JSON.parse(cleanJson);

        // Upsert resume document in MongoDB
        let resume = await Resume.findOne({ userId });

        if (resume) {
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText
            });
            await resume.save();
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData
            });
        }

        // Cache in Redis
        await safeRedisSet(`resume:${userId}`, JSON.stringify(resume));

        // Clean up temporary uploaded file
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume
        });

    } catch (error) {
        console.error("uploadResume Error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process resume"
        });
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
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required"
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

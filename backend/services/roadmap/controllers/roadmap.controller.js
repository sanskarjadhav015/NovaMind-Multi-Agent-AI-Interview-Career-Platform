/**
 * @file roadmap.controller.js (Roadmap Service)
 * @description Generates personalized, milestone-based learning roadmaps tailored to
 * target roles, salary bands, and skill gaps. Integrates LangGraph multi-agent execution
 * (curriculum design + documentation/YouTube curation) and Redis caching.
 */

import Roadmap from "../models/roadmap.model.js";
import graph from "../graph/roadmap.graph.js";

let redisClient = null;
try {
    const redisModule = await import("../../../shared/redis/redis.js");
    redisClient = redisModule.default;
} catch (e) {
    console.log("Redis client not available in roadmap service:", e.message);
}

/**
 * Safely fetches a value from Redis cache.
 * @param {string} key - Redis key
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
 * @param {string} key - Redis key
 * @param {string} value - String value
 * @param {number} [ttl=3600] - Time to live in seconds (default 1 hour)
 */
const safeRedisSet = async (key, value, ttl = 3600) => {
    try {
        if (redisClient && typeof redisClient.set === "function") {
            await redisClient.set(key, value, "EX", ttl);
        }
    } catch (e) {
        console.warn("Redis set error:", e.message);
    }
};

/**
 * Safely deletes a cache key from Redis.
 * @param {string} key - Redis key to delete
 */
const safeRedisDel = async (key) => {
    try {
        if (redisClient && typeof redisClient.del === "function") {
            await redisClient.del(key);
        }
    } catch (e) {
        console.warn("Redis del error:", e.message);
    }
};

/**
 * Generates a targeted career roadmap by invoking LangGraph agents.
 * Validates requirements, saves generated curriculum in MongoDB, and caches in Redis.
 * 
 * @param {import("express").Request} req - Request containing { role, targetPackage, useResume, resume }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const generateRoadmap = async (req, res) => {
    try {
        const {
            role,
            targetPackage,
            useResume = false,
            resume
        } = req.body;
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required"
            });
        }

        if (!role || !targetPackage) {
            return res.status(400).json({
                success: false,
                message: "Role and target package are required."
            });
        }

        if (useResume && !resume) {
            return res.status(400).json({
                success: false,
                message: "Resume data is required when useResume is enabled."
            });
        }

        // Invoke LangGraph roadmap generation pipeline
        const result = await graph.invoke({
            role,
            targetPackage,
            useResume,
            resume
        });

        // Persist generated roadmap to MongoDB
        const roadmap = await Roadmap.create({
            userId,
            ...result.roadmap
        });

        // Cache single roadmap and invalidate user list cache
        await safeRedisSet(`roadmap:${roadmap._id}`, JSON.stringify(roadmap), 3600);
        await safeRedisDel(`userRoadmaps:${userId}`);

        return res.status(201).json({
            success: true,
            message: "Roadmap generated successfully.",
            data: roadmap
        });

    } catch (error) {
        console.error("Error generating roadmap:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate roadmap"
        });
    }
};

/**
 * Retrieves all roadmaps created by the authenticated candidate.
 * Employs Redis cache-aside pattern with 1-hour expiration.
 * 
 * @param {import("express").Request} req - Request with x-user-id
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getAllRoadmap = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required"
            });
        }

        // Cache check
        const cache = await safeRedisGet(`userRoadmaps:${userId}`);
        if (cache) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cache)
            });
        }

        const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });

        await safeRedisSet(`userRoadmaps:${userId}`, JSON.stringify(roadmaps), 3600);

        return res.json({
            success: true,
            data: roadmaps
        });

    } catch (error) {
        console.error("Error getting all roadmaps:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch roadmaps"
        });
    }
};

/**
 * Retrieves a specific roadmap by ID, ensuring ownership belongs to the authenticated user.
 * 
 * @param {import("express").Request} req - Request with params.id and x-user-id
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getRoadmapbyId = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required"
            });
        }

        // Check single roadmap cache
        const cache = await safeRedisGet(`roadmap:${id}`);
        if (cache) {
            return res.json({
                success: true,
                fromCache: true,
                data: JSON.parse(cache)
            });
        }

        const roadmap = await Roadmap.findOne({
            _id: id,
            userId: userId
        });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found"
            });
        }

        await safeRedisSet(`roadmap:${id}`, JSON.stringify(roadmap), 3600);

        return res.json({
            success: true,
            fromCache: false,
            data: roadmap
        });

    } catch (error) {
        console.error("Error getting roadmap by id:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch roadmap details"
        });
    }
};
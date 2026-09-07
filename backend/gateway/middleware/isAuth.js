/**
 * @file isAuth.js (Gateway Middleware)
 * @description Session authentication middleware that validates client session cookies against
 * the distributed Redis cache. If valid, deserializes user session metadata and attaches it
 * to `req.user` for downstream service consumption.
 */

import redis from "../../shared/redis/redis.js";

/**
 * Express middleware to protect routes requiring authentication.
 * 
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 * @param {import("express").NextFunction} next - Express next middleware callback
 * @returns {Promise<void|import("express").Response>}
 */
export const isAuth = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session;

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing session token"
            });
        }

        // Fetch session JSON from Redis cache
        const session = await redis.get(`session:${sessionId}`);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        // Attach parsed user data (userId, email, name, coins) to request object
        req.user = JSON.parse(session);
        return next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error during authentication"
        });
    }
};
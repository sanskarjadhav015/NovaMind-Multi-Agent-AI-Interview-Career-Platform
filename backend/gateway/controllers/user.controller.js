/**
 * @file user.controller.js (Gateway Controller)
 * @description Controller for gateway-level user queries, such as retrieving current session data.
 */

/**
 * @file user.controller.js (Gateway Controller)
 * @description Controller for gateway-level user queries, such as retrieving current session data.
 * Authoritatively verifies and synchronizes user balance with Auth Service while maintaining high availability.
 */

import redis from "../../shared/redis/redis.js";

/**
 * Returns the currently authenticated user attached to the request by `isAuth` middleware.
 * Authoritatively checks for updated coin balance from MongoDB via Auth Service to prevent stale session displays.
 * 
 * @param {import("express").Request} req - Express request object containing `req.user`
 * @param {import("express").Response} res - Express response object
 * @returns {Promise<import("express").Response>}
 */
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user ? { ...req.user } : null;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No active user session found"
            });
        }

        const userId = user.userId || user._id || user.id;

        // Authoritative balance refresh from Auth Service (MongoDB source of truth)
        if (userId && process.env.AUTH_SERVICE_URL) {
            try {
                const authRes = await fetch(`${process.env.AUTH_SERVICE_URL}/internal/user-balance/${userId}`, {
                    method: "GET",
                    headers: {
                        "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET || ""
                    },
                    signal: AbortSignal.timeout(3000)
                });

                if (authRes.ok) {
                    const authData = await authRes.json();
                    if (authData?.success && authData?.user?.interviewCoin !== undefined) {
                        const freshCoin = authData.user.interviewCoin;

                        // If Redis session had stale coin balance, refresh it in memory and in Redis
                        if (user.interviewCoin !== freshCoin) {
                            user.interviewCoin = freshCoin;

                            const sessionId = req.cookies?.session;
                            if (sessionId) {
                                try {
                                    const ttl = await redis.ttl(`session:${sessionId}`);
                                    const validTtl = ttl > 0 ? ttl : 7 * 24 * 60 * 60;
                                    await redis.set(`session:${sessionId}`, JSON.stringify(user), "EX", validTtl);
                                } catch (redisErr) {
                                    console.warn("Non-critical Redis session update warning:", redisErr.message);
                                }
                            }
                        }
                    }
                }
            } catch (syncErr) {
                // Graceful fallback: If Auth Service is temporarily slow or unreachable, serve session from Redis
                console.warn("Auth balance refresh fallback to Redis session:", syncErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve user profile"
        });
    }
};
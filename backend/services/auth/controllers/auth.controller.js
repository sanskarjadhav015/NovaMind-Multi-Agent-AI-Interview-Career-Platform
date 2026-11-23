/**
 * @file auth.controller.js (Auth Service)
 * @description Handles user authentication lifecycle, Firebase Admin token verification,
 * Redis session persistence, and idempotent, atomic interview coin transactions.
 */

import { app } from "../configs/firebase.js";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import CoinTransaction from "../models/coinTransaction.model.js";
import crypto from "crypto";
import redis from "../../../shared/redis/redis.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

/**
 * Synchronizes updated coin balance across all active Redis sessions for a user.
 * Supports multiple active devices/browsers per user via a Redis Set (`user_sessions:<userId>`).
 * 
 * @param {string|import("mongoose").Types.ObjectId} userId - User ID
 * @param {number} newBalance - Updated coin balance to broadcast
 */
export const syncUserSessions = async (userId, newBalance) => {
    try {
        const idStr = userId.toString();
        const sessionIds = await redis.smembers(`user_sessions:${idStr}`);
        if (!sessionIds || sessionIds.length === 0) return;

        for (const sid of sessionIds) {
            const rawSession = await redis.get(`session:${sid}`);
            if (!rawSession) {
                // Stale or expired session reference; prune from set
                await redis.srem(`user_sessions:${idStr}`, sid);
                continue;
            }
            try {
                const sessionData = JSON.parse(rawSession);
                sessionData.interviewCoin = newBalance;
                const ttl = await redis.ttl(`session:${sid}`);
                const validTtl = ttl > 0 ? ttl : SESSION_TTL_SECONDS;
                await redis.set(`session:${sid}`, JSON.stringify(sessionData), "EX", validTtl);
            } catch (err) {
                console.warn(`Failed to sync session payload for ${sid}:`, err.message);
            }
        }
    } catch (e) {
        console.warn("Failed to synchronize user sessions in Redis:", e.message);
    }
};

/**
 * Verifies Firebase ID Token, upserts user in MongoDB, initializes Redis session,
 * indexes session in `user_sessions:<userId>`, and sets the HTTP-only session cookie.
 * 
 * @param {import("express").Request} req - Request containing { token } from Firebase client SDK
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>} User profile and session cookie
 */
export const GoogleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        // Verify Firebase JWT token
        const decoded = await getAuth(app).verifyIdToken(token);

        // Find or create user document (by firebaseUid or email in case of project migration)
        let user = await User.findOne({
            $or: [
                { firebaseUid: decoded.uid },
                { email: decoded.email }
            ]
        });

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name || "Anonymous Candidate",
                email: decoded.email
            });
        } else if (user.firebaseUid !== decoded.uid) {
            user.firebaseUid = decoded.uid;
            if (decoded.name && (!user.name || user.name === "Anonymous Candidate")) {
                user.name = decoded.name;
            }
            await user.save();
        }

        // Generate cryptographically secure session ID
        const sessionId = crypto.randomUUID();

        // Cache user session state in Redis with 7-day TTL
        await redis.set(
            `session:${sessionId}`,
            JSON.stringify({
                userId: user._id,
                name: user.name,
                email: user.email,
                interviewCoin: user.interviewCoin
            }),
            "EX",
            SESSION_TTL_SECONDS
        );

        // Track active session in Redis set for multi-session synchronization
        await redis.sadd(`user_sessions:${user._id.toString()}`, sessionId);
        await redis.expire(`user_sessions:${user._id.toString()}`, SESSION_TTL_SECONDS);

        const isProduction = process.env.NODE_ENV === "production";

        // Issue secure session cookie
        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: SESSION_TTL_MS
        });

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("GoogleAuth Error:", error);
        return res.status(500).json({
            success: false,
            message: "Google authentication failed",
            error: error.message
        });
    }
};

/**
 * Clears the user's active session in Redis and removes it from the user's active session set.
 * 
 * @param {import("express").Request} req - Express request with session cookie
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const logOut = async (req, res) => {
    try {
        const sessionId = req.cookies?.session;
        const isProduction = process.env.NODE_ENV === "production";

        if (sessionId) {
            const rawSession = await redis.get(`session:${sessionId}`);
            if (rawSession) {
                try {
                    const parsed = JSON.parse(rawSession);
                    if (parsed?.userId) {
                        await redis.srem(`user_sessions:${parsed.userId.toString()}`, sessionId);
                    }
                } catch (_) {}
            }
            await redis.del(`session:${sessionId}`);
        }

        res.clearCookie("session", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "Logout error",
            error: error.message
        });
    }
};

/**
 * Internally deducts interview coins atomically and idempotently.
 * Guarded by verifyInternalSecret.
 * 
 * @param {import("express").Request} req - Request containing { userId, coins, action, idempotencyKey }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const deductCoinsInternal = async (req, res) => {
    try {
        const { userId, coins, action = "operation", idempotencyKey } = req.body;
        const coinAmount = Number(coins);

        if (!userId || !coinAmount || isNaN(coinAmount) || coinAmount <= 0 || !Number.isInteger(coinAmount)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId and positive integer coins amount are required"
            });
        }

        if (!idempotencyKey || typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "idempotencyKey is required for internal coin transactions"
            });
        }

        // 1. Idempotency check: repeated requests must never deduct coins twice
        const existingTx = await CoinTransaction.findOne({ idempotencyKey, userId });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: "Transaction already processed",
                interviewCoin: existingTx.balanceAfter,
                deduplicated: true
            });
        }

        // 2. Atomic deduction with non-negative guard
        const user = await User.findOneAndUpdate(
            { _id: userId, interviewCoin: { $gte: coinAmount } },
            { $inc: { interviewCoin: -coinAmount } },
            { new: true }
        );

        if (!user) {
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            return res.status(403).json({
                success: false,
                message: `Not enough interview coins (${coinAmount} required)`,
                interviewCoin: existingUser.interviewCoin
            });
        }

        // 3. Persist audit ledger record with concurrency conflict rollback
        try {
            await CoinTransaction.create({
                idempotencyKey,
                userId: user._id,
                amount: coinAmount,
                type: "deduct",
                action,
                status: "completed",
                balanceAfter: user.interviewCoin
            });
        } catch (txErr) {
            if (txErr.code === 11000) {
                // Duplicate idempotencyKey conflict: another concurrent request created the record.
                // Revert this duplicate deduction to preserve balance integrity.
                await User.findByIdAndUpdate(userId, { $inc: { interviewCoin: coinAmount } });
                const winningTx = await CoinTransaction.findOne({ idempotencyKey, userId });
                return res.status(200).json({
                    success: true,
                    message: "Transaction already processed",
                    interviewCoin: winningTx ? winningTx.balanceAfter : user.interviewCoin + coinAmount,
                    deduplicated: true
                });
            }
            throw txErr;
        }

        // 4. Propagate fresh balance to all active Redis sessions
        await syncUserSessions(user._id, user.interviewCoin);

        return res.status(200).json({
            success: true,
            message: "Coins deducted successfully",
            interviewCoin: user.interviewCoin
        });

    } catch (error) {
        console.error("deductCoinsInternal Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to deduct coins"
        });
    }
};

/**
 * Internally refunds interview coins atomically and idempotently.
 * Guarded by verifyInternalSecret.
 * 
 * @param {import("express").Request} req - Request containing { userId, coins, reason, idempotencyKey }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const refundCoinsInternal = async (req, res) => {
    try {
        const { userId, coins, reason = "refund", idempotencyKey } = req.body;
        const coinAmount = Number(coins);

        if (!userId || !coinAmount || isNaN(coinAmount) || coinAmount <= 0 || !Number.isInteger(coinAmount)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId and positive integer coins amount are required"
            });
        }

        if (!idempotencyKey || typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "idempotencyKey is required for internal coin refunds"
            });
        }

        // 1. Idempotency check: repeated refund must never create extra coins
        const existingTx = await CoinTransaction.findOne({ idempotencyKey, userId });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: "Refund already processed",
                interviewCoin: existingTx.balanceAfter,
                deduplicated: true
            });
        }

        // 2. Atomic refund increment in MongoDB
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { interviewCoin: coinAmount } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Persist audit ledger record with concurrency conflict rollback
        try {
            await CoinTransaction.create({
                idempotencyKey,
                userId: user._id,
                amount: coinAmount,
                type: "refund",
                action: reason,
                status: "completed",
                balanceAfter: user.interviewCoin
            });
        } catch (txErr) {
            if (txErr.code === 11000) {
                // Revert duplicate increment
                await User.findByIdAndUpdate(userId, { $inc: { interviewCoin: -coinAmount } });
                const winningTx = await CoinTransaction.findOne({ idempotencyKey, userId });
                return res.status(200).json({
                    success: true,
                    message: "Refund already processed",
                    interviewCoin: winningTx ? winningTx.balanceAfter : user.interviewCoin - coinAmount,
                    deduplicated: true
                });
            }
            throw txErr;
        }

        // 4. Propagate fresh balance to all active Redis sessions
        await syncUserSessions(user._id, user.interviewCoin);

        return res.status(200).json({
            success: true,
            message: "Coins refunded successfully",
            interviewCoin: user.interviewCoin
        });

    } catch (error) {
        console.error("refundCoinsInternal Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to refund coins"
        });
    }
};

/**
 * Internally credits interview coins to a user's account balance following verified payment.
 * Requires internal service secret validation.
 * 
 * @param {import("express").Request} req - Request containing { userId, coins, idempotencyKey }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const creditCoinsInternal = async (req, res) => {
    try {
        const { userId, coins, idempotencyKey } = req.body;
        const coinAmount = Number(coins);

        if (!userId || !coinAmount || isNaN(coinAmount) || coinAmount <= 0 || !Number.isInteger(coinAmount)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId and positive integer coins amount are required"
            });
        }

        if (!idempotencyKey || typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "idempotencyKey is required for internal coin crediting"
            });
        }

        // 1. Idempotency check: duplicate payment verify must never double credit
        const existingTx = await CoinTransaction.findOne({ idempotencyKey, userId });
        if (existingTx) {
            return res.status(200).json({
                success: true,
                message: "Payment credit already processed",
                interviewCoin: existingTx.balanceAfter,
                deduplicated: true
            });
        }

        // 2. Atomic increment in MongoDB
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { interviewCoin: coinAmount } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Persist transaction record with concurrency conflict rollback
        try {
            await CoinTransaction.create({
                idempotencyKey,
                userId: user._id,
                amount: coinAmount,
                type: "credit",
                action: "payment_recharge",
                status: "completed",
                balanceAfter: user.interviewCoin
            });
        } catch (txErr) {
            if (txErr.code === 11000) {
                // Revert duplicate credit
                await User.findByIdAndUpdate(userId, { $inc: { interviewCoin: -coinAmount } });
                const winningTx = await CoinTransaction.findOne({ idempotencyKey, userId });
                return res.status(200).json({
                    success: true,
                    message: "Payment credit already processed",
                    interviewCoin: winningTx ? winningTx.balanceAfter : user.interviewCoin - coinAmount,
                    deduplicated: true
                });
            }
            throw txErr;
        }

        // 4. Synchronize across all active Redis sessions
        await syncUserSessions(user._id, user.interviewCoin);

        return res.status(200).json({
            success: true,
            message: "Coins credited successfully",
            interviewCoin: user.interviewCoin
        });

    } catch (error) {
        console.error("creditCoinsInternal Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to credit coins"
        });
    }
};

/**
 * Retrieves authoritative user balance directly from MongoDB.
 * Guarded by verifyInternalSecret.
 * 
 * @param {import("express").Request} req - Request with req.params.userId
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getUserBalanceInternal = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID parameter is required"
            });
        }

        const user = await User.findById(userId).select("name email interviewCoin");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                interviewCoin: user.interviewCoin
            }
        });
    } catch (error) {
        console.error("getUserBalanceInternal Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user balance"
        });
    }
};

// Deprecated: Forward legacy addCoins calls to internal handler if internal secret present
export const addCoins = creditCoinsInternal;

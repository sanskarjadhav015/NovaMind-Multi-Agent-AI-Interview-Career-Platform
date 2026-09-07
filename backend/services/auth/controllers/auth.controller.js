/**
 * @file auth.controller.js (Auth Service)
 * @description Handles user authentication lifecycle, Firebase Admin token verification,
 * Redis session persistence, and interview coin transactions.
 */

import { app } from "../configs/firebase.js";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../shared/redis/redis.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

/**
 * Verifies Firebase ID Token, upserts user in MongoDB, initializes Redis session,
 * and sets the HTTP-only session cookie.
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

        // Find or create user document
        let user = await User.findOne({ firebaseUid: decoded.uid });
        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name || "Anonymous Candidate",
                email: decoded.email
            });
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

        const isProduction = process.env.NODE_ENV === "production";

        // Issue session cookie
        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
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
 * Clears the user's active session in Redis and invalidates the session cookie.
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
            await redis.del(`session:${sessionId}`);
        }

        res.clearCookie("session", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
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
 * Atomically deducts interview coins from user balance and syncs Redis session.
 * Employs findOneAndUpdate with `{ interviewCoin: { $gte: coinAmount } }` to guarantee
 * non-negative coin balance under concurrent requests.
 * 
 * @param {import("express").Request} req - Request with { coins, action }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const useCoins = async (req, res) => {
    try {
        const sessionId = req.cookies?.session;
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing session token"
            });
        }

        const session = await redis.get(`session:${sessionId}`);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        const sessionData = JSON.parse(session);
        const { coins, action } = req.body;
        const coinAmount = Number(coins);

        if (!coinAmount || isNaN(coinAmount) || coinAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid positive number of coins is required"
            });
        }

        // Atomic deduction: race-condition safe and prevents negative balance
        const user = await User.findOneAndUpdate(
            { _id: sessionData.userId, interviewCoin: { $gte: coinAmount } },
            { $inc: { interviewCoin: -coinAmount } },
            { returnDocument: "after" }
        );

        if (!user) {
            const existingUser = await User.findById(sessionData.userId);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            return res.status(403).json({
                success: false,
                message: "Not enough interview coins",
                interviewCoin: existingUser.interviewCoin
            });
        }

        // Update cached session with new balance
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

        return res.status(200).json({
            success: true,
            message: "Interview coins updated successfully",
            action,
            interviewCoin: user.interviewCoin
        });

    } catch (error) {
        console.error("useCoins Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update interview coins"
        });
    }
};

/**
 * Adds interview coins to a user's account balance and updates Redis session.
 * 
 * @param {import("express").Request} req - Request containing { coins }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const addCoins = async (req, res) => {
    try {
        const sessionId = req.cookies?.session;
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing session token"
            });
        }

        const session = await redis.get(`session:${sessionId}`);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        const sessionData = JSON.parse(session);
        const coinAmount = Number(req.body?.coins);

        if (!coinAmount || isNaN(coinAmount) || coinAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid positive number of coins is required"
            });
        }

        const user = await User.findById(sessionData.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.interviewCoin += coinAmount;
        await user.save();

        // Update Redis session cache
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

        return res.status(200).json({
            success: true,
            message: "Coins added successfully",
            interviewCoin: user.interviewCoin
        });

    } catch (error) {
        console.error("addCoins Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add interview coins"
        });
    }
};
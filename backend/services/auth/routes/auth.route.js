/**
 * @file auth.route.js (Auth Service)
 * @description Express routing definitions for user authentication and coin operations.
 */

import express from "express";
import {
    addCoins,
    creditCoinsInternal,
    deductCoinsInternal,
    getUserBalanceInternal,
    refundCoinsInternal,
    GoogleAuth,
    logOut
} from "../controllers/auth.controller.js";
import { verifyInternalSecret } from "../../../shared/middleware/verifyInternalSecret.js";

const authRouter = express.Router();

// Exchange Firebase client JWT for a server session cookie
authRouter.post("/login", GoogleAuth);

// Invalidate session cookie and clear Redis session key
authRouter.get("/logout", logOut);

// Internal-only endpoint to deduct coins atomically & idempotently
authRouter.post("/internal/deduct-coins", verifyInternalSecret, deductCoinsInternal);

// Internal-only endpoint to refund coins atomically & idempotently
authRouter.post("/internal/refund-coins", verifyInternalSecret, refundCoinsInternal);

// Internal-only endpoint to credit coins upon verified payment
authRouter.post("/internal/credit-coins", verifyInternalSecret, creditCoinsInternal);

// Internal-only endpoint to fetch fresh authoritative user balance from MongoDB
authRouter.get("/internal/user-balance/:userId", verifyInternalSecret, getUserBalanceInternal);

// Legacy add-coins strictly guarded by internal secret
authRouter.post("/add-coins", verifyInternalSecret, addCoins);

export default authRouter;

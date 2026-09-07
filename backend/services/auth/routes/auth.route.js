/**
 * @file auth.route.js (Auth Service)
 * @description Express routing definitions for user authentication and coin operations.
 */

import express from "express";
import {
    addCoins,
    GoogleAuth,
    logOut,
    useCoins
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Exchange Firebase client JWT for a server session cookie
authRouter.post("/login", GoogleAuth);

// Invalidate session cookie and clear Redis session key
authRouter.get("/logout", logOut);

// Deduct coins for interview or resume features
authRouter.post("/use-coins", useCoins);

// Credit purchased or bonus coins to the user
authRouter.post("/add-coins", addCoins);

export default authRouter;
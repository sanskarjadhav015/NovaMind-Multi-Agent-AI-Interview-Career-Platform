/**
 * @file firebase.js (Auth Service)
 * @description Initializes Firebase Admin SDK using service account credentials.
 * Supports environment variables (JSON or base64 string) and local file fallback.
 * Used for verifying client-side Firebase Auth JWT tokens on the server.
 */

import { cert, initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let credential = null;

// 1. Check for environment variable (JSON string or base64 encoded JSON)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        const jsonStr = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
        credential = cert(JSON.parse(jsonStr));
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", e.message);
    }
}

// 2. Fallback to local file if it exists (preserves local dev compatibility)
if (!credential) {
    const localKeyPath = path.resolve(__dirname, "../serviceAccountKey.json");
    if (fs.existsSync(localKeyPath)) {
        try {
            const fileContent = fs.readFileSync(localKeyPath, "utf-8");
            credential = cert(JSON.parse(fileContent));
        } catch (e) {
            console.error("Failed to read local serviceAccountKey.json:", e.message);
        }
    }
}

// 3. Warn gracefully if credentials are not configured
if (!credential) {
    console.warn("⚠️ Warning: No valid Firebase service account credentials found. Token verification will fail until credentials are provided.");
}

// 4. Initialize singleton app
export const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp(credential ? { credential } : {});

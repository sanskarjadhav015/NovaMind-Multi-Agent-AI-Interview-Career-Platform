/**
 * @file firebase.js (Auth Service)
 * @description Initializes Firebase Admin SDK using service account credentials.
 * Used for verifying client-side Firebase Auth JWT tokens on the server.
 */

import { cert, initializeApp } from "firebase-admin/app";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

export const app = initializeApp({
    credential: cert(serviceAccount)
});
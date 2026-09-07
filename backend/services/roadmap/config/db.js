/**
 * @file db.js (Roadmap Service)
 * @description Mongoose connection manager for career roadmap documents.
 */

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(" MongoDB connected successfully (Roadmap Service)");
    } catch (error) {
        console.error("❌ MongoDB connection error (Roadmap Service):", error.message);
    }
};
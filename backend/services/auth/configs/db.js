/**
 * @file db.js (Auth Service)
 * @description MongoDB connection manager using Mongoose.
 */

import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB cluster.
 */
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(" MongoDB connected successfully (Auth Service)");
    } catch (error) {
        console.error("❌ MongoDB connection error (Auth Service):", error.message);
    }
};
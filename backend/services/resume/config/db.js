/**
 * @file db.js (Resume Service)
 * @description Mongoose connection manager for resume analysis records.
 */

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(" MongoDB connected successfully (Resume Service)");
    } catch (error) {
        console.error("❌ MongoDB connection error (Resume Service):", error.message);
    }
};
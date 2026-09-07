/**
 * @file db.js (Interview Service)
 * @description Mongoose connection manager for interview documents and evaluation records.
 */

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(" MongoDB connected successfully (Interview Service)");
    } catch (error) {
        console.error("❌ MongoDB connection error (Interview Service):", error.message);
    }
};
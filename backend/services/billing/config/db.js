/**
 * @file db.js (Billing Service)
 * @description Establishes connection to MongoDB for billing records.
 */

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(" MongoDB connected successfully (Billing Service)");
    } catch (error) {
        console.error("❌ MongoDB connection error (Billing Service):", error.message);
    }
};

/**
 * @file user.model.js (Auth Service)
 * @description Mongoose schema definition for User entity.
 * Stores Firebase UID, personal info, and available interview credits/coins.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        // Interview credits consumed across mock interviews and ATS resume scans
        interviewCoin: {
            type: Number,
            default: 150,
            min: 0
        }
    },
    { timestamps: true }
);

const User = mongoose.model("user", userSchema);
export default User;
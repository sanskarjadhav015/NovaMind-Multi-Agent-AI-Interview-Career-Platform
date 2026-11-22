/**
 * @file billing.model.js (Billing Service)
 * @description Mongoose schema for payment orders and user coin purchase history.
 */

import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: "INR"
        },
        interviewCoins: {
            type: Number,
            required: true
        },
        planId: {
            type: String
        },
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        razorpayPaymentId: {
            type: String,
            index: true
        },
        razorpaySignature: {
            type: String
        },
        status: {
            type: String,
            enum: ["created", "processing", "credit_pending", "paid", "failed"],
            default: "created",
            index: true
        },
        creditDelivered: {
            type: Boolean,
            default: false
        },
        creditAttempts: {
            type: Number,
            default: 0
        },
        lastCreditError: {
            type: String
        },
        idempotencyKey: {
            type: String,
            sparse: true,
            index: true
        }
    },
    { timestamps: true }
);

// Compound index for user billing history and status audits
billingSchema.index({ userId: 1, createdAt: -1 });
billingSchema.index({ status: 1, creditAttempts: 1 });

const Billing = mongoose.model("Billing", billingSchema);
export default Billing;
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
        interviewCoins: {
            type: Number,
            required: true
        },
        razorpayOrderId: {
            type: String,
            index: true
        },
        razorpayPaymentId: {
            type: String
        },
        razorpaySignature: {
            type: String
        },
        status: {
            type: String,
            enum: ["created", "paid", "failed"],
            default: "created",
            index: true
        }
    },
    { timestamps: true }
);

const Billing = mongoose.model("Billing", billingSchema);
export default Billing;
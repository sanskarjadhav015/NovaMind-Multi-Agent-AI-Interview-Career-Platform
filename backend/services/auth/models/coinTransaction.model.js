/**
 * @file coinTransaction.model.js (Auth Service)
 * @description Audit ledger and idempotency record for all coin deductions and refunds.
 */

import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema(
    {
        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["deduct", "refund", "credit"],
            required: true
        },
        action: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["completed", "failed"],
            default: "completed"
        },
        balanceAfter: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// Compound index for fast user transaction history retrieval
coinTransactionSchema.index({ userId: 1, createdAt: -1 });

const CoinTransaction = mongoose.model("CoinTransaction", coinTransactionSchema);
export default CoinTransaction;

/**
 * @file billing.controller.js (Billing Service)
 * @description Manages commercial subscription plans, Razorpay payment order generation,
 * cryptographic HMAC SHA-256 signature verification, and user transaction history.
 */

import razorpay from "../config/razorpay.js";
import Billing from "../models/billing.model.js";
import crypto from "crypto";

/**
 * Catalog of available interview coin packs and preparation tiers.
 */
export const PLANS = {
    starter: {
        id: "starter",
        name: "Starter Pack",
        amount: 199,
        interviewCoins: 300,
        interviewsCount: 6,
        scansCount: 30,
        description: "Great for getting started and preparing for your initial rounds.",
        features: [
            "300 Interview Coins",
            "6 Full Mock AI Interviews (50 coins each)",
            "30 Resume ATS Scans (10 coins each)",
            "Detailed AI Performance Reports",
            "Instant Feedback & Speech Analysis",
            "1 Year Validity"
        ],
        badge: "Essential",
        popular: false
    },
    pro: {
        id: "pro",
        name: "Pro Pack",
        amount: 499,
        interviewCoins: 900,
        interviewsCount: 18,
        scansCount: 90,
        description: "Best value for active job seekers targeting top tech companies.",
        features: [
            "900 Interview Coins (+150 Bonus Coins included)",
            "18 Full Mock AI Interviews",
            "90 Resume ATS Scans & Analyses",
            "Advanced Code Evaluation & Deep Feedback",
            "Custom Role & Tech-Stack Targeting",
            "Priority AI Model Processing Speed",
            "Lifetime Validity"
        ],
        badge: "Most Popular",
        popular: true
    },
    enterprise: {
        id: "enterprise",
        name: "Mastery Pack",
        amount: 999,
        interviewCoins: 2500,
        interviewsCount: 50,
        scansCount: 250,
        description: "Comprehensive preparation package for mastering both Technical and HR rounds.",
        features: [
            "2500 Interview Coins (Huge 40% Savings)",
            "50 Full Mock AI Interviews",
            "Unlimited Resume ATS Optimizations",
            "Complete Skill Radar & Performance Analytics",
            "Custom Technical & Behavioral Tracks",
            "Lifetime Validity & Uncapped Storage",
            "24/7 Priority Support"
        ],
        badge: "Maximum Value",
        popular: false
    }
};

/**
 * Retrieves list of all public coin and preparation plans.
 * 
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getPlans = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            plans: Object.values(PLANS)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch plans"
        });
    }
};

/**
 * Fetches transaction and invoice history for the authenticated user.
 * 
 * @param {import("express").Request} req - Express request with x-user-id header
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getBillingHistory = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user identification"
            });
        }

        const history = await Billing.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            history
        });
    } catch (error) {
        console.error("Billing history error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch transaction history"
        });
    }
};

/**
 * Initializes a payment order in Razorpay (converting INR to paise)
 * and records a pending 'created' billing record in MongoDB.
 * 
 * @param {import("express").Request} req - Request containing { planId }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>} Razorpay order payload and client key
 */
export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        const plan = PLANS[planId];

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan selected"
            });
        }

        // Amount in paise (1 INR = 100 paise)
        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: "INR",
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {
                userId: userId ? userId.toString() : "",
                planId: planId,
                coins: plan.interviewCoins.toString()
            }
        });

        const billingRecord = await Billing.create({
            userId,
            amount: plan.amount,
            interviewCoins: plan.interviewCoins,
            razorpayOrderId: order.id,
            status: "created"
        });

        return res.status(201).json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID,
            plan,
            billingId: billingRecord._id
        });

    } catch (error) {
        console.error("Order creation error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create order"
        });
    }
};

/**
 * Cryptographically verifies Razorpay payment signature using HMAC SHA-256.
 * Upon successful verification, marks transaction as 'paid' and returns purchased coins.
 * 
 * @param {import("express").Request} req - Request containing { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>} Verification status and coin credit confirmation
 */
export const verifyPayment = async (req, res) => {
    try {
        const orderId = req.body.razorpay_order_id || req.body.razorpayOrderId || req.body.razorpay_Order_id;
        const paymentId = req.body.razorpay_payment_id || req.body.razorpayPaymentId || req.body.razorpay_Payment_id;
        const signature = req.body.razorpay_signature || req.body.razorpaySignature || req.body.razorpay_Signature;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification parameters"
            });
        }

        const payment = await Billing.findOne({ razorpayOrderId: orderId });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        // Generate HMAC SHA256 signature using Razorpay Key Secret
        const genSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        if (genSign !== signature) {
            payment.status = "failed";
            payment.razorpayPaymentId = paymentId;
            payment.razorpaySignature = signature;
            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed"
            });
        }

        // Idempotency check: avoid double-processing paid transactions
        if (payment.status === "paid") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                coins: payment.interviewCoins
            });
        }

        payment.status = "paid";
        payment.razorpayPaymentId = paymentId;
        payment.razorpaySignature = signature;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment Successful",
            coins: payment.interviewCoins,
            amount: payment.amount,
            orderId: orderId,
            paymentId: paymentId
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        const orderId = req.body?.razorpay_order_id || req.body?.razorpayOrderId || req.body?.razorpay_Order_id;
        if (orderId) {
            await Billing.findOneAndUpdate(
                { razorpayOrderId: orderId },
                { status: "failed" }
            ).catch(() => {});
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
};
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

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user identification"
            });
        }

        const allowedPlanIds = Object.keys(PLANS);
        if (!planId || !allowedPlanIds.includes(planId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan selected"
            });
        }

        const plan = PLANS[planId];

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
            currency: order.currency || "INR",
            interviewCoins: plan.interviewCoins,
            planId: plan.id,
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
 * Timing-safe cryptographic verification of Razorpay HMAC SHA-256 signatures.
 * 
 * @param {string} orderId - Razorpay order identifier
 * @param {string} paymentId - Razorpay payment identifier
 * @param {string} signature - Client-supplied hex signature
 * @param {string} secret - Server-side Razorpay Key Secret
 * @returns {boolean} True if signature is cryptographically valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
    if (!orderId || !paymentId || !signature || !secret) {
        return false;
    }
    try {
        const expectedSign = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        const expectedBuf = Buffer.from(expectedSign, "utf8");
        const signatureBuf = Buffer.from(signature, "utf8");

        if (expectedBuf.length !== signatureBuf.length) {
            return false;
        }

        return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
        return false;
    }
};

/**
 * Delivers purchased coins to Auth Service with deterministic idempotency.
 * 
 * @param {import("../models/billing.model.js").default} payment - Billing record
 * @param {string} paymentId - Verified Razorpay payment ID
 * @returns {Promise<{ delivered: boolean, error?: string }>}
 */
export const deliverCoinCredit = async (payment, paymentId) => {
    const authUrl = process.env.AUTH_SERVICE_URL || "http://auth:8001";
    const idempotencyKey = `credit_rzp_${payment.razorpayOrderId}_${paymentId}`;

    try {
        const creditRes = await fetch(`${authUrl}/internal/credit-coins`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET || ""
            },
            body: JSON.stringify({
                userId: payment.userId,
                coins: payment.interviewCoins,
                idempotencyKey
            }),
            signal: AbortSignal.timeout(8000)
        });

        const creditData = await creditRes.json().catch(() => ({}));

        if (creditRes.ok && creditData.success) {
            payment.status = "paid";
            payment.creditDelivered = true;
            payment.idempotencyKey = idempotencyKey;
            payment.lastCreditError = "";
            await payment.save();
            return { delivered: true };
        } else {
            payment.status = "credit_pending";
            payment.creditDelivered = false;
            payment.idempotencyKey = idempotencyKey;
            payment.lastCreditError = creditData.message || `Auth Service returned status ${creditRes.status}`;
            await payment.save();
            return { delivered: false, error: payment.lastCreditError };
        }
    } catch (err) {
        console.error("Coin credit delivery network error:", err.message);
        payment.status = "credit_pending";
        payment.creditDelivered = false;
        payment.idempotencyKey = idempotencyKey;
        payment.lastCreditError = err.message;
        await payment.save();
        return { delivered: false, error: err.message };
    }
};

/**
 * Cryptographically verifies Razorpay payment signature using timing-safe comparison,
 * executes atomic state transitions to prevent double-crediting race conditions,
 * and durably credits purchased coins to Auth Service.
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
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification parameters (orderId, paymentId, signature required)"
            });
        }

        // 1. Timing-safe cryptographic signature check
        const isValidSignature = verifyRazorpaySignature(
            orderId,
            paymentId,
            signature,
            process.env.RAZORPAY_KEY_SECRET
        );

        if (!isValidSignature) {
            await Billing.findOneAndUpdate(
                { razorpayOrderId: orderId },
                {
                    status: "failed",
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature
                }
            ).catch(() => {});

            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed"
            });
        }

        // 2. Atomic claim: transition from created/credit_pending/failed to processing
        const payment = await Billing.findOneAndUpdate(
            {
                razorpayOrderId: orderId,
                status: { $in: ["created", "credit_pending", "failed"] }
            },
            {
                $set: {
                    status: "processing",
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature
                },
                $inc: { creditAttempts: 1 }
            },
            { new: true }
        );

        // 3. Concurrency check: If another concurrent request claimed or completed this order
        if (!payment) {
            const existingPayment = await Billing.findOne({ razorpayOrderId: orderId });
            if (!existingPayment) {
                return res.status(404).json({
                    success: false,
                    message: "Payment record not found"
                });
            }

            if (existingPayment.status === "paid") {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified and credited",
                    coins: existingPayment.interviewCoins,
                    amount: existingPayment.amount,
                    orderId: existingPayment.razorpayOrderId,
                    paymentId: existingPayment.razorpayPaymentId,
                    deduplicated: true
                });
            }

            if (existingPayment.status === "processing") {
                return res.status(202).json({
                    success: false,
                    message: "Payment is currently being processed. Please refresh in a moment.",
                    processing: true
                });
            }
        }

        // 4. Validate user ownership if userId header present
        if (userId && payment.userId.toString() !== userId.toString()) {
            payment.status = "failed";
            payment.lastCreditError = "User ID mismatch between session and order";
            await payment.save();
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Payment order belongs to another candidate"
            });
        }

        // 5. Durable coin delivery to Auth Service
        const creditResult = await deliverCoinCredit(payment, paymentId);

        if (creditResult.delivered) {
            return res.status(200).json({
                success: true,
                message: "Payment Successful and coins credited",
                coins: payment.interviewCoins,
                amount: payment.amount,
                orderId: payment.razorpayOrderId,
                paymentId: payment.razorpayPaymentId,
                status: "paid"
            });
        } else {
            return res.status(202).json({
                success: true,
                message: "Payment verified. Coin delivery is queued and will be completed momentarily.",
                coins: payment.interviewCoins,
                amount: payment.amount,
                orderId: payment.razorpayOrderId,
                paymentId: payment.razorpayPaymentId,
                status: "credit_pending"
            });
        }

    } catch (error) {
        console.error("Payment verification error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
};

/**
 * Reconciles pending payment credits where payment succeeded but coin delivery encountered an issue.
 * 
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const reconcilePendingPayments = async (req, res) => {
    try {
        const pendingPayments = await Billing.find({
            status: "credit_pending",
            creditAttempts: { $lt: 10 }
        }).limit(20);

        let reconciledCount = 0;
        for (const payment of pendingPayments) {
            if (payment.razorpayPaymentId) {
                payment.creditAttempts += 1;
                const result = await deliverCoinCredit(payment, payment.razorpayPaymentId);
                if (result.delivered) reconciledCount++;
            }
        }

        return res.status(200).json({
            success: true,
            totalPending: pendingPayments.length,
            reconciled: reconciledCount
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Reconciliation failed: " + err.message
        });
    }
};

/**
 * Razorpay Webhook Handler for asynchronous payment notifications.
 * Verifies webhook signatures and processes payment.captured / order.paid events idempotently.
 * 
 * @param {import("express").Request} req - Webhook request
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        if (!webhookSecret) {
            console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET not configured. Documenting webhook received.");
            return res.status(200).json({ received: true, note: "Webhook secret not configured on server" });
        }

        if (!signature) {
            return res.status(400).json({ success: false, message: "Missing x-razorpay-signature header" });
        }

        // Verify webhook signature with raw payload
        const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        const expectedSign = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        const expectedBuf = Buffer.from(expectedSign, "utf8");
        const sigBuf = Buffer.from(signature, "utf8");

        if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        const event = req.body?.event;
        const payload = req.body?.payload;

        if (event === "payment.captured" || event === "order.paid") {
            const paymentEntity = payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;

            if (orderId && paymentId) {
                const payment = await Billing.findOneAndUpdate(
                    {
                        razorpayOrderId: orderId,
                        status: { $in: ["created", "credit_pending", "failed"] }
                    },
                    {
                        $set: {
                            status: "processing",
                            razorpayPaymentId: paymentId
                        },
                        $inc: { creditAttempts: 1 }
                    },
                    { new: true }
                );

                if (payment) {
                    await deliverCoinCredit(payment, paymentId);
                }
            }
        }

        return res.status(200).json({ success: true, received: true });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return res.status(500).json({ success: false, message: "Webhook handler error" });
    }
};
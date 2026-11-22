/**
 * @file billing.route.js (Billing Service)
 * @description Express routes for plan catalog, order creation, payment verification, and billing history.
 */

import express from "express";
import {
    createOrder,
    getBillingHistory,
    getPlans,
    reconcilePendingPayments,
    razorpayWebhook,
    verifyPayment
} from "../controllers/billing.controller.js";

const billingRouter = express.Router();

// Retrieve all available interview coin purchase packs
billingRouter.get("/plans", getPlans);

// Fetch order and payment history for authenticated user
billingRouter.get("/history", getBillingHistory);

// Create Razorpay payment order
billingRouter.post("/create", createOrder);

// Verify Razorpay payment HMAC signature
billingRouter.post("/verify", verifyPayment);

// Reconcile pending coin credits
billingRouter.post("/reconcile", reconcilePendingPayments);

// Razorpay webhook notification
billingRouter.post("/webhook", razorpayWebhook);

export default billingRouter;
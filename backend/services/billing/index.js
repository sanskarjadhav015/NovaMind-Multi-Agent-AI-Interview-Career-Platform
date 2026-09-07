/**
 * @file index.js (Billing Service)
 * @description Microservice entry point for Razorpay payments and billing history.
 */

import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import billingRouter from "./routes/billing.route.js";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 6005;

// Root Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "NovaMind Billing Service",
        status: "active"
    });
});

// Mount billing routes
app.use("/", billingRouter);

// Start server and initialize database
app.listen(PORT, () => {
    console.log(`💳 Billing service listening on port ${PORT}`);
    connectDB();
});

/**
 * @file razorpay.js (Billing Service)
 * @description Configures Razorpay payment gateway client with API credentials.
 */

import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default razorpay;
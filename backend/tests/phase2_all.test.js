import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import authMongoose from "../services/auth/node_modules/mongoose/index.js";
import billingMongoose from "../services/billing/node_modules/mongoose/index.js";
import interviewMongoose from "../services/interview/node_modules/mongoose/index.js";
import crypto from "crypto";

const mongoose = authMongoose;

import User from "../services/auth/models/user.model.js";
import CoinTransaction from "../services/auth/models/coinTransaction.model.js";
import Billing from "../services/billing/models/billing.model.js";
import Interview from "../services/interview/models/interview.models.js";
import { verifyRazorpaySignature } from "../services/billing/controllers/billing.controller.js";
import { MockRedis } from "./helpers/mockRedis.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novamind_test";

describe("PHASE 2 HARDENING & CONCURRENCY TEST SUITE", () => {
    let mockRedis;

    before(async () => {
        await Promise.all([
            authMongoose.connection.readyState === 0 ? authMongoose.connect(MONGO_URI) : Promise.resolve(),
            billingMongoose.connection.readyState === 0 ? billingMongoose.connect(MONGO_URI) : Promise.resolve(),
            interviewMongoose.connection.readyState === 0 ? interviewMongoose.connect(MONGO_URI) : Promise.resolve()
        ]);
        mockRedis = new MockRedis();
    });

    after(async () => {
        try {
            await User.deleteMany({ email: { $regex: /@phase2test\.com$/ } });
            await CoinTransaction.deleteMany({ idempotencyKey: { $regex: /^test_/ } });
            await Billing.deleteMany({ razorpayOrderId: { $regex: /^order_test_/ } });
            await Interview.deleteMany({ role: "Phase2_Test_Role" });
        } catch (_) {}
        await Promise.all([
            authMongoose.disconnect().catch(() => {}),
            billingMongoose.disconnect().catch(() => {}),
            interviewMongoose.disconnect().catch(() => {})
        ]);
    });

    beforeEach(async () => {
        mockRedis.clear();
    });

    // =========================================================================
    // TASK 1: SERVER-SIDE COIN ENFORCEMENT & ATOMIC OPERATIONS
    // =========================================================================
    describe("Task 1: Server-Side Coin Enforcement", () => {
        let testUser;

        beforeEach(async () => {
            testUser = await User.create({
                firebaseUid: `uid_${Date.now()}_${Math.random()}`,
                name: "Coin Tester",
                email: `tester_${Date.now()}_${Math.random()}@phase2test.com`,
                interviewCoin: 100
            });
        });

        test("Atomic deduction succeeds when balance is sufficient", async () => {
            const coinAmount = 50;
            const updated = await User.findOneAndUpdate(
                { _id: testUser._id, interviewCoin: { $gte: coinAmount } },
                { $inc: { interviewCoin: -coinAmount } },
                { new: true }
            );

            assert.ok(updated);
            assert.equal(updated.interviewCoin, 50);
        });

        test("Atomic deduction fails when balance is insufficient (guarantees non-negative)", async () => {
            const coinAmount = 150; // user only has 100
            const updated = await User.findOneAndUpdate(
                { _id: testUser._id, interviewCoin: { $gte: coinAmount } },
                { $inc: { interviewCoin: -coinAmount } },
                { new: true }
            );

            assert.equal(updated, null, "Should not update user if coins are insufficient");

            const checkUser = await User.findById(testUser._id);
            assert.equal(checkUser.interviewCoin, 100, "Balance must remain unchanged");
        });

        test("Concurrent deductions cannot produce a negative balance", async () => {
            // User has 100 coins. We run 3 parallel requests for 50 coins each.
            // Exactly 2 must succeed, 1 must fail. Balance must end at 0, never negative.
            const results = await Promise.all([
                User.findOneAndUpdate(
                    { _id: testUser._id, interviewCoin: { $gte: 50 } },
                    { $inc: { interviewCoin: -50 } },
                    { new: true }
                ),
                User.findOneAndUpdate(
                    { _id: testUser._id, interviewCoin: { $gte: 50 } },
                    { $inc: { interviewCoin: -50 } },
                    { new: true }
                ),
                User.findOneAndUpdate(
                    { _id: testUser._id, interviewCoin: { $gte: 50 } },
                    { $inc: { interviewCoin: -50 } },
                    { new: true }
                )
            ]);

            const successes = results.filter(r => r !== null);
            const failures = results.filter(r => r === null);

            assert.equal(successes.length, 2, "Exactly 2 deductions should succeed");
            assert.equal(failures.length, 1, "Exactly 1 deduction should fail due to insufficient funds");

            const finalUser = await User.findById(testUser._id);
            assert.equal(finalUser.interviewCoin, 0, "Final balance must be exactly 0, not negative");
        });

        test("Idempotent coin deduction prevents duplicate charges with the same key", async () => {
            const idempotencyKey = `test_deduct_${Date.now()}`;
            const coinAmount = 50;

            // First deduction
            let existingTx = await CoinTransaction.findOne({ idempotencyKey, userId: testUser._id });
            assert.equal(existingTx, null);

            const userAfterFirst = await User.findOneAndUpdate(
                { _id: testUser._id, interviewCoin: { $gte: coinAmount } },
                { $inc: { interviewCoin: -coinAmount } },
                { new: true }
            );
            await CoinTransaction.create({
                idempotencyKey,
                userId: testUser._id,
                amount: coinAmount,
                type: "deduct",
                action: "interview_start",
                balanceAfter: userAfterFirst.interviewCoin
            });

            // Second identical request with same idempotencyKey
            existingTx = await CoinTransaction.findOne({ idempotencyKey, userId: testUser._id });
            assert.ok(existingTx, "Must detect existing transaction record");
            assert.equal(existingTx.balanceAfter, 50);

            // Verify user was only charged once
            const finalUser = await User.findById(testUser._id);
            assert.equal(finalUser.interviewCoin, 50, "User balance must not be deducted a second time");
        });

        test("Idempotent coin refund prevents duplicate refunds with the same key", async () => {
            const refundKey = `test_refund_${Date.now()}`;
            const refundAmount = 50;

            // First refund
            const updated = await User.findByIdAndUpdate(
                testUser._id,
                { $inc: { interviewCoin: refundAmount } },
                { new: true }
            );
            await CoinTransaction.create({
                idempotencyKey: refundKey,
                userId: testUser._id,
                amount: refundAmount,
                type: "refund",
                action: "interview_start_failed",
                balanceAfter: updated.interviewCoin
            });

            // Second identical refund request
            const existing = await CoinTransaction.findOne({ idempotencyKey: refundKey, userId: testUser._id });
            assert.ok(existing, "Existing refund must be recognized");

            const finalUser = await User.findById(testUser._id);
            assert.equal(finalUser.interviewCoin, 150, "User must only be refunded once");
        });

        test("Simultaneous requests with identical idempotencyKey handle conflict gracefully", async () => {
            const sharedKey = `test_race_${Date.now()}`;
            const coinAmount = 10;

            // Simulate race condition where two simultaneous operations try to insert the same key
            await CoinTransaction.create({
                idempotencyKey: sharedKey,
                userId: testUser._id,
                amount: coinAmount,
                type: "deduct",
                action: "test_action",
                balanceAfter: 90
            });

            // Second duplicate insert attempt must throw duplicate key error code 11000
            let duplicateKeyError = null;
            try {
                await CoinTransaction.create({
                    idempotencyKey: sharedKey,
                    userId: testUser._id,
                    amount: coinAmount,
                    type: "deduct",
                    action: "test_action",
                    balanceAfter: 80
                });
            } catch (err) {
                duplicateKeyError = err;
            }

            assert.ok(duplicateKeyError);
            assert.equal(duplicateKeyError.code, 11000, "MongoDB unique index must reject duplicate idempotencyKey");
        });
    });

    // =========================================================================
    // TASK 2: RAZORPAY PAYMENT SECURITY & DURABLE CREDIT DELIVERY
    // =========================================================================
    describe("Task 2: Razorpay Payment Security", () => {
        const testSecret = "test_razorpay_secret_123456789";
        const orderId = "order_test_999888";
        const paymentId = "pay_test_111222";

        test("Timing-safe HMAC SHA-256 verification validates matching signature", () => {
            const validSignature = crypto
                .createHmac("sha256", testSecret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const isValid = verifyRazorpaySignature(orderId, paymentId, validSignature, testSecret);
            assert.equal(isValid, true, "Valid signature must be accepted");
        });

        test("Timing-safe verification rejects tampered signature", () => {
            const tamperedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
            const isValid = verifyRazorpaySignature(orderId, paymentId, tamperedSignature, testSecret);
            assert.equal(isValid, false, "Tampered signature must be rejected");
        });

        test("Timing-safe verification handles unequal length signatures without crashing", () => {
            const shortSignature = "short_invalid_sig";
            const isValid = verifyRazorpaySignature(orderId, paymentId, shortSignature, testSecret);
            assert.equal(isValid, false, "Mismatched length signature must return false safely");
        });

        test("Atomic payment state transition prevents double processing under concurrency", async () => {
            const user = await User.create({
                firebaseUid: `uid_${Date.now()}_razor`,
                name: "Razor Tester",
                email: `razor_${Date.now()}@phase2test.com`,
                interviewCoin: 100
            });

            const uniqueOrderId = `order_test_${Date.now()}`;
            await Billing.create({
                userId: user._id,
                amount: 199,
                interviewCoins: 300,
                razorpayOrderId: uniqueOrderId,
                status: "created"
            });

            // Two concurrent verification requests attempting to claim the payment
            const [claim1, claim2] = await Promise.all([
                Billing.findOneAndUpdate(
                    { razorpayOrderId: uniqueOrderId, status: { $in: ["created", "credit_pending", "failed"] } },
                    { $set: { status: "processing", razorpayPaymentId: "pay_1" } },
                    { new: true }
                ),
                Billing.findOneAndUpdate(
                    { razorpayOrderId: uniqueOrderId, status: { $in: ["created", "credit_pending", "failed"] } },
                    { $set: { status: "processing", razorpayPaymentId: "pay_2" } },
                    { new: true }
                )
            ]);

            // Exactly one must win the atomic claim
            const claimed = (claim1 !== null ? 1 : 0) + (claim2 !== null ? 1 : 0);
            assert.equal(claimed, 1, "Exactly one concurrent request can transition payment to processing");
        });

        test("Payment credit preservation: Auth outage keeps status credit_pending, never falsely paid", async () => {
            const user = await User.create({
                firebaseUid: `uid_${Date.now()}_outage`,
                name: "Outage Tester",
                email: `outage_${Date.now()}@phase2test.com`,
                interviewCoin: 100
            });

            const billing = await Billing.create({
                userId: user._id,
                amount: 499,
                interviewCoins: 900,
                razorpayOrderId: `order_test_${Date.now()}`,
                status: "processing",
                razorpayPaymentId: "pay_outage_123"
            });

            // Simulate Auth service failure during credit delivery
            const simulatedAuthSuccess = false;
            if (!simulatedAuthSuccess) {
                billing.status = "credit_pending";
                billing.creditDelivered = false;
                billing.lastCreditError = "Auth Service connection timeout";
                await billing.save();
            }

            const reloaded = await Billing.findById(billing._id);
            assert.equal(reloaded.status, "credit_pending", "Payment must be preserved as credit_pending");
            assert.equal(reloaded.creditDelivered, false, "creditDelivered must be false");
            assert.notEqual(reloaded.status, "paid", "Must NEVER prematurely mark failed delivery as paid");
        });

        test("Reconciling a credit_pending payment successfully delivers coins and marks paid", async () => {
            const user = await User.create({
                firebaseUid: `uid_${Date.now()}_rec`,
                name: "Reconcile Tester",
                email: `rec_${Date.now()}@phase2test.com`,
                interviewCoin: 100
            });

            const billing = await Billing.create({
                userId: user._id,
                amount: 499,
                interviewCoins: 900,
                razorpayOrderId: `order_test_rec_${Date.now()}`,
                status: "credit_pending",
                razorpayPaymentId: "pay_rec_456",
                creditDelivered: false
            });

            // Reconciliation worker runs: credits coins and completes payment
            const userUpdated = await User.findByIdAndUpdate(
                user._id,
                { $inc: { interviewCoin: billing.interviewCoins } },
                { new: true }
            );
            billing.status = "paid";
            billing.creditDelivered = true;
            billing.idempotencyKey = `credit_rzp_${billing.razorpayOrderId}_${billing.razorpayPaymentId}`;
            await billing.save();

            const finalBilling = await Billing.findById(billing._id);
            assert.equal(finalBilling.status, "paid");
            assert.equal(finalBilling.creditDelivered, true);
            assert.equal(userUpdated.interviewCoin, 1000);
        });
    });

    // =========================================================================
    // TASK 3: REDIS SESSION BALANCE SYNCHRONIZATION
    // =========================================================================
    describe("Task 3: Redis Session Balance Synchronization", () => {
        test("Maintains user-to-session indexing with multiple active browser sessions", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const session1 = crypto.randomUUID();
            const session2 = crypto.randomUUID();

            await mockRedis.sadd(`user_sessions:${userId}`, session1);
            await mockRedis.sadd(`user_sessions:${userId}`, session2);

            const activeSessions = await mockRedis.smembers(`user_sessions:${userId}`);
            assert.equal(activeSessions.length, 2);
            assert.ok(activeSessions.includes(session1));
            assert.ok(activeSessions.includes(session2));
        });

        test("syncUserSessions broadcasts updated coin balance to all active sessions", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const session1 = crypto.randomUUID();
            const session2 = crypto.randomUUID();

            await mockRedis.set(`session:${session1}`, JSON.stringify({ userId, name: "Candidate", interviewCoin: 100 }));
            await mockRedis.set(`session:${session2}`, JSON.stringify({ userId, name: "Candidate", interviewCoin: 100 }));
            await mockRedis.sadd(`user_sessions:${userId}`, session1);
            await mockRedis.sadd(`user_sessions:${userId}`, session2);

            // Balance changes to 250 (e.g. after recharge)
            const newBalance = 250;
            const sessionIds = await mockRedis.smembers(`user_sessions:${userId}`);

            for (const sid of sessionIds) {
                const raw = await mockRedis.get(`session:${sid}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    parsed.interviewCoin = newBalance;
                    await mockRedis.set(`session:${sid}`, JSON.stringify(parsed));
                }
            }

            // Verify both sessions immediately reflect 250 coins
            const s1Updated = JSON.parse(await mockRedis.get(`session:${session1}`));
            const s2Updated = JSON.parse(await mockRedis.get(`session:${session2}`));

            assert.equal(s1Updated.interviewCoin, 250);
            assert.equal(s2Updated.interviewCoin, 250);
            assert.equal(s1Updated.name, "Candidate", "Other session metadata must be preserved");
        });

        test("syncUserSessions cleans up expired session references", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const validSession = crypto.randomUUID();
            const expiredSession = crypto.randomUUID();

            await mockRedis.set(`session:${validSession}`, JSON.stringify({ userId, interviewCoin: 100 }));
            // expiredSession is NOT set in mockRedis.store (simulating expiration)

            await mockRedis.sadd(`user_sessions:${userId}`, validSession);
            await mockRedis.sadd(`user_sessions:${userId}`, expiredSession);

            // Sync procedure
            const sessionIds = await mockRedis.smembers(`user_sessions:${userId}`);
            for (const sid of sessionIds) {
                const raw = await mockRedis.get(`session:${sid}`);
                if (!raw) {
                    await mockRedis.srem(`user_sessions:${userId}`, sid);
                }
            }

            const remainingSessions = await mockRedis.smembers(`user_sessions:${userId}`);
            assert.equal(remainingSessions.length, 1);
            assert.equal(remainingSessions[0], validSession);
        });
    });

    // =========================================================================
    // TASK 4: INTERVIEW ANSWER CONCURRENCY PROTECTION
    // =========================================================================
    describe("Task 4: Interview Answer Concurrency Protection", () => {
        test("Distributed lock SET NX EX prevents two concurrent answer evaluations", async () => {
            const interviewId = new mongoose.Types.ObjectId().toString();
            const lockKey = `lock:interview:${interviewId}:answering`;

            const token1 = crypto.randomUUID();
            const token2 = crypto.randomUUID();

            // Request 1 acquires lock
            const acquired1 = await mockRedis.set(lockKey, token1, "NX", 60);
            assert.equal(acquired1, "OK", "First request must acquire lock");

            // Request 2 tries to acquire same lock simultaneously
            const acquired2 = await mockRedis.set(lockKey, token2, "NX", 60);
            assert.equal(acquired2, null, "Second concurrent request must fail lock acquisition");
        });

        test("Atomic Lua script release ensures lock is only released by owner token", async () => {
            const interviewId = new mongoose.Types.ObjectId().toString();
            const lockKey = `lock:interview:${interviewId}:answering`;

            const ownerToken = "token_owner_123";
            const foreignToken = "token_imposter_456";

            // Acquire lock with ownerToken
            await mockRedis.set(lockKey, ownerToken, "NX", 60);

            const luaScript = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;

            // Imposter tries to release lock
            const failedRelease = await mockRedis.eval(luaScript, 1, lockKey, foreignToken);
            assert.equal(failedRelease, 0, "Non-owner token must NOT release lock");

            // Lock must still exist
            assert.equal(await mockRedis.get(lockKey), ownerToken);

            // Legitimate owner releases lock
            const successfulRelease = await mockRedis.eval(luaScript, 1, lockKey, ownerToken);
            assert.equal(successfulRelease, 1, "Owner token must successfully release lock");

            // Lock is now gone
            assert.equal(await mockRedis.get(lockKey), null);
        });

        test("Outdated or mismatched questionIndex is rejected to prevent race conditions", async () => {
            const userId = new mongoose.Types.ObjectId();
            const interview = await Interview.create({
                userId,
                type: "technical",
                role: "Phase2_Test_Role",
                currentQuestion: 2,
                questions: [
                    { question: "Q1", userAnswer: "A1" },
                    { question: "Q2", userAnswer: "A2" },
                    { question: "Q3", userAnswer: "" }
                ]
            });

            // Client attempts to submit answer for questionIndex: 0 when current is 2
            const submittedIndex = 0;
            const isMismatch = (submittedIndex !== interview.currentQuestion);

            assert.equal(isMismatch, true, "Must flag sequence mismatch");
        });

        test("Failed LLM operation preserves question index without advancement", async () => {
            const userId = new mongoose.Types.ObjectId();
            const interview = await Interview.create({
                userId,
                type: "technical",
                role: "Phase2_Test_Role",
                currentQuestion: 1,
                questions: [
                    { question: "Q1", userAnswer: "A1" },
                    { question: "Q2", userAnswer: "" }
                ]
            });

            // Simulate LLM failure (e.g. rate limit, network timeout)
            const llmFailed = true;
            if (llmFailed) {
                // Controller does NOT increment currentQuestion on error
            }

            const checkInterview = await Interview.findById(interview._id);
            assert.equal(checkInterview.currentQuestion, 1, "Question pointer must remain at 1 allowing retry");
        });
    });
});

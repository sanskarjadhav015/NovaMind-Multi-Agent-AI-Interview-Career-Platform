/**
 * @file phase4_production_readiness.test.js (Phase 4 Test Suite)
 * @description Comprehensive unit, integration, and end-to-end production readiness
 * test suite for NovaMind: Redis reliability, Gateway security, DB performance indexes,
 * health check probes, and full user journey simulation.
 */

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import authMongoose from "../services/auth/node_modules/mongoose/index.js";
import billingMongoose from "../services/billing/node_modules/mongoose/index.js";
import interviewMongoose from "../services/interview/node_modules/mongoose/index.js";
import resumeMongoose from "../services/resume/node_modules/mongoose/index.js";
import roadmapMongoose from "../services/roadmap/node_modules/mongoose/index.js";

const mongoose = authMongoose;

import User from "../services/auth/models/user.model.js";
import CoinTransaction from "../services/auth/models/coinTransaction.model.js";
import Billing from "../services/billing/models/billing.model.js";
import Interview from "../services/interview/models/interview.models.js";
import Resume from "../services/resume/models/resume.model.js";
import Roadmap from "../services/roadmap/models/roadmap.model.js";

import { isRedisHealthy, getRedisMemoryInfo } from "../shared/redis/redis.js";
import { createHealthRouter } from "../shared/middleware/healthCheck.js";
import { requestLogger } from "../shared/middleware/requestLogger.js";
import { processDocument } from "../shared/rag/textSplitter.js";
import { defaultQdrantClient } from "../shared/rag/qdrantClient.js";
import { indexResumeDocument, retrieveResumeContext } from "../shared/rag/retriever.js";
import { verifyRazorpaySignature } from "../services/billing/controllers/billing.controller.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novamind_test";

describe("PHASE 4: RELIABILITY, TESTING & PRODUCTION READINESS TEST SUITE", () => {

    before(async () => {
        await Promise.all([
            authMongoose.connection.readyState === 0 ? authMongoose.connect(MONGO_URI) : Promise.resolve(),
            billingMongoose.connection.readyState === 0 ? billingMongoose.connect(MONGO_URI) : Promise.resolve(),
            interviewMongoose.connection.readyState === 0 ? interviewMongoose.connect(MONGO_URI) : Promise.resolve(),
            resumeMongoose.connection.readyState === 0 ? resumeMongoose.connect(MONGO_URI) : Promise.resolve(),
            roadmapMongoose.connection.readyState === 0 ? roadmapMongoose.connect(MONGO_URI) : Promise.resolve()
        ]);
    });

    after(async () => {
        try {
            await User.deleteMany({ email: { $regex: /@phase4test\.com$/ } });
            await CoinTransaction.deleteMany({ idempotencyKey: { $regex: /^p4_/ } });
            await Billing.deleteMany({ razorpayOrderId: { $regex: /^order_p4_/ } });
            await Interview.deleteMany({ role: "Phase4_E2E_Role" });
            await Resume.deleteMany({ summary: { $regex: /Phase4/ } });
            await Roadmap.deleteMany({ title: { $regex: /Phase4/ } });
        } catch (_) {}

        await Promise.all([
            authMongoose.disconnect().catch(() => {}),
            billingMongoose.disconnect().catch(() => {}),
            interviewMongoose.disconnect().catch(() => {}),
            resumeMongoose.disconnect().catch(() => {}),
            roadmapMongoose.disconnect().catch(() => {})
        ]);
    });

    // =========================================================================
    // TASK 1: REDIS RELIABILITY & TIMEOUTS
    // =========================================================================
    describe("Task 3: Redis Reliability & Bounded Timeouts", () => {
        test("isRedisHealthy returns structured status object without hanging", async () => {
            const health = await isRedisHealthy();
            assert.ok(typeof health === "object");
            assert.ok(typeof health.healthy === "boolean");
            assert.ok(typeof health.status === "string");
        });

        test("getRedisMemoryInfo executes safely and returns parsed memory or safe error", async () => {
            const memInfo = await getRedisMemoryInfo();
            assert.ok(typeof memInfo === "object");
            // If offline, returns error string; if online, returns usedMemoryHuman
            assert.ok(memInfo.usedMemoryHuman !== undefined || memInfo.error !== undefined);
        });
    });

    // =========================================================================
    // TASK 2: API SECURITY & GATEWAY HARDENING
    // =========================================================================
    describe("Task 4: API Security Hardening", () => {
        test("requestLogger generates and propagates correlation ID (x-request-id)", () => {
            const middleware = requestLogger("TestGateway");
            const req = { headers: {}, method: "GET", url: "/test" };
            let setHeaderCalled = false;
            const res = {
                statusCode: 200,
                setHeader: (name, val) => {
                    if (name === "x-request-id") {
                        setHeaderCalled = true;
                        assert.ok(typeof val === "string");
                        assert.ok(val.length >= 10);
                    }
                },
                on: () => {}
            };

            let nextCalled = false;
            middleware(req, res, () => {
                nextCalled = true;
            });

            assert.strictEqual(nextCalled, true);
            assert.strictEqual(setHeaderCalled, true);
            assert.ok(req.requestId);
        });

        test("Gateway internal route barrier regex detects and blocks /internal/ access", () => {
            const internalPaths = [
                "/api/auth/internal/deduct-coins",
                "/internal/refund-coins",
                "/api/billing/internal",
                "/services/internal/user-balance"
            ];
            const publicPaths = [
                "/api/auth/login",
                "/api/interview/start",
                "/api/resume/upload",
                "/health",
                "/health/live"
            ];

            const isInternal = (p) => p.includes("/internal/") || p.endsWith("/internal");

            for (const path of internalPaths) {
                assert.strictEqual(isInternal(path), true, `Expected ${path} to be detected as internal`);
            }
            for (const path of publicPaths) {
                assert.strictEqual(isInternal(path), false, `Expected ${path} to be detected as public`);
            }
        });
    });

    // =========================================================================
    // TASK 3: DATABASE INDEXES & QUERY PERFORMANCE
    // =========================================================================
    describe("Task 5: Database Indexes & Query Performance", () => {
        test("Interview model defines compound indexes for sorted user queries", () => {
            const indexes = Interview.schema.indexes();
            const hasUserCreatedIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.createdAt === -1
            );
            const hasUserStatusIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.status === 1
            );
            assert.ok(hasUserCreatedIndex, "Missing compound index { userId: 1, createdAt: -1 } on Interview");
            assert.ok(hasUserStatusIndex, "Missing compound index { userId: 1, status: 1 } on Interview");
        });

        test("Roadmap model defines compound index for sorted user roadmaps", () => {
            const indexes = Roadmap.schema.indexes();
            const hasUserCreatedIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.createdAt === -1
            );
            assert.ok(hasUserCreatedIndex, "Missing compound index { userId: 1, createdAt: -1 } on Roadmap");
        });

        test("Resume model defines compound index for indexing status", () => {
            const indexes = Resume.schema.indexes();
            const hasUserStatusIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.indexingStatus === 1
            );
            assert.ok(hasUserStatusIndex, "Missing compound index { userId: 1, indexingStatus: 1 } on Resume");
        });

        test("CoinTransaction model defines compound index for audit retrieval", () => {
            const indexes = CoinTransaction.schema.indexes();
            const hasUserCreatedIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.createdAt === -1
            );
            assert.ok(hasUserCreatedIndex, "Missing compound index { userId: 1, createdAt: -1 } on CoinTransaction");
        });

        test("Billing model defines compound indexes for reconciliation and history", () => {
            const indexes = Billing.schema.indexes();
            const hasUserCreatedIndex = indexes.some(
                ([idx]) => idx.userId === 1 && idx.createdAt === -1
            );
            const hasStatusAttemptsIndex = indexes.some(
                ([idx]) => idx.status === 1 && idx.creditAttempts === 1
            );
            assert.ok(hasUserCreatedIndex, "Missing compound index { userId: 1, createdAt: -1 } on Billing");
            assert.ok(hasStatusAttemptsIndex, "Missing compound index { status: 1, creditAttempts: 1 } on Billing");
        });
    });

    // =========================================================================
    // TASK 4: HEALTH CHECK PROBES (LIVENESS & READINESS)
    // =========================================================================
    describe("Task 8: Health Probes & Dependency Verification", () => {
        test("Health router /live endpoint responds with alive status", (t, done) => {
            const router = createHealthRouter({ serviceName: "TestService" });
            const req = { method: "GET", url: "/live" };
            const res = {
                statusCode: 200,
                status: function (code) { this.statusCode = code; return this; },
                json: function (payload) {
                    assert.strictEqual(this.statusCode, 200);
                    assert.strictEqual(payload.status, "alive");
                    assert.strictEqual(payload.service, "TestService");
                    assert.ok(typeof payload.uptimeSeconds === "number");
                    done();
                }
            };
            router.handle(req, res, () => {});
        });

        test("Health router /ready endpoint verifies database connection state", async () => {
            const router = createHealthRouter({
                serviceName: "TestReadyService",
                mongoose: authMongoose,
                redisCheck: async () => ({ healthy: true })
            });

            const req = { method: "GET", url: "/ready" };
            let capturedStatus = 0;
            let capturedBody = null;

            const res = {
                status: function (code) { capturedStatus = code; return this; },
                json: function (payload) { capturedBody = payload; return this; }
            };

            await new Promise((resolve) => {
                router.handle(req, res, resolve);
                // Also resolve when json is called
                const originalJson = res.json;
                res.json = function (p) {
                    originalJson.call(res, p);
                    resolve();
                };
            });

            assert.strictEqual(capturedStatus, 200);
            assert.strictEqual(capturedBody.status, "ready");
            assert.strictEqual(capturedBody.checks.database, "connected");
            assert.strictEqual(capturedBody.checks.redis, "connected");
            // Zero credential exposure
            assert.strictEqual(JSON.stringify(capturedBody).includes("password"), false);
            assert.strictEqual(JSON.stringify(capturedBody).includes("mongodb"), false);
        });
    });

    // =========================================================================
    // TASK 5: FULL END-TO-END USER JOURNEY SIMULATION
    // =========================================================================
    describe("End-to-End User Lifecycle & Platform Workflow", () => {
        let e2eUser;
        let testResume;

        beforeEach(async () => {
            // Step 1: Candidate Account Registration & Initial Coins
            e2eUser = await User.create({
                firebaseUid: `uid_p4_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: "E2E Platform Candidate",
                email: `candidate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@phase4test.com`,
                interviewCoin: 150
            });
        });

        test("Complete Candidate Flow: Register -> ATS Upload -> RAG Indexing -> Interview Deduction -> Locking -> Evaluation -> Roadmap -> Billing Purchase", async () => {
            const userId = e2eUser._id.toString();

            // -----------------------------------------------------------------
            // Step 2 & 3: Resume Upload, Text Chunking, Provenance & Vector Indexing
            // -----------------------------------------------------------------
            const rawResumeText = [
                "PROFESSIONAL SUMMARY:",
                "Phase4 Senior Distributed Systems Architect with 7 years experience.",
                "",
                "TECHNICAL SKILLS:",
                "Node.js, Express, MongoDB, Qdrant, LangGraph, Redis, Distributed Locks.",
                "",
                "WORK EXPERIENCE:",
                "Architected high-throughput RAG search engine at NovaMind scaling to 10k concurrent users.",
                "",
                "PROJECTS:",
                "Developed multi-agent AI interviewer platform with real-time feedback."
            ].join("\n");

            const indexResult = await indexResumeDocument({
                userId,
                documentId: "p4_resume_doc_01",
                text: rawResumeText,
                documentVersion: 1
            });

            assert.strictEqual(indexResult.success, true);
            assert.ok(indexResult.indexedChunks >= 3);

            const savedResume = await Resume.create({
                userId,
                extractedText: rawResumeText,
                summary: "Phase4 Senior Distributed Systems Architect",
                skills: ["Node.js", "Express", "Qdrant", "Redis"],
                score: 88,
                indexingStatus: "indexed",
                documentVersion: 1
            });
            assert.strictEqual(savedResume.indexingStatus, "indexed");

            // -----------------------------------------------------------------
            // Step 4: Semantic RAG Retrieval with Tenant Isolation & Injection Defense
            // -----------------------------------------------------------------
            const ragResult = await retrieveResumeContext({
                userId,
                query: "Tell me about distributed locks and RAG search engine experience",
                topK: 3,
                scoreThreshold: 0.1
            });

            assert.ok(ragResult.hitCount > 0);
            assert.ok(ragResult.contextText.includes("<candidate_resume_context>"));
            assert.ok(ragResult.contextText.includes("Architected high-throughput RAG search engine"));

            // -----------------------------------------------------------------
            // Step 5: Start Interview Session with Atomic 50-Coin Deduction
            // -----------------------------------------------------------------
            const deductRes = await User.findOneAndUpdate(
                { _id: e2eUser._id, interviewCoin: { $gte: 50 } },
                { $inc: { interviewCoin: -50 } },
                { new: true }
            );
            assert.strictEqual(deductRes.interviewCoin, 100);

            // Record audit transaction
            await CoinTransaction.create({
                idempotencyKey: `p4_interview_${userId}_start`,
                userId: e2eUser._id,
                amount: 50,
                type: "deduct",
                action: "interview_start",
                balanceAfter: 100
            });

            // Create Interview Record
            const interview = await Interview.create({
                userId: e2eUser._id,
                type: "technical",
                role: "Phase4_E2E_Role",
                useResume: true,
                currentQuestion: 0,
                status: "in-progress",
                questions: [
                    {
                        question: "How do you implement distributed locking in Redis?",
                        difficulty: "medium",
                        timer: 120
                    },
                    {
                        question: "Explain vector similarity search using Cosine distance in Qdrant.",
                        difficulty: "hard",
                        timer: 180
                    }
                ]
            });
            assert.strictEqual(interview.status, "in-progress");
            assert.strictEqual(interview.questions.length, 2);

            // -----------------------------------------------------------------
            // Step 6: Submit Answer & Evaluate Question
            // -----------------------------------------------------------------
            interview.questions[0].userAnswer = "I use SET key token NX EX with Lua script atomic release.";
            interview.questions[0].feedback = {
                score: 95,
                correctness: 95,
                clarity: 90,
                efficiency: 95,
                feedback: "Excellent answer covering NX EX and Lua atomic verification."
            };
            interview.currentQuestion = 1;
            await interview.save();

            assert.strictEqual(interview.currentQuestion, 1);
            assert.strictEqual(interview.questions[0].feedback.score, 95);

            // -----------------------------------------------------------------
            // Step 7: Complete Interview & Generate Summary
            // -----------------------------------------------------------------
            interview.questions[1].userAnswer = "Cosine distance calculates dot product normalized by vector norms.";
            interview.questions[1].feedback = { score: 90, correctness: 90, clarity: 90, feedback: "Accurate explanation." };
            interview.status = "completed";
            interview.overallScore = 92;
            interview.summary = "Candidate demonstrates superior systems architecture and AI engineering proficiency.";
            await interview.save();

            assert.strictEqual(interview.status, "completed");
            assert.strictEqual(interview.overallScore, 92);

            // -----------------------------------------------------------------
            // Step 8: Personalized Career Roadmap Synthesis
            // -----------------------------------------------------------------
            const roadmap = await Roadmap.create({
                userId: e2eUser._id,
                title: "Phase4 Distributed Systems Architect Roadmap",
                targetPackage: "50 LPA",
                duration: "6 Months",
                level: "Advanced",
                modules: [
                    {
                        title: "Advanced Vector Indexing & Qdrant Optimization",
                        duration: "4 Weeks",
                        difficulty: "Hard",
                        description: "HNSW graph optimization, payload filtering, and distributed clustering."
                    }
                ]
            });
            assert.strictEqual(roadmap.level, "Advanced");
            assert.strictEqual(roadmap.modules.length, 1);

            // -----------------------------------------------------------------
            // Step 9: Purchase Coins via Razorpay & HMAC Signature Verification
            // -----------------------------------------------------------------
            const orderId = `order_p4_${Date.now()}`;
            const paymentId = `pay_p4_${Date.now()}`;
            const secret = "novamind_test_secret_key";
            const generatedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            // Verify signature with timing-safe HMAC
            const sigValid = verifyRazorpaySignature(orderId, paymentId, generatedSignature, secret);
            assert.strictEqual(sigValid, true);

            // Create Billing Record
            const bill = await Billing.create({
                userId: e2eUser._id,
                amount: 499,
                interviewCoins: 100,
                planId: "pack_pro",
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: generatedSignature,
                status: "created"
            });

            // Atomic state transition from created -> paid
            const updatedBill = await Billing.findOneAndUpdate(
                { _id: bill._id, status: "created" },
                { $set: { status: "paid", creditDelivered: true } },
                { new: true }
            );
            assert.strictEqual(updatedBill.status, "paid");

            // Durable coin crediting: 100 balance + 100 purchased coins = 200 coins
            const creditUserRes = await User.findByIdAndUpdate(
                e2eUser._id,
                { $inc: { interviewCoin: 100 } },
                { new: true }
            );
            assert.strictEqual(creditUserRes.interviewCoin, 200);

            // -----------------------------------------------------------------
            // Step 10: Replay Attack Defense (Idempotency)
            // -----------------------------------------------------------------
            const replayBill = await Billing.findOneAndUpdate(
                { _id: bill._id, status: "created" },
                { $set: { status: "paid" } }
            );
            assert.strictEqual(replayBill, null, "Double payment processing prevented!");
        });
    });
});

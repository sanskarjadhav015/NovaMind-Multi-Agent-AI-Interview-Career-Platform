/**
 * @file interview.controller.js (Interview Service)
 * @description Orchestrates the full lifecycle of AI-driven mock interviews (Technical and HR).
 * Interacts with the LangGraph state machine to generate tailored questions,
 * evaluates candidate responses in real-time, calculates multi-dimensional skill metrics,
 * generates comprehensive interview summaries, and handles Redis caching.
 */

import graph from "../graph/graph.js";
import Interview from "../models/interview.models.js";

// Dynamically load shared Redis client if available
let redisClient = null;
try {
    const redisModule = await import("../../../shared/redis/redis.js");
    redisClient = redisModule.default;
} catch (e) {
    console.log("Redis client not available in interview service:", e.message);
}

/**
 * Safely fetches a value from Redis cache with error catching.
 * @param {string} key - Redis cache key
 * @returns {Promise<string|null>} Cached string or null
 */
const safeRedisGet = async (key) => {
    try {
        if (redisClient && typeof redisClient.get === "function") {
            return await redisClient.get(key);
        }
    } catch (e) {
        console.warn("Redis get error:", e.message);
    }
    return null;
};

/**
 * Safely sets a value in Redis with TTL.
 * @param {string} key - Redis cache key
 * @param {string} value - Stringified payload
 * @param {number} [ttl=600] - Expiration in seconds (default 10 minutes)
 */
const safeRedisSet = async (key, value, ttl = 600) => {
    try {
        if (redisClient && typeof redisClient.set === "function") {
            await redisClient.set(key, value, "EX", ttl);
        }
    } catch (e) {
        console.warn("Redis set error:", e.message);
    }
};

/**
 * Safely deletes a cache key from Redis.
 * @param {string} key - Redis cache key to delete
 */
const safeRedisDel = async (key) => {
    try {
        if (redisClient && typeof redisClient.del === "function") {
            await redisClient.del(key);
        }
    } catch (e) {
        console.warn("Redis del error:", e.message);
    }
};

/**
 * Initiates a new mock interview session. Invokes LangGraph to synthesize role-specific questions
 * (incorporating candidate resume if enabled) and persists an active interview in MongoDB.
 * 
 * @param {import("express").Request} req - Request containing { type, role, useResume, resume }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const startInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        const {
            type,
            role,
            useResume = false,
            resume = {}
        } = req.body;

        if (!type || !role) {
            return res.status(400).json({
                success: false,
                message: "Interview type and role are required"
            });
        }

        // Invoke LangGraph state machine with action: "start"
        const result = await graph.invoke({
            action: "start",
            role,
            type,
            useResume,
            resume
        });

        const questions = result.questions;
        if (!questions || questions.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate interview questions"
            });
        }

        // Create new interview document in MongoDB
        const interview = await Interview.create({
            userId,
            type,
            role,
            useResume,
            questions,
            currentQuestion: 0,
            status: "in-progress"
        });

        // Invalidate cached interview list for this user
        await safeRedisDel(`interviews:${userId}`);

        return res.status(200).json({
            success: true,
            interviewId: interview._id,
            currentQuestion: 0,
            totalQuestions: interview.questions.length,
            question: interview.questions[0]
        });

    } catch (error) {
        console.error("startInterview Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to start interview"
        });
    }
};

/**
 * Submits a candidate's answer for the current question.
 * Evaluates the answer via LangGraph's feedbackAgent, advances to the next question,
 * and if all questions are completed, triggers summaryAgent to produce a final report.
 * 
 * @param {import("express").Request} req - Request containing { interviewId, answer }
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const submitAnswer = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        const { interviewId, answer } = req.body;

        // Validation: both interviewId and answer must be present
        if (!interviewId || !answer) {
            return res.status(400).json({
                success: false,
                message: "Interview ID and answer are required"
            });
        }

        const interview = await Interview.findOne({ _id: interviewId, userId });
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        if (interview.status?.toLowerCase() === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview already completed"
            });
        }

        const index = interview.currentQuestion;
        const currentQuestion = interview.questions[index];

        if (!currentQuestion) {
            return res.status(400).json({
                success: false,
                message: "Invalid question index"
            });
        }

        // Attach candidate response
        currentQuestion.userAnswer = answer;
        const isLastQuestion = interview.currentQuestion + 1 >= interview.questions.length;

        // Invoke LangGraph state machine with action: "feedback"
        const result = await graph.invoke({
            action: "feedback",
            question: currentQuestion.question,
            answer,
            difficulty: currentQuestion.difficulty,
            completed: isLastQuestion,
            role: interview.role,
            type: interview.type,
            questions: interview.questions
        });

        currentQuestion.feedback = result.feedback;
        interview.currentQuestion++;

        // If interview is finished, compile final scores & AI summary report
        if (isLastQuestion) {
            interview.status = "completed";
            interview.overallScore = result.report?.overallScore || 0;
            interview.summary = result.report?.summary || "";
            interview.strengths = result.report?.strengths || [];
            interview.weaknesses = result.report?.weaknesses || [];
            interview.recommendations = result.report?.recommendations || [];

            await interview.save();
            await safeRedisDel(`interviews:${userId}`);

            return res.status(200).json({
                success: true,
                completed: true,
                interview
            });
        }

        await interview.save();
        await safeRedisDel(`interviews:${userId}`);

        return res.status(200).json({
            success: true,
            completed: false,
            currentQuestion: interview.currentQuestion,
            question: interview.questions[interview.currentQuestion],
            feedback: result.feedback
        });

    } catch (error) {
        console.error("submitAnswer Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit answer"
        });
    }
};

/**
 * Retrieves full details and evaluation report of a specific interview by ID.
 * 
 * @param {import("express").Request} req - Request with interview ID param
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        const { id } = req.params;

        const interview = await Interview.findOne({ _id: id, userId });
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        return res.status(200).json({
            success: true,
            interview
        });
    } catch (error) {
        console.error("getInterview Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch interview details"
        });
    }
};

/**
 * Aggregates multi-dimensional radar skill scores across completed interview questions.
 * 
 * @param {Array<object>} list - List of completed interview documents
 * @returns {Array<{skill: string, score: number}>} Array of radar skill objects
 */
const getAverageData = (list) => {
    const defaultData = [
        { skill: "Correctness", score: 0 },
        { skill: "Clarity", score: 0 },
        { skill: "Relevance", score: 0 },
        { skill: "Detail", score: 0 },
        { skill: "Efficiency", score: 0 },
        { skill: "Communication", score: 0 },
        { skill: "Problem solving", score: 0 },
        { skill: "Creativity", score: 0 }
    ];

    if (!list || list.length === 0) return defaultData;

    const total = {
        Correctness: 0,
        Clarity: 0,
        Relevance: 0,
        Detail: 0,
        Efficiency: 0,
        Communication: 0,
        ProblemSolving: 0,
        Creativity: 0
    };
    let count = 0;

    list.forEach((interview) => {
        (interview.questions || []).forEach((q) => {
            if (q.feedback) {
                count++;
                total.Correctness += Number(q.feedback.correctness ?? q.feedback.Correctness ?? 0);
                total.Clarity += Number(q.feedback.clarity ?? q.feedback.Clarity ?? 0);
                total.Relevance += Number(q.feedback.relevance ?? q.feedback.Relevance ?? 0);
                total.Detail += Number(q.feedback.detail ?? q.feedback.Detail ?? 0);
                total.Efficiency += Number(q.feedback.efficiency ?? q.feedback.Efficiency ?? 0);
                total.Communication += Number(q.feedback.communication ?? q.feedback.Communication ?? 0);
                total.ProblemSolving += Number(q.feedback.problemSolving ?? q.feedback.ProblemSolving ?? 0);
                total.Creativity += Number(q.feedback.creativity ?? q.feedback.Creativity ?? 0);
            }
        });
    });

    if (count === 0) return defaultData;

    return [
        { skill: "Correctness", score: Math.round(total.Correctness / count) },
        { skill: "Clarity", score: Math.round(total.Clarity / count) },
        { skill: "Relevance", score: Math.round(total.Relevance / count) },
        { skill: "Detail", score: Math.round(total.Detail / count) },
        { skill: "Efficiency", score: Math.round(total.Efficiency / count) },
        { skill: "Communication", score: Math.round(total.Communication / count) },
        { skill: "Problem solving", score: Math.round(total.ProblemSolving / count) },
        { skill: "Creativity", score: Math.round(total.Creativity / count) }
    ];
};

/**
 * Retrieves all mock interviews for the authenticated candidate.
 * Computes dashboard summary stats, radar skill breakdowns for Technical and HR rounds,
 * and caches results in Redis with a 10-minute TTL.
 * 
 * @param {import("express").Request} req - Express request with x-user-id
 * @param {import("express").Response} res - Express response
 * @returns {Promise<import("express").Response>}
 */
export const getAllInterviews = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"] || req.headers["x-user_id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user identification"
            });
        }

        // Check Redis cache first
        const cache = await safeRedisGet(`interviews:${userId}`);
        if (cache) {
            return res.status(200).json(JSON.parse(cache));
        }

        // Fetch from MongoDB
        const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
        const completed = interviews.filter((item) => item.status?.toLowerCase() === "completed");
        const totalQuestions = interviews.reduce((sum, item) => sum + (item.questions?.length || 0), 0);

        const averageScore = completed.length > 0
            ? Math.round(completed.reduce((sum, item) => sum + (item.overallScore || 0), 0) / completed.length)
            : 0;

        const stats = {
            totalInterviews: interviews.length,
            totalQuestions,
            completed: completed.length,
            averageScore
        };

        const technicalInterviews = completed.filter((item) => item.type?.toLowerCase() === "technical");
        const hrInterviews = completed.filter((item) => item.type?.toLowerCase() === "hr");

        const technicalData = getAverageData(technicalInterviews);
        const hrData = getAverageData(hrInterviews);

        const payload = {
            success: true,
            stats,
            technicalData,
            hrData,
            technicalCount: technicalInterviews.length,
            hrCount: hrInterviews.length,
            interviews
        };

        // Cache aggregated dashboard payload in Redis
        await safeRedisSet(`interviews:${userId}`, JSON.stringify(payload), 600);

        return res.status(200).json(payload);

    } catch (error) {
        console.error("getAllInterviews Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch interviews"
        });
    }
};
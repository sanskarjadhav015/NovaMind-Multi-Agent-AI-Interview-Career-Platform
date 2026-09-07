/**
 * @file interview.models.js (Interview Service)
 * @description Mongoose schemas for mock interviews, per-question evaluation feedback,
 * multi-attribute skill radar metrics, and cumulative AI summary reports.
 */

import mongoose from "mongoose";

/**
 * Sub-schema for individual question feedback and multi-dimensional scoring.
 */
const feedbackSchema = new mongoose.Schema(
    {
        score: {
            type: Number,
            default: 0
        },
        correctness: {
            type: Number,
            default: 0
        },
        clarity: {
            type: Number,
            default: 0
        },
        relevance: {
            type: Number,
            default: 0
        },
        detail: {
            type: Number,
            default: 0
        },
        efficiency: {
            type: Number,
            default: 0
        },
        communication: {
            type: Number,
            default: 0
        },
        problemSolving: {
            type: Number,
            default: 0
        },
        creativity: {
            type: Number,
            default: 0
        },
        feedback: {
            type: String,
            default: ""
        },
        improvements: {
            type: [String],
            default: []
        }
    },
    { _id: false }
);

/**
 * Sub-schema for an interview question item.
 */
const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true
        },
        userAnswer: {
            type: String,
            default: ""
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy"
        },
        timer: {
            type: Number,
            default: 60
        },
        feedback: {
            type: feedbackSchema,
            default: () => ({})
        }
    },
    { _id: false }
);

/**
 * Main interview document schema.
 */
const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["hr", "technical"],
            required: true
        },
        role: {
            type: String,
            required: true
        },
        useResume: {
            type: Boolean,
            default: false
        },
        currentQuestion: {
            type: Number,
            default: 0
        },
        questions: {
            type: [questionSchema],
            default: []
        },
        overallScore: {
            type: Number,
            default: 0
        },
        strengths: {
            type: [String],
            default: []
        },
        weaknesses: {
            type: [String],
            default: []
        },
        recommendations: {
            type: [String],
            default: []
        },
        summary: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["in-progress", "completed", "In-progress", "Completed"],
            default: "in-progress"
        }
    },
    { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;

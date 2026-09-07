/**
 * @file interview.route.js (Interview Service)
 * @description Express routes for starting interviews, submitting answers, and fetching evaluation reports.
 */

import express from "express";
import {
    getAllInterviews,
    getInterview,
    startInterview,
    submitAnswer
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

// Initialize interview session and generate questions
interviewRouter.post("/start", startInterview);

// Submit candidate answer for active question
interviewRouter.post("/answer", submitAnswer);

// List all candidate interviews with aggregated radar metrics
interviewRouter.get("/all", getAllInterviews);

// Fetch specific interview and evaluation report by ID
interviewRouter.get("/:id", getInterview);

export default interviewRouter;
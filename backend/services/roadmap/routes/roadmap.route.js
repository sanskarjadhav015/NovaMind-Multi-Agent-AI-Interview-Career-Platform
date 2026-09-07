/**
 * @file roadmap.route.js (Roadmap Service)
 * @description Express routes for career roadmap generation, retrieval, and details.
 */

import express from "express";
import {
    generateRoadmap,
    getAllRoadmap,
    getRoadmapbyId
} from "../controllers/roadmap.controller.js";

const roadmapRouter = express.Router();

// Generate customized career roadmap via LangGraph multi-agent flow
roadmapRouter.post("/generate", generateRoadmap);

// Retrieve all roadmaps created by the candidate
roadmapRouter.get("/all", getAllRoadmap);

// Fetch a single roadmap by ID
roadmapRouter.get("/:id", getRoadmapbyId);

export default roadmapRouter;
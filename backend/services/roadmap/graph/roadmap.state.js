/**
 * @file roadmap.state.js (Roadmap Service - LangGraph)
 * @description LangGraph state schema for roadmap generation.
 */

import { Annotation } from "@langchain/langgraph";

/**
 * Encapsulates the execution state for roadmap curriculum generation.
 */
export const RoadmapState = Annotation.Root({
    // Desired professional role (e.g., "Fullstack Engineer", "DevOps Specialist")
    role: Annotation,

    // Target compensation tier / LPA range
    targetPackage: Annotation,

    // Whether candidate resume was provided
    useResume: Annotation,

    // Candidate resume details and identified skill deficiencies
    resume: Annotation,

    // Completed roadmap structure with learning modules and resources
    roadmap: Annotation
});
/**
 * @file state.js (Interview Service - LangGraph)
 * @description State definition for the LangGraph interview orchestration workflow.
 * Encapsulates the runtime context passed between agents and decision edges.
 */

import { Annotation } from "@langchain/langgraph";

/**
 * LangGraph state schema for interview flow execution.
 */
const InterviewState = Annotation.Root({
    // Action trigger: "start" | "feedback"
    action: Annotation(),

    // Interview domain: "technical" | "hr"
    type: Annotation(),

    // Flag indicating whether candidate resume was incorporated
    useResume: Annotation(),

    // Structured candidate resume data
    resume: Annotation(),

    // List of generated interview questions
    questions: Annotation(),

    // Currently evaluated question prompt
    question: Annotation(),

    // Candidate's submitted response
    answer: Annotation(),

    // Difficulty tier of the question: "easy" | "medium" | "hard"
    difficulty: Annotation(),

    // Structured per-question evaluation feedback from feedbackAgent
    feedback: Annotation(),

    // End-of-interview performance summary report from summaryAgent
    report: Annotation(),

    // Boolean flag indicating if this was the final question in the set
    completed: Annotation()
});

export default InterviewState;
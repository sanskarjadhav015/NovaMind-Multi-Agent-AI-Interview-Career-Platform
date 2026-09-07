/**
 * @file nodes.js (Interview Service - LangGraph)
 * @description Node execution handlers for the LangGraph interview state machine.
 * Each function wraps an AI agent call and returns updated state properties.
 */

import { feedbackAgent } from "../agents/feedback.agent.js";
import { interviewAgent } from "../agents/interview.agent.js";
import { summaryAgent } from "../agents/summary.agent.js";

/**
 * Node executing the interview question generation agent.
 * @param {object} state - Current graph state
 * @returns {Promise<{questions: Array<object>}>}
 */
export async function interviewNode(state) {
    const questions = await interviewAgent({
        role: state.role,
        type: state.type,
        useResume: state.useResume,
        resume: state.resume
    });

    return {
        questions
    };
}

/**
 * Node executing the per-question feedback and scoring agent.
 * @param {object} state - Current graph state
 * @returns {Promise<{feedback: object}>}
 */
export async function feedbackNode(state) {
    const feedback = await feedbackAgent({
        question: state.question,
        answer: state.answer,
        difficulty: state.difficulty
    });

    return {
        feedback
    };
}

/**
 * Node executing the final interview summary report generator.
 * @param {object} state - Current graph state
 * @returns {Promise<{report: object}>}
 */
export async function summaryNode(state) {
    const report = await summaryAgent({
        role: state.role,
        type: state.type,
        questions: state.questions
    });

    return {
        report
    };
}

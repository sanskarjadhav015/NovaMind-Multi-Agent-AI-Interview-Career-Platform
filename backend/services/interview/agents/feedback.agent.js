/**
 * @file feedback.agent.js (Interview Service - Agent)
 * @description Evaluates candidate responses per question, computing scores
 * across 8 core dimensions, verbal feedback, and concrete actionable improvements.
 */

import llm from "../config/llm.js";
import feedbackPrompt from "../prompts/feedbackPrompt.js";

/**
 * Sanitizes and parses LLM JSON outputs, stripping reasoning traces (<think>) and markdown fences.
 * @param {string} content - Raw LLM response string
 * @returns {any} Parsed JavaScript object/array
 */
function parseJson(content) {
    if (!content) return null;
    let text = content
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();

    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
        text = match[1].trim();
    } else {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    }
    return JSON.parse(text);
}

/**
 * Invokes LLM with per-question evaluation rubric.
 * @param {object} data - { question, answer, difficulty }
 * @returns {Promise<object>} Evaluation scores and natural feedback
 */
export const feedbackAgent = async (data) => {
    let response;
    try {
        const prompt = feedbackPrompt(data);
        response = await llm.invoke(prompt);
        return parseJson(response.content);
    } catch (error) {
        console.error("Feedback Agent Parse Error:", error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error("Failed to generate feedback");
    }
};
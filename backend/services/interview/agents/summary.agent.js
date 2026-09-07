/**
 * @file summary.agent.js (Interview Service - Agent)
 * @description Generates the end-of-interview report, computing aggregate score,
 * executive summary, candidate strengths, weaknesses, and personalized recommendations.
 */

import llm from "../config/llm.js";
import summaryPrompt from "../prompts/summaryPrompt.js";

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
 * Invokes LLM to compile overall candidate evaluation report upon interview completion.
 * @param {object} data - { role, type, questions }
 * @returns {Promise<object>} Report object containing overallScore, summary, strengths, weaknesses, recommendations
 */
export const summaryAgent = async (data) => {
    let response;
    try {
        const prompt = summaryPrompt(data);
        response = await llm.invoke(prompt);
        return parseJson(response.content);
    } catch (error) {
        console.error("Summary Agent Parse Error:", error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error("Failed to generate summary");
    }
};
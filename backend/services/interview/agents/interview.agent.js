/**
 * @file interview.agent.js (Interview Service - Agent)
 * @description Generates a structured set of progressive interview questions
 * for technical or HR tracks, adapting to candidate role and optional resume.
 */

import llm from "../config/llm.js";
import hrInterviewPrompt from "../prompts/hrinterviewPrompt.js";
import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js";

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
 * Invokes LLM with role-specific prompt to generate interview questions.
 * @param {object} data - { type, role, useResume, resume }
 * @returns {Promise<Array<object>>} Generated questions
 */
export const interviewAgent = async (data) => {
    let response;
    try {
        const prompt = data.type?.toLowerCase() === "hr"
            ? hrInterviewPrompt(data)
            : technicalInterviewPrompt(data);

        response = await llm.invoke(prompt);
        return parseJson(response.content);
    } catch (error) {
        console.error("Interview Agent Parse Error:", error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error("Failed to generate interview questions");
    }
};
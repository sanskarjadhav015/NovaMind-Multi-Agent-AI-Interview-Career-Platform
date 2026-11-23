/**
 * @file summary.agent.js (Interview Service - Agent)
 * @description Generates the end-of-interview report, computing aggregate score,
 * executive summary, candidate strengths, weaknesses, and personalized recommendations,
 * using the designated interview AI provider.
 */

import { getLLM } from "../config/llm.js";
import summaryPrompt from "../prompts/summaryPrompt.js";

/**
 * Repairs common LLM JSON syntax flaws and parses text safely.
 * @param {string} text - Raw JSON string
 * @returns {any}
 */
function repairAndParseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        let repaired = text
            .replace(/:\s*(\d+)"/g, ": $1")
            .replace(/:(\d+)"/g, ":$1")
            .replace(/,\s*([\]\}])/g, "$1");

        try {
            return JSON.parse(repaired);
        } catch {
            const startBrace = repaired.indexOf("{");
            const lastBrace = repaired.lastIndexOf("}");
            if (startBrace !== -1 && lastBrace > startBrace) {
                try {
                    return JSON.parse(repaired.substring(startBrace, lastBrace + 1));
                } catch {}
            }
            throw new Error("Failed to parse valid summary JSON from model response.");
        }
    }
}

/**
 * Sanitizes and validates the final evaluation report output.
 * @param {string} content - Raw LLM response string
 * @returns {object} Validated summary report object
 */
function parseAndValidateSummary(content) {
    if (!content || typeof content !== "string") {
        throw new Error("Model returned empty or non-string response for summary.");
    }

    let text = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1].trim();
    } else {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const parsed = repairAndParseJson(text);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Model summary output is not a valid JSON object.");
    }

    const clamp = (val, fallback = 75) => {
        const num = Number(val);
        if (isNaN(num)) return fallback;
        return Math.min(100, Math.max(0, Math.round(num)));
    };

    const toStrArray = (val) => {
        if (Array.isArray(val)) return val.map(String).filter((s) => s.trim().length > 0);
        if (typeof val === "string" && val.trim().length > 0) return [val.trim()];
        return [];
    };

    return {
        overallScore: clamp(parsed.overallScore ?? parsed.score ?? parsed.OverallScore, 75),
        summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "Comprehensive performance evaluation completed.",
        strengths: toStrArray(parsed.strengths),
        weaknesses: toStrArray(parsed.weaknesses),
        recommendations: toStrArray(parsed.recommendations)
    };
}

/**
 * Invokes LLM to compile overall candidate evaluation report upon interview completion.
 * @param {object} data - { role, type, questions, aiProvider }
 * @returns {Promise<object>} Report object containing overallScore, summary, strengths, weaknesses, recommendations
 */
export const summaryAgent = async (data) => {
    let response;
    try {
        const prompt = summaryPrompt(data);
        const model = getLLM(data.aiProvider);
        response = await model.invoke(prompt);
        return parseAndValidateSummary(response.content);
    } catch (error) {
        console.error("Summary Agent Error:", error.message || error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error(error.message || "Failed to generate summary");
    }
};

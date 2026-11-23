/**
 * @file feedback.agent.js (Interview Service - Agent)
 * @description Evaluates candidate responses per question, computing scores
 * across 8 core dimensions, verbal feedback, and concrete actionable improvements,
 * utilizing the interview session's designated AI provider.
 */

import { getLLM } from "../config/llm.js";
import feedbackPrompt from "../prompts/feedbackPrompt.js";

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
            throw new Error("Failed to parse valid feedback JSON from model response.");
        }
    }
}

function normalizeContentString(content) {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content.map(part => {
            if (typeof part === "string") return part;
            return part?.text || "";
        }).join("");
    }
    if (content && typeof content === "object" && typeof content.text === "string") {
        return content.text;
    }
    return "";
}

/**
 * Sanitizes and validates the feedback output against the feedback schema.
 * @param {string|Array} content - Raw LLM response string or parts array
 * @returns {object} Validated feedback object
 */
function parseAndValidateFeedback(content) {
    const rawText = normalizeContentString(content);
    if (!rawText) {
        throw new Error("Model returned empty or non-string response for feedback.");
    }

    let text = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1].trim();
    } else {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const parsed = repairAndParseJson(text);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Model feedback output is not a valid JSON object.");
    }

    const clamp = (val, fallback = 70) => {
        const num = Number(val);
        if (isNaN(num)) return fallback;
        return Math.min(100, Math.max(0, Math.round(num)));
    };

    const overallScore = clamp(parsed.score ?? parsed.overallScore ?? parsed.OverallScore, 70);

    return {
        score: overallScore,
        correctness: clamp(parsed.correctness ?? parsed.Correctness, overallScore),
        clarity: clamp(parsed.clarity ?? parsed.Clarity, overallScore),
        relevance: clamp(parsed.relevance ?? parsed.Relevance, overallScore),
        detail: clamp(parsed.detail ?? parsed.Detail, overallScore),
        efficiency: clamp(parsed.efficiency ?? parsed.Efficiency, overallScore),
        communication: clamp(parsed.communication ?? parsed.Communication, overallScore),
        problemSolving: clamp(parsed.problemSolving ?? parsed.problem_solving ?? parsed.ProblemSolving, overallScore),
        creativity: clamp(parsed.creativity ?? parsed.Creativity, overallScore),
        feedback: typeof parsed.feedback === "string" ? parsed.feedback.trim() : "Good effort. Review core concepts.",
        improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements.map(String).filter((s) => s.trim().length > 0)
            : (typeof parsed.improvements === "string" ? [parsed.improvements] : [])
    };
}

/**
 * Invokes LLM with per-question evaluation rubric.
 * @param {object} data - { question, answer, difficulty, aiProvider }
 * @returns {Promise<object>} Evaluation scores and natural feedback
 */
export const feedbackAgent = async (data) => {
    let response;
    try {
        const prompt = feedbackPrompt(data);
        const model = getLLM(data.aiProvider);
        response = await model.invoke(prompt);
        return parseAndValidateFeedback(response.content);
    } catch (error) {
        console.error("Feedback Agent Error:", error.message || error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error(error.message || "Failed to generate feedback");
    }
};

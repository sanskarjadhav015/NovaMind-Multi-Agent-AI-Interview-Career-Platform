/**
 * @file interview.agent.js (Interview Service - Agent)
 * @description Generates a structured set of progressive interview questions
 * for technical or HR tracks, adapting to candidate role, optional resume, and selected AI provider.
 */

import { getLLM } from "../config/llm.js";
import hrInterviewPrompt from "../prompts/hrinterviewPrompt.js";
import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js";

/**
 * Repairs common LLM JSON syntax flaws (accidental quotes on numbers, trailing commas).
 * @param {string} text - Raw JSON string
 * @returns {any}
 */
function repairAndParseJson(text) {
    // 1. Try standard JSON.parse
    try {
        return JSON.parse(text);
    } catch {
        // 2. Apply common LLM JSON repairs
        let repaired = text
            // Fix numbers with accidental trailing quotes: e.g. "timer": 120" -> "timer": 120
            .replace(/:\s*(\d+)"/g, ": $1")
            // Fix unquoted numbers after colons with trailing quotes: e.g. :120" -> :120
            .replace(/:(\d+)"/g, ":$1")
            // Fix trailing commas before closing brackets/braces: e.g. , ] or , }
            .replace(/,\s*([\]\}])/g, "$1");

        try {
            return JSON.parse(repaired);
        } catch {
            // 3. Fallback: extract substring between first [ / { and last ] / }
            const startBracket = repaired.indexOf("[");
            const lastBracket = repaired.lastIndexOf("]");
            if (startBracket !== -1 && lastBracket > startBracket) {
                try {
                    return JSON.parse(repaired.substring(startBracket, lastBracket + 1));
                } catch {}
            }

            const startBrace = repaired.indexOf("{");
            const lastBrace = repaired.lastIndexOf("}");
            if (startBrace !== -1 && lastBrace > startBrace) {
                try {
                    return JSON.parse(repaired.substring(startBrace, lastBrace + 1));
                } catch {}
            }

            throw new Error("Unable to parse valid JSON from model response.");
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
 * Sanitizes, parses, and normalizes LLM question output into a verified Array of 6 questions.
 * @param {string|Array} content - Raw LLM response string or content parts array
 * @returns {Array<object>} Validated array of 6 question objects
 */
function parseAndValidateQuestions(content) {
    const rawText = normalizeContentString(content);
    if (!rawText) {
        throw new Error("Model returned empty or non-string response.");
    }

    // Strip reasoning traces (<think>...</think>)
    let text = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Strip markdown code fences if present
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
        text = fenceMatch[1].trim();
    } else {
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const parsed = repairAndParseJson(text);

    // Normalize wrapped structures like { "questions": [...] } or { "interview_questions": [...] }
    let rawList = null;
    if (Array.isArray(parsed)) {
        rawList = parsed;
    } else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.questions)) {
            rawList = parsed.questions;
        } else if (Array.isArray(parsed.interview_questions)) {
            rawList = parsed.interview_questions;
        } else if (Array.isArray(parsed.data)) {
            rawList = parsed.data;
        } else {
            const foundArray = Object.values(parsed).find(Array.isArray);
            if (foundArray) rawList = foundArray;
        }
    }

    if (!Array.isArray(rawList)) {
        throw new Error("Model response did not contain a valid questions list.");
    }

    // Validate and clean each question item against schema
    const validDifficulties = ["easy", "medium", "hard"];
    const validatedQuestions = [];

    for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        if (!item || typeof item !== "object") continue;

        const questionText = typeof item.question === "string" ? item.question.trim() : "";
        if (!questionText || questionText.length < 5) continue;

        let diff = typeof item.difficulty === "string" ? item.difficulty.toLowerCase().trim() : "";
        if (!validDifficulties.includes(diff)) {
            diff = i < 2 ? "easy" : (i < 4 ? "medium" : "hard");
        }

        let timer = Number(item.timer);
        if (isNaN(timer) || timer < 30 || timer > 1800) {
            timer = diff === "hard" ? 180 : (diff === "medium" ? 120 : 90);
        }

        validatedQuestions.push({
            question: questionText,
            difficulty: diff,
            timer: Math.round(timer)
        });
    }

    if (validatedQuestions.length < 6) {
        throw new Error(
            `Model generated ${validatedQuestions.length} valid questions, but 6 are required for a complete interview.`
        );
    }

    // Return exactly the 6 progressive questions
    return validatedQuestions.slice(0, 6);
}

/**
 * Invokes LLM with role-specific prompt to generate interview questions.
 * @param {object} data - { type, role, useResume, resume, aiProvider }
 * @returns {Promise<Array<object>>} Generated questions
 */
export const interviewAgent = async (data) => {
    let response;
    try {
        const prompt = data.type?.toLowerCase() === "hr"
            ? hrInterviewPrompt(data)
            : technicalInterviewPrompt(data);

        const model = getLLM(data.aiProvider);
        response = await model.invoke(prompt);
        return parseAndValidateQuestions(response.content);
    } catch (error) {
        console.error("Interview Agent Error:", error.message || error);
        if (response?.content) {
            console.error("Raw LLM Output:", response.content);
        }
        throw new Error(error.message || "Failed to generate interview questions");
    }
};

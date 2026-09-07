/**
 * @file resume.agent.js (Resume Service - Agent)
 * @description Analyzes raw resume text against ATS criteria, extracting candidate details,
 * calculating an ATS compatibility score (0-100), and identifying skill gaps.
 */

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";

/**
 * Invokes LLM with ATS Resume scoring prompt.
 * @param {string} resumeText - Raw text extracted from candidate PDF
 * @returns {Promise<string>} Raw LLM JSON string response
 */
export const resumeAgent = async (resumeText) => {
    const response = await llm.invoke([
        new SystemMessage(`
            You are an Expert ATS Resume Analyzer

            Analyze the given resume.

            Extract the following information:
            - Full Name
            - Email
            - phone Number 
            - Professional Summary
            - Technical Skills
            - Projects
            - Education
            - Experience
            - Strengths
            - Weaknesses
            - Missing Skills
            - Suggested Job Role
            - ATS Score (0-100)
            - Recommendations

            IMPORTANT RULES:
                1. Return ONLY valid JSON.
                2. Do not use markdown.
                3. Do not explain anything.
                4. Do not add extra text.
                5. Every field must exist.

            Response Format:
            {
                 "name":"",
                 "email":"",
                 "phone":"",
                 "summary":"",
                 "skills":[],
                 "projects":[],
                 "education":[],
                 "experience":[],
                 "strengths":[],
                 "weaknesses":[],
                 "missingSkills":[],
                 "suggestedRole":"",
                 "score":0,
                 "recommendations":[]
            }
        `),
        new HumanMessage(resumeText)
    ]);

    if (typeof response === "string") return response;
    return response?.content || JSON.stringify(response);
};
/**
 * @file roadmap.agent.js (Roadmap Service - Agent)
 * @description Analyzes target role, package expectations, and candidate resume gaps
 * to construct a phased milestone curriculum with tailored modules.
 */

import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";
import roadmapPrompt from "../config/roadmap.prompt.js";

/**
 * Invokes LLM to construct structured learning roadmap.
 * 
 * @param {object} state - Current graph state
 * @returns {Promise<object>} Updated state with roadmap property
 */
const roadmapAgent = async (state) => {
    try {
        const resume = state.useResume && state.resume
            ? {
                skills: state.resume.skills,
                missingSkills: state.resume.missingSkills || state.resume.missingskills,
                projects: state.resume.projects,
                experience: state.resume.experience,
                score: state.resume.score,
                suggestedRole: state.resume.suggestedRole,
                recommendations: state.resume.recommendations
            }
            : null;

        const response = await llm.invoke([
            new SystemMessage(roadmapPrompt),
            new HumanMessage(`
Target Role:
${state.role}

Target Package:
${state.targetPackage}

Resume:
${JSON.stringify(resume, null, 2)}
`)
        ]);

        let cleanJson = response.content
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .replace(/```json|```/g, "")
            .trim();

        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        const roadmap = JSON.parse(cleanJson);

        const capitalize = (value = "") =>
            value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

        roadmap.level = capitalize(roadmap.level) || "Intermediate";
        roadmap.modules = (roadmap.modules || []).map((module) => ({
            ...module,
            difficulty: capitalize(module.difficulty || module.difficaulty || "Medium")
        }));

        return {
            ...state,
            roadmap
        };

    } catch (error) {
        console.error("Roadmap Agent error:", error);
        throw error;
    }
};

export default roadmapAgent;
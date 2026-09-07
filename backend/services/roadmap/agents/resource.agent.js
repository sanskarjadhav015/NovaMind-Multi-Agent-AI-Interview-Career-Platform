/**
 * @file resource.agent.js (Roadmap Service - Agent)
 * @description Enriches roadmap modules with external educational resources:
 * retrieves official documentation URLs via LLM and fetches top video tutorials
 * using the YouTube Data API.
 */

import llm from "../config/llm.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import searchVideo from "../config/youtube.js";

/**
 * Enriches roadmap modules with official documentation links and relevant YouTube video tutorials.
 * 
 * @param {object} state - Current graph state containing roadmap
 * @returns {Promise<object>} Updated state with enriched modules
 */
const resourceAgent = async (state) => {
    try {
        const roadmap = state.roadmap;
        if (!roadmap || !roadmap.modules) {
            return state;
        }

        const moduleTitles = roadmap.modules.map((module) => module.title).join("\n");

        // Request official documentation URLs from LLM
        const docsResponse = await llm.invoke([
            new SystemMessage(`
You are an expert software engineer.

For every module below return the official documentation.

Rules:
1. Prefer official documentation.
2. If official documentation does not exist, return the best learning article.
3. Return ONLY valid JSON array.
4. Do not explain anything.
5. Keep the exact same title.

Return format:
[
  {
    "title": "",
    "article": ""
  }
]
`),
            new HumanMessage(`Modules:\n${moduleTitles}`)
        ]);

        let docs = [];
        try {
            let cleanJson = docsResponse.content
                .replace(/<think>[\s\S]*?<\/think>/g, "")
                .replace(/```json|```/g, "")
                .trim();
            const firstBracket = cleanJson.indexOf("[");
            const lastBracket = cleanJson.lastIndexOf("]");
            if (firstBracket !== -1 && lastBracket !== -1) {
                cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
            }
            docs = JSON.parse(cleanJson);
        } catch (err) {
            console.error("Error parsing documentation JSON:", err.message);
            docs = [];
        }

        // Map titles to documentation links
        const docsMap = new Map();
        if (Array.isArray(docs)) {
            docs.forEach((item) => {
                if (item?.title) {
                    docsMap.set(
                        item.title.toLowerCase().trim(),
                        item.article || ""
                    );
                }
            });
        }

        // Parallelize YouTube search for each module
        roadmap.modules = await Promise.all(
            roadmap.modules.map(async (module) => {
                let video = null;
                try {
                    video = await searchVideo(module.title);
                } catch (err) {
                    console.error("YouTube search error:", err.message);
                }
                return {
                    ...module,
                    youtube: video?.URL || video?.url || "",
                    article: docsMap.get(module.title.toLowerCase().trim()) || ""
                };
            })
        );

        return {
            ...state,
            roadmap
        };

    } catch (error) {
        console.error("Resource Agent error:", error);
        return state;
    }
};

export default resourceAgent;
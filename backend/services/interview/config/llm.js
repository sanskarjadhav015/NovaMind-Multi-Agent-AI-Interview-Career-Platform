/**
 * @file llm.js (Interview Service)
 * @description Multi-tier LLM configuration with user-selectable provider:
 * 1. Standard AI Engine: Groq (Primary) -> OpenRouter (Fallback 1) -> Gemini 3.8 Flash (Fallback 2)
 * 2. NovaMind Custom Model: Fine-tuned Qwen2.5-3B LoRA on Hugging Face (Zero fallback per specification)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatNovaMind } from "./novamind.provider.js";

// Tier 1 Primary: Ultra-fast Groq LLM
const groqLlm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY || "gsk_placeholder_test_key",
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    maxRetries: 0,
    timeout: 8000,
    maxTokens: 4000
});

// Tier 2 Fallback: OpenRouter Free Reasoning Tier
const openRouterLlm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "sk-or-v1-placeholder_test_key",
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "NovaMind AI"
        }
    },
    temperature: 0.2,
    maxRetries: 0,
    timeout: 8000,
    maxTokens: 4000
});

// Tier 3 Fallback: Google Gemini API (Verified working model: gemini-3.5-flash-lite)
const geminiLlm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || "AIzaSy_placeholder_test_key",
    model: "gemini-3.5-flash-lite",
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000
});

// Standard Multi-Tier Fallback Pipeline (Groq -> OpenRouter -> Gemini)
const standardLlm = groqLlm.withFallbacks([openRouterLlm, geminiLlm]);

// Custom Fine-Tuned NovaMind Model (Standalone, strict no-silent-fallback)
const novamindLlm = new ChatNovaMind({
    hfToken: process.env.HF_TOKEN
});

/**
 * Returns the resolved LLM runnable based on the user's selected provider.
 * @param {string} [provider="standard"] - "standard" | "novamind"
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 */
export function getLLM(provider = "standard") {
    if (String(provider).toLowerCase() === "novamind") {
        return novamindLlm;
    }
    return standardLlm;
}

// Default export maintains 100% backward compatibility
export default standardLlm;
export { standardLlm, novamindLlm };

/**
 * @file llm.js (Interview Service)
 * @description Resilient multi-tier LLM configuration with automatic fallbacks.
 * Pipeline:
 * 1. Primary: Groq (high-speed inference with GPT-OSS-120b)
 * 2. Fallback 1: OpenRouter (Nvidia Nemotron 30b reasoning)
 * 3. Fallback 2: Google Gemini (Gemini 3.6 Flash)
 */

import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Tier 1 Primary: Ultra-fast Groq LLM
const groqLlm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000
});

// Tier 2 Fallback: OpenRouter Free Reasoning Tier
const openRouterLlm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "NovaMind AI"
        }
    },
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000
});

// Tier 3 Fallback: Google Gemini API
const geminiLlm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-3.6-flash",
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000
});

// Native LangChain Fault-Tolerant Fallback Pipeline
const llm = groqLlm.withFallbacks([openRouterLlm, geminiLlm]);

export default llm;
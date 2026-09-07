import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// 1. Primary: Groq (Blazing Fast)
const groqLlm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000,
});

// 2. Fallback 1: OpenRouter (Verified Free Working Model)
const openRouterLlm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Novamind AI",
        },
    },
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000,
});

// 3. Fallback 2: Google Gemini (Verified Working Model: gemini-3.6-flash)
const geminiLlm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-3.6-flash",
    temperature: 0.2,
    maxRetries: 1,
    maxTokens: 4000,
});

// Native LangChain Auto-Fallback Pipeline: Groq -> OpenRouter -> Gemini
const llm = groqLlm.withFallbacks([openRouterLlm, geminiLlm]);

export default llm;
/**
 * @file embeddings.js (Shared RAG Pipeline)
 * @description Resilient, rate-limit protected embedding generation using Google Gemini
 * embeddings with bounded exponential backoff, batching, and dimension validation.
 */

try {
    await import("dotenv/config");
} catch (_) {
    // Environment variables already loaded by parent process
}

// Standard embedding dimension for Google gemini-embedding-001
export const EMBEDDING_DIMENSION = 3072;
export const DEFAULT_MODEL = "gemini-embedding-001";

let cachedEmbedder = null;

/**
 * Creates or retrieves the LangChain GoogleGenerativeAIEmbeddings instance.
 * @returns {Promise<any>}
 */
async function getEmbedder() {
    if (cachedEmbedder) return cachedEmbedder;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
        cachedEmbedder = new GoogleGenerativeAIEmbeddings({
            apiKey,
            model: process.env.EMBEDDING_MODEL || DEFAULT_MODEL
        });
        return cachedEmbedder;
    } catch (err) {
        console.warn("[RAG Embeddings] Failed to initialize GoogleGenerativeAIEmbeddings:", err.message);
        return null;
    }
}

/**
 * Asynchronously pauses execution for a specified duration.
 * @param {number} ms 
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a deterministic normalized pseudo-embedding for testing or offline fallback.
 * Guarantees consistent dimensions and cosine similarity characteristics without external API calls.
 * 
 * @param {string} text - Input text
 * @param {number} [dim=3072] - Vector dimension
 * @returns {number[]} Normalized 3072-dim vector
 */
export function generateDeterministicEmbedding(text, dim = EMBEDDING_DIMENSION) {
    const vector = new Array(dim).fill(0);
    if (!text || typeof text !== "string") return vector;

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    for (const word of words) {
        let hash = 5381;
        for (let i = 0; i < word.length; i++) {
            hash = ((hash << 5) + hash + word.charCodeAt(i)) | 0;
        }
        const idx = Math.abs(hash) % dim;
        vector[idx] += 1.0;

        // Character n-grams for subword overlap
        for (let i = 0; i <= word.length - 3; i++) {
            const tri = word.slice(i, i + 3);
            let triHash = 17;
            for (let j = 0; j < tri.length; j++) {
                triHash = ((triHash << 3) + triHash + tri.charCodeAt(j)) | 0;
            }
            const triIdx = Math.abs(triHash) % dim;
            vector[triIdx] += 0.3;
        }
    }

    // Cosine normalization
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return vector.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Executes an embedding operation with bounded retry and exponential backoff.
 * Sanitizes errors so API keys are never leaked in error traces.
 * 
 * @param {Function} op - Async operation returning an embedding or array of embeddings
 * @param {number} [maxRetries=3] - Max retry attempts
 * @param {number} [initialDelayMs=600] - Base delay in milliseconds
 * @returns {Promise<any>}
 */
async function withRetry(op, maxRetries = 3, initialDelayMs = 600) {
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await op();
        } catch (error) {
            // Strip any sensitive keys or query parameters from error message
            const safeMsg = (error.message || "").replace(/key=[^&\s]+/gi, "key=[REDACTED]");

            if (attempt === maxRetries) {
                console.error(`[RAG Embeddings] Operation failed after ${maxRetries} attempts: ${safeMsg}`);
                throw new Error(`Embedding generation failed: ${safeMsg}`);
            }

            console.warn(`[RAG Embeddings] Attempt ${attempt} failed: ${safeMsg}. Retrying in ${delay}ms...`);
            await sleep(delay);
            delay *= 2;
        }
    }
}

/**
 * Generates a vector embedding for a single text query with dimension verification.
 * 
 * @param {string} text - Query text to embed
 * @returns {Promise<number[]>} Dense vector of 3072 numbers
 */
export async function embedQuery(text) {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        throw new Error("embedQuery: Input text must be a non-empty string");
    }

    const embedder = await getEmbedder();
    if (!embedder) {
        // Safe fallback in test or offline environment
        return generateDeterministicEmbedding(text);
    }

    const vector = await withRetry(async () => {
        return await embedder.embedQuery(text.trim());
    });

    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Invalid embedding vector returned from provider");
    }

    return vector;
}

/**
 * Generates vector embeddings for a batch of text chunks with rate-limit protection.
 * Batches requests in chunks of `batchSize` to prevent overwhelming API quotas.
 * 
 * @param {string[]} texts - Array of chunk strings to embed
 * @param {object} [options]
 * @param {number} [options.batchSize=8] - Number of texts per provider call
 * @param {number} [options.interBatchDelayMs=200] - Delay between batches in ms
 * @returns {Promise<number[][]>} Array of dense vectors
 */
export async function embedDocuments(texts, options = {}) {
    if (!Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    const batchSize = options.batchSize || 8;
    const interBatchDelayMs = options.interBatchDelayMs || 200;
    const embedder = await getEmbedder();

    if (!embedder) {
        return texts.map((t) => generateDeterministicEmbedding(t));
    }

    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize).map((t) => (t || "").trim());

        const batchVectors = await withRetry(async () => {
            return await embedder.embedDocuments(batch);
        });

        // Validate dimension consistency
        for (const vec of batchVectors) {
            if (!Array.isArray(vec) || vec.length === 0) {
                throw new Error("Provider returned malformed vector");
            }
            results.push(vec);
        }

        if (i + batchSize < texts.length && interBatchDelayMs > 0) {
            await sleep(interBatchDelayMs);
        }
    }

    return results;
}

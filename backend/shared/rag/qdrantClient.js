/**
 * @file qdrantClient.js (Shared RAG Pipeline)
 * @description Standard HTTP REST client for Qdrant Vector Database with strict
 * tenant isolation, deterministic point ID generation, and resilient fallback.
 */

import crypto from "crypto";

const DEFAULT_QDRANT_URL = "http://localhost:6333";
const DEFAULT_COLLECTION = "novamind_documents";
const DEFAULT_DIMENSION = 3072;
const DEFAULT_DISTANCE = "Cosine";

/**
 * Calculates cosine similarity between two equal-length normalized vectors.
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number} Value between -1.0 and 1.0
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Deterministically formats an MD5 hash string into standard RFC 4122 UUID structure.
 * Ensures Qdrant accepts the ID as a valid point UUID.
 * @param {string} seed 
 * @returns {string} 36-character UUID string (e.g., "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx")
 */
export function generatePointId(seed) {
    const hex = crypto.createHash("md5").update(seed).digest("hex");
    // Format as 8-4-4-4-12 hex characters with standard UUID version 4 variant bits
    const part1 = hex.substring(0, 8);
    const part2 = hex.substring(8, 12);
    const part3 = "4" + hex.substring(13, 16);
    const part4 = "8" + hex.substring(17, 20);
    const part5 = hex.substring(20, 32);
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

export class QdrantClient {
    /**
     * @param {object} [config]
     * @param {string} [config.url] - Qdrant HTTP base URL
     * @param {string} [config.apiKey] - Optional Qdrant API key
     * @param {string} [config.collection] - Target collection name
     * @param {number} [config.dimension] - Vector dimension (default 3072)
     */
    constructor(config = {}) {
        this.url = (config.url || process.env.QDRANT_URL || DEFAULT_QDRANT_URL).replace(/\/+$/, "");
        this.apiKey = config.apiKey || process.env.QDRANT_API_KEY || null;
        this.collection = config.collection || process.env.QDRANT_COLLECTION || DEFAULT_COLLECTION;
        this.dimension = Number(config.dimension || process.env.EMBEDDING_DIMENSION || DEFAULT_DIMENSION);
        this.distance = DEFAULT_DISTANCE;

        // In-memory fallback point store: Map<pointId, { id, vector, payload }>
        this._memoryStore = new Map();
        this._isLive = null; // null: untested, true: live, false: fallback
    }

    /**
     * Common HTTP request helper with timeout and auth headers.
     * @private
     */
    async _request(endpoint, options = {}) {
        const url = `${this.url}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...(this.apiKey ? { "api-key": this.apiKey } : {}),
            ...(options.headers || {})
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 5000);

        try {
            const res = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return res;
        } catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    }

    /**
     * Checks if the remote Qdrant service is online and accessible.
     * @returns {Promise<boolean>}
     */
    async ping() {
        try {
            const res = await this._request("/collections", { method: "GET", timeoutMs: 2500 });
            this._isLive = res.ok;
            return res.ok;
        } catch (err) {
            this._isLive = false;
            return false;
        }
    }

    /**
     * Ensures the configured collection exists with the appropriate dimension and distance metric.
     * Creates it if missing.
     * @returns {Promise<boolean>}
     */
    async ensureCollection() {
        const isOnline = await this.ping();
        if (!isOnline) {
            console.warn(`[QdrantClient] Qdrant service at ${this.url} is offline. Utilizing resilient in-memory vector store.`);
            return true;
        }

        try {
            const checkRes = await this._request(`/collections/${this.collection}`, { method: "GET" });
            if (checkRes.status === 200) {
                return true;
            }

            if (checkRes.status === 404) {
                console.log(`[QdrantClient] Collection "${this.collection}" not found. Creating with dim=${this.dimension}...`);
                const createRes = await this._request(`/collections/${this.collection}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        vectors: {
                            size: this.dimension,
                            distance: this.distance
                        }
                    })
                });

                if (!createRes.ok) {
                    const errorText = await createRes.text();
                    console.error(`[QdrantClient] Failed to create collection: ${errorText}`);
                    return false;
                }
                console.log(`[QdrantClient] Collection "${this.collection}" created successfully.`);
                return true;
            }

            return false;
        } catch (err) {
            console.warn(`[QdrantClient] Collection check error: ${err.message}. Using in-memory fallback.`);
            return true;
        }
    }

    /**
     * Inserts or updates vector points with tenant isolation metadata.
     * Generates deterministic point IDs if not explicitly provided.
     * 
     * @param {Array<{id?: string, vector: number[], payload: object}>} points
     * @returns {Promise<{success: boolean, count: number}>}
     */
    async upsertPoints(points) {
        if (!Array.isArray(points) || points.length === 0) {
            return { success: true, count: 0 };
        }

        // Validate tenant isolation: every point must contain a valid userId
        for (const p of points) {
            if (!p.payload || !p.payload.userId) {
                throw new Error("Tenant isolation violation: All points must contain payload.userId");
            }
            if (!p.id) {
                const seed = `${p.payload.userId}_${p.payload.documentId || "doc"}_${p.payload.chunkIndex ?? 0}`;
                p.id = generatePointId(seed);
            }
        }

        if (this._isLive) {
            try {
                const res = await this._request(`/collections/${this.collection}/points?wait=true`, {
                    method: "PUT",
                    body: JSON.stringify({ points })
                });

                if (res.ok) {
                    return { success: true, count: points.length };
                }
                console.warn("[QdrantClient] Remote upsert failed with status", res.status, ". Falling back to memory store.");
            } catch (err) {
                console.warn("[QdrantClient] Remote upsert network error:", err.message);
            }
        }

        // In-memory fallback
        for (const p of points) {
            this._memoryStore.set(p.id, {
                id: p.id,
                vector: p.vector,
                payload: { ...p.payload }
            });
        }
        return { success: true, count: points.length };
    }

    /**
     * Performs tenant-isolated cosine similarity search.
     * Enforces strict filter on `userId`.
     * 
     * @param {object} params
     * @param {string} params.userId - Tenant user ID (MANDATORY)
     * @param {number[]} params.vector - Query embedding vector
     * @param {number} [params.limit=5] - Top-k limit
     * @param {number} [params.scoreThreshold=0.3] - Minimum similarity score threshold
     * @returns {Promise<Array<{id: string, score: number, payload: object}>>}
     */
    async searchPoints({ userId, vector, limit = 5, scoreThreshold = 0.3 }) {
        if (!userId) {
            throw new Error("Tenant isolation violation: userId is strictly required for search");
        }
        if (!Array.isArray(vector) || vector.length === 0) {
            throw new Error("searchPoints: vector must be a non-empty array");
        }

        const strUserId = String(userId);

        if (this._isLive) {
            try {
                const searchPayload = {
                    vector,
                    filter: {
                        must: [
                            { key: "userId", match: { value: strUserId } }
                        ]
                    },
                    limit,
                    score_threshold: scoreThreshold,
                    with_payload: true
                };

                const res = await this._request(`/collections/${this.collection}/points/search`, {
                    method: "POST",
                    body: JSON.stringify(searchPayload)
                });

                if (res.ok) {
                    const data = await res.json();
                    return (data.result || []).map((hit) => ({
                        id: hit.id,
                        score: hit.score,
                        payload: hit.payload
                    }));
                }
                console.warn("[QdrantClient] Remote search failed with status", res.status);
            } catch (err) {
                console.warn("[QdrantClient] Remote search network error:", err.message);
            }
        }

        // In-memory fallback search
        const matches = [];
        for (const [id, item] of this._memoryStore.entries()) {
            if (String(item.payload?.userId) !== strUserId) {
                continue; // Strict tenant boundary
            }

            const score = cosineSimilarity(vector, item.vector);
            if (score >= scoreThreshold) {
                matches.push({
                    id,
                    score,
                    payload: item.payload
                });
            }
        }

        matches.sort((a, b) => b.score - a.score);
        return matches.slice(0, limit);
    }

    /**
     * Purges all documents belonging to a user for a specific document type.
     * Enforces strict tenant isolation filter.
     * 
     * @param {object} params
     * @param {string} params.userId - Tenant user ID (MANDATORY)
     * @param {string} [params.documentType="resume"] - Document type to purge
     * @returns {Promise<{success: boolean, deleted: number}>}
     */
    async deleteUserDocuments({ userId, documentType = "resume" }) {
        if (!userId) {
            throw new Error("Tenant isolation violation: userId is strictly required for deletion");
        }

        const strUserId = String(userId);

        if (this._isLive) {
            try {
                const deletePayload = {
                    filter: {
                        must: [
                            { key: "userId", match: { value: strUserId } },
                            { key: "documentType", match: { value: documentType } }
                        ]
                    }
                };

                const res = await this._request(`/collections/${this.collection}/points/delete?wait=true`, {
                    method: "POST",
                    body: JSON.stringify(deletePayload)
                });

                if (res.ok) {
                    return { success: true, deleted: 1 };
                }
                console.warn("[QdrantClient] Remote delete failed with status", res.status);
            } catch (err) {
                console.warn("[QdrantClient] Remote delete network error:", err.message);
            }
        }

        // In-memory cleanup
        let deletedCount = 0;
        for (const [id, item] of this._memoryStore.entries()) {
            if (
                String(item.payload?.userId) === strUserId &&
                (!documentType || item.payload?.documentType === documentType)
            ) {
                this._memoryStore.delete(id);
                deletedCount++;
            }
        }

        return { success: true, deleted: deletedCount };
    }
}

// Export singleton instance for shared usage
export const defaultQdrantClient = new QdrantClient();
export default defaultQdrantClient;

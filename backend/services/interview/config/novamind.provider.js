/**
 * @file novamind.provider.js (Interview Service - AI Provider)
 * @description Dedicated LangChain chat model implementation for NovaMind's
 * custom fine-tuned Qwen2.5-3B LoRA model hosted on Hugging Face Spaces with Gradio.
 * 
 * Supports:
 * - Two-phase Gradio Call API: POST /gradio_api/call/v2/chat -> GET /gradio_api/call/chat/{event_id}
 * - Server-Sent Events (SSE) stream consumption (handling 'generating', 'complete', 'error')
 * - Hugging Face authorization token (HF_TOKEN) to bypass anonymous ZeroGPU quota limits
 * - Bounded timeouts for cold starts, network errors, and explicit non-silent failure handling
 */

import { SimpleChatModel } from "@langchain/core/language_models/chat_models";

export class ChatNovaMind extends SimpleChatModel {
    static lc_name() {
        return "ChatNovaMind";
    }

    constructor(fields = {}) {
        super(fields);
        this._customEndpoint = fields.endpoint ? fields.endpoint.replace(/\/$/, "") : "";
        this.hfToken = fields.hfToken || process.env.HF_TOKEN || "";
        this.timeoutMs = fields.timeoutMs || 90000; // 90 seconds to accommodate HF Space wake-up / cold starts
        this.temperature = fields.temperature ?? 0.2;
    }

    get endpoint() {
        return (
            this._customEndpoint ||
            process.env.NOVAMIND_ENDPOINT
        ).replace(/\/$/, "");
    }

    set endpoint(val) {
        this._customEndpoint = val ? String(val).replace(/\/$/, "") : "";
    }

    getEndpoint() {
        return this.endpoint;
    }

    _llmType() {
        return "novamind";
    }

    /**
     * Implements LangChain SimpleChatModel._call to integrate with invoke() pipelines.
    // * @param {import("@langchain/core/messages").BaseMessage[] | string} messages - Messages or prompt text
    // * @param {object} [options] - Optional runtime options such as signal
     //* @returns {Promise<string>} Generated text content
     */
    async _call(messages, options = {}) {
        let promptText = "";
        if (typeof messages === "string") {
            promptText = messages;
        } else if (Array.isArray(messages)) {
            promptText = messages
                .map((m) => (typeof m === "string" ? m : (m.content || "")))
                .filter(Boolean)
                .join("\n\n");
        } else if (messages && typeof messages === "object" && messages.content) {
            promptText = messages.content;
        } else {
            promptText = String(messages || "");
        }

        return await this.callInferenceAPI(promptText, options);
    }

    /**
     * Performs POST to Gradio v2 endpoint and reads SSE stream until completion.
     * @param {string} promptText - Formatted input text for Qwen-3B model
     * @param {object} [options] - Call options
     * @returns {Promise<string>}
     */
    async callInferenceAPI(promptText, options = {}) {
        const endpoint = this.getEndpoint();
        const headers = {
            "Content-Type": "application/json"
        };
        if (this.hfToken) {
            headers["Authorization"] = `Bearer ${this.hfToken}`;
        }

        const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
        const signal = options.signal
            ? AbortSignal.any([options.signal, timeoutSignal])
            : timeoutSignal;

        let eventId;

        // Step 1: Submit generation task to Gradio call API
        try {
            const postRes = await fetch(`${endpoint}/gradio_api/call/v2/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: promptText }),
                signal
            });

            if (!postRes.ok) {
                const errBody = await postRes.text().catch(() => "");
                if (postRes.status === 503) {
                    throw new Error("NovaMind Hugging Face Space is starting up or temporarily offline (HTTP 503).");
                }
                if (postRes.status === 429) {
                    throw new Error("NovaMind Hugging Face Space rate limit exceeded (HTTP 429).");
                }
                throw new Error(`NovaMind endpoint returned HTTP ${postRes.status}: ${errBody.slice(0, 200)}`);
            }

            const data = await postRes.json();
            eventId = data.event_id;
            if (!eventId) {
                throw new Error("NovaMind API failed to return an event_id.");
            }
        } catch (postErr) {
            if (postErr.name === "TimeoutError" || signal.aborted) {
                throw new Error(`NovaMind request timed out after ${this.timeoutMs / 1000}s waiting for Space response.`);
            }
            throw new Error(`NovaMind custom model connection failed: ${postErr.message}`);
        }

        // Step 2: Stream response via Server-Sent Events (SSE)
        try {
            const getHeaders = {};
            if (this.hfToken) {
                getHeaders["Authorization"] = `Bearer ${this.hfToken}`;
            }

            const getRes = await fetch(`${endpoint}/gradio_api/call/chat/${eventId}`, {
                method: "GET",
                headers: getHeaders,
                signal
            });

            if (!getRes.ok) {
                throw new Error(`NovaMind stream endpoint returned HTTP ${getRes.status}`);
            }

            const reader = getRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let finalOutput = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split(/\r?\n\r?\n/);
                buffer = events.pop() || ""; // Retain incomplete chunk

                for (const eventStr of events) {
                    if (!eventStr.trim()) continue;

                    const lines = eventStr.split(/\r?\n/);
                    let eventType = "";
                    let dataText = "";

                    for (const line of lines) {
                        if (line.startsWith("event:")) {
                            eventType = line.slice(6).trim();
                        } else if (line.startsWith("data:")) {
                            dataText += line.slice(5).trim();
                        }
                    }

                    if (eventType === "error") {
                        let parsedErr = dataText;
                        try {
                            const parsed = JSON.parse(dataText);
                            parsedErr = parsed.error || parsed.message || dataText;
                        } catch {}

                        if (parsedErr.includes("ZeroGPU runs limit") || parsedErr.includes("quota")) {
                            throw new Error("ZeroGPU quota exceeded on Hugging Face. Please authenticate with a Hugging Face token (HF_TOKEN) or try again later.");
                        }
                        throw new Error(`NovaMind custom model error: ${parsedErr}`);
                    }

                    if (eventType === "complete") {
                        try {
                            const parsedData = JSON.parse(dataText);
                            finalOutput = Array.isArray(parsedData) ? parsedData[0] : parsedData;
                        } catch {
                            finalOutput = dataText;
                        }
                    }
                }
            }

            // Flush remaining buffer if complete event was pending
            if (!finalOutput && buffer.trim()) {
                const lines = buffer.split(/\r?\n/);
                for (const line of lines) {
                    if (line.startsWith("data:")) {
                        try {
                            const parsedData = JSON.parse(line.slice(5).trim());
                            finalOutput = Array.isArray(parsedData) ? parsedData[0] : parsedData;
                        } catch {
                            finalOutput = line.slice(5).trim();
                        }
                    }
                }
            }

            if (!finalOutput) {
                throw new Error("NovaMind stream completed without returning generated content.");
            }

            return typeof finalOutput === "string" ? finalOutput : JSON.stringify(finalOutput);
        } catch (streamErr) {
            if (streamErr.name === "TimeoutError" || signal.aborted) {
                throw new Error(`NovaMind stream timed out after ${this.timeoutMs / 1000}s.`);
            }
            throw streamErr;
        }
    }
}

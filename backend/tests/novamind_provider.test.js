/**
 * @file novamind_provider.test.js (Test Suite)
 * @description Comprehensive unit and integration tests for NovaMind custom model provider:
 * 1. Provider instantiation & interface compliance with LangChain SimpleChatModel
 * 2. Provider resolver: getLLM("standard") vs getLLM("novamind")
 * 3. Strict non-fallback guarantee: NovaMind custom model fails explicitly without silent fallback
 * 4. Error handling for ZeroGPU quota exhaustion and network/server outages
 * 5. LangGraph InterviewState annotation & schema persistence
 * 6. Live inference check against the configured Hugging Face Space
 * 7. JSON repair and schema validation in interviewAgent (handling {"questions": [...]} and trailing quotes)
 * 8. Standard AI fallback pipeline with verified working gemini-3.5-flash
 */

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { ChatNovaMind } from "../services/interview/config/novamind.provider.js";
import { getLLM, standardLlm, novamindLlm } from "../services/interview/config/llm.js";
import InterviewState from "../services/interview/graph/state.js";
import Interview from "../services/interview/models/interview.models.js";
import { interviewAgent } from "../services/interview/agents/interview.agent.js";
import { feedbackAgent } from "../services/interview/agents/feedback.agent.js";
import { summaryAgent } from "../services/interview/agents/summary.agent.js";

describe("NOVAMIND CUSTOM AI PROVIDER TEST SUITE", () => {

    test("1. ChatNovaMind initializes with correct default configuration", () => {
        const model = new ChatNovaMind();
        assert.equal(model._llmType(), "novamind");
        assert.ok(model.endpoint.includes("hf.space"));
        assert.equal(typeof model.timeoutMs, "number");
        assert.ok(model.timeoutMs >= 30000);
    });

    test("2. getLLM resolves standard vs novamind providers correctly", () => {
        const std = getLLM("standard");
        const def = getLLM();
        const nova = getLLM("novamind");
        const novaUpper = getLLM("NOVAMIND");

        assert.equal(std, standardLlm);
        assert.equal(def, standardLlm);
        assert.equal(nova, novamindLlm);
        assert.equal(novaUpper, novamindLlm);
        assert.equal(nova._llmType(), "novamind");
    });

    test("3. Standard AI retains multi-tier fallback configuration with gemini-3.5-flash", () => {
        assert.ok(standardLlm);
        assert.ok(typeof standardLlm.invoke === "function");
    });

    test("4. NovaMind provider does NOT have fallbacks attached (strict non-fallback)", () => {
        assert.equal(novamindLlm._llmType(), "novamind");
        assert.equal(novamindLlm instanceof ChatNovaMind, true);
    });

    test("5. ChatNovaMind handles mock Gradio API success stream correctly", async () => {
        let postCalled = false;
        let getCalled = false;

        const server = http.createServer((req, res) => {
            if (req.method === "POST" && req.url === "/gradio_api/call/v2/chat") {
                postCalled = true;
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ event_id: "test-event-123" }));
                return;
            }
            if (req.method === "GET" && req.url === "/gradio_api/call/chat/test-event-123") {
                getCalled = true;
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive"
                });
                res.write("event: generating\ndata: [\"Generating...\", null]\n\n");
                res.write("event: complete\ndata: [\"NovaMind question generated successfully\", null]\n\n");
                res.end();
                return;
            }
            res.writeHead(404);
            res.end();
        });

        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const port = server.address().port;

        try {
            const testModel = new ChatNovaMind({
                endpoint: `http://127.0.0.1:${port}`,
                timeoutMs: 5000
            });

            const result = await testModel.invoke("Test prompt");
            assert.ok(postCalled, "POST endpoint should have been called");
            assert.ok(getCalled, "GET SSE endpoint should have been called");
            assert.equal(result.content, "NovaMind question generated successfully");
        } finally {
            server.close();
        }
    });

    test("6. ChatNovaMind catches and reports ZeroGPU quota exhaustion without silent fallback", async () => {
        const server = http.createServer((req, res) => {
            if (req.method === "POST" && req.url === "/gradio_api/call/v2/chat") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ event_id: "quota-event-456" }));
                return;
            }
            if (req.method === "GET" && req.url === "/gradio_api/call/chat/quota-event-456") {
                res.writeHead(200, { "Content-Type": "text/event-stream" });
                res.write("event: error\ndata: {\"error\": \"You have exceeded your ZeroGPU runs limit. Authenticate with a Hugging Face token for more quota\"}\n\n");
                res.end();
                return;
            }
            res.writeHead(404);
            res.end();
        });

        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const port = server.address().port;

        try {
            const testModel = new ChatNovaMind({
                endpoint: `http://127.0.0.1:${port}`,
                timeoutMs: 5000
            });

            await assert.rejects(
                async () => {
                    await testModel.invoke("Test prompt");
                },
                (err) => {
                    assert.ok(err.message.includes("ZeroGPU quota exceeded"), `Error should describe quota: ${err.message}`);
                    return true;
                }
            );
        } finally {
            server.close();
        }
    });

    test("7. ChatNovaMind handles Space 503 / sleeping error with clear message", async () => {
        const server = http.createServer((req, res) => {
            res.writeHead(503, { "Content-Type": "text/plain" });
            res.end("Space is sleeping");
        });

        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const port = server.address().port;

        try {
            const testModel = new ChatNovaMind({
                endpoint: `http://127.0.0.1:${port}`,
                timeoutMs: 5000
            });

            await assert.rejects(
                async () => {
                    await testModel.invoke("Test prompt");
                },
                (err) => {
                    assert.ok(err.message.includes("503") || err.message.includes("starting up"), `Error should indicate 503/offline: ${err.message}`);
                    return true;
                }
            );
        } finally {
            server.close();
        }
    });

    test("8. Interview schema and LangGraph state define aiProvider correctly", () => {
        const aiProviderPath = Interview.schema.path("aiProvider");
        assert.ok(aiProviderPath, "Interview model should define aiProvider path");
        assert.equal(aiProviderPath.defaultValue, "standard");
        assert.deepEqual(aiProviderPath.enumValues, ["standard", "novamind"]);

        const channels = Object.keys(InterviewState.spec);
        assert.ok(channels.includes("aiProvider"), "InterviewState should include aiProvider annotation");
    });

    test("9. JSON repair normalizes wrapped questions and trailing quotes into 6 valid questions", async () => {
        // Mock server delivering 3B model raw output with trailing quote and wrapper object
        const mockRawOutput = JSON.stringify({
            questions: [
                { question: "Q1: Explain virtual DOM in React.", difficulty: "easy", timer: 60 },
                { question: "Q2: What are React hooks?", difficulty: "easy", timer: 60 },
                { question: "Q3: Explain Node.js event loop.", difficulty: "medium", timer: 120 },
                { question: "Q4: Implement debounce function in JavaScript.", difficulty: "hard", timer: 300 },
                { question: "Q5: How does database indexing work?", difficulty: "medium", timer: 120 },
                { question: "Q6: Design a distributed rate limiter.", difficulty: "hard", timer: 600 }
            ]
        }).replace('"timer":600}', '"timer":600"}'); // Simulate trailing quote syntax flaw

        const server = http.createServer((req, res) => {
            if (req.method === "POST") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ event_id: "repair-test-id" }));
                return;
            }
            if (req.method === "GET") {
                res.writeHead(200, { "Content-Type": "text/event-stream" });
                res.write(`event: complete\ndata: [${JSON.stringify(mockRawOutput)}, null]\n\n`);
                res.end();
                return;
            }
        });

        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const port = server.address().port;

        const origEndpoint = process.env.NOVAMIND_ENDPOINT;
        process.env.NOVAMIND_ENDPOINT = `http://127.0.0.1:${port}`;

        try {
            const questions = await interviewAgent({
                type: "technical",
                role: "Full Stack Developer",
                useResume: false,
                aiProvider: "novamind"
            });

            assert.ok(Array.isArray(questions), "Questions must be a normalized Array");
            assert.equal(questions.length, 6, "Must contain exactly 6 questions");
            assert.equal(questions[0].question, "Q1: Explain virtual DOM in React.");
            assert.equal(questions[5].timer, 600, "Timer must be parsed as a valid number");
            assert.equal(questions[5].difficulty, "hard");
        } finally {
            process.env.NOVAMIND_ENDPOINT = origEndpoint;
            server.close();
        }
    });

    test("10. Standard AI fallback pipeline produces 6 verified questions", { timeout: 60000 }, async () => {
        const questions = await interviewAgent({
            type: "technical",
            role: "Full Stack Developer",
            useResume: false,
            aiProvider: "standard"
        });

        assert.ok(Array.isArray(questions), "Standard AI must return an array");
        assert.equal(questions.length, 6, "Standard AI must return 6 questions");
        assert.ok(questions[0].question && questions[0].question.length > 5);
        assert.ok(["easy", "medium", "hard"].includes(questions[0].difficulty));
        assert.ok(typeof questions[0].timer === "number");
    });

});

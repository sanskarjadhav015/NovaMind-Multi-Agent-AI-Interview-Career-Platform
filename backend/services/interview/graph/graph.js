/**
 * @file graph.js (Interview Service - LangGraph)
 * @description Compiles the LangGraph workflow state machine for interview processing.
 * 
 * Workflow Topology:
 * [START]
 *    |---> (router: action === "start") ----> [interviewAgent] ----> [END]
 *    |---> (router: action === "feedback") -> [feedbackAgent]
 *                                                    |
 *                                                    +---> (completed === true)  -> [summaryAgent] -> [END]
 *                                                    +---> (completed === false) -> [END]
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import InterviewState from "./state.js";
import { feedbackNode, interviewNode, summaryNode } from "./nodes.js";

/**
 * Directs graph entry from START based on requested action.
 * @param {object} state - Current graph state
 * @returns {string} Target node key or END
 */
function router(state) {
    switch (state.action) {
        case "start":
            return "interviewAgent";
        case "feedback":
            return "feedbackAgent";
        default:
            return END;
    }
}

/**
 * Directs flow after per-question feedback. If the interview is marked completed,
 * transitions to summaryAgent; otherwise terminates the turn at END.
 * @param {object} state - Current graph state
 * @returns {string} "summaryAgent" | END
 */
function feedbackRouter(state) {
    if (state.completed) {
        return "summaryAgent";
    }
    return END;
}

// Instantiate and configure LangGraph state machine
const graph = new StateGraph(InterviewState)
    // Register agent nodes
    .addNode("interviewAgent", interviewNode)
    .addNode("feedbackAgent", feedbackNode)
    .addNode("summaryAgent", summaryNode)

    // Conditional dispatch from START
    .addConditionalEdges(
        START,
        router,
        {
            interviewAgent: "interviewAgent",
            feedbackAgent: "feedbackAgent"
        }
    )

    // Route question generation directly to termination
    .addEdge("interviewAgent", END)

    // Conditional transition after evaluation
    .addConditionalEdges(
        "feedbackAgent",
        feedbackRouter,
        {
            summaryAgent: "summaryAgent",
            [END]: END
        }
    )

    // Summary node terminates the graph
    .addEdge("summaryAgent", END)

    // Compile into executable Runnable
    .compile();

export default graph;
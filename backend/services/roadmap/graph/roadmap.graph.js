/**
 * @file roadmap.graph.js (Roadmap Service - LangGraph)
 * @description StateGraph compiling the two-stage career roadmap generation pipeline:
 * [START] -> [roadmapAgent] -> [resourceAgent] -> [END]
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import { RoadmapState } from "./roadmap.state.js";
import roadmapAgent from "../agents/roadmap.agent.js";
import resourceAgent from "../agents/resource.agent.js";

// Construct sequential execution graph
const graph = new StateGraph(RoadmapState)
    .addNode("roadmapAgent", roadmapAgent)
    .addNode("resourceAgent", resourceAgent)

    .addEdge(START, "roadmapAgent")
    .addEdge("roadmapAgent", "resourceAgent")
    .addEdge("resourceAgent", END)

    .compile();

export default graph;
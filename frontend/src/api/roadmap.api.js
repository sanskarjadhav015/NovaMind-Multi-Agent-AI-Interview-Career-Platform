/**
 * @file roadmap.api.js (Frontend API)
 * @description API client methods for career roadmap generation, listing, and details.
 */

import api from "../utils/axios";

/**
 * Generates a tailored career roadmap matching role, target package, and skill gaps.
 * 
 * @param {{ role: string, targetPackage: string, useResume?: boolean, resume?: object }} data
 * @returns {Promise<object>} Generated roadmap object
 */
export const generateRoadmap = async (data) => {
  try {
    const response = await api.post("/api/roadmap/generate", data);
    return response.data;
  } catch (error) {
    console.error("generateRoadmap error:", error);
    return (
      error.response?.data || {
        success: false,
        message: error.message || "Failed to generate roadmap",
      }
    );
  }
};

/**
 * Retrieves all learning roadmaps created by the candidate.
 * 
 * @returns {Promise<{success: boolean, data: Array<object>}>} List of roadmaps
 */
export const getAllRoadmaps = async () => {
  try {
    const response = await api.get("/api/roadmap/all");
    return response.data;
  } catch (error) {
    console.error("getAllRoadmaps error:", error);
    return {
      success: false,
      data: [],
      message: error.message || "Failed to fetch roadmaps",
    };
  }
};

/**
 * Retrieves full module details and educational resources for a specific roadmap.
 * 
 * @param {string} id - Roadmap ID
 * @returns {Promise<object>} Roadmap details
 */
export const getRoadmapById = async (id) => {
  try {
    const response = await api.get(`/api/roadmap/${id}`);
    return response.data;
  } catch (error) {
    console.error("getRoadmapById error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch roadmap details",
    };
  }
};

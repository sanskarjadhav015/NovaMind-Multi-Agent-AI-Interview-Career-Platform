/**
 * @file resume.api.js (Frontend API)
 * @description API client methods for fetching and managing parsed candidate resume data.
 */

import api from "../utils/axios";

/**
 * Retrieves the authenticated user's active resume and ATS score analysis.
 * 
 * @returns {Promise<{success: boolean, data: object}|null>}
 */
export const getResume = async () => {
    try {
        const response = await api.get("/api/resume/get-resume");
        return response.data;
    } catch (error) {
        return null;
    }
};

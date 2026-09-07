/**
 * @file user.api.js (Frontend API)
 * @description API client methods for user session verification and coin deductions.
 */

import api from "../utils/axios";

/**
 * Retrieves the currently authenticated user from the Gateway /api/me endpoint.
 * @returns {Promise<{success: boolean, user: object}|null>}
 */
export const getCurrentUser = async () => {
    try {
        const response = await api.get("/api/me");
        return response.data;
    } catch (error) {
        return null;
    }
};

/**
 * Deducts interview coins for an action (interview or ATS resume scan).
 * 
 * @param {{ coins: number, action: string }} data - Coin deduction payload
 * @returns {Promise<object>} Response with updated coin balance
 */
export const useCoins = async (data) => {
    try {
        const response = await api.post("/api/auth/use-coins", data);
        return response.data;
    } catch (error) {
        return (
            error.response?.data || {
                success: false,
                message: error.message || "Failed to update interview coins",
            }
        );
    }
};
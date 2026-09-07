/**
 * @file user.controller.js (Gateway Controller)
 * @description Controller for gateway-level user queries, such as retrieving current session data.
 */

/**
 * Returns the currently authenticated user attached to the request by `isAuth` middleware.
 * 
 * @param {import("express").Request} req - Express request object containing `req.user`
 * @param {import("express").Response} res - Express response object
 * @returns {Promise<import("express").Response>}
 */
export const getCurrentUser = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve user profile"
        });
    }
};
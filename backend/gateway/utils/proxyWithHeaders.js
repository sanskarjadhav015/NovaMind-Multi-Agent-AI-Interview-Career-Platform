/**
 * @file proxyWithHeaders.js (Gateway Utility)
 * @description Configures express-http-proxy with custom request/body decoration.
 * Forwards user metadata (`x-user-id`) to target microservices while ensuring
 * multipart file uploads (resumes) retain raw binary boundaries.
 */

import proxy from "express-http-proxy";

/**
 * Creates an express-http-proxy middleware instance tailored for NovaMind microservices.
 * 
 * @param {string} serviceUrl - Target microservice base URL (e.g. process.env.INTERVIEW_SERVICE_URL)
 * @returns {import("express").RequestHandler} Express proxy middleware handler
 */
export const proxyWithHeaders = (serviceUrl) => {
    return proxy(
        serviceUrl,
        {
            parseReqBody: false,

            proxyReqBodyDecorator: (bodyContent, srcReq) => {
                if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                    return JSON.stringify(srcReq.body);
                }
                return bodyContent;
            },

            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                // Strip any client-supplied identity or internal trust headers
                delete proxyReqOpts.headers["x-user-id"];
                delete proxyReqOpts.headers["x-user_id"];
                delete proxyReqOpts.headers["x-internal-secret"];

                // Inject internal service communication secret
                if (process.env.INTERNAL_SERVICE_SECRET) {
                    proxyReqOpts.headers["x-internal-secret"] = process.env.INTERNAL_SERVICE_SECRET;
                }

                // If body was parsed by Express, recalculate content-length
                if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                    const jsonPayload = JSON.stringify(srcReq.body);
                    proxyReqOpts.headers["content-length"] = Buffer.byteLength(jsonPayload);
                }

                // Propagate correlation / request ID
                if (srcReq.requestId) {
                    proxyReqOpts.headers["x-request-id"] = srcReq.requestId;
                }

                // Inject authenticated user ID verified by Gateway session
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = (srcReq.user.userId || srcReq.user._id || srcReq.user.id).toString();
                }

                return proxyReqOpts;
            },

            proxyErrorHandler: (err, res, next) => {
                console.error(`Proxy Error to ${serviceUrl}:`, err.message);
                if (!res.headersSent) {
                    return res.status(502).json({
                        success: false,
                        message: `Service unavailable: ${err.message}`
                    });
                }
            }
        }
    );
};
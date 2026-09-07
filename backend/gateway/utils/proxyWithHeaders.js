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
            /**
             * Controls whether the proxy middleware parses the incoming request body.
             * Multipart/form-data must NOT be parsed here so that the original stream and boundary
             * remain intact for downstream Multer parsing (e.g. in the Resume service).
             */
            parseReqBody: (srcReq) => {
                const contentType = srcReq.headers["content-type"] || "";
                return !contentType.toLowerCase().includes("multipart/form-data");
            },

            /**
             * Injects authenticated user identification into the proxied request headers.
             */
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId || srcReq.user._id || srcReq.user.id;
                }
                const contentType = srcReq.headers["content-type"] || "";
                if (contentType.toLowerCase().includes("multipart/form-data")) {
                    proxyReqOpts.headers["content-type"] = srcReq.headers["content-type"];
                    if (srcReq.headers["content-length"]) {
                        proxyReqOpts.headers["content-length"] = srcReq.headers["content-length"];
                    }
                }
                return proxyReqOpts;
            },

            /**
             * Decorates or serializes JSON request bodies forwarded to downstream services.
             */
            proxyReqBodyDecorator: (bodyContent, srcReq) => {
                const contentType = srcReq.headers["content-type"] || "";
                if (contentType.toLowerCase().includes("multipart/form-data")) {
                    return bodyContent;
                }
                if (srcReq.body && typeof srcReq.body === "object" && Object.keys(srcReq.body).length > 0) {
                    return JSON.stringify(srcReq.body);
                }
                return bodyContent;
            }
        }
    );
};
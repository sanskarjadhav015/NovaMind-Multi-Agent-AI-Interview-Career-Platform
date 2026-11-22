/**
 * @file requestLogger.js (Shared Middleware)
 * @description Standardized HTTP request logger supporting both formatted terminal
 * output for development and structured JSON output for production log aggregators (e.g. CloudWatch, Datadog).
 * Injects and propagates x-request-id / correlation ID across request lifecycles.
 */

import crypto from "crypto";

export const requestLogger = (serviceName = "Service") => {
    return (req, res, next) => {
        const start = Date.now();

        // Ensure request has a unique correlation ID
        const requestId = req.headers["x-request-id"] || req.headers["x-correlation-id"] || crypto.randomUUID();
        req.requestId = requestId;
        res.setHeader("x-request-id", requestId);

        res.on("finish", () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const userId = req.headers["x-user-id"] || req.headers["x-user_id"] || null;
            const isProduction = process.env.NODE_ENV === "production";

            if (isProduction) {
                // Structured JSON log for production log collectors
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    level: status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO",
                    service: serviceName,
                    requestId,
                    method: req.method,
                    path: req.originalUrl || req.url,
                    status,
                    durationMs: duration,
                    userAgent: req.headers["user-agent"] || "",
                    ip: req.ip || req.socket?.remoteAddress || "",
                    ...(userId ? { userId: `...${String(userId).slice(-6)}` } : {})
                };
                console.log(JSON.stringify(logEntry));
            } else {
                // ANSI terminal colored log for development
                const color = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : status >= 300 ? "\x1b[36m" : "\x1b[32m";
                const reset = "\x1b[0m";
                const userTag = userId ? ` [User: ...${String(userId).slice(-6)}]` : "";
                const reqTag = ` [req: ${requestId.slice(0, 8)}]`;
                console.log(`[${serviceName}] ${req.method} ${req.originalUrl || req.url} -> ${color}${status}${reset} (${duration}ms)${userTag}${reqTag}`);
            }
        });

        next();
    };
};

export default requestLogger;

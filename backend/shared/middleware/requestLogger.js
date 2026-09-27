/**
 * @file requestLogger.js (Shared Middleware)
 * @description Standardized HTTP request logger for terminal visibility.
 * Logs method, route, status code, response time, and originating user.
 */

export const requestLogger = (serviceName = "Service") => {
    return (req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            // ANSI terminal colors: Green for 2xx, Cyan for 3xx, Yellow for 4xx, Red for 5xx
            const color = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : status >= 300 ? "\x1b[36m" : "\x1b[32m";
            const reset = "\x1b[0m";
            const userTag = req.headers["x-user-id"] ? ` [User: ...${req.headers["x-user-id"].slice(-6)}]` : "";
            console.log(`[${serviceName}] ${req.method} ${req.originalUrl || req.url} -> ${color}${status}${reset} (${duration}ms)${userTag}`);
        });
        next();
    };
};
